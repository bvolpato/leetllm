#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

load_env_defaults() {
  local env_file="$1"
  [[ -f "$env_file" ]] || return 0
  while IFS= read -r raw_line || [[ -n "$raw_line" ]]; do
    local line="${raw_line%$'\r'}"
    [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
    [[ "$line" == *"="* ]] || continue
    local key="${line%%=*}"
    local val="${line#*=}"
    key="${key#"${key%%[![:space:]]*}"}"
    key="${key%"${key##*[![:space:]]}"}"
    [[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || continue
    if [[ -z "${!key+x}" ]]; then
      if [[ "$val" == \"*\" && "$val" == *\" ]]; then
        val="${val:1:${#val}-2}"
      elif [[ "$val" == \'*\' && "$val" == *\' ]]; then
        val="${val:1:${#val}-2}"
      fi
      export "$key=$val"
    fi
  done < "$env_file"
}

load_env_defaults "$REPO_ROOT/.env"
load_env_defaults "$REPO_ROOT/secrets/deploy.env"

BUILD_DIR="${IOS_RELEASE_DIR:-$SCRIPT_DIR/build/release}"
ARCHIVE_PATH="$BUILD_DIR/LeetLLM.xcarchive"
EXPORT_PATH="$BUILD_DIR/export"

PROFILE_PATH="${IOS_PROVISIONING_PROFILE_PATH:-$REPO_ROOT/secrets/ios/LeetLLM_App_Store_Distribution.mobileprovision}"
TEAM_ID="${IOS_TEAM_ID:-}"

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "error: iOS builds require macOS with Xcode" >&2
  exit 1
fi

command -v xcodebuild >/dev/null 2>&1 || {
  echo "error: xcodebuild not found" >&2
  exit 1
}

# Ensure macOS system utilities (e.g. system rsync) take precedence during Xcode export
export PATH="/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

"$REPO_ROOT/scripts/sync-ios-data.sh"

mkdir -p "$BUILD_DIR" "$EXPORT_PATH"

cd "$SCRIPT_DIR"

# Check if an Apple Distribution identity exists in Keychain
HAS_DISTRIBUTION_CERT=false
if security find-identity -v -p codesigning 2>/dev/null | grep -q "Apple Distribution"; then
  HAS_DISTRIBUTION_CERT=true
fi

# Ensure provisioning profile is installed in user profile directory
PROFILE_DIR="$HOME/Library/MobileDevice/Provisioning Profiles"
mkdir -p "$PROFILE_DIR"
PROFILE_NAME="LeetLLM"
if [[ -f "$PROFILE_PATH" ]]; then
  TMP_PLIST="$(mktemp -t profile.XXXXXX)"
  if security cms -D -i "$PROFILE_PATH" > "$TMP_PLIST" 2>/dev/null; then
    PROFILE_UUID=$(/usr/libexec/PlistBuddy -c 'Print :UUID' "$TMP_PLIST" 2>/dev/null || echo "")
    PROFILE_NAME=$(/usr/libexec/PlistBuddy -c 'Print :Name' "$TMP_PLIST" 2>/dev/null || echo "LeetLLM")
    if [[ -n "$PROFILE_UUID" ]]; then
      cp "$PROFILE_PATH" "$PROFILE_DIR/$PROFILE_UUID.mobileprovision"
    fi
  fi
  rm -f "$TMP_PLIST"
fi

if [[ "$HAS_DISTRIBUTION_CERT" = true ]]; then
  if [[ -z "$TEAM_ID" ]]; then
    echo "error: IOS_TEAM_ID is required for signed builds (set IOS_TEAM_ID, .env, or secrets/deploy.env)" >&2
    exit 1
  fi
  echo "Building signed archive with automatic provisioning..."
  xcodebuild archive \
    -project LeetLLM.xcodeproj \
    -scheme LeetLLM \
    -configuration Release \
    -archivePath "$ARCHIVE_PATH" \
    -destination "generic/platform=iOS" \
    -allowProvisioningUpdates \
    DEVELOPMENT_TEAM="$TEAM_ID"

  EXPORT_OPTIONS_PLIST="$BUILD_DIR/ExportOptions.plist"
  cat > "$EXPORT_OPTIONS_PLIST" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store-connect</string>
    <key>destination</key>
    <string>export</string>
    <key>signingStyle</key>
    <string>automatic</string>
    <key>teamID</key>
    <string>$TEAM_ID</string>
</dict>
</plist>
PLIST

  echo "Exporting App Store Connect IPA..."
  rm -rf "$EXPORT_PATH"/*
  xcodebuild -exportArchive \
    -archivePath "$ARCHIVE_PATH" \
    -exportOptionsPlist "$EXPORT_OPTIONS_PLIST" \
    -exportPath "$EXPORT_PATH" \
    -allowProvisioningUpdates
else
  echo "No Apple Distribution identity found in Keychain. Building unsigned archive..."
  xcodebuild archive \
    -project LeetLLM.xcodeproj \
    -scheme LeetLLM \
    -configuration Release \
    -archivePath "$ARCHIVE_PATH" \
    CODE_SIGNING_ALLOWED=NO \
    CODE_SIGNING_REQUIRED=NO \
    CODE_SIGN_IDENTITY=""

  APP_IN_ARCHIVE="$ARCHIVE_PATH/Products/Applications/LeetLLM.app"

  if [[ -f "$PROFILE_PATH" ]]; then
    cp "$PROFILE_PATH" "$APP_IN_ARCHIVE/embedded.mobileprovision"
    TMP_PLIST="$(mktemp -t profile.XXXXXX)"
    TMP_ENTITLEMENTS="$(mktemp -t entitlements.XXXXXX)"
    security cms -D -i "$PROFILE_PATH" > "$TMP_PLIST"
    /usr/libexec/PlistBuddy -x -c "Print :Entitlements" "$TMP_PLIST" > "$TMP_ENTITLEMENTS"
    codesign --force --sign - --entitlements "$TMP_ENTITLEMENTS" --timestamp=none "$APP_IN_ARCHIVE"
    rm -f "$TMP_PLIST" "$TMP_ENTITLEMENTS"
  fi

  rm -rf "$EXPORT_PATH/Payload" "$EXPORT_PATH/LeetLLM.ipa"
  mkdir -p "$EXPORT_PATH/Payload"
  cp -R "$APP_IN_ARCHIVE" "$EXPORT_PATH/Payload/"
  (cd "$EXPORT_PATH" && zip -qr LeetLLM.ipa Payload && rm -rf Payload)
fi

BUNDLE_VERSION=$(/usr/libexec/PlistBuddy -c "Print :ApplicationProperties:CFBundleVersion" "$ARCHIVE_PATH/Info.plist")
SHORT_VERSION=$(/usr/libexec/PlistBuddy -c "Print :ApplicationProperties:CFBundleShortVersionString" "$ARCHIVE_PATH/Info.plist")

echo "ipa: $EXPORT_PATH/LeetLLM.ipa"
echo "version: $SHORT_VERSION ($BUNDLE_VERSION)"
