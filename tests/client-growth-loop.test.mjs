import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { evaluateClientGrowth } from "../lib/automation/client-growth.ts";

const read = (path) => readFileSync(join(process.cwd(), path), "utf8");

const work = {
  id: "work-2",
  title: "Revizie instalație",
  completedAt: "2026-09-20T10:00:00.000Z",
};

const baseGrowth = {
  organization_id: "org-1",
  client_id: "client-1",
  feedback_task_id: "work-2",
  feedback_status: "received",
  feedback_score: 5,
  feedback_note: null,
  feedback_requested_at: "2026-09-22T10:00:00.000Z",
  feedback_received_at: "2026-09-23T10:00:00.000Z",
  review_status: "idle",
  review_requested_at: null,
  review_completed_at: null,
  referral_status: "idle",
  referral_requested_at: null,
  referral_received_at: null,
  upsell_status: "idle",
  upsell_next_at: null,
  upsell_hint: null,
  updated_by: null,
  created_at: "2026-09-22T10:00:00.000Z",
  updated_at: "2026-09-23T10:00:00.000Z",
};

test("completed work opens feedback after a short cooldown", () => {
  const result = evaluateClientGrowth(
    null,
    work,
    new Date("2026-09-23T10:00:00.000Z")
  );
  assert.equal(result.action, "feedback_due");
  assert.equal(result.taskId, work.id);
});

test("a newer completed work starts a fresh feedback cycle", () => {
  const result = evaluateClientGrowth(
    { ...baseGrowth, feedback_task_id: "work-1" },
    work,
    new Date("2026-10-01T10:00:00.000Z")
  );
  assert.equal(result.action, "feedback_due");
});

test("poor feedback blocks review referral and upsell", () => {
  const result = evaluateClientGrowth(
    { ...baseGrowth, feedback_score: 2 },
    work,
    new Date("2026-10-01T10:00:00.000Z")
  );
  assert.equal(result.action, "recovery_needed");
  assert.equal(result.positiveFeedback, false);
  assert.equal(result.level, "urgent");
});

test("positive feedback progresses review to referral to upsell", () => {
  const now = new Date("2026-10-01T10:00:00.000Z");

  const review = evaluateClientGrowth(baseGrowth, work, now);
  assert.equal(review.action, "review_ready");

  const referral = evaluateClientGrowth(
    {
      ...baseGrowth,
      review_status: "completed",
      review_completed_at: "2026-09-25T10:00:00.000Z",
    },
    work,
    now
  );
  assert.equal(referral.action, "referral_ready");

  const upsell = evaluateClientGrowth(
    {
      ...baseGrowth,
      review_status: "completed",
      review_completed_at: "2026-09-25T10:00:00.000Z",
      referral_status: "received",
      referral_received_at: "2026-09-27T10:00:00.000Z",
    },
    work,
    now
  );
  assert.equal(upsell.action, "upsell_ready");
});

test("scheduled upsell becomes actionable only when due", () => {
  const future = evaluateClientGrowth(
    {
      ...baseGrowth,
      review_status: "completed",
      referral_status: "received",
      upsell_status: "scheduled",
      upsell_next_at: "2026-10-10T10:00:00.000Z",
    },
    work,
    new Date("2026-10-01T10:00:00.000Z")
  );
  assert.equal(future.action, "none");

  const due = evaluateClientGrowth(
    {
      ...baseGrowth,
      review_status: "completed",
      referral_status: "received",
      upsell_status: "scheduled",
      upsell_next_at: "2026-09-30T10:00:00.000Z",
    },
    work,
    new Date("2026-10-01T10:00:00.000Z")
  );
  assert.equal(due.action, "upsell_due");
});

test("Client Growth database surface is tenant-safe and entitlement-aware", () => {
  const sql = read("supabase/migrations/20261002073000_client_growth_loop.sql");
  assert.match(sql, /create table if not exists public\.crm_client_growth/);
  assert.match(sql, /alter table public\.crm_client_growth enable row level security/);
  assert.match(sql, /private\.is_org_member\(organization_id\)/);
  assert.match(sql, /m\.access_status = 'active'/);
  assert.match(sql, /private\.is_billing_module_allowed\(organization_id, 'leads'\)/);
  assert.match(sql, /revoke all on public\.crm_client_growth from anon/);
  assert.match(sql, /foreign key \(organization_id, client_id\)/);
});

test("Client Growth UI never sends outreach automatically", () => {
  const source = read("components/modules/ClientGrowthPanel.tsx");
  assert.match(source, /fără trimiteri automate/);
  assert.doesNotMatch(source, /fetch\(/);
  assert.doesNotMatch(source, /sendEmail|sendSms|sendWhatsapp/i);
  assert.match(source, /Marchează feedback cerut/);
  assert.match(source, /\+ Creează ofertă relevantă/);
});

test("Activity Center and Overview consume the same Client Growth signals", () => {
  const signals = read("lib/automation/client-growth-signals.ts");
  const activity = read("lib/modules/activity.ts");
  const overview = read("lib/modules/overview.ts");
  assert.match(signals, /buildClientGrowthSignals/);
  assert.match(activity, /buildClientGrowthSignals/);
  assert.match(overview, /buildClientGrowthSignals/);
  assert.match(activity, /growthSignals/);
  assert.match(overview, /growthSignals/);
});

test("Next Best Action deduplicates growth and lifecycle by client", () => {
  const source = read("lib/automation/next-best-action.ts");
  assert.match(source, /CLIENT_CONTEXT_RULES/);
  assert.match(source, /client_recovery_needed/);
  assert.match(source, /client_feedback_due/);
  assert.match(source, /client_review_opportunity/);
  assert.match(source, /client_referral_opportunity/);
  assert.match(source, /client_upsell_opportunity/);
  assert.match(source, /return "client:" \+ item\.clientId/);
});
