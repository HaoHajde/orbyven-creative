import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildPostServiceGrowthState,
  displayPostServiceActivity,
  encodePostServiceEvent,
  evaluatePostServiceGrowth,
  parsePostServiceEvent,
} from "../lib/automation/post-service-growth.ts";

const read = (path) => readFileSync(join(process.cwd(), path), "utf8");
const now = new Date("2026-10-02T10:00:00.000Z");
const completedAt = "2026-08-20T10:00:00.000Z";

function event(type, occurredAt = "2026-08-22T10:00:00.000Z") {
  const body = encodePostServiceEvent("task-1", type);
  return parsePostServiceEvent(body, occurredAt);
}

test("post-service CRM markers round-trip while keeping clean display copy", () => {
  const body = encodePostServiceEvent(
    "task-1",
    "feedback_positive",
    "Client mulțumit de lucrare."
  );
  assert.match(body, /^\[ORBYVEN:POST_SERVICE\] task=task-1;event=feedback_positive/);
  assert.deepEqual(parsePostServiceEvent(body, "2026-08-22T10:00:00.000Z"), {
    taskId: "task-1",
    type: "feedback_positive",
    occurredAt: "2026-08-22T10:00:00.000Z",
  });
  assert.equal(displayPostServiceActivity(body), "Client mulțumit de lucrare.");
});

test("post-service growth progresses feedback to review, referral and upsell", () => {
  const feedbackDue = evaluatePostServiceGrowth({
    taskTitle: "Montaj",
    completedAt,
    state: buildPostServiceGrowthState([]),
    now,
  });
  assert.equal(feedbackDue?.rule, "post_service_feedback");

  const positiveState = buildPostServiceGrowthState([
    event("feedback_positive"),
  ].filter(Boolean));
  assert.equal(evaluatePostServiceGrowth({
    taskTitle: "Montaj",
    completedAt,
    state: positiveState,
    now,
  })?.rule, "post_service_review");

  const reviewState = buildPostServiceGrowthState([
    event("feedback_positive"),
    event("review_requested", "2026-08-23T10:00:00.000Z"),
  ].filter(Boolean));
  assert.equal(evaluatePostServiceGrowth({
    taskTitle: "Montaj",
    completedAt,
    state: reviewState,
    now,
  })?.rule, "post_service_referral");

  const referralState = buildPostServiceGrowthState([
    event("feedback_positive"),
    event("review_requested", "2026-08-23T10:00:00.000Z"),
    event("referral_requested", "2026-08-24T10:00:00.000Z"),
  ].filter(Boolean));
  assert.equal(evaluatePostServiceGrowth({
    taskTitle: "Montaj",
    completedAt,
    state: referralState,
    now,
    hasOpenWorkForClient: false,
  })?.rule, "post_service_upsell");
  assert.equal(evaluatePostServiceGrowth({
    taskTitle: "Montaj",
    completedAt,
    state: referralState,
    now,
    hasOpenWorkForClient: true,
  }), null);
});

test("reported problems force recovery and resolved recovery re-enters feedback loop", () => {
  const issueState = buildPostServiceGrowthState([
    event("feedback_issue"),
  ].filter(Boolean));
  assert.equal(evaluatePostServiceGrowth({
    taskTitle: "Montaj",
    completedAt,
    state: issueState,
    now,
  })?.rule, "post_service_recovery");

  const recoveredState = buildPostServiceGrowthState([
    event("feedback_issue"),
    event("recovery_resolved", "2026-09-30T10:00:00.000Z"),
  ].filter(Boolean));
  assert.equal(recoveredState.feedback, "requested");
  assert.equal(evaluatePostServiceGrowth({
    taskTitle: "Montaj",
    completedAt,
    state: recoveredState,
    now: new Date("2026-10-02T10:00:00.000Z"),
  }), null);
  assert.equal(evaluatePostServiceGrowth({
    taskTitle: "Montaj",
    completedAt,
    state: recoveredState,
    now: new Date("2026-10-04T10:00:00.000Z"),
  })?.rule, "post_service_feedback_followup");
});

test("post-service UI records outcomes but never sends customer messages automatically", () => {
  const tasks = read("components/modules/TasksModule.tsx");
  const crm = read("components/modules/LeadsModule.tsx");
  const activity = read("lib/modules/activity.ts");
  const data = read("lib/modules/client-growth.ts");

  assert.match(tasks, /ORBYVEN · POST-SERVICE GROWTH/);
  assert.match(tasks, /Marchează feedback cerut/);
  assert.match(tasks, /Marchează review cerut/);
  assert.match(tasks, /Marchează recomandare cerută/);
  assert.match(tasks, /Remediere rezolvată/);
  assert.match(tasks, /\+ Ofertă nouă/);
  assert.match(crm, /displayPostServiceActivity/);
  assert.match(data, /createCrmLeadActivity/);
  assert.doesNotMatch(data, /send|fetch\(|email_action|sms|whatsapp/i);
  assert.match(activity, /POST_SERVICE_PREFIX/);
  assert.match(activity, /post_service_upsell/);
});

test("Next Best Action knows every post-service growth rule", () => {
  const source = read("lib/automation/next-best-action.ts");
  for (const rule of [
    "post_service_recovery",
    "post_service_feedback",
    "post_service_feedback_followup",
    "post_service_review",
    "post_service_referral",
    "post_service_upsell",
  ]) {
    assert.match(source, new RegExp(rule));
  }
});
