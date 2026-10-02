-- Defense in depth: permanent Control Center staff cannot be enabled without verified MFA.
create or replace function private.require_verified_mfa_for_platform_staff()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if new.enabled and not exists (
    select 1
    from auth.mfa_factors mf
    where mf.user_id = new.user_id
      and mf.status = 'verified'
  ) then
    raise exception 'Verified MFA is required before enabling ORBYVEN platform staff'
      using errcode = 'P0001';
  end if;

  return new;
end;
$function$;

revoke all on function private.require_verified_mfa_for_platform_staff()
from public, anon, authenticated;

drop trigger if exists platform_staff_verified_mfa_guard
on public.platform_staff;

create trigger platform_staff_verified_mfa_guard
before insert or update of user_id, enabled
on public.platform_staff
for each row
execute function private.require_verified_mfa_for_platform_staff();

comment on function private.require_verified_mfa_for_platform_staff()
is 'Fail-closed guard: enabled ORBYVEN platform_staff rows require at least one verified Supabase MFA factor.';
