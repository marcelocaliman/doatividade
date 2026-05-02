-- Notificações in-app pro criador (e admin no futuro). Disparadas por
-- triggers ou pelo backend quando eventos relevantes acontecem (nova
-- doação, meta atingida, campanha encerrando, etc).
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  -- tipo da notificação pra o app decidir ícone/cor/cta
  type text not null check (type in (
    'donation_received',
    'goal_reached',
    'milestone_50',
    'campaign_ending_soon',
    'campaign_completed',
    'campaign_paused',
    'kyc_required',
    'payout_paid',
    'payout_failed',
    'system'
  )),
  -- título curto + corpo opcional (ex: "Você recebeu R$ 50")
  title text not null,
  body text,
  -- link interno pra onde mandar o user quando clicar
  href text,
  -- contexto pra ícone/dedup (ex: campaign_id, donation_id)
  campaign_id uuid references public.campaigns(id) on delete cascade,
  donation_id uuid references public.donations(id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz default now() not null
);

create index if not exists notifications_user_unread_idx
  on public.notifications (user_id, read_at, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "Users read own notifications" on public.notifications;
create policy "Users read own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

drop policy if exists "Users update own notifications" on public.notifications;
create policy "Users update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

drop policy if exists "Users delete own notifications" on public.notifications;
create policy "Users delete own notifications"
  on public.notifications for delete
  using (auth.uid() = user_id);

-- Realtime pra notificações aparecerem na sininho sem refresh
alter publication supabase_realtime add table public.notifications;

-- Trigger: ao gravar uma doação succeeded, dispara notificação pro
-- criador da campanha. Idempotente via unique(user_id, donation_id, type).
create unique index if not exists notifications_donation_unique
  on public.notifications (user_id, donation_id, type)
  where donation_id is not null;

create or replace function public.notify_creator_on_donation()
returns trigger as $$
declare
  v_creator_id uuid;
  v_campaign_title text;
  v_campaign_slug text;
  v_donor text;
  v_old_total bigint;
  v_new_total bigint;
  v_goal bigint;
begin
  if new.status = 'succeeded'
    and (old is null or old.status is null or old.status != 'succeeded') then

    select user_id, title, slug, current_amount_cents, goal_amount_cents
      into v_creator_id, v_campaign_title, v_campaign_slug, v_new_total, v_goal
      from public.campaigns where id = new.campaign_id;

    if v_creator_id is null then return new; end if;

    -- O trigger update_campaign_stats roda DEPOIS deste, então
    -- v_new_total ainda não inclui esta doação. Some manualmente.
    v_old_total := v_new_total;
    v_new_total := v_old_total + new.amount_cents;

    v_donor := case
      when new.is_anonymous or new.donor_name is null then 'Anônimo'
      else new.donor_name
    end;

    insert into public.notifications (user_id, type, title, body, href, campaign_id, donation_id)
    values (
      v_creator_id,
      'donation_received',
      'Nova doação: R$ ' || to_char(new.amount_cents::numeric / 100, 'FM999G990D00'),
      v_donor || ' acabou de doar pra ' || v_campaign_title,
      '/c/' || v_campaign_slug,
      new.campaign_id,
      new.id
    )
    on conflict do nothing;

    -- Marco de 50%
    if v_goal > 0
      and v_old_total < (v_goal / 2)
      and v_new_total >= (v_goal / 2)
      and v_new_total < v_goal then
      insert into public.notifications (user_id, type, title, body, href, campaign_id)
      values (
        v_creator_id,
        'milestone_50',
        '50% da meta atingida 🎯',
        v_campaign_title || ' já passou da metade.',
        '/c/' || v_campaign_slug,
        new.campaign_id
      );
    end if;

    -- Meta batida
    if v_goal > 0 and v_old_total < v_goal and v_new_total >= v_goal then
      insert into public.notifications (user_id, type, title, body, href, campaign_id)
      values (
        v_creator_id,
        'goal_reached',
        'Meta atingida! 🎉',
        v_campaign_title || ' bateu a meta de R$ ' ||
          to_char(v_goal::numeric / 100, 'FM999G990D00'),
        '/c/' || v_campaign_slug,
        new.campaign_id
      );
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists notify_creator_on_donation_trigger on public.donations;
create trigger notify_creator_on_donation_trigger
  after insert or update on public.donations
  for each row execute function public.notify_creator_on_donation();
