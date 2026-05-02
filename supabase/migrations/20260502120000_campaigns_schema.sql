-- Migration: campaigns + campaign_images + storage bucket for banners
-- Idempotent: safe to re-apply.

-- =============================================================================
-- campaigns
-- =============================================================================

create table if not exists public.campaigns (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  user_id uuid references public.profiles(id) on delete cascade not null,

  -- Conteúdo
  title text not null check (char_length(title) <= 80),
  short_description text check (char_length(short_description) <= 200),
  description text,
  banner_url text,
  category text check (category in ('saude', 'educacao', 'animais', 'social', 'emergencia', 'religiao', 'outros')),

  -- Financeiro (centavos)
  goal_amount_cents bigint not null check (goal_amount_cents > 0),
  current_amount_cents bigint default 0 check (current_amount_cents >= 0),
  donor_count int default 0 check (donor_count >= 0),

  -- Configuração
  end_date timestamptz,
  allow_anonymous boolean default true,
  allow_recurring boolean default false,
  allow_messages boolean default true,

  -- Status
  status text check (status in ('draft', 'pending_review', 'active', 'paused', 'completed', 'rejected')) default 'draft',
  rejection_reason text,

  -- Antifraude (placeholders pra fase futura)
  banner_phash text,
  flagged boolean default false,
  flagged_reason text,

  reviewed_at timestamptz,
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_campaigns_status on public.campaigns(status);
create index if not exists idx_campaigns_user on public.campaigns(user_id);
create index if not exists idx_campaigns_slug on public.campaigns(slug);
create index if not exists idx_campaigns_category on public.campaigns(category) where status = 'active';

drop trigger if exists campaigns_updated_at on public.campaigns;
create trigger campaigns_updated_at
  before update on public.campaigns
  for each row execute function public.set_updated_at();

-- =============================================================================
-- campaign_images (galeria adicional, ainda não usada nesta fase)
-- =============================================================================

create table if not exists public.campaign_images (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid references public.campaigns(id) on delete cascade not null,
  url text not null,
  caption text,
  sort_order int default 0,
  created_at timestamptz default now()
);

create index if not exists idx_campaign_images_campaign
  on public.campaign_images(campaign_id, sort_order);

-- =============================================================================
-- RLS
-- =============================================================================

alter table public.campaigns enable row level security;
alter table public.campaign_images enable row level security;

-- campaigns: público lê active/completed
drop policy if exists "Public can read active campaigns" on public.campaigns;
create policy "Public can read active campaigns"
  on public.campaigns for select
  using (status in ('active', 'completed'));

-- campaigns: dono lê todas as próprias (incluindo drafts)
drop policy if exists "Users can read own campaigns" on public.campaigns;
create policy "Users can read own campaigns"
  on public.campaigns for select
  using (auth.uid() = user_id);

-- campaigns: dono cria
drop policy if exists "Users can create own campaigns" on public.campaigns;
create policy "Users can create own campaigns"
  on public.campaigns for insert
  with check (auth.uid() = user_id);

-- campaigns: dono atualiza próprias
drop policy if exists "Users can update own campaigns" on public.campaigns;
create policy "Users can update own campaigns"
  on public.campaigns for update
  using (auth.uid() = user_id);

-- campaigns: dono deleta drafts próprios
drop policy if exists "Users can delete own draft campaigns" on public.campaigns;
create policy "Users can delete own draft campaigns"
  on public.campaigns for delete
  using (auth.uid() = user_id and status = 'draft');

-- campaign_images: público lê de campanhas active/completed
drop policy if exists "Public can read images of active campaigns" on public.campaign_images;
create policy "Public can read images of active campaigns"
  on public.campaign_images for select
  using (
    exists (
      select 1 from public.campaigns
      where campaigns.id = campaign_images.campaign_id
      and campaigns.status in ('active', 'completed')
    )
  );

-- campaign_images: dono gerencia próprias
drop policy if exists "Users manage own campaign images" on public.campaign_images;
create policy "Users manage own campaign images"
  on public.campaign_images for all
  using (
    exists (
      select 1 from public.campaigns
      where campaigns.id = campaign_images.campaign_id
      and campaigns.user_id = auth.uid()
    )
  );

-- =============================================================================
-- Storage bucket: campaign-banners
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'campaign-banners',
  'campaign-banners',
  true,
  5242880, -- 5MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Storage policies: leitura pública, escrita do próprio usuário (na pasta do uid)
drop policy if exists "Public can read campaign banners" on storage.objects;
create policy "Public can read campaign banners"
  on storage.objects for select
  using (bucket_id = 'campaign-banners');

drop policy if exists "Users upload to own banner folder" on storage.objects;
create policy "Users upload to own banner folder"
  on storage.objects for insert
  with check (
    bucket_id = 'campaign-banners'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users update own banners" on storage.objects;
create policy "Users update own banners"
  on storage.objects for update
  using (
    bucket_id = 'campaign-banners'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users delete own banners" on storage.objects;
create policy "Users delete own banners"
  on storage.objects for delete
  using (
    bucket_id = 'campaign-banners'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
