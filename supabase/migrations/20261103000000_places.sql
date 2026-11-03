begin;

create table public.places (
  id bigint generated always as identity primary key,
  name text not null check (btrim(name, E' \t\n\r') <> ''),
  type text not null check (type in ('classroom', 'bathroom', 'water_fountain')),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.places enable row level security;
revoke all on public.places from public, anon, authenticated;
grant select on public.places to authenticated;
grant insert (name, type, latitude, longitude, created_by)
  on public.places to authenticated;
grant all on public.places to service_role;

create policy places_read on public.places
  for select to authenticated using (true);

create policy places_create on public.places
  for insert to authenticated
  with check (created_by = (select auth.uid()));

commit;
