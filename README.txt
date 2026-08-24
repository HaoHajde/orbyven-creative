ORBYVEN — FINAL LAUNCH AUDIT FIXES

This ZIP contains ONLY the files changed by the final launch audit.
Copy them over the matching project paths.

FILES
- app/page.tsx
- app/templates/page.tsx
- app/contact/page.tsx
- app/layout.tsx
- app/sitemap.ts
- components/MobileContactForm.tsx
- lib/orbyven-supabase.ts

FIXED

1. DESKTOP HOME — BROKEN ROUTE
Old:
  /templates/business

New:
  /templates

The old route was the source of the previous "business:1 404" console issue.

2. DESKTOP HOME — HEAVY LIVE IFRAMES REMOVED
The homepage no longer automatically embeds full project websites inside
portfolio cards.

Why:
The Diana & Florin iframe was previously capable of loading:
- the invitation app
- ~6.9 MB music.mp3
- ~2 MB background image
- child-page JavaScript

The visual preview is now the existing lightweight ProjectVisual component.
Clicking the card still opens the real project.

3. PORTFOLIO DEMO PREFETCH DISABLED
The heavy Diana & Florin project is no longer automatically prefetched from:
- desktop homepage project cards
- desktop Templates live project

The project still opens normally when clicked.

4. CONTACT SUPABASE IS NOW LAZY
Desktop Contact no longer imports the Supabase client in the initial page bundle.
It loads only when the user actually submits the form.

Mobile already behaved this way and now uses the same ORBYVEN-facing import.

5. ORBYVEN SUPABASE NAMING SHIM
Added:
  lib/orbyven-supabase.ts

This safely exposes:
  orbyvenSupabase

while keeping the existing working historical client untouched internally.
No need to rename the old Supabase file yet.

6. ACCESSIBILITY
Contact success/error messages use aria-live="polite" where matched.

7. SEO
Added canonical "/" to root metadata.

8. SITEMAP
Removed dynamic lastModified=new Date().
A sitemap should not tell crawlers that every page changed every time it is requested.

UNCHANGED ON PURPOSE
- current desktop design
- current mobile design
- ORBYVEN orbital system
- pricing
- WARP
- proxy/mobile rewrite
- Supabase database structure
- Vercel configuration

GIT
git add .
git commit -m "Apply final launch audit fixes"
git push

AFTER DEPLOY — QUICK CHECK
1. Home desktop loads without pulling music.mp3.
2. Home business project opens /templates, not a 404.
3. Diana & Florin opens only when clicked.
4. Contact form still submits successfully.
5. /sitemap.xml still opens.
6. Browser console has no red ORBYVEN app errors.

If VS Code shows a stale import error:
Ctrl + Shift + P
TypeScript: Restart TS Server
