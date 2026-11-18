# Global Chess Online PvP

Run `npm ci`, then `npm run dev`. Run `npm test` for the game-core tests and `npm run build` for the static production bundle. Use `npm exec vite preview` to serve that bundle locally. Offline caching requires an initial successful load over HTTPS or localhost.

## Code map

| Path | Responsibility |
|---|---|
| `src/game.js` | Chess rules adapter and versioned match serialization |
| `src/main.js` | Board input, match presentation and local save lifecycle |
| `src/bot.js` | Local opponent in a dedicated worker |
| `vite.config.js` | Versioned offline shell |
| `tests/` | Save restoration and rules checks |

## Build sequence

1. Local match foundation and offline shell. Extend draw adjudication, storage and browser tests.
2. Add lobby, setup, match, result/replay, history, profile, settings, lessons and puzzles.
3. Add Babylon.js rendering and Havok presentation physics behind the shared rules interface, with a 2D fallback.
4. Add authoritative invite-only matches, clocks and reconnect. Test 25 concurrent rooms and 50 clients on the free-tier deployment.
5. Package the Android shell and verify device behavior, installable PWA and public beta.

Current implementation covers the 2D match screen, a basic computer opponent, save/resume and a production offline shell. Draw handling currently uses chess.js defaults.
