# ORBYVEN

**ORBYVEN Alpha 0.1 — 23.09.2026** · web design și software modular pentru afaceri din România.

ORBYVEN combină site-uri publice și template-uri personalizabile cu un workspace pentru firme. Produsul este în **Alpha / pilot validation**: prezența codului sau a rutelor nu echivalează cu un test complet pe un client real.

## Release și checkpoint-uri

- **[Alpha 0.1 — 23.09.2026](docs/releases/ORBYVEN-ALPHA-0.1-2026-09-23.md)** — raport consolidat: curățare, dashboard, SEO, securitate, teste, limite și pașii următori.
- [Alpha Foundation — 18.09.2026](ALPHA-FOUNDATION.md) — baseline-ul istoric, păstrat pentru rollback.
- `checkpoint/orbyven-alpha-0.1-2026-09-23` — snapshot de release; dezvoltarea continuă din `main`.

## Ce include repository-ul

- **Public:** homepage, servicii, contact, ofertare/cerere proiect, template-uri și demo-uri pentru piloți.
- **SEO:** landing pages, ghiduri și studii de caz; vezi [SEO Foundation v2](docs/seo/SEO-FOUNDATION-V2.md).
- **Workspace:** autentificare, onboarding, Control Center și modulele Overview, Clienți, Lucrări, Calendar, Oferte, Documente, Cheltuieli și Echipă.
- **Platform Core:** multi-tenancy Supabase, RLS, permisiuni, provisionare și lifecycle; vezi [Platform Core v2](docs/platform-core-v2.md).
- **Billing/Legal:** infrastructură și rute de abonare, nu o atestare a validării fiscale sau juridice.

## Politica Vercel Hobby

Branch-urile de dezvoltare nu declanșează Preview deployments automat; doar `main` declanșează producția, iar modificările se livrează grupat după CI. Vezi [politica de deploy Vercel Free](docs/VERCEL-FREE-DEPLOY-POLICY.md) și `vercel.json`.

## Dezvoltare locală

Necesită Node.js 22 și npm. Configurează variabilele de mediu necesare pentru Supabase, billing și celelalte servicii folosite de funcțiile pe care le testezi, fără să comiți secrete.

```bash
npm ci
npm run dev
```

Validare înainte de PR:

```bash
npm run validate
npm audit --audit-level=high
```

`npm run validate` execută lint complet, `tsc --noEmit` și build-ul Next.js.

## Reguli

Lucrează pe un branch nou din ultimul `main`. Păstrează o singură versiune responsive pentru paginile publice, respectă limitele între module și folosește `organization_id` + RLS pentru datele clienților. Nu reutiliza branch-uri de checkpoint pentru dezvoltare activă și nu integra automat PR-uri vechi fără comparație cu `main`.

Pentru starea exactă, validarea efectuată și testele pilot încă necesare, citește [raportul Alpha 0.1](docs/releases/ORBYVEN-ALPHA-0.1-2026-09-23.md).
