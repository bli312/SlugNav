begin;

drop function if exists public.get_user_rank(uuid);
drop function if exists public.get_leaderboard(integer);
drop view if exists public.leaderboard_view cascade;

drop trigger if exists trg_vote_points_delete on public.place_votes;
drop function if exists public.on_vote_deleted_remove_points();
drop trigger if exists trg_vote_points on public.place_votes;
drop function if exists public.on_vote_created_award_points();
drop trigger if exists trg_validate_place_vote on public.place_votes;
drop function if exists public.validate_place_vote();
drop function if exists public.is_valid_place_vote(bigint, text, text);

drop trigger if exists trg_comment_points_delete on public.place_comments;
drop function if exists public.on_comment_deleted_remove_points();
drop trigger if exists trg_comment_points on public.place_comments;
drop function if exists public.on_comment_created_award_points();

drop trigger if exists trg_photo_points_delete on public.place_photos;
drop function if exists public.on_photo_deleted_remove_points();
drop trigger if exists trg_photo_points on public.place_photos;
drop function if exists public.on_photo_created_award_points();

drop trigger if exists trg_place_points_delete on public.places;
drop function if exists public.on_place_deleted_remove_points();
drop trigger if exists trg_place_points on public.places;
drop function if exists public.on_place_created_award_points();

drop table if exists public.user_points cascade;
drop table if exists public.user_profiles cascade;

commit;
