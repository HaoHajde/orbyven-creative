-- ORBYVEN security hardening: close legacy lead exposure, protect tenant ownership,
-- repair private document storage rules, and slow abusive public requests.
drop policy if exists "Authenticated admins can read ORBITA leads" on public.leads;
drop policy if exists "Authenticated admins can update ORBITA lead status" on public.leads;
revoke select, update on public.leads from authenticated;
-- Legacy ORBITA lead creation remains insert-only for anonymous public visitors.

-- RLS cannot restrict TRUNCATE. Remove unnecessary schema-level privileges.
revoke all privileges on public.organization_members from anon;
revoke truncate, references, trigger on public.organization_members from authenticated;

create or replace function private.guard_organization_member_mutation()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  -- Only trusted server-side provisioning may change the owner role.
  -- Service-role requests have no authenticated end-user auth.uid().
  if (select auth.uid()) is not null then
    if TG_OP = 'INSERT' then
      if new.role = 'owner' then
        raise exception 'owner role changes require platform authorization'
          using errcode = '42501';
      end if;
    elsif TG_OP = 'UPDATE' then
      if new.organization_id is distinct from old.organization_id
         or new.user_id is distinct from old.user_id then
        raise exception 'membership identity is immutable'
          using errcode = '42501';
      end if;
      if old.role = 'owner' or new.role = 'owner' then
        raise exception 'owner role changes require platform authorization'
          using errcode = '42501';
      end if;
    elsif TG_OP = 'DELETE' then
      if old.role = 'owner' then
        raise exception 'owner role changes require platform authorization'
          using errcode = '42501';
      end if;
    end if;
  end if;
  if TG_OP = 'DELETE' then return old; end if;
  return new;
end;
$function$;
revoke all on function private.guard_organization_member_mutation()
  from public, anon, authenticated;
drop trigger if exists organization_members_security_guard on public.organization_members;
create trigger organization_members_security_guard
before insert or update or delete on public.organization_members
for each row execute function private.guard_organization_member_mutation();

-- Do not allow a member to rewrite the organization segment of an object's path.
drop policy if exists "orbyven_documents_storage_select" on storage.objects;
create policy "orbyven_documents_storage_select" on storage.objects
for select to authenticated using (
  bucket_id = 'orbyven-documents'
  and exists (
    select 1 from public.organization_members m
    join public.organizations o on o.id = m.organization_id
    where m.organization_id::text = (storage.foldername(storage.objects.name))[1]
      and m.user_id = (select auth.uid()) and m.access_status = 'active'
      and o.lifecycle_status = 'active'
  )
);
drop policy if exists "orbyven_documents_storage_insert" on storage.objects;
create policy "orbyven_documents_storage_insert" on storage.objects
for insert to authenticated with check (
  bucket_id = 'orbyven-documents'
  and exists (
    select 1 from public.organization_members m
    join public.organizations o on o.id = m.organization_id
    where m.organization_id::text = (storage.foldername(storage.objects.name))[1]
      and m.user_id = (select auth.uid()) and m.access_status = 'active'
      and m.role in ('owner','admin','manager','member')
      and o.lifecycle_status = 'active'
  )
);
drop policy if exists "orbyven_documents_storage_update" on storage.objects;
create policy "orbyven_documents_storage_update" on storage.objects
for update to authenticated using (
  bucket_id = 'orbyven-documents'
  and exists (
    select 1 from public.organization_members m
    join public.organizations o on o.id = m.organization_id
    where m.organization_id::text = (storage.foldername(storage.objects.name))[1]
      and m.user_id = (select auth.uid()) and m.access_status = 'active'
      and m.role in ('owner','admin','manager')
      and o.lifecycle_status = 'active'
  )
) with check (
  bucket_id = 'orbyven-documents'
  and exists (
    select 1 from public.organization_members m
    join public.organizations o on o.id = m.organization_id
    where m.organization_id::text = (storage.foldername(storage.objects.name))[1]
      and m.user_id = (select auth.uid()) and m.access_status = 'active'
      and m.role in ('owner','admin','manager')
      and o.lifecycle_status = 'active'
  )
);
drop policy if exists "orbyven_documents_storage_delete" on storage.objects;
create policy "orbyven_documents_storage_delete" on storage.objects
for delete to authenticated using (
  bucket_id = 'orbyven-documents'
  and exists (
    select 1 from public.organization_members m
    join public.organizations o on o.id = m.organization_id
    where m.organization_id::text = (storage.foldername(storage.objects.name))[1]
      and m.user_id = (select auth.uid()) and m.access_status = 'active'
      and m.role in ('owner','admin','manager')
      and o.lifecycle_status = 'active'
  )
);

-- Apply to the storage API too, not just browser-side validation.
update storage.buckets
set public = false, file_size_limit = 20971520,
  allowed_mime_types = array[
    'application/pdf','image/jpeg','image/png','image/webp',
    'image/heic','image/heif','text/plain','text/csv',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]::text[]
where id = 'orbyven-documents';

-- Block repeated mail-notification spam even when calling the RPC directly.
create or replace function private.limit_public_project_request_email()
returns trigger language plpgsql security definer set search_path = ''
as $function$
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(pg_catalog.lower(new.email)));
  if (
    select count(*) from public.project_requests pr
    where pg_catalog.lower(pr.email) = pg_catalog.lower(new.email)
      and pr.created_at > pg_catalog.now() - interval '1 hour'
  ) >= 3 then
    raise exception 'request submitted too recently' using errcode = 'P0001';
  end if;
  return new;
end;
$function$;
revoke all on function private.limit_public_project_request_email()
  from public, anon, authenticated;
drop trigger if exists public_project_request_email_limit on public.project_requests;
create trigger public_project_request_email_limit
before insert on public.project_requests
for each row execute function private.limit_public_project_request_email();

-- Supabase definer functions need a fixed, minimal search_path.
alter function private.is_org_member(uuid) set search_path = '';
alter function private.is_org_admin(uuid) set search_path = '';
alter function private.has_module_entitlement(uuid,text) set search_path = '';
alter function public.submit_project_request(text,text,text,text,text,text,text,text,text,boolean,boolean)
  set search_path = '';
