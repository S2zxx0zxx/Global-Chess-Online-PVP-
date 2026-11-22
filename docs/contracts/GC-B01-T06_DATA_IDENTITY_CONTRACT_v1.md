# GC-B01-T06 — Versioned Data & Identity Contract Preflight v1.0

**Permanent task:** `GC-B01-T06` · **Master:** `GC-MASTER-EXEC-v1.0` §01.06  
**Source baseline:** `integration/global-chess-v3` at `1c0dfd7d8b1b3ab35c15de3be7ea80ad3dace394` before this task  
**Status:** `PREFLIGHT_CONTRACT` — schemas and guard tests, **not** a data migration, cloud identity deployment, or user data approval  
**Source priority:** original user-owned `Chess_FINAL_Master_Blueprint_v3_2026-11-18.md` §08 (offline storage/clock/Android), §10 (privacy/security), §13 ADR-011/ADR-019/ADR-025; T04 owner-approved M0→M5 release scope; actual pinned GitHub runtime code.

## 0. Scope and accountable owners

The task specifies **immutable local event IDs, migration versions, account-link boundaries, authoritative online state, privacy categories, and sync/conflict rules**. It does **not** implement cloud sync, login/OAuth, new SQLite, remote ratings, server migrations, or rewrite current user saves.

| Contract component | Current behavior? | Owner role / future implementation gate |
|---|---|---|
| Local chess save v1, history, progress v1, backup v2 | **CURRENT** | Storage + Gameplay; B01-T08 verifies regressions |
| Private room match with optimistic state version | **CURRENT EXPERIMENTAL** | PvP Server + Security; B05 release / risk control |
| Future immutable match/event envelope v1 | **PROPOSED, NOT USED** | Storage + Cloud Sync; B03 and B01-T07 evidence |
| Future opt-in account-link intent v1 | **PROPOSED, NOT USED** | Product + Auth/Security + Privacy; B03 |
| Data taxonomy, retention, deletion and cross-device merge rules | **PROPOSED POLICY** | Privacy + Data; B03/B07/B10 independent acceptance |
| Android SQLite logical schema from v3 blueprint | **DESIGN ONLY** | Native/storage; do not assume Android runtime already uses SQLite |

## 1. Exact source-backed CURRENT formats — never rewrite blindly

| Current format | Source authority | Exact constraints | Identity / risk |
|---|---|---|---|
| IndexedDB `global-chess` DB schema **1** | `src/storage.js` | Object store `saves`, key `snapshot`; values for three major `global-chess.*.v1` keys. Transaction compares previously committed key value with current snapshot before write | Stale-tab conflict prevents overwrite, but not cross-device CRDT |
| Match `global-chess.match.v1` | `src/game.js`, `src/backup.js` | JSON string: `version:1`, `mode:local|computer`, `moves`; optional clocks, promotion, player side, draw claim, resign, pause | No persistent `gameId` or per-move `eventId`; match's schema version is **not** room revision |
| History `global-chess.history.v1` | `src/history.js` | Most recent max **50** `{outcome,snapshot}` entries; immediate consecutive duplicate guarded by equal snapshot+outcome | **NO immutable history/event ID now.** Two identical nonadjacent games are not reliably distinguishable by content hash |
| Progress `global-chess.progress-events.v1` | `src/progression.js` | `{version:1,events:[{kind,exerciseId}]}`, kinds lesson/puzzle/daily, cap **4096**, once-only from `kind + ':' + exerciseId` | Natural ID **DERIVED**, not stored; no cryptographically verified XP/rating |
| Backup JSON **2**, import JSON **1/2** | `src/backup.js` | `{version:2,match:string|null,history:[],progress:{version:1,events:[]}}`; import capped at **2,000,000 chars** and history 50; live functions also validate inner moves. v1 import intentionally does **not** erase existing progress | Match/history are nested JSON **strings**; generic JSON Schema cannot validate their chess legality |
| Private room | `server/worker.js`, `server/match.js`, `src/online.js` | Server stores room + secret invite/seat tokens; match `version:0,1,2…` is **optimistic concurrency revision**, serverNow, moves, clocks; room expiry **24h** | Room `id` UUID is not account ID; seat secret is not OAuth token |
| Saved online seat | `src/online.js` | `global-chess.online-seat.v1` best-effort in sessionStorage **and localStorage**, holds `id,seat,credential,invite`; invite shared in URL fragment then cleared on join | **Sensitive bearer capability** retained on device; do not put in normal backup, telemetry or cloud event |
| Display preferences/profile | `src/app-shell.js`, `src/screen-routes.js` | Local nickname/avatar/frame, appearance, settings, setup flags, optional feedback toggle | Local profile is not authenticated account; default export does not cover all these keys |

