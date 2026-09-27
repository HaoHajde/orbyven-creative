# ORBYVEN Desktop — Windows alpha

This is a **standalone Windows shell for the existing ORBYVEN workspace**, not a second implementation of the dashboard.

- Entry: `https://orbyven.ro/workspace` (the Next.js route in `app/workspace/page.tsx`).
- Login: the existing `/workspace/login`, using the same Supabase auth and multi-tenant access checks.
- UI and data: loaded from the current deployed ORBYVEN app; no web frontend or secrets are packaged.
- Windows WebView2: used by Tauri instead of bundling Chrome/Edge. It opens as a standalone Windows application.
- Security: no Tauri native commands/plugins/capabilities are exposed to remote web content.
- Network: internet is required. No offline editing or native file-system access is promised in alpha.
- The standalone app has its own cookie/session store. Logging in to Chrome does not automatically log the app in.
- Brand icon: generated from `../app/icon.svg`, the original OC icon used by the website.

## Local Windows build

Prerequisites: Windows 10/11, Node.js 22, Rust stable (MSVC), Microsoft C++ Build Tools and WebView2. See the [Tauri Windows prerequisites](https://v2.tauri.app/start/prerequisites/).

From the repository root:

```powershell
cd desktop
npm install
npm run check
npm run icons
npm run dev
npm run build
```

The NSIS `*-setup.exe` installer is generated under
`desktop/src-tauri/target/release/bundle/nsis/`.

## CI installer

`.github/workflows/desktop-windows.yml` runs on a Windows GitHub Actions runner for desktop-related pull requests and uploads the installer as a workflow artifact. It **does not deploy the website to Vercel or publish a public GitHub release**.

## Alpha scope and release blockers

1. Test login, sign-out, registration, workspace permissions, file exports/downloads, links to other domains and payment redirects inside WebView2 on a real Windows device.
2. Validate the configured origin and live availability of `/workspace`; `app.orbyven.ro` is not used here until it actually hosts the route.
3. Add OS integration (notifications, startup behavior, deep links) only after individually scoping native permissions.
4. Set up signed installers, a secure update channel, and release management before distributing to paying customers.
5. If a future requirement is offline use, add an explicit local cache and conflict-handling design rather than assuming a remote WebView is offline-capable.

Never add Supabase service-role keys, Stripe secrets or other privileged tokens to this application.
