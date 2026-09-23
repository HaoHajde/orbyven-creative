# ORBYVEN AI Website Preview — Alpha 0.2 pilot

**Private, authenticated PREVIEW.** This is a working generic web-design sandbox, not a hosted client's existing site editor, checkout entitlement or publication flow.

## What can be tried immediately (no billable AI calls)

Visit `/workspace/site-editor` as a workspace Owner/Admin. Pick one of four example website types (Studio, Instalații, Detailing, Florărie), switch between 3 hero layouts and Desktop/Mobil, expand **Ajustări rapide · fără AI**, change the text/color fields, undo a change and **Salvează draft**. The draft remains only in this browser, scoped by user + organization. Changing a preset is undoable. Preview image sources reuse existing pilot #002/#005 assets without changing pilot code.

A blocked/disabled AI configuration shows **Preview manual** rather than a nonworking chat. The status endpoint checks auth, explicit org allowlist, server key and a reachable usage ledger, without spending tokens or exposing credentials.

## AI chat (controlled Vercel Preview only)

- OpenAI Responses API is called on the server only; the client cannot read `OPENAI_API_KEY`.
- Structured Output schema supports short copy, hex colors and split/centered/editorial layout. AI cannot change the selected industry template, execute code or deploy.
- Server checks owner/admin, approved pilot org, active member/organization and an atomic shared Supabase quota.
- Maximum **8 claims per org/UTC day and 2 per org/rolling 60s**; even a failed model request consumes a claim to prevent unbounded retries. Token counts (no prompts) are recorded server-side.
- `VERCEL_ENV=production` always blocks the AI route. Missing flags, service key, allowlist or quota migration fail closed.

### Database migration

`supabase/migrations/20260923112000_ai_editor_usage_guard.sql` has been installed and verified on the connected Supabase project **orbita-creative** (project ref `vgudmrxuoplaimmathix`) on 23 September 2026. Tables `ai_editor_daily_usage` and `ai_editor_calls` deny direct anon/authenticated access, and RPC `ai_editor_claim` is only callable via service role. Independently verify that **Vercel Preview** uses this same project before enabling calls; the connection could not be read from Vercel by this integration.

### Required Vercel Preview variables

| Name | Type | Value |
| --- | --- | --- |
| `OPENAI_API_KEY` | Secret | New, unshared key; never paste into chats |
| `ORBYVEN_AI_MODEL` | Config | `gpt-4.1-mini` |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | Supabase service-role credential for the **same Preview project**, never `NEXT_PUBLIC_` |
| `ORBYVEN_AI_ALLOWED_ORGANIZATION_IDS` | Config | A single explicit test organization's UUID |
| `ORBYVEN_AI_EDITOR_ENABLED` | Config | `true` only after all gates are verified |

Existing `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` must refer to that same project. Do **not** put the API or service-role key into screenshots or GitHub. Set OpenAI Platform usage budget alerts. Do not add secrets to `.env.example` values.

The branch's automatic Vercel builds were paused during editing to avoid unnecessary deployments. One final Preview checkpoint deployment is enabled after CI validation. Avoid pushing cosmetic commits after this checkpoint. Environment updates may require a new deployment. Do not merge branch-specific deployment controls into main.

## Verification gates

CI: isolated AI editor tests, full lint, TypeScript, Next production build and architecture guard. Tests mock OpenAI and the quota service; they are not a live model test. The SQL migration and daily/minute quotas were transaction-tested prior to its installation. At first live pilot, manually verify Preview login, allowed and unapproved tenant, saving/reloading, undo, one model edit and no changes to public sites.

Not in this Alpha: automated after-purchase access, cloud-stored drafts, collaborative history, image generation, editing original pilot template source, PDF export, or publication to client domains.
