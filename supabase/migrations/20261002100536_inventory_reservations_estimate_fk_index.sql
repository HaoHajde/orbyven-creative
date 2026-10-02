-- Cover the composite estimate foreign key used by inventory reservations.
create index if not exists ops_inventory_reservations_org_estimate_idx
  on public.ops_inventory_reservations(organization_id, estimate_id);
