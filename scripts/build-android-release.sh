#!/usr/bin/env bash
set -euo pipefail
# This script creates a signed release AAB only when an actual permanent ID,
# Play upload keystore and version code are provided. No secrets are committed.
: "${GAME_ANDROID_APP_ID:?Final approved application ID is mandatory}"
: "${GAME_ANDROID_VERSION_CODE:?Android version code is mandatory}"
: "${GAME_UPLOAD_KEYSTORE_B64:?Upload keystore secret is mandatory}"
: "${GAME_UPLOAD_STORE_PASSWORD:?Upload store password is mandatory}"
: "${GAME_UPLOAD_KEY_ALIAS:?Upload key alias is mandatory}"
: "${GAME_UPLOAD_KEY_PASSWORD:?Upload key password is mandatory}"
if ! [[ "$GAME_ANDROID_APP_ID" =~ ^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*){2,}$ ]]; then
  echo 'Invalid permanent Android application ID' >&2; exit 1
fi
if [[ "$GAME_ANDROID_APP_ID" == dev.globalchess.preview ]]; then
  echo 'Debug preview app ID is forbidden for a Play release' >&2; exit 1
fi
if ! [[ "$GAME_ANDROID_VERSION_CODE" =~ ^[1-9][0-9]{0,8}$ ]]; then
  echo 'Version code must be a positive nine-digit integer or shorter' >&2; exit 1
fi
npm ci --no-audit --no-fund
npm run build
node scripts/check-original-art.mjs
npm install --no-save --package-lock=false --no-audit --no-fund \
  @capacitor/core@8.6.2 @capacitor/android@8.6.2 @capacitor/cli@8.6.2 @capacitor/app@8.1.0 @resvg/resvg-js@2.6.2
node - <<'JS'
import fs from 'node:fs';
const path='capacitor.config.json';
const cfg=JSON.parse(fs.readFileSync(path,'utf8'));
cfg.appId=process.env.GAME_ANDROID_APP_ID;
cfg.appName='Global Chess'; // Brand/app-title approval remains a separate Play gate.
fs.writeFileSync(path,JSON.stringify(cfg,null,2)+'\n');
JS
npx cap add android
npx cap sync android
node scripts/generate-android-assets.mjs
if ! grep -q 'targetSdkVersion = 36' android/variables.gradle; then
  echo 'Target API 36 build contract failed' >&2; exit 1
fi
keyfile="${RUNNER_TEMP:-/tmp}/chess-upload-$$.jks"
cleanup(){ rm -f "$keyfile"; }
trap cleanup EXIT
umask 077
printf '%s' "$GAME_UPLOAD_KEYSTORE_B64" | base64 --decode > "$keyfile"
test -s "$keyfile" || { echo 'Upload keystore is invalid' >&2; exit 1; }
export GAME_UPLOAD_KEYFILE="$keyfile"
cat >> android/app/build.gradle <<'GRADLE'

// CI-only upload-signing config. Passwords are environment variables, not source.
android {
    signingConfigs {
        chessUpload {
            storeFile file(System.getenv("GAME_UPLOAD_KEYFILE"))
            storePassword System.getenv("GAME_UPLOAD_STORE_PASSWORD")
            keyAlias System.getenv("GAME_UPLOAD_KEY_ALIAS")
            keyPassword System.getenv("GAME_UPLOAD_KEY_PASSWORD")
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.chessUpload
        }
    }
    defaultConfig {
        versionCode Integer.parseInt(System.getenv("GAME_ANDROID_VERSION_CODE"))
    }
}
GRADLE
(cd android && ./gradlew --no-daemon --stacktrace bundleRelease)
bundle='android/app/build/outputs/bundle/release/app-release.aab'
test -s "$bundle"
# A self-signed upload-key certificate is not expected to chain to a public CA.
# Verify the JAR signature integrity without treating that expected trust warning as a failure.
verification_log="${RUNNER_TEMP:-/tmp}/chess-bundle-verify-$.log"
trap 'rm -f "$keyfile" "$verification_log"' EXIT
jarsigner -verify -verbose "$bundle" > "$verification_log"
grep -q 'jar verified.' "$verification_log" || {
  echo 'Bundle signature verification failed' >&2; exit 1
}
echo 'Signed AAB generated and JAR signature verified; no Play upload performed.'
