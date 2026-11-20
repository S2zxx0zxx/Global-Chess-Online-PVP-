# PR #1 — Release readiness and evidence register

Updated: 2026-11-18. This document is a **snapshot of source review and remaining work**, not a release certification.
Starting audited head: `1e19b05a9b7846541c1d949aad16feb2781998fb`. Subsequent audit commits are shown in PR history.
Target: private/proprietary commercial Global Chess for PWA + Android, preserving zero-account offline play.

## Review scope and evidence

Reviewed: current PR metadata, changed-file inventory, selected source modules and unit-test sources.
The new [GitHub Actions run #44360880550](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/actions/runs/44360880550)
passed at commit `59cf19fefa8e4775f18222457cca28d9b21f548b`: Node 22 clean dependency install,
syntax, 27/27 unit tests, production PWA build, 3D bundle-budget gate, local-move and 3D-mount
headless Chromium smoke, WASM preflight and offline asset assertions. Browser screenshot artifact
`chess-browser-smoke` was uploaded (artifact #14455700032). This verifies limited hosted browser behavior
**not** real Android, real network PvP, security or production deployment.
An absence of REST commit-status records is **not** proof that Checks API has no checks.

## Confirmed source-level implementation (not a passing-runtime claim)

| Capability | Evidence | Scope limitation |
|---|---|---|
| Chess move legality, state, clocks, claims | `src/game.js`, `src/clock.js`, `server/match.js` | FIDE edge-case differential testing outstanding |
| Offline local, guest, vs computer | `src/main.js`, `src/lobby.js`, `src/computer.js`, `src/bot.js` | Bot is a bounded shallow search, not Stockfish or an LLM |
| 2D and optional 3D | `src/board3d.js`, `src/piece-art.js`, `src/style.css` | GPU/device/performance tests outstanding |
| Offline saves, backup and history | `src/storage.js`, `src/backup.js`, `src/history.js` | Interrupted-write, quota and multi-tab durability not proven |
| Lessons, puzzles, daily exercise | `src/learning.js`, `src/learning-pack.js` | Small bundled exercise sets, not complete adaptive training |
| Mating-possibility checks | `src/mate-solver.js`, `public/solver/cha.wasm.gz` | MIT notice shipped; accuracy and compatibility need runtime proof |
| Private invite rooms | `src/online.js`, `server/worker.js`, `wrangler.jsonc` | HTTP polling, no WebSocket push or broad matchmaking |
| Rate limiting / expiry | `server/worker.js`, `wrangler.jsonc` | Binding/deployment quotas need live verification |
| PWA shell | `vite.config.js`, `public/manifest.webmanifest` | Actual offline install and update acceptance not run |
| Automated test files | `tests/*.test.js` | Source presence != independently passing tests |

## Audit changes made on the PR branch

- Add `.github/workflows/verify.yml`: Node 22 clean install, syntax checks, unit tests, Vite build,
  worker WASM preflight and offline asset check.
- Mark npm package `private: true`, `license: UNLICENSED`; align lockfile. **This does not make GitHub private.**
- Stop making app boot wait for optional browser WASM solver; fallback timeout rules remain.
- Replace Babylon root barrel with documented pure imports and explicit scene/physics/material registration.
  CI output reduced optional 3D JS from **6,388.55 kB to 1,214.78 kB** (gzip 1,427.36 kB to 290.58 kB).
- Enforce a 1,800,000-byte post-build 3D JavaScript limit in `scripts/check-bundle-budget.js`.
- Add headless Chromium test for an actual legal move and 3D/Havok mounting in `scripts/smoke-browser.mjs`.
- Fail closed when the Cloudflare room-creation rate limiter is missing or throws. Add regression test.
- Keep PR in draft until evidence gates below pass.

## Mandatory outstanding gates

### A. Rules and storage
- [x] Pinned-SHA hosted CI clean install, 27/27 automated unit tests, build and WASM preflight:
  [run #44360880550](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/actions/runs/44360880550).
- [ ] Independent local/device verification and any failing new edge-case tests.
- [ ] Differential chess-rule tests: all promotions, castling through check, en passant, pins,
  3-/5-fold repetition, 50-/75-move limits, checkmate priority, time forfeits, wrong clocks.
- [ ] IndexedDB write-failure, quota, incognito and multi-tab concurrency tests; prevent silent save loss.
- [ ] Restore import/export and saved games across version upgrades, no silent data migration.

### B. Experience, learning and engine
- [ ] Verify 2D input, keyboard accessibility, responsive mobile HUD, reduced motion and contrast on devices.
- [ ] Profile Android GPU tiers; optimize Babylon/Havok startup, FPS, memory and disposal.
- [ ] Validate intellectual-property provenance for `public/chess-assets/**` artwork and app branding.
- [ ] Add deterministic computer-worker cancellation, stale message rejection and calibrated difficulty.
- [ ] Commercial engine-license decision: Stockfish/Stockfish.js GPL-3.0 cannot be silently folded into
  a closed-source distributed binary. Existing fallback remains until a compliant engine is selected.
- [ ] Implement engine-backed move review and true Mistake-to-Mission validation with reproducible scores.
- [ ] Import/curate CC0 Lichess puzzle/opening data with provenance, grading, integrity checks and offline pack sizes.
- [ ] Complete premium UI, board effects, audio/haptics and player onboarding without copying other games.

### C. Real-time network and security
- [ ] Replace 2-second polling with an authorized event/WS protocol and correct disconnect/reconnect behavior.
- [ ] Deduplicate commands with stable IDs; replay protection and authoritative move sequence.
- [ ] Handle resign, draw offer/accept, abandonment, room expiration and completed-match retention.
- [ ] Implement optional auth, ranked matchmaking, ratings and anti-cheat policies before rated public play.
- [ ] Audit token leakage, API request amplification, room lifecycle costs, WAF, privacy and abuse controls.
- [ ] Test actual Cloudflare Worker + Durable Objects against a real preview deployment.
- [ ] Run real 2-client games and network shaping; 25 in-memory game instances in unit tests are NOT 50 real clients.

### D. Android, commerce and release
- [ ] Implement Capacitor Android shell; test real devices, pause/resume, rotation and back button.
- [ ] Deliver PWA update recovery, Android icons/maskable images, signed AAB with secret keys outside Git.
- [ ] Integrate opt-in identity/cloud sync and prevent duplicate progress/reward grants.
- [ ] Commerce architecture, verified entitlements, tax/legal/payment compliance and store policy checks;
  do not accept live payments before separate authorization.
- [ ] Complete observability, privacy notices, data export/delete and dependency/SBOM/security audit.
- [ ] Device matrix, accessibility, latency and real load/perf results with measured thresholds.
- [ ] Review all checks, external-artifact evidence, legal readiness and release sign-off before merge/deploy.

## Additional important observations

- The PR description used to say *four tests passed* and that online play was still pending; it was stale.
  Source now contains multiple test files, a polling-based private-room backend and a WASM solver.
- `wrangler.jsonc` describes a `ROOM_CREATION_LIMIT` binding and Durable Objects, but a config file
  does not prove the resources are deployed or remain within free quotas.
- Room state is intentionally subject to a 24-hour lifecycle in current `server/worker.js`;
  completed/rated match retention needs product-specific design.
- Current GitHub repo is PUBLIC. `private: true` is only an npm publish guard.
- No confirmed signed AAB, domain/prod endpoint, real user acceptance or actual 20,000-concurrent capacity.
- Cloudflare/API billing, live checkout and destructive production changes require independent safeguards.

## Minimum evidence required to remove draft

1. CI clean install, 27 tests, PWA build, bundle gate and WASM validation: **verified on
   `59cf19f`**. Re-check against each new release candidate HEAD; never assume earlier checks transfer.
2. One Chromium local-move + 3D mount smoke: **verified on `59cf19f`**.
   Independent multi-device game sessions, Android, offline-restore acceptance and visual review still required.
3. Two authenticated seats in a real Durable Object; illegal move rejection and reconnect test.
4. Android installable artifact + real-device smoke test, if Android is claimed as supported.
5. License/artwork provenance and no unapproved copyleft ingestion.
6. Readiness decision: **do not merge simply because GitHub reports mergeable=true**.

**Status: source-level foundation and narrow hosted CI/browser smoke verified at `59cf19f`;
full release blocked by unfinished full-stack features and missing device/deployed-network/security evidence.** This is not an acceptance of the larger Work Agent mandate
as complete. Continue in small PRs; do not bypass these gates to obtain a green badge.

## 2026-11-20 — v3 mobile-first implementation wave

Source contract: user-supplied `Chess_Final_Production_Ready_Planning_Pack_v3_2026-11-18.zip`,
particularly `docs/03_SCREEN_BY_SCREEN_UX_SPEC.md` and `docs/04_DESIGN_SYSTEM_FOUNDATIONS.md`.
The ZIP contains 602 execution tasks and 30 screen contracts. These source contracts are **not**
automatically satisfied just by implementing an interface shell.

### New working code

- `src/app-shell.js` and `src/app-shell.css`: branded responsive mobile Home, Play,
  Learn and local Profile views; four-tab navigation; mode/setup dialog; original color tokens;
  board-focused match layout; contextual action dock; accessible advanced-tools disclosure.
- `src/main.js`: route existing local game, computer mode and online match updates through shell.
- Optional, skippable first-move tutorial tied to actual legal-move selection.
- `src/board3d.js`: initial shader/texture warm-up to avoid blank WebGL canvas after on-demand rendering.
- `scripts/smoke-browser.mjs`: 360px mobile Chromium navigation checks, legal move,
  actual rendered 3D pixel evidence, screenshots; fails on an undrawn canvas.
- `.github/workflows/verify.yml`: CI uploads mobile Home and 3D screenshots.

### Actual verification

[GitHub Actions run #44743409922](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/actions/runs/44743409922)
passed on commit `99a328c448e0efd7e8c8775bb0966d25b8a18284`: **27/27 Node tests**,
production Vite build, 3D size budget, 360px mobile navigation, local move,
real rendered Babylon/Havok pixels and WASM/offline asset checks.

### Not closed by this wave

This UI shell does **not** implement every v3 screen contract, shared typed React
architecture, full design asset library, signed Capacitor Android app, verified live PvP,
complete profile/reward journal, release-appropriate privacy/terms, analytics or monetization.
Do not count SCR-00–29 as VERIFIED until per-screen tests, screenshot acceptance and
architecture criteria pass. Current repo must not be described as production-ready.

No merge, paid rollout, live payment onboarding or Play Store submission authorized by
this evidence alone.
