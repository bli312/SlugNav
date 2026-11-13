begin;

drop policy if exists place_reports_insert on public.place_reports;
drop policy if exists place_reports_read on public.place_reports;
drop table if exists public.place_reports cascade;

drop policy if exists place_comments_delete on public.place_comments;
drop policy if exists place_comments_insert on public.place_comments;
drop policy if exists place_comments_read on public.place_comments;
drop table if exists public.place_comments cascade;

drop policy if exists place_votes_delete on public.place_votes;
drop policy if exists place_votes_update on public.place_votes;
drop policy if exists place_votes_insert on public.place_votes;
drop policy if exists place_votes_read on public.place_votes;
drop table if exists public.place_votes cascade;

commit;
