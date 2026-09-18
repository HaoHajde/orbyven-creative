# ORBYVEN Alpha Foundation

Checkpoint frozen on **2026-09-18** before the Alpha cleanup pass.

- Checkpoint branch: `checkpoint/orbyven-alpha-foundation-2026-09-18`
- Checkpoint commit: `a7746689fc760a10f570cf7512593b3c36dcd0e6`
- Canonical source of truth: `main`
- Framework baseline: Next.js 16.3 / React 19.2 / TypeScript strict mode
- Public pages are responsive. Separate `/mobile-*` implementations are legacy and must not be reintroduced.
- A valid integration must pass full ESLint, TypeScript typecheck, production build, architecture guard where applicable, and Vercel deployment.

## Alpha Foundation rules

1. Prefer one responsive implementation over device-specific duplicate pages.
2. Keep client-side code only where interaction requires it.
3. Avoid unused binary assets and duplicate branding files.
4. Respect module/platform/billing/public ownership boundaries.
5. New work must preserve mobile usability, reduced-motion behavior, and production build integrity.
6. Use the checkpoint branch only for rollback/reference; continue active work from the latest `main`.
