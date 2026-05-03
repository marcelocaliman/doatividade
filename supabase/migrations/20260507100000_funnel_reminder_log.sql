-- Log de lembretes do funil enviados — pra dedup (não enviar 2x pro
-- mesmo user/estágio em janela curta) e auditoria. Idempotente.

create table if not exists public.funnel_reminder_log (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  stage text not null,
  sent_at timestamptz not null default now()
);

-- Garante 1 lembrete por user/stage no máximo a cada 14 dias
create index if not exists idx_funnel_reminder_user_stage
  on public.funnel_reminder_log(user_id, stage, sent_at desc);

alter table public.funnel_reminder_log enable row level security;
-- Sem policies: só service_role lê/escreve.
