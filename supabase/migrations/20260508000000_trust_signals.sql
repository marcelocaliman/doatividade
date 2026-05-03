-- Trust score reativo + auditável (Opções B + C combinadas).
--
-- Filosofia: todo user nasce com 100 (confiável por padrão). Eventos
-- negativos REDUZEM o score automaticamente via triggers. Eventos
-- positivos podem aumentar pontualmente. Score é a SOMA dos signals
-- (não um número solto) — completamente auditável.
--
-- Idempotente.

-- 1. Default 100 (era 50)
alter table public.profiles
  alter column trust_score set default 100;

-- Backfill: users que ainda têm o valor padrão antigo (50) sobem pra 100.
-- Quem foi ajustado manualmente (qualquer outro valor) fica como está.
update public.profiles set trust_score = 100 where trust_score = 50;

-- 2. Tabela de signals (linha do tempo de cada ajuste de score)
create table if not exists public.trust_signals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  signal text not null,
  delta int not null,
  reason text not null,
  metadata jsonb,
  created_at timestamptz default now() not null
);

create index if not exists idx_trust_signals_user
  on public.trust_signals(user_id, created_at desc);
create index if not exists idx_trust_signals_signal
  on public.trust_signals(signal, created_at desc);

alter table public.trust_signals enable row level security;
-- Sem policies: só service_role acessa.

-- 3. Função que recalcula trust_score como base 100 + sum(deltas), cap [0, 100]
create or replace function public.recalculate_trust_score(target_user_id uuid)
returns void as $$
declare
  total_delta int;
  new_score int;
begin
  select coalesce(sum(delta), 0) into total_delta
  from public.trust_signals
  where user_id = target_user_id;

  new_score := greatest(0, least(100, 100 + total_delta));

  update public.profiles set trust_score = new_score where id = target_user_id;
end;
$$ language plpgsql security definer;

-- 4. Trigger no trust_signals que recalcula automaticamente
create or replace function public.trigger_recalculate_trust()
returns trigger as $$
begin
  perform public.recalculate_trust_score(new.user_id);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trust_signals_recalculate on public.trust_signals;
create trigger trust_signals_recalculate
  after insert or delete on public.trust_signals
  for each row execute function public.trigger_recalculate_trust();

-- =====================================================================
-- Triggers que INSEREM signals automaticamente nos eventos do app
-- =====================================================================

-- 5a. Denúncia com ação tomada → −30
create or replace function public.trust_on_report_action()
returns trigger as $$
declare
  campaign_user uuid;
begin
  if new.status = 'action_taken'
     and (old.status is null or old.status != 'action_taken') then

    select user_id into campaign_user
    from public.campaigns where id = new.campaign_id;

    if campaign_user is not null then
      insert into public.trust_signals (user_id, signal, delta, reason, metadata)
      values (
        campaign_user,
        'report_action_taken',
        -30,
        'Denúncia confirmada com ação',
        jsonb_build_object('report_id', new.id, 'reason', new.reason)
      );
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trust_on_report_action_trg on public.reports;
create trigger trust_on_report_action_trg
  after insert or update of status on public.reports
  for each row execute function public.trust_on_report_action();

-- 5b. Campanha rejeitada → −20 (uma vez só por campanha, dedup via signal)
create or replace function public.trust_on_campaign_rejected()
returns trigger as $$
begin
  if new.status = 'rejected'
     and (old.status is null or old.status != 'rejected') then

    -- Dedup: não duplicar se já existe signal pra mesma campanha
    if not exists (
      select 1 from public.trust_signals
      where user_id = new.user_id
        and signal = 'campaign_rejected'
        and metadata->>'campaign_id' = new.id::text
    ) then
      insert into public.trust_signals (user_id, signal, delta, reason, metadata)
      values (
        new.user_id,
        'campaign_rejected',
        -20,
        'Campanha rejeitada na moderação',
        jsonb_build_object('campaign_id', new.id, 'campaign_title', new.title)
      );
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trust_on_campaign_rejected_trg on public.campaigns;
create trigger trust_on_campaign_rejected_trg
  after insert or update of status on public.campaigns
  for each row execute function public.trust_on_campaign_rejected();

