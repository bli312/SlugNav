-- Enable this function as the Before User Created hook in Authentication > Hooks.
-- Google must be the only enabled sign-in provider. No client secret belongs here.

create or replace function public.before_ucsc_user_created(event jsonb)
returns jsonb
language plpgsql
set search_path = ''
as $$
begin
  if coalesce(lower(event -> 'user' ->> 'email'), '') !~ '^[^[:space:]@]+@ucsc[.]edu$'
    or (event -> 'user' -> 'app_metadata' ->> 'provider') is distinct from 'google'
    or coalesce((event -> 'user' ->> 'is_anonymous')::boolean, false)
    or (event -> 'user' -> 'user_metadata' ->> 'email_verified') is distinct from 'true'
    or (event #>> '{user,user_metadata,custom_claims,hd}') is distinct from 'ucsc.edu'
  then
    return jsonb_build_object('error', jsonb_build_object(
      'http_code', 403,
      'message', 'Use your UCSC Google account ending in @ucsc.edu.'
    ));
  end if;
  return '{}'::jsonb;
end;
$$;

grant usage on schema public to supabase_auth_admin;
revoke all on function public.before_ucsc_user_created(jsonb) from public, anon, authenticated;
grant execute on function public.before_ucsc_user_created(jsonb) to supabase_auth_admin;
