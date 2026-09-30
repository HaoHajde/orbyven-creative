# ORBYVEN — permanent Web + Windows code-integrity gate

Updated 30 September 2026 against the current product line (Intelligence 0.8.x / Desktop 0.5).

This gate protects **integrity, structure and lightweight delivery**. It is intentionally separate from security, legal and billing approval.

## Current baseline
- Web: 264 source files; **7** are above 35 KiB. A new eighth large file is blocked.
- Web hard cap: 64 KiB per source file.
- Desktop: 9 source files; **2** are above 35 KiB (`App.tsx` ~50.4 KiB and `styles.css` ~43.8 KiB). New 0.5 features are already split into `InventoryPanel`, `Intelligence`, `Search` and `ActivityCenter`; the gate blocks a third large Desktop source file.
- Desktop hard cap: 56 KiB/source file; CSS cap 48 KiB. These are containment ceilings for the existing 0.5 hotspots, not permission to keep growing them.
- Public assets: ~13 MiB today; cap 14 MiB; new files default to 768 KiB maximum.
- Existing large-media exceptions remain only for the Diana & Florin demo MP3 and mobile background.
- Web runtime dependencies and Desktop runtime dependencies are explicit allowlists.
- React/Supabase versions must stay aligned between Web and Desktop.
- Measured Web build: 2.32 MiB static JS total / 230.9 KiB largest chunk. Gate: 4 MiB total / 512 KiB single chunk.\n- Measured Windows build: 0.49 MiB dist / 1.92 MiB installer. Gate: 1.5 MiB dist / 4 MiB installer.

These values are **ceilings, not targets**. When a hotspot is refactored, lower the corresponding baseline instead of filling the freed space again.

## Structural rules
- Shared business logic stays in root `lib/`; Desktop must not create its own duplicate leads/tasks/estimates/documents/inventory/workspace service layer.
- Windows remains a locally bundled Tauri app, not a remote `orbyven.ro/workspace` wrapper.
- No privileged Supabase service-role or Stripe secret may appear in Desktop source.
- Web is the reference model for modules, permissions and data semantics. Desktop should reuse shared modules/types/services wherever practical.
- Before touching shared files, compare current `main` and active PRs. Do not replace a newer file with an older branch copy.

## CI
Source/dependency/media checks run before expensive builds:

```
npm run test:architecture
```

After the Web build:
```
node scripts/architecture-integrity.mjs --web-build-only
```

Windows source checks run **before** npm mutates/installs the Desktop dependency tree. After Tauri builds:
```
node scripts/architecture-integrity.mjs --desktop-build-only
```

## Hotspots to reduce when touched
Current large areas include `ClientTemplateSite.tsx`, `TasksModule.tsx`, `seo-foundation.ts`, `ControlCenter.tsx`, `app/servicii/page.tsx`, `WorkspaceIntelligence.tsx`, `HomePageClient.tsx`, `desktop/src/App.tsx`, and `desktop/src/styles.css`.

Do not split them just to satisfy a number. Extract coherent responsibilities when feature work naturally enters those files.
