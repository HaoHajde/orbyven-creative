# ORBYVEN Alpha — integrity hardening (preview-only)

This work is deliberately isolated from `main`, has **no database writes**, and does **not** deploy to Vercel.

## Confirmed findings

- GitHub CI and Quality Gate compile and lint `main`, but that does not prove tenant isolation or payment/fiscal end-to-end behavior.
- Before this release, Supabase production reported 19 applied migration records versus 11 SQL migration files in `main`. Two additive migrations have since been applied and verified: `20260925105411 commercial_issuer_snapshots` (from `supabase/migrations/20260923164000_commercial_issuer_snapshots.sql`) and `20260925105415 ai_editor_calls_actor_fk_index` (from `supabase/migrations/20260925135500_ai_editor_calls_actor_fk_index.sql`). Supabase now reports 21 migration entries, while this release contains 13 SQL files. **The older historical drift remains open:** do not rename existing files, reset production, or insert fabricated migration history. Recover exact prior SQL from original sources/backups and compare live definitions before choosing a baseline for an empty test database.
- All 31 public tables have RLS enabled. Ten server-only tables have no client policies; this is not itself a vulnerability. Check `SECURITY DEFINER` functions by their actual role grants and function body, not just the linter warning.
- `submit_project_request` is intentionally anon-callable. Its SQL validates form fields and throttles by email for 30 seconds, but that is not per-IP rate limiting. Route-only honeypot checks can be bypassed by direct RPC clients. Add abuse protection before a public launch.
- Supabase Auth leaked-password protection was reported disabled. It is a hosted Auth setting, not a SQL migration. Enable in the project's Auth settings if the plan supports it, and verify the advisor again.
- GitHub `main` branch protection was reported disabled; enable required CI/Quality Gate checks and disallow direct pushes in repository rules/settings. The app connector cannot make this admin-level change here.
- 56 indexes have no recorded use while most business tables contain zero rows. Do not drop them on that evidence alone.

## Webhook fix in this PR

1. New event: persist it, process it, and acknowledge it only after saving `processed_at`.
2. Previously completed event: return successful duplicate acknowledgment.
3. Previously failed event: use a conditional database update to let only one retry delivery claim it, then process and persist completion.
4. Pending event without a recorded error: respond 503 (not success), so it is not silently discarded while another worker is processing or when the worker crashed.
5. Log a failure to persist the error state. The HTTP response remains non-2xx.

**Remaining limitation:** A hard crash can leave `processed_at = NULL` and `processing_error = NULL` indefinitely. This patch deliberately returns 503 instead of risking a concurrent duplicate side effect. Operations must inspect such aged rows, reconcile Stripe/subscription/invoice state, then explicitly recover them. A future leased job queue and atomic invoice state transitions are needed before full production billing certification.

### Read-only operational inspection

```sql
select provider_event_id, event_type, created_at, processed_at, processing_error
from public.billing_webhook_events
where processed_at is null
order by created_at;
```

Do not blindly clear errors or reprocess a fiscal invoice that may already have been issued externally. A retry can occur after an upstream side effect and before completion is saved.

## Production launch gates

- Verify the exact migration history and backup/restore on an empty staging database.
- Test two separate organizations with owner/manager/member/viewer, direct ID manipulation, and disabled module access.
- Use Stripe **test mode** for success, failure, duplicate, out-of-order and redelivery cases; reconcile DB rows and Stripe Dashboard.
- Validate invoice issuance and Romanian fiscal flow with the actual provider and an accountant before enabling the Oblio worker.
- Confirm actual Vercel environment configuration, the production deployment SHA, and browser/mobile workflows.
- Enable branch protection and Supabase Auth security settings in the corresponding dashboards.
