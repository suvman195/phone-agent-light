#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"
PORT_VALUE="${PORT:-8787}"

detect_lan_ip() {
  local ip=""
  local iface=""

  for iface in en0 en1 en2; do
    ip="$(ipconfig getifaddr "$iface" 2>/dev/null || true)"
    if [ -n "$ip" ]; then
      printf '%s' "$ip"
      return 0
    fi
  done

  iface="$(route get default 2>/dev/null | awk '/interface:/{print $2; exit}' || true)"
  if [ -n "$iface" ]; then
    ip="$(ipconfig getifaddr "$iface" 2>/dev/null || true)"
    if [ -n "$ip" ]; then
      printf '%s' "$ip"
      return 0
    fi
  fi

  printf 'YOUR_COMPUTER_LAN_IP'
}

set_env_value() {
  local key="$1"
  local value="$2"
  local escaped_key=""
  local escaped_value=""
  local tmp_file=""

  escaped_key="$(printf '%s' "$key" | sed 's/[][\\.^$*]/\\&/g')"
  escaped_value="$(printf '%s' "$value" | sed 's/[\\&]/\\&/g')"
  tmp_file="$ENV_FILE.tmp"

  if grep -q "^$escaped_key=" "$ENV_FILE"; then
    sed "s|^$escaped_key=.*|$key=$escaped_value|" "$ENV_FILE" > "$tmp_file"
    mv "$tmp_file" "$ENV_FILE"
    return
  fi

  printf '\n%s=%s\n' "$key" "$value" >> "$ENV_FILE"
}

if [ ! -f "$ENV_FILE" ]; then
  cp "$ROOT_DIR/.env.example" "$ENV_FILE"
fi

LAN_IP="$(detect_lan_ip)"
BASE_URL="http://$LAN_IP:$PORT_VALUE"

set_env_value HOST "0.0.0.0"
set_env_value PORT "$PORT_VALUE"
set_env_value AGENT_LIGHT_URL "http://127.0.0.1:$PORT_VALUE"
set_env_value SHELL_URL "$BASE_URL/display-landscape.html"

cat <<EOF
Phone Agent Light is configured.

Control panel:
  http://127.0.0.1:$PORT_VALUE/

Phone display page:
  $BASE_URL/display-landscape.html

Next steps:
  1. Run: npm start
  2. Open the phone display page on your Android phone.
  3. Optional: run npm run android:build to build the fullscreen WebView APK.
EOF
