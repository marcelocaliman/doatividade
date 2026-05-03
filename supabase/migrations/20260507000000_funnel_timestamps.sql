-- Timestamps por estágio do funil de ativação. Permite calcular tempo
-- real de progressão (não mais proxy via created_at) e tempo "parado"
-- na etapa atual. Idempotente.

alter table public.profiles
  add column if not exists funnel_stripe_started_at timestamptz,
  add column if not exists funnel_stripe_completed_at timestamptz,
  add column if not exists funnel_first_draft_at timestamptz,
  add column if not exists funnel_first_published_at timestamptz,
  add column if not exists funnel_first_donation_at timestamptz;

-- Backfill com base no estado atual:
-- - stripe_started_at = quando stripe_account_id foi setado (proxy:
--   updated_at do profile, mas só se tem account_id; se não temos
--   timestamp exato, usa created_at do profile + 1 segundo pra ordenar)
-- - stripe_completed_at = updated_at se charges_enabled=true (aproximado)
-- - first_draft_at, first_published_at = pega da tabela campaigns
-- - first_donation_at = primeira donation succeeded
update public.profiles p
set funnel_stripe_started_at = coalesce(funnel_stripe_started_at, p.updated_at)
where p.stripe_account_id is not null
  and funnel_stripe_started_at is null;

update public.profiles p
set funnel_stripe_completed_at = coalesce(funnel_stripe_completed_at, p.updated_at)
where p.stripe_charges_enabled = true
  and funnel_stripe_completed_at is null;

-- Primeira campanha em qualquer status (proxy pra "começou a criar")
update public.profiles p
set funnel_first_draft_at = coalesce(
  funnel_first_draft_at,
  (
    select min(c.created_at)
    from public.campaigns c
    where c.user_id = p.id
  )
)
where exists (
  select 1 from public.campaigns c where c.user_id = p.id
)
and funnel_first_draft_at is null;

-- Primeira campanha publicada (active/completed)
update public.profiles p
set funnel_first_published_at = coalesce(
  funnel_first_published_at,
  (
    select min(coalesce(c.published_at, c.created_at))
    from public.campaigns c
    where c.user_id = p.id
      and c.status in ('active', 'completed')
  )
)
where exists (
  select 1 from public.campaigns c
  where c.user_id = p.id
    and c.status in ('active', 'completed')
)
and funnel_first_published_at is null;

-- Primeira doação succeeded em qualquer campanha do user
update public.profiles p
set funnel_first_donation_at = coalesce(
  funnel_first_donation_at,
  (
    select min(d.created_at)
    from public.donations d
    join public.campaigns c on c.id = d.campaign_id
    where c.user_id = p.id and d.status = 'succeeded'
  )
)
where exists (
  select 1 from public.donations d
  join public.campaigns c on c.id = d.campaign_id
  where c.user_id = p.id and d.status = 'succeeded'
)
and funnel_first_donation_at is null;

-- Triggers pra manter os timestamps atualizados automaticamente:

-- 1. Quando profile.stripe_account_id passa de null pra valor
create or replace function public.set_funnel_stripe_started()
returns trigger as $$
begin
  if old.stripe_account_id is null and new.stripe_account_id is not null
     and new.funnel_stripe_started_at is null then
    new.funnel_stripe_started_at = now();
  end if;
  if old.stripe_charges_enabled = false and new.stripe_charges_enabled = true
     and new.funnel_stripe_completed_at is null then
    new.funnel_stripe_completed_at = now();
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_funnel_stripe on public.profiles;
create trigger profiles_funnel_stripe
  before update on public.profiles
  for each row execute function public.set_funnel_stripe_started();

-- 2. Quando primeira campanha é criada (any status) ou publicada
create or replace function public.set_funnel_campaign_milestones()
returns trigger as $$
begin
  -- first_draft_at: só seta se ainda não existe pra esse user
  update public.profiles
  set funnel_first_draft_at = now()
  where id = new.user_id and funnel_first_draft_at is null;

  -- first_published_at: quando vira active/completed pela primeira vez
  if new.status in ('active', 'completed') then
    update public.profiles
    set funnel_first_published_at = now()
    where id = new.user_id and funnel_first_published_at is null;
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists campaigns_funnel_milestones_insert on public.campaigns;
create trigger campaigns_funnel_milestones_insert
  after insert on public.campaigns
  for each row execute function public.set_funnel_campaign_milestones();

-- Tb dispara quando uma campanha existing vira active/completed
create or replace function public.set_funnel_campaign_published()
returns trigger as $$
begin
  if new.status in ('active', 'completed')
     and old.status not in ('active', 'completed') then
    update public.profiles
    set funnel_first_published_at = now()
    where id = new.user_id and funnel_first_published_at is null;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists campaigns_funnel_published_update on public.campaigns;
create trigger campaigns_funnel_published_update
  after update of status on public.campaigns
  for each row execute function public.set_funnel_campaign_published();

-- 3. Primeira doação succeeded
create or replace function public.set_funnel_first_donation()
returns trigger as $$
declare
  campaign_user uuid;
begin
  if new.status = 'succeeded' and (old.status is null or old.status != 'succeeded') then
    select user_id into campaign_user
    from public.campaigns where id = new.campaign_id;

    if campaign_user is not null then
      update public.profiles
      set funnel_first_donation_at = now()
      where id = campaign_user and funnel_first_donation_at is null;
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists donations_funnel_first on public.donations;
create trigger donations_funnel_first
  after insert or update of status on public.donations
  for each row execute function public.set_funnel_first_donation();
