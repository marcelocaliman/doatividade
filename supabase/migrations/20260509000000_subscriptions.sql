-- Doações recorrentes (Stripe Subscriptions sobre Connect Direct Charge).
--
-- Por que tabela separada de donations:
--   - Subscription tem ciclo de vida próprio (active/past_due/canceled)
--   - Cada cobrança vira uma row em donations com subscription_id apontando
--     pra cá — preserva a barra de progresso atual sem mudar nada
--   - Permite gestão pro doador (cancelar) e pro criador (MRR, lista)
--
-- Idempotente.

-- 1. Tabela de assinaturas
create table if not exists public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  -- Identificação do doador (sem auth — só email + nome no checkout)
  donor_email text not null,
  donor_name text not null,
  is_anonymous boolean not null default false,
  donor_message text,
  -- Stripe refs (subscription + customer ficam no connected account, não no platform)
  stripe_subscription_id text not null unique,
  stripe_customer_id text not null,
  stripe_account_id text not null,
  -- Valor mensal em centavos. Não muda durante a vida da assinatura.
  amount_cents int not null check (amount_cents >= 1000), -- R$ 10 min
  currency text not null default 'brl',
  -- Periodicidade — só mensal por ora, mas deixamos extensível
  interval text not null default 'month' check (interval in ('month', 'year')),
  -- Status sincronizado com Stripe via webhook
  status text not null default 'incomplete'
    check (status in ('incomplete', 'incomplete_expired', 'active', 'past_due', 'canceled', 'unpaid', 'paused', 'trialing')),
  -- Próxima cobrança (atualizado em cada invoice.payment_succeeded)
  current_period_end timestamptz,
  -- Quando foi cancelada (preenche em customer.subscription.deleted)
  canceled_at timestamptz,
  -- Timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_subscriptions_campaign_id
  on public.subscriptions(campaign_id);
create index if not exists idx_subscriptions_donor_email
  on public.subscriptions(donor_email);
create index if not exists idx_subscriptions_status_active
  on public.subscriptions(status) where status in ('active', 'past_due', 'trialing');
create index if not exists idx_subscriptions_account
  on public.subscriptions(stripe_account_id);

-- Trigger pra updated_at
create or replace function public.subscriptions_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists subscriptions_updated_at on public.subscriptions;
create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.subscriptions_set_updated_at();

-- RLS: só service_role escreve (via webhooks/actions). Doadores acessam
-- via magic-link token (validado no server). Criador NÃO lê direto a
-- tabela — usamos uma view pública filtrada por campaign owner.
alter table public.subscriptions enable row level security;

-- 2. FK em donations apontando pra qual subscription gerou a cobrança
alter table public.donations
  add column if not exists subscription_id uuid references public.subscriptions(id) on delete set null;

create index if not exists idx_donations_subscription_id
  on public.donations(subscription_id) where subscription_id is not null;

-- 3. Magic link tokens pro doador acessar /minhas-doacoes sem cadastro
create table if not exists public.donor_access_tokens (
  token uuid primary key default uuid_generate_v4(),
  email text not null,
  expires_at timestamptz not null default (now() + interval '24 hours'),
  consumed_at timestamptz,
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_donor_tokens_email on public.donor_access_tokens(email);
create index if not exists idx_donor_tokens_expires on public.donor_access_tokens(expires_at);

alter table public.donor_access_tokens enable row level security;

-- 4. View agregada: MRR por dia pra gráfico no painel do criador.
-- Calcula soma de amount_cents das subscriptions ativas em cada dia
-- nos últimos 90 dias. Index-friendly pra ser rápido.
create or replace view public.creator_mrr_daily as
select
  c.user_id as creator_id,
  date_trunc('day', d.day)::date as day,
  coalesce(sum(s.amount_cents) filter (
    where s.status in ('active', 'trialing', 'past_due')
      and s.created_at <= d.day
      and (s.canceled_at is null or s.canceled_at > d.day)
  ), 0)::int as mrr_cents,
  count(*) filter (
    where s.status in ('active', 'trialing', 'past_due')
      and s.created_at <= d.day
      and (s.canceled_at is null or s.canceled_at > d.day)
  )::int as active_count
from public.campaigns c
cross join generate_series(
  current_date - interval '89 days',
  current_date,
  interval '1 day'
) as d(day)
left join public.subscriptions s on s.campaign_id = c.id
group by c.user_id, d.day;

-- 5. Trigger de funil: criar subscription = milestone "first_subscription_received"
-- Reusa a infra de trust_signals do funil pra dar +5 pontos pro criador
-- quando recebe a primeira assinatura.
create or replace function public.trust_on_first_subscription()
returns trigger as $$
declare
  campaign_user uuid;
  already_has boolean;
begin
  if new.status = 'active'
     and (old is null or old.status != 'active') then

    select user_id into campaign_user
    from public.campaigns where id = new.campaign_id;

    if campaign_user is not null then
      select exists(
        select 1 from public.trust_signals
        where user_id = campaign_user and signal = 'first_subscription_received'
      ) into already_has;

      if not already_has then
        insert into public.trust_signals (user_id, signal, delta, reason, metadata)
        values (
          campaign_user,
          'first_subscription_received',
          5,
          'Primeira assinatura mensal recebida',
          jsonb_build_object('subscription_id', new.id, 'amount_cents', new.amount_cents)
        );
      end if;
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trust_on_first_subscription_trg on public.subscriptions;
create trigger trust_on_first_subscription_trg
  after insert or update of status on public.subscriptions
  for each row execute function public.trust_on_first_subscription();
