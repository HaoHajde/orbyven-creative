# ORBYVEN Alpha 0.1 — 23.09.2026

**Status:** release checkpoint pentru testare pilot; nu declarație de GA sau certificare a fluxurilor live.  
**Repository:** `HaoHajde/orbyven-creative`  
**Codul de pornire verificat:** `c6a8678200633741a76f956b4670d24c46a6f3d9` (22.09.2026)  
**Versiune npm:** `0.1.0` (deja existentă; nu necesită bump de dependințe)  
**Branch de arhivă:** `checkpoint/orbyven-alpha-0.1-2026-09-23` — se fixează pe commitul final de release, după integrarea documentației.  
**Sursa activă pentru dezvoltare:** ultimul `main`; checkpoint-ul este pentru referință/rollback, nu branch de lucru.

## 1. Linia de evoluție verificată

| Moment | Commit / reper | Ce intră în Alpha 0.1 |
| --- | --- | --- |
| 18.09, înainte de cleanup | `a7746689fc760a10f570cf7512593b3c36dcd0e6` | Alpha Foundation veche, păstrată la `checkpoint/orbyven-alpha-foundation-2026-09-18`. |
| 18.09, curățare | PR #67, `bf453d72e02ce77d470abb8e496f6ae9a0cd56ce` | O singură versiune responsive, cod legacy/asset-uri eliminate, full lint și typecheck obligatorii. |
| 18.09, securitate | PR #70, `1c4b5e62aa751d8c106f102e089f6ff41e7c8f42` | Patch Next/Sharp/js-yaml; audit high/critical verde în jobul de patch. |
| 18.09, dashboard | `8dd1ffc3e94536d02e058c3539f51eaf1b5fcc9b` | Fundația vizuală business/minimalistă aplicată peste cleanup. |
| 22.09, identitate SEO | `c6a8678200633741a76f956b4670d24c46a6f3d9` | Explicarea ORBYVEN în homepage/despre și aliasul de brand din structured data. |
| 23.09, Alpha 0.1 | Acest raport + branch de checkpoint | Integrare și înghețare documentată a stării, fără revert al muncii dintre 18 și 22 septembrie. |

## 2. Ce există în cod la Alpha 0.1

### Site public, SEO și demo-uri

- Homepage, servicii, contact, catalogul de template-uri, cerere proiect și rutele de demo.
- Template-uri de nuntă, botez fetiță, botez băiețel, majorat și piloți: evenimente/Obsidian, instalații/Pilot #002, asfaltări/VIAFORTE, florărie, detailing/Hao's Customs.
- SEO Foundation v2: `/creare-site`, `/site-prezentare`, `/web-design-bucuresti`, `/redesign-site`, landing-uri de nișă, `/solutii`, `/studii-de-caz`, `/ghid`, `/despre`; sitemap, canonicals, metadata și date structurate conform `docs/seo/SEO-FOUNDATION-V2.md`.
- Clarificarea din 22.09 folosește public `ORBYVEN CREATIVE` și aliasul `ORBYVEN`, cu descriere explicită de web design + software modular pentru afacerile din România. Nu schimbăm automat numele public în `ORBYVEN STUDIO` fără decizie de branding separată.

### Workspace și module

- Auth, recovery/invite/onboarding, stare de acces, profil organizație și modularitate; Control Center și rute de billing prezente.
- Registry canonic: `overview`, `leads`, `tasks`, `calendar`, `estimates`, `documents`, `expenses`, `team`.
- Dashboard reproiectat: fundal ambiental discret, header și sidebar compacte, panou de lucru unificat, module cu carduri compacte, mod luminos/întunecat și navigare adaptată mobilului.
- Overview utilizează `loadOverviewSnapshot(organizationId)`, care cere datele din tabelele organizației pentru leads, tasks, events, estimates, expenses, documents și echipă. Arată acțiuni rapide, metrici, priorități și business snapshot; butonul Actualizează reîncarcă datele. Nu îl descriem ca sincronizare realtime sau automatizare AI.
- Codul modulelor și migrațiile multi-tenant/RLS există în repository. Prezența lor în Git nu dovedește că toate migrațiile au fost aplicate pe proiectul Supabase production sau că fiecare flux a fost testat cu utilizatori reali.

## 3. Ce rămâne din cleanup-ul Alpha Foundation

