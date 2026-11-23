import UIKit
import XCTest
@testable import LeetLLM

@MainActor
final class DataServiceTests: XCTestCase {
    func testBundledPracticeFilesResolveForNativeAndMathReaders() {
        let service = DataService(dataRootURL: testDataRootURL())
        let path = "assets/foundations/git-shell-linux-reproducible-ai/assets/access_requests.jsonl"
        let local = bundledAssetURL(for: URL(string: path)!, dataService: service)
        XCTAssertNotNil(local)
        XCTAssertEqual(local.flatMap { bundledAssetURL(for: $0, dataService: service) }, local)
        XCTAssertNil(bundledAssetURL(for: URL(string: "assets/../../Info.plist")!, dataService: service))
        XCTAssertNil(bundledAssetURL(for: URL(fileURLWithPath: "/etc/passwd"), dataService: service))
        XCTAssertNil(bundledAssetURL(for: URL(string: "https://example.com/assets/file.py")!, dataService: service))
    }

    func testRelativeWebLinksKeepQueryAndMathLinksUseWebOrigin() {
        XCTAssertEqual(externalContentURL(for: URL(string: "/practice/ttl-key-value-store?language=python#tests")!)?.absoluteString, "https://leetllm.com/practice/ttl-key-value-store?language=python#tests")
        XCTAssertNil(externalContentURL(for: URL(string: "//example.com/practice/test")!))
        let html = renderInlineMarkdownHTML("Read [attention](/learn/attention) for $x$.")
        XCTAssertTrue(html.contains("href=\"https://leetllm.com/learn/attention\""))
    }

    func testLeetyKeepsOfflineQuestionForRetry() async {
        let account = "test-offline-\(UUID().uuidString)"
        defer { LeetyConversationStore.clearAll(accountID: account) }
        let called = expectation(description: "Offline send attempted")
        let client = StubLeetyClient { _, _, _ in
            defer { called.fulfill() }
            throw SyncClientError.offline
        }
        let conversation = LeetyConversation(pathname: "/learn/attention", title: "Attention", accountID: account, client: client)
        conversation.submit("Why is attention scaled?")
        await fulfillment(of: [called], timeout: 2)
        XCTAssertTrue(conversation.canResume)
        XCTAssertFalse(conversation.isSending)
        let saved = LeetyConversationStore.load(accountID: account, pathname: "/learn/attention")
        XCTAssertNotNil(saved.pendingRequestID)
        XCTAssertEqual(saved.messages.last?.content, "Why is attention scaled?")
    }

    func testLeetyResumesWithSameRequestIDAndClearsPendingOnSuccess() async {
        let account = "test-resume-\(UUID().uuidString)"
        defer { LeetyConversationStore.clearAll(accountID: account) }
        let requestID = UUID()
        LeetyConversationStore.save(LeetyStoredConversation(messages: [LeetyChatMessage(role: .user, content: "Explain the shape")], pageTitle: nil, pendingRequestID: requestID), accountID: account, pathname: "/learn/shapes")
        let called = expectation(description: "Saved request resumed")
        let client = StubLeetyClient { path, messages, id in
            defer { called.fulfill() }
            XCTAssertEqual(path, "/learn/shapes")
            XCTAssertEqual(messages.last?.content, "Explain the shape")
            XCTAssertEqual(id, requestID)
            return LeetyResponse(status: "answer", answer: "A matrix has two axes.", sources: [], pageTitle: "Shapes")
        }
        let conversation = LeetyConversation(pathname: "/learn/shapes", title: "Shapes", accountID: account, client: client)
        await fulfillment(of: [called], timeout: 2)
        XCTAssertFalse(conversation.canResume)
        XCTAssertEqual(conversation.messages.last?.role, .assistant)
        XCTAssertNil(LeetyConversationStore.load(accountID: account, pathname: "/learn/shapes").pendingRequestID)
    }

    func testOnlyLeetLLMLinksOpenNativeLessons() {
        XCTAssertEqual(learnRoute(for: URL(string: "https://leetllm.com/learn/attention")!), .lesson("attention"))
        XCTAssertNil(learnRoute(for: URL(string: "/blog/building-agents")!))
        XCTAssertNil(learnRoute(for: URL(string: "https://example.com/learn/attention")!))
        XCTAssertNil(learnRoute(for: URL(string: "https://leetllm.com/other/learn/attention")!))
        XCTAssertNil(learnRoute(for: URL(string: "javascript:/learn/attention")!))
    }

    func testReaderSettingsRecoverFromInvalidSavedPreferences() {
        let suite = "leetllm-ios-tests-reader-settings"
        let defaults = UserDefaults(suiteName: suite)!
        defaults.removePersistentDomain(forName: suite)
        defer { defaults.removePersistentDomain(forName: suite) }
        defaults.set(500.0, forKey: "reader_font_size")
        defaults.set("missing-font", forKey: "reader_font_theme")
        defaults.set("missing-theme", forKey: "reader_color_scheme")
        let settings = ReaderSettings(userDefaults: defaults)
        XCTAssertEqual(settings.fontSize, 30)
        XCTAssertEqual(settings.fontTheme, "serif")
        XCTAssertEqual(settings.readerColorScheme, "system")
        defaults.set(-1.0, forKey: "reader_font_size")
        XCTAssertEqual(ReaderSettings(userDefaults: defaults).fontSize, 14)
    }

