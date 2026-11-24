import Combine
import Foundation

enum QuizResultKind: String, Codable {
    case theory
    case mastery
    case section
}

struct StoredQuizResult: Codable, Hashable {
    let slug: String
    let kind: QuizResultKind
    let correct: Int
    let total: Int
    let score: Int
    let attempts: Int
    let completedAt: Date

    var passed: Bool {
        total > 0 && score >= 75
    }
}

struct StoredQuizDraft: Codable {
    let prompts: [QuizPrompt]
    let selections: [Int: String]
    let checkedSelections: [Int: String]?
    let result: StoredQuizResult?
    let seed: String
    let questionIndex: Int
}

@MainActor
final class ProgressStore: ObservableObject {
    static let shared: ProgressStore = {
        #if DEBUG
        if ProcessInfo.processInfo.arguments.contains("--ui-testing"),
           let defaults = UserDefaults(suiteName: "com.leetllm.ios.ui-tests") {
            if ProcessInfo.processInfo.arguments.contains("--reset-ui-state") {
                defaults.removePersistentDomain(forName: "com.leetllm.ios.ui-tests")
            }
            return ProgressStore(userDefaults: defaults, namespace: "ui-tests")
        }
        #endif
        return ProgressStore()
    }()
    static let preview = ProgressStore(userDefaults: .standard, namespace: "preview")

    @Published private(set) var readLessonSlugs: Set<String> = []
    @Published private(set) var bookmarkedLessonSlugs: Set<String> = []
    @Published private(set) var theoryQuizResults: [String: StoredQuizResult] = [:]
    @Published private(set) var masteryQuizResults: [String: StoredQuizResult] = [:]
    @Published private(set) var sectionQuizResults: [String: StoredQuizResult] = [:]
    @Published private(set) var notes: [String: String] = [:]
    @Published private(set) var lastViewedRoute: LearnRoute? = nil
    private(set) var scrollPositions: [String: String] = [:]
    private var quizDrafts: [String: StoredQuizDraft] = [:]
    @Published private(set) var resetGeneration = UUID()
    @Published private(set) var learningPlanSelection: LearningPlanSelection? = nil
    @Published private(set) var learningPlanNeedsSync = false

    private let userDefaults: UserDefaults
    private let storageKey: String
    private var pendingScrollPersistence: Task<Void, Never>?
    private var pendingNotePersistence: Task<Void, Never>?

    init(userDefaults: UserDefaults = .standard, namespace: String = "production") {
        self.userDefaults = userDefaults
        storageKey = "leetllm_ios_progress_\(namespace)"
        load()
    }

    func isRead(_ slug: String) -> Bool {
        readLessonSlugs.contains(slug)
    }

    func isBookmarked(_ slug: String) -> Bool {
        bookmarkedLessonSlugs.contains(slug)
    }

    func markRead(_ slug: String, read: Bool = true) {
        guard readLessonSlugs.contains(slug) != read else { return }
        if read {
            readLessonSlugs.insert(slug)
        } else {
            readLessonSlugs.remove(slug)
        }
        persist()
    }

    var passedTheoryQuizSlugs: Set<String> {
        Set(theoryQuizResults.values.filter { $0.passed }.map { $0.slug })
    }

    @discardableResult
    func mergeRemoteReadLessons(_ slugs: Set<String>) -> Int {
        let missing = slugs.subtracting(readLessonSlugs)
        guard !missing.isEmpty else { return 0 }
        readLessonSlugs.formUnion(missing)
        persist()
        return missing.count
    }

    @discardableResult
    func mergeRemoteTheoryQuizPasses(_ slugs: Set<String>) -> Int {
        var merged = 0
        for slug in slugs where theoryQuizResults[slug]?.passed != true {
            let existing = theoryQuizResults[slug]
            theoryQuizResults[slug] = StoredQuizResult(
                slug: slug,
                kind: .theory,
                correct: 1,
                total: 1,
                score: 100,
                attempts: max(existing?.attempts ?? 0, 1),
                completedAt: existing?.completedAt ?? Date()
            )
            merged += 1
        }
        if merged > 0 {
            persist()
        }
        return merged
    }

