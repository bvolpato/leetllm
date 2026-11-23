# LeetLLM iOS App Plan

Goal: ship a universal SwiftUI app for iPhone and iPad where core learning content is bundled at compile time and works offline after install. Online auth/sync should only keep progress aligned across devices.

Run commands from the repository root. See [the app README](./LeetLLM/README.md) for current build and export instructions and [auth setup](../../docs/auth-setup.md) for provider release gates. The remaining items below are a planning backlog, not verified release readiness.

## Current Implementation

Implemented under `mobile/ios/LeetLLM/`:

- Universal SwiftUI app target and unit-test target.
- iPhone tab UX: Learn, Practice, Tracks, Glossary, Account.
- iPad split-view UX for Learn, Practice, Tracks, and Glossary.
- Offline `DataService` loading bundled JSON from `Resources/data`.
- Offline `ProgressStore` for read lessons, bookmarks, notes, theory quiz scores, and mastery quiz scores.
- Global theory quizzes on iOS.
- Lesson mastery quizzes on iOS.
- Lessons and public blog posts rendered from bundled content.
- Tracks with progress-aware lesson paths and a native personal weekly planner.
- Search/filter in Learn and Glossary.
- Account summary with local progress and Supabase auth/progress sync.
- Shared web/iOS Supabase identity with email/password, Google OAuth, native Sign in with Apple, and Keychain session storage.
- Coding practice metadata exported, but coding execution/editor UI is intentionally not available on iOS yet.
- Helper scripts for simulator tests, simulator builds, screenshots, and signed App Store IPA export.
- Local macOS scripts for export validation and simulator tests; PR CI validates shared exported content on Linux.

## Export Pipeline

Run:

```bash
pnpm --dir web ios:export
pnpm --dir web ios:validate
```

`ios:export` writes:

- `mobile/ios/LeetLLM/LeetLLM/Resources/data/lessons/index.json`
- `mobile/ios/LeetLLM/LeetLLM/Resources/data/lessons/{slug}.json`
- `mobile/ios/LeetLLM/LeetLLM/Resources/data/blogs/index.json`
- `mobile/ios/LeetLLM/LeetLLM/Resources/data/blogs/{slug}.json`
- `mobile/ios/LeetLLM/LeetLLM/Resources/data/tracks.json`
- `mobile/ios/LeetLLM/LeetLLM/Resources/data/theory-quizzes.json`
- `mobile/ios/LeetLLM/LeetLLM/Resources/data/glossary/index.json`
- `mobile/ios/LeetLLM/LeetLLM/Resources/data/practice/index.json`
- `mobile/ios/LeetLLM/LeetLLM/Resources/data/images/**`
- `mobile/ios/LeetLLM/LeetLLM/Resources/data/assets/**`

Counts live in generated `manifest.json`; export validation compares every collection with that manifest. Track definitions, embedded lessons, and planner levels, durations, and weekly-time options derive from web source and export to `tracks.json` and `learning-plan.json`.

## Native App Structure

```text
mobile/ios/LeetLLM/
├── LeetLLM.xcodeproj
├── LeetLLM/
│   ├── LeetLLMApp.swift
│   ├── AppRootView.swift
│   ├── Models/
│   │   └── ContentModels.swift
│   ├── Services/
│   │   ├── DataService.swift
│   │   ├── ProgressStore.swift
│   │   ├── SearchIndex.swift
│   │   └── SyncClient.swift
│   ├── Views/
│   │   ├── CommonViews.swift
│   │   ├── LearnViews.swift
│   │   ├── PracticeViews.swift
│   │   ├── TracksViews.swift
│   │   ├── GlossaryViews.swift
│   │   └── AccountView.swift
│   └── Resources/
│       ├── Assets.xcassets
│       └── data/
└── LeetLLMTests/
    ├── DataServiceTests.swift
    └── QuizScoringTests.swift
```

## Remaining Before TestFlight

- On macOS, run `mobile/ios/LeetLLM/test.sh`.
- On macOS, run `mobile/ios/LeetLLM/build.sh`.
- On macOS, run `IOS_SIM_DESTINATION='platform=iOS Simulator,name=iPad Pro 13-inch (M4)' mobile/ios/LeetLLM/build.sh`.
- Optional screenshots: `mobile/ios/LeetLLM/capture-screenshots.sh`.
- Signed IPA: configure env in `mobile/ios/LeetLLM/signing/README.md`, then run `mobile/ios/LeetLLM/release.sh`.
- Extend cross-device sync to bookmarks, notes, and mastery attempts.
- Complete Apple provider credentials and token revocation before enabling Apple in production.
- Add iPhone/iPad screenshots for App Store Connect.
- Refresh app icon with final brand art if desired.
- Decide whether mobile coding practice should become native later or stay web-only.
