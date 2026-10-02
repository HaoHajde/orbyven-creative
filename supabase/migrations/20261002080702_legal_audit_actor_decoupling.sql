-- ORBYVEN Legal & Trust: immutable audit actor decoupling.
-- Immutable evidence must not block deletion of an Auth account through ON DELETE SET NULL.
-- Keep the actor UUID as a pseudonymous audit identifier instead of rewriting evidence.
alter table if exists public.legal_contract_records
  drop constraint if exists legal_contract_records_recorded_by_fkey;
alter table if exists public.privacy_request_events
  drop constraint if exists privacy_request_events_actor_user_id_fkey;
alter table if exists public.billing_order_evidence
  drop constraint if exists billing_order_evidence_actor_user_id_fkey;

comment on column public.legal_contract_records.recorded_by is
  'Pseudonymous actor UUID retained for immutable audit evidence; intentionally not an auth.users FK.';
comment on column public.privacy_request_events.actor_user_id is
  'Pseudonymous actor UUID retained for immutable audit evidence; intentionally not an auth.users FK.';
comment on column public.billing_order_evidence.actor_user_id is
  'Pseudonymous checkout actor UUID retained for immutable order evidence; intentionally not an auth.users FK.';
