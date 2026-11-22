# GC-B01-T08 — Reproducible Regression Baseline Freeze

**Master task:** `GC-B01-T08` · **Date:** 2026-11-22 · **Source:** protected `integration/global-chess-v3` at `3389c3f3cb3b7bd3235a47e80817cb0d44591574` (after T07 merge and post-merge CI attempt 2).  
**Scope:** Guard previously working game behavior across chess, safe local saves, original assets, learning/XP, PWA/updates, private-room server authority, Android debug/signing, and privacy/security. This is not a production Play release or claim of 602 verified source tasks.

## 1. Evidence and known limitation

- T07 PR [#27](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/pull/27) merged to exact source SHA `3389c3f3cb3b7bd3235a47e80817cb0d44591574`.
- [T07 canonical CI #45039455255](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/actions/runs/45039455255) **attempt 1 failed** intermittently with `Timed out waiting for browser state` after Browser Back. Same commit **attempt 2 passed**, **125/125 Node tests**, browser 2D/3D/promotion, PWA and local Workers. One successful retry does **not** prove the intermittent race is eliminated.
- The browser smoke's `openPromotion()` previously sent eight legal pairs of clicks inside one `Runtime.evaluate` without awaiting each rendered move. On slow CI, the next input could race the board's render; this is a plausible cause, **not proven root cause**, of the nondiagnostic timeout. T08 changes **test interaction only** to wait for the board's `.last-destination` marker after each clicked move, and to label the timeout stage. Real production move logic and saved game formats are untouched.
- If the same timeout recurs, retain the failure evidence and repeat on the exact head; record as an unresolved intermittent blocker, do not simply hide it with longer sleep or mark it fixed without evidence.

## 2. Locked regression matrix

The machine-readable source of truth is [`GC-B01-T08_REGRESSION_BASELINE.v1.json`](GC-B01-T08_REGRESSION_BASELINE.v1.json), checked by `node scripts/check-regression-baseline.mjs` and `tests/regression-baseline.test.js`.

| Gate | Required coverage | Scope boundary |
|---|---|---|
| **Legal chess / results** | `game.test.js`, `m03-gameplay-regression.test.js`, `mate-solver.test.js`, `physics.test.js` | Standard rules/outcomes and promotion; no fabricated engine accuracy |
| **Computer & clocks** | `computer.test.js`, `bot-budget.test.js`, `game.test.js` | Local bounded computer, pause/cancel; Android battery/device not independently measured |
| **Persistence, history, restore** | `backup.test.js`, `storage-fallback.test.js`, `history-mutation.test.js`, `session-exit.test.js`, `data-identity-contract.test.js` | No data migration, current v1/v2 bytes preserved |
| **Learning, puzzles, XP** | `progression.test.js`, `learning.test.js`, learning-pack validator | Local XP once-only; no global Elo or monetary rewards |
| **Private Workers PvP** | `online-match.test.js`, `pvp-resignation.test.js`, `room.test.js`, `smoke-local-rooms.mjs` | Local Workers two-seat authority, not globally deployed public/ranked PvP |
| **Original 2D/3D art** | `original-art.test.js`, `appearance.test.js`, `physics.test.js`, original-art verifier and 1.8MB 3D budget | Source provenance and additional device/license acceptance separate |
| **PWA and offline updates** | `pwa-update-contract.test.js`, `session-exit.test.js`, browser Chromium and WASM/offline smoke | No mid-game forced reload |
| **Android native** | `native-lifecycle.test.js`, debug APK workflow, disposable-key AAB workflow | No physical-device QA, no owner Play signing, no production launch |
| **Security, privacy** | Room/auth, data-contract, feedback tests, CSP, original-art review | No penetration test, policy/legal approval or hosted service assurance |
| **Original source tracking** | `task-source-ledger.test.js`, `architecture-contract.test.js`, `verify-source-tracker.mjs`, `check-architecture-contract.mjs` | 602/602 source ID inventory, **0** source-row acceptance independently certified |

## 3. CI enforcement and change controls

**Core (on PR and protected canonical push):** exact locked dependency install, syntax, architecture, source inventory fingerprint, T08 regression contract, every Node test, PWA build, original art, puzzles, 3D chunk budget, Chromium rendered gameplay/reload/promotions/PWA update/offline, WASM and local Worker real two-seat/resign/CSP.

**Android debug and ephemeral signing:** both PR workflows now run `npm ci`, architecture/source inventory/regression commands and `npm test` before SDK 36 build. Android debug APK and disposable CI test-signing AAB must be identified as **non-production**, with no permanent key, store listing or real user approvals. The production signing workflow remains **manual workflow_dispatch only**, protected `android-production-approval` environment and required external secrets.

**Guard limitation:** static CI/source checks help prevent deletion of commands/tests but cannot prove tests are sufficiently deep, prevent clever malicious build logic, or replace physical-device/browser/manual QA. No blanket 30-screen final acceptance or full 602-task completion is claimed.

## 4. Exactly what changed, and what did not

T08 changes a **test-only** browser progression, a test-gate script and 9 negative/positive tests, a manifest, `package.json` script, **three workflow files** and the execution ledger. No chess state/runtime, PvP server, actual browser UI implementation, mobile app package, database, user saves or Cloudflare deployment is changed. No dependency/lockfile changes or paid service enabled.

The earlier `GC-B01-T07` original source inventory and `GC-B01-T04` signed M0→M5 roadmap are preserved. All 23 original release gates still need their own acceptance. `GC-B01-T03` remains `BLOCKED_EXTERNAL` because `main` is unprotected and the active ruleset covers only `integration/global-chess-v3`; **`GC-B01-GATE = NOT_ELIGIBLE`**.

## 5. Task-specific DoD and evidence handling

- [x] Exact source SHA, prior failure/retry and relevant regression files/workflows inspected.
- [x] Ten non-regression categories and required commands encoded in checked manifest.
- [x] Source and regression gates wired into core and Android build workflows; no production signing automation.
- [x] Targeted browser smoke change acknowledges each legal promotion setup move and labels timeouts.
- [x] Nine negative/positive tests added to prevent accidental removal of critical regression steps.
- [ ] **Final PR-head Core + Android debug + ephemeral signing runs must pass on same exact SHA.**
- [ ] **Protected canonical squash-merge, exact canonical post-merge Core CI and diff/ledger verification required.**
- [ ] **Intermittent Chromium timing stability is not certified by a single green attempt; capture actual repeated-run evidence if possible.**

**Rollback:** Prior canonical baseline `3389c3f3cb3b7bd3235a47e80817cb0d44591574`. Close PR before merge; after merge, revert exact T08 squash in separate reviewed PR and rerun. Never delete user data, force-push, remove required gate wholesale or change production signing without owner approval.

**Owner-directed sequence exception:** Explicit user command `START GC-B01-T07 & START GC-B01-T08 start kro build and merge` permits these two tasks sequentially. It does **not** certify T03, approve B01-GATE, authorize deployment/ads/payments or permit starting B02. Final status is **DONE for regression-gate freeze only** when verified; full game release remains NO_GO.
