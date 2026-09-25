-- ORBYVEN Security Hardening II: stage-only two-tenant read-only smoke test.
-- Apply all pending migrations to staging first; never run fixture mutation on production.
-- Requires at least two existing organizations with unrelated owner memberships.
begin read only;

select set_config(
  'request.jwt.claim.sub',
  (select m.user_id::text
   from public.organization_members m
   where m.role='owner' order by m.created_at limit 1),
  true
);

select set_config(
  'orbyven.qa.own_org',
  (select m.organization_id::text from public.organization_members m
   where m.role='owner' order by m.created_at limit 1),
  true
);

select set_config(
  'orbyven.qa.other_org',
  (select o.id::text from public.organizations o
   where o.id <> current_setting('orbyven.qa.own_org')::uuid
     and not exists (
       select 1 from public.organization_members m
       where m.user_id = current_setting('request.jwt.claim.sub')::uuid
         and m.organization_id = o.id
     )
   order by o.created_at limit 1),
  true
);

set local role authenticated;

do $test$
declare
  own_org uuid := current_setting('orbyven.qa.own_org',true)::uuid;
  foreign_org uuid := current_setting('orbyven.qa.other_org',true)::uuid;
begin
  if own_org is null or foreign_org is null then
    raise exception 'two unrelated tenant fixtures required';
  end if;
  if not private.is_org_member(own_org)
     or private.is_org_member(foreign_org)
     or not private.can_access_org_finances(own_org)
     or private.can_access_org_finances(foreign_org) then
    raise exception 'tenant or finance permission regression';
  end if;
  if not exists (select 1 from public.organizations where id=own_org)
     or exists (select 1 from public.organizations where id=foreign_org)
     or exists (select 1 from public.organization_members where organization_id=foreign_org)
     or exists (select 1 from public.finance_expenses where organization_id=foreign_org)
     or exists (select 1 from public.finance_budget_entries where organization_id=foreign_org)
     or exists (select 1 from public.ops_documents where organization_id=foreign_org) then
    raise exception 'cross-tenant data exposure';
  end if;
end;
$test$;

rollback;
