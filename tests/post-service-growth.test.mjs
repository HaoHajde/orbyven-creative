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

function event(
  type,
  occurredAt = "2026-08-22T10:00:00.000Z",
  score
) {
  const body = encodePostServiceEvent("task-1", type, undefined, score);
  return parsePostServiceEvent(body, occurredAt);
}

function state(...events) {
  return buildPostServiceGrowthState(events.filter(Boolean));
}

test("legacy post-service CRM markers still round-trip with clean display copy", () => {
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
    score: null,
  });
  assert.equal(displayPostServiceActivity(body), "Client mulțumit de lucrare.");
});

test("scored feedback persists 1-5 and rejects invalid values", () => {
  const body = encodePostServiceEvent(
    "task-1",
    "feedback_scored",
    "Feedback înregistrat: 5/5.",
    5
  );
  assert.match(body, /event=feedback_scored;score=5/);
  assert.deepEqual(parsePostServiceEvent(body, "2026-08-22T10:00:00.000Z"), {
    taskId: "task-1",
    type: "feedback_scored",
    occurredAt: "2026-08-22T10:00:00.000Z",
    score: 5,
  });
  assert.throws(
    () => encodePostServiceEvent("task-1", "feedback_scored", undefined, 0),
    /1 to 5/
  );
  assert.throws(
    () => encodePostServiceEvent("task-1", "feedback_scored", undefined, 6),
    /1 to 5/
  );
});

test("post-service waits two days before opening feedback", () => {
  assert.equal(
    evaluatePostServiceGrowth({
      taskTitle: "Montaj",
      completedAt: "2026-10-01T10:00:00.000Z",
      state: state(),
      now,
    }),
    null
  );
  assert.equal(
    evaluatePostServiceGrowth({
      taskTitle: "Montaj",
      completedAt: "2026-09-29T10:00:00.000Z",
      state: state(),
      now,
    })?.rule,
    "post_service_feedback"
  );
});

test("scored feedback routes positive clients to review and low scores to recovery", () => {
  const positive = state(event("feedback_scored", "2026-09-01T10:00:00.000Z", 5));
  assert.equal(positive.feedback, "positive");
  assert.equal(positive.feedbackScore, 5);
  assert.equal(
    evaluatePostServiceGrowth({
      taskTitle: "Montaj",
      completedAt,
      state: positive,
      now,
    })?.rule,
    "post_service_review"
  );

  const issue = state(event("feedback_scored", "2026-09-01T10:00:00.000Z", 2));
  const recovery = evaluatePostServiceGrowth({
    taskTitle: "Montaj",
    completedAt,
    state: issue,
    now,
  });
  assert.equal(issue.feedback, "issue");
  assert.equal(issue.feedbackScore, 2);
  assert.equal(recovery?.rule, "post_service_recovery");
  assert.equal(recovery?.level, "urgent");
  assert.match(recovery?.detail ?? "", /2\/5/);
});

test("review requires an outcome before referral", () => {
  const requested = state(
    event("feedback_scored", "2026-08-22T10:00:00.000Z", 5),
    event("review_requested", "2026-09-25T10:00:00.000Z")
  );
  assert.equal(
    evaluatePostServiceGrowth({
      taskTitle: "Montaj",
      completedAt,
      state: requested,
      now,
    }),
    null
  );

  const staleRequested = state(
    event("feedback_scored", "2026-08-22T10:00:00.000Z", 5),
    event("review_requested", "2026-09-01T10:00:00.000Z")
  );
  assert.equal(
    evaluatePostServiceGrowth({
      taskTitle: "Montaj",
      completedAt,
      state: staleRequested,
      now,
    })?.rule,
    "post_service_review_followup"
  );

  const completed = state(
    event("feedback_scored", "2026-08-22T10:00:00.000Z", 5),
    event("review_requested", "2026-08-23T10:00:00.000Z"),
    event("review_completed", "2026-08-25T10:00:00.000Z")
  );
  assert.equal(
    evaluatePostServiceGrowth({
      taskTitle: "Montaj",
      completedAt,
      state: completed,
      now,
    })?.rule,
    "post_service_referral"
  );
});

test("review declined skips referral without blocking later upsell", () => {
  const declined = state(
    event("feedback_scored", "2026-08-22T10:00:00.000Z", 4),
    event("review_requested", "2026-08-23T10:00:00.000Z"),
    event("review_declined", "2026-08-25T10:00:00.000Z")
  );
  assert.equal(declined.reviewDeclinedAt, "2026-08-25T10:00:00.000Z");
  assert.equal(
    evaluatePostServiceGrowth({
      taskTitle: "Montaj",
      completedAt,
      state: declined,
      now,
      hasOpenWorkForClient: false,
    })?.rule,
    "post_service_upsell"
  );
});

