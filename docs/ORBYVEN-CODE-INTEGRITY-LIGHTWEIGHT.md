# ORBYVEN — permanent code integrity & lightweight gate

Effective from 28 September 2026 for **ORBYVEN Web and ORBYVEN Desktop**.

This is a regression gate, not a one-time cleanup. Every future change should preserve:

1. **Integrity** — never overwrite newer work, never weaken tenant/role checks, never let stale async data paint another screen.
2. **Shared structure** — business logic belongs in root `lib/`; Desktop reuses it instead of building a second service layer.
3. **Lightweight delivery** — source monoliths, runtime dependencies, public media, Next client chunks, Desktop dist and installer all have explicit budgets.
4. **Parity without duplication** — Web remains the reference product model; Desktop may use a native/local shell but should reuse modules, services, access rules, types and presentation tokens whenever practical.

## Baseline captured today

The limits in `config/architecture-budgets.json` intentionally start from today's real project instead of inventing an arbitrary target:

- Web: hard cap 70 KiB/file; currently **6** source files exceed 35 KiB, so the gate allows 6 but blocks a seventh.
- Desktop: hard cap 55 KiB/file; currently one source file exceeds 35 KiB.
- Desktop CSS: 32 KiB.
- Public assets: 15 MiB total and 1 MiB/file by default.
- Existing explicit exceptions: Diana & Florin MP3 (~6.6 MiB) and mobile background PNG (~2.0 MiB).
- Next static JS: 8 MiB total / 1.5 MiB single chunk.
- Desktop compiled dist: 5 MiB.
- Windows installer: 8 MiB.

These are ceilings, not performance goals. They should move **down** after refactors, not up casually.

## Dependency and architecture rules

Runtime dependencies are allowlisted. Adding a package requires an explicit budget change so bundle impact is reviewable. React/Supabase versions shared by Web and Desktop must remain aligned.

Desktop must not:
- include privileged Supabase/service-role, Stripe or billing secrets;
- become a remote `orbyven.ro/workspace` wrapper;
- duplicate root services such as leads/tasks/estimates/documents/workspace;
- directly import Next.js runtime into its own source. Shared UI requiring Next-specific behavior needs an explicit adapter/shim.

The proposed Desktop 0.4 direction — mounting shared workspace UI while retaining a local Tauri bundle — is compatible with this rule **only if the Windows build remains green and stays inside these budgets**.

## CI commands

Web:
```bash
npm run test:architecture
npm run build
node scripts/architecture-integrity.mjs --web-build
```

Windows CI:
```bash
npm run test:architecture
npm run check --prefix desktop
npm run build --prefix desktop
node scripts/architecture-integrity.mjs --desktop-build
```

## Current hotspots

Do not split code just to satisfy a metric; extract coherent responsibilities when these areas are touched:

- `components/ClientTemplateSite.tsx`
- `lib/seo-foundation.ts`
- `components/ControlCenter.tsx`
- `components/modules/TasksModule.tsx`
- `app/servicii/page.tsx`
- `components/HomePageClient.tsx`
- `desktop/src/App.tsx`
- `desktop/src/styles.css`

## Multi-chat rule

Before modifying shared files, compare current `main` and active PRs. Compose changes; never replace a newer file with an older branch copy. Security, billing, legal and SQL migrations remain independently gated; passing this architecture test never authorizes their deployment.
