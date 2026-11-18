# PR #1 — Release readiness and evidence register

Updated: 2026-11-18. This document is a **snapshot of source review and remaining work**, not a release certification.
Starting audited head: `1e19b05a9b7846541c1d949aad16feb2781998fb`. Subsequent audit commits are shown in PR history.
Target: private/proprietary commercial Global Chess for PWA + Android, preserving zero-account offline play.

## Review scope and evidence

Reviewed: current PR metadata, changed-file inventory, selected source modules and unit-test sources.
No clean `npm ci`, `npm test`, `npm run build`, runtime browser test, Android build, production deployment,
penetration test, or real concurrent-user test has been executed **by this review**. GitHub Actions workflow was
missing at audit start and is now added; its execution/result is an independent, currently unverified gate.
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
- Fail closed when the Cloudflare room-creation rate limiter is missing or throws. Add regression test.
- Keep PR in draft until evidence gates below pass.

## Mandatory outstanding gates

### A. Rules and storage
- [ ] Execute clean install, all unit tests and build on a pinned SHA; retain logs and fixes.
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

1. At HEAD: successful `npm ci --no-audit --no-fund`, `npm test`, `npm run build`,
   `node scripts/prepare-worker-solver.js` and Wasm binary validation.
2. Independent Playwright/mobile browser game sessions: local, computer, 2D, 3D and offline restore.
3. Two authenticated seats in a real Durable Object; illegal move rejection and reconnect test.
4. Android installable artifact + real-device smoke test, if Android is claimed as supported.
5. License/artwork provenance and no unapproved copyleft ingestion.
6. Readiness decision: **do not merge simply because GitHub reports mergeable=true**.

**Status: partially implemented; release blocked by missing independent execution evidence
and unfinished full-stack features.** This is not an acceptance of the larger Work Agent mandate
as complete. Continue in small PRs; do not bypass these gates to obtain a green badge.
