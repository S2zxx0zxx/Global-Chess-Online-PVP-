# GC-B01-T02 — PR #18 integration reconciliation

**Plan:** `GC-MASTER-EXEC-v1.0` · **Tag:** `GC-B01-T02` · **UTC snapshot:** 2026-11-22  
**Exact app source:** `3d9467ada0eaf167eecc52d6c98ed126fa98c98c` · [PR #18](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/pull/18) OPEN/DRAFT, not in main  
**Base:** foundation `f4d313f24fc54c73255226c6fb1f4859d651a31d`, 18 commits ahead, zero behind  
**Scope:** diff-based historical source reconciliation, not feature completion, code rewrite, merge, device certification or release.

## Acceptance and evidence method

Compared GitHub PR #2–#17 changed-file patches, exact head Git trees and selected blob SHA/content against PR #18; refetched live PR metadata and current head CI. Each difference below is marked preserved, superseded, blocked or explicitly owned. No historical PR has been blindly merged.

The main PR #18 compare has **71 changed files: 27 added, 31 modified, 13 removed**. The 13 removals are **one old board WebP and 12 old piece WebPs**. The prior T01 report's phrase "14 legacy WebP deletions" was a counting typo; the original itemized list was correctly 13 and is corrected in this stacked documentation branch.

**Status meanings:** PRESERVED_EXACT = identical Git blob; REWORKED = source-level functional counterpart exists, not exhaustive equivalence; SUPERSEDED = new architecture replaces old; BLOCKED_FEATURE = still missing actual feature; BLOCKED_SCOPE = optional and not owner-approved; ACCEPTANCE_PENDING = independent or platform evidence not available.

## Historical PR-by-PR disposition — complete #2–#17 range

| PR | File-level finding | Disposition | Source owner / future task |
|---|---|---|---|
| [#2](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/pull/2) | Previous navigation.js, profile-stats.js and shell; replaced by app-shell.js, screen-routes.js, game-stats.js | **SUPERSEDED; old PR dirty; no blind merge** | `GC-B01-T03 / GC-B07` |
| [#3](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/pull/3) | Old storage-durability test missing; new storage.js, session-exit.js, history-mutation.js and storage-fallback test present | **REWORKED; retry/fault equivalence unverified** | `GC-B01-T08` |
| [#4](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/pull/4) | Capacitor API36 config, debug script and Android preview doc present | **REWORKED; physical device unverified** | `GC-B09` |
| [#5](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/pull/5) | progression.js + backup.js at #15 exact blob SHAs | **PRESERVED_EXACT** | `GC-B03 / GC-B07` |
| [#6](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/pull/6) | public/_headers present. privacy-data.js and its tests ABSENT. Historical full local archive and all-data erase missing; only match-backup and completed-history deletion in #18 | **CSP PRESERVED; PRIVACY ARCHIVE/ERASE BLOCKED_FEATURE** | `GC-B07-T27 / GC-B07-T28` |
| [#7](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/pull/7) | Android production release and signing smoke workflow blobs identical to #15; build scripts updated | **PRESERVED; real upload signing unavailable** | `GC-B09` |
| [#8](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/pull/8) | computer.js and learning-pack validator retained with later #14 improvements | **PRESERVED_EXACT** | `GC-B02 / GC-B04` |
| [#9](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/pull/9) | CH01_V3_RELEASE_GATES_EVIDENCE.md restored/revised; old screen evidence file omitted, replaced by V3_SCREEN_IMPLEMENTATION_MATRIX | **REWORKED, acceptance pending** | `GC-B01-T07 / GC-B07 / GC-B10` |
| [#10](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/pull/10) | applyResign in server/match.js, /resign handler in worker.js, versioned client resign in online.js, pvp-resignation test | **REWORKED, functional local room proof** | `GC-B05 / GC-B09` |
| [#11](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/pull/11) | M01 reconciliation MD and source snapshot JSON not integrated; no row-level 602 verification | **BLOCKED_SOURCE for tracker, don't claim task acceptance** | `GC-B01-T07` |
| [#12](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/pull/12) | session-exit.js and history-mutation.js exact blob equality #15/#18; old PR dirty vs foundation | **PRESERVED_EXACT; old merge blocked** | `GC-B01-T03 / GC-B01-T08` |
| [#13](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/pull/13) | Original SVG board+12 pieces, original-art check and native Android shell; 13 legacy WebP assets removed intentionally | **PRESERVED_EXACT; INTENTIONAL_REMOVAL** | `GC-B06 / GC-B09` |
| [#14](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/pull/14) | computer.js and validate-learning-pack.mjs exact SHA matches #18 | **PRESERVED_EXACT** | `GC-B02 / GC-B04` |
| [#15](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/pull/15) | Exact #18 blob matches: progression.js, backup.js, learning.js, computer.js, session-exit.js, history-mutation.js, learning pack validation, original SVG and Android release workflows; storage, native, 3D, online reworked | **PRESERVED_EXACT + REWORKED** | `GC-B01-T08 / GC-B06` |
| [#16](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/pull/16) | Merged into foundation; 8 board and 7 piece options, royal effects present on #18 with newer 3D effects | **PRESERVED_REWORKED** | `GC-B06 / GC-B07` |
| [#17](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/pull/17) | Native AdMob/UMP, optional supporter badge, build config scripts and tests do not appear in #18 | **BLOCKED_SCOPE; no owner approval inferred** | `GC-B08-T01 / GC-B08-T03` |

## Exact Git blob evidence (PR #15 → #18)

| File | Verified #18 blob prefix | Comparison |
|---|---|---|
| `src/progression.js` | `aa8025b1fb30` | identical to #15 |
| `src/backup.js` | `368400216fbb` | identical to #15 |
| `src/learning.js` | `be1c2155b5d6` | identical to #15 |
| `src/computer.js` | `195823f78ac3` | identical to #15 / #14 |
| `src/session-exit.js` | `b50cc3debf74` | identical to #15 / #12 |
| `src/history-mutation.js` | `caa30e162ff7` | identical to #15 / #12 |
| `scripts/validate-learning-pack.mjs` | `5444375c1189` | identical to #15 / #14 |
| `public/brand/board-maple-walnut.svg` | `b8b28f7ee221` | identical to #15 / #13 |
| `src/storage.js` | `d278303aad78` | **modified** from #15 `e0d593de335f`; stale-tab protection added |
| `src/native-lifecycle.js` | `261669bce98f` | **modified** from #15; native App plugin packaging check present |
| `public/_headers` | `e6f22fa33217` | present on #18, parsed by `vite.config.js` |
| `src/royal-appearance.css` | `adfe1a4b2f23` | present on #18, #16 visual effects retained |

Exact match is **not** a claim of physical-device, production-security or gameplay completeness.

## Critical old-feature parity discrepancy: PR #6 local data controls

- Old #6 [`src/privacy-data.js`](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/blob/ac8bdf8155cf18f7e67c4909f7d1fd4f44166c94/src/privacy-data.js) implemented `exportLocalUserData` (a distinct local archive without the private-room seat credential) and `deleteLocalUserData` (active match/history/learning and local preferences). Old [`tests/privacy-data.test.js`](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/blob/ac8bdf8155cf18f7e67c4909f7d1fd4f44166c94/tests/privacy-data.test.js) exists.
- New #18 has [`src/screen-routes.js`](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/blob/3d9467ada0eaf167eecc52d6c98ed126fa98c98c/src/screen-routes.js) with Data & Privacy and **completed-match history deletion only**; [`src/main.js`](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/blob/3d9467ada0eaf167eecc52d6c98ed126fa98c98c/src/main.js) exports a match JSON backup. The old local-data module and test are not present.
- **BLOCKED_FEATURE:** this is a real missing parity item, not a passing-test excuse. Map to mandatory `GC-B07-T27` and `GC-B07-T28`. Do **not** blindly paste old code: keys changed (`global-chess.first-move-v1`, `global-chess.setup.v1`, `global-chess.feedback.v1`, appearance/avatars), IndexedDB snapshot semantics evolved and active-room credentials must not be exported. Preserve existing saves until a safe delete/restore design is verified.
- CSP part of PR #6 **is preserved**: [`public/_headers`](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/blob/3d9467ada0eaf167eecc52d6c98ed126fa98c98c/public/_headers), `vite.config.js` and production browser CI.

## Hard merge and release boundaries

1. Historic PR #2 and #12 currently report `mergeable=false`; **no force push or historical UI overwrite**. Their functionality must be represented by the newer source with regression evidence.
2. #18 has the integrated `src/progression.js`, `src/backup.js`, `src/session-exit.js`, `src/history-mutation.js`, original SVG artwork, theme effects, native lifecycle and authoritative `applyResign`. Preserve these files, not their earlier conflicting branch copies.
3. PR #17 AdMob/UMP source is **separate and optional**, not a missing mandatory core-chess behavior. Owner choice is only `GC-B08-T01`. Ads disabled by default; no live ads/approval can be inferred.
4. Historical #11 M01 source snapshot and #2 screen evidence documents are not in PR #18. Reconcile authoritative 602-row tracker in `GC-B01-T07`, not through guessed historical completion totals.
5. Legacy storage durability tests are not byte-for-byte carried forward. Regression matrix `GC-B01-T08` must explicitly cover current `src/storage.js` failure/retry/concurrency behavior.
6. UI/2D/3D/reduced motion, commercial asset ownership, physical Android Back/rotation/accessibility, hosted two-device PvP and production signing remain **ACCEPTANCE_PENDING** in later tasks.
7. PR #18 and this audit are not in `main`. No published release is asserted.

## Verification evidence

- [Core #45020997794](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/actions/runs/45020997794): exact #18 source head **98/98** Node tests, Vite build, 2D/3D rendered Chromium smoke, original-art package gate, 12 lessons/30 puzzles validation, CSP and local Workers two-seat/reconnect/resign smoke passed.
- [Android debug #45020997745](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/actions/runs/45020997745): exact #18 head API36 debug packaging passed; not real-device sign-off.
- [Ephemeral signing #45020997795](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/actions/runs/45020997795): exact #18 head AAB smoke passed using disposable signing; not a Play AAB.
- T02 executed read-only GitHub source/patch/tree comparisons and documents. **No new product-code tests are claimed.** Markdown and ledger checked by refetching committed GitHub files.

## Conflict-disposition / blocking register

| ID | Disposition | Responsible task | Current condition |
|---|---|---|---|
| `T02-C01` | BLOCKED_HISTORICAL_MERGE | `GC-B01-T03` | #2/#12 dirty; never force merge |
| `T02-C02` | BLOCKED_FEATURE | `GC-B07-T27` | Full archive and all-local-data erase absent on #18 |
| `T02-C03` | ACCEPTANCE_PENDING | `GC-B01-T08` | Legacy save/retry test semantics require explicit coverage |
| `T02-C04` | BLOCKED_SOURCE | `GC-B01-T07` | Original 602-row owner tracker not verified row by row |
| `T02-C05` | ACCEPTANCE_PENDING | `GC-B06`, `GC-B07`, `GC-B10` | Device/visual/asset provenance |
| `T02-C06` | BLOCKED_SCOPE | `GC-B08-T01` | #17 optional ad feature not owner-approved |
| `T02-C07` | ACCEPTANCE_PENDING | `GC-B09`, `GC-B10` | Hosted deployment, Play legal and signing gates |

Every identified branch conflict or missing feature is either replaced, deliberately excluded, or explicitly blocked/owned. **These blockers are NOT secretly fixed by T02.** Do not mark `GC-B07-T27`, `GC-B08` or any release gate DONE.

## Task-specific closure

- [x] Re-fetch #18 current head/base and historical #2–#17 PR status.
- [x] Diff and blob-based reconciliation; changed files counted correctly.
- [x] No blind/force merge, no old UI or unsafe WebP restore.
- [x] Source checks preserve original art, themes, safe save, progress, Android, CSP and PvP resign.
- [x] Genuine missing/deferred features assigned permanent task IDs.
- [x] Existing exact-head CI linked; no new test assertions fabricated.
- [x] Correction to prior T01 summary recorded.
- [x] Doc-only rollback: close T02 draft PR/delete only its new branch; untouched #18, #19 and main.

**`GC-B01-T02 = DONE` for diff-based source reconciliation and conflict disposition only. `GC-B01-GATE = NOT_ELIGIBLE` until T03–T08 plus batch review. Next eligible command only `START GC-B01-T03` on user instruction.**
