-- ORBYVEN public client feedback links.
-- Public access is RPC-only. The table remains tenant protected and hidden from anon.

create table if not exists public.crm_feedback_links (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  task_id uuid not null,
  client_id uuid not null,
  public_token uuid not null default gen_random_uuid(),
  expires_at timestamptz not null default (now() + interval '30 days'),
  revoked_at timestamptz,
  submitted_at timestamptz,
  score smallint check (score is null or score between 1 and 5),
  feedback_note text check (feedback_note is null or char_length(feedback_note) <= 1200),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint crm_feedback_links_task_fk
    foreign key (organization_id, task_id)
    references public.ops_tasks(organization_id, id)
    on delete cascade,
  constraint crm_feedback_links_client_fk
    foreign key (organization_id, client_id)
    references public.crm_leads(organization_id, id)
    on delete cascade,
  constraint crm_feedback_links_org_task_key unique (organization_id, task_id),
  constraint crm_feedback_links_public_token_key unique (public_token)
);

create index if not exists crm_feedback_links_org_client_idx
  on public.crm_feedback_links(organization_id, client_id, created_at desc);
create index if not exists crm_feedback_links_expiry_idx
  on public.crm_feedback_links(expires_at)
  where submitted_at is null and revoked_at is null;

drop trigger if exists crm_feedback_links_set_updated_at on public.crm_feedback_links;
create trigger crm_feedback_links_set_updated_at
before update on public.crm_feedback_links
for each row execute function public.set_updated_at();

alter table public.crm_feedback_links enable row level security;

drop policy if exists crm_feedback_links_select_member on public.crm_feedback_links;
create policy crm_feedback_links_select_member
on public.crm_feedback_links
for select to authenticated
using (private.is_org_member(organization_id));

drop policy if exists crm_feedback_links_insert_operator on public.crm_feedback_links;
create policy crm_feedback_links_insert_operator
on public.crm_feedback_links
for insert to authenticated
with check (
  private.is_org_member(organization_id)
  and private.is_billing_module_allowed(organization_id, 'leads')
  and exists (
    select 1
    from public.organization_members m
    where m.organization_id = crm_feedback_links.organization_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner','admin','manager','member')
      and m.access_status = 'active'
  )
);

drop policy if exists crm_feedback_links_update_operator on public.crm_feedback_links;
create policy crm_feedback_links_update_operator
on public.crm_feedback_links
for update to authenticated
using (
  private.is_org_member(organization_id)
  and private.is_billing_module_allowed(organization_id, 'leads')
  and exists (
    select 1
    from public.organization_members m
    where m.organization_id = crm_feedback_links.organization_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner','admin','manager','member')
      and m.access_status = 'active'
  )
)
with check (
  private.is_org_member(organization_id)
  and private.is_billing_module_allowed(organization_id, 'leads')
  and exists (
    select 1
    from public.organization_members m
    where m.organization_id = crm_feedback_links.organization_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner','admin','manager','member')
      and m.access_status = 'active'
  )
);

drop policy if exists crm_feedback_links_delete_operator on public.crm_feedback_links;
create policy crm_feedback_links_delete_operator
on public.crm_feedback_links
for delete to authenticated
using (
  private.is_org_member(organization_id)
  and private.is_billing_module_allowed(organization_id, 'leads')
  and exists (
    select 1
    from public.organization_members m
    where m.organization_id = crm_feedback_links.organization_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner','admin','manager')
      and m.access_status = 'active'
  )
);

grant select, insert, update, delete on public.crm_feedback_links to authenticated;
revoke all on public.crm_feedback_links from anon;

create or replace function public.create_or_refresh_client_feedback_link(
  p_organization_id uuid,
  p_task_id uuid,
  p_client_id uuid
)
returns table(
  public_token uuid,
  expires_at timestamptz,
  submitted boolean
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_existing public.crm_feedback_links%rowtype;
  v_token uuid;
  v_expires timestamptz;
begin
  if (select auth.uid()) is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if not private.is_billing_module_allowed(p_organization_id, 'leads') then
    raise exception 'module unavailable' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.organization_members m
    where m.organization_id = p_organization_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner','admin','manager','member')
      and m.access_status = 'active'
  ) then
    raise exception 'insufficient role' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.ops_tasks t
    join public.crm_leads c
      on c.organization_id = t.organization_id
     and c.id = t.client_id
    where t.organization_id = p_organization_id
      and t.id = p_task_id
      and t.client_id = p_client_id
      and t.kind in ('work','order')
      and t.status = 'done'
      and c.kind = 'client'
  ) then
    raise exception 'completed client work required' using errcode = '22023';
  end if;

  select *
    into v_existing
  from public.crm_feedback_links fl
  where fl.organization_id = p_organization_id
    and fl.task_id = p_task_id
  for update;

  if found and v_existing.submitted_at is not null then
    return query
      select v_existing.public_token, v_existing.expires_at, true;
    return;
  end if;

  if found
     and v_existing.revoked_at is null
     and v_existing.expires_at > now() then
    return query
      select v_existing.public_token, v_existing.expires_at, false;
    return;
  end if;

  v_token := gen_random_uuid();
  v_expires := now() + interval '30 days';

  if found then
    update public.crm_feedback_links
    set
      client_id = p_client_id,
      public_token = v_token,
      expires_at = v_expires,
      revoked_at = null,
      score = null,
      feedback_note = null,
      submitted_at = null
    where id = v_existing.id;
  else
    insert into public.crm_feedback_links (
      organization_id,
      task_id,
      client_id,
      public_token,
      expires_at,
      created_by
    )
    values (
      p_organization_id,
      p_task_id,
      p_client_id,
      v_token,
      v_expires,
      (select auth.uid())
    );
  end if;

  return query select v_token, v_expires, false;
