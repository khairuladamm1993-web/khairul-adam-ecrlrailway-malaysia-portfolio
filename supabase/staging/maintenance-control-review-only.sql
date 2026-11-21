-- MR-S10 P01 · STAGING CANDIDATE ONLY — DO NOT APPLY TO LIVE PROJECT
-- Review and deploy to an isolated Preview Supabase project after Owner approval.
-- Existing Auth/RLS tables and policies remain untouched.
begin;

create table if not exists public.site_maintenance_control (
  id integer primary key default 1 check (id = 1),
  enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

alter table public.site_maintenance_control enable row level security;
revoke all on public.site_maintenance_control from public, anon, authenticated;
grant select, update on public.site_maintenance_control to authenticated;

-- Use existing backend role resolver and enabled profile, never editable JWT user_metadata.
create policy "mrs10_maintenance_admin_read"
on public.site_maintenance_control for select to authenticated
using (
  (select public.account_role()) = 'admin'
  and exists (
    select 1 from public.member_profiles p
    where p.user_id = (select auth.uid()) and p.role = 'admin' and p.enabled = true
  )
);

create policy "mrs10_maintenance_admin_update"
on public.site_maintenance_control for update to authenticated
using (
  (select public.account_role()) = 'admin'
  and exists (
    select 1 from public.member_profiles p
    where p.user_id = (select auth.uid()) and p.role = 'admin' and p.enabled = true
  )
)
with check (
  id = 1
  and (select public.account_role()) = 'admin'
  and exists (
    select 1 from public.member_profiles p
    where p.user_id = (select auth.uid()) and p.role = 'admin' and p.enabled = true
  )
);

insert into public.site_maintenance_control(id,enabled)
values (1,false) on conflict (id) do nothing;

commit;
