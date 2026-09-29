-- Cover foreign keys introduced by finance_income_entries.

create index if not exists finance_income_entries_org_client_idx
  on public.finance_income_entries(organization_id, client_id)
  where client_id is not null;
create index if not exists finance_income_entries_org_estimate_idx
  on public.finance_income_entries(organization_id, estimate_id)
  where estimate_id is not null;
create index if not exists finance_income_entries_created_by_idx
  on public.finance_income_entries(created_by)
  where created_by is not null;
