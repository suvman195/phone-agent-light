#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

if [ -f "$ROOT_DIR/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$ROOT_DIR/.env"
  set +a
fi

PORT_VALUE="${PORT:-8787}"
SDK_ROOT="$ROOT_DIR/.android-sdk"
BUILD_TOOLS_VERSION="35.0.0"
PLATFORM_VERSION="android-27"

status_ok() {
  printf 'OK   %s\n' "$1"
}

status_warn() {
  printf 'WARN %s\n' "$1"
}

status_fail() {
  printf 'FAIL %s\n' "$1"
}

if command -v node >/dev/null 2>&1; then
  status_ok "Node.js $(node --version)"
else
  status_fail "Node.js is missing. Install Node.js 18 or newer."
fi

if command -v npm >/dev/null 2>&1; then
  status_ok "npm $(npm --version)"
else
  status_fail "npm is missing. It is normally installed with Node.js."
fi

if node -e 'process.exit(typeof fetch === "function" ? 0 : 1)' >/dev/null 2>&1; then
  status_ok "Node.js fetch API is available"
else
  status_fail "Node.js fetch API is missing. Use Node.js 18 or newer."
fi

if [ -f "$ROOT_DIR/.env" ]; then
  status_ok ".env exists"
else
  status_warn ".env is missing. Run npm run setup."
fi

if command -v java >/dev/null 2>&1; then
  status_ok "Java is available"
else
  status_warn "Java is missing. It is only needed when building the Android shell APK."
fi

if command -v keytool >/dev/null 2>&1; then
  status_ok "keytool is available"
else
  status_warn "keytool is missing. It is only needed when building the Android shell APK."
fi

if [ -f "$SDK_ROOT/build-tools/$BUILD_TOOLS_VERSION/aapt2" ] \
  && [ -f "$SDK_ROOT/build-tools/$BUILD_TOOLS_VERSION/d8" ] \
  && [ -f "$SDK_ROOT/build-tools/$BUILD_TOOLS_VERSION/apksigner" ] \
  && [ -f "$SDK_ROOT/platforms/$PLATFORM_VERSION/android.jar" ]; then
  status_ok "Android SDK build tools are available"
else
  status_warn "Android SDK build tools are not ready under .android-sdk/. Browser mode still works."
fi

if curl -fsS "http://127.0.0.1:$PORT_VALUE/api/state" >/dev/null 2>&1; then
  status_ok "Server is responding on http://127.0.0.1:$PORT_VALUE"
else
  status_warn "Server is not running yet. Start it with npm start."
fi
