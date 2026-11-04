begin;

-- 1. Predefined option votes
create table public.place_votes (
  id bigint generated always as identity primary key,
  place_id bigint not null references public.places(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  option_key text not null check (btrim(option_key, E' \t\n\r') <> ''),
  choice text not null check (btrim(choice, E' \t\n\r') <> ''),
  updated_at timestamptz not null default now(),
  unique (place_id, user_id, option_key)
);

alter table public.place_votes enable row level security;
revoke all on public.place_votes from public, anon, authenticated;
grant select, insert, update, delete on public.place_votes to authenticated;
grant all on public.place_votes to service_role;

create policy place_votes_read on public.place_votes
  for select to authenticated using (true);

create policy place_votes_insert on public.place_votes
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy place_votes_update on public.place_votes
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy place_votes_delete on public.place_votes
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- 2. User comments
create table public.place_comments (
  id bigint generated always as identity primary key,
  place_id bigint not null references public.places(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  content text not null check (btrim(content, E' \t\n\r') <> '' and length(btrim(content)) <= 500),
  created_at timestamptz not null default now()
);

alter table public.place_comments enable row level security;
revoke all on public.place_comments from public, anon, authenticated;
grant select, insert, delete on public.place_comments to authenticated;
grant all on public.place_comments to service_role;

create policy place_comments_read on public.place_comments
  for select to authenticated using (true);

create policy place_comments_insert on public.place_comments
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy place_comments_delete on public.place_comments
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- 3. Reports
create table public.place_reports (
  id bigint generated always as identity primary key,
  place_id bigint not null references public.places(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  reason text not null check (reason in ('inaccurate', 'inappropriate', 'duplicate', 'closed', 'other')),
  details text check (details is null or length(btrim(details)) <= 500),
  created_at timestamptz not null default now(),
  unique (place_id, user_id)
);

alter table public.place_reports enable row level security;
revoke all on public.place_reports from public, anon, authenticated;
grant select, insert on public.place_reports to authenticated;
grant all on public.place_reports to service_role;

create policy place_reports_read on public.place_reports
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy place_reports_insert on public.place_reports
  for insert to authenticated
  with check (user_id = (select auth.uid()));

commit;
