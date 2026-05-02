-- Bucket de storage pra avatares enviados manualmente pelo user.
-- Usuários que entraram via Google já têm avatar_url da própria Google,
-- mas podem trocar por uma imagem própria. Quem NÃO usa Google fica
-- sem avatar até subir um aqui.
insert into storage.buckets (id, name, public)
values ('user-avatars', 'user-avatars', true)
on conflict (id) do nothing;

drop policy if exists "user avatar public read" on storage.objects;
create policy "user avatar public read"
  on storage.objects for select
  using (bucket_id = 'user-avatars');

drop policy if exists "user avatar owner write" on storage.objects;
create policy "user avatar owner write"
  on storage.objects for insert
  with check (
    bucket_id = 'user-avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "user avatar owner update" on storage.objects;
create policy "user avatar owner update"
  on storage.objects for update
  using (
    bucket_id = 'user-avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "user avatar owner delete" on storage.objects;
create policy "user avatar owner delete"
  on storage.objects for delete
  using (
    bucket_id = 'user-avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
