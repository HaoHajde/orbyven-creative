-- Defense-in-depth for the anonymous Data API surface.
-- RLS already blocks these internal tables for anon and no anon policies exist.
-- Remove table privileges as a second boundary; keep the intentional legacy
-- public leads INSERT flow unchanged.

revoke all privileges on table
  public.billing_accounts,
  public.billing_invoices,
  public.billing_terms_acceptances,
  public.billing_webhook_events,
  public.organization_entitlements,
  public.organization_modules,
  public.organization_profiles,
  public.organizations,
  public.platform_audit_log,
  public.platform_staff,
  public.subscriptions
from anon;

-- Generic updated_at helper: use an empty search_path and remove the default
-- PUBLIC EXECUTE grant. Authenticated/service roles retain EXECUTE for maximum
-- compatibility, although existing triggers do not rely on direct RPC access.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$function$;

revoke all on function public.set_updated_at()
from public, anon;
grant execute on function public.set_updated_at()
to authenticated, service_role;

comment on function public.set_updated_at()
is 'Generic updated_at trigger helper. Not intended as an anonymous RPC; empty search_path and explicit execution grants.';
