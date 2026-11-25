begin;

create table public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default false,
  minutes_before bigint not null default 30
    check (minutes_before between 1 and 9007199254740991)
);

alter table public.notification_preferences enable row level security;
revoke all on public.notification_preferences from public, anon, authenticated;
grant select, insert, update on public.notification_preferences to authenticated;
grant all on public.notification_preferences to service_role;

create policy notification_preferences_read on public.notification_preferences
  for select to authenticated using ((select auth.uid()) = user_id);
create policy notification_preferences_insert on public.notification_preferences
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy notification_preferences_update on public.notification_preferences
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

commit;
