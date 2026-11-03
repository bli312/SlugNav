begin;

drop policy if exists "Classes are readable by everyone" on public.classes;
revoke select on public.classes from anon;

commit;
