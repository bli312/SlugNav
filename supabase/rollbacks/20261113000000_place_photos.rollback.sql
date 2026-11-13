begin;

-- Supabase blocks deleting Storage files with SQL (it would leave the real
-- files behind), so the bucket must be emptied first in the dashboard:
-- Storage -> place-photos -> select all files -> Delete.
do $$
begin
  if exists (select 1 from storage.objects where bucket_id = 'place-photos') then
    raise exception 'Empty the place-photos bucket in Supabase Storage before rolling back.';
  end if;
end
$$;

drop policy if exists place_photos_delete on public.place_photos;
drop policy if exists place_photos_insert on public.place_photos;
drop policy if exists place_photos_read on public.place_photos;
drop table if exists public.place_photos cascade;

drop policy if exists place_photo_files_delete on storage.objects;
drop policy if exists place_photo_files_insert on storage.objects;
drop policy if exists place_photo_files_read on storage.objects;

-- If Supabase rejects this delete, remove the empty bucket in the dashboard:
-- Storage -> place-photos -> Delete bucket.
delete from storage.buckets where id = 'place-photos';

commit;