- Eliminate 21 de fișiere legacy/duplicate, inclusiv `/mobile-home`, `/mobile-templates`, `/mobile-servicii`, `/mobile-contact`, componente auxiliare și proxy-ul inert.
- Codul public este responsiv într-o singură versiune; CSS-ul de performanță mobilă este centralizat; există optimizări pentru conținut off-screen și `prefers-reduced-motion`.
- Au fost corectate 6 erori de full ESLint (admin, Control Center, cookie consent și Pilot #005), plus navigația internă în Pilot #005.
- CI include lint complet, `tsc --noEmit` și `next build`; `npm run validate` le rulează împreună.
- Arboreul de dependințe din `main` verificat pentru release: Next.js `16.3.3`, eslint-config-next `16.3.3`, Sharp `0.35.4`, js-yaml `4.3.2`. Patch job-ul din 18.09 a trecut `npm audit --audit-level=high`; nu îl prezentăm drept audit de penetrare.

## 4. Validare verificată la 23.09.2026

Pe commitul de pornire `c6a8678200633741a76f956b4670d24c46a6f3d9`:
- ORBYVEN CI: success — [run 35719585077](https://github.com/HaoHajde/orbyven-creative/actions/runs/35719585077).
- ORBYVEN Quality Gate: success — [run 35719584968](https://github.com/HaoHajde/orbyven-creative/actions/runs/35719584968).
- ORBYVEN Integration Train: success — [run 35719584967](https://github.com/HaoHajde/orbyven-creative/actions/runs/35719584967).
- GitHub Vercel commit status: success — [deployment](https://vercel.com/orbyven-creative/orbyven/BZvSBUYM67FDQRkBj82Pz8FDuLPq).
- Comparația față de release-ul curățat `1c4b5e62` arată doar 8 fișiere schimbate: dashboard + brand/SEO; niciun nou `/mobile-*` și nicio schimbare de dependency manifest/lockfile.

**Limită importantă:** verificarea live prin conectorul Vercel a răspuns cu 403 pentru scope-ul proiectului; URL-urile publice nu au putut fi încărcate prin verificarea web disponibilă. Statusurile GitHub/Vercel și build-ul nu substituie testele de browser, responsive, Core Web Vitals, auth real, plăți reale, SQL RLS sau livrarea efectivă a emailurilor.

## 5. Riscuri și lucrări deschise — nu sunt mascate de eticheta Alpha

1. Test end-to-end în production/staging cu organizație pilot: creare cont → email confirm → onboarding → workspace → activare module → izolare între doi clienți.
2. Confirmare migrații Supabase, politici RLS și verificarea suspendării membrilor/organizațiilor; rulat `supabase/tests/20260907_platform_core_v2_rls.sql` într-un mediu adecvat.
3. Stripe webhook, entitlement enforcement, facturare, prețuri/TVA și documente legale: necesită validare operațională și, unde e cazul, fiscal-juridică; existența rutelor nu înseamnă conformitate certificată.
4. Test manual pe iPhone/Android și desktop pentru dashboard, preview-uri și piloți; măsurare reală a LCP/CLS/INP și testare cu reduced motion. Ultimul redesign folosește blur pe panoul workspace și trebuie măsurat pe dispozitive modeste.
5. Măsurarea SEO din Search Console după indexare; paginile/metadata implementate nu înseamnă poziții garantate sau toate URL-urile indexate.
6. PR-uri vechi deschise: #34 (perf), #55 (Pilot #005) și #63 (cleanup). Nu se integrează orb peste `main`; fiecare trebuie comparat pentru schimbări unice, apoi închis sau reconstruit pe `main` dacă mai e relevant.

## 6. Reguli de lucru pentru Alpha 0.1

- `main` rămâne singura sursă activă; branch-ul `checkpoint/orbyven-alpha-0.1-2026-09-23` este snapshot de rollback.
- Nu readucem rutele /mobile-*, asset-uri demo nefolosite sau proxy inert; nu ștergem media reală folosită de demo/piloți.
- Păstrăm separarea Public + SEO / Platform Core + Auth / Workspace + Modules / Billing + Legal.
- Fără date inventate în studii de caz sau metrici demo prezentate ca date live.
- După acest checkpoint: alpha 0.2 poate urmări verificarea E2E a pilotului, acces module/entitlements, audit vizual pe mobil și măsurători de performanță. Orice release următor trebuie să indice commitul exact, starea testelor și problemele nerezolvate.
