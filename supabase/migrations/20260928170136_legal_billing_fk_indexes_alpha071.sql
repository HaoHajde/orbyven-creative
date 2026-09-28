-- Alpha 0.7.1 follow-up: cover foreign keys introduced by Legal & Trust / order evidence.
-- Additive indexes only; no data rewrite.
create index if not exists billing_order_evidence_actor_user_idx
  on public.billing_order_evidence(actor_user_id);
create index if not exists billing_order_evidence_terms_acceptance_idx
  on public.billing_order_evidence(terms_acceptance_id);
create index if not exists billing_order_evidence_subscription_acceptance_idx
  on public.billing_order_evidence(subscription_acceptance_id);
create index if not exists legal_contract_records_recorded_by_idx
  on public.legal_contract_records(recorded_by);
create index if not exists privacy_request_cases_updated_by_idx
  on public.privacy_request_cases(updated_by);
create index if not exists privacy_request_events_actor_user_idx
  on public.privacy_request_events(actor_user_id);
