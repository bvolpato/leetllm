import Combine
import Foundation

struct ContentSearchMatches: Sendable {
    static let empty = ContentSearchMatches(lessonSnippets: [:], blogSnippets: [:])

    let lessonSnippets: [String: String]
    let blogSnippets: [String: String]
}

private struct SearchDocument: Decodable, Sendable {
    let content: String
}

private actor ContentSearchStore {
    private var documentsByPath: [String: String] = [:]

    func matches(
        root: URL,
        lessonSlugs: [String],
        blogSlugs: [String],
        normalizedQuery: String
    ) -> ContentSearchMatches {
        let decoder = JSONDecoder()
        var lessonSnippets: [String: String] = [:]
        var blogSnippets: [String: String] = [:]

        for slug in lessonSlugs {
            guard !Task.isCancelled else { return .empty }
            if let snippet = snippet(
                relativePath: "lessons/\(slug).json",
                root: root,
                query: normalizedQuery,
                decoder: decoder
            ) {
                lessonSnippets[slug] = snippet
            }
        }

        for slug in blogSlugs {
            guard !Task.isCancelled else { return .empty }
            if let snippet = snippet(
                relativePath: "blogs/\(slug).json",
                root: root,
                query: normalizedQuery,
                decoder: decoder
            ) {
                blogSnippets[slug] = snippet
            }
        }

        return ContentSearchMatches(lessonSnippets: lessonSnippets, blogSnippets: blogSnippets)
    }

    private func snippet(
        relativePath: String,
        root: URL,
        query: String,
        decoder: JSONDecoder
    ) -> String? {
        let content: String
        if let cached = documentsByPath[relativePath] {
            content = cached
        } else {
            let url = root.appendingPathComponent(relativePath)
            guard let data = try? Data(contentsOf: url),
                  let document = try? decoder.decode(SearchDocument.self, from: data) else {
                return nil
            }
            content = document.content
            documentsByPath[relativePath] = content
        }

        guard let range = content.range(of: query, options: .caseInsensitive) else { return nil }
        let start = content.index(range.lowerBound, offsetBy: -80, limitedBy: content.startIndex)
            ?? content.startIndex
        let end = content.index(range.upperBound, offsetBy: 80, limitedBy: content.endIndex)
            ?? content.endIndex
        return String(content[start..<end])
    }
}

private struct GlossarySearchMeta: Sendable {
    let lowercasedTitle: String
    let lowercasedAliases: [String]
}

private struct HeavyBundlePayload: Sendable {
    let learningPlan: LearningPlanConfiguration
    let glossary: [GlossaryEntry]
    let glossaryByID: [String: GlossaryEntry]
    let glossarySearchTextByID: [String: String]
    let glossarySearchMetaByID: [String: GlossarySearchMeta]
}

private final class LessonDetailCacheEntry {
    let value: LessonDetail

    init(_ value: LessonDetail) {
        self.value = value
    }
}

private final class BlogDetailCacheEntry {
    let value: BlogDetail

    init(_ value: BlogDetail) {
        self.value = value
    }
}

@MainActor
final class DataService: ObservableObject {
    static let shared = DataService(deferHeavyContent: true)

    @Published private(set) var manifest: ExportManifest?
    @Published private(set) var lessons: [LessonIndexItem] = []
    @Published private(set) var blogs: [BlogIndexItem] = []
    @Published private(set) var tracks: [LearningTrack] = []
    @Published private(set) var learningPlanConfiguration: LearningPlanConfiguration?
    @Published private(set) var theoryQuizzes: [TheoryQuiz] = []
    @Published private(set) var glossary: [GlossaryEntry] = []
    @Published private(set) var practiceMetadata: [PracticeMetadata] = []
    @Published private(set) var isInitialLoadComplete = false
    @Published private(set) var loadError: String?
    @Published private(set) var isLoadingPrivateBlogs = false
    @Published private(set) var privateBlogError: String?
    @Published private(set) var privateContentVersion = 0

