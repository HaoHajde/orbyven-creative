# Supabase migration history alignment — 28 September 2026

This file records source-control reconciliation against the live ORBYVEN Supabase migration history. It is operational metadata, not a request to rerun SQL.

## Exact-name migrations aligned safely

The following local SQL files have the same logical migration name as an already-recorded production migration. Only their filenames are aligned to the exact production version; SQL bytes stay unchanged.

- `20260907100000_orbyven_multi_tenant_foundation.sql` → `20260907095853_orbyven_multi_tenant_foundation.sql`
- `20260907113000_crm_leads_module.sql` → `20260907104116_crm_leads_module.sql`
- `20260907115000_crm_leads_module_performance.sql` → `20260907104750_crm_leads_module_performance.sql`
- `20260907123000_ops_tasks_module.sql` → `20260907112426_ops_tasks_module.sql`
- `20260907130000_orbyven_billing_foundation.sql` → `20260907120323_orbyven_billing_foundation.sql`
- `20260907133000_platform_core_auth_provisioning_v2.sql` → `20260907122455_platform_core_auth_provisioning_v2.sql`
- `20260907140000_calendar_module.sql` → `20260907121018_calendar_module.sql`
- `20260908051500_public_project_request_rpc.sql` → `20260908051308_public_project_request_rpc.sql`
- `20260908063000_complete_workspace_business_modules.sql` → `20260908061840_complete_workspace_business_modules.sql`
- `20260923164000_commercial_issuer_snapshots.sql` → `20260925105411_commercial_issuer_snapshots.sql`
- `20260925135500_ai_editor_calls_actor_fk_index.sql` → `20260925105415_ai_editor_calls_actor_fk_index.sql`
- `20260925150000_alpha06_material_catalog_revisions.sql` → `20260927152501_alpha06_material_catalog_revisions.sql`

The more recent Security Hardening II / Thermal migrations were already aligned separately:

- `20260927173520_alpha065_thermal_sketches.sql`
- `20260928140018_security_hardening_ii_finance_ip_quota.sql`
- `20260928140022_pilot_entitlements_private_requests.sql`
- `20260928140502_thermal_independent_module_guard.sql`
- `20260928141201_project_requests_server_only_cutover.sql`
- `20260928142037_thermal_pilot_entitlement.sql`

## Remote history without an exact local-name counterpart

These production history entries must NOT be recreated from memory or guessed SQL:

- `20260907095925_harden_org_rls_helpers`
- `20260907100939_workspace_bootstrap_rpc`
- `20260907100958_lock_down_workspace_bootstrap_rpc`
- `20260907103812_workspace_onboarding_canonical`
- `20260908061908_fix_workspace_module_rls_role_scope`
- `20260910063540_estimate_material_offer_invoice_budget_flow`
- `20260910064733_estimate_workflow_fk_indexes`
- `20260914121121_stage1_database_performance_hardening`
- `20260923103438_ai_editor_usage_guard`
- `20260928165933_legal_trust_foundation_alpha071`
- `20260928165937_billing_order_evidence_alpha071`
- `20260928165941_billing_merchant_routing_webhook_recovery_alpha071`
- `20260928165945_created_by_fk_indexes_alpha071`
- `20260928170136_legal_billing_fk_indexes_alpha071`

Some of the latest entries belong to still-separate legal/billing source changes. Preserve their actual source branches/commits when those changes are integrated; do not invent replacement files.

## Local file without exact remote-name match

- `20260907102500_workspace_onboarding.sql`

The live history instead contains `workspace_onboarding_canonical` plus separate bootstrap/hardening steps. Treat this as unresolved historical provenance. Do not rename it merely because the subject is similar.

## Operational rule

Before any future production migration deployment:

1. compare local migration version + logical name against `supabase_migrations.schema_migrations` / the Supabase migration list;
2. never run a local migration whose SQL is already represented by a differently-versioned production entry;
3. never add a fake migration-history record solely to silence tooling;
4. preserve immutable SQL content when doing a proven filename-only historical alignment;
5. use a staging restore or disposable project to validate any remaining legacy reconciliation.

As of 28 September 2026, the live database remains the authority for already-applied versions. The repository is being aligned incrementally only where identity is provable.