**Important limitations:** `src/storage.js` can fall back to localStorage or **volatile memory-only** when IDB unavailable. Memory session must not be sold as durable. Default JSON backup covers active match/history/progress, **not all local profile/settings/seat records**; comprehensive export and full-profile delete remain **separate product/privacy gaps** (B07/B10). A local Chrome storage permission issue is not equivalent to data corruption.

### Machine-readable preflight schemas (under `docs/contracts/schemas/`)

- `legacy-match-save-v1.schema.json` — currently **emitted** local save shape. Runtime `restoreGame` remains authoritative for legal move replay and accepting legacy-compatible inputs.
- `legacy-progress-events-v1.schema.json` — current once-only exercise journal. Enforce additional logical dedupe via existing `readProgress`; `uniqueItems` alone is insufficient for equivalent events.
- `legacy-backup-v2.schema.json` — canonical output, not equivalent to accepted legacy v1 import or inner JSON chess validation.
- `current-private-room-state.schema.json` — observed room snapshot response shape; version counter is not document schema.
- `proposed-sync-event-v1.schema.json` — **NOT DEPLOYED** opt-in event transport contract.
- `proposed-account-link-intent-v1.schema.json` — **NOT DEPLOYED** consent intent. Client cannot assert a verified user identity; server must derive it from validated authentication.

Manifest: [`GC-B01-T06_CONTRACT_MANIFEST.v1.json`](GC-B01-T06_CONTRACT_MANIFEST.v1.json). The `global-chess.invalid` schema-ID host is an intentionally **non-resolving reserved documentation namespace**, not a real deployment, credential, app domain or payment endpoint.

## 2. Immutable IDs — CURRENT versus FUTURE

**Current progress identity is deterministic**: `kind + ':' + exerciseId`, with one journal event per unique pair; daily ID `daily-YYYY-MM-DD` follows device-local day. This dedupes local lesson/puzzle XP, but does not prove a remote account, prevent malicious local file editing, or guarantee cross-device event uniqueness.

**Current history entries and move list have no event IDs**. A UUID or cryptographic hash must **NOT** be retroactively claimed present. Never regenerate IDs on each read, use list position as enduring ID, or equate two separately played identical games because their snapshots look alike.

**Future opt-in model (B03 / source design §08, NOT CURRENT):**

1. Create a cryptographically random `deviceId` once and **durably persist it** before any sync queue is allowed. Device ID is pseudonymous, never a stable human/authentication identity.
2. For new game/move/history events, generate a fresh RFC4122 UUID `eventId` **once per attempted event**, persist atomically alongside immutable `gameId`, `positionVersion` and replay/snapshot data. Retry/reconnect must reuse the same eventId, not mint a second award.
3. When migrating legacy `{outcome,snapshot}` history with no ID, assign IDs **once in an atomic migration** with journal + old raw bytes preserved; do not derive uniqueness solely from board snapshots, index, clock, or wall-clock.
4. For old progress `kind:exerciseId`, retain the natural key for local and account-scoped once-only semantics. When upgrading to remote events, carry legacy stable dedup key and content-pack identity separately; never award double XP when the same exercise exists on two devices.
5. Keep `eventId` immutable; mutation/retraction is a distinct versioned event or tombstone with its own id. All XP/client stats are *untrusted local* until a separately defined server-verification product exists.
6. `server.match.version` means online revision, not schemaVersion; `local.match.version=1` is a file shape. Never alias these in an API without namespacing.

## 3. Version matrix and non-destructive migration plan

