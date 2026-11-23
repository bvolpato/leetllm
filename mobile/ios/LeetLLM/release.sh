#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

# Load optional gitignored local config without overriding explicit env vars.
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
SIGNING_DIR="$BUILD_DIR/signing"
ARCHIVE_PATH="$BUILD_DIR/LeetLLM.xcarchive"
EXPORT_PATH="$BUILD_DIR/export"
EXPORT_OPTIONS_PLIST="$BUILD_DIR/ExportOptions.plist"
EXPORT_OPTIONS_UPLOAD_PLIST="$BUILD_DIR/ExportOptions-Upload.plist"
KEYCHAIN_PATH="$SIGNING_DIR/leetllm-release-$$.keychain-db"
ORIGINAL_KEYCHAINS=()
KEYCHAIN_CREATED=false
PROFILE_DIR="$HOME/Library/MobileDevice/Provisioning Profiles"

PROJECT="LeetLLM.xcodeproj"
SCHEME="LeetLLM"
BUNDLE_ID="${IOS_BUNDLE_ID:-com.leetllm.ios}"
EXPORT_METHOD="${IOS_EXPORT_METHOD:-app-store-connect}"
CERT_PATH="${IOS_CERTIFICATE_PATH:-}"
PROFILE_PATH="${IOS_PROVISIONING_PROFILE_PATH:-}"
CODE_SIGN_IDENTITY="${IOS_CODE_SIGN_IDENTITY:-Apple Distribution}"
SKIP_SYNC=false
SKIP_SIM_BUILD=false
UPLOAD=false
PLATFORM="${IOS_RELEASE_PLATFORM:-ios}"

usage() {
  cat <<'USAGE'
Usage: mobile/ios/LeetLLM/release.sh [--mac] [--ios] [--all] [--skip-sync] [--skip-simulator-build] [--upload]

Builds signed App Store packages (iOS IPA and/or Mac Catalyst PKG). Must run on macOS with Xcode.

Options:
  --mac, --catalyst        Build and export Mac Catalyst app package (.pkg) for Mac App Store.
  --ios                    Build and export iOS IPA (default).
  --all                    Build and export both iOS and Mac Catalyst packages.
  --skip-sync              Skip syncing web data to bundle.
  --skip-simulator-build   Skip building the iOS simulator target.
  --upload                 Upload package directly to App Store Connect.

Signing modes:
  manual     Used when a .p12 and a .mobileprovision are given. Needs IOS_P12_PASSWORD.
             Provide IOS_CERTIFICATE_BASE64 and IOS_PROVISIONING_PROFILE_BASE64,
             or IOS_CERTIFICATE_PATH and IOS_PROVISIONING_PROFILE_PATH,
             or put one .p12 and one .mobileprovision in secrets/ios/ (gitignored).
  automatic  Used when no signing files are given. Needs an Apple Distribution
             certificate in the login keychain and the Apple ID signed in to Xcode
             (Settings > Accounts). Xcode creates the App Store profile.

Optional env:
  IOS_RELEASE_PLATFORM     ios, mac, or all. Default: ios.
  IOS_SIGNING              manual or automatic. Default: picked from the inputs above.
  IOS_TEAM_ID              default: TeamIdentifier from the profile (set in secrets/deploy.env for automatic)
  IOS_PROFILE_NAME         default: Name from the profile
  IOS_BUNDLE_ID            default: com.leetllm.ios
  IOS_EXPORT_METHOD        default: app-store-connect
  IOS_BUILD_NUMBER
  IOS_MARKETING_VERSION
  IOS_RELEASE_DIR         default: build/release
  IOS_SIM_DESTINATION      default: platform=iOS Simulator,name=iPhone 17
USAGE
}

for arg in "$@"; do
  case "$arg" in
    --mac|--catalyst)
      PLATFORM="mac"
      ;;
    --ios)
      PLATFORM="ios"
      ;;
    --all)
      PLATFORM="all"
      ;;
    --skip-sync)
      SKIP_SYNC=true
      ;;
    --skip-simulator-build)
      SKIP_SIM_BUILD=true
      ;;
    --upload)
      UPLOAD=true
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "error: unknown argument: $arg" >&2
      usage >&2
      exit 2
      ;;
  esac
