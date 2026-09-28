create or replace function public.submit_project_request(
  p_plan_id text,
  p_payment_mode text,
  p_company_name text,
  p_contact_name text,
  p_email text,
  p_phone text,
  p_project_title text,
  p_project_details text,
  p_source text,
  p_privacy_accepted boolean,
  p_marketing_consent boolean default false
)
returns table(id uuid, request_no bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan_id text := nullif(trim(coalesce(p_plan_id, '')), '');
  v_payment_mode text := trim(coalesce(p_payment_mode, ''));
  v_company_name text := nullif(trim(coalesce(p_company_name, '')), '');
  v_contact_name text := trim(coalesce(p_contact_name, ''));
  v_email text := lower(trim(coalesce(p_email, '')));
  v_phone text := nullif(trim(coalesce(p_phone, '')), '');
  v_project_title text := trim(coalesce(p_project_title, ''));
  v_project_details text := trim(coalesce(p_project_details, ''));
  v_source text := coalesce(nullif(trim(coalesce(p_source, '')), ''), 'public_site');
begin
  if v_payment_mode not in ('subscription', 'full_payment', 'custom_quote') then
    raise exception 'invalid payment mode' using errcode = '22023';
  end if;

  if v_plan_id is not null and v_plan_id not in ('start', 'business', 'pro') then
    raise exception 'invalid plan' using errcode = '22023';
  end if;

  if v_payment_mode = 'subscription' and v_plan_id is null then
    raise exception 'subscription requires plan' using errcode = '22023';
  end if;

  if p_privacy_accepted is distinct from true then
    raise exception 'privacy acceptance required' using errcode = '22023';
  end if;

  if v_contact_name = '' or char_length(v_contact_name) > 120 then
    raise exception 'invalid contact name' using errcode = '22023';
  end if;

  if v_email = '' or char_length(v_email) > 254 or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'invalid email' using errcode = '22023';
  end if;

  if v_project_title = '' or char_length(v_project_title) > 180 then
    raise exception 'invalid project title' using errcode = '22023';
  end if;

  if v_project_details = '' or char_length(v_project_details) > 5000 then
    raise exception 'invalid project details' using errcode = '22023';
  end if;

  if v_company_name is not null and char_length(v_company_name) > 160 then
    raise exception 'invalid company name' using errcode = '22023';
  end if;

  if v_phone is not null and char_length(v_phone) > 60 then
    raise exception 'invalid phone' using errcode = '22023';
  end if;

  if char_length(v_source) > 120 then
    raise exception 'invalid source' using errcode = '22023';
  end if;

  if exists (
    select 1
    from public.project_requests pr
    where lower(pr.email) = v_email
      and pr.created_at > now() - interval '30 seconds'
  ) then
    raise exception 'request submitted too recently' using errcode = 'P0001';
  end if;

  return query
  insert into public.project_requests (
    plan_id,
    payment_mode,
    company_name,
    contact_name,
    email,
    phone,
    project_title,
    project_details,
    source,
    privacy_accepted_at,
    marketing_consent
  )
  values (
    v_plan_id,
    v_payment_mode,
    v_company_name,
    v_contact_name,
    v_email,
    v_phone,
    v_project_title,
    v_project_details,
    v_source,
    now(),
    coalesce(p_marketing_consent, false)
  )
  returning project_requests.id, project_requests.request_no;
end;
$$;

revoke all on function public.submit_project_request(text, text, text, text, text, text, text, text, text, boolean, boolean) from public;
grant execute on function public.submit_project_request(text, text, text, text, text, text, text, text, text, boolean, boolean) to anon, authenticated, service_role;

comment on function public.submit_project_request(text, text, text, text, text, text, text, text, text, boolean, boolean) is
  'Validated insert-only gateway for public ORBYVEN project requests. Keeps project_requests table itself inaccessible to anon/authenticated roles.';
