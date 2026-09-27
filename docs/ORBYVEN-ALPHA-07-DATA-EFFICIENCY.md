# ORBYVEN Alpha 0.7 — Data Efficiency & UX Reliability

## Baseline and integration
The feature branch started from `77ef2b89fd59382a1d966e1514e637ee8dac94b6`; during review, Materials PR #99 merged into canonical main as `518c1ed5e0a8deb212ee5502db928e9a73015a0b`. GitHub must merge this PR into that newer main without reverting the material library, estimate revisions, profitability or dynamic workspace. Separate drafts #97 Legal and #98 Security Hardening II remain outside this change. Integrator must reconcile #98's finance visibility gate; this release includes equivalent role-aware data fetching and display without altering Supabase policy.

## What changed
- Overview no longer downloads the entire history of leads, tasks and estimates into the browser. Each displayed metric uses an exact tenant-scoped `head/count` read; five task statuses use separate exact counts, and only four latest records plus up to sixteen actionable records per category are fetched for cards.
- The trends load only the preceding eight days of timestamps; the active-day calendar loads a narrow window. Monthly expenses read only the current local calendar month and are **exhaustively paged** in 500-row chunks, rather than silently truncating at PostgREST max rows. All queries retain `organization_id`; finance records are never queried for roles lacking finance access.
- The attention card appends `+` when any candidate category is truncated; never misrepresent a sampled card count as the complete number of actionable records.
- Search is a single responsive component on desktop/mobile, invalidates stale responses immediately on typing or selection, clears outdated results, keeps role-available module filtering, and retains its existing visuals.
- Offline regression tests cover >1,000 row aggregation and source-level workspace contracts in both CI and Quality Gate.
- A GitHub Actions browser workflow runs when its audit definition changes in a PR and is also manually dispatchable later. It builds Next locally, audits three public routes at mobile and desktop presets, retains raw Lighthouse JSON artifacts and prints LCP/TBT/CLS. No automatic Vercel deployment, no authenticated credentials, no remote runtime mutation.

## Honest limitations
The exact-count queries increase the number of lightweight database requests on initial Overview entry and require a genuine field test to establish net latency improvement. Timestamp arrays can still grow during an unusually high volume *inside a single week*, but the paginator prevents erroneous totals. Monthly expense aggregation transfers all amounts in the current month; a future RLS-safe server aggregation endpoint could improve this further **after** the security team's SQL signoff. The seven-day trend is calculated for the viewer's configured timezone as before. If a dataset changes while paginating, no client-only pagination guarantees a transactionally consistent snapshot; revisit a server-side aggregation when billing-grade accuracy is needed.

Lighthouse synthetic lab metrics are not real-user Core Web Vitals. The synthetic browser workflow records a baseline during its review run; re-run manually and compare like-for-like outputs before claiming a percentage speedup. Logged-in workspace remains browser-QA dependent on a provisioned test identity; no credential is committed. A READY deployment does not prove no runtime regression on all browsers.

## QA checklist
1. Test desktop 1366px and mobiles 360/390px; verify one search bar, single query, latest result only, Enter and module navigation.
2. Owner/admin/manager versus member/viewer: no financial read or financial card for unauthorized roles; no cross-tenant queries.
3. Data set with >1,000 recent/expense entries: correct exact totals; current-month rollover December → January; attention with 16+ candidates displays '+'.
4. Every workspace module, deep-linked create, pilot templates, mobile scroll and theme; no CSS redesign. Lighthouse workflow results in Actions artifacts.
5. Check PR #98 after this release and resolve its overlapping Overview files; do not merge older versions over Alpha 0.7.
