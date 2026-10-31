-- Synthetic local CI database only; no production data or remote connection.
create schema app_private;
revoke all on schema app_private from public,anon;
grant usage on schema app_private to authenticated;
create table app_private.r22_roles(user_id uuid primary key references auth.users(id),role text not null);
revoke all on app_private.r22_roles from public,anon,authenticated;
create function app_private.account_role() returns text language sql stable security definer set search_path='' as $$select coalesce((select role from app_private.r22_roles where user_id=auth.uid()),'public')$$;
revoke all on function app_private.account_role() from public,anon;
grant execute on function app_private.account_role() to authenticated;
create function public.account_role() returns text language sql stable security invoker set search_path='' as $$select app_private.account_role()$$;
revoke all on function public.account_role() from public,anon;
grant execute on function public.account_role() to authenticated;
