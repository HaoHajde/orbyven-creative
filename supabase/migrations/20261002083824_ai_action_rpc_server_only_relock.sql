-- Agent Action RPCs are privileged server surfaces only.
revoke all on function public.ai_action_proposal_claim(uuid,uuid,uuid) from public, anon, authenticated;
revoke all on function public.ai_action_proposal_finish(uuid,uuid,uuid,boolean,text,uuid,text) from public, anon, authenticated;
revoke all on function public.ai_action_proposal_reject(uuid,uuid,uuid) from public, anon, authenticated;
revoke all on function public.ai_action_proposals_insert(uuid,uuid,jsonb) from public, anon, authenticated;
revoke all on function public.ai_action_proposals_list(uuid,uuid,uuid,integer) from public, anon, authenticated;
revoke all on function public.ai_action_proposals_supersede(uuid,uuid,uuid[]) from public, anon, authenticated;
revoke all on function public.ai_create_estimate_draft_actor(uuid,uuid,text,uuid,uuid,text,bigint,numeric,date,text,bigint,bigint,jsonb) from public, anon, authenticated;

grant execute on function public.ai_action_proposal_claim(uuid,uuid,uuid) to service_role;
grant execute on function public.ai_action_proposal_finish(uuid,uuid,uuid,boolean,text,uuid,text) to service_role;
grant execute on function public.ai_action_proposal_reject(uuid,uuid,uuid) to service_role;
grant execute on function public.ai_action_proposals_insert(uuid,uuid,jsonb) to service_role;
grant execute on function public.ai_action_proposals_list(uuid,uuid,uuid,integer) to service_role;
grant execute on function public.ai_action_proposals_supersede(uuid,uuid,uuid[]) to service_role;
grant execute on function public.ai_create_estimate_draft_actor(uuid,uuid,text,uuid,uuid,text,bigint,numeric,date,text,bigint,bigint,jsonb) to service_role;
