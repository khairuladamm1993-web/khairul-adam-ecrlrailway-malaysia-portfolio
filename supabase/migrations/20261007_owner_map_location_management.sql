-- Owner MAP location management.
-- Applied to MR Platform as incremental migrations on 2026-10-07.
-- Canonical approved location stays in public.member_content; drafts stay client-side only.
create table if not exists app_private.map_location_versions (
  version_id bigint generated always as identity primary key,
  asset_id text not null,
  previous_latitude double precision,
  previous_longitude double precision,
  new_latitude double precision,
  new_longitude double precision,
  previous_confidence text,
  new_confidence text not null,
  source_note text not null,
  accuracy_m double precision,
  owner_user_id uuid not null,
  action text not null default 'publish',
  restored_from_version bigint,
  created_at timestamptz not null default now(),
  constraint map_location_versions_action_check check (action in ('baseline','publish','rollback')),
  constraint map_location_versions_accuracy_check check (accuracy_m is null or accuracy_m >= 0),
  constraint map_location_versions_confidence_check check (
    new_confidence in (
      'Personal Field-Validated Location',
      'Public Reference Location',
      'Pending Validation',
      'Validated Location',
      'Engineering/Survey Validated Location'
    )
  )
);
alter table app_private.map_location_versions enable row level security;
revoke all on table app_private.map_location_versions from public, anon, authenticated;
revoke all on sequence app_private.map_location_versions_version_id_seq from public, anon, authenticated;

create or replace function app_private.admin_publish_location(
  p_asset_id text,p_latitude double precision,p_longitude double precision,
  p_confidence text,p_source_note text,p_accuracy_m double precision default null
) returns jsonb language plpgsql security definer set search_path to '' as $$
declare
  v_row public.member_content%rowtype; v_location jsonb;
  v_prev_lat double precision; v_prev_lon double precision; v_prev_conf text;
  v_source text; v_version bigint;
