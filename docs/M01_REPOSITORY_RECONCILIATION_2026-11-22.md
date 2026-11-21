# M-01 — Repository Reconciliation & Development Baseline

**Audit date:** 2026-11-22 (IST)  
**Repository:** [S2zxx0zxx/Global-Chess-Online-PVP-](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-)  
**Audit branch:** `audit/m01-repository-reconciliation-20261122` (documentation-only, created from the verified PR #1 head)  
**Canonical application baseline:** PR [#1](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/pull/1), `feat/playable-chess-foundation` at **`3d816890027889dacee5ff51f00fbd4817700418`**. Base `main` at `ddb0d51778835cc39113e42c3466040a9f7fbebb`.

> This is a **source/CI/branch-state reconciliation checkpoint**, not production certification, an assertion that all 602 source tasks have been examined, or authorization to merge stacked branches. Do not silently replace the more recent PR #1 interface with earlier stacked implementations.

## 1. Locked project contract (v3 original)

- Original, premium burgundy/mahogany/gold chess experience; original artwork, not a Chess Clash copy.
- Guest-first, zero-budget-first, offline-first, with browser/PWA and independent Android installation sharing one versioned chess rules implementation.
- M0 local chess, vs-computer, same-device game and offline saves; M1 web beta, lessons/puzzles, local progression; M2 Android release after its distinct gates; M3 independently validated Mistake-to-Mission; M4 optional consented ads; M5 optional hosted multiplayer.
- **Original v3 specification:** 30 screen contracts `SCR-00..29`, 602 execution-task rows, 23 release gates `G0..G22`. The 602 task IDs/rows are NOT present as an authoritative tracker in this **GitHub tree**; the owner's private Library **does** contain the original `Chess_Execution_Tracker_v3.xlsx`, independently inspected in this audit. Its `Tasks` tab has **602** immutable IDs (418 preserved from v2 and 184 new v3), all carrying original planning status `NOT_STARTED`. This is historical tracker state, not an accurate claim that code has never been written; no percentage of those 602 tasks is accepted here.
- The blueprint proposes **shared React/TypeScript** domain/app architecture, while this main app is **Vite 8 + JavaScript ESM + chess.js 1.4.0**, Babylon/Havok for optional 3D, Cloudflare Worker/Durable Objects for experimental PvP. Treat this as an **architecture ADR gap** rather than silently claiming the planned stack is built or embarking on an unapproved risky rewrite.
- npm `"private": true` and `"license": "UNLICENSED"` do **not** change the GitHub repository's **PUBLIC** visibility.

## 2. Reproducible baseline evidence

| Verification | Observed result | Evidence boundary |
|---|---|---|
| PR #1 status | OPEN, DRAFT, UNMERGED; GitHub reports mergeable=true | Mergeability is not release approval |
| PR #1 scope | 218 commits and 97 changed files against main | Snapshot values; subject to change |
| Exact-head CI | [Run #44947607359](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/actions/runs/44947607359) completed **SUCCESS** at `3d816890` | Tests belong to this SHA, not future changes |
| Node unit tests | **42/42 passed**, zero failures | Not a full perft, differential rules or fuzz corpus |
| Build | `npm run build` Vite PWA succeeded, 3D size budget satisfied | Installed PWA and production CDN updates untested |
| Browser automation | Real legal 2D move, nonblank rendered Babylon/Havok 3D, mobile width/landscape/200%-text/Back/storage fallback scenarios passed | Simulated Chromium, not physical TalkBack/Android/GPU tiers |
| Offline/WASM | Service-worker asset preflight, WASM preparation and file checks passed | No comprehensive physical offline/update rollback test |
| Android debug on PR #4 | [Run #44456353185](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/actions/runs/44456353185) success | Separate stacked branch, not in canonical PR #1 |
| Android ephemeral signing on PR #7 | [Run #44456369173](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/actions/runs/44456369173) success | Disposable CI key != owner-signed Play release AAB |
| CI warning | `actions/checkout@v4`, `setup-node@v4`, `upload-artifact@v4` show Node 20 deprecation warning | Maintenance, not current failing CI |

## 3. Branch graph — preserve, DO NOT blind-merge

All ten existing PRs were observed **OPEN/DRAFT/UNMERGED**. PR #2 is reported `mergeable=false`; PRs #3–#10 report `mergeable=true` **against their own old stacked bases**, which says nothing about safe integration into latest PR #1. Every PR #2–#10 branch is **diverged** from `feat/playable-chess-foundation` at common merge base `68509fc2f9e9fd87ef4f23992c657cc177ae3057`.

| PR | Branch | Ahead / behind latest PR #1 | Functional delta / integration verdict |
|---|---|---:|---|
| [#2](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/pull/2) | `feat/chess-v3-m0-mobile-shell` | 44 / 171 | Earlier mobile shell, color/clock/profile; **overlaps current new UI**. Cherry-pick only missing tested behaviors, NOT old navigation wholesale |
| [#3](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/pull/3) | `fix/chess-v3-offline-save-recovery` | 49 / 171 | Durable IndexedDB retry/flush tests. Reconcile against newer `src/storage.js` fallback and `main.js` save path |
| [#4](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/pull/4) | `feat/chess-v3-android-debug-shell` | 53 / 171 | Capacitor 8, API 36, Android debug workflow. **Absent in PR #1**; port as isolated Android build wave |
| [#5](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/pull/5) | `feat/chess-v3-verified-local-progress` | 64 / 171 | `src/progression.js`, XP idempotency, migration tests. Module **absent in PR #1**; adapt to current screen routes, avoid double-awards |
| [#6](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/pull/6) | `feat/chess-v3-data-controls-pwa-update` | 74 / 171 | `privacy-data.js`/CSP/headers, PWA lifecycle. PR #1 has independently revised data/update screens; **merge semantics, not old UI** |
| [#7](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/pull/7) | `feat/chess-v3-android-release-gate` | 79 / 171 | Android signing scripts/workflows absent PR #1; preserve explicit owner-key/Play approval gate |
| [#8](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/pull/8) | `fix/chess-v3-bot-content-correctness` | 85 / 171 | Bounded bot search + starter pack validator absent as isolated test script; merge after verifying newer bot |
| [#9](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/pull/9) | `test/chess-v3-accessibility-release-evidence` | 88 / 171 | Responsive test coverage, 23-gate ledger. Current PR #1 has newer screen tests; port independent fixtures and gate mapping |
| [#10](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/pull/10) | `feat/chess-v3-pvp-server-resignation` | 93 / 171 | Authenticated server-side `applyResign`, endpoint/test **absent in PR #1**; adapt to current match/server and online client |

Ahead/behind values are Git graph commit differences, **not** numbers of unfinished features. For example, #10 has 93 commits not on PR #1, while PR #1 has 171 commits not on #10. Latest `package.json` blobs in those two branches are identical, but `src/main.js`, `src/storage.js`, `src/online.js`, `server/match.js`, `src/learning.js`, and `src/computer.js` have different SHA/content. Avoid overwriting the 171 newer commits with old copies.

## 4. Concrete source-level reconciliation findings

| Component | Current PR #1 | Stacked PR #10 lineage | Action |
|---|---|---|---|
| Game/navigation | `src/app-shell.js`, `src/screen-routes.js`, 30 contract routes | Older `src/navigation.js`, separate profile stats | Current UI shell wins; test/port any genuinely missing actions |
| Profile | `src/game-stats.js` and local profiles | `src/profile-stats.js` + `src/progression.js` | Keep real match stats; integrate idempotent XP journal separately |
| Storage | `src/storage.js` with fallback/flush, recovery views | Prior storage flush/retry/XP additions | Reconcile atomicity and multi-tab behavior; never replace whole file |
| Data/privacy | `src/screen-routes.js` privacy/export/recovery/update | `src/privacy-data.js`, `public/_headers` | Reuse hardening only if behavior/test parity proven |
| Bot/learning | Offline bot and initial exercises | Time/node-budget bot and 12-lesson/30-puzzle checks | Re-run and port validator and bounded search safeguards |
| PvP | HTTP polling and `server/match.js`, no server resign | `applyResign` and `tests/pvp-resignation.test.js` | Port isolated protocol/server behavior, test seat/version/auth |
| Android | No `capacitor.config.json` or Android workflow in PR #1 | Capacitor, debug and ephemeral signing workflows | Separate native integration and physical QA |
| Copyright/art | Original `public/brand` SVG family and existing `public/chess-assets` WebP | Earlier styling | Original SVG existence != ownership proof for earlier WebP; review before commercial release |
| Test shape | 42 green unit tests + Chromium | Stacked test suites not in latest PR #1 | Add missing tests without deleting current smoke tests |

The presence or absence of a particular file is **source evidence**, not proof of all feature behavior. Match/3D/permissions/storage need separate runtime acceptance. Specific file SHA comparisons were made between PR #1 and stacked PR #10 for high-risk paths; exhaustive line-by-line review of all 97 PR #1 files and 602 original task IDs **has not** been performed.

## 5. 30 screen contracts — current truth

`docs/V3_SCREEN_IMPLEMENTATION_MATRIX.md` at this frozen SHA is the canonical contract-to-file map. All **SCR-00..SCR-29 have some implementation evidence** and **all 30 are PARTIAL**; **zero** have full physical-device/human/accessibility/legal final acceptance.

| Screens | Current scope | Still requires |
|---|---|---|
| SCR-00..02 | Splash, guest onboarding, tutorial, storage fallback | Android cold start, denied-storage migration, real TalkBack |
| SCR-03..06 | Home, Play, setup, VS | Device-approved premium layout, safe areas, exact mode behavior |
| SCR-07..10 | Chessboard, promotion, menu, pause | Full FIDE/clock/background/3D accessibility edge cases |
| SCR-11..13 | Result, review, history | Reliable endgame attribution, huge-history/recovery/PGN |
| SCR-14..19 | Learn/lessons/puzzles/results/daily | Human-curated legal content, alternate solution graphs, daily clock policy |
| SCR-20..23 | Profile, progress, achievements, appearance | Event-backed rewards, licensed art, live theme parity |
| SCR-24..29 | Settings, data/privacy, transfer, recovery, PWA update, About | Real-world storage faults, privacy/terms, updater lifecycle, support notices |

## 6. The 23 v3 release gates — no inflated pass claims

Source: PR #9 `docs/CH01_V3_RELEASE_GATES_EVIDENCE.md` + latest PR #1 acceptance matrix. These are release-governance categories, not 23 completed gates.

| Group | Gates | Current disposition |
|---|---|---|
| Product/brand/design | G0, G1, G2 | PARTIAL/BLOCKED — formal contract, original art rights, 30-screen approval |
| Build/architecture/chess | G3, G4, G5, G6 | PARTIAL — owner-signed Android, TS ADR, perft/differential rules, race/idempotency |
| Storage/gameplay/AI | G7, G8, G9, G10, G11, G12 | PARTIAL — durable storage/device/clock/engine/content/backup tests |
| PWA/device/security/QA | G13, G14, G15, G16 | PARTIAL/BLOCKED — deployment, physical Android, legal/security, measured performance |
| Rollout/operations | G17, G18, G19 | PARTIAL/BLOCKED — current preview, Play Console/closed test, signed release/rollback |
| Future modules | G20-P2, G21-P2, G22-P3 | DEFERRED/PARTIAL — verified advanced analysis, ads consent, authoritative full PvP |

**No gate has final release signoff.** Full 23-row evidence and independent acceptance still required before release.

## 7. Priority integration plan (next engineering milestones; not yet executed)

1. **Freeze** this baseline and assert new PR #1 HEAD before each edit. Keep existing 42 green tests and functional UI. Do not rewrite all JS to React/TS without an explicit architecture ADR and migration proof.
2. **M-02A:** reconcile older PR #2/#9 UI/test behavior with current `app-shell` and 30 routes; complete a measurable 320–768px + landscape + accessibility matrix without old shell overwrite.
3. **M-02B:** port missing **isolated** progress, bounded bot and learning-validator behavior (#5/#8) into current code behind tests. Preserve once-only XP and no invented Elo.
4. **M-02C:** port missing privacy headers (#6), durable storage and recovery tests (#3), support/update semantics without replacing new `storage.js` or PWA lifecycle. Add explicit interrupted-write/quota tests.
5. **M-02D:** integrate server-side authenticated resignation (#10) with correct seat tokens, version and clock adjudication; keep private PvP experimental and separate from M0 offline acceptance.
6. **M-02E:** integrate Capacitor/debug and signing CI (#4/#7) on current Vite output without storing keystores in Git. Actual Android release remains blocked on owner identity, permanent upload key and physical-device tests.
7. Independently validate original WebP artwork/license, 3D memory/performance, public privacy/support/terms, real Cloudflare preview, reconnect/load/rate-limits, browser-PWA update, physical Android TalkBack.
8. Use the owner-provided `Chess_Execution_Tracker_v3.xlsx` (602 rows) now inventoried separately. Link each immutable task ID to file/test/CI and product acceptance; verify per row before changing any original planning status. The source workbook is private and was not uploaded into this public repository.

## 8. Risk register / no-regression guardrails

| Risk | Severity | Required control |
|---|---|---|
| Stacked PR #2 mergeability=false; all nine old branches diverged | P0 integration | No auto-merge, overwrite or force-push. Reconcile targeted hunks and run integrated CI |
| 602 task tracker not available in audited repo snapshot | P0 traceability | Import original untouched ledger; no synthetic task closures |
| PR #1 vs v3 React/TypeScript contract | P1 architectural | Record explicit ADR; preserve working JS core until tested transition |
| `PUBLIC` GitHub despite proprietary npm metadata | P1 IP/commercial | Owner visibility/IP decision; don't misrepresent as private |
| Earlier WebP artworks without complete commercial provenance | P0 release | Legal source evidence or licensed replacements |
| Android ephemeral CI key instead of production owner key | P0 store release | No store publication claim, no key committed |
| Browser test != low-memory device/TalkBack | P0 acceptance | Device/browser matrix and evidence |
| Experimental PvP HTTP polling/reconnect/abuse | P1 optional network | Real two-device/staging tests, quotas, auth and idempotency |
| Node 20 action deprecation warning | P2 maintenance | Update Actions majors on separately tested workflow PR |

## 9. M-01 handoff acceptance

- [x] Live repository identity, visibility, base and PR #1 HEAD rechecked.
- [x] PR #1..#10 open/draft metadata/base/head verified, graph divergence measured.
- [x] Exact PR #1 HEAD CI verified; prior Android signing/debug CI distinguished from canonical branch.
- [x] Selected high-risk files and presence/absence compared across canonical and stacked heads; integration decisions documented.
- [x] All SCR-00..29 and G0..22 linked to existing ledgers without pretending release complete.
- [x] Safe next-step integration order written; no user-facing gameplay files changed by this audit.
- [x] All **602 immutable task IDs** inventoried from owner Library's v3 tracker; **418 v2 preserved / 184 v3 refinement**. Separate local evidence overlay produced with **506 keyword-linked candidate hints / 96 unmapped hints** (hints are NOT verified acceptance).
- [ ] All 602 rows individually **accepted** against pinned source, tests, UX and gate criteria — **NOT COMPLETE**; no row was promoted to VERIFIED by this audit.
- [ ] Full code-level/security review, physically measured devices, legal approval — not M-01 source-baseline evidence.

**M-01 repository/branch reconciliation, original 602-ID inventory and candidate evidence mapping are ready for review. Individual task acceptance, implementation integration, release signoff and final UI quality remain open.**

**Private spreadsheet evidence:** The owner Library source `Chess_Execution_Tracker_v3.xlsx` was inspected (seven original tabs; `Tasks!A1:Q603`). A separate owner-downloadable `.xlsx` evidence overlay was generated without modifying the original task status or committing internal planning text into this PUBLIC GitHub repository. This workbook is not available as a GitHub source file. Candidate evidence links are automated heuristics requiring human/code acceptance; they cannot be treated as test results.