test("referral requires an outcome before upsell", () => {
  const requested = state(
    event("feedback_scored", "2026-08-22T10:00:00.000Z", 5),
    event("review_requested", "2026-08-23T10:00:00.000Z"),
    event("review_completed", "2026-08-24T10:00:00.000Z"),
    event("referral_requested", "2026-09-20T10:00:00.000Z")
  );
  assert.equal(
    evaluatePostServiceGrowth({
      taskTitle: "Montaj",
      completedAt,
      state: requested,
      now,
    }),
    null
  );

  const staleRequested = state(
    event("feedback_scored", "2026-08-22T10:00:00.000Z", 5),
    event("review_requested", "2026-08-23T10:00:00.000Z"),
    event("review_completed", "2026-08-24T10:00:00.000Z"),
    event("referral_requested", "2026-08-25T10:00:00.000Z")
  );
  assert.equal(
    evaluatePostServiceGrowth({
      taskTitle: "Montaj",
      completedAt,
      state: staleRequested,
      now,
    })?.rule,
    "post_service_referral_followup"
  );

  const received = state(
    event("feedback_scored", "2026-08-22T10:00:00.000Z", 5),
    event("review_requested", "2026-08-23T10:00:00.000Z"),
    event("review_completed", "2026-08-24T10:00:00.000Z"),
    event("referral_requested", "2026-08-25T10:00:00.000Z"),
    event("referral_received", "2026-08-28T10:00:00.000Z")
  );
  assert.equal(
    evaluatePostServiceGrowth({
      taskTitle: "Montaj",
      completedAt,
      state: received,
      now,
      hasOpenWorkForClient: false,
    })?.rule,
    "post_service_upsell"
  );
});

test("upsell scheduling and offers suppress repeated commercial prompts", () => {
  const completedGrowth = [
    event("feedback_scored", "2026-08-22T10:00:00.000Z", 5),
    event("review_completed", "2026-08-24T10:00:00.000Z"),
    event("referral_received", "2026-08-28T10:00:00.000Z"),
  ];

  const scheduled = state(
    ...completedGrowth,
    event("upsell_scheduled", "2026-09-20T10:00:00.000Z")
  );
  assert.equal(
    evaluatePostServiceGrowth({
      taskTitle: "Montaj",
      completedAt,
      state: scheduled,
      now,
      hasOpenWorkForClient: false,
    }),
    null
  );
  assert.equal(
    evaluatePostServiceGrowth({
      taskTitle: "Montaj",
      completedAt,
      state: scheduled,
      now: new Date("2026-10-22T10:00:00.000Z"),
      hasOpenWorkForClient: false,
    })?.rule,
    "post_service_upsell"
  );

  const offered = state(
    ...completedGrowth,
    event("upsell_offered", "2026-10-01T10:00:00.000Z")
  );
  assert.equal(
    evaluatePostServiceGrowth({
      taskTitle: "Montaj",
      completedAt,
      state: offered,
      now,
      hasOpenWorkForClient: false,
    }),
    null
  );
  assert.equal(
    evaluatePostServiceGrowth({
      taskTitle: "Montaj",
      completedAt,
      state: offered,
      now: new Date("2026-12-05T10:00:00.000Z"),
      hasOpenWorkForClient: false,
    })?.rule,
    "post_service_upsell"
  );
});

test("reported problems force recovery and resolved recovery re-enters feedback loop", () => {
  const issueState = state(event("feedback_issue"));
  assert.equal(
    evaluatePostServiceGrowth({
      taskTitle: "Montaj",
      completedAt,
      state: issueState,
      now,
    })?.rule,
    "post_service_recovery"
  );

  const recoveredState = state(
    event("feedback_issue"),
    event("recovery_resolved", "2026-09-30T10:00:00.000Z")
  );
  assert.equal(recoveredState.feedback, "requested");
  assert.equal(recoveredState.feedbackScore, null);
  assert.equal(
    evaluatePostServiceGrowth({
      taskTitle: "Montaj",
      completedAt,
      state: recoveredState,
      now: new Date("2026-10-02T10:00:00.000Z"),
    }),
    null
  );
  assert.equal(
    evaluatePostServiceGrowth({
      taskTitle: "Montaj",
      completedAt,
      state: recoveredState,
      now: new Date("2026-10-04T10:00:00.000Z"),
    })?.rule,
    "post_service_feedback_followup"
  );
});

test("post-service UI records outcomes but never sends customer messages automatically", () => {
  const tasks = read("components/modules/TasksModule.tsx");
  const crm = read("components/modules/LeadsModule.tsx");
  const activity = read("lib/modules/activity.ts");
  const data = read("lib/modules/client-growth.ts");

  assert.match(tasks, /ORBYVEN · POST-SERVICE GROWTH/);
  assert.match(tasks, /Marchează feedback cerut/);
  assert.match(tasks, /\{score\}★/);
  assert.match(tasks, /Review primit ✓/);
  assert.match(tasks, /Recomandare primită ✓/);
  assert.match(tasks, /upsell_scheduled/);
  assert.match(tasks, /upsell_offered/);
  assert.match(tasks, /Remediere rezolvată/);
  assert.match(tasks, /\+ Ofertă nouă/);
  assert.match(crm, /displayPostServiceActivity/);
  assert.match(data, /score\?: number/);
  assert.doesNotMatch(data, /send|fetch\(|email_action|sms|whatsapp/i);
  assert.match(activity, /POST_SERVICE_PREFIX/);
  assert.match(activity, /post_service_upsell/);
  assert.match(activity, /startsWith\("post_service_review"\)/);
  assert.match(activity, /startsWith\("post_service_referral"\)/);
});

test("Next Best Action knows every post-service growth rule", () => {
  const source = read("lib/automation/next-best-action.ts");
  for (const rule of [
    "post_service_recovery",
    "post_service_feedback",
    "post_service_feedback_followup",
    "post_service_review",
    "post_service_review_followup",
    "post_service_referral",
    "post_service_referral_followup",
    "post_service_upsell",
  ]) {
    assert.match(source, new RegExp(rule));
  }
});
