-- Notificações in-app pro super admin. Cobertura ampla: tudo que muda
-- de estado relevante no app gera uma row aqui (broadcast — todos os
-- admins veem o mesmo feed), e cada admin marca leitura individual
-- via tabela auxiliar `admin_notification_reads`.
--
-- Fonte dos eventos: triggers SQL (signup, campanha, doação,
-- subscription, report) + helper `notifyAdmins()` chamado de webhooks
-- Stripe e server actions.

-- Mirror de admins no banco. Allowlist principal continua via
-- env (ADMIN_EMAILS), mas precisa-se da mesma info em SQL pra RLS
-- e pro realtime do client funcionarem. Sync acontece no helper
-- requireAdmin/checkAdmin (upsert idempotente).
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  added_at timestamptz default now() not null
);

create or replace function public.is_admin(uid uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.admin_users where user_id = uid);
$$;

create table if not exists public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  -- Tipo do evento — sem check constraint pra evitar acoplamento, app
  -- valida e exibe label/ícone com base num map TS.
  type text not null,
  severity text not null check (severity in ('info', 'success', 'warning', 'critical')),
  title text not null,
  body text,
  href text,
  -- Refs opcionais pra contexto + dedup
  campaign_id uuid references public.campaigns(id) on delete set null,
  donation_id uuid references public.donations(id) on delete set null,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  user_id uuid references public.profiles(id) on delete set null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_notifications_created_idx
  on public.admin_notifications (created_at desc);
create index if not exists admin_notifications_severity_idx
  on public.admin_notifications (severity, created_at desc);
create index if not exists admin_notifications_type_idx
  on public.admin_notifications (type, created_at desc);

-- Lido individual por admin
create table if not exists public.admin_notification_reads (
  notification_id uuid not null references public.admin_notifications(id) on delete cascade,
  admin_user_id uuid not null references auth.users(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (notification_id, admin_user_id)
);

-- RLS: só admins
alter table public.admin_users enable row level security;
alter table public.admin_notifications enable row level security;
alter table public.admin_notification_reads enable row level security;

drop policy if exists "admins read admin_users" on public.admin_users;
create policy "admins read admin_users" on public.admin_users
  for select using (public.is_admin(auth.uid()));

drop policy if exists "admins read notifications" on public.admin_notifications;
create policy "admins read notifications" on public.admin_notifications
  for select using (public.is_admin(auth.uid()));

drop policy if exists "admins manage own reads" on public.admin_notification_reads;
create policy "admins manage own reads" on public.admin_notification_reads
  for all
  using (admin_user_id = auth.uid() and public.is_admin(auth.uid()))
  with check (admin_user_id = auth.uid() and public.is_admin(auth.uid()));

-- Realtime
alter publication supabase_realtime add table public.admin_notifications;
alter publication supabase_realtime add table public.admin_notification_reads;

-- ─────────────────────────────────────────────────────────────────────
-- Triggers SQL — eventos do banco viram notificações automaticamente
-- ─────────────────────────────────────────────────────────────────────

-- 1) Novo usuário cadastrado
create or replace function public.notify_admin_on_new_profile()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_label text;
begin
  v_label := coalesce(nullif(trim(new.full_name), ''), new.email, 'sem nome');
  insert into public.admin_notifications (type, severity, title, body, href, user_id)
  values (
    'user_signed_up',
    'info',
    'Novo usuário cadastrado',
    v_label || ' criou conta agora.',
    '/admin/usuarios',
    new.id
  );
  return new;
end;
$$;

drop trigger if exists admin_notify_new_profile on public.profiles;
create trigger admin_notify_new_profile
  after insert on public.profiles
  for each row execute function public.notify_admin_on_new_profile();

