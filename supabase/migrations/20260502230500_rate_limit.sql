-- Rate limit events: tabela simples pra contar ações por janela de tempo.
-- Idempotente. Limpeza periódica via pg_cron (declarada abaixo) ou cron Vercel.

create table if not exists public.rate_limit_events (
  id bigserial primary key,
  key text not null,
  created_at timestamptz default now() not null
);

create index if not exists idx_rate_limit_key_created
  on public.rate_limit_events(key, created_at desc);

-- RLS: só service-role escreve/lê
alter table public.rate_limit_events enable row level security;

-- Cleanup: deleta eventos com mais de 24h via função simples
create or replace function public.purge_rate_limit_events()
returns void as $$
begin
  delete from public.rate_limit_events
  where created_at < now() - interval '24 hours';
end;
$$ language plpgsql security definer set search_path = public;
