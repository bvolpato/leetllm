#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
DERIVED_DATA_PATH="${MAC_DERIVED_DATA_PATH:-$SCRIPT_DIR/build/mac-screenshots}"
WORK_DIR="${MAC_CAPTURE_WORK_DIR:-$SCRIPT_DIR/build/native-mac-screenshots}"
OUTPUT_DIR="${MAC_SCREENSHOT_DIR:-$SCRIPT_DIR/screenshots/mac}"
MARKETING_VERSION="${MACOS_MARKETING_VERSION:-1.7}"
BUILD_NUMBER="${MACOS_BUILD_NUMBER:-34}"

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "error: native Mac Catalyst screenshots require macOS with Xcode" >&2
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

if [[ "${SKIP_DATA_SYNC:-0}" != "1" || ! -s "$SCRIPT_DIR/LeetLLM/Resources/data/manifest.json" ]]; then
  "$REPO_ROOT/scripts/sync-ios-data.sh"
fi

rm -rf "$WORK_DIR" "$OUTPUT_DIR"
mkdir -p "$WORK_DIR" "$OUTPUT_DIR"

if [[ "${CONFIGURE_MAC_DISPLAY:-auto}" == "1" ]]; then
  xcrun swift "$REPO_ROOT/scripts/macos-capture-display.swift"
elif [[ "${CONFIGURE_MAC_DISPLAY:-auto}" == "auto" ]]; then
  if ! xcrun swift -e 'import CoreGraphics; let b = CGDisplayBounds(CGMainDisplayID()); precondition(b.width >= 1440 && b.height >= 1000)' >/dev/null 2>&1; then
    xcrun swift "$REPO_ROOT/scripts/macos-capture-display.swift"
  fi
fi

xcrun swift -e 'import CoreGraphics; let bounds = CGDisplayBounds(CGMainDisplayID()); print("Display bounds:", bounds); precondition(bounds.width >= 1440 && bounds.height >= 1000, "Display must fit a native 1280x800 window")'

cd "$SCRIPT_DIR"
xcodebuild test \
  -project LeetLLM.xcodeproj \
  -scheme LeetLLMMacScreenshots \
  -configuration Debug \
  -destination 'platform=macOS,variant=Mac Catalyst' \
  -derivedDataPath "$DERIVED_DATA_PATH" \
  -resultBundlePath "$WORK_DIR/Capture.xcresult" \
  -parallel-testing-enabled NO \
  MARKETING_VERSION="$MARKETING_VERSION" \
  CURRENT_PROJECT_VERSION="$BUILD_NUMBER" \
  CODE_SIGN_IDENTITY=- \
  CODE_SIGN_STYLE=Manual \
  DEVELOPMENT_TEAM=

xcrun xcresulttool export attachments \
  --path "$WORK_DIR/Capture.xcresult" \
  --output-path "$WORK_DIR/attachments"

xcrun swift "$REPO_ROOT/scripts/macos-capture-export.swift" \
  "$WORK_DIR/attachments" \
  "$OUTPUT_DIR"

echo "Native Mac Catalyst screenshots exported to: $OUTPUT_DIR"
