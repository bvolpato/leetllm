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

@MainActor
final class DataService: ObservableObject {
    static let shared = DataService()

    @Published private(set) var manifest: ExportManifest?
    @Published private(set) var lessons: [LessonIndexItem] = []
    @Published private(set) var blogs: [BlogIndexItem] = []
    @Published private(set) var tracks: [LearningTrack] = []
    @Published private(set) var learningPlanConfiguration: LearningPlanConfiguration?
    @Published private(set) var theoryQuizzes: [TheoryQuiz] = []
    @Published private(set) var glossary: [GlossaryEntry] = []
    @Published private(set) var practiceMetadata: [PracticeMetadata] = []
    @Published private(set) var loadError: String?
    @Published private(set) var isLoadingPrivateBlogs = false
    @Published private(set) var privateBlogError: String?
    @Published private(set) var privateContentVersion = 0

    private let bundle: Bundle
    private let explicitDataRootURL: URL?
    private let contentSearchStore = ContentSearchStore()
    private var lessonCache: [String: LessonDetail] = [:]
    private var blogCache: [String: BlogDetail] = [:]
    private var bundledBlogs: [BlogIndexItem] = []
    private var privateBlogs: [String: BlogDetail] = [:]
    private var privateImages: [String: Data] = [:]
    private var privateRequestID = UUID()
    private var lessonIndexBySlug: [String: LessonIndexItem] = [:]
    private var blogIndexBySlug: [String: BlogIndexItem] = [:]
    private var glossaryByID: [String: GlossaryEntry] = [:]
    private var glossarySearchTextByID: [String: String] = [:]

    init(bundle: Bundle = .main, dataRootURL: URL? = nil) {
        self.bundle = bundle
        self.explicitDataRootURL = dataRootURL
        load()
    }

    func load() {
        clearPrivateBlogs()
        do {
            let loadedManifest: ExportManifest = try decode("manifest.json")
            let loadedLessons: [LessonIndexItem] = try decode("lessons/index.json")
            let loadedBlogs: [BlogIndexItem] = try decode("blogs/index.json")
            let loadedTracks: [LearningTrack] = try decode("tracks.json")
            let loadedLearningPlan: LearningPlanConfiguration = try decode("learning-plan.json")
            let loadedTheoryQuizzes: [TheoryQuiz] = try decode("theory-quizzes.json")
            let loadedGlossary: [GlossaryEntry] = try decode("glossary/index.json")
            let loadedPractice: [PracticeMetadata] = try decode("practice/index.json")

            lessonCache.removeAll(keepingCapacity: true)
            blogCache.removeAll(keepingCapacity: true)
            lessonIndexBySlug = Dictionary(uniqueKeysWithValues: loadedLessons.map { ($0.slug, $0) })
            blogIndexBySlug = Dictionary(uniqueKeysWithValues: loadedBlogs.map { ($0.slug, $0) })
            glossaryByID = Dictionary(uniqueKeysWithValues: loadedGlossary.map { ($0.id, $0) })
            glossarySearchTextByID = Dictionary(
                uniqueKeysWithValues: loadedGlossary.map { ($0.id, $0.searchableText) }
            )

            manifest = loadedManifest
            lessons = loadedLessons
            blogs = loadedBlogs
            bundledBlogs = loadedBlogs
            tracks = loadedTracks
            learningPlanConfiguration = loadedLearningPlan
            theoryQuizzes = loadedTheoryQuizzes
            glossary = loadedGlossary
            practiceMetadata = loadedPractice
            loadError = nil
        } catch {
            loadError = error.localizedDescription
        }
    }

    func lesson(slug: String) -> LessonDetail? {
        if let cached = lessonCache[slug] { return cached }
        guard let detail: LessonDetail = try? decode("lessons/\(slug).json") else { return nil }
        lessonCache[slug] = detail
        return detail
    }

    func blog(slug: String) -> BlogDetail? {
        if let detail = privateBlogs[slug] { return detail }
        if let cached = blogCache[slug] { return cached }
        guard let detail: BlogDetail = try? decode("blogs/\(slug).json") else { return nil }
        blogCache[slug] = detail
        return detail
    }

    func lessonIndex(slug: String) -> LessonIndexItem? {
        lessonIndexBySlug[slug]
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

    private func decode<T: Decodable>(_ relativePath: String) throws -> T {
        guard let url = dataRootURL()?.appendingPathComponent(relativePath) else {
            throw DataServiceError.missingDataRoot
        }
        let data = try Data(contentsOf: url)
        let decoder = JSONDecoder()
        return try decoder.decode(T.self, from: data)
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
