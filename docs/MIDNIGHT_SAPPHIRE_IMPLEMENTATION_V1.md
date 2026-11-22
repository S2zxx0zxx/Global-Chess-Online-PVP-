# Midnight Sapphire UI Integration v1.0
Date: 2026-11-22
Branch: feat/original-royal-design-foundation
Status: IMPLEMENTATION UNDER VERIFICATION — not a production certificate.

## User visual basis
The current user-approved Global Chess concept art has six key compositions: original Global Chess branding/splash, a sapphire loading chessboard, a centered royal board with large Play CTA, a profile dialog with player statistics and achievement navigation, a settings dialog, and a versus/matchmaking view. The new implementation translates that concept to actual responsive DOM and existing game controllers. It does not reproduce the earlier separate commercial game exactly.

## Real actions, not mock buttons
| Visual surface | Button | Existing functional command / status |
|---|---|---|
| Home | Settings | Opens original local settings dialog enhanced with real sound and haptics preferences |
| Home | Profile | Real player profile from validated local history, current local name/avatar and practice XP |
| Home | Training | Opens existing Learn hub |
| Home | Quest Train | Opens Learn hub; progress from actual completed learning event ledger |
| Home | Play | Calls existing opponent/time/side setup dialog, then existing chess engine |
| Home | Challenge Friend | Uses existing private-room invite flow, not public queue |
| Home | Resume | Existing durable match continuation, visibility controlled by game |
| Home | Classic/Quick/Computer | Existing editable setup dialog and local engine |
| Home | Private PvP | Existing private room, actual two-seat backend and status text |
| Home | Daily/Puzzles/Achievements/Appearance | Existing content and cosmetic routes |
| Bottom nav | Collection/Learn/Home/Modes/Profile | Existing routing; no ghost stores or clubs |
| Profile modal | Edit | Opens existing name/avatar editor; no clone of profile data |
| Profile modal | Achievements/Avatars/History | Existing accessible routes |
| Settings modal | Move Sound/Vibration | Existing local feedback preferences; unsupported controls disabled |
| Settings modal | Board coordinates/Contrast | Existing preferences and immediate board updates |
| Settings modal | Appearance/Privacy/Help | Existing routes to appearance, backups and notices |
| PvP | Invite/copy/leave | Existing backend and invite actions, no simulated Elo or fake online opponent |

## Artwork and behavior
- The sapphire logo and celestial background are original source-authored SVGs in \`public/brand\`.
- The decorative board uses the project's existing original piece SVG set; real board rules stay in \`src/game.js\`.
- The loading indicator is indeterminate on purpose; no arbitrary 41%/67% claim.
- The quest only shows persisted or session progress returned by \`getProgressReport\`; no fabricated XP.
- UI respects safe areas, 320px screens, focus-visible, reduced motion, and keyboard-modal behavior.
- Existing JS ESM/Vite/Babylon/Capacitor stack remains authoritative. No React/Kotlin conversion.

## Outstanding gates
- Automated exact-head: source checks, Node tests, PWA, Chromium 2D/3D, local two-seat worker smoke.
- Android debug APK signed for tests, actual physical device install/taps/rotation/AA contrast/TalkBack.
- Matchmaking is private-room, not a real global matchmaking queue. Club/account/cloud currency requires backend, consent and tests before displaying as functional.
- Full 3D board material parity and original final illustrations for every route not certified.
- Review third-party licenses and commercial IP provenance. No merge to main.
