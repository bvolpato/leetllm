# iOS 1.6 (21) UX and release report

Reviewed and tested on September 27, 2026. Version 1.6 (21) is signed and delivered to App Store Connect through Transporter. This release improves the native learning flows on iPhone and iPad. Quiz answer correction and resubmission remain supported, as requested.

## Learning home and library

- Added a clear Start learning or Continue learning action. It chooses the next unread lesson from the saved personal plan, then falls back to curriculum order.
- Added curriculum progress and direct access to the personal plan on the Learn screen.
- Added library filters for all lessons, unread lessons, bookmarks, lessons with notes, and read lessons.
- Added useful empty states for filtered libraries and a Show all lessons action.
- Made search available through the native search field. It searches lesson and blog metadata and article text.
- Added a clear No Results state and a Clear search action. Search and library filters hide the resume card so results remain visible.
- Corrected the available offline count and the current curriculum progress denominator.
- Preserved the selected article when returning to Learn. Adjacent lesson navigation replaces the reader destination so repeated Next actions do not create an unlimited back stack.

## Readers, notes, and offline resources

- Moved article titles before cover images so the reader identifies the lesson immediately.
- Added a Contents sheet with section jumps, plus Back to top and Share actions for lessons and blogs.
- Added a lesson actions menu with access to notes and the mastery check.
- Made notes save automatically while the learner types. Added a dedicated notes editor, a keyboard Done action, and a device-only save status.
- Avoided redundant note writes when the saved text has not changed.
- Preserved blog reading positions across app restarts. Readers restore their state once instead of repeatedly replacing it when a view reappears.
- Moved the Leety entry point into a bottom safe-area inset so it does not cover article content.
- Increased the read and bookmark controls and showed full adjacent lesson titles.
- Added native previews for bundled practice files, including JSONL, Python, and other text resources. The preview supports text selection and sharing without a network connection.
- Loaded text resources outside the main UI task and used TextKit 2 for large files. Non-text resources use Quick Look.
- Resolved bundled asset links from both native Markdown and the offline math renderer. File paths must remain inside the bundled assets directory.
- Corrected root-relative web links so they open on leetllm.com instead of resolving against a local file URL. Queries and fragments are preserved for web links.
- Restricted native lesson and glossary routing to the expected schemes and LeetLLM hosts.

## Quizzes

- Changed the quiz layout to one question at a time, with Previous, Next, and a question jump menu.
- Added an answered count and progress indicator above the question.
- Saved the current question, answer choices, shuffled answer order, last checked choices, and latest result across restarts.
- Scoped drafts by quiz kind and slug. A content change invalidates an old draft so answers cannot be applied to different questions.
- Preserved answer correction and Check again. An unchanged submission is disabled to prevent counting the same answers twice.
- Added clear feedback for the last check and a notice when answers have changed.
- Added confirmation before starting a new attempt. The best score remains saved.
- Prevented an empty quiz from submitting.
- Added explicit selected, correct, and incorrect states for assistive technology. The full answer row acts as a button without competing text-selection gestures.
- Kept separate quiz state when switching quizzes in the iPad detail pane. Question changes return the quiz runner to the top.

## Tracks, plans, and glossary

- Replaced delayed cross-tab navigation notifications with pending navigation requests owned by the app root. Lessons, theory quizzes, and personal plans can open reliably from other tabs.
- Added Start track and Continue track actions.
- Added Plan this track with the correct track selected in the plan form.
- Used configured plan defaults and enabled plan saving only when the preview is valid.
- Added an accessibility hint that coding activities open on the website. Coding execution remains web-only.
- Improved glossary ranking for exact and prefix alias matches.
- Presented glossary search as a flat ranked result list to avoid duplicate section identities.
- Dismissed a glossary sheet before opening a referenced lesson or blog.
- Set useful sidebar widths for Learn, Practice, Tracks, and Glossary on iPad. Track and quiz details use their content identity to keep state separate.

## Account and Leety

