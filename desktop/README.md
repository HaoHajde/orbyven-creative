# ORBYVEN Desktop v0.3.0 — independent Windows application

This version replaces the v0.1 remote webpage wrapper with a **locally bundled React application** served from Tauri's own application origin. It runs as a standalone Windows program and is not a shortcut or remotely rendered website.

## Architecture

- Local UI: `desktop/src/App.tsx`, `desktop/src/styles.css` and Vite `dist/` embedded in the NSIS installer.
- Backend: exactly the same Supabase project as ORBYVEN Web, configured via `https://orbyven.ro/api/desktop/config`. This route publishes ONLY the existing public URL + publishable key. It must be deployed before first use.
- Authentication: desktop-specific session storage; password-based Supabase Auth. No password is packaged or logged. No public registration page is duplicated; onboarding is supported for authenticated accounts.
- Security: call the existing `workspace_entry_state` RPC BEFORE any company data. Reuse `getCurrentWorkspace()`, tenant-scoped module functions and Supabase RLS from the existing app. No service-role key or native command/IPC permissions.
- Modules: Overview, leads/clients, work/tasks, calendar, estimates, documents, expenses, team. List/detail UI, plus basic creation and appropriate status changes using existing shared module services; deeper web-specific editors and specialized workflows are not yet feature-parity complete.
- Connection: app UI still launches when backend is down, but login and online data operations require internet. No offline record writes or auto-updates in this Alpha.

## Developer build

Windows 10/11, Node 22, Rust MSVC, Microsoft C++ Build Tools and WebView2 are required.
From repo root:

```powershell
cd desktop
npm install
npm run check
npm run icons
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
- Do not claim full web feature parity: complex estimates and job relationships, specialized editors, invoicing and all other web-only features need separate desktop UI work.
- Add signed installers and secure desktop auto-update infrastructure before wide customer distribution.
- Never put Supabase service-role keys, Stripe secret keys or any privileged tokens in the desktop app or public bootstrap endpoint.

## Alpha 0.3 — matching the real web workspace

The desktop **keeps its own local React UI and installer**, but now imports the real ORBYVEN logo assets and aligns dark/light colors, orbital auth backdrop, typography, compact panels and top toolbar to `orbyven.ro/workspace`. There is a **single global + Creează** action, one global search for authorized CRM leads, tasks and estimates (tenant-scoped to the existing Supabase tables and current module availability), and direct record selection within the existing detail drawer. In-flight module reads are invalidated when changing modules so older responses cannot paint the wrong screen. Overview shortcuts cannot navigate to modules the account does not have.

This is deliberately not an iframe or a second remote-web wrapper. It is also **not a promise of 100% feature parity** with specialized web editors, accounting/billing, invitations or AI designer. The Windows app uses the same backend and should gradually converge on the real dashboard under RLS/role restrictions. The separate Security PR #106 must be tested and staged before release; do not bundle its unapproved SQL in desktop installers.

Design parity is validated by source contracts + bundled Windows CI, not by claiming a human visual or hardware QA session. Installer remains unsigned Alpha, with internet needed for live data. Do not put real QA credentials in files or workflow logs.
