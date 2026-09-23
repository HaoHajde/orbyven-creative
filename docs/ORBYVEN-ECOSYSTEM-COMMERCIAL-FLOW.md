# ORBYVEN — Ecosistem comercial / contract de dependențe

**Status: draft de arhitectură + preview local; NEPUBLICAT.** Acest branch nu
modifică `main`, baza de producție, Vercel sau ANAF. Nu există facturi emise.

## Descoperiri verificate (2026-09-23)

- `crm_leads`: client / lead și follow-up.
- `ops_tasks`: lucrare, context client și progres.
- `sales_estimates` / `sales_estimate_items`: deviz/ofertă simplă, linie cu
  descriere, cantitate și preț de vânzare; nu există încă `kind`, `unit`,
  cost de achiziție, identificator de material sau versiune imuabilă.
- `ops_documents`: fișier privat legat de client/lucrare/deviz.
- `finance_expenses`: cheltuială operațională; nu este factură de vânzare.
- `organization_modules`: activări pe firmă; entitlements/billing rămân
  într-un strat separat și nu pot fi ocolite din interfața modulelor.
- Există deja `ops_material_recipes`, `ops_material_recipe_items` și
  `sales_material_requirements`: recetă de materiale, poziții cu unități
  și costuri, respectiv necesar legat de `sales_estimates` și opțional
  de `sales_estimate_items`. Au politici RLS și `organization_id`.
  **Acest branch adaugă primul serviciu și panoul de necesar materiale în
  detaliul devizului**; integrarea cu rețetele automate rămâne următoarea fază.
- `billing_invoices` există DOAR pentru abonamentele Stripe ORBYVEN,
  inclusiv câmpuri de reconciliere fiscală a abonamentelor; nu reutilizăm
  acest tabel pentru facturile pe care firmele cliente le emit clienților lor.
- Nu există încă tabele pentru oferte client versionate, facturi de vânzare
  emise de clienții ORBYVEN sau tranzacții e-Factura pentru acele facturi.

Nu redenumim o ofertă PDF în factură și nu prezentăm o trimitere simulată
ca transmitere către ANAF.

## O singură lucrare, mai multe documente derivate

```text
Cerere -> Client -> Lucrare
                    |
                    v
             Deviz de lucru (revizie)
                /             \
        Necesar materiale     Manoperă
                \             /
                 v           v
             Ofertă comercială versionată
                         |
                  Acceptare documentată
                         |
               Factură DRAFT (fiscal)
                         |
                Emitere fiscală atomică
                         |
               XML RO-CIUS validat
                         |
                 RO e-Factura API
                         |
            index upload / verificare status
                         |
             răspuns + XML original arhivat
```

**Necesarul materiale NU înseamnă toate liniile devizului.** Separăm explicit
material, manoperă, serviciu/subcontractare și alte costuri, cu unitate,
cantitate, preț de achiziție, preț de ofertare, furnizor/sursă și disponibilitate.
O listă fără materiale este validă pentru un deviz exclusiv de servicii.

**O ofertă client NU este factura.** Oferta reprezintă o revizie acceptabilă,
dintr-o versiune de deviz. Datele comercial-fiscale sunt revalidate înainte de
emitere, iar facturile nu sunt suprascrise dacă se schimbă ulterior devizul.

## Dependențe

| Pas | Necesită | Status actual |
| --- | --- | --- |
| Client | CRM activ | Există |
| Lucrare | Context client | Există; legătură în UI |
| Deviz | Client + lucrare în fluxul complet | Există, fără structurarea tuturor liniilor |
| Necesar materiale | Deviz; `sales_material_requirements`; apoi rețete, revizie și sincronizare | UI + serviciu în branch, nepublicate; automatizarea rețetelor lipsă |
| Ofertă client | Deviz + necesar revizuit + acceptare/versiune | Prototip local |
| Factură | Ofertă acceptată, client și emitent fiscal validați | Doar proiectare |
| ANAF | Factură emisă, XML RO-CIUS, OAuth/SPV, răspuns | Doar proiectare |

Modulele operaționale existente rămân utilizabile și separat când scenariul
comercial complet nu este aplicabil. Lista de `MODULE_RELATIONS` conține
**recomandări**, nu permisiuni. O dependență recomandată nu trebuie să activeze
automat module plătite și nu trebuie să modifice contractul de billing.

## Model viitor al datelor (migrații NEAPLICATE)

Toate tabelele noi trebuie să aibă `organization_id`, FK-uri compuse
`(organization_id,id)` când leagă două obiecte tenant-scoped și politici
RLS de organizație + rol. Atributele importante:

1. `commercial_estimate_revisions`: estimate_id, revision_no, snapshot_lines,
   subtotal/taxes/total, currency, created_by, created_at, locked_at.
