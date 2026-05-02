-- Adiciona colunas pra:
--   1. Template da página de campanha (classic | storytelling | minimal)
--   2. Inbox de mensagens dos doadores (creator_read_at pra marcar como lida)
-- Idempotente.

-- Template
alter table public.campaigns
  add column if not exists template text default 'classic';

-- Garante check constraint válida (drop+add pra idempotência segura)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'campaigns_template_check'
  ) then
    alter table public.campaigns
      add constraint campaigns_template_check
      check (template in ('classic', 'storytelling', 'minimal'));
  end if;
end$$;

-- Marca de leitura do criador pra mensagens do doador
alter table public.donations
  add column if not exists creator_read_at timestamptz;

-- Index pra pegar mensagens não lidas rapidamente por campanha
create index if not exists idx_donations_unread_messages
  on public.donations(campaign_id, creator_read_at)
  where donor_message is not null and creator_read_at is null;
