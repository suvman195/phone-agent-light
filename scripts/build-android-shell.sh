#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

if [ -f "$ROOT_DIR/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$ROOT_DIR/.env"
  set +a
fi

SDK_ROOT="$ROOT_DIR/.android-sdk"
BUILD_TOOLS_VERSION="35.0.0"
PLATFORM_VERSION="android-27"
APP_DIR="$ROOT_DIR/android-shell"
BUILD_DIR="$APP_DIR/build"
SOURCE_RES_DIR="$APP_DIR/res"
BUILD_RES_DIR="$BUILD_DIR/res"
GEN_DIR="$BUILD_DIR/gen"
CLASSES_DIR="$BUILD_DIR/classes"
DEX_DIR="$BUILD_DIR/dex"
DIST_DIR="$APP_DIR/dist"
KEYSTORE_PATH="$APP_DIR/debug.keystore"
CLASSES_JAR="$BUILD_DIR/classes.jar"
SHELL_URL="${SHELL_URL:-http://YOUR_COMPUTER_LAN_IP:8787/display-landscape.html}"

AAPT2="$SDK_ROOT/build-tools/$BUILD_TOOLS_VERSION/aapt2"
D8="$SDK_ROOT/build-tools/$BUILD_TOOLS_VERSION/d8"
ZIPALIGN="$SDK_ROOT/build-tools/$BUILD_TOOLS_VERSION/zipalign"
APKSIGNER="$SDK_ROOT/build-tools/$BUILD_TOOLS_VERSION/apksigner"
ANDROID_JAR="$SDK_ROOT/platforms/$PLATFORM_VERSION/android.jar"

mkdir -p "$BUILD_DIR" "$DIST_DIR"
rm -rf "$BUILD_RES_DIR" "$GEN_DIR" "$CLASSES_DIR" "$DEX_DIR"
rm -f "$CLASSES_JAR"
mkdir -p "$BUILD_RES_DIR" "$GEN_DIR" "$CLASSES_DIR" "$DEX_DIR"

if [ ! -f "$ANDROID_JAR" ]; then
  echo "Missing Android platform jar: $ANDROID_JAR" >&2
  exit 1
fi

if [ ! -f "$KEYSTORE_PATH" ]; then
  keytool -genkeypair \
    -keystore "$KEYSTORE_PATH" \
    -storepass android \
    -keypass android \
    -alias androiddebugkey \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -dname "CN=Phone Agent Light Debug, OU=Development, O=Open Source, L=Local, ST=Local, C=US"
fi

xml_escape() {
  printf '%s' "$1" | sed \
    -e 's/&/\&amp;/g' \
    -e 's/</\&lt;/g' \
    -e 's/>/\&gt;/g' \
    -e 's/"/\&quot;/g' \
    -e "s/'/\&apos;/g"
}

cp -R "$SOURCE_RES_DIR"/. "$BUILD_RES_DIR"/
SHELL_URL_XML="$(xml_escape "$SHELL_URL")"
SHELL_URL_XML="$SHELL_URL_XML" perl -0pi -e 's/__SHELL_URL__/$ENV{SHELL_URL_XML}/g' "$BUILD_RES_DIR/values/strings.xml"

"$AAPT2" compile \
  --dir "$BUILD_RES_DIR" \
  -o "$BUILD_DIR/resources.zip"

"$AAPT2" link \
  -I "$ANDROID_JAR" \
  --manifest "$APP_DIR/AndroidManifest.xml" \
  --java "$GEN_DIR" \
  --min-sdk-version 27 \
  --target-sdk-version 27 \
  -o "$BUILD_DIR/app-unsigned.apk" \
  "$BUILD_DIR/resources.zip"

javac \
  -source 8 \
  -target 8 \
  -encoding UTF-8 \
  -cp "$ANDROID_JAR:$GEN_DIR" \
  -d "$CLASSES_DIR" \
  $(find "$APP_DIR/src" "$GEN_DIR" -name '*.java' | tr '\n' ' ')

jar --create --file "$CLASSES_JAR" -C "$CLASSES_DIR" .

"$D8" \
  --lib "$ANDROID_JAR" \
  --output "$DEX_DIR" \
  "$CLASSES_JAR"

cp "$BUILD_DIR/app-unsigned.apk" "$BUILD_DIR/app-with-dex.apk"
zip -q -j "$BUILD_DIR/app-with-dex.apk" "$DEX_DIR/classes.dex"

"$ZIPALIGN" -f 4 "$BUILD_DIR/app-with-dex.apk" "$BUILD_DIR/app-aligned.apk"

"$APKSIGNER" sign \
  --ks "$KEYSTORE_PATH" \
  --ks-pass pass:android \
  --key-pass pass:android \
  --out "$DIST_DIR/phone-focus-shell.apk" \
  "$BUILD_DIR/app-aligned.apk"

"$APKSIGNER" verify "$DIST_DIR/phone-focus-shell.apk"

echo "Built APK: $DIST_DIR/phone-focus-shell.apk"
echo "Shell URL: $SHELL_URL"
