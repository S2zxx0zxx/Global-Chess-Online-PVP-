## Global Chess — task PR

**Permanent task ID:** `GC-B__-T__`  
**Related master plan:** `GC-MASTER-EXEC-v1.0`  
**Source branch + exact base SHA:**  
**Head SHA:**  
**Target:** `integration/global-chess-v3` (release-only PRs target `main`)

### Scope and functional contract
- [ ] One task only; completed work is source-grounded (no reimplementation of working features).
- [ ] Paths/components/API/route/state affected:
- [ ] Mandatory acceptance criteria from Master MD:
- [ ] Explicit non-goals and dependencies:

### Implementation
- [ ] UI controls/route wiring verified where relevant
- [ ] Chess rules/clock/online server authority preserved
- [ ] Local save, XP, history, backups and migrations not regressed
- [ ] Offline/error/cancel/retry paths and accessiblity considered
- [ ] No unapproved artwork, AdMob integration, secrets, production settings or external fees

### Exact-head verification
- [ ] Lint/static checks + source syntax as relevant
- [ ] Tests (unit/integration/browser) run on **this head SHA**
- [ ] Android/debug/native checks if native code/assets changed
- [ ] Security/privacy/asset provenance review as relevant
- [ ] Screenshot/device/manual evidence when task requires it
- [ ] Failed/missing evidence explicitly recorded; no false green or production claim

**Checks and evidence links:**

### Review, integration and rollback
- [ ] Owner checked changed-file diff, source and app-state behavior
- [ ] Review comments resolved; no unresolved blockers
- [ ] Branch protection and CI gates passed at destination
- [ ] Docs/task ledger updated with SHA, PR, risks and next task
- [ ] Rollback: target branch pre-merge SHA, revert/safe re-release instructions
- [ ] No force-push, no hidden concurrent feature branch, no auto-merge

**Owner decision:** `PENDING_REVIEW` / `APPROVED` / `CHANGES_REQUESTED`  
**Task state:** `TODO` / `IN_PROGRESS` / `BLOCKED_EXTERNAL` / `IMPLEMENTED_UNVERIFIED` / `DONE`  
**Release state:** `NOT_CERTIFIED` unless explicitly proven by separate release gate.

> Note: GitHub auto-populates PR templates from the repository default branch according to its template discovery behavior. Until this template exists on `main`, copy these fields manually when opening task PRs; do not claim automatic enforcement.
