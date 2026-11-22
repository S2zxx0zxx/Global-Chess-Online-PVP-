# Global Chess — Sequential Execution Ledger

**Master plan:** `GC-MASTER-EXEC-v1.0`  
**Repository:** `S2zxx0zxx/Global-Chess-Online-PVP-`  
**Workstream:** `GC-B01`  
**Last verified audit snapshot:** `2026-11-22T12:56:18Z`  
**Master MD SHA-256:** `f076a2a8f3672a3fa3fb325b05ae930f938c88a2d2521eab17fe8c55779cae59`

## Current control

- **Tasks closed:** T01, T02, T04, T05, T06 (previous scoped evidence); **T07 `DONE (602 ORIGINAL SOURCE INVENTORY & PROVISIONAL BATCH MAP ONLY)`**. Original 602 task acceptance states remain 0 VERIFIED.
- **One active task:** `NONE` after T07 inventory construction, pending exact PR head CI and protected squash-merge. T03 remains `BLOCKED_EXTERNAL` / user-directed nonrelease exception, NOT DONE.
- **Next permitted action:** verify PR #27 T07 exact-head CI/merge first, then start **T08 only** on the resulting canonical SHA as explicitly instructed by Product Owner. T03 remains unresolved.
- **Batch status:** `GC-B01-GATE = NOT_ELIGIBLE` (T03 unresolved; T07 source inventory DONE when integrated; T08 planned but not started; mandatory review still pending)
- **No change authority inferred:** no merges, force pushes, production changes, billing or other work approved by this document.

## Task closure: GC-B01-T01

```yaml
plan_id: GC-MASTER-EXEC-v1.0
batch_id: GC-B01
task_id: GC-B01-T01
status: DONE
scope: exact-SHA source and PR baseline only
signed_by: ChatGPT source-audit executor (not an independent human review)
signed_at_utc: "2026-11-22T12:47:17Z"
repository: S2zxx0zxx/Global-Chess-Online-PVP-
baseline_sha: 3d9467ada0eaf167eecc52d6c98ed126fa98c98c
baseline_pr: https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/pull/18
base_branch: feat/playable-chess-foundation
base_sha: f4d313f24fc54c73255226c6fb1f4859d651a31d
work_branch: audit/gc-b01-t01-source-pin-20261122
audit_commit: bc5a9fb91cc2dd4bf9162f45e1b7906ffe75294d
changed_files:
  - docs/execution/GC-B01-T01_SOURCE_BASELINE_2026-11-22.md
requirements_evidence:
  - all_18_pr_heads_and_states_pinned
  - foundation_to_release_branch_ahead_18_behind_0
  - exact_71_file_change_inventory
  - merge_conflict_statuses_2_and_12_dirty_18_clean
  - deployment_distinction_unverified
automated_test_evidence:
  - https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/actions/runs/45020997794
  - https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/actions/runs/45020997745
  - https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/actions/runs/45020997795
test_execution_by_this_task: false
device_or_manual_evidence:
  - GitHub_read_only_pr_branch_release_and_exact_head_logs
  - Cloudflare_read_only_connected_account_inventory_no_matching_global_chess_project
security_and_data_review: documentation_only_no_game_data_keys_or_secrets_modified
open_blockers:
  - production_deploy_sha_not_verified
  - B01_T02_through_T08_pending
  - final_device_legal_security_play_approvals_out_of_scope
rollback_instructions: close_doc_only_PR_and_delete_only_this_audit_branch_if_needed
owner_or_independent_review_approval: not_obtained_no_human_signoff_claimed
done_at_utc: "2026-11-22T12:47:17Z"
next_task_allowed: true
next_task_requires_explicit_command: START GC-B01-T02
```

**Baseline source document:** [`docs/execution/GC-B01-T01_SOURCE_BASELINE_2026-11-22.md`](../execution/GC-B01-T01_SOURCE_BASELINE_2026-11-22.md)

