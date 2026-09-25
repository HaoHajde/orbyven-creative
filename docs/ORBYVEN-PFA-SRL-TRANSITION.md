# ORBYVEN — plan arhitectural PFA → SRL (23.09.2026)

**Decizie de produs:** ORBYVEN este brandul/produsul, clientul deține `organization_id`, iar comerciantul/emitentul este o entitate juridică distinctă. Nu refacem site-urile, dashboard-urile, proiectele ori URL-urile clientului la schimbarea emitentului.

**Nu este consultanță juridică ori fiscală și nu atestă că titularului i-a fost aprobat PFA-ul.** Avocatul, conducerea/HR și contabilul trebuie să confirme în scris forma, activitățile și procedura înainte de lansare.

## Etape și checkpoint-uri

1. Avocat + comandant/HR + contabil: statut militar, activități PFA explicit descrise (web design, SaaS, mentenanță, găzduire, abonamente), documente și regim fiscal.
2. PFA înființat și autorizat: completează datele legale numai după verificare, configurează Stripe/Oblio și furnizorii pe același emitent, contracte și DPA B2B/B2C valabile.
3. Validare: 25 / 50 / 75 / 100 **clienți activi plătitori**; urmărește MRR încasat, churn, cost hosting/AI/Stripe/contabilitate, fiscalitate, suport, incidente și profit disponibil personal.
4. 100 clienți = evaluarea situației, NU demisie automată. Verifică rezerve financiare, profit repetabil și exit-ul din profesie cu avocat/HR.
5. Numai după clarificarea statutului, înființează SRL-ul; migrare contractuală, financiară, tehnică și GDPR coordonată cu profesioniștii.

## Variabile de identitate comercială

```text
ORBYVEN_COMMERCIAL_ENTITY_TYPE=prelaunch  # apoi pfa / srl
ORBYVEN_COMMERCIAL_ENTITY_KEY=            # ex. pfa-2027-01 / srl-2028-01, unic și nereutilizabil
ORBYVEN_COMMERCIAL_CHECKOUT_PAUSED=true   # default sigur: checkout-uri noi blocate
ORBYVEN_LEGAL_NAME=                        # denumirea legală completă a emitentului
ORBYVEN_TAX_ID=
ORBYVEN_REGISTRATION_NUMBER=
ORBYVEN_REGISTERED_OFFICE=
ORBYVEN_VAT_LABEL=
NEXT_PUBLIC_ORBYVEN_PRICE_TAX_LABEL=
```

Variabilele publice sunt doar etichete publice fără secrete. Stripe, Oblio, service-role și CRON rămân numai pe server. Key-ul logic `merchant_key` nu este CUI și nu indică un drept de a opera; servește exclusiv istoricul și izolarea facturilor.

## Contract / abonament / factură

- Acceptările documentelor stochează cheia comerciantului, forma, numele legal și CIF-ul aferente momentului acceptării.
- Stripe Checkout și Subscription primesc cheia comerciantului în metadata. Datele istorice din Subscription sunt păstrate în `subscriptions`; nu se rescriu când se schimbă mediul.
- `billing_invoices` păstrează instantaneul emitentului; worker-ul Oblio selectează **doar facturile aparținând cheii comerciale curente**, apoi verifică denumirea și CIF-ul. Un eveniment duplicat nu poate repune o factură fiscală emisă în starea `pending`.
- Înregistrările vechi fără cheia emitentului rămân intenționat neeligibile pentru emitere automată până la reconciliere documentată. NU le completa automat din valorile SRL-ului.
- Migrarea SQL `20260923164000_commercial_issuer_snapshots.sql` este pregătită în cod, dar **nu a fost aplicată bazei live**. Se testează pe staging și se aplică controlat înainte de activarea funcțiilor care scriu noile câmpuri.

## Procedură de cutover, NU un singur toggle

1. Inventariază abonamente, contracte, mandate de debitare, conturi și metode de plată, facturi emise/neemise, credit notes, solduri, retenții, termenul contractual și acordurile GDPR.
2. Confirmă cu avocatul procedura pentru fiecare contract (cesiune, novare sau reîncheiere, după caz) și notificările/consimțămintele necesare. PFA **nu se convertește automat** în SRL.
3. Stabilește data de separație fiscală împreună cu contabilul. Oprește **comenzile noi**, nu accesul clienților. Configurează SRL-ul și conturile Stripe/Oblio distincte.
4. Conciliază toate încasările și facturile PFA, inclusiv restituiri și facturi rămase în coadă. Nu schimba cheia PFA în contul Oblio SRL ca să „eliberezi” factura.
5. Pregătește separat migrarea abonamentelor Stripe. Procedura și posibilitățile de copiere depind de conturi și procesator; nu presupune mutarea automată a subscripțiilor, mandatelor ori facturilor. Păstrează accesul la istoricul Stripe al PFA.
6. Actualizează identitatea comerciantului, drepturile asupra codului/brandului, informările clienților și DPA. Clienții și tenant-urile Supabase rămân legate de același `organization_id`.
7. După testare și confirmări scrise, setează `ORBYVEN_COMMERCIAL_ENTITY_KEY` NOU, `...ENTITY_TYPE=srl`, noile date fiscale și credențialele comerciale, apoi `...CHECKOUT_PAUSED=false`. Nu activa simultan două emitente cu un singur set de chei Stripe/Oblio.
8. Testează un abonament nou și o factură SRL în mediu controlat; monitorizează 1–2 cicluri de facturare, cazuri de refund, anulare, webhooks întârziate și factura PFA întârziată.

**Limite tehnice de rezolvat înainte de migrarea efectivă:** procesarea paralelă a webhookurilor Stripe ale celor două entități, portalul de facturare pentru conturile vechi, reconcilierea facturilor de dinaintea introducerii `merchant_key`, transferurile contractuale și accesul arhival fiscal. Actualul cod presupune un singur cont Stripe activ per configurație; nu executa un cutover live până la dezvoltarea/testarea fluxului dual sau retragerea în siguranță a vechiului cont.

## Rețeta de validare

- `npm run lint && npm run typecheck && npm run build`.
- Verifică migrarea într-o bază separată și RLS: noile câmpuri NU trebuie expuse liber clienților; operațiile rămân prin server.
- Stripe test: checkout blocat by default; checkout activ numai cu opt-in; metadata PFA salvată; webhook duplicat păstrează issuer și factura `issued`.
- Oblio mock: factură PFA cu config SRL nu trebuie selectată/emisă; factură fără cheie nu se emite automat.
- Manual: comparație CUI / RO prefix și denumire completă pe emitent; backup, rollback, comunicarea către client.

Surse: https://supabase.com/docs/guides/deployment/database-migrations ; https://docs.stripe.com/implementation-guides/core-payments/migration
