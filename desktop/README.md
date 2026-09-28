# ORBYVEN Desktop v0.4.0 — independent Windows application

This Windows build ships a **locally bundled React application** served from Tauri's own application origin. Version 0.4 follows the actual online ORBYVEN workspace design, without rendering its remote webpage. It runs as a standalone Windows program and is not a shortcut or remotely rendered website.

## Architecture

- Local UI: `desktop/src/App.tsx`, `desktop/src/styles.css` and Vite `dist/` embedded in the NSIS installer.
- Backend: exactly the same Supabase project as ORBYVEN Web, configured via `https://orbyven.ro/api/desktop/config`. This route publishes ONLY the existing public URL + publishable key. It must be deployed before first use.
- Authentication: desktop-specific session storage; password-based Supabase Auth. No password is packaged or logged. No public registration page is duplicated; onboarding is supported for authenticated accounts.
- Security: call the existing `workspace_entry_state` RPC BEFORE any company data. Reuse `getCurrentWorkspace()`, tenant-scoped module functions and Supabase RLS from the existing app. No service-role key or native command/IPC permissions.
- Branded Windows installer: ORBYVEN OC installer/uninstaller icon, navy-violet header, orbital welcome/finish artwork and ORBYVEN Start Menu folder.
- Web-inspired experience: original OC SVG, dark/light brand tokens, 65px global header, compact grouped sidebar, Ctrl+K module palette, website-like quick-create, owner/admin module manager, four KPI cards, operations ring and workflow card.
- Live UI contract: the installed app reads `https://orbyven.ro/api/desktop/ui` on startup/focus and caches the validated public contract. Theme tokens, navigation groups, create actions and shell copy can therefore follow the live web workspace without shipping remote executable code.
- Web source parity: the Planșă Termică editor is copied from the exact `public/thermal-planner/index.html` used by the website every time the desktop app is built.
- Modules: Overview, clients/leads, work/tasks, calendar, estimates, documents, expenses, Planșă Termică and team. They use the same Supabase tenant data, RLS, module entitlements and workspace roles.
- Connection: the app shell and last valid UI contract remain available locally, but authentication and workspace data operations require internet. UI contract changes are picked up on the next app launch/focus; structural React/code changes still require a desktop release.

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
- Keep complex editors and workflow details under parity review as the web product evolves. The shared UI contract prevents shell drift, while structural feature changes still need a desktop release.
- Add signed installers and secure desktop auto-update infrastructure before wide customer distribution.
- Never put Supabase service-role keys, Stripe secret keys or any privileged tokens in the desktop app or public bootstrap endpoint.