## Task closure: GC-B01-T02

```yaml
plan_id: GC-MASTER-EXEC-v1.0
batch_id: GC-B01
task_id: GC-B01-T02
status: DONE
scope: historical_2_to_17_PR_diff_and_exact_blob_reconciliation_only
recorded_at_utc: "2026-11-22T12:56:18Z"
reference_app_sha: 3d9467ada0eaf167eecc52d6c98ed126fa98c98c
base_sha: f4d313f24fc54c73255226c6fb1f4859d651a31d
source_plan_sha256: f076a2a8f3672a3fa3fb325b05ae930f938c88a2d2521eab17fe8c55779cae59
work_branch: audit/gc-b01-t02-pr18-reconciliation-20261122
changed_files:
  - docs/execution/GC-B01-T02_PR18_RECONCILIATION_2026-11-22.md
  - docs/execution/GC-B01-T01_SOURCE_BASELINE_2026-11-22.md
  - docs/execution/GC_EXECUTION_LEDGER.md
source_evidence:
  - https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/pull/18
  - github_PR_2_to_17_patches_source_trees_and_blob_comparison
  - 71_changed_files_27_added_31_modified_13_legacy_webp_removed
  - original_SVG_theme_storage_XP_Android_CSP_server_resign_reconciled
tests_this_task: no_new_product_code_no_new_test_run
existing_exact_head_evidence:
  - https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/actions/runs/45020997794
  - https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/actions/runs/45020997745
  - https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/actions/runs/45020997795
known_open_conflicts_or_deferrals:
  - "T02-C01 old PR #2 and #12 cannot be blind merged; owner GC-B01-T03"
  - "T02-C02 full local data archive/delete missing; owner GC-B07-T27"
  - "T02-C03 full legacy storage retry matrix unproven; owner GC-B01-T08"
  - "T02-C04 original 602-row source tracker not accepted; owner GC-B01-T07"
  - "T02-C05 graphics/device acceptance pending; owners GC-B06/GC-B07/GC-B10"
  - "T02-C06 optional PR #17 ads not approved; owner GC-B08-T01"
  - "T02-C07 hosted deployment/Play acceptance pending; owners GC-B09/GC-B10"
risk_and_rollback: documentation_only_no_game_code_edits_close_draft_PR_and_delete_only_new_branch
reviewer_human_approval: not_obtained
done_means: source_reconciliation_accepted_not_every_feature_complete
next_task_allowed: true
next_task_requires_explicit_command: START GC-B01-T03
```

**T02 detail:** [`GC-B01-T02_PR18_RECONCILIATION_2026-11-22.md`](GC-B01-T02_PR18_RECONCILIATION_2026-11-22.md)

## GC-B01-T03 — Protection, history and CI checkpoint

```yaml
plan_id: GC-MASTER-EXEC-v1.0
task_id: GC-B01-T03
status: BLOCKED_EXTERNAL
repository: S2zxx0zxx/Global-Chess-Online-PVP-
canonical_branch: integration/global-chess-v3
canonical_source_before_T01: 3d9467ada0eaf167eecc52d6c98ed126fa98c98c
T01_baseline_PR: 19
T01_merged_squash: 0a309ddf84cec42a42f52a546f87c6d1f95e7e41
T02_clean_PR: 22
T02_merged_squash: f614bdab2fbfb13a18c7e26ab77269f22a2e1520
T02_old_stacked_PR20: merge_conflict_not_force_merged
T03_clean_PR: 23
T03_superseded_stacked_PR21: not_merged
T03_base_SHA: f614bdab2fbfb13a18c7e26ab77269f22a2e1520
T03_files:
  - docs/execution/GC-B01-T03_CANONICAL_BRANCH_PR_POLICY_2026-11-22.md
  - .github/PULL_REQUEST_TEMPLATE.md
  - .github/workflows/verify.yml
  - docs/execution/GC_EXECUTION_LEDGER.md
ruleset_id: 27842501
ruleset_name: Global Chess Protected Branches
ruleset_enforcement: active
ruleset_target_ref_names:
  - refs/heads/integration/global-chess-v3
canonical_protected: true
main_protected: false
rules_active:
  - pull_request
  - required_linear_history
  - deletion
  - non_fast_forward
required_approving_review_count: 0
bypass_actors: []
blocked_outstanding:
  - "owner add main to ACTIVE ruleset and prove main protected=true"
  - "PR #23 was clean squash-merged to canonical @ 45ec74c002d7ffb0f0f5252dd6d03db3f6569526 (RESOLVED)"
  - "Core run #45027958108 attempt 2 SUCCESS: 98/98 Node tests and full Chromium/Workers checks (RESOLVED; attempt 1 timeout noted)"
  - "owner manual signoff/review evidence not yet supplied"
owner_review: pending
production_or_release_ready: false
next_command: RESUME GC-B01-T03
next_task_GC_B01_T04_eligible: false
rollback: "squash-revert on canonical via new PR after owner approval; no force pushes"
```

