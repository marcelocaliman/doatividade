-- Admin moderation: campos pra suspender usuários e bloquear ações
-- relacionadas. Idempotente.

alter table public.profiles
  add column if not exists is_suspended boolean default false,
  add column if not exists suspended_at timestamptz,
  add column if not exists suspended_reason text,
  add column if not exists suspended_by text;

create index if not exists idx_profiles_suspended
  on public.profiles(is_suspended)
  where is_suspended = true;

-- Auditoria opcional: log de ações admin (delete/suspend/etc) pra
-- rastreabilidade. Sem RLS, só service role lê/escreve.
create table if not exists public.admin_audit_log (
  id uuid primary key default uuid_generate_v4(),
  admin_email text not null,
  action text not null,
  target_type text not null check (target_type in ('user', 'campaign', 'donation', 'report')),
  target_id text not null,
  metadata jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_admin_audit_target
  on public.admin_audit_log(target_type, target_id, created_at desc);

create index if not exists idx_admin_audit_admin
  on public.admin_audit_log(admin_email, created_at desc);