    func toggleBookmark(_ slug: String) {
        if bookmarkedLessonSlugs.contains(slug) {
            bookmarkedLessonSlugs.remove(slug)
        } else {
            bookmarkedLessonSlugs.insert(slug)
        }
        persist()
    }

    func note(for slug: String) -> String {
        notes[slug] ?? ""
    }

    func saveNote(_ note: String, for slug: String, debounced: Bool = false) {
        let trimmed = note.trimmingCharacters(in: .whitespacesAndNewlines)
        guard (notes[slug] ?? "") != trimmed else { return }
        if trimmed.isEmpty {
            notes.removeValue(forKey: slug)
        } else {
            notes[slug] = trimmed
        }
        if debounced {
            pendingNotePersistence?.cancel()
            pendingNotePersistence = Task { [weak self] in
                try? await Task.sleep(for: .milliseconds(450))
                guard !Task.isCancelled, let self else { return }
                self.pendingNotePersistence = nil
                self.persist()
            }
        } else {
            persist()
        }
    }

    func flushPendingNote() {
        guard let pendingNotePersistence else { return }
        pendingNotePersistence.cancel()
        self.pendingNotePersistence = nil
        persist()
    }

    func quizDraft(kind: QuizResultKind, slug: String, prompts: [QuizPrompt]) -> StoredQuizDraft? {
        guard let draft = quizDrafts["\(kind.rawValue):\(slug)"], draft.prompts == prompts else { return nil }
        return draft
    }

    func saveQuizDraft(_ draft: StoredQuizDraft, kind: QuizResultKind, slug: String) {
        quizDrafts["\(kind.rawValue):\(slug)"] = draft
        persist()
    }

    func removeQuizDraft(kind: QuizResultKind, slug: String) {
        quizDrafts.removeValue(forKey: "\(kind.rawValue):\(slug)")
        persist()
    }

    func quizResult(kind: QuizResultKind, slug: String) -> StoredQuizResult? {
        switch kind {
        case .theory:
            return theoryQuizResults[slug]
        case .mastery:
            return masteryQuizResults[slug]
        case .section:
            return sectionQuizResults[slug]
        }
    }

    func recordQuizResult(kind: QuizResultKind, slug: String, correct: Int, total: Int) -> StoredQuizResult {
        let score = total > 0 ? Int((Double(correct) / Double(total) * 100).rounded()) : 0
        let existing = quizResult(kind: kind, slug: slug)
        let attempts = (existing?.attempts ?? 0) + 1
        let candidate = StoredQuizResult(
            slug: slug,
            kind: kind,
            correct: correct,
            total: total,
            score: score,
            attempts: attempts,
            completedAt: Date()
        )

        let stored: StoredQuizResult
        if let existing, existing.score > candidate.score {
            stored = StoredQuizResult(
                slug: slug,
                kind: kind,
                correct: existing.correct,
                total: existing.total,
                score: existing.score,
                attempts: attempts,
                completedAt: existing.completedAt
            )
        } else {
            stored = candidate
        }

        switch kind {
        case .theory:
            theoryQuizResults[slug] = stored
        case .mastery:
            masteryQuizResults[slug] = stored
        case .section:
            sectionQuizResults[slug] = stored
        }

        persist()
        return candidate
    }

    func trackViewedRoute(_ route: LearnRoute?) {
        guard lastViewedRoute != route else { return }
        lastViewedRoute = route
        persist()
    }

    func scrollPosition(for slug: String) -> String? {
        scrollPositions[slug]
    }

    func saveScrollPosition(_ positionId: String, for slug: String) {
        guard scrollPositions[slug] != positionId else { return }
        scrollPositions[slug] = positionId
        pendingScrollPersistence?.cancel()
        pendingScrollPersistence = Task { [weak self] in
            try? await Task.sleep(for: .milliseconds(450))
            guard !Task.isCancelled, let self else { return }
            self.pendingScrollPersistence = nil
            self.persist()
        }
    }

