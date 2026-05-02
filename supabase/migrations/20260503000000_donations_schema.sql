-- Migration: donations + donations_public view + update_campaign_stats trigger
-- Idempotente.

-- =============================================================================
-- donations
-- =============================================================================

create table if not exists public.donations (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid references public.campaigns(id) on delete cascade not null,

  -- Doador (sem cadastro obrigatório)
  donor_name text,
  donor_email text,
  donor_message text check (char_length(donor_message) <= 500),
  is_anonymous boolean default false,

  -- Valores (centavos)
  amount_cents bigint not null check (amount_cents > 0),
  application_fee_cents bigint not null check (application_fee_cents >= 0),
  stripe_fee_cents bigint check (stripe_fee_cents >= 0),
  donor_covered_fees boolean default false,
  net_to_creator_cents bigint,

  -- Pagamento
  payment_method text check (payment_method in ('card', 'pix', 'boleto')),
  stripe_payment_intent_id text unique not null,
  stripe_charge_id text,

  -- Status
  status text check (status in ('pending', 'succeeded', 'failed', 'refunded', 'disputed')) default 'pending',
  failure_reason text,
  refunded_at timestamptz,
  disputed_at timestamptz,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_donations_campaign
  on public.donations(campaign_id, status, created_at desc);
create index if not exists idx_donations_pi
  on public.donations(stripe_payment_intent_id);
create index if not exists idx_donations_status
  on public.donations(status);

drop trigger if exists donations_updated_at on public.donations;
create trigger donations_updated_at
  before update on public.donations
  for each row execute function public.set_updated_at();

-- =============================================================================
-- View pública (sem expor email/dados sensíveis)
-- =============================================================================

create or replace view public.donations_public as
select
  d.id,
  d.campaign_id,
  case when d.is_anonymous then 'Anônimo' else d.donor_name end as display_name,
  case when d.is_anonymous then null else d.donor_message end as donor_message,
  d.amount_cents,
  d.net_to_creator_cents,
  d.payment_method,
  d.created_at
from public.donations d
where d.status = 'succeeded';

-- A view herda RLS do owner (postgres). Pra leitura pública, basta GRANT.
grant select on public.donations_public to anon, authenticated;

-- =============================================================================
-- Trigger: atualiza contadores da campanha quando doação confirma/reverte
-- =============================================================================

create or replace function public.update_campaign_stats()
returns trigger as $$
begin
  if new.status = 'succeeded'
    and (old.status is null or old.status != 'succeeded') then
    update public.campaigns
    set current_amount_cents = current_amount_cents + new.amount_cents,
        donor_count = donor_count + 1,
        updated_at = now()
    where id = new.campaign_id;

    update public.profiles
    set total_raised_cents = total_raised_cents + new.amount_cents,
        updated_at = now()
    where id = (
      select user_id from public.campaigns where id = new.campaign_id
    );
  end if;

  -- Reverte se virou refunded depois de ter sido succeeded
  if new.status = 'refunded' and old.status = 'succeeded' then
    update public.campaigns
    set current_amount_cents = greatest(0, current_amount_cents - new.amount_cents),
        donor_count = greatest(0, donor_count - 1),
        updated_at = now()
    where id = new.campaign_id;

    update public.profiles
    set total_raised_cents = greatest(0, total_raised_cents - new.amount_cents),
        updated_at = now()
    where id = (
      select user_id from public.campaigns where id = new.campaign_id
    );
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists donation_stats_trigger on public.donations;
create trigger donation_stats_trigger
  after insert or update on public.donations
  for each row execute function public.update_campaign_stats();

-- =============================================================================
-- RLS
-- =============================================================================

alter table public.donations enable row level security;

-- Acesso direto à tabela: só dono da campanha vê suas doações.
drop policy if exists "Campaign owners can read donations" on public.donations;
create policy "Campaign owners can read donations"
  on public.donations for select
  using (
    exists (
      select 1 from public.campaigns
      where campaigns.id = donations.campaign_id
        and campaigns.user_id = auth.uid()
    )
  );

-- Inserts/updates só via service_role (webhook bypassa RLS).
