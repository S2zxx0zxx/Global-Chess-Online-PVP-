# GC-B01-T07 — Original 602-task source inventory and evidence-ledger reconciliation

**Task:** `GC-B01-T07` · **Master plan:** `GC-MASTER-EXEC-v1.0` §01.07 · **Date:** 2026-11-22  
**Baseline:** `integration/global-chess-v3` @ `69d7e13c6904f13344c1195333f13f39741f09c1` (T06 verified and merged).  
**Completion scope:** Source-row inventory, provisional batch assignment, hard evidence fields, source gate/screen/test/asset registers, automated validation. **NOT** 602 features implemented, source-row acceptance, or a signed batch GO.

## 1. Authoritative source recovered and independently compared

The **actual original 602-task owner workbook** was directly retrieved from the owner's Library and inspected—not reconstructed from prior prose or guessed task names.

| Source artifact | SHA-256 | Relation |
|---|---|---|
| `Chess_Execution_Tracker_v3.xlsx` (87,755 bytes) | `df4a520e4d72e6592d96ac3960ac00e90b5d459ddc5288e056f63662a0ffbcd8` | **Original v3 tracker**; `Tasks!A1:Q603` contains 602 nonduplicate, source-owned rows |
| `Chess_Final_Production_Ready_Planning_Pack_v3_2026-11-18(3).zip` | `b295146dd1b79f74f61632b26c2d4933ce3a00b51132762e5bdc9570c1799bcd` | Its `trackers/Chess_Execution_Tracker_v3.xlsx` binary is byte-identical to standalone original workbook |
| `Chess_M01_602_Task_Evidence_Overlay_2026-11-22.xlsx` | `b709a3e47e9d7a57859de7e96d256bcb3873a6f1879e9e6ff7d574b059dfb4fc` | `Tasks!A1:Q603` cell-value content equal to original v3 workbook; extra `M01_Audit` hints are NOT independent acceptance |
| Original source task IDs SHA-256 | `6538c660a1f4dd68a00c3154f4fcfd0e3b365490d1c9c816fd70387033ef7475` | UTF-8 `task_id` values in source order joined with LF |
| Original task+acceptance SHA-256 | `24d4729b94610ea24c58687f25a6b3d7ea17bad1e0a652d99a37b2c939b11ef4` | UTF-8 source `task_id TAB task TAB acceptance_evidence` joined with LF |

The two row-level hashes are enforced by `scripts/verify-source-tracker.mjs`, preventing a task or its acceptance criteria being silently rewritten. The original source historical `status=NOT_STARTED` is **immutable historical metadata**; it does not prove the present working game is unimplemented. The original overlay `CANDIDATE_ONLY` evidence hints similarly **do not** establish independent task acceptance.

## 2. Exact source inventory and obligations

| Registry | Original entries | Verified inventory | Independent acceptance |
|---|---:|---:|---|
| Original v3 source Tasks | **602** | 602/602 unique IDs `CH-00-001…CH-24-020` | **0 independently verified** |
| Original source phases | **25** (`00…24`) | All 25 | Per-task release gates pending |
| Original release gates | **23** (`G0…G22-P3`) | 23/23 | **0 independently approved** |
| Source screen definitions | **30** (`SCR-00…29`) | 30/30 | 0 final-accepted |
| Source test cases | **60** | 60/60 source rows | No source-row QA acceptance claimed |
| Source asset expectations | **40** | 40/40 source rows | No original source license/device acceptance claimed |

**Provenance:** **418** original preserved v2 tasks and **184** v3 refinements, including 31 asset pipeline tasks, 30 screen detail and 30 screen test tasks. `P0=179`, `P1=371`, `P2=33`, `P3=19` from actual workbook.

### Permanent GitHub source registries

- [All 602 source tasks and provisional batch crosswalk](GC_B01_T07_602_TASK_SOURCE_BATCH_MAP.csv) — original 17 fields kept in order; `phase_id` normalized to `00` for leading-zero-safe interoperability; 13 new mapping, review and evidence fields appended. No task text/acceptance rewritten.
- [Source provenance and mapping-rule manifest](GC_B01_T07_602_TASK_SOURCE_MANIFEST.json)
- [23 original release gates](GC_B01_T07_23_SOURCE_RELEASE_GATES.csv)
- [30 original screen obligations](GC_B01_T07_30_SOURCE_SCREENS.csv)
- [60 original source QA tests](GC_B01_T07_60_SOURCE_TEST_CASES.csv)
- [40 original source asset items](GC_B01_T07_40_SOURCE_ASSETS.csv)
- [Machine-checkable source/acceptance guard](../../scripts/verify-source-tracker.mjs) and [negative/positive automated tests](../../tests/task-source-ledger.test.js)

## 3. 602→10 batch mapping — source-derived *candidate*, not false task completion