| Layer | Currently shipped format | Future target | Status |
|---|---|---|---|
| IndexedDB database | `global-chess` **1** | `2+` with append journal and per-entity revision | **PLANNED ONLY** |
| Local saved match JSON | **1** | `2+` with `gameId,positionVersion,events` | **PLANNED ONLY** |
| Local progression JSON | **1** | Later progress journal envelope with stable scoped IDs | **PLANNED ONLY** |
| Backup export | **2**, legacy **1** imported | `3+` when full profile/metadata migration approved | **PLANNED ONLY** |
| Current server room match | `match.version` mutable integer | Independent `protocolSchemaVersion` only if separately versioned | **PLANNED ONLY** |
| Future sync/event envelope | N/A | `schemaVersion:1` design document | **NOT DEPLOYED** |
| Account-link intent | N/A | `schemaVersion:1` design document | **NOT DEPLOYED** |

**Migration minimum gate before B03 implementation:**

- Exact source and old bytes capture first (user-approved backup or safe copy-on-write); supported fresh install and version upgrades `1→2`, later `1→3` and interrupted upgrade/retry; no database wipe/reset.
- Migration transaction: validate input, clone/protect old values, assign IDs once, replay/validate legal moves, commit only when journal+snapshot+new pointer all durable, then record migration id/revision. Crash before commit retains previous readable version; retries are idempotent.
- IndexedDB `versionchange` across tabs closes stale handles; compare-and-swap and stale-tab conflict notice must remain. No automatic last-write-wins over a fresher saved game.
- Backward compatible *read* for old backups. Forward-incompatible imports fail safely with export/recovery instructions and without user data deletion.
- Future Android native SQLite is **not current runtime storage**; schema parity and rollback must be demonstrated in Android real-device tests, not assumed because Capacitor builds.
- Explicit and separately approved migration PR, tests and data-disclosure review required; none performed in T06. Never call proposed schemas "live migrations".

## 4. Account link and consent boundaries — B03 future only

**LOCKED M0–M2:** guest-first local nickname/avatar and gameplay **without compulsory email, OAuth, internet or cloud profile**. No FinCoPilot/other project account/data reuse. A guest name, device UUID, room invitation or local XP is **not verified identity**.

Future linking is **explicit consent**, never automatic on visiting a page:

1. A verified external login session must be validated **server-side** (issuer, audience, expiry, nonce/state/CSRF and authorized session); do not trust `accountSubject`, email or role supplied by client JSON. Provider and credentials deliberately **UNDECIDED**; no mock production OAuth client IDs/secrets.
2. Preview a **local vs remote inventory** and estimated conflicts, explain retention/deletion, original player data source, and which domains will sync. Preview must be read-only with no remote overwrite and no session movement.
3. Require a separate confirm action bound to an immutable intent ID and current local snapshot revision. Recheck owner, authorization and revision on server. One consent cannot authorize unrelated data categories.
4. Linking guest to verified account cannot silently replace another account's progress, merge room seat credentials, or make an active offline match unplayable. Undo/disconnect must not delete local saves; user may export beforehand.
5. Revoke unlink tokens and queued sync; no upload if revoked. Account deletion, retention and consent withdrawal are separate explicit workflows. PII and privacy policy must match reality.
6. Client schema `proposed-account-link-intent-v1.schema.json` **intentionally contains no subject ID, OAuth token, password or email**; subject determined by authenticated server context. It is a consent *request shape*, not proof that OAuth exists.

## 5. Sync/conflict policy (NOT DEPLOYED)

| Data type | Proposed merge policy | Fail-closed handling |
|---|---|---|
| Local single-player active match | **Single-writer per game**; preserve each device's branch if both advanced; user selects active replay on conflict | No automatic "latest timestamp wins"; no deletion without confirmation |
| Historical completed matches | Append-only by immutable event/game ID; preserve two separate identical-looking matches | Dedupe by ID only, not by outcome or FEN hash |
| Lesson/puzzle progress | Account-scoped observed completion *set union* by stable exercise+content pack key, max once-only XP; never trust for money/rank | A malformed/upgraded journal quarantined for export, never discarded silently |
| Preference theme / nickname / avatar | User-chosen target device or manual per-field resolution, no cross-account implicit move | Deterministic default on missing data; no leaking old profile to another login |
| Deletion / tombstones | Explicit owner-initiated deletion, server-authenticated, versioned tombstone that dominates stale writes | Do not resurrect deleted records via stale offline queue; reconcile before upload |
| Online rated match (future M5) | **Server is sole authority** for position, clock, result, seat and rating | Local offline copies for replay only, not write-authoritative; reject stale version |
| Current private-room seat credentials | **Never synced** with user data/events, never exported as profile progress | Revoke/expire server room credential separately; do not treat shared device token as login |
| Unverified telemetry/ads IDs | **Excluded** from M0–M2 sync scope | Requires independent owner consent/privacy release gate |

