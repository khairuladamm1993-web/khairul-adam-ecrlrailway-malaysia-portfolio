-- P01 Owner Secure Instruction Ledger R1. SOURCE-ONLY: DO NOT APPLY TO PRODUCTION WITHOUT SEPARATE APPROVAL.
-- The app_private schema already exists in MR-S10; no exposed ledger tables.
-- Functions never execute coding jobs, change authentication, or deploy any project.
create table app_private.owner_instruction_ledger (
  instruction_id uuid primary key default gen_random_uuid(),
  client_nonce uuid not null unique,
  project_id text not null default 'P01' check (project_id='P01'),
  directive_summary text not null check (char_length(directive_summary) between 12 and 1200),
  acceptance_criteria text not null check (char_length(acceptance_criteria) between 12 and 1500),
  scope_paths text[] not null default '{}',
  origin text not null default 'OWNER_PORTAL' check (origin='OWNER_PORTAL'),
  state text not null default 'RECEIVED' check (state in ('RECEIVED','DIAGNOSED','BLOCKED')),
  revision bigint not null default 1 check (revision>=1),
  owner_user_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table app_private.owner_instruction_events (
  event_id bigint generated always as identity primary key,
  instruction_id uuid not null references app_private.owner_instruction_ledger(instruction_id) on delete restrict,
  revision bigint not null check (revision>=1),
  event_type text not null check (event_type in ('RECEIVED','NOTE','DIAGNOSED','BLOCKED')),
  summary text not null check (char_length(summary) between 12 and 1500),
  actor_user_id uuid not null,
  created_at timestamptz not null default now(),
  unique(instruction_id,revision)
);
create index owner_instruction_ledger_recent on app_private.owner_instruction_ledger(created_at desc);
create index owner_instruction_events_recent on app_private.owner_instruction_events(instruction_id,event_id desc);
alter table app_private.owner_instruction_ledger enable row level security;
alter table app_private.owner_instruction_events enable row level security;
revoke all on app_private.owner_instruction_ledger from public,anon,authenticated;
revoke all on app_private.owner_instruction_events from public,anon,authenticated;
revoke all on sequence app_private.owner_instruction_events_event_id_seq from public,anon,authenticated;

-- Shared validation is performed again by the database, not trusted to browser UI.
create function app_private.owner_instruction_validate(p_value text,p_min integer,p_max integer)
returns text language plpgsql security invoker set search_path to '' as $$
declare v text := btrim(coalesce(p_value,''));
begin
 if char_length(v)<p_min or char_length(v)>p_max then raise exception 'Instruction text length invalid' using errcode='22023'; end if;
 if v ~* '(sb_secret_|sk-[A-Za-z0-9]{12}|eyJ[A-Za-z0-9_-]{20}|-----BEGIN|password[[:space:]]*[:=])' or position('@' in v)>0 then
   raise exception 'Potential credential or personal identifier in instruction' using errcode='22023';
 end if;
 return v;
end $$;

create function app_private.owner_instruction_submit(p_nonce uuid,p_summary text,p_acceptance text,p_scope text[])
returns jsonb language plpgsql security definer set search_path to '' as $$
declare
 v_summary text; v_acceptance text; v_scope text[]; v_path text;
 v_id uuid; v_old app_private.owner_instruction_ledger%rowtype;
begin
 if auth.uid() is null or app_private.account_role()<>'admin' then
   raise exception 'Owner/Admin access required' using errcode='42501';
 end if;
 if p_nonce is null then raise exception 'Instruction nonce required' using errcode='22023'; end if;
 v_summary:=app_private.owner_instruction_validate(p_summary,12,1200);
 v_acceptance:=app_private.owner_instruction_validate(p_acceptance,12,1500);
 v_scope:=coalesce(p_scope,'{}'::text[]);
 if coalesce(array_length(v_scope,1),0)>8 then raise exception 'Too many scope paths' using errcode='22023'; end if;
 foreach v_path in array v_scope loop
   if v_path is null or char_length(v_path)<3 or char_length(v_path)>160
       or left(v_path,1)='/' or position('..' in v_path)>0
       or position('://' in v_path)>0 or position(chr(92) in v_path)>0
       or position('@' in v_path)>0 then
     raise exception 'Invalid scope path' using errcode='22023';
   end if;
 end loop;
 insert into app_private.owner_instruction_ledger
   (client_nonce,project_id,directive_summary,acceptance_criteria,scope_paths,owner_user_id)
 values(p_nonce,'P01',v_summary,v_acceptance,v_scope,auth.uid())
 on conflict(client_nonce) do nothing returning instruction_id into v_id;
 if v_id is null then
   select * into v_old from app_private.owner_instruction_ledger where client_nonce=p_nonce;
   if v_old.owner_user_id is distinct from auth.uid() or v_old.directive_summary<>v_summary
       or v_old.acceptance_criteria<>v_acceptance or v_old.scope_paths<>v_scope then
     raise exception 'Nonce already used for a different instruction' using errcode='23505';
   end if;
   return jsonb_build_object('instruction_id',v_old.instruction_id,'revision',v_old.revision,
     'state',v_old.state,'created',false);
 end if;
 insert into app_private.owner_instruction_events
   (instruction_id,revision,event_type,summary,actor_user_id)
 values(v_id,1,'RECEIVED',v_summary,auth.uid());
 return jsonb_build_object('instruction_id',v_id,'revision',1,'state','RECEIVED','created',true);
end $$;

create function app_private.owner_instruction_checkpoint(
  p_instruction_id uuid,p_expected_revision bigint,p_event_type text,p_summary text
) returns jsonb language plpgsql security definer set search_path to '' as $$
declare v_note text; v_state text; v_revision bigint;
begin
 if auth.uid() is null or app_private.account_role()<>'admin' then
   raise exception 'Owner/Admin access required' using errcode='42501';
 end if;
 v_note:=app_private.owner_instruction_validate(p_summary,12,1500);
 if p_event_type not in ('NOTE','DIAGNOSED','BLOCKED') then raise exception 'Unsupported checkpoint' using errcode='22023'; end if;
 if p_expected_revision is null or p_expected_revision<1 then raise exception 'Expected revision required' using errcode='22023'; end if;
 v_state:=case when p_event_type='NOTE' then null else p_event_type end;
 update app_private.owner_instruction_ledger
 set revision=revision+1,updated_at=now(),state=coalesce(v_state,state)
 where instruction_id=p_instruction_id and revision=p_expected_revision and owner_user_id=auth.uid()
 returning revision into v_revision;
 if v_revision is null then
   raise exception 'Instruction missing or revision conflict' using errcode='40001';
 end if;
 insert into app_private.owner_instruction_events
   (instruction_id,revision,event_type,summary,actor_user_id)
 values(p_instruction_id,v_revision,p_event_type,v_note,auth.uid());
 return jsonb_build_object('instruction_id',p_instruction_id,'revision',v_revision,
     'state',coalesce(v_state,(select state from app_private.owner_instruction_ledger where instruction_id=p_instruction_id)));
end $$;

create function app_private.owner_instruction_list(p_limit integer default 15)
returns jsonb language plpgsql security definer set search_path to '' as $$
begin
 if auth.uid() is null or app_private.account_role()<>'admin' then
   raise exception 'Owner/Admin access required' using errcode='42501';
 end if;
 return coalesce((select jsonb_agg(to_jsonb(t) order by t.updated_at desc,t.instruction_id)
   from (select l.instruction_id,l.project_id,l.directive_summary,l.acceptance_criteria,
     l.scope_paths,l.origin,l.state,l.revision,l.created_at,l.updated_at
     from app_private.owner_instruction_ledger l
     where l.owner_user_id=auth.uid()
     order by l.updated_at desc,l.instruction_id
     limit least(greatest(coalesce(p_limit,15),1),30)) t),'[]'::jsonb);
end $$;

create function app_private.owner_instruction_history(p_instruction_id uuid)
returns jsonb language plpgsql security definer set search_path to '' as $$
begin
 if auth.uid() is null or app_private.account_role()<>'admin' then
   raise exception 'Owner/Admin access required' using errcode='42501';
 end if;
 if not exists(select 1 from app_private.owner_instruction_ledger
               where instruction_id=p_instruction_id and owner_user_id=auth.uid()) then
   raise exception 'Instruction not found' using errcode='P0002';
 end if;
 return coalesce((select jsonb_agg(jsonb_build_object('revision',e.revision,
      'event_type',e.event_type,'summary',e.summary,'created_at',e.created_at)
      order by e.revision desc) from app_private.owner_instruction_events e
      where e.instruction_id=p_instruction_id),'[]'::jsonb);
end $$;

-- Exposed facades are invokers; the privileged functions remain in app_private.
create function public.admin_instruction_submit(p_nonce uuid,p_summary text,p_acceptance text,p_scope text[])
returns jsonb language sql security invoker set search_path to '' as $$
 select app_private.owner_instruction_submit(p_nonce,p_summary,p_acceptance,p_scope)
$$;
create function public.admin_instruction_checkpoint(
 p_instruction_id uuid,p_expected_revision bigint,p_event_type text,p_summary text)
returns jsonb language sql security invoker set search_path to '' as $$
 select app_private.owner_instruction_checkpoint(p_instruction_id,p_expected_revision,p_event_type,p_summary)
$$;
create function public.admin_instruction_list(p_limit integer default 15)
returns jsonb language sql security invoker set search_path to '' as $$
 select app_private.owner_instruction_list(p_limit)
$$;
create function public.admin_instruction_history(p_instruction_id uuid)
returns jsonb language sql security invoker set search_path to '' as $$
 select app_private.owner_instruction_history(p_instruction_id)
$$;

revoke execute on function app_private.owner_instruction_validate(text,integer,integer) from public,anon;
revoke execute on function app_private.owner_instruction_submit(uuid,text,text,text[]) from public,anon;
revoke execute on function app_private.owner_instruction_checkpoint(uuid,bigint,text,text) from public,anon;
revoke execute on function app_private.owner_instruction_list(integer) from public,anon;
revoke execute on function app_private.owner_instruction_history(uuid) from public,anon;
revoke execute on function public.admin_instruction_submit(uuid,text,text,text[]) from public,anon;
revoke execute on function public.admin_instruction_checkpoint(uuid,bigint,text,text) from public,anon;
revoke execute on function public.admin_instruction_list(integer) from public,anon;
revoke execute on function public.admin_instruction_history(uuid) from public,anon;
grant usage on schema app_private to authenticated;
grant execute on function app_private.owner_instruction_validate(text,integer,integer) to authenticated;
grant execute on function app_private.owner_instruction_submit(uuid,text,text,text[]) to authenticated;
grant execute on function app_private.owner_instruction_checkpoint(uuid,bigint,text,text) to authenticated;
grant execute on function app_private.owner_instruction_list(integer) to authenticated;
grant execute on function app_private.owner_instruction_history(uuid) to authenticated;
grant execute on function public.admin_instruction_submit(uuid,text,text,text[]) to authenticated;
grant execute on function public.admin_instruction_checkpoint(uuid,bigint,text,text) to authenticated;
grant execute on function public.admin_instruction_list(integer) to authenticated;
grant execute on function public.admin_instruction_history(uuid) to authenticated;

-- No UPDATE/DELETE grants or public direct table grants. Every write creates an audit event.
-- IMPORTANT: security definer calls account_role() for every operation; validate with non-admin JWT.
