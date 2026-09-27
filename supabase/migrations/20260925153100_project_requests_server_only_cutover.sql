-- Run AFTER the coordinated Vercel deployment that moves project request insertion
-- behind server-side service role + distributed IP quota. Revoking before deploy
-- would interrupt the existing public form, which uses an anon RPC call.
revoke all on function public.submit_project_request(
  text,text,text,text,text,text,text,text,text,boolean,boolean
) from public, anon, authenticated;
grant execute on function public.submit_project_request(
  text,text,text,text,text,text,text,text,text,boolean,boolean
) to service_role;

comment on function public.submit_project_request(
  text,text,text,text,text,text,text,text,text,text,boolean,boolean
) is 'Server-only validated project request gateway; /api/project-requests applies distributed IP quota.';
