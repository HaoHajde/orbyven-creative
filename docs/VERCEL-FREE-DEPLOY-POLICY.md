# ORBYVEN — politica de deploy pentru Vercel Hobby

Regulă activă de la etapa dashboard Alpha 0.2. Nu schimbă checkpointul Alpha 0.1.

## Configurația aplicată

În `vercel.json`, `git.deploymentEnabled` are `"**": false` și `"main": true` (tiparul `**` acoperă și branch-uri cu `/`, de exemplu `feature/dashboard-*`).
Astfel, după ce integrarea Vercel aplică configurația, branch-urile de lucru și checkpoint nu ar trebui să creeze automat Preview deployments;
`main` continuă să declanșeze deploymentul de producție.

## Regula temporară Preview First (23.09.2026)

Până la ridicarea restricției Vercel și acordul explicit al proprietarului
ORBYVEN: doar prototipuri în chat, fișiere offline, lucru local și CI GitHub.
**Nu facem merge în `main`, deploymenturi de preview/producție Vercel sau
redeploy manual** în urma unui simplu „go” / „continuă” / „implementează”.
Un branch de dezvoltare și un PR draft pentru CI nu autorizează publicarea.
Înainte de release confirmăm build-ul, migrațiile, testele pilot și abia apoi
cerem permisiunea explicită pentru un singur merge/deploy.

## Mod de lucru obligatoriu

1. Începem un branch de feature din ultimul `main`, separat de checkpoint-uri.
2. Grupăm ajustările într-un PR coerent, nu facem merge după fiecare componentă.
3. Folosim `npm run validate` (lint, typecheck și Next build) și GitHub CI pe PR.
4. Merge pe `main` doar după validare, sincronizare și verificarea migrațiilor necesare.
5. O rundă de merge = un deployment de producție; evităm redeploy/force fără motiv.
6. Pentru preview vizual necesar în mod excepțional, activăm temporar un branch
   dedicat și apoi dezactivăm excepția. Nu activăm toate branch-urile pentru comoditate.
7. Nu folosim Ignored Build Step drept metodă principală de reducere a cotei:
   buildurile anulate pot continua să conteze în cota de deploymenturi.

Limitări: regula de repository nu poate opri deploy-uri CLI/hook pornite manual,
alte proiecte Vercel conectate la același repository sau setări externe necunoscute.
La actualizări urgente de securitate facem merge imediat, fără a aștepta un batch.

Referințe:
- https://vercel.com/docs/project-configuration/git-configuration
- https://vercel.com/docs/project-configuration/project-settings
- https://vercel.com/docs/limits
