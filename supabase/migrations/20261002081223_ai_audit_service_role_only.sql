-- Keep the privileged AI audit mirror server-only.
revoke all on function public.ai_action_audit_write(uuid,uuid,text,text,uuid,jsonb)
from public, anon, authenticated;

grant execute on function public.ai_action_audit_write(uuid,uuid,text,text,uuid,jsonb)
to service_role;