    func testBundledContentDecodes() {
        let service = DataService(dataRootURL: testDataRootURL())

        XCTAssertNil(service.loadError)
        XCTAssertGreaterThanOrEqual(service.lessons.count, 150)
        XCTAssertGreaterThanOrEqual(service.blogs.count, 10)
        XCTAssertEqual(service.lessons.count, service.manifest?.lessonCount)
        XCTAssertEqual(service.glossary.count, service.manifest?.glossaryCount)
        XCTAssertGreaterThanOrEqual(service.glossary.count, 700)
        guard let firstLesson = service.lessons.first, let firstBlog = service.blogs.first else {
            XCTFail("Bundled content failed to load: \(service.loadError ?? "empty lessons/blogs")")
            return
        }
        XCTAssertNotNil(service.lesson(slug: firstLesson.slug))
        XCTAssertNotNil(service.blog(slug: firstBlog.slug))
    }

    func testPrivateBlogsAreNeverEmbeddedInPublicAppBundle() {
        let service = DataService(dataRootURL: testDataRootURL())
        let slug = "glm-53-training-masterclass-3c1efdc30f7c0d3341d5"
        let allowedEmail = "owner@example.com"

        XCTAssertFalse(service.blogs.contains { $0.slug == slug })
        XCTAssertTrue(service.blogs.allSatisfy { $0.accessEmail == nil })
        XCTAssertNil(service.blog(slug: slug))
        XCTAssertFalse(BlogAccess.isAllowed(requiredEmail: allowedEmail, userEmail: allowedEmail, isAuthenticated: false))
        XCTAssertFalse(BlogAccess.isAllowed(requiredEmail: allowedEmail, userEmail: "someone@example.com", isAuthenticated: true))
        XCTAssertTrue(BlogAccess.isAllowed(requiredEmail: allowedEmail, userEmail: " OWNER@EXAMPLE.COM ", isAuthenticated: true))
    }

    func testLessonImagesPointAtBundledFiles() {
        let service = DataService(dataRootURL: testDataRootURL())
        guard let first = service.lessons.first else {
            XCTFail("Missing lessons: \(service.loadError ?? "empty")")
            return
        }
        let lesson = service.lesson(slug: first.slug)

        XCTAssertNotNil(lesson?.coverImageDark)
        XCTAssertNotNil(lesson?.coverImageLight)
        if let path = lesson?.coverImageDark {
            let url = service.resourceURL(path: path)
            XCTAssertNotNil(url)
            if let url {
                XCTAssertTrue(FileManager.default.fileExists(atPath: url.path))
            }
        }
    }

    func testLoadedImageRemainsVisibleWhenItReappears() async {
        let state = BundleImageLoadState()
        let image = UIImage()
        let key = BundleImageKey(path: "images/diagram.png")
        await state.load(key: key) { image }
        XCTAssertTrue(state.image(for: key) === image)

        var reloaded = false
        await state.load(key: key) {
            reloaded = true
            return nil
        }

        XCTAssertTrue(state.image(for: key) === image)
        XCTAssertFalse(state.failedToLoad)
        XCTAssertFalse(reloaded)
    }

    func testImageChangesWithPathAndRetriesAfterFailure() async {
        let state = BundleImageLoadState()
        let light = UIImage()
        let dark = UIImage()
        await state.load(key: BundleImageKey(path: "light.png")) { light }
        await state.load(key: BundleImageKey(path: "dark.png")) {
            XCTAssertNil(state.image)
            return dark
        }
        XCTAssertTrue(state.image === dark)

        await state.load(key: BundleImageKey(path: "missing.png")) { nil }
        XCTAssertNil(state.image)
        XCTAssertTrue(state.failedToLoad)

        await state.load(key: BundleImageKey(path: "missing.png")) { light }
        XCTAssertTrue(state.image === light)
        XCTAssertFalse(state.failedToLoad)
    }

    func testPrivateImageRefreshInvalidatesPreviousImage() async {
        let state = BundleImageLoadState()
        let oldKey = BundleImageKey(path: "private-blog-images/diagram.png", privateContentVersion: 1)
        let newKey = BundleImageKey(path: "private-blog-images/diagram.png", privateContentVersion: 2)
        let oldImage = UIImage()
        let newImage = UIImage()
        await state.load(key: oldKey) { oldImage }
        XCTAssertTrue(state.image(for: oldKey) === oldImage)
        XCTAssertNil(state.image(for: newKey))

        await state.load(key: newKey) { newImage }
        XCTAssertTrue(state.image(for: newKey) === newImage)
        XCTAssertNil(state.image(for: oldKey))
    }

    func testAlreadyCancelledImageLoadCannotClearCurrentImage() async {
        let state = BundleImageLoadState()
        let currentKey = BundleImageKey(path: "dark.png")
        let currentImage = UIImage()
        await state.load(key: currentKey) { currentImage }

        var started = false
        let cancelledTask = Task {
            withUnsafeCurrentTask { $0?.cancel() }
            await state.load(key: BundleImageKey(path: "light.png")) {
                started = true
                return UIImage()
            }
        }
        await cancelledTask.value

        XCTAssertTrue(state.image(for: currentKey) === currentImage)
        XCTAssertFalse(started)
    }

