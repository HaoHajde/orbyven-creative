-- Harden authenticated onboarding/status RPC security context.
-- workspace_entry_state is read-only and must remain governed by caller RLS.
alter function public.workspace_entry_state() security invoker;
alter function public.workspace_entry_state() set search_path to '';

-- First-tenant bootstrap intentionally remains SECURITY DEFINER so it can create
-- the initial organization/member atomically, but it resolves no mutable schema.
alter function public.bootstrap_organization(text,text,text[]) set search_path to '';

comment on function public.workspace_entry_state() is
  'Authenticated workspace routing helper; SECURITY INVOKER so RLS remains authoritative.';
comment on function public.bootstrap_organization(text,text,text[]) is
  'Authenticated first-tenant bootstrap; SECURITY DEFINER is intentional, auth.uid()-bound, one-organization-per-user, and empty search_path.';
