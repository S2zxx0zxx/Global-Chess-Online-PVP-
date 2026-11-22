# GC-B01-T03 — Canonical Branch, Pull Request and Rollback Protocol

**Permanent task:** `GC-B01-T03` · **Plan:** `GC-MASTER-EXEC-v1.0`  
**Plan SHA-256:** `f076a2a8f3672a3fa3fb325b05ae930f938c88a2d2521eab17fe8c55779cae59`  
**Repository:** https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-  
**Verified source head:** PR #18 `3d9467ada0eaf167eecc52d6c98ed126fa98c98c`  
**Canonical engineering candidate:** `integration/global-chess-v3` (created from the exact SHA above; `0 ahead / 0 behind` versus `feat/chess-release-integration` at bootstrap).  
**Default/release branch:** `main` at original read `63462e20f97a64913836e361c0e9807604ac3d4a`.  
**Release state:** `NOT_READY`. **Task state:** `BLOCKED_EXTERNAL` until branch governance is enforced and reviewed; a documented policy is not an active repository restriction.

## 1. Sources, decision, and boundaries

This is the exact `01.03` task from the master MD: define source branch/base, task-specific naming, protected merge sequence, owner review, clean history and safe rollback. Re-read GitHub heads before any further write: a branch **name** is mutable, and SHA proves what source was inspected.

Current topology after clean reconciliation (2026-11-22):

```text
main @ 63462e20f97a...            [default, UNPROTECTED; NOT YET RELEASE]
  └─ PR #1 foundation @ f4d313f24fc5... [open/draft]
       └─ PR #18 integrated app @ 3d9467ada0ea... [open/draft, not merged]
             └─ integration/global-chess-v3 [CANONICAL]
                  ├─ PR #19 T01 baseline [squash-merged @ 0a309ddf84ce]
                  ├─ PR #22 clean T02 reconciliation [squash-merged @ f614bdab2fbf]
                  └─ T03 governance/CI clean PR [reviewed separately, no app changes]
```

- Historical stacked PR #20 was not mergeable after #19 squash; its T02 content was safely re-applied in #22, not force-pushed.
- Original stacked PR #21 must be superseded by a clean T03 PR from current canonical, not blindly retargeted.
- Latest GitHub ruleset `Global Chess Protected Branches` **ACTIVE** and targets only `integration/global-chess-v3`. It enforces `pull_request`, `required_linear_history`, `deletion`, `non_fast_forward`, with zero required reviews and empty bypass list. **`main` still has `protected=false`.** Owner must add `main` to same ruleset and verify.

- Old PR #2 and #12 are dirty/conflicted against the evolved foundation; **do not force-merge or overwrite current Home, storage, original SVG art, animations, Android, progression or PvP**.
- PR #17 is a distinct optional AdMob/UMP experiment; **not part of canonical branch** and no ads may be activated without `GC-B08` owner approval.
- This task does not make project MVP/P2/P3 scope decisions (`GC-B01-T04`), architecture framework decisions (`GC-B01-T05`), data identity contracts (`GC-B01-T06`), the 602-task ledger mapping (`GC-B01-T07`), or regression freeze (`GC-B01-T08`).
- No changes to `main`, PR #1/#18 code, secrets, deployments, billing or Android signing are authorized.

## 2. Branch roles — one source of truth

