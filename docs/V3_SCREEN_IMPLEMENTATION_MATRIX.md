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
| SCR-07 | Gameplay Board | Chromium plays `e4 d5 exd5` with 3D keyboard controls, announces the legal capture, tests flipped arrows and Tab exit, and verifies the same capture on the 2D board. | PARTIAL | Physical touch, clocks, 3D performance, TalkBack and edge cases |
| SCR-08 | Promotion | Named modal, explicit Cancel, active piece art and keyboard focus restoration. Chromium reached legal promotion from the starting position, tested Escape and all four piece choices, and reloaded the saved knight. | PARTIAL | Android TalkBack, touch and physical-device timing |
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
| SCR-23 | Appearance | Each animated piece set has a distinct 3D capture effect. Chromium picks all five sets from Appearance, compares each rendered impact with the settled board, and verifies the reduced-motion behavior. | PARTIAL | Physical GPU performance, 3D board appearance parity and low-memory skin switching |
| SCR-24 | Settings | src/screen-routes.js ?screen=settings; src/lobby.js | PARTIAL | Audio/haptics/language/undo and complete persistence failures |
| SCR-25 | Data & Privacy | src/screen-routes.js ?screen=data | PARTIAL | User-approved privacy/terms links and data deletion policy |
| SCR-26 | Import / Export | src/screen-routes.js ?screen=transfer; src/backup.js | PARTIAL | Import preview, backup validation UI, storage transaction atomicity |
| SCR-27 | Error Recovery | src/screen-routes.js ?screen=recovery | PARTIAL | Corrupted DB safe-mode migration and full export rescue |
| SCR-28 | PWA Update | Chromium staged a worker, deferred it during an active game, applied it after resignation, and preserved history through a worker rollback. | PARTIAL | Deployed and installed-device updates with real successive application builds |
| SCR-29 | About / Support / Licenses | src/screen-routes.js ?screen=about | PARTIAL | Version/build ID, support contact approval and final notices |

## Executed browser evidence

- PR #18 adds a 1366px desktop Home overflow regression and a mobile promotion test that exercises real moves and keyboard input. The suite captures the focused promotion dialog as `SCR-08-promotion.png`.
- Chromium denies WebGL, opens 3D through the match menu and verifies the 2D fallback continues the existing game with Black's legal knight move.

- [GitHub Actions #44947446464](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/actions/runs/44947446464): 42/42 unit tests, a production PWA build, real 2D move + Babylon 3D rendered-pixel smoke, 21 auxiliary-route screenshots, Black-side computer game, verified resignation/replay, persisted avatars/Crest pieces, browser Back, simulated blocked browser storage, 320/360/412/768 horizontal overflow checks, 200% text-scale check, landscape viewport, WASM and offline assets. Run applies to SHA `75b3c982b41b30a073426baa16c12987fff03ec9`.
- Additional art modules: `public/brand/`, `public/brand/pieces/`; see `docs/V3_ARTWORK_PROVENANCE.md`.
- Live Cloudflare deployment can lag draft PR and must be identified separately before saying users see the new design.
- **No gate can be marked FINAL_GRADE merely because a page renders or an asset exists.** Real device/accessibility/product acceptance still pending.

## 2026-11-22 — implementation hardening wave (code completion is not device certification)

The current PR includes code-level improvements for the following contracts:

| Contract | Delivered implementation | Still blocking FINAL_GRADE |
|---|---|---|
| SCR-00, 01, 27 | IndexedDB/localStorage-to-memory fallback, visible session-only guest warning, actionable fatal bootstrap fallback, preserved corrupt raw saves and consent before overwrite, working in-app privacy/license navigation | Failures of the actual Android/PWA bootstrap, background migrations, indexed DB corruption and accessible recovery on device |
| SCR-02 | Skippable first-move tutorial adapts to human color, commits through 2D/keyboard/drag/3D | Promotion/check coach marks, TalkBack annotations and full first-run device test |
| SCR-03–06 | Mobile responsive home/play, format setup, White/Black/Random for computer, accurate VS labels, skippable introduction | Final art/spacing review against original screen contracts on physical devices |
| SCR-07–10 | Legal draw claim only when genuinely possible, paused-game drag blocked, authenticated offline pause/resign, no false pause without active match | Android app pause/resume, full promotion focus, remote authoritative resign, exhaustive FIDE edge QA |
| SCR-11–13 | Real outcome, saved replay, PGN export, history pagination, durable-history clear action | Full recovery across quota and interrupted transactions; additional endgame states |
| SCR-14–19 | Offline lessons/puzzles, staged legal hints, truthful puzzle result and device-local daily date | Content provenance, alternative solutions, filters and differential puzzle validation |
| SCR-20–23 | Verified vs-computer win/loss/draw/streak, original guest avatar and frame gallery, persistent board/Crest themes | Match/event XP journal, independent content/master ownership review, full 3D skin parity |
| SCR-24–26 | Original opt-in WebAudio and haptics controls, truthful English-only language availability, validated JSON import preview, export, confirmed history deletion | New languages not available, production-ready Privacy/Terms and all browser-storage fault injection |
| SCR-28–29 | Service worker activates new version only on user request after an active-game and durable-save preflight; source license notices | Real downloaded-update/rollback on devices, official build ID, final terms and support sign-off |

New verified evidence: [GitHub Actions #44947446464](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/actions/runs/44947446464).
A passing headless Chromium test **does not replace** Android install, human visual acceptance,
200% OS-font testing across all 30 routes, screen-reader QA, paid commercial terms approval,
or 3D performance measurements from low-memory hardware.

**Strict status: 30/30 source contracts mapped, zero contracts fully accepted.**
Do not auto-merge or call this a production release. No money, bank, payments,
unapproved licensed artwork or destructive production changes were introduced.
