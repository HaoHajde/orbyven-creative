# ORBYVEN iOS — Alpha 0.1

Client iOS pentru ORBYVEN, construit cu Expo SDK 57 / React Native 0.86.

## Scopul Alpha 0.1

Prima versiune este un **native shell** peste workspace-ul ORBYVEN live. Astfel, autentificarea, RLS, modulele, stilul și modificările de dashboard rămân sincronizate 1:1 cu produsul web fără a dubla logica de business.

Native în 0.1:
- aplicație și bundle iOS proprii;
- splash și chrome ORBYVEN;
- deep-link scheme `orbyven://`;
- back/forward gestures;
- pull-to-refresh iOS;
- toolbar nativ;
- handling pentru stare online/offline;
- linkurile externe sunt deschise în iOS, nu în containerul ORBYVEN;
- sesiunea web persistă prin cookie storage-ul WebView.

Web/shared în 0.1:
- login și onboarding;
- workspace;
- module și permisiuni;
- date Supabase;
- AI și funcționalități server;
- billing și documente.

## Securitate

Aplicația nu conține service-role keys, chei de billing sau tokenuri privilegiate. Datele private rămân protejate de mecanismele existente din ORBYVEN Web + Supabase RLS.

Hosturile permise în container sunt `orbyven.ro` și subdomeniile sale. Linkurile externe HTTPS, mailto, tel și sms ies în aplicațiile sistemului.

## Dezvoltare

Necesită Node.js 22.13+.

```bash
cd ios
npm install
npm run check
npm start
```

Pentru simulator / device local pe macOS:

```bash
npm run prebuild:ios
npm run ios
```

## Publicare

Un build instalabil/TestFlight necesită:
1. Apple Developer Program;
2. semnare iOS (certificate/provisioning);
3. App Store Connect bundle pentru `ro.orbyven.app`;
4. icon + screenshots finale;
5. privacy disclosures și review App Store.

Nu se comit certificate, provisioning profiles sau secrete Apple.

## Direcția următoare

Alpha 0.2 va adăuga funcții native care justifică distribuția App Store: push notifications, Face ID/app lock, document scan/upload/share și integrarea deep-link universal. Modulele pot fi apoi migrate gradual la UI React Native complet fără a schimba backend-ul ORBYVEN.