2. **Extindere** `sales_estimate_items` ori tabel de poziții versionate:
   revision_id, kind, SKU opțional, description, quantity numeric, unit,
   cost_cents (privat), sale_price_cents, tax category, position.
3. **Extindere, fără duplicare** `sales_material_requirements`:
   revision_id, material_line_id, required, reserved, procured, price_snapshot,
   supplier_ref, supply_status. Refolosim `ops_material_recipes` și
   `ops_material_recipe_items` pentru necesarul repetabil al unui serviciu.
   Pentru bunuri similare agregăm doar cu aceeași unitate/SKU.
4. `commercial_offers`: revision_id, client_id, task_id, terms_snapshot,
   valid_until, sent_at, accepted_at, acceptance_proof, version.
5. `fiscal_issuer_profiles`: date legale, adresă, CUI/CIF, statut TVA,
   bancă, coduri și configurare fiscală; verificare/acces role-limited.
6. `fiscal_invoices` și `fiscal_invoice_lines`: issuer/buyer snapshots,
   serie și număr rezervat atomic, issue_date, due_date, unit, TVA pe linie,
   referință ofertă/revizie, valori și stare. Documentul emis este imuabil;
   corecții prin mecanismul fiscal potrivit, nu overwrite.
7. `fiscal_efactura_transmissions`: invoice_id, XML hash, index încărcare,
   id mesaj/răspuns, stare, număr încercări, timestamps și erori redacted;
   cheie de idempotency unică pentru a evita retransmiterea accidentală.
8. `fiscal_document_vault`: cale privată pentru XML original și răspunsul
   MF cu sigiliu; acces auditat și regulă de retenție aprobată.

Migrațiile, politicile RLS și RPC-urile tranzacționale se fac numai după
aprobarea modelului de date și după crearea unui mediu de test izolat.
**Nu aplicați acest blueprint direct pe producție.**

## Reguli de integritate necesare

- Verificarea `organization_id` este necesară la fiecare FK, nu doar în UI;
  server/RPC + RLS sunt autoritatea, nu filtrele din browser.
- Schimbarea reviziei devizului invalidează lista de materiale generată și
  oferta nesemnată; oferta deja acceptată rămâne snapshot istoric.
  **Această regulă nu este încă implementată în schema actuală și este
  condiție obligatorie înainte de emiterea facturilor.**
- Costul furnizorului nu ajunge implicit în oferta văzută de client.
- Nicio factură emisă fără profil fiscal, identificator fiscal cumpărător,
  seria/numărul și regulile de taxare aplicabile.
- Nu se trimite către ANAF la simplul click „Salvează ofertă”.
- Nu se marchează „acceptată de ANAF” doar la răspunsul de upload; confirmarea
  vine din verificarea ulterioară și arhivarea rezultatului.
- Token OAuth, certificat/semnătură, date sensibile și XML nu se păstrează în
  localStorage, în frontend sau în commituri.
- Acțiunile fiscale necesitã jurnal auditabil și autorizare distinctă;
  nici asistentul AI, nici Viewer/Member nu transmit automat facturi.

## ANAF — aspecte confirmate din surse oficiale

- Din 01.01.2026 comunicatul ANAF menționează termenul de transmitere de
  **5 zile lucrătoare** de la emitere, cu plafonul raportat la termenul legal
  de emitere. Calculul se face potrivit regulilor oficiale, NU folosind
  `date + 5 * 24h`.
- Originalul facturii electronice este XML-ul conform standardului european
  și RO-CIUS, împreună cu sigiliul MF după procesare.
- API-ul implică upload, apoi verificare/descărcare rezultat; autorizarea
  dezvoltatorului este distinctă de autorizarea clientului/SPV, asociată
  certificatului digital calificat.

Surse:
- https://static.anaf.ro/static/3/Galati/20260202132103_termen%20transmitere%20factura%20electronica.pdf
- https://static.anaf.ro/static/10/Anaf/AsistentaContribuabili_r/Ghid_RO_eFactura.pdf
- https://mfinante.gov.ro/static/10/eFactura/prezentare%20apeluri%20API%20E-factura.pdf
- https://www.anaf.mfinante.gov.ro/InregOauth/index.xhtml

Avocatul și contabilul trebuie să valideze obligațiile aplicabile fiecărui tip
de client, regimul TVA, documentele și delegarea accesului SPV înainte de
activarea modulului fiscal.

## Rulează preview-ul

```bash
npm install
npm run dev
# http://localhost:3000/workspace/eco-preview
```

Ruta este accesibilă numai în `NODE_ENV=development`. Preview-ul folosește
exclusiv valori marcate drept fictive, stări locale și **nu** scrie în
Supabase, nu emite facturi și nu apelează ANAF. În producție ruta răspunde 404.

## Regula release

Nu se face merge în `main`, migration apply, redeploy, Vercel Preview/CLI sau
ANAF production/test fără confirmarea explicită a proprietarului proiectului.
