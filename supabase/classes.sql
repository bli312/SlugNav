-- Rebuilds class data: this deletes all classes, meetings, and saved schedules.
-- Run the complete file in Supabase SQL Editor only when that data is disposable.
begin;

drop function if exists public.create_manual_class(text, text, text, jsonb);
drop table if exists public.user_classes;
drop table if exists public.class_meetings;
drop table if exists public.classes;

create table public.classes (
  id bigint generated always as identity primary key,
  owner_id uuid references auth.users(id) on delete cascade,
  code text,
  name text not null check (btrim(name, E' \t\n\r') <> ''),
  instructor_name text,
  term integer,
  class_number integer,
  location text,
  day_and_time text,
  updated_at timestamptz not null default now(),
  unique (term, class_number),
  check (class_number is null or term is not null),
  check (owner_id is null or class_number is null)
);

create table public.class_meetings (
  id bigint generated always as identity primary key,
  class_id bigint not null references public.classes(id) on delete cascade,
  days_of_week smallint[] check (
    days_of_week <@ array[1, 2, 3, 4, 5, 6, 7]::smallint[]
  ),
  start_time time,
  end_time time,
  starts_on date,
  ends_on date,
  location_text text,
  check (end_time > start_time),
  check (ends_on >= starts_on)
);

create table public.user_classes (
  user_id uuid not null references auth.users(id) on delete cascade,
  class_id bigint not null references public.classes(id) on delete cascade,
  primary key (user_id, class_id)
);

create index classes_owner_id_idx on public.classes(owner_id);
create index class_meetings_class_id_idx on public.class_meetings(class_id);
create index user_classes_class_id_idx on public.user_classes(class_id);

alter table public.classes enable row level security;
alter table public.class_meetings enable row level security;
alter table public.user_classes enable row level security;

revoke all on public.classes, public.class_meetings, public.user_classes
  from public, anon, authenticated;

grant select, insert, update, delete
  on public.classes, public.class_meetings to authenticated;
grant select, insert, delete on public.user_classes to authenticated;
grant all on public.classes, public.class_meetings, public.user_classes
  to service_role;

create policy classes_read on public.classes
  for select to authenticated
  using (owner_id is null or owner_id = (select auth.uid()));

create policy classes_manage_own on public.classes
  for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

-- The referenced classes table also applies its read policy.
create policy class_meetings_read on public.class_meetings
  for select to authenticated
  using (exists (
    select 1 from public.classes c
    where c.id = class_meetings.class_id
  ));

create policy class_meetings_manage_own on public.class_meetings
  for all to authenticated
  using (exists (
    select 1 from public.classes c
    where c.id = class_meetings.class_id
      and c.owner_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.classes c
    where c.id = class_meetings.class_id
      and c.owner_id = (select auth.uid())
  ));

create policy user_classes_manage_own on public.user_classes
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.classes c
      where c.id = user_classes.class_id
    )
  );

create function public.create_manual_class(
  p_name text,
  p_code text default null,
  p_instructor_name text default null,
  p_meetings jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  new_class public.classes;
  result jsonb;
begin
  insert into public.classes (owner_id, name, code, instructor_name)
  values (
    auth.uid(),
    btrim(p_name, E' \t\n\r'),
    nullif(btrim(p_code, E' \t\n\r'), ''),
    nullif(btrim(p_instructor_name, E' \t\n\r'), '')
  )
  returning * into new_class;

  insert into public.class_meetings
    (class_id, days_of_week, start_time, end_time, location_text)
  select new_class.id, m.days_of_week, m.start_time, m.end_time,
    nullif(btrim(m.location_text, E' \t\n\r'), '')
  from jsonb_to_recordset(p_meetings) as m(
    days_of_week smallint[], start_time time, end_time time, location_text text
  );

  insert into public.user_classes (user_id, class_id)
  values (auth.uid(), new_class.id);

  select to_jsonb(new_class) || jsonb_build_object(
    'class_meetings', coalesce((
      select jsonb_agg(to_jsonb(m) order by m.id)
      from public.class_meetings m where m.class_id = new_class.id
    ), '[]'::jsonb),
    'user_classes', jsonb_build_array(jsonb_build_object('user_id', auth.uid()))
  ) into result;

  return result;
end;
$$;

revoke all on function public.create_manual_class(text, text, text, jsonb)
  from public, anon;
grant execute on function public.create_manual_class(text, text, text, jsonb)
  to authenticated;

commit;
