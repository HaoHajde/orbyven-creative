-- Harden the intentional authenticated bootstrap boundary.
create or replace function public.bootstrap_organization(
  p_name text,
  p_slug text,
  p_module_ids text[] default array['overview','leads','tasks']::text[]
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  current_user_id uuid := auth.uid();
  new_org_id uuid;
  clean_name text := pg_catalog.btrim(p_name);
  clean_slug text := pg_catalog.lower(pg_catalog.btrim(p_slug));
  allowed_modules constant text[] := array[
    'overview','leads','tasks','calendar','estimates','documents',
    'inventory','expenses','thermal','team'
  ]::text[];
  requested_modules text[];
  verified_identity boolean := false;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  select (
    not coalesce(u.is_anonymous, false)
    and (u.email_confirmed_at is not null or u.phone_confirmed_at is not null)
  )
  into verified_identity
  from auth.users u
  where u.id = current_user_id;

  if not coalesce(verified_identity, false) then
    raise exception 'Verified account required';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(current_user_id::text, 0)
  );

  if coalesce(pg_catalog.array_length(p_module_ids, 1), 0) > 32 then
    raise exception 'Too many requested modules';
  end if;

  if exists (
    select 1 from public.organization_members where user_id = current_user_id
  ) then
    raise exception 'User already belongs to an ORBYVEN organization';
  end if;

  if pg_catalog.char_length(clean_name) < 2
     or pg_catalog.char_length(clean_name) > 120 then
    raise exception 'Organization name must contain between 2 and 120 characters';
  end if;

  if clean_slug !~ '^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$' then
    raise exception 'Invalid organization slug';
  end if;

  select pg_catalog.array_agg(distinct module_id)
  into requested_modules
  from pg_catalog.unnest(coalesce(p_module_ids,array['overview','leads','tasks']::text[])) as module_id
  where module_id = any(allowed_modules);

  requested_modules := pg_catalog.array_append(
    pg_catalog.array_remove(coalesce(requested_modules,'{}'::text[]),'overview'),
    'overview'
  );

  insert into public.organizations(name,slug,legal_name,created_by)
  values(clean_name,clean_slug,clean_name,current_user_id)
  returning id into new_org_id;

  insert into public.organization_members(organization_id,user_id,role)
  values(new_org_id,current_user_id,'owner');

  insert into public.organization_profiles(organization_id,display_name,timezone,locale,settings)
  values(new_org_id,clean_name,'Europe/Bucharest','ro-RO','{}'::jsonb);

  insert into public.organization_modules(organization_id,module_id,enabled,settings)
  select new_org_id,module_id,true,'{}'::jsonb
  from pg_catalog.unnest(requested_modules) as module_id
  where module_id <> 'overview'
  on conflict (organization_id,module_id) do update
  set enabled=excluded.enabled,updated_at=pg_catalog.now();

  return new_org_id;
end;
$function$;

revoke all on function public.bootstrap_organization(text,text,text[]) from public;
revoke all on function public.bootstrap_organization(text,text,text[]) from anon;
grant execute on function public.bootstrap_organization(text,text,text[]) to authenticated;
grant execute on function public.bootstrap_organization(text,text,text[]) to service_role;

comment on function public.bootstrap_organization(text,text,text[]) is
  'Intentional SECURITY DEFINER bootstrap endpoint. Callable only by authenticated/service_role; requires verified non-anonymous auth identity, one organization per user, strict input/module allowlists and a per-user advisory lock.';
