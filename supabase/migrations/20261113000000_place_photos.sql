begin;

-- Photo files live in a private Storage bucket. Photos are Tier 2 data
-- (docs/privacy-and-security.md): signed-in users can read them, and only the
-- uploader can add or delete files in their own folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'place-photos',
  'place-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Files are stored at <user id>/<place id>/<file name>.
create policy place_photo_files_read on storage.objects
  for select to authenticated
  using (bucket_id = 'place-photos');

create policy place_photo_files_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'place-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy place_photo_files_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'place-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create table public.place_photos (
  id bigint generated always as identity primary key,
  place_id bigint not null references public.places(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  storage_path text not null unique,
  created_at timestamptz not null default now()
);

create index place_photos_place_id_idx on public.place_photos(place_id);

alter table public.place_photos enable row level security;
revoke all on public.place_photos from public, anon, authenticated;
grant select, delete on public.place_photos to authenticated;
grant insert (place_id, user_id, storage_path) on public.place_photos to authenticated;
grant all on public.place_photos to service_role;

create policy place_photos_read on public.place_photos
  for select to authenticated using (true);

create policy place_photos_insert on public.place_photos
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and split_part(storage_path, '/', 1) = (select auth.uid())::text
  );

create policy place_photos_delete on public.place_photos
  for delete to authenticated
  using (user_id = (select auth.uid()));

commit;
