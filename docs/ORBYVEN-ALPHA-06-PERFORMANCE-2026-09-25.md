# ORBYVEN Alpha 0.6 — Code & Performance checkpoint

Date: 25 September 2026. Based on canonical `main` commit `118e8026a482836dff74b209632f8e099b707dd5`, including the separate security team's migrations and tests.

## Scope and before → after

| Area | Before | After |
|---|---|---|
| `/workspace` component graph | `WorkspaceContent.tsx` eagerly imports all 8 business modules | 8 top-level `next/dynamic` imports; only the active module renders; SSR retained, theme and props unchanged |
| `/templates` pilot #006–#013 previews | 8 frame elements exist when catalog renders; native iframe `loading="lazy"` | Each frame is not mounted until a card comes within 420px of the viewport; then it remains mounted and retains native lazy loading and script-only sandbox |
| Loading state | Immediate component imports | Nonintrusive status text inside the existing dashboard panel, with a 260px minimum skeleton |
| Regression safety | Previous ecosystem, billing, security, demo checks | An additional performance boundary test runs in both PR and main CI gates |

The counts above are **source-level before/after measurements, not measured mobile LCP, INP, bandwidth or bundle-size savings**. Avoid claims of an exact speedup or a Lighthouse score without the same device/network test before and after.

## Manual visual + functional QA matrix

1. At mobile 360px/390px and desktop 1366px, open /workspace as a test user: initial Overview, then each of the seven secondary modules, switch dark/light and open the bottom mobile module menu.
2. Navigate via global search into a lead, task and estimate; use a deep-linked create action and ensure selected record, role, and organization remain unchanged.
3. On /templates scroll past #006–#013; each card keeps its original dimensions and its preview appears before entering the viewport. Scroll away and back without resetting the iframe.
4. Enable reduced-motion in OS; check layout and no white flash at catalog transitions. Run with mobile network throttling and log actual route JS/network requests.
5. Use authenticated browser and separate tenant test accounts for security QA; PR source tests are not replacements for this.
6. Verify console errors, hydration, keyboard navigation and Core Web Vitals, including /templates on a low-powered phone, before asserting performance SLOs.

## Boundaries and release gate

No changes to auth, billing, legal notices, Supabase migrations or existing dashboard visual design. Architecture guard and all existing CI tests must remain green. Do not enable preview Vercel deployments; merge exactly once after validating against fresh main, then verify Vercel READY for the release commit. If the browser test detects regression, revert this one performance release without rolling back unrelated security changes.
