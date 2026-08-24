# ORBYVEN — Cloud Workspace

Scopul acestei configurări este ca proiectul ORBYVEN să poată fi continuat de pe orice PC/laptop fără să depindă de calculatorul principal.

## Arhitectura

GitHub
- codul sursă
- istoric / commits
- branches

GitHub Codespaces
- mediul de dezvoltare din cloud
- VS Code în browser sau VS Code Desktop
- Node.js și extensiile instalate automat

Vercel
- Preview Deployments
- Production Deployment

Supabase
- baza de date / backend

## 1. Pune fișierul în repository

Structura trebuie să conțină:

.devcontainer/
  devcontainer.json

Nu modifica `.env.local` și NU îl urca în GitHub.

## 2. Commit

```bash
git add .
git commit -m "Add ORBYVEN cloud workspace"
git push
```

## 3. Creează primul Codespace

Pe GitHub:

1. Deschide repository-ul ORBYVEN.
2. Apasă **Code**.
3. Deschide tab-ul **Codespaces**.
4. Apasă **Create codespace**.
5. Alege branch-ul pe care vrei să lucrezi.

Prima pornire va rula automat:

```bash
npm ci
```

iar dacă `npm ci` nu poate fi folosit, configurarea încearcă automat:

```bash
npm install
```

## 4. Environment variables

Valorile din `.env.local` NU trebuie puse în repository.

În GitHub:

Repository
→ Settings
→ Secrets and variables
→ Codespaces
→ New repository secret

Creează câte un secret pentru fiecare variabilă de mediu pe care proiectul o folosește.

Folosește exact ACELEAȘI NUME ale cheilor existente în `.env.local`.

Exemplu generic:

```text
NEXT_PUBLIC_...
SUPABASE_...
RESEND_...
```

Nu copia exemplele ca atare. Folosește numele reale din proiect.

Nu trimite valorile secrete în chat și nu le salva în Git.

## 5. Pornește ORBYVEN

În terminalul Codespace:

```bash
npm run dev
```

Codespaces va detecta portul `3000`.

Poți apăsa pe notificarea de port pentru a deschide site-ul.

Dacă Next.js nu expune portul corect, folosește:

```bash
npm run dev -- --hostname 0.0.0.0
```

## 6. De pe laptop

Ai două variante.

### Browser

GitHub
→ repository ORBYVEN
→ Code
→ Codespaces
→ deschizi Codespace-ul existent.

Nu trebuie instalat nimic în afară de browser.

### VS Code Desktop

Instalezi:
- Visual Studio Code
- extensia GitHub Codespaces

Te autentifici în GitHub și alegi:

**Connect to Codespace**

VS Code rulează pe laptop, dar proiectul și terminalul sunt în cloud.

## 7. Workflow recomandat

Nu lucra direct în Production pentru experimente.

Exemplu:

```bash
git switch main
git pull

git switch -c feature/nume-feature
```

Lucrezi.

Apoi:

```bash
git add .
git commit -m "Descriere modificare"
git push -u origin feature/nume-feature
```

Vercel generează Preview Deployment.

După ce totul este verificat, feature-ul poate fi integrat în `main`.

## 8. Când schimbi hardware-ul

Nu trebuie să copiezi proiectul cu stick sau Drive.

Pe orice dispozitiv:

1. intri în GitHub;
2. deschizi Codespace;
3. continui proiectul.

Dacă ai lucrat local înainte să pleci, asigură-te că ai făcut:

```bash
git status
git add .
git commit -m "Save work before switching device"
git push
```

Altfel, modificările necomise există doar pe calculatorul respectiv.

## 9. Important — Codespace vs GitHub

Codespace-ul persistă, dar GitHub trebuie să rămână sursa oficială.

Regula ORBYVEN:

```text
Modificare
↓
Test
↓
Commit
↓
GitHub
↓
Vercel Preview
↓
Production
```

Nu considera modificarea salvată definitiv până nu este în GitHub.

## 10. Când termini lucrul

Oprește Codespace-ul când nu îl folosești.

GitHub:
→ Codespaces
→ ...
→ Stop codespace

Asta evită consumul inutil de resurse de cloud.

## Checklist înainte să pleci

- [ ] toate modificările actuale sunt committed
- [ ] toate commit-urile sunt pushed
- [ ] Codespace-ul pornește
- [ ] `npm run dev` funcționează în Codespace
- [ ] environment variables sunt configurate în Codespaces Secrets
- [ ] Contact / Supabase funcționează din Codespace
- [ ] Vercel Preview funcționează
- [ ] laptopul poate deschide același Codespace