    private let bundle: Bundle
    private let explicitDataRootURL: URL?
    private let deferHeavyContent: Bool
    private let contentSearchStore = ContentSearchStore()
    private let lessonCache: NSCache<NSString, LessonDetailCacheEntry> = {
        let cache = NSCache<NSString, LessonDetailCacheEntry>()
        cache.countLimit = 16
        return cache
    }()
    private let blogCache: NSCache<NSString, BlogDetailCacheEntry> = {
        let cache = NSCache<NSString, BlogDetailCacheEntry>()
        cache.countLimit = 16
        return cache
    }()
    private var bundledBlogs: [BlogIndexItem] = []
    private var privateBlogs: [String: BlogDetail] = [:]
    private var privateImages: [String: Data] = [:]
    private var privateRequestID = UUID()
    private var heavyLoadTask: Task<Void, Never>?
    private var loadGeneration = 0
    private var lessonIndexBySlug: [String: LessonIndexItem] = [:]
    private var lessonSearchTextBySlug: [String: String] = [:]
    private var blogIndexBySlug: [String: BlogIndexItem] = [:]
    private var glossaryByID: [String: GlossaryEntry] = [:]
    private var glossarySearchTextByID: [String: String] = [:]
    private var glossarySearchMetaByID: [String: GlossarySearchMeta] = [:]

    init(bundle: Bundle = .main, dataRootURL: URL? = nil, deferHeavyContent: Bool = false) {
        self.bundle = bundle
        self.explicitDataRootURL = dataRootURL
        self.deferHeavyContent = deferHeavyContent && dataRootURL == nil
        load()
    }

    func load() {
        heavyLoadTask?.cancel()
        heavyLoadTask = nil
        loadGeneration &+= 1
        let generation = loadGeneration
        clearPrivateBlogs()
        do {
            guard let root = dataRootURL() else {
                throw DataServiceError.missingDataRoot
            }
            let loadedManifest: ExportManifest = try Self.decodeFile("manifest.json", root: root)
            let loadedLessons: [LessonIndexItem] = try Self.decodeFile("lessons/index.json", root: root)
            let loadedBlogs: [BlogIndexItem] = try Self.decodeFile("blogs/index.json", root: root)
            let loadedTracks: [LearningTrack] = try Self.decodeFile("tracks.json", root: root)
            let loadedTheoryQuizzes: [TheoryQuiz] = try Self.decodeFile("theory-quizzes.json", root: root)
            let loadedPractice: [PracticeMetadata] = try Self.decodeFile("practice/index.json", root: root)

            lessonCache.removeAllObjects()
            blogCache.removeAllObjects()
            lessonIndexBySlug = Dictionary(uniqueKeysWithValues: loadedLessons.map { ($0.slug, $0) })
            lessonSearchTextBySlug = Dictionary(
                uniqueKeysWithValues: loadedLessons.map { lesson in
                    (lesson.slug, Self.lessonMetadataSearchText(for: lesson))
                }
            )
            blogIndexBySlug = Dictionary(uniqueKeysWithValues: loadedBlogs.map { ($0.slug, $0) })

            manifest = loadedManifest
            lessons = loadedLessons
            blogs = loadedBlogs
            bundledBlogs = loadedBlogs
            tracks = loadedTracks
            theoryQuizzes = loadedTheoryQuizzes
            practiceMetadata = loadedPractice
            loadError = nil

            if deferHeavyContent {
                isInitialLoadComplete = true
                heavyLoadTask = Task.detached(priority: .userInitiated) { [weak self] in
                    do {
                        let payload = try Self.loadHeavyPayload(root: root)
                        guard !Task.isCancelled else { return }
                        await MainActor.run {
                            guard let self, !Task.isCancelled, self.loadGeneration == generation else { return }
                            self.applyHeavyPayload(payload)
                        }
                    } catch {
                        guard !Task.isCancelled else { return }
                        await MainActor.run {
                            guard let self, !Task.isCancelled, self.loadGeneration == generation else { return }
                            self.loadError = error.localizedDescription
                        }
                    }
                }
            } else {
                let payload = try Self.loadHeavyPayload(root: root)
                applyHeavyPayload(payload)
                isInitialLoadComplete = true
            }
        } catch {
            loadError = error.localizedDescription
            isInitialLoadComplete = true
        }
    }

    func lesson(slug: String) -> LessonDetail? {
        let key = slug as NSString
        if let cached = lessonCache.object(forKey: key) { return cached.value }
        guard let detail: LessonDetail = try? decode("lessons/\(slug).json") else { return nil }
        lessonCache.setObject(LessonDetailCacheEntry(detail), forKey: key)
        return detail
    }