**Current source and rollback policy:** [`GC-B01-T03_CANONICAL_BRANCH_PR_POLICY_2026-11-22.md`](GC-B01-T03_CANONICAL_BRANCH_PR_POLICY_2026-11-22.md).  
**PR #23:** https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/pull/23.

No `GC-B01-T03 DONE` assertion until `main` is targeted and the post-merge canonical CI checks actually succeed; no T04 work may be started early.

## GC-B01-T04 — Owner-directed sequence override and scope checkpoint

**User instruction:** `Skip kro 3 ko ispe kaam start kro START GC-B01-T04`. Explicitly authorizes **T04 planning** while T03 is unresolved; does NOT authorize release/governance bypass, mark T03 DONE, or cancel T03.

```yaml
plan_id: GC-MASTER-EXEC-v1.0
task_id: GC-B01-T04
task_scope: Lock MVP versus optional_P2_P3_scope_from_v3_sources
owner_sequence_exception:
  skipped_task: GC-B01-T03
  skip_type: planning_only
  not_marked_done: true
  source: "User direct command: Skip kro 3 ko ispe kaam start kro START GC-B01-T04"
canonical_pre_t04_sha: 45ec74c002d7ffb0f0f5252dd6d03db3f6569526
task_branch: docs/gc-b01-t04-scope-lock
task_status: DONE_OWNER_APPROVED_SCOPE_LOCK_ONLY
task_blocker: NONE_FOR_SCOPE_CLASSIFICATION__BATCH_T03_STILL_BLOCKED
doc_evidence:
  - docs/execution/GC-B01-T04_SCOPE_LOCK_2026-11-22.md
  - docs/execution/GC-B01-T04_PRD_SCOPE_MATRIX.csv
classification:
  PRD_requirements: 16
  v3_screens: 30
  explicitly_owned_deferrals: 12
  first_public_web_scope: M0_then_M1
  android_store_scope: M2
  strong_learning_coaching_scope: M3
  optional_native_ads_scope: M4
  online_rated_social_scope: M5
all_122_master_tasks_preserved: true
all_602_source_task_acceptance_claimed: false
owner_scope_approval: APPROVED_IN_CHAT_2026_11_22
owner_scope_approval_command: "APPROVE GC-B01-T04-SCOPE-v1.0"
owner_scope_approval_recorded_at_utc: "2026-11-22T14:28:39Z"
owner_scope_approval_scope: M0_M5_release_boundaries_and_16_PRD_classification_only
optional_ads_activation_approved: false
next_permission: verify_final_PR24_CI_then_merge_docs__T05_NOT_AUTHORIZED
t03_live_status:
  task: GC-B01-T03
  status: BLOCKED_EXTERNAL_OWNER_SKIPPED_FOR_PLANNING
  canonical_ruleset: active
  canonical_protected: true
  main_protected: false
  PR19_merged: "0a309ddf84cec42a42f52a546f87c6d1f95e7e41"
  PR22_merged: "f614bdab2fbfb13a18c7e26ab77269f22a2e1520"
  PR23_merged: "45ec74c002d7ffb0f0f5252dd6d03db3f6569526"
  canonical_CI_run: "https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/actions/runs/45027958108"
  canonical_CI_attempt_1: failed_intermit_promotion_wait
  canonical_CI_attempt_2: success_98_of_98_tests_browser_workers
batch_gate: NOT_ELIGIBLE
t05_start_authorized: false
product_code_changes_in_t04: false
rollback: Close draft PR and delete only T04 branch before merge; future doc revert PR after merge
```