| Ref | Purpose | Write permissions / promotion path |
|---|---|---|
| `main` | **release line only**, not daily development | PR only after all required B01–B10 release gates, approvals and verified production deployment plan |
| `integration/global-chess-v3` | **canonical engineering/integration branch** with all approved work | Future one-task feature PRs target here after branch protection is active |
| `feat/playable-chess-foundation` / PR #1 | Historical base/review branch | Freeze; do not continue parallel feature development here |
| `feat/chess-release-integration` / PR #18 | Historical integration/source origin at pinned SHA | Freeze after confirming canonical parity; do not auto-close or auto-merge PR #18 |
| `audit/gc-b01-t01-source-pin-20261122` (PR #19) | Baseline and ledger audit | Review first; PR targets canonical branch |
| `audit/gc-b01-t02-pr18-reconciliation-20261122` (PR #20) | Stacked historical PR reconciliation audit | Review after #19; retarget only after confirming diff and SHA |
| `docs/gc-b01-t03-canonical-pr-policy` | Task #03 policy and CI trigger patch | Review after #20; no independent merge before predecessors |

**Rationale:** Keeping `main` as public-release branch and a separately named `integration/` branch avoids ambiguous feature bases and prevents shipping legacy PR stacks by accidental merge. This is an engineering **policy choice**, not evidence that a deployed product already exists.

## 3. Naming contract

Only one task ID may be actively implemented at a time.

- Functional: `feat/gc-b02-t01-undo-policy`
- Fix: `fix/gc-b01-t08-storage-regressions`
- Documentation: `docs/gc-b01-t03-canonical-pr-policy`
- Test-only: `test/gc-b01-t08-persistence`
- Audit: `audit/gc-b01-t07-task-matrix`
- Release candidate: `release/gc-v3-YYYYMMDD` (only during owner-approved release task)
- Emergency fix: `hotfix/gc-YYYYMMDD-short-description` (must carry documented incident; no direct force push)

Use lowercase kebab-case, single task ID and bounded task scope. Avoid new top-level feature branches from `main` or old PR branches. Prefer a fresh branch from the **latest verified canonical SHA**, not an unreviewed workspace snapshot.

## 4. Pull request contract — task by task

Each PR must have:
1. Task ID, exact source/base SHA, affected files and stated product acceptance criteria;
2. explanation of source behavior, UI/route + state, persistence/API contract where relevant;
3. updated tests and evidence on the **PR exact head** (source checks, unit/integration/browser, and device where applicable);
4. explicit threat/privacy/assets/licensing assessment and no leaked credentials;
5. conflict/edge/failure/recovery validation and exact rollback instructions;
6. risk/owner review record and changelog/ledger status, including `BLOCKED_EXTERNAL` if approval is missing.

**One task → one PR** (or one tightly scoped stack where older docs PRs must be merged first). Keep task PRs draft while unverified. Never assume a passing run from a different SHA or earlier branch is sufficient. **Never enable auto-merge** for task PRs.

## 5. Required branch protections — NOT YET ACTIVE

**Live GitHub read evidence (2026-11-22):** the ACTIVE `Global Chess Protected Branches` ruleset (ID `27842501`) applies to canonical `integration/global-chess-v3` and enforces PR, linear history, no force-push and no delete, no bypass. **It does not target `main`**, which reports `protected=false`. GitHub connector has no rule mutation action; owner must add `main` through GitHub Settings. Review approval count is 0 for solo owner; a manual owner sign-off record remains separate from GitHub independent review.

An authorized repository administrator must configure an **Active branch ruleset** (or suitable protected branch rules) targeting **both** `main` and `integration/global-chess-v3`:

- Require pull request before merge; block direct pushes where settings permit.
- Require **Core tests, browser build, and WASM preflight** status from `Global Chess verification`; select the exact job/check name **only after it has appeared on a PR to the canonical branch**. Requiring a check that never runs will deadlock all PRs.
- Require conversations resolved, keep branch current and protected against force push and deletion, prohibit bypass where available.
- Require linear history; use **Squash and merge** for one-task branches (no rewriting shared branch commits).
- Require a genuine human review. For a solo maintainer, self-authored PR approvals may not count as independent GitHub approvals. If no eligible reviewer exists, record owner manual approval in the ledger; **do not pretend GitHub approval was given**, and do not configure an unsatisfiable approval threshold. Add an independent reviewer once available.
- Do **not** make Android debug/signing checks universally required if their path filters skip docs-only changes. They are task-specific gates for Android-sensitive PRs.
- Prefer no bypass list. A bypass, if genuinely necessary for an incident, must be visible in an incident entry and independently reviewed after recovery.

**Owner action (Settings UI):**
1. Navigate to `https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/settings/rules`.
2. Create a branch ruleset named `Global Chess protected integration and release`, set enforcement **Active**, target exact refs `main` and `integration/global-chess-v3`.
3. Add the controls above. Only add the verified `Core tests, browser build, and WASM preflight` required check once the changed `.github/workflows/verify.yml` is on canonical and a PR has produced that check.
4. Return to Rulesets to confirm **Active**, and verify the target branch metadata reports `protected=true`. Attach rule link/screenshot to this task's ledger.
5. Record owner signoff to `GC-B01-T03`. No subsequent task is unlocked before confirmation.

GitHub public repository rulesets are available on GitHub Free, but this connector cannot perform the admin operation. Official docs: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/creating-rulesets-for-a-repository

## 6. GitHub Actions compatibility and current safe promotion

At the baseline `verify.yml` only covered `main` and `feat/playable-chess-foundation`. This task adds `integration/global-chess-v3` to both `pull_request` and `push` triggers. The change is **proposed in this task PR**, not effective until GitHub merges it to canonical.

**Verified integration sequence:**

1. PR #19 T01 documents **squash-merged** into canonical (SHA `0a309ddf84cec42a42f52a546f87c6d1f95e7e41`).
2. Retargeting old PR #20 gave GitHub 405 conflicts. It was **not** forced. Instead T02's exact report, ledger and baseline typo correction were transplanted via clean PR #22, **squash-merged** to canonical SHA `f614bdab2fbfb13a18c7e26ab77269f22a2e1520`.
3. This T03 PR is freshly based on that canonical SHA and includes only task policy, PR checklist, core CI trigger patch and T03 checkpoint. Review actual diff and squash-merge safely. Do **not** merge superseded original #21 stack over current canonical.
4. After merge, inspect exact canonical HEAD workflow run: tests, browser build, WASM/room smoke must be green on that SHA. Then add the exact observed `Core tests, browser build, and WASM preflight` job as required check for canonical and main; avoid requiring checks whose path filter skips relevant PRs.
5. Owner must update ACTIVE ruleset ID `27842501` to include **both** `main` and `integration/global-chess-v3`, with no bypass and compatible review/CI gates.
6. Once enforced for both branches, current SHA CI green, owner review documented and ledger verified, then `GC-B01-T03 DONE` may be recorded and `START GC-B01-T04` eligible.

**No auto-merge or force push is permitted.** A GitHub mergeable flag does not supersede diff examination and protected-branch rules.

## 7. Clean history and exact-SHA acceptance

Before T03 closure:
- Canonical branch **exists at PR #18 exact code SHA**, zero ahead/behind at bootstrap (verified).
- T01 and T02 source checkpoints remain available; task ledger is not lost.
- No uncommitted changes are hidden; GitHub is authoritative for committed remote content.
- Every PR merged by owner has its PR number and reviewed source SHA recorded. No direct pushes to `main` or canonical after protection.
- Old #2/#12 divergent/conflicting PR branches never receive `git reset --hard`, `--force`, or a destructive cherry-pick.
- Canonical branch after the bootstrap remains 100% traceable by Git parent ancestry and reviewed PRs; no history rewrites.

## 8. Safe rollback by stage

| Failure stage | Rollback |
|---|---|
| Open/unmerged task PR | Close draft PR; leave target branch unchanged; delete only task branch if owner chooses |
| After squash merge into canonical | Make a new `revert/gc-<task>` PR that reverts the exact squash commit; run full relevant checks before merging |
| Misconfigured ruleset | Repo admin corrects the ruleset via GitHub Settings with documented reason; do not temporarily allow unrestricted force pushes |
| Before main release | Keep `main` unchanged; hold release PR and revert on canonical |
| After main/web release | Use release rollback plan with pinned prior SHA and compatible persistent client data; never blindly downgrade PWA/IndexedDB schema |
| After Android upload | Publish a new owner-approved version with monotonic Play versionCode; an already distributed signed AAB cannot be erased by reverting Git history |
| Credential/security incident | Revoke and rotate secrets through provider UI; never publish secrets in a rollback commit |

**Forbidden:** `git push --force`, direct protected branch edits, silent history rebase, deleting saved match data to solve UI regressions, merging unrelated PR #17 ads, arbitrary direct release from a development branch.

## 9. Task-specific acceptance and stop/go

| Criterion | State | Evidence |
|---|---|---|
| Source branch/base chosen | **VERIFIED** | `integration/global-chess-v3` at PR #18 `3d9467ada0ea…` |
| Canonical 0/0 clean SHA base | **VERIFIED** | GitHub compare `feat/chess-release-integration` → canonical `identical` |
| PR per task, naming and owner review protocol | **DOCUMENTED** | This policy + `.github/PULL_REQUEST_TEMPLATE.md` |
| CI triggers on canonical PRs | **PROPOSED UNMERGED** | T03 `verify.yml` modification awaiting bootstrap review and merge |
| Active PR-only branch protections | **BLOCKED_EXTERNAL** | GitHub rulesets `[]`, branch `protected=false`; admin update API unavailable |
| Exact owner sign-off | **NOT OBTAINED** | No manufactured review or approval |
| Clean historical merge/rollback procedure | **DOCUMENTED** | Sections 6–8; no merges performed |
| T04 eligible | **NO** | Hard STOP until external enforcement plus review confirmed |

**Do not mark T03 DONE without branch rule/enforcement proof and a reviewed PR.** `GC-B01-T03 = BLOCKED_EXTERNAL`. Next permitted operation is `RESUME GC-B01-T03` after owner config, not `START GC-B01-T04`. No background work is promised.