    func testCancelledImageLoadCannotReplaceNewerImage() async {
        let state = BundleImageLoadState()
        let started = expectation(description: "First image load started")
        var continuation: CheckedContinuation<UIImage?, Never>?
        let oldImage = UIImage()
        let newImage = UIImage()

        let oldTask = Task {
            await state.load(key: BundleImageKey(path: "light.png")) {
                await withCheckedContinuation { pending in
                    continuation = pending
                    started.fulfill()
                }
            }
        }
        await fulfillment(of: [started], timeout: 2)
        oldTask.cancel()
        await state.load(key: BundleImageKey(path: "dark.png")) { newImage }
        continuation?.resume(returning: oldImage)
        await oldTask.value

        XCTAssertTrue(state.image === newImage)
        XCTAssertFalse(state.failedToLoad)
    }

    func testPrivateMasterclassLoadsForOwnerAndClearsOnSignOut() async throws {
        let service = DataService(dataRootURL: testDataRootURL())
        let response = try privateBlogFixture()
        let slug = response.blogs[0].slug
        let originalCount = service.blogs.count

        await service.refreshPrivateBlogs(accountID: "owner", userEmail: " BRUNOCVCUNHA@gmail.com ") { response }
        XCTAssertEqual(service.blogs.count, originalCount + 1)
        XCTAssertEqual(service.blog(slug: slug)?.content, "Private trajectory ledger")
        XCTAssertNotNil(service.blogIndex(slug: slug))
        XCTAssertEqual(service.privateImageData(path: "private-blog-images/fixture.png"), Data("image".utf8))
        let matches = await service.contentSearchMatches(normalizedQuery: "trajectory")
        XCTAssertNotNil(matches.blogSnippets[slug])

        await service.refreshPrivateBlogs(accountID: nil, userEmail: nil) {
            XCTFail("Signed-out requests must not fetch private content")
            return response
        }
        XCTAssertEqual(service.blogs.count, originalCount)
        XCTAssertNil(service.blog(slug: slug))
        XCTAssertNil(service.blogIndex(slug: slug))
        XCTAssertNil(service.privateImageData(path: "private-blog-images/fixture.png"))
    }

    func testPrivateContentCannotBeUsedByAnotherAccount() async throws {
        let service = DataService(dataRootURL: testDataRootURL())
        let response = try privateBlogFixture()
        await service.refreshPrivateBlogs(accountID: "other", userEmail: "someone@example.com") { response }
        XCTAssertNil(service.blog(slug: response.blogs[0].slug))
        XCTAssertNil(service.privateImageData(path: "private-blog-images/fixture.png"))
        XCTAssertNotNil(service.privateBlogError)
    }

    func testFailedPrivateRefreshClearsPreviouslyLoadedContent() async throws {
        let service = DataService(dataRootURL: testDataRootURL())
        let response = try privateBlogFixture()
        await service.refreshPrivateBlogs(accountID: "owner", userEmail: "owner@example.com") { response }
        await service.refreshPrivateBlogs(accountID: "owner", userEmail: "owner@example.com") {
            throw URLError(.notConnectedToInternet)
        }
        XCTAssertNil(service.blog(slug: response.blogs[0].slug))
        XCTAssertNil(service.privateImageData(path: "private-blog-images/fixture.png"))
        XCTAssertNotNil(service.privateBlogError)
        XCTAssertFalse(service.isLoadingPrivateBlogs)
    }

    func testLatePrivateResponseCannotRestoreContentAfterAccountChange() async throws {
        let service = DataService(dataRootURL: testDataRootURL())
        let response = try privateBlogFixture()
        let started = expectation(description: "Private request started")
        var pending: CheckedContinuation<PrivateBlogResponse, Error>?
        let task = Task {
            await service.refreshPrivateBlogs(accountID: "owner", userEmail: "owner@example.com") {
                try await withCheckedThrowingContinuation { continuation in
                    pending = continuation
                    started.fulfill()
                }
            }
        }
        await fulfillment(of: [started], timeout: 2)
        await service.refreshPrivateBlogs(accountID: "other", userEmail: "someone@example.com") {
            PrivateBlogResponse(blogs: [], images: [:])
        }
        pending?.resume(returning: response)
        await task.value
        XCTAssertNil(service.blog(slug: response.blogs[0].slug))
        XCTAssertNil(service.privateImageData(path: "private-blog-images/fixture.png"))
        XCTAssertFalse(service.isLoadingPrivateBlogs)
    }

    private func privateBlogFixture() throws -> PrivateBlogResponse {
        let json = """
        {"blogs":[{"id":"private-masterclass","slug":"private-masterclass","title":"GLM-5.3 Training Masterclass",
        "excerpt":"Private lesson","author":{"name":"LeetLLM"},"publishedAt":"2026-09-02","tags":[],
        "timeEstimate":10,"featured":false,"accessEmail":"owner@example.com",
        "content":"Private trajectory ledger","references":[],"images":[]}],
        "images":{"private-blog-images/fixture.png":"aW1hZ2U="}}
        """
        return try JSONDecoder().decode(PrivateBlogResponse.self, from: Data(json.utf8))
    }

