# ORBYVEN — procedură operațională GDPR (draft intern)

**Status:** checklist pre-lansare; se validează cu avocatul și cu operatorul de date real. NU este un angajament public suplimentar și NU presupune automat că ORBYVEN este operator pentru datele tuturor clienților.

## Registru cereri persoane vizate

Pentru fiecare cerere: ID intern aleator, data/ora recepției, canal, referință la identitatea verificată (nu copie de act fără necesitate), categorie, rolul ORBYVEN (operator/împuternicit), firma/operatorul relevant, sisteme vizate, termen-limită, responsabil, răspuns și dovada comunicării, decizie și motiv. Nu copia date sensibile sau întregi conversații în registru. Acces limitat. Retenția registrului se definește juridic.

## Flux

1. Confirmă primirea solicitării fără a divulga date.
2. Determină dacă ORBYVEN stabilește scopurile (ex. cont propriu/billing/contact) sau prelucrează la instrucțiunile clientului (ex. CRM/RSVP). Pentru a doua categorie, transmite cererea operatorului prin canal securizat conform DPA; nu șterge unilateral datele unui client fără instrucțiuni ori temei aplicabil.
3. Verifică identitatea proporțional, numai dacă există îndoieli rezonabile. Nu cere automat CI.
4. Localizează datele pentru acel user și organizație: Auth, workspace, CRM, proiecte, billing, loguri, storage, comunicări și backup. Nu utiliza service-role în browser și nu expune datele altui tenant.
5. Verifică excepțiile/obligațiile de conservare (facturi, probe, litigii), precum și drepturile terților. Documentează restricționarea dacă ștergerea completă nu este permisă.
6. Trimite răspunsul fără întârziere nejustificată, în principiu în cel mult o lună; dacă prelungirea este legal posibilă, notifică în prima lună și motivează. Nu promite ștergere instant a backupurilor fără politică verificată.
7. Confirmă executarea inclusiv în sisteme externe și păstrează dovada rezolvării conform politicii aprobate.

## Incident de securitate

Izolează incidentul, conservă probe, delimitează tenant-uri și tipurile de date, stabilește rolurile și notifică operatorul client fără întârziere nejustificată potrivit DPA; pentru incidentele unde ORBYVEN este operator, evaluează art. 33/34 GDPR (inclusiv praguri de notificare și termenul de 72 de ore unde este aplicabil). Nu presupune că orice incident trebuie notificat public și nu ascunde unul cu risc.

## Verificări necesare înainte de operaționalizare

- Proces și canal de contact funcțional, ownership, rota de escaladare.
- Mecanism securizat de export per tenant, rectificare și delete, inclusiv Storage.
- Matrice procesări–temei–retenție–subprocesatori–regiune–transferuri.
- Test ștergere/revocare invitație RSVP, proiect și user, plus test păstrare legală factură.
- Backups, drepturi de acces, audit logs, restaurare și termen documentat.
- DPA completat și listă reală de furnizori. Nu publica un inventar speculativ.

Referință: Regulamentul (UE) 2016/679, art. 12, 15–22, 28, 32–34: https://eur-lex.europa.eu/eli/reg/2016/679/oj
