# LeetLLM iOS App Store Release Guide

This guide provides complete instructions for building, signing, and deploying the LeetLLM iOS app to the Apple App Store, including certificate generation, provisioning profiles, simulator configuration, and screenshot automation.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Apple Developer Account Setup](#apple-developer-account-setup)
3. [App ID and Bundle Identifier](#app-id-and-bundle-identifier)
4. [Certificates and Provisioning Profiles](#certificates-and-provisioning-profiles)
5. [App Store Connect Setup](#app-store-connect-setup)
6. [Building for Release](#building-for-release)
7. [Screenshots and App Previews](#screenshots-and-app-previews)
8. [App Store Submission](#app-store-submission)
9. [App Store Review Guidelines Checklist](#app-store-review-guidelines-checklist)

---

## Prerequisites

- **Apple Developer Program** membership ($99/year) - [Enroll here](https://developer.apple.com/programs/enroll/)
- **Apple ID** with two-factor authentication
- **Native tests and archive**: the pinned Xcode 27 reusable workflow. Local Xcode builds still require macOS.
- **Linux signing and TestFlight upload**: Linux, `uv`, Git, OpenSSL, and the patched zsign build tools. No Xcode SDK is needed to sign the downloaded native archive.

---

## Apple Developer Account Setup

1. Go to [App Store Connect](https://appstoreconnect.apple.com).
2. Review and accept the agreements required for app distribution.

---

## App ID and Bundle Identifier

### Current Configuration

- **Bundle Identifier**: `com.leetllm.ios`
- **App Name**: LeetLLM

### Create App ID in Apple Developer Portal

1. Go to [Apple Developer Portal](https://developer.apple.com/account).
2. Navigate to **Certificates, Identifiers & Profiles** → **Identifiers**.
3. Click the **+** button to register a new App ID.
4. Select "Explicit" and enter `com.leetllm.ios`.
5. Keep Sign in with Apple enabled for native account sign-in. Offline reading does not need additional capabilities.
6. Click **Register**.

---

## Certificates and Provisioning Profiles

### Certificate Types

- **Development Certificate**: Used to test on local devices.
- **Distribution Certificate**: Required to sign the app and upload it to App Store Connect / TestFlight.

### Keep Distribution Signing Material Local

Keep the Apple Distribution `.p12` and its password on the trusted release machine. Do not add certificates, passwords, or App Store Connect API keys to GitHub Actions. The native workflow runs simulator tests and creates an unsigned archive without Apple signing credentials.

### Create Provisioning Profiles

1. Go to **Profiles** in the Apple Developer Portal.
2. Click **+** to register a new profile.
3. Select **App Store** (for App Store distribution).
4. Select App ID `com.leetllm.ios`.
5. Select your Distribution Certificate.
6. Use the replacement profile named `LeetLLM Local App Store 20261111`, which matches the current private Apple Distribution identity.
7. Keep that profile in a private local directory and point `IOS_PROVISIONING_PROFILE_PATH` to it. The older profile in the local signing directory does not match the current distribution identity.

---

## App Store Connect Setup

### Create New App

1. Go to [App Store Connect](https://appstoreconnect.apple.com) → **My Apps** → **+** → **New App**.
2. Select **iOS**.
3. Enter Name: `LeetLLM`.
4. Bundle ID: `com.leetllm.ios`.
5. Primary Language: `English (U.S.)`.
6. SKU: `leetllm-ios-001`.
7. Click **Create**.

### App Privacy & Policy Details

1. **Privacy Policy URL**: Host the policy at `https://leetllm.com/privacy`.
2. **Data Collected**: Account sign-in uses email and a user identifier. Progress sync sends lesson and quiz completion and the personal plan. Leety sends questions and page context after sign-in. The app privacy manifest declares email, user identifiers, product interactions, and other user content for app functionality. The app does not track users across other apps. Keep App Store Connect privacy answers consistent with the deployed services.
3. **Encryption Declaration**: Under Info.plist, we declare:
   ```xml
   <key>ITSAppUsesNonExemptEncryption</key>
   <false/>
   ```
   (Meaning the app qualifies for export compliance exemptions).

---

## Building for Release

### Version Numbering

Ensure you bump the marketing version and build numbers in project configuration or using env variables during release:
- `IOS_MARKETING_VERSION`: e.g. `1.0.0`
- `IOS_BUILD_NUMBER`: e.g. `1`

### Automated Native TestFlight Archive

The `.github/workflows/ios-testflight.yml` workflow prepares and validates bundled content on Linux, then calls a pinned macOS workflow to run the complete shared `LeetLLM` scheme and create an unsigned iOS archive. A GitHub-verified signed `testflight-ios-<build-number>` tag starts the workflow from that tagged commit. Manual dispatch with a positive build number is available after the workflow is on the default branch. The tag suffix supplies the build number.

```bash
git tag -s testflight-ios-32 REVIEWED_SOURCE_SHA -m "LeetLLM iOS TestFlight build 32"
git push origin refs/tags/testflight-ios-32
```

Replace `32` with the next unused App Store Connect build number. The workflow runs the hash-aware illustration builder after restoring the content cache, so reused PNGs cannot silently hide changed illustration sources. Storage admission covers generated images, exported content, and the resource archive. Signing, uploading, and assigning the build to the existing internal group happen locally after the unsigned archive passes native tests. GitHub Actions receives no certificates, passwords, profiles, or App Store Connect keys.

The iOS entitlements request Sign in with Apple. Catalyst selects its own file
with Sign in with Apple, sandbox, and outgoing network access. The workflow
checks that Xcode resolves the Catalyst file before building the iOS archive.

### Sign and upload the native archive from Linux

The shared Linux release helper can sign the native `.app` from the Xcode archive and upload it to the existing LeetLLM internal TestFlight group. Keep the helper in a separate checkout at its reviewed commit:

```bash
git clone --no-checkout https://github.com/bvolpato/brutv.git /path/to/brutv-release-tools
git -C /path/to/brutv-release-tools checkout --detach 4d5c7228d628aa9503a7b96a3d8667a5dccf47d6
export BRUTV_IOS=/path/to/brutv-release-tools/mobile/ios/BruTV
```

Build the pinned Linux signer once. The native build needs `g++`, `cc`, `make`, `pkg-config`, and OpenSSL development files; the setup script uses Docker when that toolchain is unavailable. The helper installs its tools under its ignored `build/` directory.

```bash
"$BRUTV_IOS/setup-zsign.sh"
```

Use an existing measured storage ledger whose root store is this checkout's `build/` directory. If one is not configured, follow [the storage measurement and admission guide](../../docs/render-storage.md) before copying artifacts. Preserve existing leases. Download the `ios-native-archive-<build-number>` artifact from the successful workflow run inside an admitted reservation, then check its provenance:

```bash
export BUILD=32
export RUN_ID=SUCCESSFUL_RUN_ID
export NATIVE_DIR="$PWD/build/ios-testflight-$BUILD"
export STORAGE_BUDGET=/absolute/path/to/existing/shared-budget
node scripts/render-storage.mjs status --budget "$STORAGE_BUDGET"
node scripts/render-storage.mjs admit \
  --budget "$STORAGE_BUDGET" --store root --bytes 8589934592 \
  --output "$NATIVE_DIR" -- bash -c '
    set -euo pipefail
    mkdir -p "$NATIVE_DIR"
    GH_CONFIG_DIR="$HOME/.config/gh-personal" gh run download "$RUN_ID" \
      --repo bvolpato/leetllm --name "ios-native-archive-$BUILD" \
      --dir "$NATIVE_DIR"
    unzip "$NATIVE_DIR/ios-native-archive.zip" -d "$NATIVE_DIR"
  '
jq '{sourceCommit, bundleId, shortVersion, buildNumber, xcodeVersion, sdkVersion}' \
  "$NATIVE_DIR/native-ios-release/provenance.json"
```

Create a gitignored `.env` file in the LeetLLM repository root with the local signing and App Store Connect values. Keep the `.p12` and `.p8` private keys outside Git. Point the profile path at the local `LeetLLM Local App Store 20261111` profile. Set the file permissions before using it:

```bash
IOS_CERTIFICATE_PATH="/absolute/path/to/local-distribution.p12"
IOS_P12_PASSWORD="<local-p12-password>"
IOS_PROFILE_NAME="LeetLLM Local App Store 20261111"
IOS_PROVISIONING_PROFILE_PATH="/absolute/path/to/LeetLLM.profile.mobileprovision"
IOS_ASC_KEY_ID="<app-store-connect-key-id>"
IOS_ASC_ISSUER_ID="<app-store-connect-issuer-uuid>"
IOS_ASC_PRIVATE_KEY_PATH="/absolute/path/to/AuthKey.p8"
```

```bash
chmod 600 .env
```

```bash
mkdir -p "$NATIVE_DIR/tmp"
node scripts/render-storage.mjs admit \
  --budget "$STORAGE_BUDGET" --store root --bytes 8589934592 \
  --output "$NATIVE_DIR" -- env \
  TMPDIR="$NATIVE_DIR/tmp" \
  IOS_APP_STORE_ID=6759850761 IOS_BUNDLE_ID=com.leetllm.ios \
  IOS_TEAM_ID="$IOS_TEAM_ID" \
  IOS_PROVISIONING_PROFILE_PATH='/absolute/path/to/LeetLLM.profile.mobileprovision' \
  IOS_ENTITLEMENTS_PATH="$NATIVE_DIR/native-ios-release/signing-entitlements.plist" \
  IOS_RELEASE_DIR="$NATIVE_DIR/signed" \
  uv run --no-project --env-file .env -- "$BRUTV_IOS/release.sh" \
    --platform ios \
    --app "$NATIVE_DIR/native-ios-release/Application.xcarchive/Products/Applications/LeetLLM.app"

uv run --no-project --env-file .env "$BRUTV_IOS/upload-build.py" \
  "$NATIVE_DIR/signed/export/BruTV.ipa" --app-id 6759850761 \
  --testflight-group 'LeetLLM Beta' \
  --whats-new 'Check lesson reading, quizzes, notes, bookmarks, glossary, and offline content.'
```

The shared helper writes the LeetLLM package to `signed/export/BruTV.ipa`; package verification checks `com.leetllm.ios`. Signing releases its storage reservation before the upload waits for Apple. The uploader verifies availability in `LeetLLM Beta`. Add `--tester '<email>'` once per new internal tester.

For the existing external `Testers` group and its public link, use an App Manager API key and the processed build UUID printed by the uploader:

```bash
uv run --no-project --env-file .env "$BRUTV_IOS/upload-build.py" \
  --app-id 6759850761 --build-id BUILD_UUID \
  --external-testflight-group Testers
```

The external command submits TestFlight beta review when required and retains the group assignment while Apple reviews the build. A pending review can exceed the command timeout; resume with the same build UUID. Success requires external testing availability. These commands do not submit a production App Store version.

For a local macOS build instead of a downloaded archive, `mobile/ios/LeetLLM/release.sh --ios --upload` still archives, signs, and uploads with Xcode. Its `--mac` and `--all` options remain macOS-only.

---

## Screenshots and App Previews

Automated screenshot generation captures standard app pages for iPhone, iPad, and Mac.

### Generate iPhone Screenshots (6.9" and 6.7" formats)

```bash
IOS_SCREENSHOT_DEVICE='iPhone 16e' ./capture-screenshots.sh
```

### Generate iPad Screenshots (12.9" format)

```bash
IOS_SCREENSHOT_DEVICE='iPad Air 13-inch (M3)' IOS_SCREENSHOT_DIR="$PWD/screenshots/ipad" ./capture-screenshots.sh
```

### Generate Mac App Store Screenshots (16:10 aspect ratio)

```bash
uv run ../../../scripts/generate-mac-screenshots.py
```
This generates presentation screenshots at both required resolutions:
- 2880x1800 (`screenshots/mac/2880x1800/`)
- 2560x1600 (`screenshots/mac/2560x1600/`)

Running `./capture-screenshots.sh` executes the Mac screenshot generator automatically alongside the simulator captures.

---

## App Store Submission

### Uploading Artifacts
- **iOS IPA**: Upload `build/release/export/LeetLLM.ipa` using Transporter, Xcode Organizer, or `xcrun altool`.
- **Mac Catalyst PKG**: Upload `build/mac/export/LeetLLM.pkg` using Transporter or `./release.sh --mac --upload`.

1. **Via Xcode Organizer**: If built on a Mac in Xcode, archive it and click "Distribute App" -> "App Store Connect" -> "Upload".
2. **Via Transporter**: Download the Transporter app from the Mac App Store, drag and drop the generated `LeetLLM.ipa` file, and click Deliver.
3. **Via Fastlane (Optional)**:
   ```bash
   fastlane pilot upload --username "your@apple-id.com" --ipa "build/release/export/LeetLLM.ipa"
   ```

### Final Submission

1. Log in to App Store Connect → select **LeetLLM**.
2. Upload screenshots for **iPhone 6.7" Display** (e.g., iPhone 15/16 Pro Max resolution) and **iPad Pro 12.9" Display**.
3. Under **Build**, select your uploaded IPA version.
4. Fill in description, keywords, support URL, and age ratings.
5. Click **Add for Review** or **Submit for Review**.

---

## App Store Review Guidelines Checklist

Ensure the app respects the guidelines:
- [ ] No placeholder text or testing debug logs in the production build.
- [ ] Sign-in is optional (user can still read all bundled content offline without authentication).
- [ ] Account deletion option for users who sync with Supabase, available in AccountView or the web app.
- [ ] UI displays correctly in both dark and light modes.
