import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (path) => readFileSync(join(process.cwd(), path), "utf8");

test("public feedback storage remains private and tenant scoped", () => {
  const sql = read("supabase/migrations/20261002075500_public_client_feedback.sql");
  assert.match(sql, /create table if not exists public\.crm_feedback_links/);
  assert.match(sql, /alter table public\.crm_feedback_links enable row level security/);
  assert.match(sql, /private\.is_org_member\(organization_id\)/);
  assert.match(sql, /private\.is_billing_module_allowed\(organization_id, 'leads'\)/);
  assert.match(sql, /create policy billing_entitlement_guard/);
  assert.match(sql, /private\.has_module_entitlement\(fl\.organization_id, 'leads'\)/);
  assert.match(sql, /private\.has_module_entitlement\(v_link\.organization_id, 'leads'\)/);
  assert.match(sql, /m\.access_status = 'active'/
  assert.match(sql, /revoke all on public\.crm_feedback_links from anon/);
  assert.doesNotMatch(sql, /grant select[^;]+crm_feedback_links to anon/i);
});

test("authenticated link generator validates role, completed work and preserves active tokens", () => {
  const sql = read("supabase/migrations/20261002075500_public_client_feedback.sql");
  assert.match(sql, /create_or_refresh_client_feedback_link/);
  assert.match(sql, /m\.role in \('owner','admin','manager','member'\)/);
  assert.match(sql, /t\.kind in \('work','order'\)/);
  assert.match(sql, /t\.status = 'done'/);
  assert.match(sql, /c\.kind = 'client'/);
  assert.match(sql, /v_existing\.expires_at > now\(\)/);
  assert.match(sql, /select v_existing\.public_token, v_existing\.expires_at, false/);
  assert.match(sql, /grant execute on function public\.create_or_refresh_client_feedback_link[^;]+to authenticated, service_role/s);
  assert.doesNotMatch(sql, /grant execute on function public\.create_or_refresh_client_feedback_link[^;]+to anon/s);
});

test("public context exposes only minimum feedback metadata", () => {
  const sql = read("supabase/migrations/20261002075500_public_client_feedback.sql");
  const contextFunction =
    sql.match(/create or replace function public\.get_public_client_feedback_context[\s\S]*?\$function\$;/)?.[0] ?? "";
  assert.match(contextFunction, /organization_name text/);
  assert.match(contextFunction, /task_title text/);
  assert.match(contextFunction, /available boolean/);
  assert.match(contextFunction, /submitted boolean/);
  assert.doesNotMatch(contextFunction, /email|phone|client_name|feedback_note/);
  assert.match(sql, /grant execute on function public\.get_public_client_feedback_context\(uuid\)[\s\S]*?to anon, authenticated, service_role/);
});

test("public feedback submission is single-use and writes canonical Growth marker", () => {
  const sql = read("supabase/migrations/20261002075500_public_client_feedback.sql");
  const submitFunction =
    sql.match(/create or replace function public\.submit_public_client_feedback[\s\S]*?\$function\$;/)?.[0] ?? "";
  assert.match(submitFunction, /for update/);
  assert.match(submitFunction, /p_score < 1 or p_score > 5/);
  assert.match(submitFunction, /char_length\(v_note\) > 1200/);
  assert.match(submitFunction, /v_link\.submitted_at is not null/);
  assert.match(submitFunction, /t\.status = 'done'/);
  assert.match(submitFunction, /event=feedback_scored;score=/);
  assert.match(submitFunction, /insert into public\.crm_lead_activities/);
  assert.match(submitFunction, /update public\.crm_leads[\s\S]*last_contact_at = now\(\)/);
});

test("public feedback UI is login-free and submits only score plus optional note", () => {
  const page = read("app/feedback/[token]/page.tsx");
  const form = read("components/public/ClientFeedbackForm.tsx");
  const service = read("lib/modules/feedback-links.ts");
  assert.match(page, /ClientFeedbackForm token=\{token\}/);
  assert.match(page, /index: false/);
  assert.match(page, /follow: false/);
  assert.match(page, /referrer: "no-referrer"/);
  assert.match(form, /\[1, 2, 3, 4, 5\]/);
  assert.match(form, /Trimite feedback/);
  assert.match(form, /Link unic, utilizabil o singură dată/);
  assert.match(service, /submit_public_client_feedback/);
  assert.match(service, /p_score: score/);
  assert.match(service, /p_note: cleanNote/);
  assert.doesNotMatch(form, /signIn|password|auth\./i);
});

test("completed work can copy a stable feedback link without auto-sending", () => {
  const tasks = read("components/modules/TasksModule.tsx");
  assert.match(tasks, /createOrRefreshClientFeedbackLink/);
  assert.match(tasks, /Copiază link feedback/);
  assert.match(tasks, /navigator\.clipboard\.writeText/);
  assert.match(tasks, /\/feedback\/\$\{link\.public_token\}/);
  assert.doesNotMatch(tasks, /sendEmail|sendSms|sendWhatsapp/i);
});
