ORBYVEN — MOBILE FINAL POLISH

This package is the final mobile consistency/performance pass.

Replace these paths:
- app/globals.css
- app/mobile-home/page.tsx
- app/mobile-servicii/page.tsx
- app/mobile-templates/page.tsx
- app/mobile-contact/page.tsx
- components/MobileControls.tsx
- components/MobilePageChrome.tsx
- components/MobileContactForm.tsx
- components/OrbitalSystem.tsx
- proxy.ts

What changed:
- responsive tuning for ~360 / 390 / 430 px
- consistent horizontal spacing and hero typography
- theme-aware orbital lines in both light/dark mode
- better touch feedback without heavy effects
- no blur/backdrop blur added
- heavy Diana & Florin demo is not prefetched automatically
- motion remains transform/opacity based
- contact Supabase remains dynamically loaded only at submit
- content-visibility stays enabled below the fold

After replacing:
git add .
git commit -m "Final mobile polish and responsive tuning"
git push

If VS Code shows stale TypeScript errors:
Ctrl+Shift+P -> TypeScript: Restart TS Server
