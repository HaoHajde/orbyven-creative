# ORBYVEN iOS — Alpha 0.16

Client iOS pentru ORBYVEN, construit cu Expo SDK 57 / React Native 0.86.

## Ce este gata

Aplicația este un native shell peste workspace-ul ORBYVEN live, astfel încât autentificarea, RLS, modulele, AI-ul și modificările dashboard-ului rămân sincronizate cu produsul web.

Native Alpha 0.13:
- badge nativ pe iconița ORBYVEN sincronizat cu numărul real de elemente din Activity Center;
- sursa de adevăr rămâne Activity Center-ul existent, fără tabel sau contor paralel;
- valoarea este limitată la 99 și se curăță automat când nu mai există atenționări sau workspace-ul este demontat;
- badge-ul folosește doar permisiunea iOS deja existentă și nu deschide un prompt nou doar pentru această funcție;
- runtime-ul declară capabilitatea `native-attention-badge`;

Păstrat din Alpha 0.12:
- launch handoff nativ unic între splash, bootstrap web și workspace, fără alternarea vizibilă loader/privacy/workspace;
- ecranul de pornire rămâne deasupra WebView-ului până când bootstrap-ul web s-a stabilizat și verificarea locală de acces s-a încheiat;
- tranziția către workspace folosește un fade nativ scurt de 180 ms;
- dacă web-ul eșuează la pornire, handoff-ul cedează controlul către recovery în loc să rămână blocat;
- privacy shield-ul apare după handoff doar atunci când accesul local chiar necesită protecție;
- runtime-ul declară capabilitatea `native-launch-handoff`;

Păstrat din Alpha 0.11:
- termenele din modulul Lucrări folosesc direct `due_at` pentru remindere locale iPhone, fără tabel sau câmp paralel;
- o lucrare activă cu termen viitor poate programa notificarea locală exact la termen;
- finalizarea, anularea sau ștergerea lucrării elimină reminderul local;
- tap pe notificarea de termen intră direct în recordul exact din modulul Lucrări;
- routing-ul notificării trece prin handshake-ul `workspace-ready`, inclusiv la cold start/login;
- runtime-ul declară capabilitatea `work-deadline-reminders`;

Păstrat din Alpha 0.10:
- handshake explicit `orbyven:web-ready` după hidratarea runtime-ului web;
- handshake `orbyven:workspace-ready` după ce Dashboard-ul și listener-ele native sunt montate;
- intenturile Calendar și Documente rămân în coadă până când workspace-ul este pregătit;
- tap-ul pe o notificare la cold start/login nu mai depinde de momentul `onLoadEnd`;
- replay-ul intenturilor este condiționat de readiness, reducând race conditions la pornire;
- runtime-ul declară `web-readiness-handshake`, `workspace-readiness-handshake` și `pending-intent-replay`;

Păstrat din Alpha 0.9:
- ultimul modul activ din Dashboard este salvat local și restaurat la următoarea deschidere dacă modulul este încă activ pentru organizație;
- deep-link-urile și tap-urile din notificări navighează în WebView-ul existent, fără remount inutil al aplicației;
- loader-ul nativ complet este rezervat pornirii reale și recovery-ului hard, nu navigării interne;
- revenirea pe aceeași destinație emite focus/resume fără reload;
- runtime-ul declară capabilitățile `stateful-deep-links` și `workspace-continuity`;

Păstrat din Alpha 0.8:
- reconectarea la internet păstrează starea curentă a WebView-ului și evită reload-ul dacă pagina nu a eșuat efectiv;
- indicator nativ discret pentru `Offline` / `Conexiune restabilită`;
- bridge `orbyven:native-network-change` către Dashboard, cu `data-native-network` pentru diagnostic și UI contextual;
- reload automat doar când WebView-ul a intrat efectiv în stare de eroare;
- feedback haptic discret la revenirea conexiunii;
- runtime-ul declară capabilitățile `network-state-bridge` și `state-preserving-reconnect`;

