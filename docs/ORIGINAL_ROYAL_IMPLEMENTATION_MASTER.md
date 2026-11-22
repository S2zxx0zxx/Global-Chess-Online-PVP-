# Global Chess — Original Royal System Implementation Master v1.0
Date: 2026-11-22
Status: ACTIVE / INCOMPLETE — this document is a source-controlled execution ledger, not production release certification.
Base for this stacked work: `feat/chess-release-integration` (PR #18, observed head `3d9467ada0eaf167eecc52d6c98ed126fa98c98c`).
Target: self-contained commercial PWA + Android Global Chess. Existing source uses Vite/ESM JavaScript and Babylon/Havok. No Unity/C# or proprietary APK code is imported.

## 1. Evidence and reuse boundary
The user supplied a separate game APK for private competitive study. Its Unity static extraction reported 497 Sprite entries, 273 Texture2D entries, 4,181 RectTransform objects, 392 button/toggle objects, 58 serialized button method references, and six level scenes. Unity reference 1080x1920, matchWidthOrHeight=0.5, is a design canvas, NOT a device CSS-pixel geometry contract. Static method names are NOT proof of working network callbacks.

**Do not commit the extracted APK, CSVs containing its private structure, screenshots, copyrighted art, ASTC/PNG textures, atlases, Spine skeletons/animations, fonts, unique screen expression or compiled code into this public repository.** The research pack is private reference only. It does not confer rights to redistribute or rebrand materials. No voice or microphone feature.

Features that may be independently implemented include standard chessboard, promotion, profile, matchmaking states, achievements, settings, responsive controls, reconnect and result handling. User experience must be independently designed, never traced pixel-for-pixel. Any exact third-party visual reproduction requires documented permission.

Generated-art ownership may vary by law and provider terms; maintain full provenance and rights/license review. npm private/UNLICENSED metadata does not make this public GitHub repo private. Do not represent unresolved IP questions as certified ownership.

## 2. Source-of-truth integration strategy
1. Preserve foundational PR #1 and the stacked release fixes in PR #18; do not replace tested rules/clock/data contracts.
2. This branch implements an independent royal visual layer, a 45-asset original SVG library, real screen references and three saved-avatar choices, preserving compatibility with existing gameplay: `src/original-royal.css`, `public/brand/original-royal-hall.svg`, imported after existing CSS in `src/main.js`, plus source contract tests.
3. Preserve other active stacks: PR #13 original-art/Android a11y, PR #15 XP/achievements/backups, PR #17 rewarded ads. Reconciling them requires explicit cross-branch diff review and targeted cherry-picks, not automatic "complete".
4. Keep game logic `src/game.js`, `src/clock.js`, `server/match.js` authoritative. Preserve `src/storage.js`, `src/backup.js` and `src/online.js`. UI commands must use existing tested interfaces, never duplicate game state.
5. Materialize every new production asset from an original master (SVG/source render/3D blend), with hashed outputs, provenance, dimensions, thumbnail, tests and an acceptance log. No third-party APK bitmap is a valid master.

## 3. Screen-to-code execution matrix
All contracts remain PARTIAL until exact-head plus device evidence; the table indicates intended work, not completion.
| Screen | Scope | Current mapping / planned change | Gate |
|---|---|---|---|
| SCR-00 | Splash | index.html, src/main.js; original loading mark, 320px + cold start fallback | G-ART, G-DEVICE |
| SCR-01 | Guest Welcome | index.html, src/lobby.js; original branding, privacy notice | G-A11Y, G-LEGAL |
| SCR-02 | Tutorial | src/app-shell.js; original coach marks, legal move + promotion | G-RULES, G-DEVICE |
| SCR-03 | Home | src/app-shell.js/css; independent premium royal mode cards | G-VISUAL |
| SCR-04 | Play Hub | src/app-shell.js; original game mode hierarchy | G-VISUAL |
| SCR-05 | Match Setup | src/app-shell.js, src/main.js; adaptive time/side controls | G-RULES |
| SCR-06 | VS Intro | index.html, src/main.js; reduced-motion-safe original transition | G-A11Y |
| SCR-07 | Gameplay | src/main.js, src/board3d.js; original 2D/3D piece+board art; 30/60 FPS targets measured not asserted | G-RULES, G-GPU |
| SCR-08 | Promotion | index.html; four pieces, focus trap, touch and keyboard | G-A11Y |
| SCR-09 | Game Menu | src/screen-routes.js; confirm destructive actions | G-RULES |
| SCR-10 | Pause | src/screen-routes.js, src/native-lifecycle.js; offline/online policy | G-DEVICE |
| SCR-11 | Result | src/screen-routes.js; original outcome ornaments, exactly-once journaling | G-DATA |
| SCR-12 | Review | src/screen-routes.js; original timeline + valid PGN/FEN | G-RULES |
| SCR-13 | History | src/history.js, src/screen-routes.js; paging and rescue | G-DATA |
| SCR-14 | Learn | src/app-shell.js, src/learning.js; new cards/motifs | G-CONTENT |
| SCR-15 | Lesson | src/learning.js; accessible stage and explanation controls | G-CONTENT |
| SCR-16 | Puzzle Hub | src/screen-routes.js; difficulty and provenance | G-CONTENT |
| SCR-17 | Puzzle Play | src/learning.js; alternative solutions, hint rendering | G-CONTENT |
| SCR-18 | Puzzle Result | src/screen-routes.js; no double XP | G-DATA |
| SCR-19 | Daily | src/learning.js; time-zone and journal invariants | G-DATA |
| SCR-20 | Profile | src/app-shell.js; owned avatar/frame variants | G-ART |
| SCR-21 | Progress | src/screen-routes.js; event-truthful stats | G-DATA |
| SCR-22 | Achievements | src/screen-routes.js; original badges, exactly-once grant | G-DATA |
| SCR-23 | Appearance | src/appearance.js, src/board3d.js, public/brand; original low-memory themes | G-ART, G-GPU |
| SCR-24 | Settings | src/lobby.js, src/screen-routes.js; persistence, readable toggles | G-A11Y |
| SCR-25 | Privacy | src/screen-routes.js; owner approved policy and delete/export | G-LEGAL |
| SCR-26 | Import Export | src/backup.js; preview, atomic durable restore | G-DATA |
| SCR-27 | Error Recovery | src/screen-routes.js; no silent loss | G-DATA |
| SCR-28 | PWA Update | src/screen-routes.js, vite.config.js; safe in-match activation | G-DEVICE |
| SCR-29 | About Licenses | src/screen-routes.js; complete notices, support & build ID | G-LEGAL |

## 4. Component and asset production tracks
**Royal tokens:** obsidian/jade/gold, minimum 48px coarse-pointer targets, focus visible, AA contrast, reduced motion, CSS fallback when filter effects unavailable.
**Scene components:** brand shell, modal/dialog, segmented controls, mode cards, player identity bar, clock, board frame, move notation, rank panels, reward cards, scrolling lists, alerts.
**Artwork:** source-created splash/launcher/maskable icons; 2D/3D boards; six original chess piece shapes per side; backgrounds; result states; avatars; frames; ranks/badges; reward token art; tutorial/puzzle illustrations; empty/error states.
**Motion:** original start/finish cues, check/checkmate/capture/success, optional particles with reduced-motion and low-end-GPU fallbacks. No third-party Spine files.
**Assets:** supply original 1x and 2x raster exports where useful, lossless source masters, WebP/AVIF where supported, binary budgets, mobile cropping/safe-area guides. Do not blindly duplicate competitor sprite count; create one reusable original component per needed in-game role.

## 5. Work orders, dependencies and completion rules
| ID | Task | Status | Dependencies / output |
|---|---|---|---|
| GC-ORIG-T01 | Audit PR stacks and source IP boundary | INSPECTED, REVIEW REQUIRED | GitHub PR #1, #13, #15, #17, #18 |
| GC-ORIG-T02 | Introduce original brand token layer and art | CODE ADDED / QA PENDING | src/original-royal.css; original SVG |
| GC-ORIG-T03 | Add source-level accessibility/design tests | CODE ADDED / exact-head CI pending | tests/royal-visual.test.js |
| GC-ORIG-T04 | Publish original asset-slot ledger | 45 master slots indexed / extension pending | original_asset_slots.csv |
| GC-ORIG-T05 | Author full original PNG/icon family from masters | 45 original SVG masters CODE ADDED; PNG exports, distinct final art QA pending | Independent art process; license ledger |
| GC-ORIG-T06 | Onboarding/Home/Play/Setup/VS full visual QA | Royal CSS references integrated; device QA NOT STARTED | T05, G-VISUAL |
| GC-ORIG-T07 | Gameplay HUD, pieces, boards, 2D/3D parity | HUD CSS integrated; actual 2D/3D artwork parity pending | T05, G-RULES, G-GPU |
| GC-ORIG-T08 | Result/replay/history/learning/puzzles visuals | Screen CSS and result ornaments wired; full visual QA pending | T05, G-CONTENT |
| GC-ORIG-T09 | Profile/rank/reward/appearance original art and QA | Three avatars wired with stable IDs; rank art prepared, full QA pending | T05, PR #15 reconciliation |
| GC-ORIG-T10 | Settings/data/update/recovery visual QA | Common styling integrated; actual device QA pending | T06, G-DATA |
| GC-ORIG-T11 | React/TypeScript migration decision ADR | NOT STARTED | Do not assume ESM is React today |
| GC-ORIG-T12 | PvP WS/idempotency/reconnect/anti-cheat separate work | NOT STARTED | backend protocol, security test |
| GC-ORIG-T13 | Android native shell, packaging, Play policies | NOT STARTED | PR #13/#17 comparison, keys |
| GC-ORIG-T14 | Exact-head CI/browser QA and on-device acceptance | Core/Android CI triggered; results and devices pending | G-DEVICE, G-A11Y, G-GPU |
| GC-ORIG-T15 | Rights/attribution/license and release sign-off | NOT STARTED | G-LEGAL, SBOM, consent |

A code file existing is not proof of runtime/device acceptance. A source comment cannot self-certify legal ownership.

## 6. Required release gates
- **G-ART:** hash/provenance/permission for every shipped art, font, 3D model and SDK; no extracted foreign assets; creative review for overall similarity.
- **G-RULES:** FIDE differential cases, promotion, clocks, save/resume, deterministic bot policy.
- **G-DATA:** storage denial, interrupted writes, migration, idempotent achievements, backup/restore.
- **G-NET:** two-client real-time live preview, authoritative outcomes, reconnect, anti-abuse, measured cost/load.
- **G-VISUAL:** 320/360/412/768 landscape, hierarchy, safe areas, no overlap, asset scaling and legibility.
- **G-A11Y:** Android TalkBack, keyboard navigation, focus trapping, high contrast, reduced motion, 200% font.
- **G-GPU:** 2D/3D performance/memory on physical low-end and midrange Android.
- **G-DEVICE:** Capacitor resume/back/install/update/signature verification.
- **G-CONTENT:** licensed lessons/puzzles and alternative-solution verification.
- **G-LEGAL:** IP licenses, privacy/terms, store, rewarded-ad consent, taxation/payment if enabled.

## 7. PR policy and rollback
This PR is DRAFT and targets PR #18's head branch; no merging, deploying, billing, keys or production change. Use a build flag or remove the final CSS import for rollback. First exact-head CI must pass Node tests, bundle size, browser smoke and PWA asset checks; after this, manual mobile and accessibility audits. Other PR branches may advance; never claim head/test evidence carries over without re-run.


## 8. Implementation checkpoint 2026-11-22 (PR #29)
- Added `public/brand/royal-*.svg` (45 new individually authored, self-contained vector masters); these are not derived/traced from foreign APK artwork.
- `src/original-royal-art.js` lists 45 named source assets. `tests/original-royal-catalog.test.js` checks names/files, self-contained SVGs, CSS references, original import order, basic accessibility and safe-area rules.
- `src/original-royal.css` now loads AFTER existing home/profile CSS and applies original teal/obsidian/antique-gold presentation to Home, Play, Learn, Profile, bottom navigation, game HUD, dialogs and auxiliary routes.
- Existing three saved avatar identifiers stay `♞`, `♜`, `♛`; renderers now show independently authored Guardian, Scholar, Traveler vector art; no storage key/schema migration.
- `src/outcome-artwork.js` selects generic winner/draw/neutral decoration based on actual engine outcome text; no fabricated rating/XP or game authority.
- `.github/workflows/verify.yml` includes PR #18 target and a branch push verification trigger; exact-head CI evidence remains per SHA, never transferable across later commits.
- **UNFINISHED:** all final PNG raster exports, per-device visual signoff, exhaustive 2D/3D parity, live Cloudflare two-seat game reliability, WebSocket matchmaking, real rated Elo, anti-cheat, signed owner-release AAB, permanent signing identity, legal/privacy/Play approval and real-device accessibility. These are not completed by adding SVGs or CSS.
- **PROVENANCE:** generated SVG markup authored for this repository; no third-party source code or artwork committed. Authorship/ownership of all commercial content requires a separate approved provenance/license review.
