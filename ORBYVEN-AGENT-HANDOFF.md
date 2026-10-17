# ORBYVEN — Persistent Agent Handoff Protocol

## Goal

Keep ORBYVEN development resumable across ChatGPT Work limits, normal Chat sessions, restarts, and separate development chats without repeating completed analysis.

Git remains the source of truth. This protocol adds small machine-readable checkpoints so an agent can resume from the latest known safe state instead of reconstructing context from chat history.

## Canonical handoff files

Each long-running workstream owns exactly one status file under `.orbyven/handoff/`.

Current persistent workstreams:

- `dashboard-core.json`
- `product-film-engine.json`
- `integrity.json`
- `universal-core.json`
- `data-portability.json`
- `operations-reliability.json`
- `release-coordinator.json`

ORBYVEN 1.0 universal workstreams must also read `ORBYVEN-1.0-WORKSTREAMS.md`.

Workers must update only their own status file. This avoids unnecessary cross-chat merge conflicts.

## State machine

Allowed `state` values:

- `READY` — objective is queued and can be started/resumed.
- `IN_PROGRESS` — worker is actively executing the current objective.
- `BLOCKED_LIMIT` — Work/Codex allowance or execution budget stopped progress.
- `BLOCKED_EXTERNAL` — progress requires an external dependency, credential, approval, provider, or human action.
- `READY_FOR_WORK` — normal Chat has advanced planning/review as far as it safely can and Work should resume execution.
- `DONE` — current objective is complete and verified.

## Worker startup rule

Before making changes, every worker must:

1. fetch current `main`;
2. read `AGENTS.md`, `INTEGRATION-AUTOMATION.md`, and this file;
3. read `ORBYVEN-1.0-WORKSTREAMS.md` when the objective belongs to the 1.0 universal foundation;
4. read its own `.orbyven/handoff/<worker>.json`;
5. inspect the latest commit(s), relevant PR/branch state, and any files listed in the checkpoint;
6. audit current `main` for the requested capability before implementing it, so existing sufficient functionality is not rebuilt;
7. avoid repeating work listed under `last_completed`;
8. set its checkpoint to `IN_PROGRESS` with the current branch and objective before substantial work.

## Checkpoint rule

A Work worker must checkpoint proactively, because an allowance limit can interrupt execution before it has time to write a final summary.

Update the worker status file:

- after each atomic milestone;
- before a long build/test/deploy/research step;
- after a commit or PR update;
- immediately when a blocker becomes known;
- before intentionally yielding work to another chat.

Keep checkpoints compact. Record facts, not prose history.

## When Work hits a limit

If execution is stopped by Work/Codex allowance:

1. set `state` to `BLOCKED_LIMIT` when possible;
2. preserve the latest safe commit/branch/PR information;
3. set `next_action` to one concrete resumable action;
4. list only unresolved verification under `tests` or `blocker`;
5. do not start a new scope.

If the limit interrupts before the status file can be updated, the next agent must reconstruct only from Git history, the existing checkpoint, and current branch/PR state — never from assumptions.

## Normal Chat handoff behavior

A normal Chat coordinator may continue non-execution work while a Work worker is blocked:

- inspect repository state, commits, PRs, contracts, and CI information available through connected tools;
- review architecture, code diffs, security/legal/SEO implications, and next-step sequencing;
- refine the worker checkpoint so Work can resume with minimal rediscovery;
- mark the worker `READY_FOR_WORK` once only execution-capable work remains.

Normal Chat must not claim runtime/build verification it did not actually perform.

## Work resume behavior

When Work is available again, the worker must:

1. read its checkpoint;
2. fetch current `main` and compare with the checkpoint base/branch;
3. inspect commits made since `updated_at`;
4. reuse completed analysis and continue from `next_action`;
5. run the required build/tests before marking `DONE`;
6. write the final commit/PR/test result into the checkpoint.

## Concurrency rule

Persistent workstreams may run concurrently only when their branch scopes and owned contracts do not overlap unsafely.

For the ORBYVEN 1.0 parallel plan, shared integration surfaces and workstream boundaries in `ORBYVEN-1.0-WORKSTREAMS.md` are authoritative in addition to repository ownership rules.

If another worker has touched the same contract or file family since the checkpoint:

- rebase/sync first;
- inspect the diff;
- update only the owned implementation;
- prefer a narrow contract/component that can be wired later by the coordinator;
- stop with `BLOCKED_EXTERNAL` rather than guessing through a conflict.

Repository ownership and integration rules in `INTEGRATION-AUTOMATION.md` remain authoritative. A workstream name never replaces the required existing PR ownership label.

## Required checkpoint fields

Every worker JSON file must keep these keys:

- `version`
- `worker_id`
- `state`
- `mode`
- `updated_at`
- `branch`
- `base_main_sha`
- `current_objective`
- `last_completed`
- `next_action`
- `files_touched`
- `tests`
- `last_commit`
- `pull_request`
- `blocker`
- `safe_to_resume`

Do not delete fields; update values in place.

## Completion rule

A worker may set `DONE` only when:

- requested implementation is complete;
- relevant tests/build checks are actually run or an explicit unverified reason is recorded;
- branch/PR/commit state is recorded;
- known shared-file/contract collisions are surfaced;
- `next_action` is empty or points to a deliberately separate future objective.
