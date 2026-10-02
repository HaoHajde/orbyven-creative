# ORBYVEN — permanent code integrity & lightweight gate

Updated **2 October 2026** against current ORBYVEN Web and **Desktop 0.7.0**.

This is a regression gate, not a cleanup score. It protects four properties on every future change:

1. **Integrity** — new work must not silently overwrite newer work, weaken tenant/role boundaries or let stale data paint another screen.
2. **Structure** — shared business logic remains in root `lib/` and shared components; Desktop must not grow a second service layer.
3. **Lightweight delivery** — source hotspots, runtime dependencies, public assets, generated Web JavaScript and Windows bundle size all have explicit ceilings.
4. **Web/Desktop parity without duplication** — Desktop can have a native/local Tauri shell, but shared modules, rules, types and services should be reused.

## Baseline captured from current main

### Web
- 274 source files in `app/`, `components/` and `lib/`.
- **11 files above 35 KiB**. The gate allows those existing hotspots but blocks a twelfth.
- Per-file hard ceiling: **64 KiB**.
- Current largest file: `ClientTemplateSite.tsx` ~60.8 KiB.
- Other hotspots include `TasksModule.tsx`, `InventoryModule.tsx`, `seo-foundation.ts`, `CalendarModule.tsx`, `ControlCenter.tsx`, `WorkspaceIntelligence.tsx`, `LeadsModule.tsx`, `servicii/page.tsx`, `ExpensesModule.tsx` and `HomePageClient.tsx`.

### Windows Desktop 0.7
- 9 Desktop source files.
- `App.tsx` has been reduced to ~31 KiB — a meaningful structural improvement.
- Only **one** Desktop file remains above 35 KiB: `styles.css` at ~48.4 KiB.
- Desktop per-file ceiling: **52 KiB**.
- Desktop CSS ceiling: **52 KiB**.
- A second Desktop file above 35 KiB is blocked.

### Assets and generated payload
- `public/` is ~12.96 MiB today; hard ceiling **14 MiB**.
- New public assets default to **768 KiB max** unless explicitly reviewed.
- Existing exceptions remain only for the Diana & Florin demo MP3 and mobile background.
- Web generated JavaScript ceiling: **4 MiB total / 512 KiB single chunk**.
- Windows generated dist ceiling: **1.5 MiB**.
- Windows installer ceiling: **4 MiB**.

These values are ceilings, not targets. When refactors shrink a hotspot, the baseline should be lowered instead of reusing the recovered budget.

## Dependency rules
Runtime dependencies are allowlisted. Adding a new runtime package requires an explicit reviewable budget change.

React, React DOM and Supabase versions shared between Web and Desktop must remain aligned.

Desktop must not:
- contain Supabase service-role, Stripe secret or other privileged server keys;
- turn into a remote `https://orbyven.ro/workspace` wrapper;
- duplicate root service files such as leads/tasks/calendar/estimates/documents/expenses/inventory/team/workspace;
- introduce heavy Web-only runtime dependencies merely to reproduce presentation effects.

## CI
Source/dependency/media checks run before expensive build work:

```bash
npm run test:architecture
```

After Next production build:

```bash
node scripts/architecture-integrity.mjs --web-build-only
```

Windows source checks run before Rust/Tauri build. After installer creation:

```bash
node scripts/architecture-integrity.mjs --desktop-build-only
```

Source size is normalized to LF before measuring, so Windows CRLF checkout cannot create false positives. Asset and bundle sizes remain real byte sizes.

## Multi-chat rule
Before changing a shared file, compare current `main` and active PRs. Compose overlapping changes; never replace newer code with an older branch snapshot.

Security, legal, billing and schema migrations remain independently gated. Passing this architecture guard never authorizes a database or commercial deployment.


## v6 — hotspot freeze + workspace chunking

The guard now also freezes explicit ceilings for today's largest files. This is stricter than a global file-count limit: a hotspot that is already large may not quietly grow up to the global hard cap. When one of these files needs substantial new behavior, extract a coherent responsibility instead of raising its ceiling.

The dashboard module boundary is also structural: Calendar, Documents, Estimates, Expenses, Inventory, Leads, Overview, Tasks, Team and Thermal Planner must remain loaded through `next/dynamic` in `WorkspaceContent.tsx`. This keeps inactive modules out of the initial dashboard client path and prevents future feature work from accidentally turning the workspace back into one large JavaScript bundle.

These checks protect architecture, not just byte counts. A budget increase must remain an explicit reviewed code change.
