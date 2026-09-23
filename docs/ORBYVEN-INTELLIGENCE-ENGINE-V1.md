# ORBYVEN Intelligence Engine v1 — Alpha preview

## First principle: design before inference

- Client design commands run in the browser against a finite validated site schema. **No model request**, no daily AI quota, no external API credits.
- Supported examples: black/gold or light palettes, violet/green/blue/pink/red accent, exact color hex, three layouts, enlarged headline, and explicit client-provided values such as `Titlu: Noul meu titlu`.
- The local engine abstains on unknown/negated prompts and never invents business facts or creative copy. If part of a sentence is recognized and the rest requests creative writing, it applies the supported design change and clearly says copy was **not** generated. Use Undo for reversal.
- Old browser drafts without `headlineSize` are still supported. This is a generic Preview demonstrator; it does not edit real template source or publish a domain.

## Provider selection

`ORBYVEN_AI_PROVIDER=local` is the **default even if the old OPENAI_API_KEY remains in Preview**. Never automatically reroute requests to a paid provider when the selected provider fails.

For creative writing, explicitly opt in to one remote provider:

| Mode | Server env | Inference costs |
| --- | --- | --- |
| `local` | no new credentials | no per-model inference costs; normal app hosting still applies |
| `cloudflare` | `CLOUDFLARE_AI_ACCOUNT_ID`, `CLOUDFLARE_AI_API_TOKEN` | free Workers AI allocation is **limited**, not unlimited; paid Cloudflare plans can incur inference charges |
| `openai` | `OPENAI_API_KEY`, `ORBYVEN_AI_MODEL` | billed separately from ChatGPT subscriptions |

Cloudflare adapter uses fixed `@cf/qwen/qwen3-30b-a3b-fp8`, Cloudflare's official REST API, a strict server-held API token, 22s timeout, capped output, safe JSON parsing and the same validated design patch. NO Cloudflare credentials or arbitrary network target in browser. A Cloudflare failure does NOT trigger an OpenAI request.

Both remote providers require `ORBYVEN_AI_EDITOR_ENABLED=true` **in Preview**, a matching Supabase Preview project, `SUPABASE_SERVICE_ROLE_KEY` configured server-only, and explicit pilot `ORBYVEN_AI_ALLOWED_ORGANIZATION_IDS`. Both obey the current pilot quota **8 requests per organization per UTC day and 2 per rolling minute**. Remote AI is hard-disabled in Production during Alpha.

**Cloudflare API token creation:** Cloudflare dashboard → Workers AI → Use REST API → create a Workers AI token, copy Account ID. Place secrets only in Vercel Preview. Never send them to chat, GitHub, or NEXT_PUBLIC_. You do not need to connect a Cloudflare domain or move `orbyven.ro`.

Source: https://developers.cloudflare.com/workers-ai/get-started/rest-api/ and https://developers.cloudflare.com/workers-ai/platform/pricing/ .

## Rollout / deployment economy

The `feature/ai-site-editor-alpha-02` branch has automatic Vercel deployments **paused while working**; only one build should be enabled after GitHub tests, lint, typecheck, build and architecture checks have passed. Do not merge this temporary branch-specific deployment policy to main.

No real Cloudflare model call or live browser E2E is claimed until the user connects their own Workers AI credentials. A self-hosted model (Ollama/vLLM) is a future separate inference server, not a model running inside Vercel functions.

## Next milestones

Cloud-stored draft history + publish authorization; template-specific sections/components; infra/usage telemetry per provider; self-hosted inference behind authenticated gateway; pricing and capacity tests before allowing general customer traffic.

Checkpoint verification: keep paid provider access explicitly opt-in and preserve the production lock.
