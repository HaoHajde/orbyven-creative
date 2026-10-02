# ORBYVEN — code integrity, structure & lightweight gate

Effective from 2026-10-02 for the current ORBYVEN Web + Desktop 0.8 architecture.

## Permanent rule

Every change must preserve four properties:
1. Integrity: no tenant/security bypass, stale async overwrite or older-branch overwrite.
2. Shared structure: business logic stays shared; Desktop must not duplicate root services.
3. Lightweight delivery: source hotspots, runtime dependencies, public assets, Next JS, Desktop dist and installer have explicit ceilings.
4. Web/Desktop parity without duplicate products: shared WorkspaceShell/modules are preferred; platform-specific code stays in adapters.

## Current captured baseline
- 275 Web source files; 11 above 35 KiB. The gate blocks a 12th.
- 10 Desktop source files; none above 35 KiB.
- Existing large Web hotspots have individual frozen ceilings so they cannot silently grow to the global cap.
- Workspace modules must remain loaded with next/dynamic.
- WorkspaceIntelligence is kept out of the initial WorkspaceShell chunk.
- Web runtime dependencies remain allowlisted.
- Desktop cannot depend directly on Next.js, Framer Motion or Supabase SSR.
- Public assets: 14 MiB total, 768 KiB per new file by default, with explicit legacy demo exceptions.
- Next static JS: 4 MiB total / 512 KiB single chunk.
- Desktop dist: 1.5 MiB; installer: 4 MiB.

These are regression ceilings, not targets. Refactors should lower them over time.

## Multi-chat rule
Before editing shared files, compare current main and active PR heads. Re-compose changes on current main when a branch becomes stale instead of force-merging or replacing newer files.

Passing this gate never authorizes SQL, billing, legal, security or production deployment changes.
