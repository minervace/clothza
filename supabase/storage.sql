-- ============================================================
-- Clothza — Supabase Storage: image bucket + policies
-- Run in Supabase → SQL Editor (after schema.sql).
-- Creates the public "clothza-media" bucket and lets signed-in
-- users upload, replace and delete images in it.
-- Safe to re-run.
-- ============================================================

insert into storage.buckets (id, name, public)
values ('clothza-media', 'clothza-media', true)
on conflict (id) do update set public = true;

-- Public read (images appear on the storefront for everyone)
create policy "clothza_media_read" on storage.objects
  for select using (bucket_id = 'clothza-media');

-- Signed-in users can upload
create policy "clothza_media_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'clothza-media');

-- Users can replace their own uploads; admins can replace anything
create policy "clothza_media_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'clothza-media'
    and (owner = auth.uid() or public.is_admin())
  )
  with check (bucket_id = 'clothza-media');

create policy "clothza_media_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'clothza-media'
    and (owner = auth.uid() or public.is_admin())
  );

-- 5 MB per image guardrail
-- (Supabase caps storage size at the bucket level in the dashboard;
-- this client-side check lives in lib/supabaseStorage.ts)
