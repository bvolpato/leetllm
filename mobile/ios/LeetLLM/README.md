# LeetLLM (iOS & macOS)

Universal SwiftUI application for iPhone, iPad, and Mac. Core curriculum content is pre-bundled for offline use.

On macOS (Apple Silicon Macs running macOS 11+ via Mac App Store / Designed for iPad), LeetLLM operates as a desktop app with multi-column navigation, resizable windowing, and keyboard shortcuts.

## Key Features

- **197 Progressive Lessons**: Complete offline access to all 15 curriculum phases with rendered KaTeX formulas and diagrams.
- **8 Learning Tracks**: Structured curriculum paths with completion indicators and personal schedule planner.
- **4 Theory Quizzes & Mastery Checks**: Interactive quizzes that preserve draft state, shuffle options deterministically, and save best scores.
- **757 Glossary Terms**: Searchable technical reference with pre-rendered architecture diagrams and relevance ranking.
- **47 Coding Practice Fixtures**: Native problem summaries and local test fixtures with direct links to web execution.
- **Desktop Keyboard Shortcuts (macOS & iPad)**:
  - `⌘1`: Learn tab
  - `⌘2`: Practice tab
  - `⌘3`: Tracks tab
  - `⌘4`: Glossary tab
  - `⌘5`: Account tab
  - `⌘+`: Increase text size
  - `⌘-`: Decrease text size
  - `⌘0`: Reset text size
- **Cross-Platform Sync**: Optional sign-in via email, Google OAuth, or Sign in with Apple to synchronize reading progress and quiz accomplishments across devices.

## Content Export

From the repository root:

```bash
pnpm --dir web ios:export
pnpm --dir web ios:validate
```

The export script compiles 197 lessons, 8 tracks, 4 theory quizzes, 757 glossary entries, and 3,370 light and dark diagrams into `LeetLLM/Resources/data`. KaTeX JavaScript, stylesheets, and fonts are pre-bundled for offline math rendering.

## Building and Running

### Build for macOS (Native Apple Silicon)

To build and run directly on your Mac:

```bash
cd mobile/ios/LeetLLM
./build-mac.sh
```

Or pass `--mac` to `build.sh`:

```bash
./build.sh --mac
```

The script compiles for `platform=macOS,arch=arm64`, applies a local code signature, and outputs the application path ready to launch with `open`.

### Build for iOS Simulator

```bash
cd mobile/ios/LeetLLM
./build.sh

# Or target iPad simulator
IOS_SIM_DESTINATION='platform=iOS Simulator,name=iPad Air 13-inch (M4)' ./build.sh
```

### Run Tests

```bash
cd mobile/ios/LeetLLM
./test.sh
```

Runs all 48 unit tests (`LeetLLMTests`) and 17 UI test flows (`LeetLLMUITests`).

### Package Signed App Store IPA

```bash
cd mobile/ios/LeetLLM
./package-ipa.sh
```

Builds the release archive and exports a signed App Store IPA with automatic provisioning and distribution certificate. The resulting IPA supports iPhone, iPad, and Mac App Store downloads on Apple Silicon Macs.
