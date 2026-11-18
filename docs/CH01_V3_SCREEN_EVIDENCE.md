# CH-01 v3 — Screen Contract Evidence Register

Source of truth: uploaded **Chess_Final_Production_Ready_Planning_Pack_v3_2026-11-18.zip**.
This is a faithful implementation reconciliation of the 30 IDs in `design/screen_matrix.csv`
and `docs/03_SCREEN_BY_SCREEN_UX_SPEC.md`. **Not** a complete release certificate.

Related change: PR #2 `feat/chess-v3-m0-mobile-shell`, based on the still-draft PR #1.
Verified narrow GitHub Actions run: [#44386568115](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/actions/runs/44386568115), with 32/32 Node tests, a clean PWA build, 3D bundle budget,
and Chromium smoke covering legal move, 3D mount, responsive 320/360/412, local resume, computer playing White,
mobile navigation, profile/learning, menu/resignation and result. Source changes made after this pinned run must be rechecked.

Statuses here mean:
- **IMPLEMENTED_PARTIAL**: source includes a working subset; design/acceptance incomplete.
- **NOT_IMPLEMENTED**: required full screen is absent.
- **GATE_UNVERIFIED**: code implemented at some level, but both-platform acceptance/real-device verification absent.
None means user-facing mobile App Store production ready.

| Screen | Current evidence in branch | Status / remaining requirement |
|---|---|---|
| SCR-00 Boot/Splash | `#launch` and nonblocking optional solver | GATE_UNVERIFIED: Android splash, recovery, startup metrics |
| SCR-01 Guest Welcome | original full-screen guest entry, random local ID stored in preferences | IMPLEMENTED_PARTIAL: linkable Privacy/Terms/License and quota-error fallback |
| SCR-02 First-Match Micro-Tutorial | coaching legal selection/move, Skip and Replay, Chromium assertion | IMPLEMENTED_PARTIAL: TalkBack/Android walkthrough, later check/promotion help |
| SCR-03 Main Lobby | original royal burgundy/gold hero, Classic/Quick/Computer/Local, resume, responsive screenshots | IMPLEMENTED_PARTIAL: real-device visual polish, compact viewport usability |
| SCR-04 Play Hub | dedicated nav view, format/opponent distinction | IMPLEMENTED_PARTIAL: full setup/history states and E2E coverage |
| SCR-05 New Match Setup | time, opponent, difficulty, White/Black/Random, validated input and black-side bot | IMPLEMENTED_PARTIAL: persisted last choices, more accessibility settings |
| SCR-06 VS Introduction | existing `#versus` transition | IMPLEMENTED_PARTIAL: cancel/skip, background and clock start policy |
| SCR-07 Chessboard | board-first mobile layout, black-at-bottom, legal tap moves, local clock status, opt-in 3D | IMPLEMENTED_PARTIAL: drag/drop, narration, audio/haptics, real hardware GPU tests |
| SCR-08 Promotion Dialog | four pieces in existing native dialog | IMPLEMENTED_PARTIAL: TalkBack/focus/clock acceptance |
| SCR-09 In-Game Menu | mobile focus-trap Escape sheet; functional Restart/Resign/Save & Return Home | IMPLEMENTED_PARTIAL: full menu action coverage and Android Back |
| SCR-10 Pause | time pause when home, hidden or options open with a unit policy test | IMPLEMENTED_PARTIAL: controlled device lifecycle tests |
| SCR-11 Match Result | result dialog for rules and saved resignation, browser validation | IMPLEMENTED_PARTIAL: accurate stats, unique XP reward, standalone result screen |
| SCR-12 Review/Replay | local history replay and PGN export | IMPLEMENTED_PARTIAL: dedicated UI controls, corrupted PGN and review QA |
| SCR-13 Game History | local history dialog | IMPLEMENTED_PARTIAL: search/filter, pagination, safe deletion |
| SCR-14 Learn Hub | navigation and opening of verified built-in lesson content | IMPLEMENTED_PARTIAL: dedicated curriculum cards and adaptive progress |
| SCR-15 Lesson Player | interactive existing board and lessons | IMPLEMENTED_PARTIAL: hint states, all move explanations, assisted navigation |
| SCR-16 Puzzle Hub | link into bundled puzzle catalog | IMPLEMENTED_PARTIAL: packs, filters, content sourcing |
| SCR-17 Puzzle Player | interactive board and legal solution | IMPLEMENTED_PARTIAL: alternate correct lines, graded hints, offline pack version |
| SCR-18 Puzzle Result | text feedback after legal answer | IMPLEMENTED_PARTIAL: dedicated result/next/XP idempotence |
| SCR-19 Daily Challenge | deterministic existing daily exercise | IMPLEMENTED_PARTIAL: stable local-day reward journal and history |
| SCR-20 Profile | local name/avatar, visible Local profile and stored local ID, history count | IMPLEMENTED_PARTIAL: richer stats, settings state and device tests |
| SCR-21 Progress | limited exercise completion display | IMPLEMENTED_PARTIAL: durable XP journal and genuine game statistics |
| SCR-22 Achievements | basic exercise badges | IMPLEMENTED_PARTIAL: event-derived achievement journal and screens |
| SCR-23 Appearance/Equipment | initial art/board only, no selection screen | NOT_IMPLEMENTED |
| SCR-24 Settings | coordinates and high contrast dialog | IMPLEMENTED_PARTIAL: audio/haptics, a11y, reset policy, data/help |
| SCR-25 Data & Privacy | no dedicated page or full policies | NOT_IMPLEMENTED |
| SCR-26 Import/Export | backup JSON and PGN in existing dialogs | IMPLEMENTED_PARTIAL: dedicated validated data center, error recovery |
| SCR-27 Error Recovery | a few strings and 2D fallback | IMPLEMENTED_PARTIAL: storage migration repair, backup, retry and safe-mode |
| SCR-28 PWA Update Available | service worker exists, dedicated update flow absent | NOT_IMPLEMENTED |
| SCR-29 About/Support/Licenses | bundled WASM MIT LICENSE asset | NOT_IMPLEMENTED dedicated screen; notice manifest/legal links missing |

## Current cross-cutting blockers and constraints

- ZIP has **602 atomic tasks and 23 release gates**; this register does **not** mark all tasks verified.
  `trackers/Chess_Execution_Ledger_v3.csv` in the supplied ZIP remains the authoritative original IDs.
- The ZIP proposes a shared React/TypeScript game controller and Capacitor Android build;
  current runtime still uses vanilla JS Vite. Do not pretend this migration was completed.
- Guest/offline play has no required network dependency. Cloudflare private rooms are experimental
  and correspond to later optional multiplayer, not certified rated PvP.
- GitHub repo is PUBLIC while package's `private: true` means npm no-publish only.
  Commercial artwork provenance, legal name/trademark and all third-party notice review remain open.
- Real Android device tests, signed AAB, PWA update behavior, web preview promotion,
  actual concurrent network tests, anti-cheat, money/store integration and Play policies are unverified.
- Avoid copying Chess Clash logos, Miniclip branding, screenshots, texture art or fake economy widgets.
  ZIP references are for behavior/art direction only.

## Release gates

Keep this PR **DRAFT**, test at the latest HEAD after every change, and require human-device
visual review and product acceptance before merge into PR #1 or main. A CI green badge is not a release.
