# ORBYVEN — Workspace Backend

## Sursa oficială

Shell-ul și registry-ul modulelor sunt deja în `main`:

- `app/workspace/page.tsx`
- `components/ClientWorkspace.tsx`
- `lib/orbyven-modules.ts`
- `ORBYVEN-MODULES.md`

Backend-ul real folosește proiectul Supabase `orbita-creative` și schema multi-tenant deja existentă.

## Schema canonică

Nu crea o a doua familie de tabele pentru workspace.

Folosim:

- `public.organizations`
- `public.organization_members`
- `public.organization_modules`
- `public.organization_profiles`

### organizations

Identitatea tenantului / companiei.

Câmpuri relevante:

- `id`
- `name`
- `slug`
- `legal_name`
- `created_by`
- `created_at`
- `updated_at`

### organization_members

Leagă utilizatorii Supabase Auth de o companie.

Roluri suportate de schema live:

- `owner`
- `admin`
- `manager`
- `member`
- `viewer`

Cheie primară: `(organization_id, user_id)`.

### organization_modules

Persistența modulelor activate pentru fiecare companie.

Câmpuri relevante:

- `organization_id`
- `module_id`
- `enabled`
- `settings` (`jsonb`)
- `created_at`
- `updated_at`

Cheie primară: `(organization_id, module_id)`.

`module_id` trebuie să rămână aliniat cu `lib/orbyven-modules.ts`.

### organization_profiles

Date de prezentare/configurare ale workspace-ului:

- `display_name`
- `greeting_name`
- `logo_url`
- `timezone`
- `locale`
- `settings`

## RLS

RLS (Row Level Security) este activ pe tabelele multi-tenant.

Helper-ele canonice sunt în schema `private`:

- `private.is_org_member(uuid)`
- `private.is_org_admin(uuid)`

Un membru poate citi doar datele organizației sale. Modificarea configurației organizației/modulelor este rezervată owner/admin.

## Migrations deja aplicate în Supabase

- `20260907095853_orbyven_multi_tenant_foundation`
- `20260907095925_harden_org_rls_helpers`
- `workspace_bootstrap_rpc`
- `lock_down_workspace_bootstrap_rpc`

Fișierul `supabase/migrations/20260907_workspace_backend.sql` reprezintă integrarea repository-ului cu această fundație și definește RPC-ul de onboarding.

## Flow client

```text
/workspace/login
      ↓
Supabase Auth
      ↓
organization_members
      ↓
nu există membership → /workspace/onboarding
      ↓
bootstrap_organization(...)
      ↓
organizations + owner membership + profile + module assignments
      ↓
/workspace
```

## Module

Registry-ul din cod este sursa pentru catalogul UI. Supabase salvează doar ce module sunt activate și configurația per organizație.

ID-uri curente:

- `overview`
- `leads`
- `tasks`
- `calendar`
- `estimates`
- `documents`
- `expenses`
- `team`

`overview` este modul core și nu trebuie eliminat.

## Regula pentru celelalte chat-uri / module

Un modul nou:

1. primește un ID stabil în `lib/orbyven-modules.ts`;
2. nu hardcodează clientul;
3. orice tabel de date al modulului conține `organization_id`;
4. RLS izolează tenantul;
5. configurarea specifică firmei stă în date / `organization_modules.settings`, nu în componentă;
6. nu creează un nou sistem paralel de `organizations` sau `members`.

## Situație tranzitorie

`ClientWorkspace.tsx` încă folosește `localStorage` pentru selectorul vizual de module deoarece acesta a fost construit inițial ca preview UI. `WorkspaceGate.tsx` îl sincronizează temporar cu Supabase pentru a păstra componenta existentă intactă.

Pasul următor este eliminarea completă a acestei punți și transmiterea contextului real (`organization`, `role`, `enabledModules`) direct către shell prin props/context.
