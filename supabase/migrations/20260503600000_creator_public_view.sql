-- View com os campos do profile que podem ser exibidos publicamente
-- na página da campanha. Não inclui email, CPF, stripe_account_id,
-- trust_score, etc — só o que aparece pro doador anônimo.
--
-- Bypassa a RLS de profiles (que restringe ao próprio dono) ao usar
-- security_invoker=false; revogamos perms diretas e damos GRANT só
-- nas colunas seguras desta view.
create or replace view public.creator_public_profile
with (security_invoker = false)
as
select
  id,
  full_name,
  avatar_url,
  organization_name,
  organization_logo_url,
  account_type
from public.profiles;

-- Garante leitura pública (anon + authenticated). Sem isso a view
-- responde só pro service_role.
grant select on public.creator_public_profile to anon, authenticated;