Păstrat din Alpha 0.7:
- handshake explicit native → web prin `window.__ORBYVEN_NATIVE__`, fără a folosi user-agent-ul drept sursă de adevăr;
- runtime-ul web marchează `data-app-mode="native"` și publică platforma/versiunea shell-ului pentru UI și diagnostic;
- capabilitățile native sunt declarate explicit (biometric lock, deep links, documente, haptics, remindere, network recovery, push registration);
- tema Dashboard-ului este sincronizată către shell-ul iOS, astfel încât status bar-ul, safe-area și privacy shield-ul rămân coerente cu tema aleasă manual;
- revenirea aplicației în foreground emite explicit `orbyven:app-resume`;
- shell-ul nativ rămâne vizual invizibil pe paginile ORBYVEN de încredere, pentru a păstra un singur header/dock;

Păstrat din Alpha 0.6:
- foundation pentru push remote, cu activare explicită din centrul de atenționări;
- tokenul Expo Push este obținut numai într-un build legat la EAS și este salvat prin sesiunea web autentificată;
- registry tenant-scoped pe organizație + utilizator + token, protejat prin RLS;
- tap pe push poate deschide doar URL-uri ORBYVEN validate sau deep-link-uri `orbyven://`;
- nu există service-role sau secret Supabase în clientul iOS;
- remindere locale iOS pentru programările din Calendar;
- folosește direct câmpul existent `reminder_minutes`, fără tabel paralel;
- cere permisiunea de notificări doar când este nevoie de primul reminder;
- anularea/finalizarea/ștergerea programării elimină reminderul local;
- tap pe notificare deschide ORBYVEN în Calendar și focalizează evenimentul exact;
- fallback fără push server și fără Apple Developer pentru etapa locală;
- buton Documente în toolbar-ul nativ;
- bridge nativ → workspace care deschide direct modulul Documente în modul de încărcare;
- Files / iCloud picker prin WebView, păstrând sesiunea web/Supabase existentă;
- fotografiere document sau poză din teren cu camera iPhone;
- feedback haptic când un fișier este selectat, încărcat sau când upload-ul eșuează;
- permisiuni iOS pentru cameră și librăria foto;
- privacy shield imediat când aplicația intră în background, astfel încât workspace-ul nu rămâne expus în app switcher;
- app-lock biometric după 30 secunde în background, când device-ul are biometrie configurată;
- detecție reală a conexiunii cu `expo-network` și reload automat la revenirea internetului;
- haptic feedback pentru acțiunile native;
- share sheet nativ pentru pagina curentă;
- recovery automat când iOS termină procesul WebView din memorie;
- user-agent iOS standard păstrat, cu identificator ORBYVEN adăugat;
- media inline în WebView;
- bundle iOS propriu: `ro.orbyven.app`;
- deep-link `orbyven://`;
- back/forward gestures;
- pull-to-refresh;
- toolbar nativ;
- online/offline recovery;
- external link hand-off către iOS;
- sesiune persistentă;
- dark/light mode.

Release:
- `eas.json` cu profile simulator, preview și production;
- production folosește distribuție App Store/TestFlight;
- build number administrat remote și incrementat automat;
- comenzi locale pentru build și TestFlight;
- workflow GitHub manual pentru build + submit;
- certificatele și tokenurile nu sunt stocate în repository.

## Validare locală

Necesită Node.js 22.13+.

```bash
cd ios
npm install
npm run check
npm run export:ios
```

## Testare gratuită pe iPhone fără Mac

Pentru dezvoltare putem folosi Expo Go fără Apple Developer Program.

### Windows — varianta rapidă

1. instalează **Expo Go** pe iPhone și autentifică-te într-un cont Expo;
2. în folderul `ios`, dublu-click pe **`start-iphone.cmd`**;
3. launcher-ul verifică automat autentificarea Expo CLI; dacă PC-ul nu este autentificat, pornește `npx expo login`;
4. autentifică PC-ul în **același cont Expo** folosit în Expo Go pe iPhone;
5. ține PC-ul și iPhone-ul pe aceeași rețea Wi-Fi;
6. scanează QR-ul afișat în terminal cu iPhone-ul / Expo Go.

Launcher-ul verifică Node.js 22.13+, instalează dependențele doar dacă lipsesc, validează sesiunea Expo CLI și pornește automat Expo în mod LAN.

