-- Adiciona organization_logo_url ao profile pra white-label da página de
-- campanha. Quando preenchido, aparece no canto direito do header da
-- campanha (substituindo eventual branding default). Quando null, o
-- espaço fica vazio sem nenhuma marcação.
alter table public.profiles
  add column if not exists organization_logo_url text;

-- Bucket de storage pra logos de org. Idempotente.
insert into storage.buckets (id, name, public)
values ('organization-logos', 'organization-logos', true)
on conflict (id) do nothing;

-- Policies: dono insere/atualiza/deleta logos no próprio path; público lê.
drop policy if exists "org logo public read" on storage.objects;
create policy "org logo public read"
  on storage.objects for select
  using (bucket_id = 'organization-logos');

drop policy if exists "org logo owner write" on storage.objects;
create policy "org logo owner write"
  on storage.objects for insert
  with check (
    bucket_id = 'organization-logos'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "org logo owner update" on storage.objects;
create policy "org logo owner update"
  on storage.objects for update
  using (
    bucket_id = 'organization-logos'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "org logo owner delete" on storage.objects;
create policy "org logo owner delete"
  on storage.objects for delete
  using (
    bucket_id = 'organization-logos'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