done

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "error: required command not found: $1" >&2
    exit 1
  }
}

require_env() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "error: required environment variable '$name' is not set" >&2
    exit 1
  fi
}

decode_base64_to_file() {
  local input="$1"
  local out="$2"
  if base64 --help >/dev/null 2>&1; then
    printf '%s' "$input" | base64 --decode > "$out"
  else
    printf '%s' "$input" | base64 -D > "$out"
  fi
}

cleanup() {
  if [[ "$KEYCHAIN_CREATED" = true ]]; then
    security list-keychains -d user -s "${ORIGINAL_KEYCHAINS[@]}" >/dev/null 2>&1 || true
    security delete-keychain "$KEYCHAIN_PATH" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "error: iOS release builds require macOS with Xcode" >&2
  exit 1
fi

require_cmd xcodebuild
require_cmd security
require_cmd xcrun
require_cmd /usr/libexec/PlistBuddy

# Put system tools first. Homebrew rsync breaks the IPA copy step of -exportArchive.
export PATH="/usr/bin:/bin:/usr/sbin:/sbin:/Applications/Xcode.app/Contents/Developer/usr/bin:$PATH"

if [[ "$SKIP_SYNC" = false ]]; then
  "$REPO_ROOT/scripts/sync-ios-data.sh"
fi

mkdir -p "$BUILD_DIR" "$SIGNING_DIR" "$EXPORT_PATH" "$PROFILE_DIR"
rm -rf "$ARCHIVE_PATH" "$EXPORT_PATH"/*

if [[ -n "${IOS_CERTIFICATE_BASE64:-}" ]]; then
  CERT_PATH="$SIGNING_DIR/ios_distribution.p12"
  decode_base64_to_file "$IOS_CERTIFICATE_BASE64" "$CERT_PATH"
fi
if [[ -n "${IOS_PROVISIONING_PROFILE_BASE64:-}" ]]; then
  PROFILE_PATH="$SIGNING_DIR/LeetLLM_App_Store_Distribution.mobileprovision"
  decode_base64_to_file "$IOS_PROVISIONING_PROFILE_BASE64" "$PROFILE_PATH"
fi

# If no input is given, use files in the gitignored secrets/ios/ (or local signing/) folder.
LOCAL_SIGNING_DIR="$REPO_ROOT/secrets/ios"
LEGACY_SIGNING_DIR="$SCRIPT_DIR/signing"
if [[ -z "$CERT_PATH" ]]; then
  CERT_PATH=$(find "$LOCAL_SIGNING_DIR" "$LEGACY_SIGNING_DIR" -maxdepth 1 -name '*.p12' -type f 2>/dev/null | sort | head -n 1 || true)
fi
if [[ -z "$PROFILE_PATH" ]]; then
  PROFILE_PATH=$(find "$LOCAL_SIGNING_DIR" "$LEGACY_SIGNING_DIR" -maxdepth 1 -name '*.mobileprovision' -type f 2>/dev/null | sort | head -n 1 || true)
fi

SIGNING_MODE="${IOS_SIGNING:-}"
if [[ -z "$SIGNING_MODE" ]]; then
  if [[ -n "$CERT_PATH" && -n "$PROFILE_PATH" ]]; then
    SIGNING_MODE=manual
  else
    SIGNING_MODE=automatic
  fi
fi
echo "signing: $SIGNING_MODE"

if [[ "$SIGNING_MODE" = automatic ]]; then
  IOS_TEAM_ID="${IOS_TEAM_ID:-}"
  if [[ -z "$IOS_TEAM_ID" ]]; then
    echo "error: IOS_TEAM_ID is required for automatic signing (set IOS_TEAM_ID or configure secrets/deploy.env)" >&2
    exit 1
  fi
  security find-identity -v -p codesigning | grep -q "Apple Distribution: .*($IOS_TEAM_ID)" || {
    echo "error: no valid Apple Distribution certificate for team $IOS_TEAM_ID in the keychain." >&2
    echo "Create one in Xcode > Settings > Accounts > Manage Certificates, or use manual mode." >&2
    exit 1
  }
  cat > "$EXPORT_OPTIONS_PLIST" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>$EXPORT_METHOD</string>
    <key>signingStyle</key>
    <string>automatic</string>
    <key>teamID</key>
    <string>$IOS_TEAM_ID</string>
    <key>manageAppVersionAndBuildNumber</key>
    <false/>
</dict>
</plist>
PLIST
  cat > "$EXPORT_OPTIONS_UPLOAD_PLIST" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>destination</key>
    <string>upload</string>
    <key>method</key>
    <string>$EXPORT_METHOD</string>
    <key>signingStyle</key>
    <string>automatic</string>
    <key>teamID</key>
    <string>$IOS_TEAM_ID</string>
    <key>manageAppVersionAndBuildNumber</key>
    <false/>
    <key>uploadSymbols</key>
    <false/>
</dict>
</plist>
PLIST
  SIGNING_ARGS=(
    -allowProvisioningUpdates
    CODE_SIGN_STYLE=Automatic
    DEVELOPMENT_TEAM="$IOS_TEAM_ID"
    PRODUCT_BUNDLE_IDENTIFIER="$BUNDLE_ID"
  )
  EXPORT_ARGS=(-allowProvisioningUpdates)
else
  require_env IOS_P12_PASSWORD

  [[ -n "$CERT_PATH" && -f "$CERT_PATH" ]] || {
    echo "error: missing signing certificate. Set IOS_CERTIFICATE_BASE64 or IOS_CERTIFICATE_PATH, or put a .p12 in $LOCAL_SIGNING_DIR" >&2
    exit 1
  }
  [[ -n "$PROFILE_PATH" && -f "$PROFILE_PATH" ]] || {
    echo "error: missing provisioning profile. Set IOS_PROVISIONING_PROFILE_BASE64 or IOS_PROVISIONING_PROFILE_PATH, or put a .mobileprovision in $LOCAL_SIGNING_DIR" >&2
    exit 1
  }

  PROFILE_INFO_PLIST="$SIGNING_DIR/profile-info.plist"
  security cms -D -i "$PROFILE_PATH" > "$PROFILE_INFO_PLIST"
  IOS_PROFILE_NAME="${IOS_PROFILE_NAME:-$(/usr/libexec/PlistBuddy -c 'Print :Name' "$PROFILE_INFO_PLIST")}"
  IOS_TEAM_ID="${IOS_TEAM_ID:-$(/usr/libexec/PlistBuddy -c 'Print :TeamIdentifier:0' "$PROFILE_INFO_PLIST")}"
  echo "profile: $IOS_PROFILE_NAME (team $IOS_TEAM_ID)"

  while IFS= read -r keychain; do
    keychain="${keychain#*\"}"
    keychain="${keychain%\"*}"
    ORIGINAL_KEYCHAINS+=("$keychain")
  done < <(security list-keychains -d user)
  security create-keychain -p "" "$KEYCHAIN_PATH"
  KEYCHAIN_CREATED=true
  security list-keychains -d user -s "$KEYCHAIN_PATH" "${ORIGINAL_KEYCHAINS[@]}"
  security unlock-keychain -p "" "$KEYCHAIN_PATH"
  security set-keychain-settings -lut 3600 "$KEYCHAIN_PATH"
  security import "$CERT_PATH" -k "$KEYCHAIN_PATH" -P "$IOS_P12_PASSWORD" -T /usr/bin/codesign -T /usr/bin/security
  security set-key-partition-list -S apple-tool:,apple: -s -k "" "$KEYCHAIN_PATH" >/dev/null

  PROFILE_PLIST="$SIGNING_DIR/profile.plist"
  security cms -D -i "$PROFILE_PATH" > "$PROFILE_PLIST"
  PROFILE_UUID=$(/usr/libexec/PlistBuddy -c 'Print :UUID' "$PROFILE_PLIST")
  cp "$PROFILE_PATH" "$PROFILE_DIR/$PROFILE_UUID.mobileprovision"

  cat > "$EXPORT_OPTIONS_PLIST" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>$EXPORT_METHOD</string>
    <key>signingStyle</key>
    <string>manual</string>
    <key>teamID</key>
    <string>$IOS_TEAM_ID</string>
    <key>provisioningProfiles</key>
    <dict>
        <key>$BUNDLE_ID</key>
        <string>$IOS_PROFILE_NAME</string>
    </dict>
</dict>
</plist>
PLIST
  cat > "$EXPORT_OPTIONS_UPLOAD_PLIST" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>destination</key>
    <string>upload</string>
    <key>method</key>
    <string>$EXPORT_METHOD</string>
    <key>signingStyle</key>
    <string>manual</string>
    <key>teamID</key>
    <string>$IOS_TEAM_ID</string>
    <key>provisioningProfiles</key>
    <dict>
        <key>$BUNDLE_ID</key>
        <string>$IOS_PROFILE_NAME</string>
    </dict>
    <key>manageAppVersionAndBuildNumber</key>
    <false/>
    <key>uploadSymbols</key>
    <false/>
</dict>
</plist>
PLIST
  SIGNING_ARGS=(
    CODE_SIGNING_ALLOWED=YES
    CODE_SIGN_STYLE=Manual
    PROVISIONING_PROFILE_SPECIFIER="$IOS_PROFILE_NAME"
    CODE_SIGN_IDENTITY="$CODE_SIGN_IDENTITY"
    DEVELOPMENT_TEAM="$IOS_TEAM_ID"
    PRODUCT_BUNDLE_IDENTIFIER="$BUNDLE_ID"
  )
  EXPORT_ARGS=()
fi

XCODE_COMMON_ARGS=(
  -project "$PROJECT"
  -scheme "$SCHEME"
  -configuration Release
)

VERSION_ARGS=()
if [[ -n "${IOS_BUILD_NUMBER:-}" ]]; then
  VERSION_ARGS+=("CURRENT_PROJECT_VERSION=$IOS_BUILD_NUMBER")
fi
if [[ -n "${IOS_MARKETING_VERSION:-}" ]]; then
  VERSION_ARGS+=("MARKETING_VERSION=$IOS_MARKETING_VERSION")
fi

cd "$SCRIPT_DIR"

if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "all" ]]; then
  if [[ "$SKIP_SIM_BUILD" = false ]]; then
    SIM_DESTINATION="${IOS_SIM_DESTINATION:-platform=iOS Simulator,name=iPhone 17}"
    xcodebuild clean build \
      "${XCODE_COMMON_ARGS[@]}" \
      -destination "$SIM_DESTINATION" \
      CODE_SIGNING_ALLOWED=NO \
      ${VERSION_ARGS[@]+"${VERSION_ARGS[@]}"}
  fi

  echo "==> Archiving iOS..."
  xcodebuild archive \
    "${XCODE_COMMON_ARGS[@]}" \
    -destination "generic/platform=iOS" \
    -archivePath "$ARCHIVE_PATH" \
    "${SIGNING_ARGS[@]}" \
    ${VERSION_ARGS[@]+"${VERSION_ARGS[@]}"}

  echo "==> Exporting iOS IPA..."
  xcodebuild -exportArchive \
    -archivePath "$ARCHIVE_PATH" \
    -exportOptionsPlist "$EXPORT_OPTIONS_PLIST" \
    -exportPath "$EXPORT_PATH" \
    ${EXPORT_ARGS[@]+"${EXPORT_ARGS[@]}"}

  IPA_PATH=$(find "$EXPORT_PATH" -name '*.ipa' -type f | sort | head -n 1 || true)
  [[ -n "$IPA_PATH" ]] || {
    echo "error: IPA not generated" >&2
    exit 1
  }

  BUNDLE_VERSION=$(/usr/libexec/PlistBuddy -c "Print :ApplicationProperties:CFBundleVersion" "$ARCHIVE_PATH/Info.plist")
  SHORT_VERSION=$(/usr/libexec/PlistBuddy -c "Print :ApplicationProperties:CFBundleShortVersionString" "$ARCHIVE_PATH/Info.plist")

  echo "ipa: $IPA_PATH (iOS/iPadOS)"
  echo "version: $SHORT_VERSION ($BUNDLE_VERSION)"

  if [[ "$UPLOAD" = true ]]; then
    echo "==> Uploading iOS app to App Store Connect..."
    xcodebuild -exportArchive \
      -archivePath "$ARCHIVE_PATH" \
      -exportOptionsPlist "$EXPORT_OPTIONS_UPLOAD_PLIST" \
      -exportPath "$EXPORT_PATH" \
      ${EXPORT_ARGS[@]+"${EXPORT_ARGS[@]}"}

    echo "==> Direct upload completed for iOS build."
  fi
fi

if [[ "$PLATFORM" == "mac" || "$PLATFORM" == "all" ]]; then
  MAC_ARCHIVE_PATH="$BUILD_DIR/LeetLLM-Mac.xcarchive"
  MAC_EXPORT_PATH="$BUILD_DIR/export-mac"
  rm -rf "$MAC_ARCHIVE_PATH" "$MAC_EXPORT_PATH"/*
  mkdir -p "$MAC_EXPORT_PATH"

  echo "==> Archiving macOS (Mac Catalyst)..."
  xcodebuild archive \
    "${XCODE_COMMON_ARGS[@]}" \
    -destination "generic/platform=macOS,variant=Mac Catalyst" \
    -archivePath "$MAC_ARCHIVE_PATH" \
    CODE_SIGNING_ALLOWED=NO \
    ${VERSION_ARGS[@]+"${VERSION_ARGS[@]}"}

  # Ensure app sandbox entitlements are signed in the archived app before export
  codesign --force --sign "${CODE_SIGN_IDENTITY:-Apple Distribution}" \
    --entitlements LeetLLM/LeetLLM-Catalyst.entitlements \
    --options runtime \
    "$MAC_ARCHIVE_PATH/Products/Applications/LeetLLM.app" 2>/dev/null || true

  echo "==> Exporting macOS package (.pkg)..."
  xcodebuild -exportArchive \
    -archivePath "$MAC_ARCHIVE_PATH" \
    -exportOptionsPlist "$EXPORT_OPTIONS_PLIST" \
    -exportPath "$MAC_EXPORT_PATH" \
    -allowProvisioningUpdates

  PKG_PATH=$(find "$MAC_EXPORT_PATH" -name '*.pkg' -type f | sort | head -n 1 || true)
  [[ -n "$PKG_PATH" ]] || {
    echo "error: PKG not generated" >&2
    exit 1
  }

  MAC_BUNDLE_VERSION=$(/usr/libexec/PlistBuddy -c "Print :ApplicationProperties:CFBundleVersion" "$MAC_ARCHIVE_PATH/Info.plist")
  MAC_SHORT_VERSION=$(/usr/libexec/PlistBuddy -c "Print :ApplicationProperties:CFBundleShortVersionString" "$MAC_ARCHIVE_PATH/Info.plist")

  echo "pkg: $PKG_PATH (macOS Catalyst)"
  echo "version: $MAC_SHORT_VERSION ($MAC_BUNDLE_VERSION)"

  if [[ "$UPLOAD" = true ]]; then
    echo "==> Uploading macOS app to App Store Connect..."
    xcodebuild -exportArchive \
      -archivePath "$MAC_ARCHIVE_PATH" \
      -exportOptionsPlist "$EXPORT_OPTIONS_UPLOAD_PLIST" \
      -exportPath "$MAC_EXPORT_PATH" \
      -allowProvisioningUpdates

    echo "==> Direct upload completed for macOS build."
  fi
fi