    func testGlossarySortModesUseAlphabeticalAndRelevanceOrder() {
        let service = DataService(dataRootURL: testDataRootURL())

        let alphabetical = GlossarySortMode.alphabetical.sort(service.glossary)
        XCTAssertTrue(zip(alphabetical, alphabetical.dropFirst()).allSatisfy { pair in
            GlossarySortMode.alphabetical.compare(pair.0, pair.1)
        })

        let relevance = GlossarySortMode.relevance.sort(service.glossary)
        XCTAssertTrue(zip(relevance, relevance.dropFirst()).allSatisfy { pair in
            GlossarySortMode.relevance.compare(pair.0, pair.1)
        })
        XCTAssertNotEqual(alphabetical.prefix(5).map(\.id), relevance.prefix(5).map(\.id))
    }

    func testGlossaryListSummariesAndRelatedTermsArePresentationReady() {
        let service = DataService(dataRootURL: testDataRootURL())
        let ids = Set(service.glossary.map(\.id))

        for entry in service.glossary {
            XCTAssertFalse(entry.summary.isEmpty, "Missing summary for \(entry.id)")
            XCTAssertFalse(entry.summary.contains("**"), "Raw bold Markdown in \(entry.id)")
            XCTAssertFalse(entry.summary.contains("*"), "Raw emphasis Markdown in \(entry.id)")
            XCTAssertFalse(entry.summary.contains("`"), "Raw code Markdown in \(entry.id)")
            XCTAssertFalse(entry.summary.contains("]("), "Raw link target in \(entry.id)")
            XCTAssertTrue(entry.related?.allSatisfy { ids.contains($0.id) } ?? true)
        }

        XCTAssertGreaterThan(service.glossary.filter { !($0.related?.isEmpty ?? true) }.count, 300)
    }

    func testGlossarySearchCoversDetailedContent() {
        let service = DataService(dataRootURL: testDataRootURL())
        guard let entry = service.glossaryEntry(id: "prompt-injection") else {
            return XCTFail("Missing prompt-injection glossary entry")
        }

        XCTAssertTrue(service.glossaryMatches(entry, normalizedQuery: "ignore previous instructions"))
    }

    func testContentSearchFindsFullTextWithoutSingleCharacterDiskScans() async {
        let service = DataService(dataRootURL: testDataRootURL())

        let ignored = await service.contentSearchMatches(normalizedQuery: "a")
        XCTAssertTrue(ignored.lessonSnippets.isEmpty)
        XCTAssertTrue(ignored.blogSnippets.isEmpty)

        let matches = await service.contentSearchMatches(normalizedQuery: "posterior")
        XCTAssertNotNil(matches.lessonSnippets["bayesian-inference-priors-posteriors"])

        let cachedMatches = await service.contentSearchMatches(normalizedQuery: "conformal")
        XCTAssertNotNil(cachedMatches.lessonSnippets["conformal-prediction-uncertainty-sets"])
    }

    func testOfflineMathAssetsIncludeBundledFonts() {
        let service = DataService(dataRootURL: testDataRootURL())
        let font = service.resourceURL(path: "katex/fonts/KaTeX_Main-Regular.woff2")

        XCTAssertNotNil(font)
        XCTAssertTrue(font.map { FileManager.default.fileExists(atPath: $0.path) } ?? false)
    }

    func testGlossaryPresentationAvoidsDuplicateCodeAndUsageIDs() {
        let service = DataService(dataRootURL: testDataRootURL())

        for entry in service.glossary {
            if entry.code != nil, entry.searchableText.contains("```") {
                XCTAssertFalse(entry.shouldDisplayStandaloneCode, "Duplicate code panel for \(entry.id)")
            }
            if let usage = entry.usage {
                XCTAssertEqual(Set(usage.map(\.id)).count, usage.count, "Duplicate usage ID for \(entry.id)")
            }
        }
    }

    func testMixedInlineMarkdownHTMLPreservesFormattingLinksAndMath() {
        let html = renderInlineMarkdownHTML(
            "Use **top-k** with `heapq` and [RAG](glossary://rag): $S = QK^{\\top}$."
        )

        XCTAssertTrue(html.contains("<strong>top-k</strong>"))
        XCTAssertTrue(html.contains("<code>heapq</code>"))
        XCTAssertTrue(html.contains("<a href=\"glossary://rag\" data-glossary=\"rag\">RAG</a>"))
        XCTAssertTrue(html.contains("$S = QK^{\\top}$"))
        XCTAssertTrue(renderInlineMarkdownHTML("Emit `<unk>` safely.").contains("<code>&lt;unk&gt;</code>"))
        XCTAssertTrue(containsInlineMath("Probability $p(y \\mid x)$"))
        XCTAssertFalse(containsInlineMath("Price is \\$20"))
        XCTAssertFalse(containsInlineMath("Use `$HOME` and `$PATH`"))

        let escapedCurrency = "Refunds at $\\$40$ require review. The runtime does **not** pay yet. Timeout: $15$ minutes, then **no** refund."
        let escapedCurrencyHTML = renderInlineMarkdownHTML(escapedCurrency)
        XCTAssertTrue(escapedCurrencyHTML.contains("$\\$40$"))
        XCTAssertTrue(escapedCurrencyHTML.contains("<strong>not</strong>"))
        XCTAssertTrue(escapedCurrencyHTML.contains("<strong>no</strong>"))
        XCTAssertFalse(escapedCurrencyHTML.contains("**"))

        let citationHTML = renderInlineMarkdownHTML(
            "Claim<sup><a href=\"https://example.com/paper\">[1]</a></sup>."
        )
        XCTAssertTrue(citationHTML.contains("<sup class=\"reference-citation\">"))
        XCTAssertTrue(citationHTML.contains("<a href=\"https://example.com/paper\">[1]</a>"))
        XCTAssertFalse(citationHTML.contains("[[1]]"))

        let doiURL = "https://doi.org/10.1016/0893-6080(89)90020-8"
        let doiCitationHTML = renderInlineMarkdownHTML(
            "Claim<sup><a href=\"\(doiURL)\">[12]</a></sup> and score $x = 1$."
        )
        XCTAssertTrue(doiCitationHTML.contains("<a href=\"\(doiURL)\">[12]</a>"))
        XCTAssertFalse(doiCitationHTML.contains("[[12]]"))
    }

