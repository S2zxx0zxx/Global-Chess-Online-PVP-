# GC-B01-T01 — Live Source Pin & Branch Evidence

**Plan ID:** `GC-MASTER-EXEC-v1.0`  
**Task ID:** `GC-B01-T01`  
**Snapshot:** 2026-11-22T12:47:17Z  
**Repository:** https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-  
**Audit mode:** documentation-only, no game code edits, branch resets, merging or deployment.  
**Executor sign-off:** `GC-B01-T01 / evidence-backed snapshot / 2026-11-22T12:47:17Z`  
**Source plan SHA-256:** `f076a2a8f3672a3fa3fb325b05ae930f938c88a2d2521eab17fe8c55779cae59` (owner-provided master MD; not yet copied into GitHub).

## 1. Authoritative exact-SHA baseline

| Ref | Full SHA | What is verified |
|---|---|---|
| Main | [`63462e20f97a64913836e361c0e9807604ac3d4a`](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/commit/63462e20f97a64913836e361c0e9807604ac3d4a) | `main` has only initial history plus deleted README; do not describe as deployable game |
| Foundation PR #1 | [`f4d313f24fc54c73255226c6fb1f4859d651a31d`](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/commit/f4d313f24fc54c73255226c6fb1f4859d651a31d) | Open/Draft; contains merged PR #16 |
| Integrated PR #18 | [`3d9467ada0eaf167eecc52d6c98ed126fa98c98c`](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/commit/3d9467ada0eaf167eecc52d6c98ed126fa98c98c) | Open/Draft, clean relative to foundation; 18 commits ahead |
| Optional PR #17 | [`2d92eceae6fc4e126fc64bfd4c5376190f5a26a0`](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/commit/2d92eceae6fc4e126fc64bfd4c5376190f5a26a0) | Open/Draft, separate optional ads lineage; not incorporated in #18 |

