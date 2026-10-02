-- Customer Portal follow-up: cover the two foreign keys reported by the Supabase Performance Advisor.
-- Additive only; no row rewrite and safe to re-run.
create index if not exists client_portal_decisions_link_idx
  on public.client_portal_estimate_decisions(organization_id, link_id);

create index if not exists client_portal_links_created_by_idx
  on public.client_portal_links(created_by);