    func testInteractiveMarkdownTextPreservesGlossaryLinkAndInlineStyles() throws {
        let attributed = try AttributedString(
            markdown: "Use **[RAG ?](glossary://rag)** with `top-k`."
        )
        let baseFont = UIFont.systemFont(ofSize: 18)
        let rendered = interactiveMarkdownText(
            attributed,
            baseFont: baseFont,
            textColor: .label,
            lineSpacing: 4
        )
        let source = rendered.string as NSString
        let glossaryRange = source.range(of: "RAG ?")
        let codeRange = source.range(of: "top-k")

        let link = rendered.attribute(.link, at: glossaryRange.location, effectiveRange: nil) as? URL
        let termFont = rendered.attribute(.font, at: glossaryRange.location, effectiveRange: nil) as? UIFont
        let questionMarkFont = rendered.attribute(
            .font,
            at: NSMaxRange(glossaryRange) - 1,
            effectiveRange: nil
        ) as? UIFont
        let codeFont = rendered.attribute(.font, at: codeRange.location, effectiveRange: nil) as? UIFont

        XCTAssertEqual(link, URL(string: "glossary://rag"))
        let unwrappedTermFont = try XCTUnwrap(termFont)
        let unwrappedQuestionMarkFont = try XCTUnwrap(questionMarkFont)
        let unwrappedCodeFont = try XCTUnwrap(codeFont)
        XCTAssertTrue(unwrappedTermFont.fontDescriptor.symbolicTraits.contains(.traitBold))
        XCTAssertLessThan(unwrappedQuestionMarkFont.pointSize, unwrappedTermFont.pointSize)
        XCTAssertTrue(unwrappedCodeFont.fontDescriptor.symbolicTraits.contains(.traitMonoSpace))
        XCTAssertNil(rendered.attribute(.inlinePresentationIntent, at: glossaryRange.location, effectiveRange: nil))
        XCTAssertNil(rendered.attribute(.inlinePresentationIntent, at: codeRange.location, effectiveRange: nil))
    }

    func testInteractiveMarkdownTextRendersBookStyleCitationMarkers() throws {
        let doiURL = "https://doi.org/10.1016/0893-6080(89)90020-8"
        let normalized = normalizedInlineMarkdown(
            "Claim <sup><a href=\"https://example.com/paper\">[1]</a></sup> "
                + "and <sup><a href=\"\(doiURL)\">[12]</a></sup>."
        )
        let attributed = try AttributedString(
            markdown: normalized
        )
        XCTAssertEqual(String(attributed.characters), "Claim [1] and [12].")
        let baseFont = UIFont.systemFont(ofSize: 18)
        let rendered = interactiveMarkdownText(
            attributed,
            baseFont: baseFont,
            textColor: .label,
            lineSpacing: 4
        )
        let source = rendered.string as NSString

        for label in ["[1]", "[12]"] {
            let range = source.range(of: label)
            let font = try XCTUnwrap(
                rendered.attribute(.font, at: range.location, effectiveRange: nil) as? UIFont
            )
            let baselineOffset = try XCTUnwrap(
                rendered.attribute(.baselineOffset, at: range.location, effectiveRange: nil) as? NSNumber
            )
            XCTAssertLessThan(font.pointSize, baseFont.pointSize)
            XCTAssertGreaterThan(baselineOffset.doubleValue, 0)
            XCTAssertNotNil(rendered.attribute(.link, at: range.location, effectiveRange: nil))
        }
        let secondLink = try XCTUnwrap(
            rendered.attribute(.link, at: source.range(of: "[12]").location, effectiveRange: nil) as? URL
        )
        XCTAssertEqual(secondLink.absoluteString, doiURL)
        XCTAssertTrue(isReferenceCitationLabel("[1]"))
        XCTAssertFalse(isReferenceCitationLabel("[RAG]"))
    }

    func testMarkdownBlockParserPreservesStudyStructure() {
        let blocks = parseBlocks(
            """
            1. **Project** into $Q$, $K$, and $V$.
              - Keep dimensions named.
            2. **Score** pairs.

            > Check shapes before optimizing.

            ---
            """
        )

        XCTAssertEqual(blocks.count, 3)
        guard case .list(let items) = blocks[0].kind else {
            return XCTFail("Expected ordered list")
        }
        XCTAssertEqual(items.map(\.marker), ["1.", "•", "2."])
        XCTAssertEqual(items.map(\.level), [0, 1, 0])
        guard case .quote(let quote) = blocks[1].kind else {
            return XCTFail("Expected quote")
        }
        XCTAssertEqual(quote, "Check shapes before optimizing.")
        guard case .divider = blocks[2].kind else {
            return XCTFail("Expected divider")
        }
    }