- Moved sign-in and sync controls closer to the top of Account.
- Trimmed the email address before sign-in, dismissed the keyboard, and guarded busy actions against repeated requests.
- Replaced competing account confirmation dialogs with one explicit alert for reset, sign-out, or deletion. Each alert explains what is removed and whether synced progress remains.
- Resetting local progress now clears quiz drafts and recreates open reader, quiz, and plan views so stale notes or selections cannot return.
- Added global reading appearance settings, privacy and terms links, and the app version to Account.
- Preserved pending Leety questions after an offline failure. A resumed request uses the same request ID.
- Cancelled hidden chat sends while retaining the pending question for resume. Chat state is scoped to the page and account, and the sheet closes when the account changes.
- Increased the chat send target and respected Reduce Motion for the thinking indicator.

## Accessibility and release packaging

- Fixed double Dynamic Type scaling in serif text and citation fonts. The largest accessibility size now receives one scale operation.
- Recovered safely from invalid saved font sizes, fonts, or themes. Reader sizes stay within 14 to 30 points.
- Added heading traits, clear font-size control labels, and an accessible full-screen image close button.
- Improved contrast for status text, quiz explanations, and code language labels.
- Added descriptive code sample and language labels. Decorative code window indicators are hidden from VoiceOver, and code headers can grow with larger text.
- Added an app privacy manifest for app-owned UserDefaults access and the account, progress, and question data used for app functionality. Tracking is disabled.
- Added the exempt encryption declaration to Info.plist.
- Updated the release script to use its own temporary signing keychain and restore the previous keychain search list. A separate release directory preserves an earlier build.
- Updated the app to version 1.6, build 21, and added localized release notes.
- Refreshed the offline bundle to 197 lessons, 20 blogs, 8 tracks, 757 glossary entries, 4 theory quizzes, and 47 coding-practice summaries. The bundle contains 3,376 images and 43 practice assets.
- Excluded Python bytecode and `__pycache__` directories from exported assets. Added validation for this packaging contract and the manifest asset count.

## Validation

The native UI tests use a separate preferences suite and forced offline mode. Reset tests affect only this test state. The test suite includes nine new unit regression tests and 16 new native UI flow tests. The shared Xcode scheme now includes the native UI test target.

- All 48 native unit tests passed on iPhone and iPad. They cover content decoding, private-content isolation, parser and table behavior, learning plans, OAuth callbacks and PKCE, quiz scoring and persistence, note writes, reader preferences, URL routing, bundled files, and Leety retry behavior.
- All 16 iPhone UI flows passed across the full suite and focused reruns after fixes. They cover every main screen, personal plan navigation, bookmarks and empty search recovery, section jumps, appearance, note and blog restoration, quiz corrections and drafts, glossary search, offline account controls, local reset, bundled file previews, accessibility descriptions, and launch performance.
- All 16 iPad UI flows passed across the full suite and focused reruns. The full run found the code sample label issue and a test selector that assumed a bottom tab bar. The corrected accessibility check, reader appearance checks, and reset flow passed in focused reruns.
- The iPhone checks also passed at the largest system accessibility text size for main screens, landscape and large-text reading, and quiz restoration. The reader size limit of 30 points was exercised.
- Reviewed screenshots of the learning library, native quiz, personal plan, and light and dark readers. The devices were iPhone 16e and iPad Air 13-inch (M3) simulators on iOS 26.2.
- Debug simulator launch measurements averaged 1.540 seconds on iPhone and 2.116 seconds on iPad over five iterations each. These are observed measurements, with no before-change baseline or physical-device result.
- Eight targeted web export tests passed. Before committing, all 675 web tests in 104 files passed with the dependencies installed from the frozen lockfile. The dependency audit found no known vulnerabilities, and full linting passed.
- Full TypeScript checking and the production web build passed with the frozen-lockfile dependencies. The successful build reported nine warnings, including broad content file patterns in existing web loaders.
- The content export validator passed. The bytecode regression check first rejected the original contaminated bundle, then passed after the exporter excluded those files.
- The live integration smoke test passed with the dedicated test account. Leety accepted a normal web cookie session, a native-style Bearer token, and a refreshed Bearer token. The responses passed the script's grounding and source checks.
- Property lists, the Xcode project file, release shell syntax, and git whitespace checks passed.

