-- Log completo de envios de email pra observabilidade e admin.
-- Idempotente.

create table if not exists public.email_log (
  id uuid primary key default uuid_generate_v4(),
  template text not null,
  to_email text not null,
  to_name text,
  from_email text not null,
  subject text not null,
  status text not null check (status in ('sent', 'failed', 'simulated')),
  resend_id text,
  error text,
  metadata jsonb,
  user_id uuid references public.profiles(id) on delete set null,
  campaign_id uuid references public.campaigns(id) on delete set null,
  created_at timestamptz default now() not null
);

create index if not exists idx_email_log_created
  on public.email_log(created_at desc);

create index if not exists idx_email_log_template
  on public.email_log(template, created_at desc);

create index if not exists idx_email_log_to
  on public.email_log(to_email, created_at desc);

create index if not exists idx_email_log_status
  on public.email_log(status, created_at desc);

create index if not exists idx_email_log_failed
  on public.email_log(created_at desc)
  where status = 'failed';

-- RLS: só service_role lê/escreve. Admin lê via createServiceClient
-- na rota admin.
alter table public.email_log enable row level security;