Dacă rețeaua locală blochează conexiunea, folosește **`start-iphone-tunnel.cmd`**. Este același launcher, dar pornește fallback-ul tunnel.

Comenzile manuale rămân disponibile:

```bash
cd ios
npm install
npm run start:go
# fallback:
npm run start:tunnel
```

Expo Go este mediul de testare. Build-ul ORBYVEN semnat, TestFlight și App Store rămân pe pipeline-ul EAS configurat separat.

## Instalare pe Home Screen fără Apple Developer

Versiunea web ORBYVEN este configurată ca PWA cu start direct în `/workspace`, icon propriu și mod standalone. Pe iPhone: Safari → Share → Add to Home Screen → Open as Web App.

Service worker-ul nu cache-uiește paginile sau răspunsurile private ale workspace-ului; offline păstrează doar shell-ul public și afișează un ecran de reconectare.

## Prima legare la Expo / EAS

Autentifică-te în contul Expo care va deține ORBYVEN:

```bash
cd ios
npx eas-cli@24.8.0 login
npx eas-cli@24.8.0 init
```

EAS va adăuga automat project ID-ul aplicației. Pentru CI, project ID-ul se salvează în GitHub ca secret `EAS_PROJECT_ID`; tokenul Expo se salvează ca `EXPO_TOKEN`.

## Build-uri

Simulator:

```bash
npm run build:simulator
```

Build intern pentru device-uri înregistrate:

```bash
npm run build:preview
```

Production IPA pentru App Store/TestFlight:

```bash
npm run build:production
```

Production + upload automat în TestFlight:

```bash
npm run testflight
```

## GitHub release workflow

Workflow-ul `ORBYVEN iOS TestFlight Release` este pornit manual din GitHub Actions. Are nevoie de:
- `EXPO_TOKEN`;
- `EAS_PROJECT_ID`;
- signing credentials Apple configurate în EAS;
- Apple Developer Program activ.

Poate genera doar build-ul semnat sau îl poate trimite automat în TestFlight.

## Apple

Bundle identifier: `ro.orbyven.app`.

Prima configurare Apple se face interactiv o singură dată cu EAS Credentials / App Store Connect. Nu se comit parole Apple, certificate, provisioning profiles, App Store Connect API private keys sau alte secrete.

După prima asociere, release-urile următoare pot fi lansate din workflow fără Mac, folosind EAS Build + EAS Submit.


## Alpha 0.2

Versiunea 0.2.0 întărește utilizarea zilnică pe iPhone: păstrează user-agent-ul real de iOS, recuperează WebView-ul după memory pressure, adaugă Share nativ și sincronizează modul standalone al PWA-ului cu evenimentele de resume/visibility.


## Alpha 0.3

Versiunea 0.3.0 adaugă un strat local de confidențialitate peste autentificarea ORBYVEN existentă. Privacy shield-ul ascunde imediat workspace-ul când aplicația părăsește foreground-ul. După minimum 30 de secunde în background, aplicația încearcă autentificarea biometrică dacă telefonul are biometrie configurată.

Face ID nu poate fi testat efectiv în Expo Go pe iOS; Expo cere un development/signed build pentru testarea Face ID. În Expo Go, ORBYVEN tratează indisponibilitatea API-ului biometric ca fallback de dezvoltare și nu blochează accesul. Acest app-lock nu înlocuiește autentificarea web/Supabase și nu modifică RLS sau sesiunile server-side.


## Alpha 0.4

Versiunea 0.4.0 adaugă fluxul iPhone → Documente fără a crea un al doilea client Supabase în aplicația nativă. Fișierul ales din Files/iCloud sau fotografia făcută pe telefon ajunge în formularul web existent, iar upload-ul continuă să treacă prin validarea de tip/semnătură, bucket-ul privat `orbyven-documents` și politicile RLS ale organizației.

În această etapă "Fotografiază" folosește camera iOS prin file capture. Un scanner multi-page cu detectare automată a marginilor poate fi adăugat ulterior în build-ul nativ semnat, fără să schimbăm contractul de storage.


## Alpha 0.5