**Synchronization failure:** bounded retries with exponential backoff only after consent, idempotent eventId, eventual reconciliation from server revision and explicit conflict UI. Never upload unvalidated chess data, never apply server timestamp to rewrite local history, never grant verified Elo from client XP. No synchronization service exists yet.

## 6. Online server-authoritative contract, current and planned

**Currently present:** Cloudflare Worker `server/worker.js` with Durable Object `Room`, `ROOM_CREATION_LIMIT` fail-closed rate limiter, max **2,048 bytes** request body, room expiry **86,400,000ms**, opaque random invite and seat tokens, authenticated `Authorization: Bearer` for room state/moves/claim/resign. `server/match.js` checks legal moves, side-to-move and expected `match.version`, server-owned clocks and outcome. Client `src/online.js` polls and rejects stale snapshots using version/serverNow; uses session/local storage to reconnect.

**Limitations, not release approval:** no global authenticated account, secure public ranked matchmaking, cross-device persistence, anti-cheat/rating, actual deployed PvP proof or owner-reviewed production retention policy. Seat token is a powerful bearer secret; anyone who copies it may impersonate that seat until room expiration. Hash invite is a bearer invitation, not a login. Browser localStorage is accessible to same-origin JS (CSP/XSS impact). Source TTL is **nominal room expiry** and does not imply every copy of credential is deleted from browser storage at that time.

**Future B05 safeguards:** server-derived identities and capabilities, replay/idempotency keys per action, request-version rejection, per-room authorization, rate/cost limits, no secrets logged, no URL/token exposure to analytics, revocation path and abuse protection. Do not mutate private-room current protocol in T06.

## 7. Privacy and retention taxonomy

| Category | Source/example | Present storage/exposure | Sensitivity | Export/delete/release rule |
|---|---|---|---|---|
| A — Local game | Moves, clock, history, PGN, last match | IDB snapshot/localStorage/memory; optional manual JSON/PGN export | Personal gameplay history | Backup includes match/history; history deletion implemented; full save erase separate |
| B — Local learning | Lessons, puzzles, daily solved, XP | `progress-events.v1` device-local | Potential behavioral profile | Backup v2 includes this; full-profile deletion not shown complete |
| C — Local personalization | Nickname, avatar/frame, preferences, theme/setup | Browser localStorage keys, **not** current backup v2 | Potential personal identifier | Must disclose partial export; cross-device account not active |
| D — Room capability secrets | Random seat bearer, invite token, room ID | Local session/localStorage and server Durable Object; invite fragment | **Secret / authorization capability** | Never include in backup, diagnostics, sync or screenshots; deletion/revoke UX future |
| E — Online gameplay | Room position, clocks, outcome, serverNow | Cloudflare room server when used (not just local) | Pseudonymous service state | Retention reviewed; current room TTL ≈24h; no global ranking |
| F — Hosting/server requests | IP/request metadata, rate limit key | Cloudflare when browser fetches site/API | Potentially personal metadata | Never claim "zero data ever processed"; configure actual provider retention in public policy |
| G — Auth/cloud identity | Emails, verified provider subject, consent, sync logs | **NOT IMPLEMENTED** | Sensitive personal account data if future | No collection/storage approved in T06; new B03 privacy and security gate |
| H — Ads/analytics | SDK identifiers, telemetry/consent events | **OFF / NOT AUTHORIZED for M0–M2** | Can be sensitive under local rules | Requires separately approved M4/Privacy/Store Data Safety |
| I — Recovery and bug diagnostics | Raw corrupted save or browser errors | Existing local recovery UI; future support channel undecided | May contain game/profile data | Do not auto-upload raw save, tokens or private match URLs |

**Data minimization:** No required email, location, contacts, microphone, camera, finance or other-project data for M0–M2. Public policy must accurately disclose Cloudflare requests, optional private room API use, Android backup behavior, and any consent-based future service. **No production privacy policy, export-all or deletion-all compliance is asserted here.**