    func blog(slug: String) -> BlogDetail? {
        if let detail = privateBlogs[slug] { return detail }
        let key = slug as NSString
        if let cached = blogCache.object(forKey: key) { return cached.value }
        guard let detail: BlogDetail = try? decode("blogs/\(slug).json") else { return nil }
        blogCache.setObject(BlogDetailCacheEntry(detail), forKey: key)
        return detail
    }

    func lessonIndex(slug: String) -> LessonIndexItem? {
        lessonIndexBySlug[slug]
    }

    func lessonMatchesMetadata(_ lesson: LessonIndexItem, normalizedQuery: String) -> Bool {
        if let cached = lessonSearchTextBySlug[lesson.slug] {
            return cached.contains(normalizedQuery)
        }
        return Self.lessonMetadataSearchText(for: lesson).contains(normalizedQuery)
    }

    func blogIndex(slug: String) -> BlogIndexItem? {
        blogIndexBySlug[slug]
    }

    func glossaryEntry(id: String) -> GlossaryEntry? {
        glossaryByID[id]
    }

    func glossaryMatches(_ entry: GlossaryEntry, normalizedQuery: String) -> Bool {
        glossarySearchTextByID[entry.id]?.contains(normalizedQuery) == true
    }

    func glossarySearchPriority(_ entry: GlossaryEntry, normalizedQuery: String) -> Int {
        let titleLower: String
        let aliases: [String]
        if let meta = glossarySearchMetaByID[entry.id] {
            titleLower = meta.lowercasedTitle
            aliases = meta.lowercasedAliases
        } else {
            titleLower = entry.title.lowercased()
            aliases = (entry.aliases ?? []).map { $0.lowercased() }
        }
        if titleLower == normalizedQuery || aliases.contains(normalizedQuery) {
            return 1
        } else if titleLower.hasPrefix(normalizedQuery) || aliases.contains(where: { $0.hasPrefix(normalizedQuery) }) {
            return 2
        } else if titleLower.contains(normalizedQuery) {
            return 3
        } else {
            return 4
        }
    }

    func contentSearchMatches(normalizedQuery: String) async -> ContentSearchMatches {
        guard let root = dataRootURL(), normalizedQuery.count >= 2 else { return .empty }
        let matches = await contentSearchStore.matches(
            root: root,
            lessonSlugs: lessons.map(\.slug),
            blogSlugs: bundledBlogs.map(\.slug),
            normalizedQuery: normalizedQuery
        )
        var blogSnippets = matches.blogSnippets
        for blog in privateBlogs.values {
            guard let range = blog.content.range(of: normalizedQuery, options: .caseInsensitive) else { continue }
            let start = blog.content.index(range.lowerBound, offsetBy: -80, limitedBy: blog.content.startIndex) ?? blog.content.startIndex
            let end = blog.content.index(range.upperBound, offsetBy: 80, limitedBy: blog.content.endIndex) ?? blog.content.endIndex
            blogSnippets[blog.slug] = String(blog.content[start..<end])
        }
        return ContentSearchMatches(lessonSnippets: matches.lessonSnippets, blogSnippets: blogSnippets)
    }

    func clearPrivateBlogs() {
        privateRequestID = UUID()
        privateBlogs.removeAll()
        privateImages.removeAll()
        blogs = bundledBlogs
        blogIndexBySlug = Dictionary(uniqueKeysWithValues: bundledBlogs.map { ($0.slug, $0) })
        isLoadingPrivateBlogs = false
        privateBlogError = nil
        privateContentVersion += 1
        MarkdownBlockCache.shared.clear()
    }

    func privateImageData(path: String) -> Data? {
        privateImages[path.components(separatedBy: "?").first ?? path]
    }

