# ORBYVEN Desktop v0.7.0 — independent Windows application

This Windows build ships a **locally bundled React application** served from Tauri's own application origin. Version 0.7.0 follows the actual online ORBYVEN workspace design, without rendering its remote webpage. It runs as a standalone Windows program and is not a shortcut or remotely rendered website.

## Architecture

- Parity 0.7: canonical WorkspaceSearch and WorkspaceActivityCenter are now rendered directly by Windows too; module metadata (labels, descriptions, badges and visual accents) is also supplied by the live UI manifest.\n- Parity 0.6: Windows renders the canonical web React modules directly for Overview, Leads, Tasks, Calendar, Estimates, Documents, Inventory, Finance and Team. The thermal module uses the same ThermalSketchPanel through a desktop adapter that removes only Next.js dynamic loading.
- Desktop AI bridge: `/api/desktop/ai/*` wraps the canonical ORBYVEN Intelligence routes with CORS required by the Tauri local origin; authorization still uses the user's Supabase bearer session and server-side organization checks.

- Live UI manifest: desktop reads `https://orbyven.ro/api/desktop/ui` at startup and whenever the window regains focus. Theme tokens, navigation groups and quick-create module IDs therefore follow the live website without reinstalling the app.
- Shared source of truth: web and desktop both consume `lib/workspace-visual-system.ts` for theme, layout, navigation and UI revision. Structural React changes still require a desktop release; the app surfaces when the live manifest version differs from the bundled version.

- Local shell: `desktop/src/App.tsx`, `desktop/src/styles.css` and Vite `dist/` embedded in the NSIS installer. Module UI is no longer duplicated: `desktop/src/WorkspaceModules.tsx` imports the real components from `components/modules/`, with Tailwind v4 compiled by the desktop Vite build.
- Backend: exactly the same Supabase project as ORBYVEN Web, configured via `https://orbyven.ro/api/desktop/config`. This route publishes ONLY the existing public URL + publishable key. It must be deployed before first use.
- Authentication: desktop-specific session storage; password-based Supabase Auth. No password is packaged or logged. No public registration page is duplicated; onboarding is supported for authenticated accounts.
- Security: call the existing `workspace_entry_state` RPC BEFORE any company data. Reuse `getCurrentWorkspace()`, tenant-scoped module functions and Supabase RLS from the existing app. No service-role key or native command/IPC permissions.
- Branded Windows installer: ORBYVEN OC installer/uninstaller icon, navy-violet header, orbital welcome/finish artwork and ORBYVEN Start Menu folder.
- Web-parity experience: original OC SVG, shared theme/navigation manifest, the same module components, Ctrl+K navigation, record search, Activity Center, ORBYVEN Intelligence and owner/admin module manager.
- Modules: Overview, Clients, Work/Orders/Tasks, Calendar, Estimates, Documents, Inventory, Finance, Team and Thermal Planner. Except for the thin thermal loading adapter, their business UI and workflows come from the same React components used by the live web workspace.
- Connection: app UI still launches when backend is down, but login and online data operations require internet. No offline record writes or auto-updates in this Alpha.

## Developer build

Windows 10/11, Node 22, Rust MSVC, Microsoft C++ Build Tools and WebView2 are required.
From repo root:

```powershell
cd desktop
npm install
npm run check
npm run icons
npm run installer:brand
npm run dev
npm run build
```

Compiled local assets: `desktop/dist/`. Installer:
`desktop/src-tauri/target/release/bundle/nsis/*-setup.exe`.

## GitHub CI

On desktop-related PRs the `ORBYVEN Desktop Windows` workflow runs local-UI contract tests, TypeScript, bundled-Vite build and Tauri Windows NSIS installer creation, then uploads an artifact.

## Remaining release requirements

- Verify `/api/desktop/config` is live after web deployment and Supabase publishable key is configured.
- Test the installed Windows app on real hardware: login, roles, suspended company, profile, CRUD, document upload/download, signed links, reconnect and window behavior.
- Keep browser-only/native-mobile-only capabilities explicitly separated, but ordinary workspace module changes should now flow into both web and desktop from the same component source.
- Add signed installers and secure desktop auto-update infrastructure before wide customer distribution.
- Never put Supabase service-role keys, Stripe secret keys or any privileged tokens in the desktop app or public bootstrap endpoint.