begin
  if app_private.account_role()<>'admin' then raise exception 'Admin required' using errcode='42501'; end if;
  if p_asset_id is null or btrim(p_asset_id)='' then raise exception 'Asset required'; end if;
  if p_source_note is null or length(btrim(p_source_note))<4 or length(p_source_note)>2000 then raise exception 'Evidence/source note required (4-2000 chars)'; end if;
  if p_confidence not in ('Personal Field-Validated Location','Public Reference Location','Pending Validation','Validated Location','Engineering/Survey Validated Location') then raise exception 'Unsupported location confidence'; end if;
  if p_latitude is not null and (p_latitude < -90 or p_latitude > 90) then raise exception 'Invalid latitude'; end if;
  if p_longitude is not null and (p_longitude < -180 or p_longitude > 180) then raise exception 'Invalid longitude'; end if;
  if (p_latitude is null) <> (p_longitude is null) then raise exception 'Latitude and longitude must be supplied together'; end if;
  if p_confidence in ('Personal Field-Validated Location','Validated Location','Engineering/Survey Validated Location') and (p_latitude is null or p_longitude is null) then raise exception 'Validated location requires coordinates'; end if;
  if p_accuracy_m is not null and (p_accuracy_m < 0 or p_accuracy_m > 100000) then raise exception 'Invalid accuracy'; end if;

  select * into v_row from public.member_content where id=p_asset_id and kind='corridor' and approved=true for update;
  if not found then raise exception 'Approved Corridor asset not found' using errcode='P0002'; end if;
  v_location:=coalesce(v_row.body->'location','{}'::jsonb);
  v_prev_lat:=nullif(v_location->>'latitude','')::double precision;
  v_prev_lon:=nullif(v_location->>'longitude','')::double precision;
  v_prev_conf:=coalesce(v_location->>'locationConfidence','Pending Validation');

  if p_confidence='Validated Location' then
    if v_prev_conf<>'Validated Location' then raise exception 'Validated Location cannot be newly asserted through Owner field editing'; end if;
    if p_latitude is distinct from v_prev_lat or p_longitude is distinct from v_prev_lon then raise exception 'Changing a validated project coordinate requires reclassification'; end if;
  end if;
  if p_confidence='Engineering/Survey Validated Location' then
    if v_prev_conf<>'Engineering/Survey Validated Location' then raise exception 'Engineering/Survey classification cannot be newly asserted through Owner field editing'; end if;
    if p_latitude is distinct from v_prev_lat or p_longitude is distinct from v_prev_lon then raise exception 'Changing an engineering/survey coordinate requires reclassification'; end if;
  end if;

  if not exists(select 1 from app_private.map_location_versions where asset_id=p_asset_id) then
    insert into app_private.map_location_versions(asset_id,previous_latitude,previous_longitude,new_latitude,new_longitude,previous_confidence,new_confidence,source_note,accuracy_m,owner_user_id,action)
    values(p_asset_id,v_prev_lat,v_prev_lon,v_prev_lat,v_prev_lon,v_prev_conf,v_prev_conf,'Baseline captured before first Owner location change',null,auth.uid(),'baseline');
  end if;

  v_source:=case p_confidence
    when 'Personal Field-Validated Location' then 'Owner-approved personal field reference; not engineering/survey GIS'
    when 'Public Reference Location' then 'Owner-approved public reference; not engineering/survey GIS'
    when 'Pending Validation' then 'Owner-approved pending-validation reference; not exact railway location'
    when 'Validated Location' then coalesce(v_location->>'coordinateSource','Validated project reference')
    else coalesce(v_location->>'coordinateSource','Engineering/Survey validated reference') end;

  update public.member_content
  set body=jsonb_set(jsonb_set(jsonb_set(jsonb_set(body,'{location,latitude}',to_jsonb(p_latitude),true),'{location,longitude}',to_jsonb(p_longitude),true),'{location,locationConfidence}',to_jsonb(p_confidence),true),'{location,coordinateSource}',to_jsonb(v_source),true),updated_at=now()
  where id=p_asset_id;

  insert into app_private.map_location_versions(asset_id,previous_latitude,previous_longitude,new_latitude,new_longitude,previous_confidence,new_confidence,source_note,accuracy_m,owner_user_id,action)
  values(p_asset_id,v_prev_lat,v_prev_lon,p_latitude,p_longitude,v_prev_conf,p_confidence,btrim(p_source_note),p_accuracy_m,auth.uid(),'publish') returning version_id into v_version;
  insert into public.admin_audit(actor,action,target) values(auth.uid(),'map_location_published',p_asset_id||':v'||v_version::text);
  return jsonb_build_object('version_id',v_version,'asset_id',p_asset_id,'latitude',p_latitude,'longitude',p_longitude,'confidence',p_confidence,'accuracy_m',p_accuracy_m,'published_at',now());
end $$;

create or replace function app_private.admin_location_history(p_asset_id text default null)
returns jsonb language plpgsql security definer set search_path to '' as $$
begin
  if app_private.account_role()<>'admin' then raise exception 'Admin required' using errcode='42501'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object(
    'version_id',v.version_id,'asset_id',v.asset_id,
    'previous_latitude',v.previous_latitude,'previous_longitude',v.previous_longitude,
    'new_latitude',v.new_latitude,'new_longitude',v.new_longitude,
    'previous_confidence',v.previous_confidence,'new_confidence',v.new_confidence,
    'source_note',v.source_note,'accuracy_m',v.accuracy_m,'owner_user_id',v.owner_user_id,
    'action',v.action,'restored_from_version',v.restored_from_version,'created_at',v.created_at
  ) order by v.version_id desc) from app_private.map_location_versions v where p_asset_id is null or v.asset_id=p_asset_id),'[]'::jsonb);
end $$;

create or replace function app_private.admin_restore_location(p_version_id bigint,p_source_note text)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare
  v_target app_private.map_location_versions%rowtype; v_row public.member_content%rowtype;
  v_location jsonb; v_prev_lat double precision; v_prev_lon double precision; v_prev_conf text;
  v_source text; v_version bigint;