    func refreshPrivateBlogs(
        accountID: String?,
        userEmail: String?,
        fetch: () async throws -> PrivateBlogResponse
    ) async {
        clearPrivateBlogs()
        guard accountID != nil, userEmail != nil else { return }
        let requestID = privateRequestID
        isLoadingPrivateBlogs = true
        defer {
            if privateRequestID == requestID { isLoadingPrivateBlogs = false }
        }
        do {
            let response = try await fetch()
            guard !Task.isCancelled, privateRequestID == requestID else { return }
            guard response.blogs.allSatisfy({
                $0.accessEmail != nil && BlogAccess.isAllowed(requiredEmail: $0.accessEmail, userEmail: userEmail, isAuthenticated: true)
                    && blogIndexBySlug[$0.slug] == nil
            }), Set(response.blogs.map(\.slug)).count == response.blogs.count else {
                throw DataServiceError.invalidPrivateContent
            }
            privateBlogs = Dictionary(uniqueKeysWithValues: response.blogs.map { ($0.slug, $0) })
            privateImages = response.images
            blogs = (bundledBlogs + response.blogs.map(\.indexItem)).sorted { $0.publishedAt > $1.publishedAt }
            blogIndexBySlug = Dictionary(uniqueKeysWithValues: blogs.map { ($0.slug, $0) })
            privateContentVersion += 1
        } catch {
            guard !Task.isCancelled, privateRequestID == requestID else { return }
            privateBlogError = "Private articles couldn't be loaded. Check your connection and try again."
        }
    }

    func resourceURL(path: String) -> URL? {
        dataRootURL()?.appendingPathComponent(path)
    }

    private func applyHeavyPayload(_ payload: HeavyBundlePayload) {
        glossaryByID = payload.glossaryByID
        glossarySearchTextByID = payload.glossarySearchTextByID
        glossarySearchMetaByID = payload.glossarySearchMetaByID
        learningPlanConfiguration = payload.learningPlan
        glossary = payload.glossary
    }

    nonisolated private static func loadHeavyPayload(root: URL) throws -> HeavyBundlePayload {
        let loadedLearningPlan: LearningPlanConfiguration = try decodeFile("learning-plan.json", root: root)
        let loadedGlossary: [GlossaryEntry] = try decodeFile("glossary/index.json", root: root)
        var byID: [String: GlossaryEntry] = [:]
        var searchTextByID: [String: String] = [:]
        var searchMetaByID: [String: GlossarySearchMeta] = [:]
        byID.reserveCapacity(loadedGlossary.count)
        searchTextByID.reserveCapacity(loadedGlossary.count)
        searchMetaByID.reserveCapacity(loadedGlossary.count)
        for entry in loadedGlossary {
            byID[entry.id] = entry
            searchTextByID[entry.id] = entry.searchableText
            searchMetaByID[entry.id] = GlossarySearchMeta(
                lowercasedTitle: entry.title.lowercased(),
                lowercasedAliases: (entry.aliases ?? []).map { $0.lowercased() }
            )
        }
        return HeavyBundlePayload(
            learningPlan: loadedLearningPlan,
            glossary: loadedGlossary,
            glossaryByID: byID,
            glossarySearchTextByID: searchTextByID,
            glossarySearchMetaByID: searchMetaByID
        )
    }

    nonisolated private static func lessonMetadataSearchText(for lesson: LessonIndexItem) -> String {
        [
            lesson.title,
            lesson.section,
            lesson.category,
            lesson.difficulty,
            lesson.shortDescription,
            lesson.keyConceptsTested.joined(separator: " "),
        ].joined(separator: " ").lowercased()
    }

    nonisolated private static func decodeFile<T: Decodable>(_ relativePath: String, root: URL) throws -> T {
        let url = root.appendingPathComponent(relativePath)
        let data = try Data(contentsOf: url)
        let decoder = JSONDecoder()
        return try decoder.decode(T.self, from: data)
    }

    private func decode<T: Decodable>(_ relativePath: String) throws -> T {
        guard let root = dataRootURL() else {
            throw DataServiceError.missingDataRoot
        }
        return try Self.decodeFile(relativePath, root: root)
    }

    private func dataRootURL() -> URL? {
        if let explicitDataRootURL {
            return explicitDataRootURL
        }
        return bundle.resourceURL?.appendingPathComponent("data", isDirectory: true)
    }
}

enum DataServiceError: LocalizedError {
    case missingDataRoot
    case invalidPrivateContent

    var errorDescription: String? {
        switch self {
        case .missingDataRoot:
            return "Bundled data folder is missing."
        case .invalidPrivateContent:
            return "Private content does not match this account."
        }
    }
}
