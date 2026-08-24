-- ORBITA CREATIVE - Admin access
-- Rulează după leads.sql

grant select on table public.leads to authenticated;
grant update (status) on table public.leads to authenticated;

drop policy if exists "Authenticated admins can read ORBITA leads" on public.leads;

create policy "Authenticated admins can read ORBITA leads"
on public.leads
for select
to authenticated
using (true);

drop policy if exists "Authenticated admins can update ORBITA lead status" on public.leads;

create policy "Authenticated admins can update ORBITA lead status"
on public.leads
for update
to authenticated
using (true)
with check (status in ('new', 'contacted', 'won', 'lost'));
