# M-04 — Optional Ads / UMP / Native Monetization Release Contract

**Product:** Global Chess · **Date:** 2026-11-22 · **Canonical source baseline:** PR #15 `083a521d062da3066c15d7fdc188ba9abfa0aa53`.  
**Scope:** Android optional rewarded-only experiment; Web/PWA and ad-free Android remain ad-free. **No revenue or network approval has been assumed.**

## 1. Actual implementation and policy decisions

| Contract | Implementation | Safety property |
|---|---|---|
| M4-01 Guest gameplay is free | `monetization-policy.js`, Settings and Result | No login, lives, forced unlocks, XP advantage or auto ads |
| M4-02 Ads OFF by default | `resolveMonetizationConfig()` | No ad request without signed build mode, real native plugin and user preference |
| M4-03 Web/PWA excluded | `platform === android` + native Capacitor plugin check | Browser never loads ad SDK, interstitial or video |
| M4-04 Consent-first | native UMP `requestConsentInfo`; required `showConsentForm` | `canRequestAds===true` is mandatory before `initialize`, `prepare` or `show` |
| M4-05 Privacy choices accessible | Settings `Manage ad privacy choices` | User can revisit native Google privacy options (not falsely reset UMP data) |
| M4-06 Explicit opt-in | local `global-chess.optional-ads.v1` | A saved local preference is not legal/GDPR consent; opt-out ends future app ad requests |
| M4-07 Safe natural placement | `isNaturalAdBreak()` + `getMoment()` | **Only** completed **offline** Result screen; NEVER active board, countdown, puzzle, pause, setup or online room |
| M4-08 Never forced | Result CTA starts only on explicit click | No automatic video, interstitial, banner, app-open ad, deceptive countdown or ad-only game mode |
| M4-09 Optional honest reward | `commitSupporterReward()` | One cosmetic local Supporter Crest; no advantage, Elo, coins, hints or XP |
| M4-10 Durable, once-only | event result from `showRewardVideoAd()` **only**, no event double grant | Positive valid native reward before local IndexedDB commit; abort rolls back best-effort; fake/dismissed reward does not grant |
| M4-11 Fail-closed | native plugin/UMP/network/SDK errors captured | Chess still fully works; no crashes or spurious reward success |
| M4-12 Test builds | `CHESS_M4_ADS_TEST=true` on debug only | Official Google demo app+reward IDs; produces **no real revenue** |
| M4-13 Live build gate | `CHESS_M4_ADS_LIVE=true` + `validate-live-ad-config.mjs` | Owner AdMob account, Play audience, policy/privacy signoffs, HTTPS privacy URL and genuine app+reward unit IDs must all be present |
| M4-14 Native metadata | `configure-android-admob.mjs` after `cap sync` | AdMob app ID added only for **test** or **approved live** SDK builds |
| M4-15 Separate QA workflows | Core PWA + Android debug + Android signing smoke + native AdMob test CI | Web/ad-free/SDK-enabled build surfaces validated independently |
| M4-16 Bounded requests | 45s native load timeout, 180s reward callback timeout; 30s cooldown and maximum 3 app-session requests | Failed/dismissed native operations cannot indefinitely block game UI or trigger high-frequency ad loads |

### Technology / provider boundaries

- Native Android bridge: `@capacitor-community/admob@8.2.1` (Capacitor 8 compatible), with Google's Mobile Ads SDK and Google UMP. Only installed when explicitly requested by build flag.
- Android remains API 36. Capacitor runtime uses the installed native plugin or its injected `nativePromise` bridge, not a browser mock.
- Never call `resetConsentInfo()` in the shipping UI; it is a testing API. Do not infer consent from country, IP, local setting or an unchecked form.
- Ad providers/SDKs may collect device/ad data once loaded. Ensure actual approved privacy disclosures, data safety and applicable audience laws before ANY **live** enablement.
- A rewarded video is permitted only on a result screen when the player chooses it. This is a **local cosmetic acknowledgment**, **NOT server-verified cash/cryptocurrency or an anti-fraud-protected purchase**. Do not claim verified reward fraud prevention without a backend/SSV and Google signed callback validation.
- Supporter Crest stays in the current device's IndexedDB snapshot, but is intentionally NOT exported as transferable backup currency, identity or purchase entitlement. If the device storage is cleared, the decorative mark may be lost.
- The user may decline or stop ads and continue every core chess/learning feature.

