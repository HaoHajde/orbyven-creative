# ORBYVEN — Code integrity, structure & lightweight guard

Effective from 2026-09-28 for both the public ORBYVEN web platform and the Windows desktop app.

## Permanent rule

Every implementation must preserve four properties at the same time:

1. **Integrity** — no silent overwrite of newer work, no security/tenant bypass, no stale async data painting another screen.
2. **Structure** — shared business logic remains in root `lib/`; Windows reuses it rather than creating a second backend/service layer.
3. **Lightweight** — source monoliths, runtime dependencies, public media, Next client chunks, desktop dist and installer size have explicit budgets.
4. **Parity without duplication** — Web remains the product/source-of-truth model; Desktop may have native/local UI but should reuse types, services, access rules and module semantics.

The guard is executable:

```bash
npm run test:architecture
npm run build
node scripts/architecture-integrity.mjs --web-build
```

Windows CI additionally runs:

```bash
npm run build --prefix desktop
node scripts/architecture-integrity.mjs --desktop-build
```

## Current budgets

The actual numbers live in `config/architecture-budgets.json` so changing a budget is an explicit reviewable code change.

- Web source file hard cap: 70 KiB.
- At most 5 web source files above 35 KiB.
- Desktop source file hard cap: 55 KiB.
- At most 1 desktop source file above 35 KiB.
- Desktop CSS hard cap: 32 KiB.
- Runtime package allowlists are explicit for Web and Desktop.
- Shared React / Supabase package ranges must stay aligned.
- Desktop cannot add Next.js, Framer Motion or Supabase SSR runtime dependencies.
- New public assets are limited to 1 MiB unless explicitly budgeted.
- Total `public/` budget: 15 MiB.
- Next generated static JavaScript: 8 MiB total / 1.5 MiB single-chunk hard cap.
- Desktop compiled `dist/`: 5 MiB.
- Windows installer: 8 MiB.

These are **guard rails**, not performance targets. Lighthouse and real-device QA remain necessary.

## Existing explicit asset exceptions

Two legacy/demo media files already exceed the default 1 MiB budget and are therefore named explicitly:

- Diana & Florin demo music (~6.9 MB).
- Diana & Florin mobile background PNG (~2.1 MB).

Their presence is not permission to add similarly large files. When those pages are revisited, prefer media compression/modern formats without changing visible quality.

## Existing large-code hotspots

Do not split files merely to lower a number. When one of these areas is materially changed, prefer extracting coherent responsibilities instead of growing the file further:

- `components/ClientTemplateSite.tsx`
- `lib/seo-foundation.ts`
- `components/ControlCenter.tsx`
- `components/modules/TasksModule.tsx`
- `components/HomePageClient.tsx`
- `desktop/src/App.tsx`
- `desktop/src/styles.css`

The CI cap prevents new monoliths while allowing deliberate refactors of these existing components.

## Desktop-specific integrity

The Windows app must not:

- package a Supabase service-role / privileged billing secret;
- hard-code a remote `https://orbyven.ro/workspace` wrapper instead of its bundled local UI;
- duplicate root business-service filenames such as `leads.ts`, `tasks.ts`, `estimates.ts`, `documents.ts` or `orbyven-workspace.ts`;
- add heavy web-only dependencies to reproduce effects that can be implemented locally.

It should continue to reuse root `lib/modules/*`, `lib/orbyven-workspace.ts`, Supabase RLS and common module definitions.

## PR / multi-chat integration rule

Before changing a shared file, compare the current `main` and active PR heads. Compose overlapping changes; never wholesale replace a newer file with an older branch copy.

Security, legal, billing and schema migrations remain independently gated. Passing this architecture guard does **not** authorize applying SQL or enabling commercial flags.

## What CI should catch automatically

- accidental large source files;
- a new unreviewed runtime package;
- Web/Desktop dependency drift;
- a second Desktop service layer;
- privileged-secret references in Desktop source;
- a new oversized public asset;
- uncontrolled growth of total public assets;
- unusually large generated Next client JS;
- unusually large Windows dist or installer.

If a budget genuinely needs to change, update the JSON and explain why in the PR. Raising a limit silently defeats the guard.
