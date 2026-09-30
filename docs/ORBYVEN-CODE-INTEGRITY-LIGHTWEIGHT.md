# ORBYVEN — permanent Web + Windows code-integrity gate

Updated 30 September 2026 against the current product line (Intelligence 0.8.x / Desktop 0.4).

This gate protects **integrity, structure and lightweight delivery**. It is intentionally separate from security, legal and billing approval.

## Current baseline
- Web: 264 source files; **7** are above 35 KiB. A new eighth large file is blocked.
- Web hard cap: 70 KiB per source file.
- Desktop: 5 source files; one is above 35 KiB (`desktop/src/App.tsx`, ~49 KiB).
- Desktop hard cap: 55 KiB/source file; CSS cap 32 KiB.
- Public assets: ~13 MiB today; cap 15 MiB; new files default to 1 MiB maximum.
- Existing large-media exceptions remain only for the Diana & Florin demo MP3 and mobile background.
- Web runtime dependencies and Desktop runtime dependencies are explicit allowlists.
- React/Supabase versions must stay aligned between Web and Desktop.
- Generated Next static JS and Windows dist/installer have post-build ceilings.

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
Current large areas include `ClientTemplateSite.tsx`, `TasksModule.tsx`, `seo-foundation.ts`, `ControlCenter.tsx`, `app/servicii/page.tsx`, `WorkspaceIntelligence.tsx`, `HomePageClient.tsx`, and `desktop/src/App.tsx`.

Do not split them just to satisfy a number. Extract coherent responsibilities when feature work naturally enters those files.