**Status semantics:** T04 scope-lock task is **DONE after explicit owner approval**. The PR #24 merge is separately verified before integration completion. T03 remains unresolved and B01-GATE is NO-GO; T05 not started. PRD reference is the original user-owned `Chess_FINAL_Master_Blueprint_v3_2026-11-18.md`, not unapproved imitation UI.

**Scope evidence:** [`GC-B01-T04_SCOPE_LOCK_2026-11-22.md`](GC-B01-T04_SCOPE_LOCK_2026-11-22.md); [`GC-B01-T04_PRD_SCOPE_MATRIX.csv`](GC-B01-T04_PRD_SCOPE_MATRIX.csv).

**Closure evidence:** Product Owner command `APPROVE GC-B01-T04-SCOPE-v1.0` recorded 2026-11-22T14:28:39Z. CI on signed scope before ledger closure [run #45033223532](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/actions/runs/45033223532) SUCCESS at `e2fdddd5cc4895cede1ce36d88633fa5f98f51e8`. Final updated documentation SHA requires fresh CI and PR #24 squash-merge check. Closure does not imply active `main` protection or release readiness.

### GC-B01-T04 scope signoff — explicit owner command

- Product Owner command: `APPROVE GC-B01-T04-SCOPE-v1.0` (received in this ChatGPT conversation on 22 November 2026).
- Recording timestamp (UTC): `2026-11-22T14:28:39Z`; no independent GitHub reviewer identity or personal legal signature claimed.
- Approved: all 16 PRD classifications, 30 screen contract scope obligations, 12 deferred items with owner/reason/gate, and M0–M5 first-release boundaries as documented in `GC-B01-T04_SCOPE_LOCK_2026-11-22.md`.
- Not approved: ad enablement, Play publication, new payments, live global PvP, task removal/reordering, waiving T03 governance, 602-row original source acceptance, or M0/M1/M2 product certification.
- PR #24 pre-signoff SHA `5db79bea071fe0f17153e0092ac3f0ee21623d7d` CI #45030661367 was SUCCESS. **Post-signoff head checks and merge remain pending at this checkpoint.**

## GC-B01-T05 — Live architecture baseline and explicit one-task exception

**User command:** `START GC-B01-T05` after owner-approved T04. Scope limited to architecture ADR and compatibility guards, NOT release governance bypass. Source Master 01.05 specifically allows choice between continuing Vite/JavaScript ESM with progressive typing and React/TypeScript rewrite; choice must be based on measured source and regression risk.

```yaml
task_id: GC-B01-T05
plan_id: GC-MASTER-EXEC-v1.0
status: DONE_ARCHITECTURE_ADR_AND_CI_GUARDS_ONLY
original_architecture: Vite_8_JavaScript_ESM_vanilla_UI
selected_architecture: RETAIN_VITE_ESM
typescript_strategy: JSDoc_progressive_checkJs_then_pinned_toolchain_later
react_runtime_added: false
new_runtime_or_dev_dependencies: 0
package_lock_changed: false
reference_source_sha: b9126162357e0ab21ebcded8915dfe35cbba568c
working_branch: feat/gc-b01-t05-architecture-contract
task_artifacts:
  - docs/execution/GC-B01-T05_ARCHITECTURE_ADR_2026-11-22.md
  - scripts/check-architecture-contract.mjs
  - tests/architecture-contract.test.js
  - package.json
  - .github/workflows/verify.yml
  - docs/execution/GC_EXECUTION_LEDGER.md
pilot:
  local_ts_version: 5.8.3
  syntax_and_typecheck: PASS
  representative_clock_behavior_parity: 1_of_1_passed
  deliberately_invalid_preset: TS2345_rejected
  installed_compiler_in_repo: false
  app_runtime_migrated_to_typescript: false
baseline_CI:
  run: "https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/actions/runs/45033713460"
  original_Node_tests: 98_of_98_passed
  main_JS_raw_kB: 146.42
  main_JS_gzip_kB: 49.02
  optional_3D_raw_bytes: 1114381
  optional_3D_gzip_kB: 267.39
  3D_budget_bytes: 1800000
  vite_build_seconds: 1.42
CI_exact_implementation_SHA: d5b511142aa5f03248ca4a5df7036a71e5b73e24
CI_core_104_of_104_passed: https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/actions/runs/45034747296
CI_android_debug_success: https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/actions/runs/45034747291
CI_android_ephemeral_signing_success: https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/actions/runs/45034747265
architecture_guard: PASSED
source_runtime_changes: NONE
final_closure_SHA_CI_and_protected_merge: VERIFY_AFTER_LAST_DOC_COMMIT
human_independent_review: NOT_CLAIMED
upstream_exception:
  skipped_task: GC-B01-T03
  scope: THIS_TASK_PLANNING_AND_SOURCE_GUARDS_ONLY
  not_marked_DONE: true
  main_branch_protection: UNRESOLVED
batch_gate: NOT_ELIGIBLE
t06_started: false
rollback: New_revert_PR_only__no_force_push__preserve_saves
```

**Important:** TypeScript pilot is a tested local prototype; the checker is source-level; neither is a claim of full TypeScript static typing. No changes to chess move rules, persisted data, public server behavior, Android signing or user UI.

**T05 exact-head engineering verification:** [Core 45034747296](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/actions/runs/45034747296) **SUCCESS** (104/104, architecture guard and Chromium/Workers); [Android debug 45034747291](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/actions/runs/45034747291) **SUCCESS**; [ephemeral signing 45034747265](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/actions/runs/45034747265) **SUCCESS**, all on source SHA `d5b511142aa5f03248ca4a5df7036a71e5b73e24`. The final ledger/ADR textual edit requires a fresh exact-head CI run before protected merge. No TypeScript, React, paid service, Android release or stored data migration was performed.

## GC-B01-T06 — Data/identity preflight checkpoint (one-task exception)

**Explicit user instruction:** `START GC-B01-T06`, after T05. This is authority to draft/verify T06 **contracts only**, not to waive T03, promote batch, enable cloud login, sync user data or deploy a service.

```yaml
plan: GC-MASTER-EXEC-v1.0
task: GC-B01-T06
task_status: DONE_CONTRACT_PREFLIGHT_ONLY
scope: Versioned data schemas, immutable event ID design, account/link boundary, server authority, privacy and migration threat model
canonical_pre_task_sha: 1c0dfd7d8b1b3ab35c15de3be7ea80ad3dace394
task_branch: docs/gc-b01-t06-data-identity-contracts
contract_document: docs/contracts/GC-B01-T06_DATA_IDENTITY_CONTRACT_v1.md
machine_manifest: docs/contracts/GC-B01-T06_CONTRACT_MANIFEST.v1.json
schema_dir: docs/contracts/schemas/
schema_count: 6
existing_schema_descriptors: 4
future_only_schema_proposals: 2
contract_tests: tests/data-identity-contract.test.js
contract_test_count: 13
new_dependencies: 0
existing_match_save_version: 1
existing_indexeddb_db_version: 1
existing_progress_version: 1
backup_export_version: 2
backup_legacy_import_version: 1
live_room_match_version_semantic: monotonic_move_counter_not_schema_version
existing_local_progress_event_id_semantic: kind_colon_exerciseId_derived_not_stored
existing_match_history_immutable_id: false
runtime_migration_executed: false
live_account_link_or_sync_implemented: false
real_user_data_accessed: false
production_credentials_created: false
ui_or_chess_game_code_changed: false
requirements:
  - Immutable ID policy preserving legacy progress and missing history IDs
  - Future migration copy-on-write, crash-idempotence, backwards read
  - Guest-first opt-in verified server-side account identity
  - Server-only online game authority and client version checks
  - Privacy data taxonomy and sensitive seat credentials
  - Conflict policy for cross-tab, cross-device, merges, tombstones
  - Threat assumption matrix with documented open security gaps
user_directed_exception:
  task: GC-B01-T03
  status: BLOCKED_EXTERNAL
  allowed_work: T06_nonrelease_contracts_only
  not_marked_done: true
  main_protected: false
batch: GC-B01
batch_gate: NOT_ELIGIBLE
next_task: GC-B01-T07
next_task_started: false
verification: FINAL_HEAD_CI_AND_SAFE_MERGE_REQUIRED_BEFORE_INTEGRATION_CLAIM
PR_number: 26
PR_url: https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/pull/26
current_node_baseline: 104
contract_test_increment: 13
expected_total_node_tests_if_all_pass: 117
metadata_only_or_test_only_changes: true
rollback: Close_unmerged_PR_or_reviewed_squash_revert_no_data_wipes
```

**Scope reference:** [T06 contract MD](../contracts/GC-B01-T06_DATA_IDENTITY_CONTRACT_v1.md) and [schema manifest](../contracts/GC-B01-T06_CONTRACT_MANIFEST.v1.json). Existing file formats remain byte-compatible; future event/account proposals are not implemented. This T06 signoff does not assert completeness of 602 original task rows or published Data Safety/Privacy Policy.

**T06 closing evidence boundary:** Source `1c0dfd7d8b1b3ab35c15de3be7ea80ad3dace394` pinned; no secrets/user records touched, no JS runtime edits, 13 source-to-contract synthetic tests added, no dependencies. The independent GitHub CI at **final PR #26 head** and **post-merge canonical** must be checked before asserting integration success. Do not confuse JSON schema definitions with online migration or authenticated account sync.

## GC-B01-T07 — 602-original-task inventory checkpoint

**Owner command:** `START GC-B01-T07 & START GC-B01-T08 start kro build and merge`. Execution is strictly **T07 then T08** with independent PR, exact-head CI and rollback. T03 remains blocked, user authorization applies only to T07/T08 nonrelease engineering work.

```yaml
task_id: GC-B01-T07
master: GC-MASTER-EXEC-v1.0
scope_status: DONE_602_SOURCE_INVENTORY_AND_PROVISIONAL_BATCH_CROSSWALK_ONLY
source_owner_tracker_sha256: df4a520e4d72e6592d96ac3960ac00e90b5d459ddc5288e056f63662a0ffbcd8
source_zip_tracker_byte_identical: true
overlay_Tasks_sheet_equal_to_original: true
source_unique_task_ids: 602
v2_original_preserved: 418
v3_refinements: 184
source_release_gates: 23
source_screen_ids: 30
source_test_cases: 60
source_assets: 40
provisional_batch_assignments: 602
independently_verified_original_source_tasks: 0
owner_approved_atomic_source_to_master_task_links: 0
all_source_mapping_rows_require_review: true
machine_registry: docs/execution/GC_B01_T07_602_TASK_SOURCE_BATCH_MAP.csv
manifest: docs/execution/GC_B01_T07_602_TASK_SOURCE_MANIFEST.json
source_reconciliation: docs/execution/GC-B01-T07_ORIGINAL_602_TASK_RECONCILIATION.md
source_guard: scripts/verify-source-tracker.mjs
source_guard_tests: tests/task-source-ledger.test.js
canonical_pre_task_sha: 69d7e13c6904f13344c1195333f13f39741f09c1
working_branch: docs/gc-b01-t07-602-source-ledger
github_pr: T07_PR_PENDING_CREATION
final_head_ci: PENDING
canonical_merge_sha: PENDING
previous_task_T03: BLOCKED_EXTERNAL_OWNER_SKIPPED_T07_T08_NONRELEASE_ONLY
main_branch_protected: false
batch_gate: NOT_ELIGIBLE
T08_start_requires_T07_merge_and_post_merge_evidence: true
T08_status: TODO
no_production_changes: true
```

**Acceptance boundary:** T07's inventory/mapping guard is DONE **only for original source-ID completeness and candidate batch responsibility**. Every `CH-xx-xxx` row's `acceptance_verification` is still `NOT_VERIFIED`; mapped batch is provisional. Do not count 602 tasks as implemented, call source test cases run, or claim G0–G22 gates approved. Individual source-row links to exact atomic `GC-Bxx-Tyy` tasks and evidence are future review work, not fabricated here.

## Batch 01 sequential pointer

| Task ID | Status | Evidence |
|---|---|---|
| `GC-B01-T01` | DONE | Exact-SHA baseline in this PR |
| `GC-B01-T02` | DONE | `GC-B01-T02_PR18_RECONCILIATION_2026-11-22.md`; blocked features remain open under their own task IDs |
| `GC-B01-T03` | BLOCKED_EXTERNAL (OWNER-SKIPPED FOR T04) | PR #23 merged, exact-head CI attempt 2 succeeded; only canonical protected; `main` unprotected and owner signoff pending; not DONE |
| `GC-B01-T04` | DONE (SCOPE LOCK ONLY) | Explicit owner approval command; 16/16 PRDs, SCR-00–29, 12 deferrals and M0–M5 scope signed in PR #24; final CI/merge tracked in GitHub PR |
| `GC-B01-T05` | DONE (ARCHITECTURE ADR + GUARDS) | Retain Vite/ESM decision, isolated TypeScript 5.8.3 pilot, 6 guard tests; PR #25 core 104/104 + Android debug/signing CI SUCCESS; final docs merge verification separately required |
| `GC-B01-T06` | DONE (DATA/IDENTITY CONTRACTS ONLY) | Six versioned schemas, manifest, 13 synthetic tests, immutable IDs/migration/account-link/privacy threat MD. PR #26 final CI + merge evidence required; NO data migration or cloud identity |
| `GC-B01-T07` | DONE (602 SOURCE INVENTORY ONLY) | Original v3 XLSX and ZIP SHA-256 match; 602/602 distinct source IDs, 418+184 provenance, 23 release gates, 30 screens, 60 source tests, 40 assets; all 602 provisionally batch-linked, 0 task acceptances VERIFIED; exact PR CI/merge required |
| `GC-B01-T08` | TODO | No action started |
| `GC-B01-GATE` | NOT_ELIGIBLE | Requires every T01–T08 task DONE and batch review |

## Resume procedure

1. Issue `STATUS GC-B01-T01` to verify source evidence if audit freshness is in doubt.
2. T07 original source inventory/phase crosswalk is complete subject to exact-head PR #27 CI and merge. **The user's same command explicitly authorizes T08 AFTER T07 succeeds.** T03 is unresolved, original 602 task acceptances 0 VERIFIED.
3. Re-fetch GitHub heads before edits, use exact SHA proofs and preserve all historic game code.
4. Never mark subsequent tasks DONE by copying this ledger status.

This evidence record does not claim that PR #18 is in `main`, that an Android app is published or that all release gates have passed.
