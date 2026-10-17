create index if not exists workspace_custom_field_definitions_created_by_idx
  on public.workspace_custom_field_definitions(created_by);

create index if not exists workspace_custom_field_values_created_by_idx
  on public.workspace_custom_field_values(created_by);

create index if not exists workspace_custom_field_values_updated_by_idx
  on public.workspace_custom_field_values(updated_by);