    func testMarkdownParserPreservesAndSelectsThemedImageVariants() {
        for prefix in ["images", "private-blog-images"] {
            let blocks = parseBlocks(
                #"<img src="\#(prefix)/example_dark.png" alt="Example" data-themed-image="true" data-dark-src="\#(prefix)/example_dark.png" data-light-src="\#(prefix)/example_light.png" />"#
            )
            guard case .image(let path, let darkPath, let lightPath, let alt, let theme) = blocks.first?.kind else {
                return XCTFail("Expected themed image for \(prefix)")
            }
            XCTAssertEqual(path, "\(prefix)/example_dark.png")
            XCTAssertEqual(darkPath, "\(prefix)/example_dark.png")
            XCTAssertEqual(lightPath, "\(prefix)/example_light.png")
            XCTAssertEqual(alt, "Example")
            XCTAssertNil(theme)
            XCTAssertEqual(
                resolvedThemedImagePath(defaultPath: path, darkPath: darkPath, lightPath: lightPath, isDarkMode: false),
                "\(prefix)/example_light.png"
            )
            XCTAssertEqual(
                resolvedThemedImagePath(defaultPath: path, darkPath: darkPath, lightPath: lightPath, isDarkMode: true),
                "\(prefix)/example_dark.png"
            )
        }
    }

    func testMarkdownParserPreservesCodeDisclosuresAndEscapedTablePipes() {
        let blocks = parseBlocks(
            """
            ```html
            <!-- untrusted instruction -->
            <p>Keep this line.</p>
            <details><summary>Literal HTML</summary>Keep this too.</details>
            ````

            <details>
            <summary>Solution guide</summary>
            Hidden **answer**.
            </details>

            | Metric | Formula |
            | --- | --- |
            | KL | $D_{KL}(P \\| Q)$ |
            """
        )

        guard case .code(_, let source) = blocks[0].kind else {
            return XCTFail("Expected code block")
        }
        XCTAssertTrue(source.contains("<!-- untrusted instruction -->"))
        XCTAssertTrue(source.contains("<details><summary>Literal HTML</summary>Keep this too.</details>"))
        guard case .disclosure(let title, let content) = blocks[1].kind else {
            return XCTFail("Expected disclosure block")
        }
        XCTAssertEqual(title, "Solution guide")
        XCTAssertTrue(content.contains("Hidden **answer**."))
        guard case .table(let rows) = blocks[2].kind, let table = parseTable(rows) else {
            return XCTFail("Expected parsed table")
        }
        XCTAssertEqual(table.rows[0], ["KL", "$D_{KL}(P | Q)$"])
        XCTAssertEqual(table.alignments, [.leading, .leading])

        let alignedTable = parseTable([
            "| Metric | Value | Midpoint |",
            "| --- | ---: | :---: |",
            "| p95 | 120 ms | 100 ms |",
        ])
        XCTAssertEqual(alignedTable?.alignments, [.leading, .trailing, .center])

        let inlineCodeBlocks = parseBlocks("`<details><summary>Literal</summary>Inline code.</details>`")
        guard case .paragraph(let inlineCode) = inlineCodeBlocks.first?.kind else {
            return XCTFail("Expected inline code paragraph")
        }
        XCTAssertEqual(inlineCode, "`<details><summary>Literal</summary>Inline code.</details>`")
    }

    func testAdaptiveTableColumnsFillWidthAndWrapTrailingDescriptionsFirst() {
        let table = ParsedTable(
            headers: ["Stage", "Metric", "Why it matters"],
            rows: [
                ["Ingest", "p95 lag", "Stale source data can make otherwise grounded answers incorrect."],
                ["Serve", "TTFT", "Long queue waits hide capacity and admission-control failures."],
            ]
        )
        let narrowWidths = adaptiveTableColumnWidths(for: table, availableWidth: 420)
        let wideWidths = adaptiveTableColumnWidths(for: table, availableWidth: 900)

        XCTAssertEqual(narrowWidths.reduce(0, +) + 24 + 24, 420, accuracy: 0.5)
        XCTAssertEqual(wideWidths.reduce(0, +) + 24 + 24, 900, accuracy: 0.5)
        XCTAssertGreaterThan(
            wideWidths[2] - narrowWidths[2],
            wideWidths[0] - narrowWidths[0]
        )
    }

    func testAdaptiveTableColumnsScrollOnlyWhenColumnFloorsCannotFit() {
        let headers = (1...9).map { "Configuration \($0)" }
        let row = (1...9).map { "configuration_identifier_\($0)" }
        let table = ParsedTable(headers: headers, rows: [row])
        let availableWidth: CGFloat = 600
        let widths = adaptiveTableColumnWidths(for: table, availableWidth: availableWidth)
        let renderedWidth = widths.reduce(0, +) + CGFloat(widths.count - 1) * 12 + 24

        XCTAssertGreaterThan(renderedWidth, availableWidth)
    }

