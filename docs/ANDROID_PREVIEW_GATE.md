# Android Debug Preview — not a Play-ready production release

This branch adds a **temporary**, isolated Capacitor v8 debug-build pathway to exercise the
same offline assets used by the Vite/PWA build. It intentionally does **not** change the web
deployment, does **not** send offline moves to a server and does **not** publish a Play app.

## Runtime

- Generated native wrapper by pinned Capacitor 8.6.2 (CLI, Android and Core).
- `capacitor.config.json` app ID is **dev.globalchess.preview**, reserved solely for the
  debug build and **NOT approved** as the final Play application ID.
- Asset path: built `dist/`, copied by `npx cap sync android`; no remote server URL.
- Debug APK created in GitHub Actions, retained for seven days.
- Debug builds use standard Android debug signing, which is **not valid for Play release**.

## Android production exit gates (blocked until actual evidence)

1. Decide the **permanent** application ID and legal public game brand, with trademark preflight.
2. Commit/maintain generated native project, app lifecycle and Android Back/recovery handling.
3. Original adaptive/maskable icons, branded splash; contrast, launch orientation and content safety.
4. Physical devices (low/mid Android), no-network startup, rotation, resume after process kill,
   TalkBack, OS 24+ and target 36 behavior, benchmark GPU/physics, WebView compatibility.
5. Generate upload keystore **outside VCS**; store its encrypted backup and credentials securely.
6. Produce an upload-signed AAB with unique versionCode, verify signing and min/target SDK.
7. Complete real policy documentation, store listing, Data Safety, Privacy/Terms,
   content rating and Play Console eligibility.
8. For applicable new personal Play Console accounts, 12 opted-in testers continuously for
   14 days, production-access approval, staged rollout and monitoring.
9. Do not call debug APK or unsigned AAB a signed production release.

Official references:
- https://capacitorjs.com/docs/android
- https://capacitorjs.com/docs/getting-started/environment-setup
- https://support.google.com/googleplay/android-developer/answer/11926878
- https://support.google.com/googleplay/android-developer/answer/14151465