## 8. Threat assumptions and countermeasures

| Threat | Current evidence | Invariant / next owner |
|---|---|---|
| Multi-tab lost updates | IDB compares values in same readwrite transaction; conflict event | Preserve single-writer/CAS; T08 stale-tab QA; B03 remote conflict |
| Save/backup crafted JSON | `previewBackup`, `readProgress`, `restoreGame` validate bounds/legality | No direct untrusted JSON into auth/server; test invalid migrations |
| Duplicate XP / forged ratings | Current natural key only once per journal; local XP can be modified | Dedupe future account progress; never treat as verified rank/currency |
| Crash during migration | No T06 runtime migration; design copy-on-write atomic | B03/Native owner must implement and fault-inject |
| Compromised browser origin/XSS | Seat tokens in localStorage/sessionStorage | CSP, robust text output, no token export/logging; move secrets to stronger mechanism only with tested design |
| Unauthorized online move | Server validates Bearer seat, expectedVersion, legal move | Server authority remains; no trust client clock/result |
| Shared device / account swapping | Local nickname not account; persistent online seat | Explicit consent and verified server account; never merge silently |
| Credential leakage via screenshots/links | Invite URL fragment and room access | Restrict link sharing, sanitize logging; expiry/revocation release gate |
| Data eviction/browser no storage | Memory-only fallback and warnings | Do not claim persisted XP; expose backup/recovery |
| GDPR/privacy/child/minor or other legal compliance | Only data taxonomy, no legal signoff | Legal owner and actual SDK/network disclosures before public launch |
| Overbroad cloud sync | No cloud service current | Opt-in domain-scoped sync; server verified subject, ID collision, tombstone policy |
| Cross-project credential/data reuse | Not required/approved | No FinCoPilot account/finance data attached to chess game |

**Review result:** These are **documented threat assumptions**, not a penetration test, verified legal compliance, or certified deployed OAuth. User-provided actual secrets or personal records were **not** accessed; tests must use synthetic examples only.

## 9. Acceptance checks, evidence, risks and rollback

- [x] Exact v3 blueprint and GC-MASTER §01.06 read; source `main`, canonical branch and T05 completion verified at live GitHub HEAD.
- [x] All current v1/v2 shapes and storage keys cross-referenced with `src/game.js`, `backup.js`, `progression.js`, `history.js`, `storage.js`, `online.js`, `server/worker.js`, `server/match.js`.
- [x] Machine-readable `GC-B01-T06_CONTRACT_MANIFEST.v1.json` and six JSON Schema Draft-2020-12 descriptors: 4 existing format descriptors, 2 **future-only** proposal shapes.
- [x] Explicit stable ID contract, migration ordering and version matrix, account link boundaries, offline authority and server PvP responsibilities.
- [x] Conflict/tombstone/consent policy and privacy categories, no actual user data/mock live OAuth credentials.
- [x] Node suite `tests/data-identity-contract.test.js` added to assert source/manifest matching, malformed records rejection, synthetic legacy backup roundtrip and room version guard.
- [ ] Final exact task PR head CI checks / protected canonical squash merge / post-merge CI verification (required before DONE).
- [ ] Independent product/legal/security signoff for *future implementation* is NOT part of T06's design-only DoD and must not be implied.

**Limitations:** JSON Schema files describe shape; existing runtime validation remains authoritative. The added zero-dependency tests validate selected schema structure and current runtime examples; they are **not a full JSON Schema standards-validation engine**. Static schemas do not implement storage migration or authenticate users.

**Rollback:** unmerged PR may be closed leaving canonical untouched; after protected squash-merge, new reviewer-approved revert PR of T06-only files. No destructive resets, room token changes, Android package signing, new paid service, cloud uploads or user-state data movement.

**Owner-directed predecessor exception:** User issued `START GC-B01-T06` while `GC-B01-T03` remains `BLOCKED_EXTERNAL` due to `main` protection; treat as T06 **nonrelease contract-only** authorization. **No claim that T03 is DONE**, no production bypass, no B01-GATE GO, no T07 start.

**Current task state:** `IN_PROGRESS` pending exact-head CI/PR integration. T03 remains unresolved. Release not certified.
