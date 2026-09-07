-- ORBYVEN Platform Core v2 tenant-access regression test.
-- Run manually after applying 20260907133000_platform_core_auth_provisioning_v2.sql.
-- The entire script rolls back and leaves no persistent test data.
-- Existing memberships of the selected auth user are temporarily normalized inside
-- the transaction so the test remains deterministic even on a populated project.

begin;

create temporary table _orbyven_platform_core_test (
  user_id uuid not null,
  organization_id uuid not null
) on commit drop;

grant select on _orbyven_platform_core_test to authenticated;

do $$
declare
  test_user uuid;
  test_org uuid := gen_random_uuid();
begin
  select id into test_user from auth.users order by created_at asc limit 1;
  if test_user is null then
    raise exception 'platform_core_v2_test_requires_one_auth_user';
  end if;

  insert into public.organizations (
    id,
    name,
    slug,
    legal_name,
    lifecycle_status,
    created_by
  ) values (
    test_org,
    'ORBYVEN Platform Core Test',
    'platform-core-test-' || left(replace(test_org::text, '-', ''), 10),
    'ORBYVEN Platform Core Test',
    'active',
    test_user
  );

  insert into public.organization_members (
    organization_id,
    user_id,
    role,
    access_status
  ) values (
    test_org,
    test_user,
    'owner',
    'active'
  );

  insert into public.organization_profiles (
    organization_id,
    display_name
  ) values (
    test_org,
    'Platform Core Test'
  );

  insert into _orbyven_platform_core_test(user_id, organization_id)
  values (test_user, test_org);

  -- The project can already contain a real membership for this user. Keep the
  -- synthetic active tenant as the only active membership for the first phase.
  update public.organization_members
  set access_status = 'suspended'
  where user_id = test_user
    and organization_id <> test_org;
end;
$$;

select set_config(
  'request.jwt.claim.sub',
  (select user_id::text from _orbyven_platform_core_test limit 1),
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);

set local role authenticated;

do $$
declare
  test_org uuid := (select organization_id from _orbyven_platform_core_test limit 1);
begin
  if not exists (select 1 from public.organizations where id = test_org) then
    raise exception 'active_tenant_should_be_visible';
  end if;

  if public.workspace_entry_state() <> 'workspace' then
    raise exception 'active_owner_should_enter_workspace';
  end if;
end;
$$;

reset role;

update public.organization_members
set access_status = 'suspended'
where organization_id = (select organization_id from _orbyven_platform_core_test limit 1)
  and user_id = (select user_id from _orbyven_platform_core_test limit 1);

set local role authenticated;

do $$
declare
  test_org uuid := (select organization_id from _orbyven_platform_core_test limit 1);
begin
  if exists (select 1 from public.organizations where id = test_org) then
    raise exception 'suspended_member_must_not_see_tenant';
  end if;

  if public.workspace_entry_state() <> 'member_suspended' then
    raise exception 'suspended_member_should_receive_member_suspended_state';
  end if;
end;
$$;

reset role;

-- For the organization-level suspension phase, make every membership for the
-- selected user active and every corresponding organization suspended. This
-- keeps workspace_entry_state deterministic if the user existed before the test.
update public.organization_members
set access_status = 'active'
where user_id = (select user_id from _orbyven_platform_core_test limit 1);

update public.organizations
set lifecycle_status = 'suspended'
where id in (
  select organization_id
  from public.organization_members
  where user_id = (select user_id from _orbyven_platform_core_test limit 1)
);

set local role authenticated;

do $$
declare
  test_org uuid := (select organization_id from _orbyven_platform_core_test limit 1);
begin
  if exists (select 1 from public.organizations where id = test_org) then
    raise exception 'suspended_organization_must_not_be_visible';
  end if;

  if public.workspace_entry_state() <> 'organization_suspended' then
    raise exception 'suspended_tenant_should_receive_organization_suspended_state';
  end if;
end;
$$;

reset role;
rollback;