-- 5c. Campanha marcada como duplicada → −10 (dedup)
create or replace function public.trust_on_campaign_flagged()
returns trigger as $$
begin
  if new.flagged_duplicate = true
     and (old.flagged_duplicate is null or old.flagged_duplicate = false) then

    if not exists (
      select 1 from public.trust_signals
      where user_id = new.user_id
        and signal = 'campaign_flagged_duplicate'
        and metadata->>'campaign_id' = new.id::text
    ) then
      insert into public.trust_signals (user_id, signal, delta, reason, metadata)
      values (
        new.user_id,
        'campaign_flagged_duplicate',
        -10,
        'Campanha marcada como duplicada',
        jsonb_build_object('campaign_id', new.id, 'campaign_title', new.title)
      );
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trust_on_campaign_flagged_trg on public.campaigns;
create trigger trust_on_campaign_flagged_trg
  after insert or update of flagged_duplicate on public.campaigns
  for each row execute function public.trust_on_campaign_flagged();

-- 5d. Doação refunded → −15 (uma vez por donation)
create or replace function public.trust_on_donation_refunded()
returns trigger as $$
declare
  campaign_user uuid;
begin
  if new.status = 'refunded'
     and (old.status is null or old.status != 'refunded') then

    select user_id into campaign_user
    from public.campaigns where id = new.campaign_id;

    if campaign_user is not null then
      if not exists (
        select 1 from public.trust_signals
        where user_id = campaign_user
          and signal = 'donation_refunded'
          and metadata->>'donation_id' = new.id::text
      ) then
        insert into public.trust_signals (user_id, signal, delta, reason, metadata)
        values (
          campaign_user,
          'donation_refunded',
          -15,
          'Doação reembolsada (chargeback ou estorno)',
          jsonb_build_object('donation_id', new.id, 'amount_cents', new.amount_cents)
        );
      end if;
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trust_on_donation_refunded_trg on public.donations;
create trigger trust_on_donation_refunded_trg
  after update of status on public.donations
  for each row execute function public.trust_on_donation_refunded();

-- 5e. Stripe completo → +5 (uma vez)
create or replace function public.trust_on_stripe_completed()
returns trigger as $$
begin
  if old.stripe_charges_enabled = false
     and new.stripe_charges_enabled = true then

    if not exists (
      select 1 from public.trust_signals
      where user_id = new.id and signal = 'stripe_completed'
    ) then
      insert into public.trust_signals (user_id, signal, delta, reason)
      values (
        new.id,
        'stripe_completed',
        5,
        'KYC validado pela Stripe (recebimento ativo)'
      );
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trust_on_stripe_completed_trg on public.profiles;
create trigger trust_on_stripe_completed_trg
  after update of stripe_charges_enabled on public.profiles
  for each row execute function public.trust_on_stripe_completed();

-- 5f. Primeira doação succeeded → +5 (uma vez)
create or replace function public.trust_on_first_donation()
returns trigger as $$
declare
  campaign_user uuid;
  already_has boolean;
begin
  if new.status = 'succeeded'
     and (old.status is null or old.status != 'succeeded') then

    select user_id into campaign_user
    from public.campaigns where id = new.campaign_id;

    if campaign_user is not null then
      select exists(
        select 1 from public.trust_signals
        where user_id = campaign_user and signal = 'first_donation_received'
      ) into already_has;

      if not already_has then
        insert into public.trust_signals (user_id, signal, delta, reason, metadata)
        values (
          campaign_user,
          'first_donation_received',
          5,
          'Primeira doação succeeded recebida',
          jsonb_build_object('donation_id', new.id, 'amount_cents', new.amount_cents)
        );
      end if;
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trust_on_first_donation_trg on public.donations;
create trigger trust_on_first_donation_trg
  after insert or update of status on public.donations
  for each row execute function public.trust_on_first_donation();
