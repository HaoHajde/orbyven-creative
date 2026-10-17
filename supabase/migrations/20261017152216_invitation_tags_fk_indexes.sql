create index if not exists invitation_projects_created_by_idx
  on public.invitation_projects(created_by);

create index if not exists workspace_tags_created_by_idx
  on public.workspace_tags(created_by);

create index if not exists workspace_tag_assignments_created_by_idx
  on public.workspace_tag_assignments(created_by);