- Default branch is `main`; repository is PUBLIC, not archived.
- GitHub currently shows **18 PRs**, of which **17 open/draft**, and **PR #16 merged into foundation**, not `main`.
- All 19 inspected branch heads are listed in the PR table below or branch inventory. No new releases (GitHub releases API returned an empty array).
- Source tree at PR #18 SHA was retrieved with `truncated=false` and **118 files**.
- [PR #18](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/pull/18) currently targets foundation at `f4d313f24fc54c73255226c6fb1f4859d651a31d` and includes **18 commits / 71 changed files**, with `behind=0`.
- This pin is immutable source history. The BRANCH names can advance; recheck GitHub before taking later actions.

## 2. PR stack and ancestry (historical ancestry is not merge authorization)

```text
main @ 63462e20f97a
  └── #1 foundation @ f4d313f24fc5 [DRAFT / OPEN]
        ├── #16 appearance [MERGED into #1 only]
        ├── #18 release integration @ 3d9467ada0ea [OPEN; direct +18 on foundation]
        ├── #11 M01 documentation [separate branch]
        ├── #12 → #13 → #15 [legacy integration lineage, separate from #18]
        │                 └── #17 native rewarded-ad experiment [separate optional branch]
        └── #2 → #3 → #4 → #5 → #6 → #7 → #8 → #9 → #10
             [older divergent stacked lineage]
```

- GitHub compare `foundation...#18`: `status=ahead`, `ahead_by=18`, `behind_by=0`, merge-base `f4d313f24fc54c73255226c6fb1f4859d651a31d`.
- GitHub PR REST `mergeable_state`: #1 **clean**, #18 **clean**; #2 and #12 **dirty** on their current targets. Never force-merge them or overwrite the newer interface.
- #15 versus #18: **diverged**, +33 commits on #18 side and 70 on #15 side (Git graph delta, not amount of missing features).
- #17 versus #18: **diverged**, +33 on #18 side and 109 on #17 side. AdMob/UMP experiment is not integrated into the release branch. No optional monetization decisions are made in Task T01.
- `main` versus #18 is **diverged**, with 251 unique commits on #18 and 1 unique on `main` (README deletion). This is a source graph fact, not proof of how a future merge will behave.

## 3. Live pull request inventory (18 PRs)

| PR | Purpose | GitHub state | Base branch | Pinned HEAD |
|---|---|---|---|---|
| [#1](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/pull/1) | Build the Global Chess foundation | OPEN/DRAFT | `main` | `f4d313f24fc54c73255226c6fb1f4859d651a31d` |
| [#2](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/pull/2) | Build v3 mobile-first game screens from CH-01 ZIP blueprint | OPEN/DRAFT | `feat/playable-chess-foundation` | `b42985ca42bec16931dced4546b0a4c6baac7ade` |
| [#3](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/pull/3) | Make IndexedDB chess saves retryable and await Save & Exit durability | OPEN/DRAFT | `feat/chess-v3-m0-mobile-shell` | `ba45dc68b69c1176414cf5066c53b3756efb5690` |
| [#4](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/pull/4) | Introduce Capacitor 8 Android offline preview build and API 36 CI gate | OPEN/DRAFT | `fix/chess-v3-offline-save-recovery` | `56faad37c15ef8ab354dba3947b2bb10f6a56815` |
| [#5](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/pull/5) | Add event-backed offline chess XP and earned achievements | OPEN/DRAFT | `feat/chess-v3-android-debug-shell` | `ade15933579a99226373ac6f36cf84adf8a6040b` |
| [#6](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/pull/6) | Add local data/privacy controls, PWA updates, and restrictive web headers | OPEN/DRAFT | `feat/chess-v3-verified-local-progress` | `ac8bdf8155cf18f7e67c4909f7d1fd4f44166c94` |
| [#7](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/pull/7) | Build verifiable upload-signed Android bundles behind explicit release gates | OPEN/DRAFT | `feat/chess-v3-data-controls-pwa-update` | `4cf8bdda1018b598de70f1994b9d18ad5a776cc6` |
| [#8](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/pull/8) | Bound chess computer search and audit every starter learning exercise | OPEN/DRAFT | `feat/chess-v3-android-release-gate` | `aff6271d036dd25d21a86a5f245d564613155796` |
| [#9](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/pull/9) | Expand responsive game QA and evidence-map all 23 v3 release gates | OPEN/DRAFT | `fix/chess-v3-bot-content-correctness` | `dcb8e0f1b5bb823cdb39826c5d6e4f3e95073e5c` |
| [#10](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/pull/10) | Add authenticated server-authoritative resign to experimental private PvP | OPEN/DRAFT | `test/chess-v3-accessibility-release-evidence` | `0a2b66845e12f498d669ce156427c3601a6b93b3` |
| [#11](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/pull/11) | Document verified M-01 chess baseline and stacked PR reconciliation | OPEN/DRAFT | `feat/playable-chess-foundation` | `f948510e6db45ead1e1112ee38fc364a235a0fb9` |
| [#12](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/pull/12) | Harden chess match exit, navigation focus, and multi-screen browser QA | OPEN/DRAFT | `feat/playable-chess-foundation` | `95da2b81f7632e4b80d2433778e6279e7c301118` |
| [#13](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/pull/13) | Finish M-02 code gates: original 2D/3D artwork, Android shell and native accessibility | OPEN/DRAFT | `feat/chess-v3-m02a-safe-exit-navigation-qa` | `f9c8ef0368d60443e884edaa6a31111bd1f5f046` |
| [#14](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/pull/14) | M-03: Bound offline chess bot search and audit all 42 learning exercises | OPEN/DRAFT | `feat/chess-v3-m02a-safe-exit-navigation-qa` | `8f15cdfb2741e5180a37ae65c07d6d6063c1a9d2` |
| [#15](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/pull/15) | Integrate M02A/M02B/M03A and complete verified local XP, achievements and backups | OPEN/DRAFT | `feat/chess-v3-m02b-original-art-android-a11y` | `083a521d062da3066c15d7fdc188ba9abfa0aa53` |
| [#16](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/pull/16) | Add five animated royal board and piece styles to Appearance | MERGED | `feat/playable-chess-foundation` | `b2cd46b29050b048f3c0f609c8c32c456cbf0db0` |
| [#17](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/pull/17) | M-04: Consent-gated optional native rewarded ads with no-interruption and release safety | OPEN/DRAFT | `feat/chess-v3-m03-progression-integrated-release-gates` | `2d92eceae6fc4e126fc64bfd4c5376190f5a26a0` |
| [#18](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/pull/18) | Integrate Global Chess release audit fixes | OPEN/DRAFT | `feat/playable-chess-foundation` | `3d9467ada0eaf167eecc52d6c98ed126fa98c98c` |

**Action boundary:** T01 records lineage and source facts only. T02 later resolves semantic integration questions; T03 later selects the canonical long-lived engineering branch. No other task advanced here.

## 4. Exact changed-file inventory: PR #18 versus its actual foundation target (71)

#### ADDED (27)

- `.github/workflows/android-debug.yml`
- `.github/workflows/android-production-release.yml`
- `.github/workflows/android-signing-smoke.yml`
- `capacitor.config.json`
- `docs/ANDROID_PREVIEW_GATE.md`
- `docs/ANDROID_RELEASE_SIGNING.md`
- `docs/CH01_V3_RELEASE_GATES_EVIDENCE.md`
- `public/_headers`
- `public/brand/board-maple-walnut.svg`
- `scripts/build-android-debug.sh`
- `scripts/build-android-release.sh`
- `scripts/check-original-art.mjs`
- `scripts/generate-android-assets.mjs`
- `scripts/smoke-local-rooms.mjs`
- `scripts/validate-learning-pack.mjs`
- `src/history-mutation.js`
- `src/native-lifecycle.js`
- `src/progression.js`
- `src/session-exit.js`
- `tests/bot-budget.test.js`
- `tests/history-mutation.test.js`
- `tests/m03-gameplay-regression.test.js`
- `tests/native-lifecycle.test.js`
- `tests/original-art.test.js`
- `tests/progression.test.js`
- `tests/pvp-resignation.test.js`
- `tests/session-exit.test.js`

#### MODIFIED (31)

- `.github/workflows/verify.yml`
- `.gitignore`
- `docs/V3_ARTWORK_PROVENANCE.md`
- `docs/V3_SCREEN_IMPLEMENTATION_MATRIX.md`
- `index.html`
- `package-lock.json`
- `package.json`
- `scripts/smoke-browser.mjs`
- `server/match.js`
- `server/worker.js`
- `src/app-shell.css`
- `src/app-shell.js`
- `src/appearance.js`
- `src/backup.js`
- `src/board3d.js`
- `src/computer.js`
- `src/home.css`
- `src/learning.js`
- `src/main.js`
- `src/online.js`
- `src/piece-art.js`
- `src/profile.css`
- `src/royal-appearance.css`
- `src/screen-routes.css`
- `src/screen-routes.js`
- `src/storage.js`
- `src/style.css`
- `tests/appearance.test.js`
- `tests/backup.test.js`
- `tests/game.test.js`
- `vite.config.js`

#### REMOVED (13)

- `public/chess-assets/board/maple-walnut.webp`
- `public/chess-assets/pieces/black-bishop.webp`
- `public/chess-assets/pieces/black-king.webp`
- `public/chess-assets/pieces/black-knight.webp`
- `public/chess-assets/pieces/black-pawn.webp`
- `public/chess-assets/pieces/black-queen.webp`
- `public/chess-assets/pieces/black-rook.webp`
- `public/chess-assets/pieces/white-bishop.webp`
- `public/chess-assets/pieces/white-king.webp`
- `public/chess-assets/pieces/white-knight.webp`
- `public/chess-assets/pieces/white-pawn.webp`
- `public/chess-assets/pieces/white-queen.webp`
- `public/chess-assets/pieces/white-rook.webp`

The list above is directly from GitHub compare API and includes the actual 14 legacy WebP deletions, not a guessed list.

### Feature-to-file evidence (presence, not release certification)

| Functional source | Exact paths at PR #18 |
|---|---|
| Basic app + Home/Play/Profile routes | `src/app-shell.js`, `src/screen-routes.js`, `index.html` |
| Rules, clocks, bot | `src/game.js`, `src/clock.js`, `src/computer.js` |
| Appearance and 2D/3D | `src/appearance.js`, `src/piece-art.js`, `src/board3d.js`, `src/royal-appearance.css` |
| Save/backup/recovery | `src/storage.js`, `src/backup.js`, `src/session-exit.js`, `src/history-mutation.js` |
| XP, learning, content validation | `src/progression.js`, `src/learning.js`, `scripts/validate-learning-pack.mjs` |
| PvP/resign protocol | `src/online.js`, `server/match.js`, `server/worker.js`, `scripts/smoke-local-rooms.mjs` |
| Android build/native lifecycle | `capacitor.config.json`, `src/native-lifecycle.js`, `scripts/build-android-release.sh`, `.github/workflows/android-debug.yml` |
| Original-art gate | `public/brand/board-maple-walnut.svg`, `public/brand/pieces/`, `scripts/check-original-art.mjs` |
| Static web security | `public/_headers`, `vite.config.js` |
| 30-screen and release evidence | `docs/V3_SCREEN_IMPLEMENTATION_MATRIX.md`, `docs/CH01_V3_RELEASE_GATES_EVIDENCE.md` |

## 5. Exact-head workflow evidence — no tests were run by this baseline task

| Workflow | Run head SHA | Result |
|---|---|---|
| [Android signing smoke (ephemeral CI key)](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/actions/runs/45020997795) | `3d9467ada0eaf167eecc52d6c98ed126fa98c98c` | completed / success |
| [Global Chess verification](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/actions/runs/45020997794) | `3d9467ada0eaf167eecc52d6c98ed126fa98c98c` | completed / success |
| [Android debug smoke build](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/actions/runs/45020997745) | `3d9467ada0eaf167eecc52d6c98ed126fa98c98c` | completed / success |

- [Core verification #45020997794](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/actions/runs/45020997794): **98/98 Node tests** at PR #18 original head, build, WebAssembly, original-art release gate, 12 lesson / 30 puzzle validation, 2D/3D Chromium, local two-seat Workers HTTP scenario all passed.
- [Android debug #45020997745](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/actions/runs/45020997745): successful API 36 debug APK construction, not physical-device certification.
- [Android ephemeral signing #45020997795](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/actions/runs/45020997795): successful disposable-key AAB smoke, not owner-signed Play release.
- Unit/browser/CI results are **source evidence**, not production release, TalkBack, real phone, live server load or human visual acceptance.
- Prior CI failures at older commits do not invalidate current-head green workflows; review current SHA, never last-known error.

## 6. Deployment separation and Cloudflare evidence boundary

- GitHub Releases API returned **0** releases. GitHub source branch `feat/chess-release-integration` is **not** by itself a deployed application.
- Inspected two currently connected Cloudflare accounts in read-only mode. No Workers script, Worker Domain or Pages project returned a Global-Chess-matching name/repository in those accounts (Workers scripts: 0 and 3; Worker domains: 0 and 1; Pages projects: 0 and 1, respectively). A project may exist outside the accounts accessible to this connection.
- GitHub deployments endpoint could not be read using the available GitHub connector allowlist; cannot certify absence of deployments on GitHub or other providers.
- **Production mapping status: UNVERIFIED.** No URL, deployment SHA, release ID, live private-room validation or Play publication is asserted. Relevant verification belongs to the deployment/release tasks.

## 7. Known integration risks / stop conditions

1. #2 and #12 REST `mergeable_state=dirty`; do not blind-merge/rebase or force-push.
2. #17 AdMob/UMP code is independently staged; do not silently enable paid ads or copy its SDK into web/PWA.
3. #18 combines previously separate save/journal/Android/art/3D/PvP changes; green CI is not an exhaustive code or device audit.
4. Historical README deletion on main means branch graph has one commit behind #18; do not assume main is deployable.
5. 602 original task IDs and 23 release gates are not fully accepted merely because a matrix exists.
6. Accessible Cloudflare account inventories do not establish a production mapping; do not invent deployed URLs.
7. Public repository and `package.json` `private: true` are distinct; do not commit secrets, keys or account data.

## 8. Rollback and mutation record

- **No app code or existing PR branch changed.** Only a documentation branch is created from exact `3d9467ada0eaf167eecc52d6c98ed126fa98c98c` for audit traceability.
- If the audit file requires correction, create a new document revision referencing this SHA. Do not change the 18 pinned PR head hashes retroactively.
- No deployment, main merge, key generation, store upload or database changes occurred.
- Rollback of docs-only PR: close its draft PR and delete only the new audit branch if desired; do not reset `main`, foundation or #18.

## 9. Task acceptance / checkpoint

| Criterion | Evidence |
|---|---|
| Current exact heads and PRs | GitHub pull requests list + branches list, current date |
| Ancestry and delta map | Compare foundation→#18 plus #15/#17 comparisons |
| Changed-file map | 71 exact files listed above, grouped by GitHub status |
| Conflicts noted | #2/#12 dirty; #18 clean relative to foundation |
| Current deployed state separated | GitHub releases 0; accessible Cloudflare inventories no matching named project; deployment unverified |
| Current checks linked | CI runs #45020997794, #45020997745, #45020997795 |
| No unapproved action | documentation branch only; no product mutations |

**Executor verification:** `GC-B01-T01 = DONE (baseline source pin only)`, signed at 2026-11-22T12:47:17Z. This does not close Batch 01; `GC-B01-T02…T08` remain untouched. Any future HEAD change requires a new refresh before implementation.

**Next eligible command only after T01 closure:** `START GC-B01-T02`. This document is not consent to automatically start it.