begin
  if app_private.account_role()<>'admin' then raise exception 'Admin required' using errcode='42501'; end if;
  if p_source_note is null or length(btrim(p_source_note))<4 or length(p_source_note)>2000 then raise exception 'Rollback note required (4-2000 chars)'; end if;
  select * into v_target from app_private.map_location_versions where version_id=p_version_id;
  if not found then raise exception 'Location version not found' using errcode='P0002'; end if;
  select * into v_row from public.member_content where id=v_target.asset_id and kind='corridor' and approved=true for update;
  if not found then raise exception 'Approved Corridor asset not found' using errcode='P0002'; end if;

  v_location:=coalesce(v_row.body->'location','{}'::jsonb);
  v_prev_lat:=nullif(v_location->>'latitude','')::double precision;
  v_prev_lon:=nullif(v_location->>'longitude','')::double precision;
  v_prev_conf:=coalesce(v_location->>'locationConfidence','Pending Validation');
  v_source:=case v_target.new_confidence
    when 'Personal Field-Validated Location' then 'Owner-approved personal field reference; restored approved version'
    when 'Public Reference Location' then 'Owner-approved public reference; restored approved version'
    when 'Pending Validation' then 'Owner-approved pending-validation reference; restored approved version'
    when 'Validated Location' then 'Validated project reference; restored approved version'
    else 'Engineering/Survey validated reference; restored approved version' end;

  update public.member_content
  set body=jsonb_set(jsonb_set(jsonb_set(jsonb_set(body,'{location,latitude}',to_jsonb(v_target.new_latitude),true),'{location,longitude}',to_jsonb(v_target.new_longitude),true),'{location,locationConfidence}',to_jsonb(v_target.new_confidence),true),'{location,coordinateSource}',to_jsonb(v_source),true),updated_at=now()
  where id=v_target.asset_id;

  insert into app_private.map_location_versions(asset_id,previous_latitude,previous_longitude,new_latitude,new_longitude,previous_confidence,new_confidence,source_note,accuracy_m,owner_user_id,action,restored_from_version)
  values(v_target.asset_id,v_prev_lat,v_prev_lon,v_target.new_latitude,v_target.new_longitude,v_prev_conf,v_target.new_confidence,btrim(p_source_note),v_target.accuracy_m,auth.uid(),'rollback',p_version_id) returning version_id into v_version;
  insert into public.admin_audit(actor,action,target) values(auth.uid(),'map_location_restored',v_target.asset_id||':v'||v_version::text||'<-v'||p_version_id::text);
  return jsonb_build_object('version_id',v_version,'asset_id',v_target.asset_id,'restored_from_version',p_version_id,'latitude',v_target.new_latitude,'longitude',v_target.new_longitude,'confidence',v_target.new_confidence,'published_at',now());
end $$;

create or replace function public.admin_publish_location(p_asset_id text,p_latitude double precision,p_longitude double precision,p_confidence text,p_source_note text,p_accuracy_m double precision default null)
returns jsonb language sql set search_path to '' as $$select app_private.admin_publish_location(p_asset_id,p_latitude,p_longitude,p_confidence,p_source_note,p_accuracy_m)$$;
create or replace function public.admin_location_history(p_asset_id text default null)
returns jsonb language sql set search_path to '' as $$select app_private.admin_location_history(p_asset_id)$$;
create or replace function public.admin_restore_location(p_version_id bigint,p_source_note text)
returns jsonb language sql set search_path to '' as $$select app_private.admin_restore_location(p_version_id,p_source_note)$$;

revoke execute on function public.admin_publish_location(text,double precision,double precision,text,text,double precision) from public,anon;
revoke execute on function public.admin_location_history(text) from public,anon;
revoke execute on function public.admin_restore_location(bigint,text) from public,anon;
grant execute on function public.admin_publish_location(text,double precision,double precision,text,text,double precision) to authenticated;
grant execute on function public.admin_location_history(text) to authenticated;
grant execute on function public.admin_restore_location(bigint,text) to authenticated;
