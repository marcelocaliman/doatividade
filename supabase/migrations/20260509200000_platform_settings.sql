-- Tabela genérica de configurações da plataforma. Usada inicialmente pra
-- rastrear se o Pix Connect foi aprovado pela Stripe (libera após 60d
-- de histórico de transações). Genérica o suficiente pra outros toggles.
--
-- Idempotente.

create table if not exists public.platform_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.platform_settings enable row level security;
-- Sem policies: só service_role acessa.

-- Seed pix_status
insert into public.platform_settings (key, value) values (
  'pix_status',
  jsonb_build_object(
    'enabled', false,
    -- Stripe BR exige 60 dias de histórico de transação antes de aprovar
    -- Pix Connect. Hoje é 2026-05-03, então check_after = 2026-07-02.
    'check_after', '2026-07-02T00:00:00Z',
    'last_checked_at', null,
    'enabled_at', null
  )
)
on conflict (key) do nothing;

-- Trigger pra updated_at
create or replace function public.platform_settings_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists platform_settings_updated_at on public.platform_settings;
create trigger platform_settings_updated_at
  before update on public.platform_settings
  for each row execute function public.platform_settings_set_updated_at();
