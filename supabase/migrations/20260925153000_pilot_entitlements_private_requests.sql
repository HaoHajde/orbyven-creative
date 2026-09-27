-- Gate business modules by explicitly-issued entitlements; no subscription ≠ free access.
-- These four existing Alpha organizations receive a time-limited, non-commercial
-- pilot grant. No future self-service bootstrap automatically receives access.
insert into public.organization_entitlements
  (organization_id,module_id,source,enabled,starts_at,ends_at,metadata)
select pilot.org_id, modules.module_id, 'pilot', true, pg_catalog.now(),
       '2027-06-30T23:59:59Z'::timestamptz,
       '{"grant":"explicit-existing-alpha-pilot","review_before":"2027-06-30"}'::jsonb
from (values
  ('958a6a34-8e21-4275-9074-db75da0de448'::uuid),
  ('9cab8354-02cc-4e8e-8663-260b200873db'::uuid),
  ('8ae5a6cf-1823-411c-9377-3d2c4c04057d'::uuid),
  ('14a01b56-2649-42e5-b34b-43bb3c69b3a9'::uuid)
) as pilot(org_id)
cross join (values
  ('leads'),('tasks'),('calendar'),('estimates'),('documents'),('expenses'),('team')
) as modules(module_id)
where exists (select 1 from public.organizations o where o.id = pilot.org_id)
  and not exists (
    select 1 from public.subscriptions s where s.organization_id = pilot.org_id
  )
on conflict (organization_id,module_id) do nothing;

-- Security definer reads server-owned entitlement snapshots, including timed pilots.
-- A newly bootstrapped no-subscription tenant has no paid/pilot grants.
create or replace function private.is_billing_module_allowed(
  target_org uuid, target_module text
)
returns boolean language sql stable security definer set search_path = ''
as $function$
  select private.is_org_member(target_org)
    and private.has_module_entitlement(target_org, target_module);
$function$;
revoke all on function private.is_billing_module_allowed(uuid,text) from public, anon;
grant execute on function private.is_billing_module_allowed(uuid,text) to authenticated;


-- Storage has its own RLS boundary; module-table entitlement guards alone
-- would leave direct document object uploads/downloads available to unpaid orgs.
create or replace function private.is_document_storage_allowed(target_path text)
returns boolean language sql stable security definer set search_path = ''
as $function$
  select case
    when (storage.foldername(target_path))[1] ~
      '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then private.is_billing_module_allowed(
      (storage.foldername(target_path))[1]::uuid, 'documents'
    )
    else false
  end;
$function$;
revoke all on function private.is_document_storage_allowed(text) from public, anon;
grant execute on function private.is_document_storage_allowed(text) to authenticated;

drop policy if exists orbyven_documents_paid_guard on storage.objects;
create policy orbyven_documents_paid_guard
on storage.objects as restrictive for all to authenticated
using (
  bucket_id <> 'orbyven-documents'
  or private.is_document_storage_allowed(storage.objects.name)
)
with check (
  bucket_id <> 'orbyven-documents'
  or private.is_document_storage_allowed(storage.objects.name)
);

-- Legacy public ORBITA lead insert remains available to older contact forms.
-- Restrict repeat submissions at the database boundary, including direct REST.
create or replace function private.limit_legacy_lead_email()
returns trigger language plpgsql security definer set search_path = ''
as $function$
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(pg_catalog.lower(new.email)));
  if (
    select count(*) from public.leads l
    where pg_catalog.lower(l.email) = pg_catalog.lower(new.email)
      and l.created_at > pg_catalog.now() - interval '1 hour'
  ) >= 3 then
    raise exception 'request submitted too recently' using errcode = 'P0001';
  end if;
  return new;
end;
$function$;
revoke all on function private.limit_legacy_lead_email()
  from public, anon, authenticated;
drop trigger if exists orbyven_legacy_lead_email_limit on public.leads;
create trigger orbyven_legacy_lead_email_limit
before insert on public.leads
for each row execute function private.limit_legacy_lead_email();