-- 2) Campanha — pending_review / published / paused / completed
create or replace function public.notify_admin_on_campaign_change()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_creator text;
begin
  select coalesce(nullif(trim(p.full_name), ''), p.email, 'usuário')
    into v_creator
    from public.profiles p where p.id = new.user_id;

  -- Submetida pra revisão
  if (TG_OP = 'INSERT' and new.status = 'pending_review')
     or (TG_OP = 'UPDATE' and new.status = 'pending_review' and old.status is distinct from 'pending_review') then
    insert into public.admin_notifications (type, severity, title, body, href, campaign_id, user_id)
    values (
      'campaign_pending_review',
      'warning',
      'Campanha aguardando revisão',
      coalesce(v_creator, 'Usuário') || ' submeteu "' || new.title || '"',
      '/admin/campanhas',
      new.id, new.user_id
    );
  end if;

  -- Publicada (auto ou manual)
  if TG_OP = 'UPDATE' and new.status = 'published' and old.status is distinct from 'published' then
    insert into public.admin_notifications (type, severity, title, body, href, campaign_id, user_id)
    values (
      'campaign_published',
      'info',
      'Campanha publicada',
      '"' || new.title || '" entrou no ar.',
      '/c/' || new.slug,
      new.id, new.user_id
    );
  end if;

  -- Pausada
  if TG_OP = 'UPDATE' and new.status = 'paused' and old.status is distinct from 'paused' then
    insert into public.admin_notifications (type, severity, title, body, href, campaign_id, user_id)
    values (
      'campaign_paused',
      'warning',
      'Campanha pausada',
      '"' || new.title || '" foi pausada.',
      '/admin/campanhas',
      new.id, new.user_id
    );
  end if;

  -- Suspensa pelo admin
  if TG_OP = 'UPDATE' and new.status = 'suspended' and old.status is distinct from 'suspended' then
    insert into public.admin_notifications (type, severity, title, body, href, campaign_id, user_id)
    values (
      'campaign_suspended',
      'critical',
      'Campanha suspensa',
      '"' || new.title || '" foi suspensa.',
      '/admin/campanhas',
      new.id, new.user_id
    );
  end if;

  -- Encerrada (completed)
  if TG_OP = 'UPDATE' and new.status = 'completed' and old.status is distinct from 'completed' then
    insert into public.admin_notifications (type, severity, title, body, href, campaign_id, user_id)
    values (
      'campaign_completed',
      'success',
      'Campanha encerrada',
      '"' || new.title || '" foi finalizada.',
      '/c/' || new.slug,
      new.id, new.user_id
    );
  end if;

  return new;
end;
$$;

drop trigger if exists admin_notify_campaign on public.campaigns;
create trigger admin_notify_campaign
  after insert or update on public.campaigns
  for each row execute function public.notify_admin_on_campaign_change();

-- 3) Doações — succeeded / failed / refunded / disputed
create or replace function public.notify_admin_on_donation()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_camp_title text;
  v_amount text;
  v_method text;
begin
  -- Só dispara em mudança real de status, evita ruído de updates parciais
  if not (TG_OP = 'INSERT'
          or (TG_OP = 'UPDATE' and old.status is distinct from new.status)) then
    return new;
  end if;

  select title into v_camp_title from public.campaigns where id = new.campaign_id;
  v_amount := 'R$ ' || to_char(new.amount_cents::numeric / 100, 'FM999G990D00');
  v_method := coalesce(new.payment_method, 'desconhecido');

  if new.status = 'succeeded' then
    insert into public.admin_notifications (type, severity, title, body, href, campaign_id, donation_id)
    values (
      'donation_succeeded',
      case when new.amount_cents >= 50000 then 'success' else 'info' end,
      'Doação ' || v_amount,
      'Em "' || coalesce(v_camp_title, 'campanha') || '" via ' || v_method || '.',
      '/admin/campanhas',
      new.campaign_id, new.id
    );
  elsif new.status = 'failed' then
    insert into public.admin_notifications (type, severity, title, body, href, campaign_id, donation_id)
    values (
      'donation_failed',
      'warning',
      'Doação falhou: ' || v_amount,
      'Em "' || coalesce(v_camp_title, 'campanha') || '"' ||
        case when new.failure_reason is not null then ' · ' || new.failure_reason else '' end,
      '/admin/campanhas',
      new.campaign_id, new.id
    );
  elsif new.status = 'refunded' then
    insert into public.admin_notifications (type, severity, title, body, href, campaign_id, donation_id)
    values (
      'donation_refunded',
      'warning',
      'Doação reembolsada: ' || v_amount,
      'Em "' || coalesce(v_camp_title, 'campanha') || '".',
      '/admin/campanhas',
      new.campaign_id, new.id
    );
  elsif new.status = 'disputed' then
    insert into public.admin_notifications (type, severity, title, body, href, campaign_id, donation_id)
    values (
      'donation_disputed',
      'critical',
      'CHARGEBACK aberto: ' || v_amount,
      'Em "' || coalesce(v_camp_title, 'campanha') || '". Verificar Stripe.',
      '/admin/campanhas',
      new.campaign_id, new.id
    );
  end if;

  return new;
