begin;

drop function if exists public.get_user_rank(uuid);
drop function if exists public.get_leaderboard(integer);
drop view if exists public.leaderboard_view cascade;

drop trigger if exists trg_vote_points on public.place_votes;
drop function if exists public.on_vote_created_award_points();

drop trigger if exists trg_comment_points on public.place_comments;
drop function if exists public.on_comment_created_award_points();

drop trigger if exists trg_photo_points on public.place_photos;
drop function if exists public.on_photo_created_award_points();

drop trigger if exists trg_place_points on public.places;
drop function if exists public.on_place_created_award_points();

drop table if exists public.user_points cascade;
drop table if exists public.user_profiles cascade;

commit;
