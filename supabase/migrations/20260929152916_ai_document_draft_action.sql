-- Alpha 0.8.3: allow confirmed internal document draft actions.
alter table public.ai_action_proposals
  drop constraint if exists ai_action_proposals_action_type_check;

alter table public.ai_action_proposals
  add constraint ai_action_proposals_action_type_check
  check (action_type in (
    'create_lead',
    'create_client',
    'create_task',
    'create_calendar_event',
    'create_estimate',
    'create_document_draft'
  ));