end;
$$;

drop trigger if exists admin_notify_donation on public.donations;
create trigger admin_notify_donation
  after insert or update on public.donations
  for each row execute function public.notify_admin_on_donation();

-- 4) Subscriptions — created (active) / canceled / past_due
create or replace function public.notify_admin_on_subscription()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_camp_title text;
  v_amount text;
begin
  select title into v_camp_title from public.campaigns where id = new.campaign_id;
  v_amount := 'R$ ' || to_char(new.amount_cents::numeric / 100, 'FM999G990D00') || '/mês';

  if (TG_OP = 'INSERT' and new.status = 'active')
     or (TG_OP = 'UPDATE' and new.status = 'active' and old.status is distinct from 'active') then
    insert into public.admin_notifications (type, severity, title, body, href, campaign_id, subscription_id)
    values (
      'subscription_started',
      'success',
      'Nova assinatura mensal',
      v_amount || ' em "' || coalesce(v_camp_title, 'campanha') || '".',
      '/admin/campanhas',
      new.campaign_id, new.id
    );
  end if;

  if TG_OP = 'UPDATE' and new.status = 'canceled' and old.status is distinct from 'canceled' then
    insert into public.admin_notifications (type, severity, title, body, href, campaign_id, subscription_id)
    values (
      'subscription_canceled',
      'warning',
      'Assinatura cancelada',
      v_amount || ' em "' || coalesce(v_camp_title, 'campanha') || '" foi cancelada.',
      '/admin/campanhas',
      new.campaign_id, new.id
    );
  end if;

  if TG_OP = 'UPDATE' and new.status = 'past_due' and old.status is distinct from 'past_due' then
    insert into public.admin_notifications (type, severity, title, body, href, campaign_id, subscription_id)
    values (
      'subscription_past_due',
      'warning',
      'Assinatura com pagamento atrasado',
      v_amount || ' em "' || coalesce(v_camp_title, 'campanha') || '" — Stripe vai retentar.',
      '/admin/campanhas',
      new.campaign_id, new.id
    );
  end if;

  return new;
end;
$$;

drop trigger if exists admin_notify_subscription on public.subscriptions;
create trigger admin_notify_subscription
  after insert or update on public.subscriptions
  for each row execute function public.notify_admin_on_subscription();

-- 5) Reports / denúncias
create or replace function public.notify_admin_on_report()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_camp_title text;
begin
  select title into v_camp_title from public.campaigns where id = new.campaign_id;
  insert into public.admin_notifications (type, severity, title, body, href, campaign_id)
  values (
    'report_received',
    'warning',
    'Nova denúncia',
    'Em "' || coalesce(v_camp_title, 'campanha') || '" · motivo: ' || new.reason,
    '/admin/denuncias',
    new.campaign_id
  );
  return new;
end;
$$;

drop trigger if exists admin_notify_report on public.reports;
create trigger admin_notify_report
  after insert on public.reports
  for each row execute function public.notify_admin_on_report();
