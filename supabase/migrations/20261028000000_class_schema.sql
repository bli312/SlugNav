begin;

-- The original catalog was created outside the migration directory.
create table if not exists public.classes (
  id bigint generated always as identity primary key,
  course_code text not null,
  title text not null,
  instructor text,
  days text,
  meeting_time text,
  building text,
  room text
);

alter table public.classes
  alter column course_code drop not null,
  add column owner_id uuid references auth.users(id) on delete cascade,
  add column term_code integer,
  add column class_number integer,
  add constraint classes_title_not_blank check (btrim(title) <> ''),
  add constraint classes_term_number_unique unique (term_code, class_number),
  add constraint classes_number_requires_term
    check (class_number is null or term_code is not null),
  add constraint classes_private_number_empty
    check (owner_id is null or class_number is null);

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

drop policy if exists "Classes are readable by everyone" on public.classes;

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

commit;
