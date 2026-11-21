#!/usr/bin/env bash
set -euo pipefail
# Debug-only Android build. Does NOT produce a signed Play Store AAB.
# The preview app ID is intentionally NOT the product's final Play identifier.
npm ci --no-audit --no-fund
npm run build
# Pin all Capacitor components to a verified matching stable patch.
npm install --no-save --package-lock=false --no-audit --no-fund \
  @capacitor/core@8.6.2 @capacitor/android@8.6.2 @capacitor/cli@8.6.2 @capacitor/app@8.1.0
npx cap add android
npx cap sync android
# Google's Play submission target API is 36+ as of Nov 2026.
grep -q 'targetSdkVersion = 36' android/variables.gradle || {
  echo 'Capacitor template does not target required API 36; aborting.' >&2; exit 1;
}
(
  cd android
  ./gradlew --no-daemon --stacktrace assembleDebug
)
test -s android/app/build/outputs/apk/debug/app-debug.apk
echo 'Android DEBUG APK built. Real device tests and Play signing are NOT complete.'