end;
$function$;

revoke all on function public.create_or_refresh_client_feedback_link(uuid, uuid, uuid) from public;
grant execute on function public.create_or_refresh_client_feedback_link(uuid, uuid, uuid)
  to authenticated, service_role;

create or replace function public.get_public_client_feedback_context(p_token uuid)
returns table(
  organization_name text,
  task_title text,
  available boolean,
  submitted boolean
)
language sql
stable
security definer
set search_path = ''
as $function$
  select
    o.name,
    t.title,
    (
      fl.revoked_at is null
      and fl.expires_at > now()
      and fl.submitted_at is null
      and t.status = 'done'
      and t.client_id = fl.client_id
    ) as available,
    fl.submitted_at is not null as submitted
  from public.crm_feedback_links fl
  join public.organizations o
    on o.id = fl.organization_id
  join public.ops_tasks t
    on t.organization_id = fl.organization_id
   and t.id = fl.task_id
  where fl.public_token = p_token
  limit 1;
$function$;

revoke all on function public.get_public_client_feedback_context(uuid) from public;
grant execute on function public.get_public_client_feedback_context(uuid)
  to anon, authenticated, service_role;

create or replace function public.submit_public_client_feedback(
  p_token uuid,
  p_score smallint,
  p_note text default null
)
returns table(accepted boolean)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_link public.crm_feedback_links%rowtype;
  v_note text := nullif(trim(coalesce(p_note, '')), '');
  v_body text;
begin
  if p_score is null or p_score < 1 or p_score > 5 then
    raise exception 'invalid feedback score' using errcode = '22023';
  end if;

  if v_note is not null and char_length(v_note) > 1200 then
    raise exception 'feedback note too long' using errcode = '22023';
  end if;

  select *
    into v_link
  from public.crm_feedback_links fl
  where fl.public_token = p_token
  for update;

  if not found then
    raise exception 'feedback link not found' using errcode = 'P0002';
  end if;

  if v_link.revoked_at is not null
     or v_link.expires_at <= now()
     or v_link.submitted_at is not null then
    raise exception 'feedback link unavailable' using errcode = 'P0001';
  end if;

  if not exists (
    select 1
    from public.ops_tasks t
    where t.organization_id = v_link.organization_id
      and t.id = v_link.task_id
      and t.client_id = v_link.client_id
      and t.status = 'done'
  ) then
    raise exception 'feedback task unavailable' using errcode = 'P0001';
  end if;

  update public.crm_feedback_links
  set
    submitted_at = now(),
    score = p_score,
    feedback_note = v_note
  where id = v_link.id;

  v_body :=
    '[ORBYVEN:POST_SERVICE] task=' || v_link.task_id::text ||
    ';event=feedback_scored;score=' || p_score::text ||
    ' | Feedback public: ' || p_score::text || '/5.' ||
    case
      when v_note is null then ''
      else ' Comentariu: ' || v_note
    end;

  insert into public.crm_lead_activities (
    organization_id,
    lead_id,
    kind,
    body,
    occurred_at,
    created_by
  )
  values (
    v_link.organization_id,
    v_link.client_id,
    'status',
    v_body,
    now(),
    null
  );

  update public.crm_leads
  set last_contact_at = now()
  where organization_id = v_link.organization_id
    and id = v_link.client_id;

  return query select true;
end;
$function$;

revoke all on function public.submit_public_client_feedback(uuid, smallint, text) from public;
grant execute on function public.submit_public_client_feedback(uuid, smallint, text)
  to anon, authenticated, service_role;

comment on table public.crm_feedback_links is
  'Tenant-owned, opaque public links for one-time post-service client feedback.';
comment on function public.get_public_client_feedback_context(uuid) is
  'Public feedback context gateway. Returns only organization name, task title and availability state.';
comment on function public.submit_public_client_feedback(uuid, smallint, text) is
  'Single-use public feedback submission gateway. Writes the canonical ORBYVEN post-service CRM marker.';

comment on function public.create_or_refresh_client_feedback_link(uuid, uuid, uuid) is
  'Authenticated tenant-safe link generator for completed client work. Refreshes only unsubmitted links.';
