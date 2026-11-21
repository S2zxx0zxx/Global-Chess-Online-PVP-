# ZIP v3 SCR-00 through SCR-29 — source-to-code implementation matrix

Source of truth: `Chess_Final_Production_Ready_Planning_Pack_v3_2026-11-18.zip` → `docs/03_SCREEN_BY_SCREEN_UX_SPEC.md` and `design/screen_matrix.csv`.

This is an implementation/evidence ledger, **not** a claim that any contract is fully accepted. Files and browser smoke do not replace 320/360/412/landscape, TalkBack, live gameplay, recovery and device tests. The v3 source originally listed each screen `NOT_STARTED`; this file reconciles implemented code without rewriting original planning evidence.

| ID | Screen contract | Existing GitHub evidence | Status | Remaining acceptance evidence |
|---|---|---|---|---|
| SCR-00 | Boot / Splash | index.html #launch, src/main.js initialization | PARTIAL | Real cold-start fallback, migration, storage-error and Android startup |
| SCR-01 | Guest Welcome | index.html #welcome-dialog, src/lobby.js | PARTIAL | Guest ID persistence when storage denied; privacy/terms approval |
| SCR-02 | First-Match Tutorial | src/app-shell.js #ch-first-move-tip | PARTIAL | Real-device coach marks, check/promotion steps and replay accessibility |
| SCR-03 | Home Lobby | src/app-shell.js #lobby, src/app-shell.css | PARTIAL | 360/320 UI tests, final device review, complete non-overflow modes |
| SCR-04 | Play Hub | src/app-shell.js #ch-play-hub | PARTIAL | Format vs opponent separation and onboarding acceptance |
| SCR-05 | New Match Setup | src/app-shell.js #ch-setup-dialog; src/main.js playerSide | PARTIAL | Full settings/undo/flip policy, persisted format defaults and mobile QA |
| SCR-06 | VS Introduction | src/main.js showVersus; index.html #versus | PARTIAL | Real human/online labels, escape/skip and animation device QA |
| SCR-07 | Gameplay Board | src/main.js; src/board3d.js; src/app-shell.css | PARTIAL | Drag/clock/3D device QA, check accessibility and corner cases |
| SCR-08 | Promotion | index.html #promotion, src/main.js | PARTIAL | Trap focus, ESC validation, Android TalkBack and four-choice QA |
| SCR-09 | In-Game Menu | src/screen-routes.js ?screen=menu | PARTIAL | Resign/undo terminal policy, destructive confirmations |
| SCR-10 | Pause | src/screen-routes.js ?screen=pause | PARTIAL | Clock pause transition + Android background lifecycle |
| SCR-11 | Match Result | src/screen-routes.js ?screen=result, src/lobby.js | PARTIAL | Time, once-only XP journal and complete endgame QA |
| SCR-12 | Review / Replay | src/screen-routes.js ?screen=review | PARTIAL | Move validation/review interactions and history portability |
| SCR-13 | History | src/screen-routes.js ?screen=history, src/history.js | PARTIAL | Large-history paging, saved history data repair, delete durability |
| SCR-14 | Learn Hub | src/app-shell.js #ch-learn-hub; ?screen=lessons | PARTIAL | Curriculum accessibility and full learning content approval |
| SCR-15 | Lesson Player | index.html #learn-dialog; src/learning.js | PARTIAL | Keyboard hint stages, FEN feedback and lesson completion UI |
| SCR-16 | Puzzle Hub | src/screen-routes.js ?screen=puzzles | PARTIAL | Filters/difficulty/provenance and data packs |
| SCR-17 | Puzzle Player | index.html #learn-dialog; src/learning.js | PARTIAL | Hint stages, alternative solution graph, replay quality |
| SCR-18 | Puzzle Result | src/screen-routes.js ?screen=puzzle-result | PARTIAL | Explain alternatives and no duplicate XP events |
| SCR-19 | Daily Challenge | src/learning.js dailyExercise; ?screen=daily | PARTIAL | Time-zone migration, daily journal and clock-change protection |
| SCR-20 | Local Profile | src/app-shell.js #ch-profile-hub; src/lobby.js | PARTIAL | Guest ID visual QA, account migration policy |
| SCR-21 | Progress | src/screen-routes.js ?screen=progress | PARTIAL | Event journal, history reconciliation and genuine streaks |
| SCR-22 | Achievements | src/screen-routes.js ?screen=achievements | PARTIAL | Award once, event provenance and content versioning |
| SCR-23 | Appearance | src/screen-routes.js ?screen=appearance; brand/pieces | PARTIAL | Original art final QA, 3D parity, low-memory skin switching |
| SCR-24 | Settings | src/screen-routes.js ?screen=settings; src/lobby.js | PARTIAL | Audio/haptics/language/undo and complete persistence failures |
| SCR-25 | Data & Privacy | src/screen-routes.js ?screen=data | PARTIAL | User-approved privacy/terms links and data deletion policy |
| SCR-26 | Import / Export | src/screen-routes.js ?screen=transfer; src/backup.js | PARTIAL | Import preview, backup validation UI, storage transaction atomicity |
| SCR-27 | Error Recovery | src/screen-routes.js ?screen=recovery | PARTIAL | Corrupted DB safe-mode migration and full export rescue |
| SCR-28 | PWA Update | src/screen-routes.js ?screen=update; vite.config.js | PARTIAL | Ready-worker activation after match, migration-aware reload |
| SCR-29 | About / Support / Licenses | src/screen-routes.js ?screen=about | PARTIAL | Version/build ID, support contact approval and final notices |

## Executed browser evidence

- [GitHub Actions #44942313695](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/actions/runs/44942313695): 29/29 unit tests, real 360px Chromium local chess + 3D pixel smoke, 20 auxiliary-route screenshots and 320/360/412/768 horizontal-overflow checks. Later commits require re-verification on their final SHA.
- Additional art modules: `public/brand/`, `public/brand/pieces/`; see `docs/V3_ARTWORK_PROVENANCE.md`.
- Live Cloudflare deployment can lag draft PR and must be identified separately before saying users see the new design.
- **No gate can be marked FINAL_GRADE merely because a page renders or an asset exists.** Real device/accessibility/product acceptance still pending.