    func testBundledTracksMatchPublishedCurriculum() {
        let service = DataService(dataRootURL: testDataRootURL())

        XCTAssertEqual(service.tracks.count, service.manifest?.trackCount)
        XCTAssertEqual(Set(service.tracks.map(\.slug)).count, service.tracks.count)
        for track in service.tracks {
            XCTAssertFalse(track.lessonSlugs.isEmpty)
            XCTAssertEqual(track.lessons.map(\.slug), track.lessonSlugs)
            XCTAssertEqual(track.timeEstimate, "\(track.lessonSlugs.count) lessons")
        }

        let configuration = service.learningPlanConfiguration
        XCTAssertNotNil(configuration)
        XCTAssertEqual(configuration?.schemaVersion, 3)
        XCTAssertTrue(service.tracks.contains { $0.slug == configuration?.foundationTrackSlug })
        XCTAssertEqual(Set(configuration?.goals.map(\.trackSlug) ?? []), Set(service.tracks.map(\.slug)))
        XCTAssertNotNil(configuration?.goals.first { $0.value == "research" })
        XCTAssertFalse(configuration?.levels.isEmpty ?? true)
        XCTAssertFalse(configuration?.weeklyHours.isEmpty ?? true)
    }

    func testLearningPlanMatchesWebSchedulingRules() {
        let service = DataService(dataRootURL: testDataRootURL())
        guard let configuration = service.learningPlanConfiguration else {
            return XCTFail("Missing learning plan configuration")
        }
        guard let ragGoal = configuration.goals.first(where: { $0.value == "rag" }),
              let researchGoal = configuration.goals.first(where: { $0.value == "research" }) else {
            return XCTFail("Missing tested learning goals")
        }
        let exportedActivities = configuration.plans.flatMap { plan in
            plan.weeks.flatMap(\.activities)
        }
        XCTAssertTrue(exportedActivities.filter { $0.kind == "coding" }.allSatisfy { !$0.required })
        XCTAssertTrue(exportedActivities.filter { $0.kind == "milestone" }.allSatisfy { !$0.required })
        let beginnerSelection = LearningPlanSelection(
            trackSlug: ragGoal.trackSlug,
            level: "new",
            weeklyHours: 2
        )
        guard let beginnerPlan = LearningPlanBuilder.build(
            tracks: service.tracks,
            configuration: configuration,
            selection: beginnerSelection
        ), let beginnerLevel = configuration.levels.first(where: { $0.value == "new" }) else {
            return XCTFail("Could not build beginner plan")
        }

        XCTAssertGreaterThanOrEqual(beginnerPlan.weeks.count, beginnerLevel.minWeeks)
        XCTAssertLessThanOrEqual(beginnerPlan.weeks.count, beginnerLevel.maxWeeks)
        XCTAssertEqual(beginnerPlan.lessons.count, Set(beginnerPlan.lessons.map(\.slug)).count)
        XCTAssertEqual(beginnerPlan.lessons.map(\.index), Array(1...beginnerPlan.lessons.count))
        XCTAssertEqual(beginnerPlan.weeks.flatMap(\.lessons).map(\.index), Array(1...beginnerPlan.lessons.count))
        let planLessonIndexes = Dictionary(uniqueKeysWithValues: beginnerPlan.lessons.map { ($0.slug, $0.index) })
        for activity in beginnerPlan.weeks.flatMap(\.activities) {
            if let slug = activity.template.lessonSlug {
                XCTAssertEqual(activity.lesson?.index, planLessonIndexes[slug])
            }
        }
        XCTAssertGreaterThan(beginnerPlan.foundationBridgeLessonCount, 0)
        XCTAssertEqual(
            beginnerPlan.weeks.flatMap(\.activities).filter { $0.template.kind == "section" }.count,
            beginnerPlan.weeks.count
        )
        XCTAssertTrue(beginnerPlan.weeks.allSatisfy { week in
            guard let check = week.activities.first(where: { $0.template.kind == "section" }) else { return false }
            return check.template.lessonSlugs == week.lessons.map(\.slug) && !(check.template.questions ?? []).isEmpty
        })
        XCTAssertTrue(beginnerPlan.weeks.flatMap(\.activities).contains { $0.template.kind == "coding" })
        XCTAssertTrue(beginnerPlan.weeks.allSatisfy { week in
            let limit = beginnerSelection.weeklyHours == 2 ? 240 : beginnerSelection.weeklyHours * 60
            return week.totalMinutes <= limit
        })

        let advancedSelection = LearningPlanSelection(
            trackSlug: researchGoal.trackSlug,
            level: "advanced",
            weeklyHours: 6
        )
        guard let advancedPlan = LearningPlanBuilder.build(
            tracks: service.tracks,
            configuration: configuration,
            selection: advancedSelection
        ), let advancedLevel = configuration.levels.first(where: { $0.value == "advanced" }) else {
            return XCTFail("Could not build advanced plan")
        }

        XCTAssertEqual(advancedPlan.lessons.count, service.tracks.first { $0.slug == researchGoal.trackSlug }?.lessons.count)
        XCTAssertEqual(advancedPlan.foundationBridgeLessonCount, 0)
        XCTAssertGreaterThanOrEqual(advancedPlan.weeks.count, advancedLevel.minWeeks)
        XCTAssertLessThanOrEqual(advancedPlan.weeks.count, advancedLevel.maxWeeks)
        XCTAssertGreaterThanOrEqual(beginnerPlan.weeks.count, advancedPlan.weeks.count)
        XCTAssertEqual(advancedPlan.weeks.flatMap(\.activities).filter { $0.template.kind == "milestone" }.count, 4)
        XCTAssertEqual(advancedPlan.weeks.flatMap(\.activities).filter { $0.template.kind == "exam" }.count, 1)
        XCTAssertTrue(advancedPlan.weeks.allSatisfy { week in
            let limit = advancedSelection.weeklyHours == 2 ? 240 : advancedSelection.weeklyHours * 60
            return week.totalMinutes <= limit
        })
    }

