begin;

grant select on public.classes to anon;

create policy "Classes are readable by everyone"
  on public.classes
  for select
  to anon, authenticated
  using (true);

commit;
