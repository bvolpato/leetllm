#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
DEVICE_NAME="${IOS_SCREENSHOT_DEVICE:-iPhone 17}"
DERIVED_DATA_PATH="${IOS_DERIVED_DATA_PATH:-$SCRIPT_DIR/build/screenshots}"
SCREENSHOT_DIR="${IOS_SCREENSHOT_DIR:-$SCRIPT_DIR/screenshots}"
BUNDLE_ID="${IOS_BUNDLE_ID:-com.leetllm.ios}"
APP_PATH_OVERRIDE="${IOS_APP_PATH:-}"

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "error: screenshots require macOS with Xcode" >&2
  exit 1
fi

command -v xcodebuild >/dev/null 2>&1 || {
  echo "error: xcodebuild not found" >&2
  exit 1
}
command -v xcrun >/dev/null 2>&1 || {
  echo "error: xcrun not found" >&2
  exit 1
}

mkdir -p "$SCREENSHOT_DIR"

if [[ -n "$APP_PATH_OVERRIDE" ]]; then
  APP_PATH="$APP_PATH_OVERRIDE"
  if [[ ! -d "$APP_PATH" ]]; then
    echo "error: app not found: $APP_PATH" >&2
    exit 1
  fi
else
  "$REPO_ROOT/scripts/sync-ios-data.sh"

  cd "$SCRIPT_DIR"
  xcodebuild clean build \
    -project LeetLLM.xcodeproj \
    -scheme LeetLLM \
    -destination "platform=iOS Simulator,name=$DEVICE_NAME" \
    -configuration Debug \
    -derivedDataPath "$DERIVED_DATA_PATH" \
    CODE_SIGNING_ALLOWED=NO

  APP_PATH=$(find "$DERIVED_DATA_PATH" -name "LeetLLM.app" -type d | sort | head -n 1)
fi
DEVICE_ID=$(xcrun simctl list devices available | grep "$DEVICE_NAME" | head -n 1 | sed 's/.*(\([A-Z0-9-]*\)).*/\1/')
if [[ -z "$DEVICE_ID" ]]; then
  echo "error: simulator not found: $DEVICE_NAME" >&2
  exit 1
fi

xcrun simctl boot "$DEVICE_ID" >/dev/null 2>&1 || true
sleep 12
xcrun simctl install "$DEVICE_ID" "$APP_PATH"

capture_route() {
  local route="$1"
  local file="$2"
  local query="${3:-}"
  xcrun simctl terminate "$DEVICE_ID" "$BUNDLE_ID" >/dev/null 2>&1 || true
  if [[ -n "$query" ]]; then
    xcrun simctl launch "$DEVICE_ID" "$BUNDLE_ID" --initial-route "$route" --initial-query "$query" >/dev/null
  else
    xcrun simctl launch "$DEVICE_ID" "$BUNDLE_ID" --initial-route "$route" >/dev/null
  fi
  sleep 6
  
  local success=false
  for i in {1..3}; do
    if xcrun simctl io "$DEVICE_ID" screenshot "$SCREENSHOT_DIR/$file" >/dev/null; then
      success=true
      break
    fi
    echo "  [retry $i] screenshot failed for $file, retrying in 3 seconds..."
    sleep 3
  done
  if [[ "$success" = false ]]; then
    echo "error: failed to capture screenshot for $file" >&2
    exit 1
  fi
}

capture_route learn 01_learn.png
capture_route lesson 02_lesson.png transformer-architecture-end-to-end
capture_route practice 03_practice.png
capture_route quiz 04_quiz.png beginner-ai-systems-foundations
capture_route tracks 05_tracks.png
capture_route track 06_track.png inference-and-serving
capture_route glossary 07_glossary.png
capture_route term 08_term.png vllm
capture_route account 09_account.png

echo "Post-processing screenshots into required App Store Connect resolutions..."

# 6.5-inch (1242 x 2688)
mkdir -p "$SCREENSHOT_DIR/6.5-inch"
for f in "$SCREENSHOT_DIR"/*.png; do
  [[ -f "$f" ]] || continue
  name=$(basename "$f")
  cp "$f" "$SCREENSHOT_DIR/6.5-inch/$name"
  sips -z 2688 1242 "$SCREENSHOT_DIR/6.5-inch/$name" >/dev/null
done
echo "  Generated 6.5-inch screenshots (1242 x 2688)"

# 6.7-inch (1290 x 2796)
mkdir -p "$SCREENSHOT_DIR/6.7-inch"
for f in "$SCREENSHOT_DIR"/*.png; do
  [[ -f "$f" ]] || continue
  name=$(basename "$f")
  cp "$f" "$SCREENSHOT_DIR/6.7-inch/$name"
  sips -z 2796 1290 "$SCREENSHOT_DIR/6.7-inch/$name" >/dev/null
done
echo "  Generated 6.7-inch screenshots (1290 x 2796)"

echo "screenshots directory: $SCREENSHOT_DIR"
echo "note: capture native Mac App Store screenshots separately via ./capture-mac-screenshots.sh"

