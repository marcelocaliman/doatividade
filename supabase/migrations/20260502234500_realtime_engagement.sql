-- Migration: Fase C — engagement + realtime
-- - campaign_updates (timeline de novidades)
-- - favorites (doador favorita campanha)
-- - update_email_log (rate limit de email por doação)
-- - habilita realtime em campaigns e donations
-- Idempotente.

-- =============================================================================
-- campaign_updates
-- =============================================================================

create table if not exists public.campaign_updates (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid references public.campaigns(id) on delete cascade not null,
  title text,
  content text not null,
  image_url text,
  created_at timestamptz default now()
);

create index if not exists idx_campaign_updates_campaign
  on public.campaign_updates(campaign_id, created_at desc);

alter table public.campaign_updates enable row level security;

drop policy if exists "Public can read updates of active campaigns" on public.campaign_updates;
create policy "Public can read updates of active campaigns"
  on public.campaign_updates for select
  using (
    exists (
      select 1 from public.campaigns
      where campaigns.id = campaign_updates.campaign_id
        and campaigns.status in ('active', 'completed')
    )
  );

drop policy if exists "Owner reads own updates" on public.campaign_updates;
create policy "Owner reads own updates"
  on public.campaign_updates for select
  using (
    exists (
      select 1 from public.campaigns
      where campaigns.id = campaign_updates.campaign_id
        and campaigns.user_id = auth.uid()
    )
  );

drop policy if exists "Owner manages own updates" on public.campaign_updates;
create policy "Owner manages own updates"
  on public.campaign_updates for all
  using (
    exists (
      select 1 from public.campaigns
      where campaigns.id = campaign_updates.campaign_id
        and campaigns.user_id = auth.uid()
    )
  );

-- =============================================================================
-- favorites
-- =============================================================================

create table if not exists public.favorites (
  user_id uuid references auth.users(id) on delete cascade not null,
  campaign_id uuid references public.campaigns(id) on delete cascade not null,
  created_at timestamptz default now(),
  primary key (user_id, campaign_id)
);

create index if not exists idx_favorites_user
  on public.favorites(user_id, created_at desc);

alter table public.favorites enable row level security;

drop policy if exists "User reads own favorites" on public.favorites;
create policy "User reads own favorites"
  on public.favorites for select
  using (auth.uid() = user_id);

drop policy if exists "User manages own favorites" on public.favorites;
create policy "User manages own favorites"
  on public.favorites for all
  using (auth.uid() = user_id);

-- =============================================================================
-- update_email_log: dedup de email "nova update" por doador/campanha/dia
-- =============================================================================

create table if not exists public.update_email_log (
  id bigserial primary key,
  campaign_id uuid not null,
  donor_email text not null,
  sent_on date not null default current_date
);

create unique index if not exists uniq_update_email_log
  on public.update_email_log(campaign_id, donor_email, sent_on);

alter table public.update_email_log enable row level security;
-- Sem policies: só service-role escreve/lê.

-- =============================================================================
-- Realtime: habilita replicação nas tabelas chave
-- =============================================================================

-- Cria publication se não existir (Supabase já tem 'supabase_realtime' default)
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

-- Adiciona tabelas à publication; ignora se já estão lá
do $$
begin
  begin
    alter publication supabase_realtime add table public.donations;
  exception when duplicate_object then null; end;
  begin
    alter publication supabase_realtime add table public.campaigns;
  exception when duplicate_object then null; end;
  begin
    alter publication supabase_realtime add table public.campaign_updates;
  exception when duplicate_object then null; end;
end $$;
