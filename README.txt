ORBITA CREATIVE ADMIN

1. Supabase -> SQL Editor:
   rulează supabase/admin-policies.sql

2. Supabase -> Authentication -> Users:
   creează manual un utilizator admin cu email + parolă.
   Nu crea pagină publică de signup.

3. Copiază în web-studio:
   app/admin/login/page.tsx
   app/admin/page.tsx

4. Restart:
   npm run dev -- --webpack -p 3001

5. Deschide:
   http://localhost:3001/admin/login

Dashboard-ul poate:
- vedea toate lead-urile
- căuta și filtra
- schimba statusul new/contacted/won/lost
- deschide email-ul clientului
- logout
