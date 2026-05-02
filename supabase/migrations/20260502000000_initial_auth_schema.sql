-- Migration: initial auth schema (profiles + handle_new_user trigger + RLS)
-- Idempotente: pode ser reaplicada sem erro.

create extension if not exists "uuid-ossp";

-- =============================================================================
-- profiles
-- =============================================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,

  -- Tipo de conta
  account_type text check (account_type in ('individual', 'organization')) default 'individual',
  organization_name text,
  organization_cnpj text,

  -- Stripe Connect
  stripe_account_id text unique,
  stripe_charges_enabled boolean default false,
  stripe_payouts_enabled boolean default false,
  stripe_details_submitted boolean default false,

  -- Verificação
  email_verified boolean default false,
  phone text,
  phone_verified boolean default false,

  -- Estatísticas (mantidas via trigger)
  total_raised_cents bigint default 0,
  campaign_count int default 0,

  -- Trust score (futuro antifraude)
  trust_score int default 50,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_profiles_stripe_account
  on public.profiles(stripe_account_id);

-- =============================================================================
-- Trigger: set_updated_at
-- =============================================================================

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- =============================================================================
-- Trigger: handle_new_user
-- Cria registro em public.profiles automaticamente após signup em auth.users.
-- =============================================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, email_verified)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name'
    ),
    new.raw_user_meta_data->>'avatar_url',
    new.email_confirmed_at is not null
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- RLS
-- =============================================================================

alter table public.profiles enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);
