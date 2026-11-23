#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
DERIVED_DATA_PATH="${IOS_MAC_DERIVED_DATA_PATH:-$SCRIPT_DIR/build/mac}"
CONFIGURATION="${IOS_CONFIGURATION:-Release}"
INSTALL="${INSTALL_APP:-true}"
OPEN_APP="${OPEN_APP:-false}"

for arg in "$@"; do
  case "$arg" in
    --debug)
      CONFIGURATION="Debug"
      ;;
    --release)
      CONFIGURATION="Release"
      ;;
    --install)
      INSTALL=true
      ;;
    --no-install)
      INSTALL=false
      ;;
    --open)
      OPEN_APP=true
      ;;
    --no-open)
      OPEN_APP=false
      ;;
  esac
done

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "error: macOS builds require macOS with Xcode" >&2
  exit 1
fi

command -v xcodebuild >/dev/null 2>&1 || {
  echo "error: xcodebuild not found" >&2
  exit 1
}

DESTINATION="platform=macOS,variant=Mac Catalyst"

echo "Syncing offline curriculum data..."
"$REPO_ROOT/scripts/sync-ios-data.sh"

echo "Building LeetLLM for macOS ($DESTINATION, $CONFIGURATION)..."
cd "$SCRIPT_DIR"

xcodebuild build \
  -project LeetLLM.xcodeproj \
  -scheme LeetLLM \
  -destination "$DESTINATION" \
  -configuration "$CONFIGURATION" \
  -derivedDataPath "$DERIVED_DATA_PATH" \
  CODE_SIGNING_ALLOWED=NO

APP_PATH=$(find "$DERIVED_DATA_PATH/Build/Products" -name "LeetLLM.app" -type d | head -n 1 || true)

if [[ -n "$APP_PATH" && -d "$APP_PATH" ]]; then
  SIGN_IDENTITY="-"
  DEV_CERT=$(security find-identity -v -p codesigning 2>/dev/null | grep "Apple Development" | head -n 1 | awk '{print $2}' || true)
  if [[ -n "$DEV_CERT" ]]; then
    SIGN_IDENTITY="$DEV_CERT"
  fi

  echo "Signing $APP_PATH with identity: $SIGN_IDENTITY..."
  codesign --force --sign "$SIGN_IDENTITY" --timestamp=none "$APP_PATH" 2>/dev/null || \
  codesign --force --sign - --timestamp=none "$APP_PATH"

  FINAL_APP_PATH="$APP_PATH"

  if [[ "$INSTALL" == "true" ]]; then
    INSTALL_DIR="$HOME/Applications"
    mkdir -p "$INSTALL_DIR"
    TARGET_APP="$INSTALL_DIR/LeetLLM.app"

    echo "Installing to $TARGET_APP..."
    # Close any running instance before replacing
    killall LeetLLM 2>/dev/null || true
    sleep 0.5
    rm -rf "$TARGET_APP"
    cp -R "$APP_PATH" "$TARGET_APP"

    # Re-sign installed bundle to preserve seal and register with LaunchServices
    codesign --force --sign "$SIGN_IDENTITY" --timestamp=none "$TARGET_APP" 2>/dev/null || \
    codesign --force --sign - --timestamp=none "$TARGET_APP"
    /System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -f "$TARGET_APP" 2>/dev/null || true

    FINAL_APP_PATH="$TARGET_APP"
  fi

  echo ""
  echo "========================================="
  echo " macOS App Ready!"
  echo " Path: $FINAL_APP_PATH"
  echo " To launch: open \"$FINAL_APP_PATH\""
  echo "========================================="

  if [[ "$OPEN_APP" == "true" ]]; then
    open "$FINAL_APP_PATH"
  fi
fi
