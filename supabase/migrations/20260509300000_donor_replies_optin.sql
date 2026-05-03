-- Opt-in do criador pra receber respostas de doadores no email pessoal.
-- Default true (criadores na maioria querem agradecer/conversar).
-- Quando true, recibos e comunicações de doação saem com Reply-To do
-- email do criador. Quando false, Reply-To = noreply@doatividade.com.
--
-- Idempotente.

alter table public.profiles
  add column if not exists allow_donor_replies boolean not null default true;
