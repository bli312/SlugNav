-- Classes table for SlugNav Sprint 1 (issues #8 / #10).
-- Run once in the Supabase dashboard: SQL Editor > New query > paste > Run.
-- Class catalog data is public, so anyone can read it; nobody can write from the app.

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

alter table public.classes enable row level security;

-- New Supabase projects don't grant table access to the app's roles by default.
-- Grant read only; with no insert/update/delete grant, the app can't write.
grant select on public.classes to anon, authenticated;

create policy "Classes are readable by everyone"
  on public.classes
  for select
  to anon, authenticated
  using (true);

-- Sample data for development only. Not a real schedule.
insert into public.classes (course_code, title, instructor, days, meeting_time, building, room) values
  ('CSE 101', 'Intro to Data Structures and Algorithms', 'Staff', 'MWF', '9:20AM-10:25AM', 'Thimann Lecture', '003'),
  ('CSE 120', 'Computer Architecture', 'Staff', 'TuTh', '11:40AM-1:15PM', 'Baskin Engineering', '152'),
  ('CSE 130', 'Principles of Computer Systems Design', 'Staff', 'MWF', '1:20PM-2:25PM', 'Earth & Marine', 'B206'),
  ('AM 10', 'Mathematical Methods for Engineers I', 'Staff', 'TuTh', '8:00AM-9:35AM', 'Physical Sciences', '110'),
  ('ECE 101', 'Intro to Electronic Circuits', 'Staff', 'MWF', '10:40AM-11:45AM', 'Media Theater', 'M110'),
  ('MATH 19A', 'Calculus for Science, Engineering, and Mathematics', 'Staff', 'MWF', '12:00PM-1:05PM', 'Classroom Unit', '002');
