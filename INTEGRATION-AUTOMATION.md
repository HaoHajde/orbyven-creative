# ORBYVEN Integration Automation v1

`main` remains the only canonical source of truth.

This automation coordinates integration; it does not create a second integration branch and it does not auto-merge pull requests.

## Safety model

- Every development chat works on its own branch.
- A PR enters the train only when it has an `integration-NN` label.
- Draft PRs are ignored.
- After every push to `main`, the train selects the open non-draft PR with the lowest integration number.
- The train updates only that PR with the current `main`.
- GitHub PR checks rerun after synchronization.
- Merge conflicts are never resolved automatically.
- A conflict or unsafe branch is marked `orbyven-blocked` and the train stops for that PR.
- No PR is auto-merged in v1. A human keeps the final merge decision.

## Ownership labels

Use exactly one ownership label on normal domain PRs:

- `chat-1-modules` — Modules + Client Workspace Experience
- `chat-2-platform` — Platform Core + Auth + Supabase + Onboarding + Control Center
- `chat-3-billing` — Legal + Billing + Entitlements
- `chat-4-public` — Public Website + Templates + Marketing

`ORBYVEN Architecture Guard` checks changed paths against these boundaries.

Every PR that enters the integration train must have exactly one ownership label and exactly one `integration-NN` label.

If a cross-domain change is genuinely required, document the reason and contract impact in the PR, then add `architecture-cross-domain-approved`. This is an explicit exception, not a normal workflow.

## Integration labels

The workflow bootstraps:

- `integration-10`
- `integration-20`
- `integration-30`
- ...
- `integration-90`

Use gaps of 10 so another PR can be inserted later if needed.

Example:

1. Platform Core — `integration-10`
2. Modules — `integration-20`
3. Billing / Entitlements — `integration-30`
4. Public work that depends on those contracts — `integration-40`

Independent public work does not need to join a train unless coordinated ordering is useful.

## Status labels

- `orbyven-synced` — branch contains the current canonical `main` at the moment the train checked it.
- `orbyven-blocked` — GitHub could not safely synchronize the branch.

On every new push to `main`, stale `orbyven-synced` labels are invalidated before the next PR is selected.

The real merge gate is still CI after the latest synchronization, not the label alone.

## Automated checks

### ORBYVEN Quality Gate

Runs on every PR and every push to `main`:

1. `npm ci`
2. strict ESLint on JavaScript/TypeScript files changed by that PR/push
3. `npm run build`
4. full `npm run lint` as an informational baseline report

The repository currently has pre-existing full-lint debt from the React `set-state-in-effect` rule. That baseline is surfaced but does not block unrelated PRs. Any newly changed code is lint-blocking immediately, so the baseline cannot silently grow through normal development.

When the existing lint baseline is cleaned to zero, the informational full-lint step can be promoted to a required blocking step.

### ORBYVEN Architecture Guard

Runs on PR changes and ownership-label changes. It is intentionally conservative and only enforces domain path boundaries when a `chat-*` ownership label is present. PRs opted into the integration train must have one and only one ownership label.

### ORBYVEN Integration Train

Runs after pushes to `main` or manually through GitHub Actions. It synchronizes only the next opt-in PR and never presses merge.

## Recommended branch protection

After this automation is merged and its checks are verified green, configure `main` in GitHub so merges require:

- `ORBYVEN Quality Gate / validate`
- `ORBYVEN Architecture Guard / ownership`
- Vercel, when the Vercel build-rate window allows reliable required checks
- branch up-to-date with `main` before merge

Do not make Vercel a hard required gate while the account is actively hitting external build-rate limits; the repository production build remains the deterministic source-code gate.

## Chat handoff rule

A chat does not need a prose summary from the previous chat before continuing. Its first integration step is:

1. fetch current `main`;
2. inspect the diff/contracts added since its branch point;
3. adapt only its owned implementation;
4. preserve the canonical tenant/module/billing contracts;
5. rerun CI/build;
6. merge only after the branch is current and green.

Git + repository contracts are the handoff mechanism.
