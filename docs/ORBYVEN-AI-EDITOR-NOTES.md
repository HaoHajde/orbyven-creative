# ORBYVEN AI Site Editor — Alpha 0.2 candidate

Implemented on the feature branch. This is a private **preview prototype**, not a post-payment site builder, a production CMS, or automatic publishing.

## Routes and permissions

- /workspace/site-editor: owner/admin only. Desktop/mobile React preview, chat, undo and browser-local draft scoped by organization and user.
- POST /api/ai/site-editor: existing Supabase Auth + organization membership/role gate. Server holds the OpenAI key. Disabled unless ORBYVEN_AI_EDITOR_ENABLED=true.
- All model outputs are parsed as a structured finite text/color patch and validated locally. No arbitrary HTML, TSX, SQL or deploy commands.

## Vercel Preview configuration

- OPENAI_API_KEY: a newly generated key, configured as Secret; never set NEXT_PUBLIC_OPENAI_API_KEY.
- ORBYVEN_AI_MODEL: gpt-4.1-mini (optional).
- ORBYVEN_AI_EDITOR_ENABLED: false until quotas and test access are reviewed. Changing variables requires a new Preview deployment.

**Do not activate for general clients yet.** One authenticated owner/admin currently can make repeated billable model calls when the flag is on. Durable per-organization quotas, spending alerts, entitlement-after-checkout, rate limiting, persistence in Supabase, and approval/publishing workflow are still missing.

## Verification

CI includes node --test tests/ai-site-editor.test.cjs, eslint, TypeScript and Next production build. The isolated tests use simulated model replies, not a live credential. Vercel deployment/preview and Auth end-to-end testing require access to the correct Vercel project and a designated test organization.

## Boundaries

The visual preview is a small generic demonstrator; it does not yet render pilots #002/#005 or rewrite their TSX. Saving is localStorage on one browser and never publishes. Main and production are not changed by this branch until review and merge.
