# ORBYVEN — permanent code integrity & lightweight gate

Updated **2 October 2026** against current `main`.

## What this gate protects
Every change must preserve code integrity, reusable structure, lightweight delivery and Web/Desktop parity without recreating business logic in two places.

### Web baseline
- 277 source files in `app/`, `components/` and `lib/`.
- 11 files above 35 KiB; a twelfth is blocked.
- Hard per-file ceiling: **64 KiB**.
- `TasksModule.tsx` is now ~63.3 KiB and therefore intentionally sits right below the ceiling. Further material growth should extract coherent responsibilities rather than raise the limit.
- Other hotspots: `ClientTemplateSite.tsx`, Inventory, SEO foundation, Calendar, Control Center, Leads, Intelligence, Services, Expenses and Homepage.

### Windows Desktop baseline
The shared-shell refactor remains healthy:
- 10 local Desktop source files.
- **0 local files above 35 KiB**.
- `App.tsx` ~10 KiB.
- `styles.css` ~4.4 KiB.
- Desktop hard ceiling: **24 KiB/file**.
- Desktop CSS ceiling: **16 KiB**.
- Returning to a 35+ KiB local Desktop monolith is blocked.

### Payload ceilings
- `public/` hard ceiling: **14 MiB**.
- New public assets: **768 KiB max** unless explicitly reviewed.
- Next static JavaScript: **4 MiB total / 512 KiB single chunk**.
- Desktop dist: **2 MiB**.
- Windows installer: **4 MiB**.

These are ceilings, not targets. When a refactor shrinks a hotspot, lower the baseline instead of consuming the recovered budget.

## Structural rules
- Shared business logic stays in root `lib/` and shared components.
- Desktop must not duplicate root services for leads/tasks/calendar/estimates/documents/expenses/inventory/team/workspace.
- Desktop remains a locally bundled Tauri app, never a remote `orbyven.ro/workspace` wrapper.
- Privileged Supabase/service-role, Stripe or server secrets are forbidden in Desktop source.
- Runtime dependencies are allowlisted; React/Supabase shared versions must remain aligned.
- Before editing shared files, compare current `main` and active PRs; never overwrite newer work with an older snapshot.

## CI
Source/dependency/media checks:
```bash
npm run test:architecture
```

Post-Next-build payload check:
```bash
node scripts/architecture-integrity.mjs --web-build-only
```

Post-Tauri-build payload check:
```bash
node scripts/architecture-integrity.mjs --desktop-build-only
```

Source sizes normalize CRLF/LF, so Windows checkout cannot inflate source budgets. Assets and bundles are measured in real bytes.

Security, legal, billing and schema migrations stay independently gated. Passing this architecture gate never authorizes database or commercial deployment.
