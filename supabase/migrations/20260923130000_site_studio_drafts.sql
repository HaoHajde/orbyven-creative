-- ORBYVEN Website Studio Alpha 0.2
-- Drafts are private: only the authenticated, paid and authorized server route may
-- read/write via service_role. A draft never changes the public website.
create table if not exists public.site_studio_drafts (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  template_slug text not null check (template_slug in ('instalatii','pilot-002','evenimente','beauty','clinica-dentara')),
  draft jsonb not null default '{}'::jsonb check (jsonb_typeof(draft) = 'object'),
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.site_studio_drafts enable row level security;
revoke all on table public.site_studio_drafts from anon, authenticated;
grant select, insert, update, delete on table public.site_studio_drafts to service_role;

comment on table public.site_studio_drafts is
  'Unpublished Website Studio drafts; no public site renderer or publish action in Alpha 0.2.';
