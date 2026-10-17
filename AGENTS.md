<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## ORBYVEN persistent handoff

For any long-running ORBYVEN development task, read `ORBYVEN-AGENT-HANDOFF.md` before substantial work.

For ORBYVEN 1.0 universal foundation work, also read `ORBYVEN-1.0-WORKSTREAMS.md`.

If the task belongs to one of the persistent workstreams, also read and maintain its checkpoint:

- `.orbyven/handoff/dashboard-core.json`
- `.orbyven/handoff/product-film-engine.json`
- `.orbyven/handoff/integrity.json`
- `.orbyven/handoff/universal-core.json`
- `.orbyven/handoff/data-portability.json`
- `.orbyven/handoff/operations-reliability.json`
- `.orbyven/handoff/release-coordinator.json`

Checkpoint after atomic milestones and before long build/test/deploy operations so another Chat or Work session can resume safely after an allowance limit or restart.

Never infer completed work from chat history when Git, PR, CI, or the checkpoint can verify it. Repository state is authoritative.