| Planned batch | Source rows provisionally mapped | Primary origin/phase |
|---|---:|---|
| `GC-B01` | 75 | Charter, requirements, environment, architecture |
| `GC-B02` | 80 | Legal chess, game controller, local match, opponent |
| `GC-B03` | 24 | Versioned offline data and future account identity |
| `GC-B04` | 40 | Puzzle curriculum, verified future coaching |
| `GC-B05` | 20 | Optional authoritative online PvP (P3) |
| `GC-B06` | 48 | Original asset workflow and primary source brand/license tasks |
| `GC-B07` | 139 | Screen contracts, visual design, accessible board/history UI |
| `GC-B08` | 17 | Optional monetization and ads (P2) |
| `GC-B09` | 93 | Web/Android build, deployment, Play and release preparation |
| `GC-B10` | 66 | Security/regression/testing and final production acceptance |
| **Total** | **602/602** | **0 missing/duplicate, 0 silently verified** |

**Mapping priority:** 31 explicit `V3_ASSET_PIPELINE` to B06; 60 `V3_SCREEN_DETAIL`/`V3_SCREEN_TEST` to B07; remaining **511** assigned by transparent source-phase→batch rule in manifest. Each original row includes the rule, one primary candidate, related candidate batches and `mapping_review_required=YES`. These are **batch responsibility candidates**, not signed mapping to exact `GC-Bxx-Tyy` subtasks. All source rows retain `master_atomic_task_id=UNASSIGNED_ATOMIC_TASK` until a dedicated human-reviewed acceptance/diff mapping is completed in that batch. The original source has `NOT_STARTED` status; the live code may already implement a feature—only SHA-specific test/QA review can change its acceptance status.

**Where broader/mixed phases cross cut:** phases 01, 05, 08, 13, 16/17, 18–21 and 22–24 have related-batch fields and explicit row review requirement; no false exact one-to-one claim. Any reallocation must update manifest and pass source guard. The T07 criterion is exhaustive **source-ID-to-provisional-batch inventory**, not acceptance of all 602 user stories.

## 4. Mandatory evidence before a source row becomes VERIFIED

A source row **cannot** be marked `VERIFIED` without all four fields:

1. `verified_commit_sha`: exact 40-hex commit SHA of implemented behavior.
2. `verified_evidence_url`: durable relevant CI, manual/device QA, or production evidence link.
3. `verified_reviewer`: identifiable, accountable reviewer (not a fabricated second person).
4. `verified_at_utc`: explicit review timestamp.

`status` (historical source workbook value) is **never** overwritten; `acceptance_verification` is the live per-task acceptance field. Changing acceptance requires satisfying the original `acceptance_evidence`, dependencies and `exit_gate`, not simply a green Node suite. On-device/final privacy/Play evidence remains separately required, including previously incomplete M01 overlay rows. The validator prevents spurious `VERIFIED`, duplicate IDs, changed source task text/criteria, missing source gates/screens and false global gates.

## 5. Automation, execution order and T03 exception

**One-task precedence, explicitly authorized:** The Product Owner instructed `START GC-B01-T07 & START GC-B01-T08 start kro build and merge`. Execute **T07 first, merge and verify, then T08**. This approval allows the two named non-release prep tasks only; it does **not** approve force-push, production deployment, Play release, ads, cloud sync, or bypass G0–G22 acceptance.

`GC-B01-T03` remains `BLOCKED_EXTERNAL` because the current active GitHub ruleset covers the canonical integration branch but **not** `main`. Never mark T03 done just because T07/T08 pass. `GC-B01-GATE=NOT_ELIGIBLE` until **all T01–T08** tasks and reviewer gate finish, not merely test CI. The T08 baseline must consume the T07 merged snapshot, not an earlier task branch.

## 6. Required verification and rollback

**Reproducible command:** `node scripts/verify-source-tracker.mjs` plus `npm test` (Node's test autodiscovery) and existing architecture/PWA/Chromium/Workers workflows.

- [x] Reopened and cross-compared real standalone v3 XLSX, original ZIP tracker bytes and M01 overlay 602 rows.
- [x] Loaded every source task ID, text, original criterion and priority; no row/phase loss.
- [x] Recorded 602 provisional batch candidates, the original 23 gates/30 screens/60 tests/40 assets, and versioned mapping rules with source hashes.
- [x] Added automated negative tests for forged verification, ID mutations, duplicate/missing gates and premature batch GO.
- [ ] Exact PR head CI, safe protected squash merge and canonical post-merge CI (track in PR, do not inherit a different SHA's success).

**Task state on draft:** `IMPLEMENTED_UNVERIFIED`. After final exact-head green checks and protected squash merge with post-merge verification, mark `GC-B01-T07 = DONE (SOURCE INVENTORY/CANDIDATE BATCH CROSSWALK ONLY)`. **All 602 original task acceptance states remain `NOT_VERIFIED` until separate evidence and review.**

**Rollback:** close unmerged T07 PR and delete only its named branch, or revert the single T07 squash commit with a separately reviewed PR on protected canonical. No app/user data touched. No secrets, dependencies, infra, signed Android distribution or active production state changed.
