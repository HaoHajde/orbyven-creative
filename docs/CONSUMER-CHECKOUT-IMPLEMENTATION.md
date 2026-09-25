# ORBYVEN — specificație pre-lansare pentru viitorul checkout B2C

Acest document pregătește interfața; NU implementează vânzare reală și NU stabilește automat o excepție de retragere.

## Pagina dinaintea comenzii

Identitate comerciant reală; produsul și funcționalitățile sale; compatibilitate; perioadă de hosting; ce oferă RSVP; disponibilitatea suportului; termen estimat și momentul acceptării comenzii; preț total cu taxe; costuri recurente și metode de încetare; canal sesizări și formular legal de retragere. CTA clar cu obligație de plată, conform legii.

## Exemplu de flux tehnic de confirmări SEPARATE

- Checkbox A: „Am citit informarea precontractuală și termenii B2C” cu versiunea/hash-ul documentelor, data și ID-ul comenzii.
- Checkbox B apare NUMAI dacă persoana solicită începerea prestării în perioada legală de retragere: „Solicit expres începerea executării înainte de expirarea perioadei de retragere.”
- Checkbox C, distinct de B, doar când excepția legală aplicabilă a fost validată: confirmarea că persoana cunoaște condițiile în care își pierde dreptul de retragere. Textul exact trebuie aprobat juridic în funcție de încadrarea contractului (serviciu / conținut digital / serviciu digital). Niciodată pre-bifat.
- Confirmare pe suport durabil (email) cu rezumat, termeni/versiuni, data, preț, consimțăminte distincte și instrucțiuni de reclamație / retragere.
- Nu se lansează prestarea sau livrarea în baza unui simplu „accept toate” și nu se atribuie automat excepția bunurilor personalizate website-urilor.

## Persistență viitoare

Order ID, customer ID, legal merchant, documentVersion/hash, product specification, total/gross/net/tax labeling reviewed, timestamps, separate consent flags with exact text shown, confirmationDeliveryStatus, fulfillmentStartedAt, deliveryProof, any withdrawal and refund outcome, legal retention. No card data in own DB.

## Teste obligatorii

Opt-out / fără B și C, termen legal, doar B, ambele când sunt legal necesare; email eșuat; duplicare webhook; preț schimbat; minor; anulare; retur; produs nelivrat; contact SAL. Fără billing live înainte de validarea structurii și TVA.

Surse primare: OUG 34/2014 art. 6, 8–16 https://legislatie.just.ro/Public/DetaliiDocument/158913; OUG 141/2021 pentru servicii și conținut digital https://legislatie.just.ro/Public/DetaliiDocumentAfis/250054.
