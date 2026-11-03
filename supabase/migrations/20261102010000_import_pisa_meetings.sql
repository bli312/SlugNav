begin;

create or replace function public.import_pisa_classes(p_term integer, p_classes jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  item record;
  saved_class_id bigint;
begin
  if p_term is null or p_term <= 0 then
    raise exception 'A positive PISA term is required';
  end if;

  for item in select * from jsonb_to_recordset(p_classes) as c(
    code text, name text, class_number integer, instructor_name text,
    location text, day_and_time text, meetings jsonb
  ) loop
    if item.class_number is null or item.class_number <= 0 then
      raise exception 'A positive PISA class number is required';
    end if;

    insert into public.classes as c
      (owner_id, code, name, class_number, instructor_name, term,
       location, day_and_time, updated_at)
    values
      (null, item.code, item.name, item.class_number, item.instructor_name,
       p_term, item.location, item.day_and_time, now())
    on conflict (term, class_number) do update set
      code = excluded.code,
      name = excluded.name,
      instructor_name = excluded.instructor_name,
      location = excluded.location,
      day_and_time = excluded.day_and_time,
      updated_at = excluded.updated_at
    returning c.id into saved_class_id;

    delete from public.class_meetings where class_id = saved_class_id;
    insert into public.class_meetings
      (class_id, days_of_week, start_time, end_time, location_text)
    select saved_class_id, m.days_of_week, m.start_time, m.end_time, m.location_text
    from jsonb_to_recordset(item.meetings) as m(
      days_of_week smallint[], start_time time, end_time time, location_text text
    );
  end loop;
end;
$$;

revoke all on function public.import_pisa_classes(integer, jsonb)
  from public, anon, authenticated;
grant execute on function public.import_pisa_classes(integer, jsonb)
  to service_role;

commit;