These checks do not establish behavior on physical devices or every supported iOS version. The simulator runs use iOS 26.2. Interactive Apple and Google sign-in, the signed-in chat UI, and live account deletion were not exercised. The live API checks cover password sign-in, refresh, and authenticated Leety requests. The IPA was delivered to App Store Connect through Transporter.

### Native test evidence

The full runs identified issues. Focused reruns verified the fixes; the table distinguishes those results. These results were recorded before the local result bundles were deleted at the user's request to recover disk space.

| Result bundle under `LeetLLM/build/qa/` | Result |
|---|---|
| `iphone-verified.xcresult` | 48 unit tests and 15 of 16 UI flows passed. Search recovery failed and was fixed. |
| `iphone-recovery.xcresult` | 48 unit tests, search recovery, and the final native file preview passed. |
| `iphone-large-text-fixed.xcresult` | Main screens and reader layouts passed at the largest system text size. The quiz restoration assertion needed to scroll to the restored question. |
| `iphone-large-quiz.xcresult` | Quiz selection, restoration, and draft isolation passed at the largest system text size. |
| `ipad-final.xcresult` | 48 unit tests and 14 of 16 UI flows passed. The code label and floating-tab test selector were corrected. |
| `ipad-accessibility-fixed.xcresult` | 48 unit tests, accessibility descriptions, landscape and large-text reading, and reader appearance passed. |
| `ipad-reset.xcresult` | Reset cleared the bookmark and note in the previously open reader. |
| `iphone-final-check.xcresult` | The final accessibility and reset checks passed. Tab selection now supports floating iPad tabs and bottom iPhone tabs. |

## Signed IPA

- **Original IPA path:** `LeetLLM/build/release-1.6-21/export/LeetLLM.ipa` (local copy deleted after delivery).
- **Original archive path:** `LeetLLM/build/release-1.6-21/LeetLLM.xcarchive` (local copy deleted after delivery).
- **Version:** 1.6 (21)
- **Bundle identifier:** `com.leetllm.ios`
- **Team:** Configured via `IOS_TEAM_ID`
- **Targets:** iPhone and iPad, arm64, iOS 17.0 or later.
- **Size:** 442,559,575 bytes (422.1 MiB).
- **SHA-256:** `2e8b6540b420c03e12c72e5557337eeb1cf9063928ad2fb02d59f97254a1e48c`

The Release simulator build, signed device archive, and App Store Connect export succeeded with Xcode 26.2. The exported IPA passed ZIP integrity and strict code-signature verification. Its bundle identifier, version, device families, minimum iOS version, distribution entitlements, and Sign in with Apple entitlement match the release configuration. Debugging is disabled through `get-task-allow = false`. The embedded profile is named LeetLLM and expires on January 30, 2027 at 03:11:56 UTC.

The exported privacy manifest and content manifest match the validated source files. The package contains no test plug-ins, test reset flags, Python bytecode, or private content directory. The original keychain search list was restored, and the earlier release directory was preserved during packaging.

Transporter confirmed delivery of LeetLLM 1.6 (21), App ID `6759850761`, on September 27, 2026 at 20:54 as displayed in Transporter. The build status was "The app is processing" when delivery completed.

## Local cleanup after delivery

At the user's request, removed the LeetLLM iPhone 16e and iPad Air 13 test devices, the iOS 26.2 simulator runtime and its dyld cache, the complete generated native `LeetLLM/build` directory, and this project's Xcode DerivedData. This includes the local IPA, both release archives, simulator app binaries, screenshots, and test result bundles. The source code and signing credentials remain available. Deleting these local files does not remove the App Store Connect delivery.

The APFS Data volume's available space increased from 27.5 GiB to 45.0 GiB during cleanup, a measured increase of approximately 17.5 GiB. Build activity was still running, so this is a net filesystem measurement. Verified that the selected device directories, runtime image, runtime cache, build directory, and DerivedData directory no longer exist, and that the runtime is no longer mounted.
