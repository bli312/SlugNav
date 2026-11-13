begin;

drop policy if exists places_create on public.places;
drop policy if exists places_read on public.places;
drop table if exists public.places cascade;

commit;
