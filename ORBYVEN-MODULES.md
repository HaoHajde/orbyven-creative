# ORBYVEN — Modular Client Workspace

## Obiectiv

ORBYVEN nu reconstruiește dashboard-ul pentru fiecare client. Clientul primește un workspace comun, iar instrumentele sunt activate ca module portabile.

## Separarea responsabilităților

### Shell / Workspace
Responsabil de:
- navigație;
- identitatea clientului;
- tema vizuală;
- accesul la module;
- experiența comună desktop/mobile.

### Module
Fiecare modul trebuie să fie independent de client și să primească contextul workspace-ului.

Un modul nu trebuie să conțină hardcodări de forma:
- nume client;
- domeniu client;
- ID-uri fixe;
- reguli comerciale specifice unei singure firme.

Aceste lucruri trebuie furnizate prin configurația workspace-ului și prin date.

## Registry

Registry-ul central este în:

`lib/orbyven-modules.ts`

El definește catalogul de module disponibile și metadatele necesare interfeței.

## MVP implementat

Ruta de preview:

`/workspace`

Conține:
- shell client responsive;
- Overview;
- selector de module;
- activare/dezactivare locală pentru preview;
- stări vizuale pentru modulele portabile.

Configurarea modulelor este salvată momentan în `localStorage`, exclusiv pentru demo/UI.

## Următorul pas backend

Persistența reală trebuie mutată în Supabase cu o structură multi-tenant, orientativ:

- `organizations`
- `organization_members`
- `organization_modules`
- tabelele de date ale fiecărui modul cu `organization_id`

RLS (Row Level Security) trebuie să izoleze strict datele unei organizații de celelalte.

## Contract recomandat pentru module

Fiecare modul nou trebuie să aibă:

1. un ID stabil;
2. metadate în registry;
3. componentă UI proprie;
4. date scoped prin `organization_id`;
5. permisiuni independente;
6. zero dependențe de identitatea unui client anume;
7. empty/loading/error states consistente cu workspace-ul.

## Principiul ORBYVEN

Complexitatea rămâne în spate. Clientul vede doar ce îi este util.