    func flushPendingScrollPosition() {
        guard let pendingScrollPersistence else { return }
        pendingScrollPersistence.cancel()
        self.pendingScrollPersistence = nil
        persist()
    }

    func flushPendingPersistence() {
        guard pendingScrollPersistence != nil || pendingNotePersistence != nil else { return }
        pendingScrollPersistence?.cancel()
        pendingScrollPersistence = nil
        pendingNotePersistence?.cancel()
        pendingNotePersistence = nil
        persist()
    }

    func saveLearningPlan(_ selection: LearningPlanSelection) {
        learningPlanSelection = selection
        learningPlanNeedsSync = true
        persist()
    }

    @discardableResult
    func mergeRemoteLearningPlan(_ selection: LearningPlanSelection) -> Int {
        guard !learningPlanNeedsSync, learningPlanSelection != selection else { return 0 }
        learningPlanSelection = selection
        persist()
        return 1
    }

    func markLearningPlanSynced() {
        guard learningPlanNeedsSync else { return }
        learningPlanNeedsSync = false
        persist()
    }

    func resetAll() {
        readLessonSlugs = []
        bookmarkedLessonSlugs = []
        theoryQuizResults = [:]
        masteryQuizResults = [:]
        sectionQuizResults = [:]
        notes = [:]
        lastViewedRoute = nil
        scrollPositions = [:]
        quizDrafts = [:]
        learningPlanSelection = nil
        learningPlanNeedsSync = false
        persist()
        resetGeneration = UUID()
    }

    private func load() {
        guard let data = userDefaults.data(forKey: storageKey),
              let state = try? JSONDecoder().decode(StoredProgressState.self, from: data) else {
            return
        }

        readLessonSlugs = state.readLessonSlugs
        bookmarkedLessonSlugs = state.bookmarkedLessonSlugs
        theoryQuizResults = state.theoryQuizResults
        masteryQuizResults = state.masteryQuizResults
        sectionQuizResults = state.sectionQuizResults ?? [:]
        notes = state.notes
        lastViewedRoute = state.lastViewedRoute
        scrollPositions = state.scrollPositions ?? [:]
        quizDrafts = state.quizDrafts ?? [:]
        learningPlanSelection = state.learningPlanSelection
        learningPlanNeedsSync = state.learningPlanNeedsSync ?? false
    }

    private func persist() {
        pendingScrollPersistence?.cancel()
        pendingScrollPersistence = nil
        pendingNotePersistence?.cancel()
        pendingNotePersistence = nil
        let state = StoredProgressState(
            readLessonSlugs: readLessonSlugs,
            bookmarkedLessonSlugs: bookmarkedLessonSlugs,
            theoryQuizResults: theoryQuizResults,
            masteryQuizResults: masteryQuizResults,
            sectionQuizResults: sectionQuizResults,
            notes: notes,
            lastViewedRoute: lastViewedRoute,
            scrollPositions: scrollPositions,
            quizDrafts: quizDrafts,
            learningPlanSelection: learningPlanSelection,
            learningPlanNeedsSync: learningPlanNeedsSync
        )
        if let data = try? JSONEncoder().encode(state) {
            userDefaults.set(data, forKey: storageKey)
        }
    }
}

private struct StoredProgressState: Codable {
    let readLessonSlugs: Set<String>
    let bookmarkedLessonSlugs: Set<String>
    let theoryQuizResults: [String: StoredQuizResult]
    let masteryQuizResults: [String: StoredQuizResult]
    let sectionQuizResults: [String: StoredQuizResult]?
    let notes: [String: String]
    let lastViewedRoute: LearnRoute?
    let scrollPositions: [String: String]?
    let quizDrafts: [String: StoredQuizDraft]?
    let learningPlanSelection: LearningPlanSelection?
    let learningPlanNeedsSync: Bool?
}