    func testLearningPlanSelectionPersists() {
        let suiteName = "DataServiceTests.learningPlan"
        let defaults = UserDefaults(suiteName: suiteName)!
        defaults.removePersistentDomain(forName: suiteName)
        let selection = LearningPlanSelection(
            trackSlug: "ai-research-scientist",
            level: "working",
            weeklyHours: 4
        )

        let store = ProgressStore(userDefaults: defaults, namespace: "test")
        store.saveLearningPlan(selection)
        let restored = ProgressStore(userDefaults: defaults, namespace: "test")

        XCTAssertEqual(restored.learningPlanSelection, selection)
        XCTAssertTrue(restored.learningPlanNeedsSync)
        restored.markLearningPlanSynced()
        let remoteSelection = LearningPlanSelection(
            trackSlug: "rag-and-search-systems",
            level: "advanced",
            weeklyHours: 6
        )
        XCTAssertEqual(restored.mergeRemoteLearningPlan(remoteSelection), 1)
        XCTAssertEqual(restored.learningPlanSelection, remoteSelection)
        defaults.removePersistentDomain(forName: suiteName)
    }

    func testOAuthCallbackParserReadsAuthorizationCode() throws {
        let callback = URL(string: "com.leetllm.ios://auth/callback?code=auth-code-123")!

        let code = try OAuthCallbackParser.parseAuthorizationCode(callback)

        XCTAssertEqual(code, "auth-code-123")
    }

    func testOAuthCallbackParserRejectsProviderError() {
        let callback = URL(string: "com.leetllm.ios://auth/callback?error_description=Access%20denied")!

        XCTAssertThrowsError(try OAuthCallbackParser.parseAuthorizationCode(callback)) { error in
            XCTAssertEqual(error.localizedDescription, "Access denied")
        }
    }

    func testOAuthCallbackParserRejectsImplicitFragmentSession() {
        let callback = URL(string: "com.leetllm.ios://auth/callback#access_token=access-123")!

        XCTAssertThrowsError(try OAuthCallbackParser.parseAuthorizationCode(callback)) { error in
            XCTAssertEqual(error.localizedDescription, "OAuth callback did not contain an authorization code.")
        }
    }

    func testOAuthCallbackParserRejectsUnexpectedCallbackURL() {
        let callback = URL(string: "com.attacker.app://auth/callback?code=auth-code-123")!

        XCTAssertThrowsError(try OAuthCallbackParser.parseAuthorizationCode(callback)) { error in
            XCTAssertEqual(error.localizedDescription, "OAuth callback URL was invalid.")
        }
    }

    func testOAuthPKCEChallengeMatchesRFC7636Vector() {
        let verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"

        XCTAssertEqual(
            OAuthPKCE.codeChallenge(for: verifier),
            "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"
        )
    }

    func testOAuthPKCEVerifierMeetsRFC7636Format() throws {
        let verifier = try OAuthPKCE.generateCodeVerifier()

        XCTAssertNotNil(verifier.range(of: #"^[A-Za-z0-9_-]{43,128}$"#, options: .regularExpression))
    }

    private func testDataRootURL() -> URL {
        if let path = ProcessInfo.processInfo.environment["LEETLLM_IOS_DATA_ROOT"], !path.isEmpty {
            return URL(fileURLWithPath: path, isDirectory: true)
        }
        if let path = ProcessInfo.processInfo.environment["TEST_RUNNER_LEETLLM_IOS_DATA_ROOT"], !path.isEmpty {
            return URL(fileURLWithPath: path, isDirectory: true)
        }
        let testBundleData = Bundle(for: Self.self).resourceURL?.appendingPathComponent("data", isDirectory: true)
        if let testBundleData, FileManager.default.fileExists(atPath: testBundleData.path) {
            return testBundleData
        }
        if let mainData = Bundle.main.resourceURL?.appendingPathComponent("data", isDirectory: true),
           FileManager.default.fileExists(atPath: mainData.path) {
            return mainData
        }
        let repoData = URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .appendingPathComponent("LeetLLM/Resources/data", isDirectory: true)
        if FileManager.default.fileExists(atPath: repoData.path) {
            return repoData
        }
        return testBundleData ?? URL(fileURLWithPath: "/dev/null")
    }
}

@MainActor
private final class StubLeetyClient: LeetyAnswerProviding {
    let respond: (String, [LeetyChatMessage], UUID) async throws -> LeetyResponse

    init(respond: @escaping (String, [LeetyChatMessage], UUID) async throws -> LeetyResponse) {
        self.respond = respond
    }

    func answer(pathname: String, messages: [LeetyChatMessage], requestID: UUID) async throws -> LeetyResponse {
        try await respond(pathname, messages, requestID)
    }
}
