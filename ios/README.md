# ORBYVEN iOS — Alpha 0.1 / TestFlight foundation

Client iOS pentru ORBYVEN, construit cu Expo SDK 57 / React Native 0.86.

## Ce este gata

Aplicația este un native shell peste workspace-ul ORBYVEN live, astfel încât autentificarea, RLS, modulele, AI-ul și modificările dashboard-ului rămân sincronizate cu produsul web.

Native:
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

Pentru dezvoltare putem folosi Expo Go fără Apple Developer Program:

1. instalează Expo Go pe iPhone;
2. creează sau folosește același cont Expo pe PC și iPhone;
3. pe Windows:

```bash
cd ios
npm install
npx expo login
npm run start:go
```

Scanează QR-ul afișat în terminal. Dacă telefonul nu poate ajunge la PC prin rețeaua locală, instalează `@expo/ngrok` conform documentației Expo și pornește:

```bash
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