Versiunea 0.5.0 leagă Calendarul ORBYVEN de notificările locale ale iPhone-ului. Când o programare are reminder, shell-ul nativ programează notificarea local la momentul cerut. Dacă reminderul ar fi deja în trecut dar programarea este încă viitoare, notificarea este programată imediat, astfel încât informația să nu fie pierdută.

Programările anulate, finalizate sau șterse își elimină reminderul programat. La apăsarea notificării, aplicația revine în workspace și deschide Calendarul pe evenimentul respectiv.

Notificările locale pot fi testate fără infrastructură push. Push-urile remote rămân o etapă separată deoarece necesită development/store build și credențiale push.


## Alpha 0.6

Versiunea 0.6.0 pregătește notificările push remote fără să slăbească autentificarea existentă. Utilizatorul activează explicit alertele din Activity Center; shell-ul nativ obține Expo Push Token numai când există un `projectId` EAS valid, iar workspace-ul autentificat îl persistă în `user_push_devices`. RLS permite fiecărui utilizator să își gestioneze doar propriile dispozitive din organizațiile în care are membership activ.

În această etapă este implementată infrastructura de înregistrare și routing, nu expedierea automată server-side. Pentru push real pe iPhone este necesar un development/store build cu proiectul EAS legat și credențiale Apple Push. Reminderele locale din Alpha 0.5 rămân independente și continuă să funcționeze fără backend de push.


## Alpha 0.7

Versiunea 0.7.0 transformă legătura dintre Dashboard și shell-ul iOS într-un contract explicit. WebView-ul injectează înainte de încărcarea aplicației un runtime limitat la informații de platformă, versiune și capabilități UI; acesta nu conține tokenuri, credentiale, sesiuni sau drepturi de autorizare. Autentificarea și RLS rămân exclusiv în fluxul ORBYVEN existent.

Tema aleasă în Dashboard este trimisă către shell-ul iOS prin bridge-ul React Native WebView, astfel încât status bar-ul și ecranele native auxiliare să nu mai poată rămâne într-o temă diferită față de workspace. La revenirea din background, shell-ul emite explicit evenimentul `orbyven:app-resume`, pe lângă protecția biometrică existentă.


## Alpha 0.8

Versiunea 0.8.0 mută recovery-ul de rețea de la „reload la orice reconectare” la un model care păstrează starea utilizatorului. Dacă Wi‑Fi-ul sau datele mobile dispar temporar, shell-ul păstrează WebView-ul și afișează un status nativ discret. La revenirea internetului, pagina curentă rămâne deschisă și primește evenimentul `orbyven:native-network-change`; reload-ul este rezervat situațiilor în care WebView-ul a raportat efectiv o eroare.

Această schimbare reduce riscul de a pierde text introdus, poziția în modul sau contextul unei lucrări în timpul unei întreruperi scurte de conexiune. Runtime-ul web expune starea prin `data-native-network="online|offline"`, fără să schimbe autentificarea, sesiunea Supabase sau politicile RLS.


## Alpha 0.9

Versiunea 0.9.0 adaugă continuitate între sesiuni. Dashboard-ul memorează ultimul modul folosit în storage-ul local al workspace-ului și îl restaurează doar dacă acel modul este încă permis pentru organizația curentă. Astfel, redeschiderea ORBYVEN nu te trimite automat în Overview dacă lucrai în Calendar, Documente, Clienți sau alt modul activ.

Deep-link-urile ORBYVEN și navigarea pornită din notificări folosesc acum WebView-ul existent. Un remount complet rămâne rezervat recuperării după o eroare reală sau unei reîncercări explicite, ceea ce reduce flash-urile și păstrează mai bine starea UI.


## Alpha 0.10

Versiunea 0.10.0 introduce un contract de readiness în două etape. Runtime-ul web confirmă către shell-ul iOS când pagina s-a hidratat, iar WorkspaceShell confirmă separat când workspace-ul autentificat și listener-ele pentru Calendar, Documente și celelalte bridge-uri sunt montate.

Intenturile native care au nevoie de workspace — de exemplu deschiderea unei programări dintr-o notificare sau intrarea directă în Documente — sunt păstrate până la semnalul `orbyven:workspace-ready`. Astfel, un cold start, un login intermediar sau o încărcare mai lentă nu mai poate pierde acțiunea cerută de utilizator.


