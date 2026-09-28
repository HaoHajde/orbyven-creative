-- Alpha 0.7.1: cover actor foreign keys reported by Supabase database advisor.
-- Additive only; no data rewrite. thermal_sketches exists from 20260927202000.
create index if not exists ops_material_catalog_created_by_idx
  on public.ops_material_catalog(created_by);
create index if not exists thermal_sketches_created_by_idx
  on public.thermal_sketches(created_by);
