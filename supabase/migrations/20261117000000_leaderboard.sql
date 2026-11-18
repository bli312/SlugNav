begin;

-- 1. User Profiles for optional display names (protects privacy)
create table public.user_profiles (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  display_name text check (
    display_name is null or (
      btrim(display_name, E' \t\n\r') <> ''
      and length(btrim(display_name)) <= 32
    )
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;
revoke all on public.user_profiles from public, anon, authenticated;
grant select, insert, update on public.user_profiles to authenticated;
grant all on public.user_profiles to service_role;

create policy user_profiles_read on public.user_profiles
  for select to authenticated using (true);

create policy user_profiles_insert on public.user_profiles
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy user_profiles_update on public.user_profiles
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- 2. Points / Contributions ledger
-- Note: authenticated users have SELECT permission only. Points can ONLY be awarded
-- or removed through trusted database triggers (security definer), preventing clients
-- from giving themselves arbitrary points.
create table public.user_points (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  points integer not null check (points > 0),
  category text not null check (btrim(category, E' \t\n\r') <> ''),
  description text check (description is null or length(btrim(description)) <= 250),
  reference_type text check (reference_type is null or btrim(reference_type, E' \t\n\r') <> ''),
  reference_id text,
  created_at timestamptz not null default now(),
  unique (user_id, reference_type, reference_id)
);

create index user_points_user_id_idx on public.user_points(user_id);

alter table public.user_points enable row level security;
revoke all on public.user_points from public, anon, authenticated;
grant select on public.user_points to authenticated;
grant all on public.user_points to service_role;

create policy user_points_read on public.user_points
  for select to authenticated using (true);

-- 3. Automatic triggers for points on contributions (award on add, reverse on delete)

-- Places (+50 pts)
create or replace function public.on_place_created_award_points()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.created_by is not null then
    insert into public.user_points (user_id, points, category, description, reference_type, reference_id, created_at)
    values (new.created_by, 50, 'add_place', 'Added campus place: ' || new.name, 'place', new.id::text, new.created_at)
    on conflict (user_id, reference_type, reference_id) do nothing;
  end if;
  return new;
end;
$$;

create trigger trg_place_points
after insert on public.places
for each row
execute function public.on_place_created_award_points();

create or replace function public.on_place_deleted_remove_points()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.created_by is not null then
    delete from public.user_points
    where user_id = old.created_by
      and reference_type = 'place'
      and reference_id = old.id::text;
  end if;
  return old;
end;
$$;

create trigger trg_place_points_delete
after delete on public.places
for each row
execute function public.on_place_deleted_remove_points();

-- Photos (+20 pts)
create or replace function public.on_photo_created_award_points()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_points (user_id, points, category, description, reference_type, reference_id, created_at)
  values (new.user_id, 20, 'add_photo', 'Uploaded place photo', 'photo', new.id::text, new.created_at)
  on conflict (user_id, reference_type, reference_id) do nothing;
  return new;
end;
$$;

create trigger trg_photo_points
after insert on public.place_photos
for each row
execute function public.on_photo_created_award_points();

create or replace function public.on_photo_deleted_remove_points()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.user_points
  where user_id = old.user_id
    and reference_type = 'photo'
    and reference_id = old.id::text;
  return old;
end;
$$;

create trigger trg_photo_points_delete
after delete on public.place_photos
for each row
execute function public.on_photo_deleted_remove_points();

-- Comments (+10 pts)
create or replace function public.on_comment_created_award_points()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_points (user_id, points, category, description, reference_type, reference_id, created_at)
  values (new.user_id, 10, 'add_comment', 'Added place comment', 'comment', new.id::text, new.created_at)
  on conflict (user_id, reference_type, reference_id) do nothing;
  return new;
end;
$$;

create trigger trg_comment_points
after insert on public.place_comments
for each row
execute function public.on_comment_created_award_points();

create or replace function public.on_comment_deleted_remove_points()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.user_points
  where user_id = old.user_id
    and reference_type = 'comment'
    and reference_id = old.id::text;
  return old;
end;
$$;

create trigger trg_comment_points_delete
after delete on public.place_comments
for each row
execute function public.on_comment_deleted_remove_points();

-- Votes & Likes (+5 pts; reversed when unliked/removed)
create or replace function public.on_vote_created_award_points()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_points (user_id, points, category, description, reference_type, reference_id, created_at)
  values (new.user_id, 5, 'add_vote', 'Voted on place feature: ' || new.option_key, 'vote', new.place_id::text || ':' || new.option_key, new.updated_at)
  on conflict (user_id, reference_type, reference_id) do nothing;
  return new;
end;
$$;

create trigger trg_vote_points
after insert on public.place_votes
for each row
execute function public.on_vote_created_award_points();

create or replace function public.on_vote_deleted_remove_points()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.user_points
  where user_id = old.user_id
    and reference_type = 'vote'
    and reference_id = (old.place_id::text || ':' || old.option_key);
  return old;
end;
$$;

create trigger trg_vote_points_delete
after delete on public.place_votes
for each row
execute function public.on_vote_deleted_remove_points();

-- 4. Backfill existing contributions
insert into public.user_points (user_id, points, category, description, reference_type, reference_id, created_at)
select created_by, 50, 'add_place', 'Added campus place: ' || name, 'place', id::text, created_at
from public.places
where created_by is not null
on conflict (user_id, reference_type, reference_id) do nothing;

insert into public.user_points (user_id, points, category, description, reference_type, reference_id, created_at)
select user_id, 20, 'add_photo', 'Uploaded place photo', 'photo', id::text, created_at
from public.place_photos
on conflict (user_id, reference_type, reference_id) do nothing;

insert into public.user_points (user_id, points, category, description, reference_type, reference_id, created_at)
select user_id, 10, 'add_comment', 'Added place comment', 'comment', id::text, created_at
from public.place_comments
on conflict (user_id, reference_type, reference_id) do nothing;

insert into public.user_points (user_id, points, category, description, reference_type, reference_id, created_at)
select user_id, 5, 'add_vote', 'Voted on place feature: ' || option_key, 'vote', place_id::text || ':' || option_key, updated_at
from public.place_votes
on conflict (user_id, reference_type, reference_id) do nothing;

-- 5. Leaderboard View
create or replace view public.leaderboard_view as
with user_totals as (
  select
    up.user_id,
    coalesce(sum(up.points), 0)::bigint as total_points,
    count(up.id)::bigint as contributions_count
  from public.user_points up
  group by up.user_id
)
select
  dense_rank() over (order by ut.total_points desc, ut.contributions_count desc, ut.user_id asc)::bigint as rank,
  ut.user_id,
  coalesce(
    prof.display_name,
    'Slug ' || substring(replace(ut.user_id::text, '-', ''), 1, 4)
  ) as display_name,
  ut.total_points,
  ut.contributions_count
from user_totals ut
left join public.user_profiles prof on prof.user_id = ut.user_id;

revoke all on public.leaderboard_view from public, anon;
grant select on public.leaderboard_view to authenticated;
grant select on public.leaderboard_view to service_role;

-- 6. RPC functions: get_leaderboard and get_user_rank
create or replace function public.get_leaderboard(limit_count integer default 50)
returns table (
  rank bigint,
  user_id uuid,
  display_name text,
  total_points bigint,
  contributions_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  with user_totals as (
    select
      up.user_id,
      coalesce(sum(up.points), 0)::bigint as total_points,
      count(up.id)::bigint as contributions_count
    from public.user_points up
    group by up.user_id
  ),
  ranked as (
    select
      dense_rank() over (order by ut.total_points desc, ut.contributions_count desc, ut.user_id asc)::bigint as rank,
      ut.user_id,
      coalesce(
        prof.display_name,
        'Slug ' || substring(replace(ut.user_id::text, '-', ''), 1, 4)
      ) as display_name,
      ut.total_points,
      ut.contributions_count
    from user_totals ut
    left join public.user_profiles prof on prof.user_id = ut.user_id
  )
  select r.rank, r.user_id, r.display_name, r.total_points, r.contributions_count
  from ranked r
  order by r.rank asc, r.total_points desc, r.user_id asc
  limit greatest(1, coalesce(limit_count, 50));
$$;

revoke all on function public.get_leaderboard(integer) from public, anon;
grant execute on function public.get_leaderboard(integer) to authenticated;
grant execute on function public.get_leaderboard(integer) to service_role;

create or replace function public.get_user_rank(target_user_id uuid default auth.uid())
returns table (
  rank bigint,
  user_id uuid,
  display_name text,
  total_points bigint,
  contributions_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  with user_totals as (
    select
      up.user_id,
      coalesce(sum(up.points), 0)::bigint as total_points,
      count(up.id)::bigint as contributions_count
    from public.user_points up
    group by up.user_id
  ),
  ranked as (
    select
      dense_rank() over (order by ut.total_points desc, ut.contributions_count desc, ut.user_id asc)::bigint as rank,
      ut.user_id,
      coalesce(
        prof.display_name,
        'Slug ' || substring(replace(ut.user_id::text, '-', ''), 1, 4)
      ) as display_name,
      ut.total_points,
      ut.contributions_count
    from user_totals ut
    left join public.user_profiles prof on prof.user_id = ut.user_id
  )
  select r.rank, r.user_id, r.display_name, r.total_points, r.contributions_count
  from ranked r
  where r.user_id = target_user_id
  union all
  select
    null::bigint as rank,
    target_user_id as user_id,
    coalesce(
      (select prof.display_name from public.user_profiles prof where prof.user_id = target_user_id),
      'Slug ' || substring(replace(target_user_id::text, '-', ''), 1, 4)
    ) as display_name,
    0::bigint as total_points,
    0::bigint as contributions_count
  where not exists (select 1 from user_totals where user_id = target_user_id)
  limit 1;
$$;

revoke all on function public.get_user_rank(uuid) from public, anon;
grant execute on function public.get_user_rank(uuid) to authenticated;
grant execute on function public.get_user_rank(uuid) to service_role;

commit;