## Alpha 0.11

Versiunea 0.11.0 extinde notificările locale ORBYVEN de la Calendar către modulul Lucrări. Nu este introdus un sistem paralel de deadline-uri: sursa de adevăr rămâne câmpul existent `ops_tasks.due_at`.

La crearea unei lucrări cu termen viitor, shell-ul iOS programează o notificare locală exact la termen. Dacă lucrarea este finalizată, anulată sau ștearsă înainte de termen, notificarea asociată este eliminată. Lucrările recurente folosesc același bridge atunci când rezultatul are un termen valid.

La apăsarea notificării, intentul este păstrat până când workspace-ul autentificat semnalează `orbyven:workspace-ready`, apoi ORBYVEN deschide modulul Lucrări pe recordul exact. Notificarea este locală și nu necesită infrastructură push remote sau Apple Developer Program în etapa Expo Go.


## Alpha 0.12

Versiunea 0.12.0 unifică pornirea aplicației într-un singur handoff nativ. Splash-ul Expo este urmat de ecranul ORBYVEN al shell-ului, în timp ce WebView-ul, sesiunea și verificarea locală se pregătesc dedesubt. Când runtime-ul web s-a stabilizat și verificarea locală s-a încheiat, shell-ul cedează controlul printr-un fade scurt direct către workspace sau, dacă este necesar, către privacy shield.

Handoff-ul nu modifică autentificarea ORBYVEN, sesiunea Supabase sau RLS. La o eroare reală de încărcare, stratul de launch se închide și lasă recovery-ul existent să devină vizibil, astfel încât aplicația să nu poată rămâne blocată într-un splash infinit.


## Alpha 0.13

Versiunea 0.13.0 leagă Activity Center de badge-ul nativ al iconiței ORBYVEN. Numărul afișat pe Home Screen este derivat direct din lista de semnale operaționale deja calculată de Dashboard, limitat la 99 și trimis către shell-ul iOS prin bridge-ul existent.

ORBYVEN nu cere permisiunea de notificări doar pentru badge. Dacă utilizatorul a permis deja notificările/badge-urile, valoarea este sincronizată; dacă nu, funcția rămâne silențioasă. La logout sau demontarea workspace-ului, badge-ul este cerut la zero pentru a evita un indicator rămas stale.


## Alpha 0.14

Versiunea 0.14.0 face update-urile web sigure pentru utilizarea nativă. Endpoint-ul de runtime freshness continuă să detecteze imediat deployment-urile noi, dar atunci când pagina rulează în shell-ul iOS nu mai execută direct `window.location.reload()`. În schimb, trimite versiunea nouă către aplicația nativă, iar utilizatorul poate alege să actualizeze acum sau să amâne.

Dacă actualizarea este aplicată, versiunea este persistată înainte de reload pentru a evita buclele. Dacă este amânată, WebView-ul și formularele curente rămân intacte. Browserul și PWA-ul instalat păstrează refresh-ul automat existent, deoarece nu au shell nativ pentru acest control.


## Alpha 0.15

Versiunea 0.15.0 protejează editarea pe iPhone împotriva refresh-ului accidental prin gesture. Runtime-ul web urmărește doar focusul elementelor editabile și transmite shell-ului nativ o stare booleană limitată. Cât timp un astfel de control este activ, `pullToRefreshEnabled` este oprit; după blur către un element ne-editabil, gestul revine.

Bridge-ul nu trimite valoarea câmpului, textul introdus sau alte date de formular. Transmite exclusiv faptul că un control editabil este activ, păstrând aceeași separare dintre UI nativ și datele workspace-ului.


## Alpha 0.16

Versiunea 0.16.0 extinde protecția de editare și asupra gesturilor native de navigare iOS. Cât timp un control editabil este activ, WebView-ul dezactivează atât pull-to-refresh, cât și swipe-back/swipe-forward. După ieșirea din editare, ambele gesturi revin automat.

Această protecție folosește aceeași stare booleană introdusă în Alpha 0.15 și nu transmite conținutul câmpurilor către shell-ul nativ.
