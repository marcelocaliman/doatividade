-- Migration: antifraude mínimo (Fase B)
-- Idempotente.

-- =============================================================================
-- reports — denúncias de campanhas
-- =============================================================================

create table if not exists public.reports (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid references public.campaigns(id) on delete cascade not null,
  reporter_email text,
  reporter_user_id uuid references public.profiles(id) on delete set null,
  reporter_ip text,
  reason text not null check (reason in ('fraud', 'inappropriate', 'illegal', 'spam', 'other')),
  details text,
  status text check (status in ('pending', 'reviewed', 'dismissed', 'action_taken')) default 'pending',
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_reports_campaign on public.reports(campaign_id);
create index if not exists idx_reports_status on public.reports(status, created_at);
create index if not exists idx_reports_ip_created
  on public.reports(reporter_ip, created_at desc)
  where reporter_ip is not null;

-- =============================================================================
-- campaigns: flagged_duplicate
-- =============================================================================

alter table public.campaigns
  add column if not exists flagged_duplicate boolean default false;

create index if not exists idx_campaigns_pending_review
  on public.campaigns(reviewed_at, status)
  where status = 'pending_review';

-- =============================================================================
-- RLS: reports
-- =============================================================================

alter table public.reports enable row level security;

-- Qualquer um (mesmo anônimo) pode criar denúncia
drop policy if exists "Anyone can create reports" on public.reports;
create policy "Anyone can create reports"
  on public.reports for insert
  with check (true);

-- Reports são lidos só pelo service_role.

-- =============================================================================
-- profiles: sincronizar email_verified com auth.users
-- =============================================================================

update public.profiles p
set email_verified = (au.email_confirmed_at is not null)
from auth.users au
where p.id = au.id
  and p.email_verified is distinct from (au.email_confirmed_at is not null);
