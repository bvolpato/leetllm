# iOS Signing

Keep all Apple signing certificates (`.p12`), provisioning profiles (`.mobileprovision`), and App Store Connect keys (`AuthKey_*.p8`) outside Git in the gitignored `secrets/ios/` directory at the repository root.

Configure signing and App Store Connect credentials in the gitignored root `.env` (or `secrets/deploy.env`) file. Do not commit `.p12`, `.p8`, `.mobileprovision`, passwords, or API keys to Git or GitHub Actions.

```bash
IOS_TEAM_ID="<apple-developer-team-id>"
IOS_CERTIFICATE_PATH="/absolute/path/to/secrets/ios/local-distribution.p12"
IOS_P12_PASSWORD="<local-p12-password>"
IOS_PROVISIONING_PROFILE_PATH="/absolute/path/to/secrets/ios/LeetLLM.mobileprovision"
IOS_PROFILE_NAME="<provisioning-profile-name>"
IOS_ASC_KEY_ID="<app-store-connect-key-id>"
IOS_ASC_ISSUER_ID="<app-store-connect-issuer-uuid>"
IOS_ASC_PRIVATE_KEY_PATH="/absolute/path/to/secrets/ios/AuthKey.p8"
```

Use the shared BruTV Linux signer and archive flow in the [iOS release guide](../../RELEASE.md). It builds the pinned zsign tool locally, signs the downloaded native Xcode archive, and uploads through App Store Connect. The macOS `release.sh` path is available when a Mac with Xcode is available.
