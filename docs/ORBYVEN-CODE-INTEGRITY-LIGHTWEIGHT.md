# ORBYVEN — permanent code integrity & lightweight gate

Updated **2 October 2026** for the current shared Web/Desktop architecture.

The gate protects four things on every future change: code integrity, reusable structure, lightweight delivery and Web/Desktop parity without duplicating business logic.

## Current baseline

### Web
- 275 source files in `app/`, `components/` and `lib/`.
- 11 files are above 35 KiB; a twelfth is blocked.
- Hard per-file ceiling: **64 KiB**.
- Largest current hotspot: `ClientTemplateSite.tsx` ~60.8 KiB.
- Other large areas include Tasks, Inventory, SEO foundation, Calendar, Control Center, Intelligence, Leads, Services, Expenses and Homepage.

### Windows Desktop — shared shell
The latest Desktop refactor is a major structural improvement:
- 10 local Desktop source files.
- **0 files above 35 KiB**.
- `desktop/src/App.tsx` is now ~10 KiB.
- `desktop/src/styles.css` is now ~4.4 KiB.
- Desktop hard per-file ceiling: **24 KiB**.
- Desktop CSS ceiling: **16 KiB**.
- Any return to a 35+ KiB local Desktop monolith is blocked.

The intent is clear: business modules and behavior belong in shared Web/root code; the Windows project should remain a thin native/local shell and adapter layer.

### Assets and generated payload
- `public/` ~12.96 MiB; hard ceiling **14 MiB**.
- New public assets default to **768 KiB max**, except explicitly reviewed legacy/demo files.
- Next generated JavaScript ceiling: **4 MiB total / 512 KiB per chunk**.
- Windows generated dist ceiling: **2 MiB**.
- Windows installer ceiling: **4 MiB**.

These are ceilings, not targets. If a refactor shrinks a hotspot, lower the baseline rather than consuming the freed space again.

## Structural rules
- Shared business logic stays in root `lib/` and shared components.
- Desktop must not create duplicate leads/tasks/calendar/estimates/documents/expenses/inventory/team/workspace services.
- Desktop remains locally bundled Tauri, never a remote `orbyven.ro/workspace` wrapper.
- No service-role, Stripe secret or privileged server token may appear in Desktop source.
- Runtime dependencies are allowlisted; shared React/Supabase versions must remain aligned.
- Before editing a shared file, compare current `main` and active PRs; never overwrite newer work with an older snapshot.

## CI
Before expensive builds:
```bash
npm run test:architecture
```

After Next build:
```bash
node scripts/architecture-integrity.mjs --web-build-only
```

After Windows/Tauri build:
```bash
node scripts/architecture-integrity.mjs --desktop-build-only
```

Source sizes normalize CRLF/LF so Windows checkout cannot inflate source budgets. Bundle/media budgets use real bytes.

Security, legal, billing and schema migrations remain independently gated. Passing this architecture gate never authorizes a database or commercial deployment.
