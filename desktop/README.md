# ORBYVEN Desktop v0.4.0 — shared workspace Windows application

ORBYVEN Desktop is a locally bundled Tauri/React application. Version 0.4 no longer maintains a simplified copy of the web dashboard: **web and Windows mount the same shared `WorkspaceShell`, `WorkspaceContent`, module components and business services**.

## Web ↔ Windows correlation

- Same Supabase project, Auth, RLS, organization membership, entitlements and module services.
- Same module UI components for Overview, Clients/Leads, Tasks/Works, Calendar, Estimates, Documents, Expenses and Team.
- Same specialized module panels, including the thermal sketch, commercial workflow, materials library and profitability views.
- Same `WorkspaceShell` for header, navigation, module manager, quick-create and responsive layout.
- Shared `lib/workspace-ui.ts` owns theme tokens, role labels, navigation groups and layout metrics.
- `/api/desktop/config` publishes only safe public bootstrap values plus the current workspace presentation config/revision.
- Desktop refreshes this presentation config on window focus and every 5 minutes, so theme/navigation/layout token changes can arrive without rebuilding the app.
- Changes to shared workspace/module files trigger the Windows installer GitHub workflow automatically.

This preserves a native installed app: Windows does **not** render `/workspace` as remote HTML.

## What still requires an application update

React/TypeScript structure, new compiled features and native/Tauri code still require a new installer. Secure unattended auto-update is intentionally not enabled until the Tauri updater signing key/release channel is configured. This is preferable to weakening update verification.

## Security

- Public bootstrap: Supabase URL + publishable key only. Never service-role, Stripe secret or privileged tokens.
- The authoritative `workspace_entry_state` check runs before private workspace reads.
- Shared data functions remain tenant-scoped and protected by Supabase RLS.
- Tauri capabilities stay empty; remote content receives no native IPC commands.
- Desktop auth has its own persistent session storage key.

## Developer build

Windows 10/11, Node 22, Rust MSVC, Microsoft C++ Build Tools and WebView2 are required.

```powershell
cd desktop
npm install
npm run check
npm run build
```

The build generates the original OC icon, branded NSIS artwork, shared Tailwind workspace CSS and the Windows installer.

Installer output:
`desktop/src-tauri/target/release/bundle/nsis/*-setup.exe`.

## Release requirements still open

- Real-device Windows QA: auth, all roles, entitlements, every shared module, document upload/download and specialized module flows.
- Windows code signing to remove Unknown Publisher / SmartScreen friction.
- Secure Tauri updater signing + durable release endpoint before enabling automatic binary updates.
