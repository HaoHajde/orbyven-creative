# ORBYVEN AI Website Editor — Alpha 0.2 candidate

An opt-in **private Preview prototype**, not a post-purchase site builder, live CMS, or automatic publishing.

## Implemented
- `/workspace/site-editor`: chat, live React demo preview desktop/mobile, Undo, and localStorage draft scoped to org AND user.
- `POST /api/ai/site-editor`: model called only from Node server. Finite text/color JSON patch; validated lengths and hex values. Does not execute model-provided code.
- Supabase Auth verifies user; tenant membership/role requires owner/admin. SQL claim separately rechecks `access_status=active` and `lifecycle_status=active`.
- Pilot tenant allowlist `ORBYVEN_AI_ALLOWED_ORGANIZATION_IDS`; Production is always disabled for Alpha, even if the flag is accidentally set.
- Supabase atomic quota: **8 attempts/organization/UTC day, maximum 2 attempts/organization in rolling 60 seconds**. Attempts count even when model fails to prevent unbounded retry spend. OpenAI model allowlist: gpt-4.1-mini or gpt-4.1-nano; output cap 650 tokens per attempt.
- Service-only quota tables log token counts and request IDs, never prompts, API keys or chat transcript. No browser access to quota tables or RPC functions.

## Vercel Preview prerequisites (owner actions)
1. Revoked any OpenAI key previously shared in chat. Add a NEW `OPENAI_API_KEY` as **Secret** in Preview only.
2. Add `ORBYVEN_AI_MODEL=gpt-4.1-mini` as Config in Preview.
3. Add `ORBYVEN_AI_ALLOWED_ORGANIZATION_IDS=<TEST_ORG_UUID>` as Config in Preview. Keep it empty while not testing.
4. Confirm `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` target the intended test workspace and `SUPABASE_SERVICE_ROLE_KEY` is set as **server-only Secret** in the same Preview project. Do not paste service role credentials into chat or GitHub.
5. Review and deploy the additive SQL migration `supabase/migrations/20260923112000_ai_editor_usage_guard.sql` to the exact Supabase project connected to Preview. Do not infer it from a project name alone.
6. Run Preview CI, test sign-in using a designated pilot owner/admin, test forbidden member and a different organization, inspect quota RPC and request counts. **Only after that** temporarily set `ORBYVEN_AI_EDITOR_ENABLED=true` for controlled Preview. A new deployment is needed for environment changes.
7. Keep Production and general client access disabled. Add cost/budget alerts in the OpenAI Platform.

If `SUPABASE_SERVICE_ROLE_KEY` or the migration is missing, quota claims fail closed (HTTP 503); no unmetered model call occurs.

## Testing and limits
CI runs `node --test tests/ai-site-editor.test.cjs`, lint, TypeScript and production build. Tests use mocked provider results and mocked quotas; they do **not** validate the user's new API key or a full browser E2E. The SQL migration is additive and can be parsed in a transaction rolled back before application.

Not included: checkout entitlements, durable design drafts/cloud history, per-client domain publishing, image generation, adapting existing pilot #002/#005 actual TSX, email alerts for spend, and account-wide API provider budgets.

**Do not merge as an Alpha production launch or enable general clients until these are addressed.**
