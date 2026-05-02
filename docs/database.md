# Database — Schema Completo

Postgres rodando no Supabase. Todas as tabelas têm RLS habilitado.

## Convenções

- IDs são `uuid` gerados via `uuid_generate_v4()`
- Money sempre em **centavos** (`bigint`)
- Timestamps sempre `timestamptz` com default `now()`
- `created_at`/`updated_at` em todas tabelas mutáveis
- Status fields são `text` com check constraint (não enum, pra facilitar evolução)
- Nomes de tabela no plural, snake_case

## Tabelas

### profiles

Estende `auth.users` do Supabase. Trigger cria registro automaticamente quando user faz signup.

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  
  -- Tipo de conta
  account_type text check (account_type in ('individual', 'organization')) default 'individual',
  organization_name text,
  organization_cnpj text,  -- só pra organizações
  
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
  
  -- Trust score (pra futuro antifraude)
  trust_score int default 50,  -- 0-100
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_profiles_stripe_account on public.profiles(stripe_account_id);
```

### campaigns

```sql
create table public.campaigns (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  
  -- Conteúdo
  title text not null check (char_length(title) <= 80),
  short_description text check (char_length(short_description) <= 200),
  description text,  -- markdown
  banner_url text,
  category text check (category in ('saude', 'educacao', 'animais', 'social', 'emergencia', 'religiao', 'outros')),
  
  -- Financeiro
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
  
  -- Antifraude
  banner_phash text,  -- perceptual hash da imagem pra detectar duplicação
  flagged boolean default false,
  flagged_reason text,
  
  -- Timestamps
  reviewed_at timestamptz,
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_campaigns_status on public.campaigns(status);
create index idx_campaigns_user on public.campaigns(user_id);
create index idx_campaigns_slug on public.campaigns(slug);
create index idx_campaigns_category on public.campaigns(category) where status = 'active';
create index idx_campaigns_phash on public.campaigns(banner_phash) where banner_phash is not null;
```

### campaign_images

Galeria adicional além do banner.

```sql
create table public.campaign_images (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid references public.campaigns(id) on delete cascade not null,
  url text not null,
  caption text,
  sort_order int default 0,
  created_at timestamptz default now()
);

create index idx_campaign_images_campaign on public.campaign_images(campaign_id, sort_order);
```

### campaign_updates

Timeline de "novidades" da campanha.

```sql
create table public.campaign_updates (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid references public.campaigns(id) on delete cascade not null,
  title text,
  content text not null,
  image_url text,
  created_at timestamptz default now()
);

create index idx_campaign_updates_campaign on public.campaign_updates(campaign_id, created_at desc);
```

### donations

```sql
create table public.donations (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid references public.campaigns(id) on delete cascade not null,
  
  -- Dados do doador (não exige cadastro)
  donor_name text,
  donor_email text,
  donor_message text check (char_length(donor_message) <= 500),
  is_anonymous boolean default false,
  
  -- Valores (todos em centavos)
  amount_cents bigint not null check (amount_cents > 0),
  application_fee_cents bigint not null check (application_fee_cents >= 0),
  stripe_fee_cents bigint check (stripe_fee_cents >= 0),
  donor_covered_fees boolean default false,
  net_to_creator_cents bigint,  -- calculado, valor que criador efetivamente recebe
  
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

create index idx_donations_campaign on public.donations(campaign_id, status, created_at desc);
create index idx_donations_pi on public.donations(stripe_payment_intent_id);
create index idx_donations_status on public.donations(status);
```

### reports

Denúncias de campanhas suspeitas.

```sql
create table public.reports (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid references public.campaigns(id) on delete cascade not null,
  reporter_email text,
  reporter_user_id uuid references public.profiles(id) on delete set null,
  reason text not null check (reason in ('fraud', 'inappropriate', 'illegal', 'spam', 'other')),
  details text,
  status text check (status in ('pending', 'reviewed', 'dismissed', 'action_taken')) default 'pending',
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

create index idx_reports_campaign on public.reports(campaign_id);
create index idx_reports_status on public.reports(status, created_at);
```

## Views

### donations_public

Pra exibir doações na página pública sem expor dados sensíveis.

```sql
create view public.donations_public as
select
  id,
  campaign_id,
  case when is_anonymous then 'Anônimo' else donor_name end as display_name,
  case when is_anonymous then null else donor_message end as donor_message,
  amount_cents,
  net_to_creator_cents,
  payment_method,
  created_at
from public.donations
where status = 'succeeded';
```

## Triggers

### Atualizar contadores quando doação é confirmada

```sql
create or replace function update_campaign_stats()
returns trigger as $$
begin
  if new.status = 'succeeded' and (old.status is null or old.status != 'succeeded') then
    update public.campaigns
    set
      current_amount_cents = current_amount_cents + new.amount_cents,
      donor_count = donor_count + 1,
      updated_at = now()
    where id = new.campaign_id;
    
    update public.profiles
    set
      total_raised_cents = total_raised_cents + new.amount_cents,
      updated_at = now()
    where id = (select user_id from public.campaigns where id = new.campaign_id);
  end if;
  
  -- Reverter se foi reembolsado
  if new.status = 'refunded' and old.status = 'succeeded' then
    update public.campaigns
    set
      current_amount_cents = greatest(0, current_amount_cents - new.amount_cents),
      donor_count = greatest(0, donor_count - 1),
      updated_at = now()
    where id = new.campaign_id;
  end if;
  
  return new;
end;
$$ language plpgsql;

create trigger donation_stats_trigger
after insert or update on public.donations
for each row execute function update_campaign_stats();
```

### Auto-criar profile quando user faz signup

```sql
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, email_verified)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url',
    new.email_confirmed_at is not null
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function handle_new_user();
```

### Atualizar updated_at automaticamente

```sql
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function set_updated_at();

create trigger campaigns_updated_at before update on public.campaigns
  for each row execute function set_updated_at();

create trigger donations_updated_at before update on public.donations
  for each row execute function set_updated_at();
```

### Promover campanhas pending_review > 24h

Roda via Supabase Cron Job (pg_cron) toda hora.

```sql
create or replace function promote_pending_campaigns()
returns void as $$
begin
  update public.campaigns
  set status = 'active', published_at = now()
  where status = 'pending_review'
    and reviewed_at < now() - interval '24 hours'
    and not flagged;
end;
$$ language plpgsql;

select cron.schedule(
  'promote-campaigns',
  '0 * * * *',  -- toda hora
  $$ select promote_pending_campaigns(); $$
);
```

## RLS Policies

### Habilitar RLS em todas as tabelas

```sql
alter table public.profiles enable row level security;
alter table public.campaigns enable row level security;
alter table public.donations enable row level security;
alter table public.campaign_images enable row level security;
alter table public.campaign_updates enable row level security;
alter table public.reports enable row level security;
```

### profiles

```sql
-- Usuário lê o próprio profile
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Público lê dados básicos de profiles donos de campanhas ativas
create policy "Public can read profiles of active campaign owners"
  on public.profiles for select
  using (
    exists (
      select 1 from public.campaigns
      where campaigns.user_id = profiles.id
      and campaigns.status in ('active', 'completed')
    )
  );

-- Usuário atualiza o próprio profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);
```

### campaigns

```sql
-- Público lê campanhas ativas e completas
create policy "Public can read active campaigns"
  on public.campaigns for select
  using (status in ('active', 'completed'));

-- Dono lê todas as próprias campanhas (incluindo drafts)
create policy "Users can read own campaigns"
  on public.campaigns for select
  using (auth.uid() = user_id);

-- Dono cria campanhas
create policy "Users can create own campaigns"
  on public.campaigns for insert
  with check (auth.uid() = user_id);

-- Dono atualiza próprias campanhas (mas não muda user_id ou status pra active direto)
create policy "Users can update own campaigns"
  on public.campaigns for update
  using (auth.uid() = user_id);

-- Dono deleta próprias campanhas em draft
create policy "Users can delete own draft campaigns"
  on public.campaigns for delete
  using (auth.uid() = user_id and status = 'draft');
```

### donations

```sql
-- Doações são lidas via view donations_public (sem RLS direto)
-- Acesso direto à tabela só pelo dono da campanha
create policy "Campaign owners can read donations"
  on public.donations for select
  using (
    exists (
      select 1 from public.campaigns
      where campaigns.id = donations.campaign_id
      and campaigns.user_id = auth.uid()
    )
  );

-- Inserts vêm de webhook (service_role bypassa RLS)
-- Updates idem
```

### campaign_images, campaign_updates

```sql
-- Público lê imagens/updates de campanhas ativas
create policy "Public can read images of active campaigns"
  on public.campaign_images for select
  using (
    exists (
      select 1 from public.campaigns
      where campaigns.id = campaign_images.campaign_id
      and campaigns.status in ('active', 'completed')
    )
  );

create policy "Public can read updates of active campaigns"
  on public.campaign_updates for select
  using (
    exists (
      select 1 from public.campaigns
      where campaigns.id = campaign_updates.campaign_id
      and campaigns.status in ('active', 'completed')
    )
  );

-- Dono gerencia imagens/updates das próprias campanhas
create policy "Users manage own campaign images"
  on public.campaign_images for all
  using (
    exists (
      select 1 from public.campaigns
      where campaigns.id = campaign_images.campaign_id
      and campaigns.user_id = auth.uid()
    )
  );

create policy "Users manage own campaign updates"
  on public.campaign_updates for all
  using (
    exists (
      select 1 from public.campaigns
      where campaigns.id = campaign_updates.campaign_id
      and campaigns.user_id = auth.uid()
    )
  );
```

### reports

```sql
-- Qualquer um (mesmo anônimo) pode criar report
create policy "Anyone can create reports"
  on public.reports for insert
  with check (true);

-- Só admin (service_role) lê reports
-- (admin dashboard externo usa service_role)
```

## Storage Buckets

Criar via Supabase Dashboard ou migration:

- `campaign-banners` (public read, authenticated write)
- `campaign-images` (public read, authenticated write)
- `campaign-update-images` (public read, authenticated write)
- `avatars` (public read, owner write)

Policies:
```sql
-- Banner upload: só dono da campanha
create policy "Users upload to own campaign folder"
  on storage.objects for insert
  with check (
    bucket_id = 'campaign-banners'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
```

## Realtime

Habilitar Realtime em:
- `donations` (filtrado por campaign_id na subscription)
- `campaign_updates` (filtrado por campaign_id)

Frontend usa:
```ts
supabase
  .channel(`campaign:${campaignId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'donations',
    filter: `campaign_id=eq.${campaignId}`
  }, handleNewDonation)
  .subscribe();
```

## Migration Order

Recomendado criar migrations nessa ordem:

1. `001_extensions.sql` — habilitar uuid-ossp, pg_cron
2. `002_profiles.sql` — tabela + trigger handle_new_user
3. `003_campaigns.sql` — tabela + indexes
4. `004_campaign_images_updates.sql`
5. `005_donations.sql` — tabela + trigger update_campaign_stats
6. `006_reports.sql`
7. `007_views.sql` — donations_public
8. `008_storage_buckets.sql`
9. `009_rls_policies.sql` — todas policies
10. `010_realtime.sql` — habilitar realtime
11. `011_cron_jobs.sql` — pg_cron jobs
