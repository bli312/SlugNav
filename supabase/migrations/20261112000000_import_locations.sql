create table public.locations (
  id bigint generated always as identity primary key,

  name text not null unique,
  pisa_name text not null,

  building_name text,
  building_latitude double precision,
  building_longitude double precision,

  room_name text,
  room_latitude double precision,
  room_longitude double precision,

  created_at timestamptz not null default now()
);

create or replace function public.import_locations(
  p_locations jsonb
)
returns setof public.locations
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if jsonb_typeof(p_locations) <> 'array' then
    raise exception 'Expected a JSON array';
  end if;

  return query
  insert into public.locations (
    name,
    pisa_name,
    building_name,
    building_latitude,
    building_longitude,
    room_name,
    room_latitude,
    room_longitude
  )
  select
    item->>'name',
    item->>'pisa_name',
    item->>'building_name',
    (item->>'building_latitude')::double precision,
    (item->>'building_longitude')::double precision,
    item->>'room_name',
    (item->>'room_latitude')::double precision,
    (item->>'room_longitude')::double precision
  from (
    select distinct on (value->>'name') value AS item
    from jsonb_array_elements(p_locations)
    order by value->>'name'
  ) AS deduplicated
  on conflict (name) do update set
    pisa_name = excluded.pisa_name,
    building_name = excluded.building_name,
    building_latitude = excluded.building_latitude,
    building_longitude = excluded.building_longitude,
    room_name = excluded.room_name,
    room_latitude = excluded.room_latitude,
    room_longitude = excluded.room_longitude
  returning *;
end;

GRANT EXECUTE
ON FUNCTION public.import_locations(jsonb)
TO service_role;

GRANT SELECT, INSERT, UPDATE
ON public.locations
TO service_role;

$$;