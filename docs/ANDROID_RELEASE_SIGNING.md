# Global Chess — Android release signing control

Status: AAB signing *pipeline*, not Play publication/production certification.

## Android bundle controls
- CI smoke runs `scripts/build-android-release.sh` with a disposable one-day key,
  temporary `dev.globalchess.releaseci` app ID and versionCode 1.
  **This artifact must NEVER be uploaded to Google Play.**
- Production workflow is manual-only: `android-production-release.yml`.
  Configure the GitHub Environment **android-production-approval** with review
  requirements before enabling production builds.
- Four repository/environment secrets are required:
  `GAME_ANDROID_UPLOAD_KEYSTORE_B64`, `GAME_ANDROID_UPLOAD_STORE_PASSWORD`,
  `GAME_ANDROID_UPLOAD_KEY_ALIAS`, `GAME_ANDROID_UPLOAD_KEY_PASSWORD`.
- Inputs must include owner-approved immutable app ID, positive unique Play versionCode,
  and public brand/legal identity cleared separately. No secrets are ever written to source.
- Upload-signed bundle is retained by Actions for one day and is NOT deployed automatically.

## Still mandatory before real production
1. Owner approves final applicationId and user-facing app name after trademark checks.
2. Existing keystore is backed up securely with independent recovery procedure;
   use an upload key compatible with the Play App Signing enrollment.
3. Android manifest, privacy/data safety, app permissions, legal notices, adaptive icon,
   accessibility and device test evidence are signed off.
4. Actual Play Console registration and any required 12-person/14-day closed test
   are completed; package ID and versionCode checked against Play before upload.
5. Process-kill restoration, background/resume, native Back, deep links, low-memory
   performance, 3D WebView and Google Play internal track tests pass on real devices.
6. Third-party licenses for Babylon.js, Havok, chess.js, Web fonts/art/engine WASM verified.
7. Production publishing requires external authorization; this job never does it.

Official references: https://capacitorjs.com/docs/android
https://support.google.com/googleplay/android-developer/answer/11926878
https://support.google.com/googleplay/android-developer/answer/14151465
