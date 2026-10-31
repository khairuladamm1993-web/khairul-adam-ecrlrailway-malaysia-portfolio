-- ISOLATED SANDBOX PROPOSAL ONLY. Not applied to the main project.
-- Preserve all existing account_role(), Member policies and Production settings.
begin;
create table public.p01_owner_private_r2 (
 owner_id uuid not null references auth.users(id) on delete cascade,
 bucket text not null,
 item_key text not null,
 body jsonb not null,
 updated_at timestamptz not null default now(),
 primary key(owner_id,bucket,item_key)
);
alter table public.p01_owner_private_r2 enable row level security;
revoke all on public.p01_owner_private_r2 from public,anon;
grant select,insert,update,delete on public.p01_owner_private_r2 to authenticated;
-- SECURITY DEFINER is confined to the private schema to check Auth's session
-- table. It does not return session records or bypass RLS on Owner documents.
create function app_private.owner_private_session_r2() returns boolean
language sql stable security definer set search_path='' as $$
 select auth.uid() is not null
   and app_private.account_role()='admin'
   and auth.jwt()->>'aal'='aal2'
   and exists(select 1 from auth.sessions s where s.user_id=auth.uid()
     and s.id::text=auth.jwt()->>'session_id');
$$;
revoke all on function app_private.owner_private_session_r2() from public,anon;
grant execute on function app_private.owner_private_session_r2() to authenticated;
create policy owner_private_r2 on public.p01_owner_private_r2 to authenticated
 using(owner_id=(select auth.uid()) and (select app_private.owner_private_session_r2()))
 with check(owner_id=(select auth.uid()) and (select app_private.owner_private_session_r2()));
create function public.owner_private_context_r2() returns boolean
language plpgsql security invoker set search_path='' as $$
begin
 if not app_private.owner_private_session_r2() then raise insufficient_privilege; end if;
 return true;
end $$;
create function public.owner_private_operation_r2(request jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare
 op text:=request->>'op'; v_bucket text:=request->>'store'; k text:=request->>'key';
 v jsonb; old jsonb; result jsonb; doc jsonb; state jsonb;
begin
 if not app_private.owner_private_session_r2() then raise insufficient_privilege; end if;
 if octet_length(request::text)>3000000 then raise exception 'PRIVATE_PAYLOAD_TOO_LARGE'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(auth.uid()::text,2));
 if op='bootstrap' then
  select coalesce(jsonb_object_agg(item_key,body),'{}') into result from public.p01_owner_private_r2 where owner_id=auth.uid() and bucket='browserMemory';return result;
 elsif op='list' then
  if v_bucket not in ('definitions','executions','audit','settings','recoveryArchives','geometryCandidates','ownerReviewedGeometry','attachments') then raise exception 'INVALID_STORE';end if;
  select coalesce(jsonb_agg(body),'[]') into result from public.p01_owner_private_r2 where owner_id=auth.uid() and p01_owner_private_r2.bucket=v_bucket;return result;
 elsif op='definition' then
  doc:=request->'document';v_bucket:='definitions';k:=(doc->>'assignmentId')||'@'||(doc->>'revision');
  select body into old from public.p01_owner_private_r2 where owner_id=auth.uid() and p01_owner_private_r2.bucket=v_bucket and item_key=k;
  if old is not null and old->'document'<>doc then raise exception 'REVISION_CONFLICT_INCREMENT_REVISION';end if;
  v:=coalesce(old,jsonb_build_object('key',k,'document',doc,'scope','PRIVATE_OWNER','createdAt',now()));
 elsif op='save' then
  state:=request->'state';v_bucket:='executions';k:=state->>'key';
  select body into old from public.p01_owner_private_r2 where owner_id=auth.uid() and p01_owner_private_r2.bucket=v_bucket and item_key=k;
  if coalesce((old->>'version')::bigint,0)<>(request->>'expectedVersion')::bigint then raise exception 'EXECUTION_CHANGED_IN_OTHER_TAB';end if;
  v:=state||jsonb_build_object('version',(request->>'expectedVersion')::bigint+1);
 elsif op in ('claim','release') then
  v_bucket:='settings';k:='d102-authority';
  select body into old from public.p01_owner_private_r2 where owner_id=auth.uid() and p01_owner_private_r2.bucket=v_bucket and item_key=k;
  if op='claim' then
   if old->>'assignmentKey' is not null and (old->>'assignmentKey'<>request->>'assignmentKey' or old->>'ownerToken'<>request->>'ownerToken') then raise exception 'ANOTHER_ASSIGNMENT_OWNS_D102';end if;
   v:=jsonb_build_object('key',k,'assignmentKey',request->>'assignmentKey','ownerToken',request->>'ownerToken');
  else
   if old->>'assignmentKey' is distinct from request->>'assignmentKey' or old->>'ownerToken' is distinct from request->>'ownerToken' then return null;end if;
   v:=jsonb_build_object('key',k,'assignmentKey',null,'ownerToken',null);
  end if;
 elsif op='archive' then
  v_bucket:='recoveryArchives';k:=request->>'key';v:=request->'value';
 elsif op='migrate' then
  v_bucket:='recoveryArchives';k:=request->>'key';v:=request->'value';
  if v->>'classification'<>'OWNER_PRIVATE_LEGACY_MIGRATION' then raise exception 'MIGRATION_CLASS_REQUIRED';end if;
 elsif op in ('get','put') then
  if v_bucket not in ('definitions','executions','audit','settings','recoveryArchives','geometryCandidates','ownerReviewedGeometry','browserMemory','attachments') then raise exception 'PUBLICATION_NOT_AUTHORIZED';end if;
  if op='get' then select body into result from public.p01_owner_private_r2 where owner_id=auth.uid() and p01_owner_private_r2.bucket=v_bucket and item_key=k;return result;end if;
  v:=request->'value';
 else raise exception 'UNKNOWN_OPERATION';
 end if;
 if k is null or length(k)>250 or v is null then raise exception 'INVALID_PRIVATE_RECORD';end if;
 insert into public.p01_owner_private_r2(owner_id,bucket,item_key,body) values(auth.uid(),v_bucket,k,v)
 on conflict(owner_id,bucket,item_key) do update set body=excluded.body,updated_at=now();
 return v;
end $$;
revoke all on function public.owner_private_context_r2(),public.owner_private_operation_r2(jsonb) from public,anon;
grant execute on function public.owner_private_context_r2(),public.owner_private_operation_r2(jsonb) to authenticated;
commit;
