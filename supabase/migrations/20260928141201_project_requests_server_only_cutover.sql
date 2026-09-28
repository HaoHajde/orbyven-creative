-- Production-applied cutover: Supabase migration version 20260928141201.
-- The Next.js public gateway now owns rate limiting and database insertion.
revoke all on function public.submit_project_request(
  text,text,text,text,text,text,text,text,text,boolean,boolean
) from public, anon, authenticated;
grant execute on function public.submit_project_request(
  text,text,text,text,text,text,text,text,text,boolean,boolean
) to service_role;
comment on function public.submit_project_request(
  text,text,text,text,text,text,text,text,text,boolean,boolean
) is 'Server-only validated project request gateway; /api/project-requests applies distributed IP quota.';
