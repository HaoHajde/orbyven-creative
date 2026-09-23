# ORBYVEN Website Studio — Alpha 0.2 (work in progress)

## What this adds

- Authenticated workspace route: `/workspace/site-studio`.
- After an **active/trialing** subscription is reflected in ORBYVEN's database, the billing screen offers a link to the Studio.
- AI conversation proposes *constrained, structured changes* to draft text and theme only. Live React preview updates from those changes; desktop/tablet/mobile toggles, palettes and undo/redo are available.
- Explicit **Save draft** persists the current version to `site_studio_drafts`, scoped to `organization_id`.
- No customer public site, source repository or Vercel deployment is changed by this feature.

## Preflight before deployment

1. Apply `supabase/migrations/20260923130000_site_studio_drafts.sql` in the Supabase project used by the deployed ORBYVEN workspace. Confirm the table has RLS enabled and no `anon`/`authenticated` grants: reads and writes are exclusively performed through the paid, authenticated server route.
2. Check that the existing billing service-role key and `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are set on Vercel. **Do not put server secrets in `NEXT_PUBLIC_*`.**
3. Enable AI by setting `AI_GATEWAY_API_KEY` as a *server-only* environment variable. Optionally specify `ORBYVEN_STUDIO_MODEL` as a supported Vercel AI Gateway model identifier. Without a gateway key, preview/manual color changes and saving can still work, but AI conversation returns a clear unavailable message.
4. Run `npm ci && npm run validate && npm audit --audit-level=high` from a checkout of the feature branch. Validate Vercel preview, desktop/mobile and reduced motion.
5. Test Stripe webhook `checkout.session.completed`/subscription updates rather than trusting an unverified `checkout=success` query string. Only confirmed `active`/`trialing` subscriptions enable the Studio.

## Security and product limits

- GET/PUT/POST authenticate a Supabase user and their membership; verify active membership + organization and active/trialing subscription; PUT/POST are limited to owner/admin/manager.
- User and AI changes are validated into known string/color/service fields. AI cannot run arbitrary JSX, HTML, CSS, JS, shell commands or publish anything.
- The preview is a separate shared React renderer seeded from a template's data. It does **not** yet mutate every pixel/section of the original public template, nor is it the customer's already-deployed site. Image upload, full page builder, multi-page routing, prompt history persistence, public publish, per-edit version audit, concurrent-edit resolution and rate-limiting/budget controls are not included.
- Draft save is explicit; changes since the last save are local to the browser. No public 'Publish' action is available at this milestone.
- Support for more than one website per organization requires another data model; this alpha stores one draft per organization.
- Storing an AI key may incur provider/gateway charges; enable spending limits/monitor usage before broad release.

## Validation matrix

- Visitor/sign-out → login; member of different organization → 403; suspended organization/member → 403; unpaid → 402.
- Paid viewer can preview, cannot save or request AI; paid owner/admin/manager can.
- Successful paid GET → initial template seed or persisted draft; reload after Save → identical content/template.
- Template switch marks unsaved state; undo/redo restore both template and content; palettes update all three colors.
- AI disabled → descriptive 503, no data loss; AI enabled → structured theme/text changes in preview, no public deploy.
- Verify desktop, tablet, mobile widths, long Romanian text, keyboard Enter/Shift-Enter and screen reader labels.
- Supabase migration + gateway configuration must be verified separately from a green frontend build.