## 2. Build modes (exact flags)

**Default browser/PWA / normal Android debug / normal signed AAB:** ads disabled; no AdMob native plugin in the Android build.

**M4 DEMO Android debug ONLY:** set `CHESS_M4_ADS_TEST=true` when running `bash scripts/build-android-debug.sh`. Installs AdMob 8.2.1 SDK, adds Google's documented test app ID `ca-app-pub-3940256099942544~3347511713`, and enables the official test rewarded ID `ca-app-pub-3940256099942544/5224354917`. User must still explicitly opt in in Settings and pass UMP before a request. **Test APK MUST NOT be published to Play** and cannot earn real revenue.

**Live Android AAB (NOT executed or approved here):**

In addition to the existing permanent owner package ID, version code and upload-keystore environment variables, set:
- `CHESS_M4_ADS_LIVE=true`
- `CHESS_ADMOB_ACCOUNT_APPROVAL=approved`
- `CHESS_AD_PRIVACY_POLICY_SIGNOFF=approved`
- `CHESS_AD_TARGET_AUDIENCE_SIGNOFF=approved`
- `CHESS_AD_PLAY_POLICY_SIGNOFF=approved`
- `CHESS_AD_PRIVACY_URL=https://<owner-public-policy-url>`
- `CHESS_ADMOB_APP_ID=ca-app-pub-<owner-id>~<app-id>`
- `CHESS_ADMOB_REWARDED_ID=ca-app-pub-<owner-id>/<reward-unit-id>`

The build refuses Google's demo IDs in live mode. The script does not independently establish that a user-provided `approved` flag is true in the Play Console. **Never commit access keys, keystores, API secrets or inferred approval.** Unlike upload-key passwords, AdMob application/unit IDs are identifiers rather than private credentials but must match the owner-approved account.

## 3. Human-required release blockers — not test successes

1. Real AdMob account setup/approval, correct app registration and production rewarded unit.
2. Publish/review the privacy policy and Google Play Data safety declarations covering Google SDK behavior; implement consent-message configuration in AdMob's Privacy & messaging portal.
3. Define Play target audience accurately; if children/unknown age included, evaluate and implement Families-compliant advertising, age treatment and appropriate SDK approval. This M4 branch **does not** certify child-directed monetization.
4. On a real Android 24+ API36-target device: opt-out / opt-in / required UMP form, EEA/regional geography if legally relevant, denied/no-network/no-fill, return from background, rotation, screen reader, and data deletion/SDK review.
5. Verify ad close/dismiss/failure produces **no award**, an actual earned reward produces one cosmetic mark **once**, persistence on process restart, simultaneous clicks, no accidental match clock restart or leaked modal focus.
6. Complete owner-signed Play AAB/closed test policies and actual production application ID/keystore. Test-signed CI AAB is NOT a store upload.
7. Review third-party SDK version, permissions (including advertising ID), SBOM/licensing, actual network traffic, battery/startup/memory impact and Play monetization disclosures.
8. Review user-facing screenshots and legal copy. No real impression, active AdMob account, real-world income or Play approval is asserted in this repo.

## 4. Test evidence and references

- Unit tests: `tests/monetization-policy.test.js`, `tests/monetization.test.js`; real Chromium default-no-ads smoke in `scripts/smoke-browser.mjs`.
- Android demo packaging: `.github/workflows/m04-admob-demo.yml`, `scripts/check-m04-native-demo.mjs`.
- Normal Android builds and signing smoke remain separate, with ad network disabled.
- Google UMP: https://developers.google.com/admob/android/privacy
- Capacitor AdMob 8.2.x: https://github.com/capacitor-community/admob
- Google Play Better Ads: https://support.google.com/googleplay/android-developer/answer/12271244
- Google Play Families: https://support.google.com/googleplay/android-developer/answer/9893335

**M4 code/test scope may become CI-verified while G21 remains externally BLOCKED. Do not transition from code-verified to production-enabled without every owner and device acceptance item above.**
