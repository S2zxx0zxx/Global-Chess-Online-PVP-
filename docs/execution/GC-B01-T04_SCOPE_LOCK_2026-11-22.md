# GC-B01-T04 — v3 MVP, P2/P3 and optional feature scope LOCK

**Permanent tag:** `GC-B01-T04` · **Master:** `GC-MASTER-EXEC-v1.0`  
**Prepared:** 2026-11-22 · **Source SHA:** `45ec74c002d7ffb0f0f5252dd6d03db3f6569526` on `integration/global-chess-v3`  
**Task acceptance:** Source-derived classified scope, explicit deferred-feature owners/reasons/release boundaries, signed Product Owner table.  
**Current state:** `DONE` **for scope classification and Product Owner approval only**, effective in this document as a release-boundary decision. This does not certify implementation, device QA, security, ads consent or store release.  
**No functionality removed.** All master workstreams survive; this document separates *first public release commitments* from *future planned development*, not whether all 122 engineering tasks will ever be executed.

## 1. Exact source contracts and priority of authority

1. **Original v3 source:** `Chess_FINAL_Master_Blueprint_v3_2026-11-18.md` (user-owned Library file), sections `01_PRODUCT_CHARTER_PRD`, `02_FEATURE_SCOPE_AND_USER_JOURNEYS`, `03_SCREEN_BY_SCREEN_UX_SPEC`, `13_ADR_DECISIONS_AND_RISKS`, `14_GOVERNANCE_GATE_HANDBOOK`. This defines `PRD-001–PRD-016`, `SCR-00–SCR-29`, milestone `M0→M5`, `LOCKED/PROPOSED/DEFERRED`.
2. **Execution master:** `Global_Chess_Sequential_Master_Execution_Plan_v1_0.md`, SHA-256 `f076a2a8f3672a3fa3fb325b05ae930f938c88a2d2521eab17fe8c55779cae59`. `GC-B01-T04` specifically requires signed v3 scope, each deferral with owner/reason/boundary.
3. **Source-to-code (not release approval):** [30-screen v3 source matrix](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/blob/45ec74c002d7ffb0f0f5252dd6d03db3f6569526/docs/V3_SCREEN_IMPLEMENTATION_MATRIX.md), [v3 G0–G22 release evidence](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/blob/45ec74c002d7ffb0f0f5252dd6d03db3f6569526/docs/CH01_V3_RELEASE_GATES_EVIDENCE.md), [PR1 readiness](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/blob/45ec74c002d7ffb0f0f5252dd6d03db3f6569526/docs/PR1_RELEASE_READINESS.md).
4. [PR #18](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/pull/18) source still open/draft, pinned original `3d9467ada0eaf167eecc52d6c98ed126fa98c98c`. Canonical branch adds T01/T02/T03 docs/CI but no game source; CI run [#45027958108](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/actions/runs/45027958108) attempt 2 SUCCESS, 98/98 Node tests and browser/Workers smoke. Passing CI is not final product/Android proof.
5. Original v3 source is a *design plan*, not a proved 602-task implementation tracker. Source ZIP `Chess_Final_Production_Ready_Planning_Pack_v3_2026-11-18.zip` and its `trackers/` matrix have **not** been completely reconciled here; `GC-B01-T07` owns full 602-row verification.

**Authority rule:** explicit user LOCKED constraints outrank proposed UI screenshot interpretation; source-selected first-release staging outranks accidental presence of experimental code; any change to full 122-task execution plan requires a versioned owner-signed scope change. Do not silently rewrite the user's wish to eventually complete every batch.

## 2. Product charter — LOCKED versus still PROPOSED

| Classification | Constraint | Effect |
|---|---|---|
| **LOCKED (source user decision)** | Offline-first, guest-first, **no required login/backend** for M0–M2 | Must be possible to play normal chess without an account or connection after installation |
| **LOCKED** | Web/PWA + separately installable Android, same chess domain/rule behavior | Do not treat a Web PWA as Android Play approval |
| **LOCKED** | Legal standard chess, reliable storage, no invented opponent or Elo/earnings | Gameplay/rules, save integrity, fair labels are release blockers |
| **LOCKED direction** | Premium original burgundy/walnut/gold appearance, no copying Chess Clash | Screens original, accessible; color/spacing values still require review |
| **SOURCE RELEASE BASELINE** | M0 offline → M1 Web beta → M2 Play → M3 verified coaching → M4 optional ads → M5 future public online | This **staged release cut is now Product Owner-approved by explicit chat command**; any later revisions require a separate versioned scope-change request |
| **PROPOSED DEFAULT** | Four-tab Home/Play/Learn/Profile, staged beginner curriculum, starter 12 lessons and 30 puzzles | Retain current good implementation; sign design/content acceptance later |
| **NOT APPROVED** | Shop, coins, gems, chests, purchase buttons, compulsory login, global Elo or live ads during M0–M2 | Do not surface as working features or claim commercial availability |

## 3. Proposed phased release boundaries (future tasks preserved)

| Milestone | Deliverable | Gate |
|---|---|---|
| **M0** | Offline playable foundation | Guest-first, standard legal board, local human, 3 labelled bot levels, save/recovery, no login, honest basic results, essential screens; **Release gate: exact source regression and device evidence, no P0/P1** |
| **M1** | Public Web/PWA beta | M0 plus timed Quick, replay/history/PGN, validated beginner content, puzzles/daily, local XP, backup+full privacy rights, support/legal, safe PWA update; **G0–G17 as applicable; no ads/public rated multiplayer required** |
| **M2** | Independent Android/Play | M1 plus native lifecycle, crash recovery, signed owner-key AAB, Play data safety, exact operator identity/store approval; **G18–G19 + Android/QA/legal; never treat debug AAB as production** |
| **M3** | Verified analysis + Mistake-to-Mission | Strong engine/accuracy evidence and adaptive learning; later release; **G20-P2; licensing and correctness mandatory** |
| **M4** | Optional monetization experiment | Native rewarded ads only if owner explicitly opts in, always voluntary and consent-gated; **G21-P2; otherwise disabled and skipped only after owner decision** |
| **M5** | Public network chess | Matchmaking/friends/ranked/leaderboards/anti-cheat/server ops after identity and funded authority; **G22-P3; existing private rooms do not prove release** |

**Release interpretation:** A feature may be implemented earlier for engineering dependencies, but it must not be *promised, activated or called launch-ready* until its corresponding milestone and gate. Conversely later mandatory master tasks (B03/B05/etc.) are **not cancelled**; they simply do not block the source-derived M1 Web release unless the owner changes scope. `M3/M4/M5` do not automatically become production release dates.

## 4. PRD-001–PRD-016 classification — authoritative proposed scope table

| Contract | Feature | Original v3 milestone | M0–M2 cut | Owner | Reason / boundary |
|---|---|---|---|---|---|
| `PRD-001` | Guest-first instant entry | `M0` | **CORE** | Client + Product | Never require login or network |
| `PRD-002` | Premium functional main lobby | `M0` | **CORE** | UX + Client | Original, responsive; no dead buttons or fake economy |
| `PRD-003` | Standard legal chess board | `M0` | **CORE** | Domain + QA | FIDE-like rules, legal outcomes, four promotions, board input |
| `PRD-004` | Same-device two-player | `M0` | **CORE** | Domain + Client | Offline pass-and-play; no imaginary online opponent |
| `PRD-005` | Three labelled offline AI levels | `M0` | **CORE** | Domain + QA | Bounded legal bot; no claimed Elo/expert strength |
| `PRD-006` | Quick timed local match | `M1` | **CORE_M1** | Domain + QA | Clock/background/restart fairness verified before it is advertised |
| `PRD-007` | Durable match recovery | `M0→M1` | **CORE** | Storage + QA | No silent data loss; safe fallback/backup/interruptions |
| `PRD-008` | Review/history/PGN export | `M1` | **CORE_M1** | Client + Storage | Real replay, persisted game record, honest non-engine labels |
| `PRD-009` | Beginner interactive curriculum | `M1` | **CORE_M1** | Learning + Editorial | Legally validated lessons, not a promise of limitless content |
| `PRD-010` | Curated tactics/puzzles | `M1` | **CORE_M1** | Learning + QA | Legal FEN/solutions, hints, explanatory output, provenance |
| `PRD-011` | Local XP/achievements | `M1` | **CORE_M1** | Progress + Storage | Idempotent local events, no unearned entitlements |
| `PRD-012` | Deterministic Daily puzzle | `M1` | **CORE_M1** | Learning + Storage | Defined local-day/time-zone and once-only semantics |
| `PRD-013` | Appearance/board themes | `M1 optional` | **CONDITIONAL_M1** | Design + QA | Original accessible default required; additional skins only with source rights and device parity |
| `PRD-014` | Mistake-to-Mission analysis | `M3` | **DEFER_FROM_M0_M2** | Domain AI + Learning | Requires licensed reliable evaluation and verifiable learning feedback |
| `PRD-015` | Advertising | `M4 optional` | **NOT_APPROVED_M0_M2** | Product + Privacy/Release | Ads off until consent, SDK, data-safety, owner yes/no approval |
| `PRD-016` | Online multiplayer/social/shop | `M5 future` | **NOT_APPROVED_M0_M2** | Online + Security/Product | Backend authority, abuse, cost and honest economy prerequisites |

Machine-readable: [`GC-B01-T04_PRD_SCOPE_MATRIX.csv`](GC-B01-T04_PRD_SCOPE_MATRIX.csv).

### Minimal safe first-release product contract

- Launch is genuinely **playable offline**, not simply reachable: all legal moves, promotions, draw rules, results, local bot boundedness, friendly local 2-player, saved-game recovery, real backup, no account/network prerequisite and accessible board input.
- No irreversible data loss when importing, updating or changing tabs; transparent session-only warning when storage is unavailable. Optional cloud sync cannot be presented as local persistence.
- UI controls work. M0–M2 hide unimplemented shop, fake coins/online Elo, friend buttons and ads. Experimental private-room code may remain behind safe explicit controls but no public rated/available claim is permitted.
- Core original chess assets and usable dark/light contrast are required; **additional animated/premium skins are conditional**, not an excuse to ship broken default artwork.
- Public Web beta requires legal/support/privacy notices, verified versioning, local-data rights (full export/delete—not only match backup), real PWA install/update and supported-device QA.
- Play release requires permanent package ID, owned key, real Android devices, data-safety/store approval and explicit operator signoff. None is implied by a green debug or throwaway CI bundle.
- Current screen matrix: all **30/30 mapped** to existing source, **0/30 FINAL accepted**. No screen can be declared complete merely by being mapped.

## 5. All 30 original screen contracts preserved

| Screens | Original contract | Initial target | Owner roles | Must still satisfy |
|---|---|---|---|---|
| `SCR-00–02` | Boot / Guest Welcome / First Tutorial | M0 | Client, UX, QA | Real cold start, guest fallback, skippable tutorial, accessible links; no required login |
| `SCR-03–06` | Home / Play / Setup / VS | M0; Quick timer M1 | Client, UX, Domain | Premium original UI; accurate opponent labels; no dead feature paths |
| `SCR-07–11` | Board / Promotion / Menu / Pause / Result | M0 | Domain, Client, QA | Legal local chess, clock/outcome and Android lifecycle evidence; no false win/reward |
| `SCR-12–13` | Replay / History | M1 | Client, Storage | Validated PGN/review, local retention and repair; no fake engine critiques |
| `SCR-14–18` | Learn / Lesson / Puzzle / Puzzle Result | M1 | Learning, Editorial, QA | Starter content validity, hints, alt line policy, original provenance |
| `SCR-19` | Daily Challenge | M1 | Learning, Storage | Versioned local day and once-only completion |
| `SCR-20` | Local Profile | M0/M1 | Client, Product | Local identity truthful; cloud never implied |
| `SCR-21–22` | Progress / Achievements | M1 | Progress, Storage | Local idempotent XP/achievements, no global rating |
| `SCR-23` | Appearance | M1 optional alternatives | Design, Licensing, QA | Default original board essential; optional cosmetic variants require full parity |
| `SCR-24` | Settings | M0 | Client, Accessibility | Gameplay/visual/accessibility controls, no destructive Restore Defaults |
| `SCR-25–26` | Data Privacy / Import Export | M1 before public beta | Privacy, Storage, Client | Full local archive/export/delete and legal notices; match-only backup not a full-data archive |
| `SCR-27` | Recovery | M0/M1 | Storage, QA | On-device safe-mode/error and no destructive recovery |
| `SCR-28` | PWA Update | M1 | Web, QA | Staged-update save safety and versioned production rollback |
| `SCR-29` | About / Support / Licenses | M1 | Product, Legal, Release | Verified build ID, support, third-party notices; no invented operator |

**Do not equate 30 routes with 30 accepted screens.** Each SCR has mandatory first-run/return/empty/error/offline, 320/360/412+ viewport, large text, keyboard/TalkBack and native Back/reduced-motion behavior as applicable. Conditional future routes cannot be visible with dead CTAs.

## 6. Deferral register — each deferred feature has an owner, reason and release boundary

| Deferral ID | Capability | Phase/gate | Linked tasks | Accountable owner role | Why not in first release | Hard release boundary |
|---|---|---|---|---|---|---|
| `D01` | Engine-backed analysis, Best/Brilliant/accuracy, expert bot calibration | **M3 / G20-P2** | `GC-B02-T04–T08, GC-B04-T08–T09` | Domain AI + Learning owner | Strong evaluated engine/metric and license not yet validated; no fabricated accuracy or Elo | Never marketed in M0–M2; later release only after independent proof |
| `D02` | Mistake-to-Mission personalized missions | **M3 / G20-P2** | `GC-B04-T08–T10` | Learning + Domain owner | Requires proven mistake detection and legal-generated puzzle replay | M0–M2: excluded from promise, not deleted from master plan |
| `D03` | Account login, cloud sync, cross-device progression | **Post M2, opt-in / M5 expansion** | `GC-B03-T01–T09` | Identity + Security owner | Original v3 locked no-login/no-backend M0–M2; needs consent, backend budget and migration policy | Not allowed to gate offline play or claim synced progress on M0–M2 |
| `D04` | Public matchmaking, friends, rated play, ratings, leaderboards and anti-cheat | **M5 / G22-P3** | `GC-B05-T01–T10` | Online + Security/Infra owner | Needs backend authority, abuse controls, stable ops, identity and cost approval | Do not market/open in M0–M2; existing private-room prototype is not rated public launch |
| `D05` | AdMob/UMP rewarded ads and support crest | **M4 / G21-P2** | `GC-B08-T01–T08 / optional PR #17` | Product + Privacy/Release owner | Separate owner yes/no choice, consent and Android store approval required | Ads disabled on all M0–M2 targets; do not merge optional PR #17 early |
| `D06` | Shop, coins, gems, chests, premium purchase economy | **No approved milestone; later commercial proposal** | `GC-B08 scope review / separate owner change control` | Product + Legal/Payments owner | Chess Clash screenshots are visual inspiration, not approval; economy, entitlements/payment/abuse missing | Not a product requirement until explicit owner-approved new PRD/ADR; hidden |
| `D07` | Additional paid cosmetics/optional theme bundles beyond default | **M1 optional / after asset evidence** | `GC-B06-T01–T10, GC-B07-T25` | Design + Legal owner | Default original art mandatory; extra variants require provenance/low-end device acceptance | Do not block safe first-play core for optional variants; do not claim full art pack complete |
| `D08` | Hindi/multilingual packs | **Post English M1 unless owner-approved locale scope** | `GC-B07-T26 / versioned scope request` | Localization + Accessibility owner | v3 says readable English first; translations need glossary/font/screen-reader review | No multilingual claim in M0–M2 |
| `D09` | Android Play production publication if budget/eligibility absent | **M2 / G18–G19** | `GC-B09-T07–T12; GC-B10-T04,T11–T14` | Release + Legal/Product owner | Play fee/account eligibility, permanent key, store disclosure and real-device evidence | M1 Web beta may proceed with its own gates; Android release stays blocked, never fake published |
| `D10` | Public hosted PvP for existing private-room code | **M5 / G22-P3** | `GC-B05-T01–T10; GC-B09-T03–T06; GC-B10-T08` | Online + Infra owner | HTTP local two-seat smoke != deployed secure global multiplayer; no recurring budget authorized | Private-room code kept in repo but release exposure must be disabled or separately approved/tested |
| `D11` | Stockfish/GPL or another third-party engine binary | **Only after license/architecture approval** | `GC-B02-T06; GC-B01-T05` | Domain + Licensing owner | Commercial redistribution obligations; current bounded bot is working | No unreviewed engine binary in M0–M2 or Android package |
| `D12` | Separate unverified user-reference screens and art | **Never copy without independent rights and approved feature scope** | `GC-B06-T01–T10, GC-B07-T01,T32` | Brand + Legal owner | Third-party visuals not license; prevent imitation/unapproved shop promises | Only original art/safe patterns distributed |

**Mandatory release gates never waived by deferral:** legitimate chess, no data loss, accessibility of core moves, original rights, privacy/terms/data rights, native safety for Android, truthful backend/no fake online opponent and no unapproved paid service. If any fail, the applicable release gate remains NO-GO.

## 7. Master workstream crosswalk — no task group silently deleted

| Batch | IDs | Task deliverable | Milestone relationship | Contract |
|---|---|---|---|---|
| `GC-B01` | `T01–T08` | Planning/source governance | **M0–M2 prerequisite** | T03 OWNER-SKIPPED unresolved, T04 scope proposed; B01-GATE NO_GO |
| `GC-B02` | `T01–T03` | Local rules/Undo policy | **M0/M1** | Fair local undo may be conditional by mode; no ranked unfairness |
| `GC-B02` | `T04–T09` | Stronger bot + analysis + gameplay gate | **M3 advanced, M0 bot QA retained** | No fake strength/Elo and no unapproved engine |
| `GC-B03` | `T01–T09` | Accounts/cloud profile/sync | **Post M2 / M5 unless separately approved** | Do not require authentication for offline chess |
| `GC-B04` | `T01–T07,T10` | Validated lessons/puzzles/daily | **M1; richer packs later** | Starter content license correctness required |
| `GC-B04` | `T08–T09` | Mistake-to-Mission detection/loop | **M3** | Licensed analysis/data contracts before promotion |
| `GC-B05` | `T01–T10` | Online network, matchmaking/rating | **M5** | Private room experimental code isolated from public claims |
| `GC-B06` | `T01–T10` | Original art/animation/rights | **M0/M1 basics; M2 device; extras conditional** | No competitor art; art owner signoff |
| `GC-B07` | `T01–T32` | All 30 screens and consistency | **M0/M1 screens; M2 native** | All 30 remain acceptance obligations, no dead screens |
| `GC-B08` | `T01–T08` | Optional ads | **M4 (if owner approves)** | Never enable live Ads during M0–M2 |
| `GC-B09` | `T01–T12` | Web+Play+operations | **M1 Web / M2 Android** | Gates and external eligibility respected |
| `GC-B10` | `T01–T14` | Full QA / release acceptance | **Each release independently** | 602 source ledger and G0–G22; conditional P2/P3 gates only if enabled |

**Conflict requiring explicit owner decision:** The new sequential 122-task plan places advanced bot/analysis and cloud identity *before* M1 UI/release batches; original v3 stages these features after M2. This **does not grant permission to reorder or skip B02/B03**. Treat this MD as a *release promise/capability lock*, not a reordering of engineering work; if the owner wants a fast M1 launch before finishing B03–B05, the master execution order needs a separately signed versioned change request. Until then the 122-task sequencing remains the active engineering order, and B01-GATE stays NO-GO.

## 8. Owner-directed exception: T03 skipped to work on T04

**User request:** `Skip kro 3 ko ispe kaam start kro START GC-B01-T04`.  
This authorizes starting **scope documentation on T04 only**. It **does not** certify T03, authorize unprotected release merges, or waive the B01 hard gate.

- `GC-B01-T03`: `BLOCKED_EXTERNAL`, with `owner_skip_for_nonrelease_planning: true` and `not_DONE: true`. Canonical is protected; `main` still reports `protected=false` in live GitHub.
- `GC-B01-T04`: `AWAITING_OWNER_SIGNOFF`, source-derived draft prepared. Only scope work is authorized in this session.
- `GC-B01-GATE`: **NO_GO / NOT_ELIGIBLE**. `T05` and all later tasks remain TODO and are not implicitly unlocked.
- Exception owner: **Product Owner**, authorized command in this chat; rationale: avoid blocking non-destructive scoping while main protection is pending. Boundary: **planning only**, not security/release bypass.

## 9. Task acceptance, explicit owner approval and rollback

**Scope approval command received:** `APPROVE GC-B01-T04-SCOPE-v1.0` from the Product Owner in this ChatGPT conversation on 22 Nov 2026. This is **explicit user authorization for this scope classification**, not a GitHub-approved review by an independent person and not approval to activate optional services. No legal personal name/signature is invented.

**Decision record:**

```yaml
scope_version: GC-B01-T04-v1.0
scope_state: OWNER_APPROVED_LOCKED
owner_decision: APPROVED
approved_by: Product Owner (explicit ChatGPT user command)
approved_at_utc: "2026-11-22T14:28:39Z"
approval_evidence_type: user_chat_instruction
approval_command: APPROVE GC-B01-T04-SCOPE-v1.0
approved_pr: 24
approved_pre_signoff_head_sha: 5db79bea071fe0f17153e0092ac3f0ee21623d7d
approved_m0_m2_contract: "M0 offline guest + legal chess + local bot and pass/play; M1 Web/PWA beta plus validated learning/history/privacy; M2 independently gated Android Play release"
approved_m3_coaching_status: "post-M2 verified analysis and Mistake-to-Mission only after license/correctness evidence"
approved_m4_ads_status: "OPTIONAL, OFF by default; this approval is NOT permission to activate AdMob, collect consent, or monetize"
approved_m5_online_status: "later network multiplayer, rankings, friends, authority and anti-cheat after separate funding/security approval"
approved_owner_role_mapping: "approved roles and all 12 deferral entries in section 6"
approved_PRD_classifications: "PRD-001 through PRD-016 as listed in section 4 and CSV"
approved_screen_contract_coverage: "SCR-00 through SCR-29 source obligation kept, not final acceptance"
unchanged_master_tasks: 122
original_602_task_tracker_audit: NOT_CLAIMED
t03_governance_status: BLOCKED_EXTERNAL_OWNER_SKIPPED_FOR_T04_ONLY
main_protection_status_at_signoff: UNPROTECTED
release_authorization: NONE
next_task_started: NONE
```

**Approval interpretation:** This locks the *release scope and boundaries*, while **all 122 sequential master tasks remain tracked**. It does not authorize changing the original 602 task row statuses, skipping implementation gates, turning on ads, using live payments, publishing the game, changing the release branch, or claiming global PvP is available.

| T04 must-pass | Evidence / status |
|---|---|
| Exact original v3 source PRD/milestone/ADR reviewed | **VERIFIED** in T04 source comparison |
| PRD-001–016 classified | **16/16 DOCUMENTED**, matrix CSV |
| SCR-00–29 coverage and owner roles | **30/30 MAPPED**, not FINAL accepted |
| Deferrals with owner, reason, milestone and gate | **12/12 DOCUMENTED** |
| MVP/M3/M4/M5 release boundaries | **OWNER APPROVED** by command above |
| Product Owner scope signoff | **APPROVED**, original chat instruction logged above |
| Exact PR #24 baseline CI (before signoff edit) | [Run #45030661367](https://github.com/S2zxx0zxx/Global-Chess-Online-PVP-/actions/runs/45030661367) **SUCCESS** at `5db79bea071fe0f17153e0092ac3f0ee21623d7d` |
| Exact post-signoff PR head CI and final merge evidence | **VERIFY AFTER THIS DOCUMENT COMMIT**; do not inherit a previous SHA's green status |
| Original 602-row task tracker independently accepted | **NO**; future `GC-B01-T07` |
| T03 / B01 gate closed | **NO**; protected `main` and T03 review outstanding |

**Task completion decision:** `GC-B01-T04 = OWNER-APPROVED SCOPE; PENDING POST-SIGNOFF CI/MERGE`. Once exact-head CI and approved documentation-only squash merge are verified, mark T04 `DONE (SCOPE LOCK)` in `GC_EXECUTION_LEDGER.md`; no other engineering task is completed by this signoff.

**Rollback:** Before merge, revert the signoff changes via reviewed PR or close PR #24 only if owner withdraws authorization. After merge, record a versioned `GC-B01-T04-v1.1` scope amendment in a new reviewed PR rather than silently rewriting this user-approved v1.0 or force pushing. No save/database/branch history changes are acceptable as a scope rollback.

**Next-step safeguard:** T03 remains owner-skipped *for T04 planning only* and **not DONE**; `GC-B01-GATE = NOT_ELIGIBLE`. T05 is not started or automatically authorized. If the user later explicitly asks to skip T03 again to start T05, record a separate scoped exception without waiving security or release protections.
