# GC-B01-T05 — Architecture Decision Record (ADR-026)
**Tag:** \`GC-B01-T05\` · **Master:** \`GC-MASTER-EXEC-v1.0\` · **Decision:** **ACCEPT / RETAIN VITE + JAVASCRIPT ESM** · **Date:** 2026-11-22  
**Pinned source before task:** \`b9126162357e0ab21ebcded8915dfe35cbba568c\` on \`integration/global-chess-v3\`  
**Approver classification:** source-grounded engineering architecture decision in response to \`START GC-B01-T05\`; **not** an independent GitHub human-review signature.  
**Task boundary:** architecture decision, reproducible migration proof-of-concept, source/CI compatibility guardrails. **No React rewrite, live deployment, Android binary release or stored-game migration.**

## 1. Actual decision to be made (original Master task 01.05)

> Resolve whether to retain Vite/JavaScript ESM now and plan progressive typing, or migrate to React/TypeScript. Assess reliability, app-size, downtime, portability, build cost and risks; do not rewrite for aesthetics. Must pass: ADR choice, tested migration path if any, API ownership and compatibility guardrails.

**Decision: retain the existing Vite 8 / JavaScript ESM client, use TypeScript-compatible JSDoc as the first incremental typing strategy, and do not adopt React now.** React + TypeScript is **not prohibited forever**: reopen this ADR only on demonstrated necessity and a quantified proof of improvement with migration/regression budgets. Types and React are separate choices; TypeScript does not require React.

The owner-approved [T04 MVP scope](GC-B01-T04_SCOPE_LOCK_2026-11-22.md) remains in force: M0 offline → M1 Web/PWA → M2 separate Android → M3 analysis/coaching → M4 optional ads off → M5 public online. No new backend/account/network requirement is introduced by the architecture decision.

## 2. Source inventory — exact source and runtime responsibilities

| Boundary | Pinned module(s) | Single-source contract and authority |
|---|---|---|
| Browser entry/UI controller | \`index.html\` → \`src/main.js\` | ESM entry; match state controller and user actions. Never authoritative for online seat validation |
| Screens and navigation | \`src/app-shell.js\`, \`src/screen-routes.js\`, CSS | UI adapters; may use DOM; must not duplicate game rules |
| Chess domain | \`src/game.js\`, \`src/clock.js\`, \`chess.js\` | Shared pure rules and clocks; client and server both import these modules |
| Local save and progress | \`src/storage.js\`, \`src/session-exit.js\`, \`src/backup.js\`, \`src/progression.js\` | IndexedDB with fallback/conflict management; versioned local data and once-only progress; never bypass safe writes |
| Offline computer & educational | \`src/computer.js\`, \`src/bot.js\`, \`src/learning.js\` | Deterministic legal/validated local behavior; don't invent Elo or engine scores |
| 2D/3D presentation | \`src/piece-art.js\`, lazy \`src/board3d.js\`, theme files | Rendering adapters read shared position; Babylon/Havok is opt-in, not necessary for basic gameplay |
| Online client transport | \`src/online.js\` | Invite/seat credential, request/rejoin/reconnect; **not** authoritative match logic |
| Online server domain | \`server/match.js\` | Uses \`../src/game.js\` and \`../src/clock.js\`; server checks moves/clock/outcome/version; no DOM/UI imports |
| Online Worker/DO | \`server/worker.js\`, \`server/cloudflare-worker.js\` | Requests, rate limiting, Durable Object storage/credentials and server authority; cannot trust browser moves |
| Web build, PWA | \`vite.config.js\`, \`public/_headers\`, \`scripts/check-bundle-budget.js\` | \`vite build\` → \`dist\`, SW generation/update, CSP, original art and 3D budget |
| Cloudflare staging target | \`wrangler.jsonc\` | \`server/cloudflare-worker.js\`, assets \`./dist\`, \`/api/*\` Worker-first, ROOM binding and rate limiter; actual hosted production unverified |
| Android native wrapper | \`capacitor.config.json\`, \`src/native-lifecycle.js\` | Capacitor consumes **same** \`dist\` with native Back/background App plugin; Android signing/store separate release gate |

**Existing verified package:** ESM \`package.json\` version 1.0.0, \`vite:^8.3.8\`, \`chess.js:^1.4.0\`, \`@babylonjs/core:^9.37.0\`, \`@babylonjs/havok:^1.3.14\`, \`wrangler:4.166.0\` dev; no \`react\`, \`react-dom\` or \`typescript\` dependency. Runtime dependencies retain package lock; **T05 adds no external packages.**

## 3. Alternatives, measured vs unmeasured tradeoffs

| Criterion | A: Retain Vite/JS ESM (SELECTED) | B: Incrementally typed ESM (LATER ADOPTION) | C: React/TypeScript UI rewrite (REJECT NOW) |
|---|---|---|---|
| Reliability | Current complete 98/98 suite + browser, save/3D/PWA/Workers proof; preserves observed code | Potential type coverage, requires gradual pilots and runtime regression checks; typing alone doesn't prove correctness | Rewrites event/state/DOM/view ownership and may introduce save/lifecycle regressions; no tested parity |
| App size | **Measured current** output below; same runtime modules | JS JSDoc only: no TypeScript shipped; TS modules compiled to JS need size measurement | Extra framework runtime/build transform unknown; **no measured React delta**. Do not invent savings or overhead |
| Downtime and upgrade | No migration or schema change in T05; production deploy currently unverified | Keep SW/schema/storage compatibility per changed module, stage carefully | Requires large simultaneous cutover; production downtime **not measured**, but service worker + save lifecycle risk increases |
| Web/PWA portability | Existing Vite service worker and assets already built | Compatible with Vite \`allowJs\`, \`checkJs\`, \`tsc --noEmit\` in isolated future check | Requires full UI renderer migration and all 30 screen contracts acceptance |
| Android portability | Existing Capacitor reads \`dist\` and App plugin; no rewrite | Same \`dist\` if output/tests remain identical; real-device verification later | Capacitor supports modern JS generally, but different UI lifecycle not tested on current Android |
| Cloudflare/Workers | Existing server imports \`src/game.js\` and \`src/clock.js\` | Typed shared ports can retain same compiled JS import semantics | React UI should not enter Worker server; avoid bundling DOM/runtime into DO |
| Build/CI cost | **Measured baseline build 1.42 s** on GitHub runner, CI suite complete | Extra compiler/check time is unmeasured until toolchain pinned; no paid service required | Rewrite cost, UI smoke fixes and JS bundle differences are **unmeasured** |
| Security and support | Existing trusted server moves; no new hosted identity | Type checks must never be treated as validation/authorization, preserve runtime input guards | Event/state changes increase audit surface; not inherently more secure |

**Source CI baseline:** canonical exact-head run [#45033713460](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/actions/runs/45033713460), **SUCCESS** on \`b9126162357e0ab21ebcded8915dfe35cbba568c\`. 98/98 Node tests; Chromium 2D/3D/render/underpromotion; local two-seat Workers/resign; offline/PWA/art checks. Vite output (raw / gzip where reported):

- \`dist/assets/index-Bajv8y_3.js\`: **146.42 kB / 49.02 kB gzip**.
- Optional \`dist/assets/board3d-dbtlCpRO.js\`: **1,114.38 kB / 267.39 kB gzip**.
- CSS \`dist/assets/index-Dsy59DO1.css\`: **79.56 kB / 17.33 kB gzip**.
- Build \`✓ built in 1.42s\`, optional 3D raw budget **1,114,381 / 1,800,000 bytes**. These are bundle metrics, **not** network latency, first meaningful paint, battery drain, Android install size, or actual device FPS.
- No React benchmark was performed. No A/B claim of React speed, size, downtime, build-cost benefit or harm is made.

## 4. Tested incremental typing pilot — isolated, no app code altered

**Pilot input:** independently transcribed same domain algorithm from [\`src/clock.js\`](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/blob/b9126162357e0ab21ebcded8915dfe35cbba568c/src/clock.js), exact baseline Git blob \`1e36967c2623e0fb3f4d25ad100332b5c494c34b\`. Not checked into \`src/\`; this proof does **not** pretend the app has been converted to TS.

**Local test tool:** TypeScript **5.8.3** available on audit runtime (global \`tsc\`, not installed to repository). A temporary typed clock copy retained the existing API, added \`// @ts-check\` and JSDoc \`Preset\`, \`Side\`, \`Clock\` plus narrow guard \`typeof duration === 'number' && Number.isFinite(duration)\`. The guard is behavior-equivalent for currently supported \`untimed\`, \`quick\`, \`classic\` presets.

**Executed commands:**

\`\`\`bash
tsc --allowJs --checkJs --noEmit --strict --module ESNext \
  --moduleResolution bundler --target ES2022 --skipLibCheck clock.mjs

node --test compat.test.mjs

# Deliberately invalid consumer; compilation must FAIL with TS2345
tsc --allowJs --checkJs --noEmit --strict --module ESNext \
  --moduleResolution bundler --target ES2022 --skipLibCheck clock.mjs bad.mjs
\`\`\`

**Observed:**
- Strict type check: exit 0.
- Representative behavior parity Node test: **1/1 passed** (export API, modes, clock elapse and validation samples).
- Negative consumer \`startClock('ultra-fast')\`: rejected with **TS2345**. Thus the pilot proves a *real type diagnostic* rather than syntax-only JSDoc.
- Limitations: only isolated clock domain, representative vectors, *not* a full app compiler run; TypeScript 5.8.3 is **not pinned in the repo** and this prototype does not constitute a reproducible CI type-check gate. All original source stays JS and no package lock changes.

**Approved staged adoption strategy (no premature rewrite):**
1. Keep current JS runtime in \`src/\`. Prefer pure domain modules (\`clock.js\`, result policy), define explicit \`Clock\`/\`MoveCommand\`/\`GameState\` shape in JSDoc/typed port contracts with existing unit-test fixtures.
2. Only in a future separately scoped task/PR: pin a compatible \`typescript\` version as **devDependency**, commit refreshed lockfile, add \`tsconfig.typecheck.json\` with \`allowJs: true\`, \`checkJs: true\` scoped to selected modules, \`noEmit: true\` and strict target; use \`npm ci\` and \`npm run typecheck\` in CI. Never use \`npx\` unpinned downloads.
3. Expand incrementally (domain → storage adapters → Worker protocols → UI controller). Each step must preserve browser/Worker import paths and serialized event/save formats. Do not enable \`checkJs\` for the entire legacy codebase in one unreviewed change.
4. Convert \`.js\` to \`.ts\` **only** in isolated modules when imports, Web/Worker build, Android Capacitor, storage/replay/PWA update, tests and bundle budget all pass. Introduce React only under separately reviewed new ADR, UI tests and measurable benefit evidence.
5. Every iteration: prior/current exact SHA, bundle-size comparison, 2D/3D/Workers smoke, IndexedDB rescue and native regression relevant to touched code. A compiled TS module does not make an on-device engine automatically more correct.

Official references: TypeScript [allowJs](https://www.typescriptlang.org/tsconfig/allowJs.html), [checkJs](https://www.typescriptlang.org/tsconfig/checkJs.html); Vite [TS transpiles but does not type-check](https://vite.dev/guide/features.html); Capacitor [modern JavaScript app compatibility](https://capacitorjs.com/docs/getting-started); Cloudflare [Workers with Static Assets](https://developers.cloudflare.com/workers/static-assets/).

## 5. Executable architecture boundaries added in T05

\`scripts/check-architecture-contract.mjs\` (**zero new dependencies**) rejects:
- Accidental non-ESM/package build changes or \`react\`, \`react-dom\`, \`@vitejs/plugin-react\` introduction without updated decision;
- Client/Worker no longer importing identical \`src/game.js\` and \`src/clock.js\`, or shared domain accidentally depending on DOM/localStorage UI adapters;
- Wrong browser ESM entry, Worker bootstrap and room-binding/rate-limit wiring;
- Cloudflare \`dist\` Static Assets with \`/api/*\` Worker-first route removed;
- Android Capacitor consuming anything other than \`dist\` or silently dropping App lifecycle bridge;
- Existing Vite offline/PWA service worker generation removed.

**CLI:** \`npm run check:architecture\`. **CI:** new step after syntax before \`npm test\` in \`.github/workflows/verify.yml\`. Node test file \`tests/architecture-contract.test.js\` checks baseline and deliberately injected bad React, browser-DB coupling, server domain import, platform path and malformed JSONC config.

This is a **source-level guard, not a semantic proof**. It does not assert tested protection against all dynamic imports, JavaScript alias resolution, server security faults or real-device compatibility. Existing 98+ regression, PWA/bundle/browser/Workers checks remain mandatory. Intentional future architecture updates must revise the guard together with ADR and passing tests, not bypass CI.

## 6. API/contract ownership and change control

- **Domain/Rules owner:** \`src/game.js\` + \`src/clock.js\` + \`chess.js\`, both app and server. Public functions \`restoreGame\`, \`serializeGame\`, \`result\`, \`claimableDraw\`, \`intendedDraw\`, \`startClock\`, \`remainingClock\`, \`validClock\` are consumed by adapters; changes require cross-runtime fixtures. Client cannot modify authoritative online results.
- **Controller/UI owner:** \`src/main.js\` and \`src/app-shell.js\`, \`src/screen-routes.js\`; no duplicate domain moves, no dynamic top-level network requirement, accessible keyboard/Android Back, no fake unlocks.
- **Storage/data owner:** \`src/storage.js\`, \`src/backup.js\`, \`src/progression.js\`; existing versioned saves and durable transaction/anti-stale-tab conflict preserved. \`GC-B01-T06\` will separately formalize version IDs and identity/sync policies; **T05 does not invent new schema or change existing persisted bytes**.
- **Online authority owner:** \`server/match.js\`, \`server/worker.js\`; only server validates seat/version/move/clock. \`src/online.js\` is a transport adapter. New social/ranked functionality is separately gated by M5 and B05.
- **Platform owner:** \`vite.config.js\`, \`wrangler.jsonc\`, \`capacitor.config.json\`, \`src/native-lifecycle.js\`; web static and native consume same build. Never silently ship a stale PWA while local data migrations change. Keep optional native packages behind capability check.
- **Art/3D owner:** \`src/board3d.js\` + original SVG family. Lazy optional 3D; no bundling Babylon into 2D critical path without measured performance signoff.
- **Compatibility and review owner:** architecture ADR + programmatic gate tests + T08 regression baseline + B10 independent final device/platform QA. Type annotations are not runtime sanitization.

### Performance and portability budgets

1. Existing 3D chunk 1.8 MB raw budget remains a mandatory blocker unless a separate task explicitly revises it with measured device evidence.
2. Compare JavaScript entry and optional 3D bundle **raw and gzip** against pinned baseline when changing UI libraries or type transform pipeline; do not assert a specific delta without running the build.
3. No new network backend, cloud profile or paid SKU is authorized by architecture alone. M0–M2 must work guest/offline on supported installed devices.
4. Source boundary test and CI checks run on exact PR HEAD. A green workflow from a different SHA or before a final ledger edit is not acceptable closure evidence.

## 7. React/TypeScript rewrite reconsideration triggers (none demonstrated yet)

A new \`ADR-026-v2\` + explicitly owner-approved task is required if:
- a measured bug/regression trend proves current UI state lifecycle is unsupportable despite local refactor;
- a realistic 30-screen proof-of-concept demonstrates measurable reliability/performance/accessibility improvement;
- real Android cold-start/back/storage and slow-device profiling shows no critical regressions;
- API boundary, IndexedDB migration and server-authoritative move contracts remain stable;
- bundle/build comparisons, dedicated release QA and rollback are funded/proven.

No React architecture work is implicitly approved by prior screenshot references or this ADR.

## 8. Risk, rollback and exact task closure

| Risk | Severity | Mitigation / exit |
|---|---|---|
| TypeScript checker only in local pilot | KNOWN LIMITATION | Separate pinned-toolchain PR required before claiming app-wide static typing |
| Vite bundling warns optional 3D chunk >500 kB | KNOWN BUILD WARNING | Existing explicit 1.8 MB budget passes; lower-end device FPS/thermal still not certified |
| Shared game rules couple Client and Worker | CRITICAL BOUNDARY | New architecture guard + existing cross-runtime tests, keep server authoritative |
| Browser storage compatibility | CRITICAL | No schema/serial format modified in T05; any future migration needs T06/T08 test |
| React rewrite scope creep | HIGH | Reject new runtime dependency until new ADR, measured benchmarks and owner review |
| T03 governance | EXTERNAL BLOCKER | Canonical protected, but \`main\` remains unprotected; T03 NOT DONE, B01-GATE NO_GO |
| Actual deployment | UNVERIFIED | Do not claim any hosting, Play APK release, runtime performance or live multiplayer |

**Rollback:** If guard produces a false positive, use a new bounded PR with a reviewed fix; do not disable architecture check globally. If CI/regressions fail after merge, revert the T05 squash commit with a new PR to protected canonical, preserving app code and all saves. No production deployment, database, credentials, ads or Android signing is part of T05.

**Task-specific DoD:**
- [x] Compared maintain-current / incremental typing / full React migration using live source and actual CI measurements.
- [x] Chose **Vite/ESM now**, not a React rewrite for aesthetic reasons.
- [x] Conducted isolated TS 5.8.3 typecheck + behavior parity + negative diagnostic pilot (NOT in app).
- [x] Recorded API boundaries, data-safety invariants, React reconsideration criteria and rollback.
- [x] Added executable architecture guard and negative test cases; wired CI as a PR change.
- [ ] **Final task PR exact-head CI must PASS; protected canonical merge and post-merge confirmation required before marking DONE.**

**Task state at preparation:** \`IMPLEMENTED_UNVERIFIED\` — architecture decision authored and guard written, final exact-head CI/merge pending. \`GC-B01-T03\` unresolved due to main protection, **explicit planning exception only** from user \`START GC-B01-T05\`; \`GC-B01-GATE = NOT_ELIGIBLE\`. **Do not start T06**.
