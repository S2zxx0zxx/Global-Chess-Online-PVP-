# CH-01 v3 — Release Gate Evidence, 19 Nov 2026

**Source of truth:** Chess_Final_Production_Ready_Planning_Pack_v3_2026-11-18.zip
(`trackers/Release_Gates_v3.csv`, `trackers/Chess_Execution_Ledger_v3.csv`,
`docs/11_TEST_STRATEGY_AND_FIXTURES.md`, `docs/12_RELEASE_GO_TO_MARKET_FINANCE.md`).

This is an **evidence-based progress audit**, not a claim that 602 original tasks have been signed off.
The ZIP tracker initially has 602 NOT_STARTED task rows. Independent row-by-row evidence
reconciliation is still required; code additions do not retroactively change those rows to VERIFIED.

## Verified engineering evidence so far

- PR #1: rules/gameplay/local bot/2D/opt-in Babylon 3D/Cloudflare private room/PWA base;
  27 foundation tests and Chromium smoke. **GitHub currently reports mergeable_state=dirty**
  against main; this must be resolved using the actual conflicting files.
- PR #2: mobile v3 Home/Play/Learn/Profile/Match, offline side selection, playable board,
  clocks, coaching, resign/result, 320/360/412px Chromium, 34 tests.
- PR #3: IndexedDB flush and abort retry, real browser save→full reload→resume, 36 tests.
- PR #4: Capacitor 8.6.2 Android API 36 DEBUG APK built in CI; **not a production AAB**.
- PR #5: migrated offline XP events, duplicate prevention, real achievements, 40 tests.
- PR #6: local privacy export/delete, PWA worker waiting update and CSP headers, 42 tests.
- PR #7: Android release AAB script/workflows, CI disposable-key test-signing succeeded;
  **not owner upload signing or Play approval**.
- PR #8: bounded bot search and 12-lesson/30-puzzle legal move audit, 44 tests and source checksums.
- PR #9: extended visual-responsive/landscape/accessibility smoke tests (latest CI pending).

All PRs above are **stacked draft branches**, not release/published changes.

## Original gate IDs, no guessed completion

| Gate | Original ZIP criterion | Current evidence-backed status | What still blocks VERIFIED |
|---|---|---|---|
| G0 | Charter + non-goals + ADR preflight | PARTIAL | Approved formal product/brand release sign-off |
| G1 | Brand and content licensing | BLOCKED | Trademark, original art proofs, third-party legal notices |
| G2 | Requirement/UX/design freeze | PARTIAL | 30-screen visual acceptance, 602 task traceability |
| G3 | Reproducible Web+Android build | PARTIAL | Permanent-ID signed release AAB and real devices |
| G4 | Clean architecture ports | PARTIAL | Shared TS/controller contracts, browser/native parity |
| G5 | Chess rules and FIDE-like policy | PARTIAL | Full independent perft/differential chess-rule fixtures |
| G6 | Game controller/concurrency | PARTIAL | Intent/version dedupe, multitab and race regressions |
| G7 | Safe local storage and migrations | PARTIAL | IndexedDB recovery positive; crash/SQLite/corrupt multi-tab QA |
| G8 | Accessible playable board | PARTIAL | Chromium keyboard/mobile; physical TalkBack/200%/touch matrix |
| G9 | Clock/result policy | PARTIAL | Unit clock+resignation; real device lifecycle and online timeout |
| G10 | Bounded AI Worker | PARTIAL | Deadline/node guards; real weak-device latency and benchmark |
| G11 | Validated lessons and puzzles | PARTIAL | 12+30 legal checks; human copy, motif/difficulty/source-license audit |
| G12 | History/PGN/JSON recovery | PARTIAL | Existing backup/replay; fuzz import, deletion, atomic all-data restore |
| G13 | PWA offline and static deploy | PARTIAL | SW smoke; actual offline cache/update rollback/Cloudflare preview |
| G14 | Android device lifecycle | BLOCKED | Real phone process-kill, Back, rotation, TalkBack, low-memory QA |
| G15 | Security/privacy/license | BLOCKED | Exact legal/operator identity, public notices, scans/CSP live verification |
| G16 | System QA and performance | BLOCKED | Full 60 scenario matrix, p95 FPS/CPU/battery, fuzz/load tests |
| G17 | Real public Web beta | PARTIAL | Old Cloudflare Worker reachable; new candidate not independently deployed/accepted |
| G18 | Play Console/closed-testing approval | BLOCKED | Account, tester eligibility, time-based closed test, app identity/store |
| G19 | Production release and ops | BLOCKED | Signed approved AAB, key custody, rollout, support/on-call and rollback |
| G20-P2 | Verified strong analysis | DEFERRED (optional) | Licensed validated engine, analysis, Mistake-to-Mission evidence |
| G21-P2 | Ad consent and SDK release | DEFERRED (optional) | Later permission/consent/network policy; no ads in M0–M2 |
| G22-P3 | Authoritative online multiplayer approval | PARTIAL (optional) | WS/matchmaking/ratings/anti-cheat and real server load test |

No gate above has a human-approved full release **VERIFIED** sign-off.

## P0 integration

PR #1 against main: GitHub API `mergeable_state: dirty`. Do **not** merge
a conflicting base PR or force-push blindly. Identify exact conflict changes,
resolve while preserving both sides, then rerun tests on the integrated
commit. Stacked PRs must be integrated in dependency order and individually
reviewed before public deployment.

## External requirements that cannot be bypassed by code

- Final legal public name/app ID, signed ownership/source rights and privacy/support contact.
- Private upload keystore (never invent or generate and silently adopt).
- Paid Play Console registration where applicable; real-device manual tests.
- If applicable to an account created after 13 Nov 2023, **12 continuous opted-in
  testers for 14 days**, then Google Play production access/application.
- Authoritative realtime PvP cannot be certified by in-memory tests:
  requires deployed Durable Object preview and independently measured network load/abuse.
- A green CI is not an accessibility, security, legal or financial release sign-off.

## Source links
- https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/pull/1
- https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/pull/2
- https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/pull/3
- https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/pull/4
- https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/pull/5
- https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/pull/6
- https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/pull/7
- https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/pull/8
