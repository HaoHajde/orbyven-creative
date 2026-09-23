# ORBYVEN — SEO technical + content v2 (23.09.2026)

## Scop
Creșterea vizibilității pentru numele ORBYVEN CREATIVE, web design/creare site și trei intenții distincte: invitații nuntă, invitații botez, invitații majorat. Nicio poziție sau afișare specială în Google nu este garantată.

## Modificări cod
- Canonical `/` se declară doar pe pagina principală, nu global; metadata Open Graph homepage nu se propagă automat în pagini diferite.
- `getSiteUrl` nu mai folosește automat un domeniu Vercel ca alternativă pentru canonical și sitemap.
- Favicon OC PNG 96x96 la `/branding/orbyven-favicon-96.png`, păstrând iconițele ICO și SVG existente.
- Homepage include text clar despre trei tipuri de invitații, cu pagini accesibile direct. Header/tema vizuală premium rămân neschimbate.
- `/invitatii-nunta`, `/invitatii-botez`, `/invitatii-majorat` au conținut individual, întrebări frecvente vizibile și date structurate `Service`, `WebPage` și `BreadcrumbList` veridice.
- Linkuri contextuale din `/servicii`, `/templates` și footer; sitemap actualizat.
- Oferta JSON-LD descrie servicii reale, fără recenzii, prețuri sau evaluări inventate.

## După deploymentul consolidat
1. Confirmă că homepage și cele trei pagini de invitații răspund 200, au canonical distinct și sunt accesibile fără autentificare.
2. Verifică `https://orbyven.ro/branding/orbyven-favicon-96.png`, `/favicon.ico`, `/robots.txt`, `/sitemap.xml` fără redirecturi sau blocări.
3. În Search Console, inspectează `/`, `/servicii`, `/invitatii-nunta`, `/invitatii-botez`, `/invitatii-majorat` și solicită indexare doar după verificarea deploymentului.
4. Retrimite sitemap-ul `https://orbyven.ro/sitemap.xml`; nu înseamnă indexare garantată.
5. Verifică în Search Console excluse/canonical ales de Google, erori Core Web Vitals și interogări de brand vs. non-brand. Așteaptă date suficiente, apoi compară perioade egale de 28 zile.

## Măsurare
- Brand: impresii/clickuri pentru `orbyven` și `orbyven creative`.
- Servicii: impresii/clickuri pentru `web design`, `creare site`, `site de prezentare` și `web design București`, segmentate după landing page.
- Evenimente: impresii/clickuri pentru `invitații nuntă`, `invitații botez`, `invitații majorat` plus expresii legate de `digitale`, fiecare pe URL-ul său.
- Calitate trafic: cereri reale / mesaje / RSVP demo explicite, nu doar poziție.
- Nu crea pagini de localitate sau cuvinte-cheie artificiale și nu declara prețuri, testimonialuri sau firmă locală cu adresă neverificată.

## Restant
Datele/Search Console proprietății nu au fost disponibile prin integrarea GSC Wizard în sesiunea SEO v2. Nu pretindem audit live, indexare sau creștere de trafic fără datele respective.
