import Foundation

struct ExportManifest: Codable {
    let generatedAt: String
    let sourceModifiedAt: String?
    let lessonCount: Int
    let blogCount: Int
    let trackCount: Int
    let glossaryCount: Int
    let theoryQuizCount: Int
    let practiceCount: Int
    let copiedImageCount: Int
    let copiedAssetCount: Int
    let darkImages: Int
    let lightImages: Int
    let imageBytes: Int
}

struct ReferenceRecord: Codable, Identifiable, Hashable {
    var id: String { key }
    let key: String
    let title: String
    let authors: String
    let year: Int
    let url: String
    let type: String
    let venue: String?
    let note: String?
}

struct ContentImageRef: Codable, Hashable {
    let path: String
    let theme: String?
    let alt: String?
}

protocol CoverImageProviding {
    var coverImage: String? { get }
    var coverImageDark: String? { get }
    var coverImageLight: String? { get }
}

struct LessonIndexItem: Codable, Identifiable, Hashable, CoverImageProviding {
    let id: String
    let slug: String
    let title: String
    let section: String
    let category: String
    let difficulty: String
    let timeEstimate: Int
    let order: Int
    let shortDescription: String
    let keyConceptsTested: [String]
    let prerequisites: [String]
    let relatedQuestions: [String]
    let previousSlug: String?
    let nextSlug: String?
    let lastModified: String?
    let coverImage: String?
    let coverImageDark: String?
    let coverImageLight: String?
}

struct LessonDetail: Codable, Identifiable, Hashable, CoverImageProviding {
    let id: String
    let slug: String
    let title: String
    let section: String
    let category: String
    let difficulty: String
    let timeEstimate: Int
    let order: Int
    let shortDescription: String
    let keyConceptsTested: [String]
    let prerequisites: [String]
    let relatedQuestions: [String]
    let previousSlug: String?
    let nextSlug: String?
    let lastModified: String?
    let coverImage: String?
    let coverImageDark: String?
    let coverImageLight: String?
    let content: String
    let rubricPoints: [String]
    let followUpQuestions: [LessonFollowUp]
    let commonPitfalls: [String]
    let references: [ReferenceRecord]
    let masteryQuiz: [MasteryQuizQuestion]?
    let images: [ContentImageRef]
}

struct LessonFollowUp: Codable, Hashable {
    let question: String
    let answer: String?
}

struct BlogAuthor: Codable, Hashable {
    let name: String
    let avatar: String?
    let url: String?
}

struct BlogIndexItem: Codable, Identifiable, Hashable, CoverImageProviding {
    let id: String
    let slug: String
    let title: String
    let excerpt: String
    let author: BlogAuthor
    let publishedAt: String
    let updatedAt: String?
    let tags: [String]
    let timeEstimate: Int
    let featured: Bool
    let accessEmail: String?
    let coverImage: String?
    let coverImageDark: String?
    let coverImageLight: String?
    let socialImage: String?
}

struct BlogDetail: Codable, Identifiable, Hashable, CoverImageProviding {
    let id: String
    let slug: String
    let title: String
    let excerpt: String
    let author: BlogAuthor
    let publishedAt: String
    let updatedAt: String?
    let tags: [String]
    let timeEstimate: Int
    let featured: Bool
    let accessEmail: String?
    let coverImage: String?
    let coverImageDark: String?
    let coverImageLight: String?
    let socialImage: String?
    let content: String
    let references: [ReferenceRecord]
    let images: [ContentImageRef]

    var indexItem: BlogIndexItem {
        BlogIndexItem(
            id: id, slug: slug, title: title, excerpt: excerpt, author: author,
            publishedAt: publishedAt, updatedAt: updatedAt, tags: tags,
            timeEstimate: timeEstimate, featured: featured, accessEmail: accessEmail,
            coverImage: coverImage, coverImageDark: coverImageDark,
            coverImageLight: coverImageLight, socialImage: socialImage
        )
    }
}

struct PrivateBlogResponse: Decodable {
    let blogs: [BlogDetail]
    let images: [String: Data]
}

enum BlogAccess {
    static func isAllowed(requiredEmail: String?, userEmail: String?, isAuthenticated: Bool) -> Bool {
        guard let requiredEmail else { return true }
        guard isAuthenticated, let userEmail else { return false }
        return requiredEmail.lowercased() == userEmail.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
    }
}

struct LearningTrack: Codable, Identifiable, Hashable {
    let slug: String
    var id: String { slug }
    let title: String
    let description: String
    let audience: String
    let outcome: String
    let level: String
    let timeEstimate: String
    let lessonSlugs: [String]
    let lessons: [TrackLesson]
}

struct TrackLesson: Codable, Identifiable, Hashable {
    let index: Int
    let title: String
    let slug: String
    var id: String { slug }
    let section: String
    let category: String
    let difficulty: String
    let timeEstimate: Int
    let shortDescription: String
}

struct LearningPlanConfiguration: Codable, Equatable {
    let schemaVersion: Int
    let foundationTrackSlug: String
    let goals: [LearningPlanGoal]
    let levels: [LearningPlanLevel]
    let weeklyHours: [LearningPlanWeeklyHours]
    let plans: [LearningPlanTemplate]
}

struct LearningPlanGoal: Codable, Identifiable, Equatable {
    let value: String
    let title: String
    let description: String
    let trackSlug: String
    var id: String { value }
}

struct LearningPlanLevel: Codable, Identifiable, Equatable {
    let value: String
    let title: String
    let description: String
    let timeMultiplier: Double
    let minWeeks: Int
    let maxWeeks: Int
    var id: String { value }
}

struct LearningPlanWeeklyHours: Codable, Identifiable, Equatable {
    let value: Int
    let title: String
    let description: String
    var id: Int { value }
}

struct LearningPlanTemplate: Codable, Equatable {
    let trackSlug: String
    let level: String
    let weeklyHours: Int
    let lessonSlugs: [String]
    let weeks: [LearningPlanWeekTemplate]
    let totalLessonMinutes: Int
    let totalActivityMinutes: Int
    let practiceMinutesPerWeek: Int
    let foundationBridgeLessonCount: Int
}

struct LearningPlanWeekTemplate: Codable, Equatable {
    let number: Int
    let title: String
    let focus: String
    let lessonSlugs: [String]
    let lessonMinutes: Int
    let activityMinutes: Int
    let totalMinutes: Int
    let activities: [LearningPlanActivityTemplate]
}

struct LearningPlanActivityTemplate: Codable, Identifiable, Equatable {
    let id: String
    let kind: String
    let title: String
    let description: String
    let minutes: Int
    let href: String?
    let lessonSlug: String?
    let lessonSlugs: [String]?
    let practiceSlug: String?
    let quizSlug: String?
    let questions: [TheoryQuizQuestion]?
    let required: Bool
}

struct LearningPlanSelection: Codable, Equatable {
    let trackSlug: String
    let level: String
    let weeklyHours: Int
}

struct LearningPlanWeek: Identifiable, Equatable {
    let number: Int
    let title: String
    let focus: String
    let lessons: [TrackLesson]
    let activities: [LearningPlanActivity]
    let lessonMinutes: Int
    let activityMinutes: Int
    let totalMinutes: Int
    var id: Int { number }
}

struct LearningPlanActivity: Identifiable, Equatable {
    let template: LearningPlanActivityTemplate
    let lesson: TrackLesson?
    var id: String { template.id }
}

struct GeneratedLearningPlan: Equatable {
    let selection: LearningPlanSelection
    let track: LearningTrack
    let lessons: [TrackLesson]
    let weeks: [LearningPlanWeek]
    let totalLessonMinutes: Int
    let totalActivityMinutes: Int
    let practiceMinutesPerWeek: Int
    let foundationBridgeLessonCount: Int
}

enum LearningPlanBuilder {
    static func build(
        tracks: [LearningTrack],
        configuration: LearningPlanConfiguration,
        selection: LearningPlanSelection
    ) -> GeneratedLearningPlan? {
        guard let track = tracks.first(where: { $0.slug == selection.trackSlug }),
              let template = configuration.plans.first(where: {
                  $0.trackSlug == selection.trackSlug &&
                      $0.level == selection.level &&
                      $0.weeklyHours == selection.weeklyHours
              }) else { return nil }

        var lessonsBySlug: [String: TrackLesson] = [:]
        for lesson in tracks.flatMap(\.lessons) {
            lessonsBySlug[lesson.slug] = lesson
        }
        let lessons = template.lessonSlugs.enumerated().compactMap { position, slug -> TrackLesson? in
            guard let lesson = lessonsBySlug[slug] else { return nil }
            return TrackLesson(
                index: position + 1,
                title: lesson.title,
                slug: lesson.slug,
                section: lesson.section,
                category: lesson.category,
                difficulty: lesson.difficulty,
                timeEstimate: lesson.timeEstimate,
                shortDescription: lesson.shortDescription
            )
        }
        guard lessons.count == template.lessonSlugs.count else { return nil }
        let planLessonsBySlug = Dictionary(uniqueKeysWithValues: lessons.map { ($0.slug, $0) })
        let weeks = template.weeks.compactMap { week -> LearningPlanWeek? in
            let weekLessons = week.lessonSlugs.compactMap { planLessonsBySlug[$0] }
            guard weekLessons.count == week.lessonSlugs.count else { return nil }
            let activities = week.activities.map { activity in
                LearningPlanActivity(
                    template: activity,
                    lesson: activity.lessonSlug.flatMap { planLessonsBySlug[$0] }
                )
            }
            guard activities.allSatisfy({ $0.template.kind != "lesson" || $0.lesson != nil }) else { return nil }
            return LearningPlanWeek(
                number: week.number,
                title: week.title,
                focus: week.focus,
                lessons: weekLessons,
                activities: activities,
                lessonMinutes: week.lessonMinutes,
                activityMinutes: week.activityMinutes,
                totalMinutes: week.totalMinutes
            )
        }
        guard weeks.count == template.weeks.count else { return nil }

        return GeneratedLearningPlan(
            selection: selection,
            track: track,
            lessons: lessons,
            weeks: weeks,
            totalLessonMinutes: template.totalLessonMinutes,
            totalActivityMinutes: template.totalActivityMinutes,
            practiceMinutesPerWeek: template.practiceMinutesPerWeek,
            foundationBridgeLessonCount: template.foundationBridgeLessonCount
        )
    }
}

struct TheoryQuiz: Codable, Identifiable, Hashable {
    let slug: String
    var id: String { slug }
    let title: String
    let level: String
    let description: String
    let estimatedMinutes: Int
    let sections: [String]
    let questions: [TheoryQuizQuestion]
}

struct TheoryQuizQuestion: Codable, Hashable {
    let section: String
    let question: String
    let options: [String]
    let answer: String
    let explanation: String
}

struct MasteryQuizQuestion: Codable, Hashable {
    let question: String
    let options: [String]
    let answer: String
    let explanation: String
}

struct GlossaryImageRef: Codable, Hashable {
    let path: String
    let theme: String?
    let alt: String?
}

struct GlossaryEntry: Codable, Identifiable, Hashable {
    let id: String
    let title: String
    let aliases: [String]?
    let kind: String?
    let importance: Int
    let summary: String
    let definition: String
    let example: String
    let relevance: String
    let intuition: String?
    let formula: String?
    let decisionRule: String?
    let pitfall: String?
    let seeAlso: String?
    let details: [GlossaryDetailSection]?
    let usage: [GlossaryUsage]?
    let related: [GlossaryRelatedTerm]?
    let code: GlossaryCodeExample?
    /// Offline image refs (diagrams / illustrations) rewritten to `images/...` bundle paths.
    let images: [GlossaryImageRef]?

    var searchableText: String {
        var parts = [title, summary, definition, example, relevance]
        parts.append(contentsOf: aliases ?? [])
        parts.append(contentsOf: [intuition, formula, decisionRule, pitfall, seeAlso].compactMap { $0 })
        parts.append(contentsOf: details?.flatMap { [$0.title, $0.content] } ?? [])
        parts.append(contentsOf: related?.map(\.title) ?? [])
        parts.append(contentsOf: usage?.flatMap { [$0.title, $0.excerpt] } ?? [])
        if let code {
            parts.append(contentsOf: [code.title, code.language, code.source])
        }
        return parts.joined(separator: " ").lowercased()
    }

    var shouldDisplayStandaloneCode: Bool {
        guard code != nil else { return false }
        let sections = [definition, example, formula, intuition, decisionRule, pitfall, relevance]
            .compactMap { $0 } + (details?.map(\.content) ?? [])
        return !sections.contains { $0.contains("```") }
    }
}

struct GlossaryRelatedTerm: Codable, Identifiable, Hashable {
    let id: String
    let title: String
}

struct GlossaryDetailSection: Codable, Hashable {
    let title: String
    let content: String
}

struct GlossaryUsage: Codable, Identifiable, Hashable {
    let title: String
    let url: String
    let excerpt: String

    var id: String { "\(url)\u{1F}\(excerpt)" }
}

struct GlossaryCodeExample: Codable, Hashable {
    let language: String
    let title: String
    let source: String
}

struct PracticeMetadata: Codable, Identifiable, Hashable {
    let slug: String
    var id: String { slug }
    let title: String
    let difficulty: String
    let category: String
    let language: String
    let languages: [String]
    let timeEstimateMinutes: Int
    let tags: [String]
    let source: String
    let summary: String
    let sampleTestCount: Int
    let hiddenTestCount: Int
    let codingAvailableOnIOS: Bool
}

struct QuizPrompt: Codable, Identifiable, Hashable {
    let id: Int
    let section: String?
    let question: String
    let options: [String]
    let answer: String
    let explanation: String

    init(id: Int, question: TheoryQuizQuestion) {
        self.id = id
        section = question.section
        self.question = question.question
        options = question.options
        answer = question.answer
        explanation = question.explanation
    }

    init(id: Int, question: MasteryQuizQuestion) {
        self.id = id
        section = nil
        self.question = question.question
        options = question.options
        answer = question.answer
        explanation = question.explanation
    }
}

enum QuizOptionOrder {
    static func permuted(options: [String], seed: String) -> [String] {
        guard options.count > 1 else { return options }

        var shuffled = options
        var generator = SeededGenerator(state: hash(seed))
        for index in stride(from: shuffled.count - 1, through: 1, by: -1) {
            let swapIndex = Int(generator.next() % UInt64(index + 1))
            if swapIndex != index {
                shuffled.swapAt(index, swapIndex)
            }
        }
        return shuffled
    }

    private struct SeededGenerator: RandomNumberGenerator {
        var state: UInt64

        mutating func next() -> UInt64 {
            state &+= 0x9E37_79B9_7F4A_7C15
            var value = state
            value = (value ^ (value >> 30)) &* 0xBF58_476D_1CE4_E5B9
            value = (value ^ (value >> 27)) &* 0x94D0_49BB_1331_11EB
            return value ^ (value >> 31)
        }
    }

    private static func hash(_ value: String) -> UInt64 {
        var hash: UInt64 = 14_695_981_039_346_656_037
        for byte in value.utf8 {
            hash ^= UInt64(byte)
            hash = hash &* 1_099_511_628_211
        }
        return hash
    }
}

import SwiftUI

final class ReaderSettings: ObservableObject {
    static let shared: ReaderSettings = {
        #if DEBUG
        if ProcessInfo.processInfo.arguments.contains("--ui-testing"),
           let defaults = UserDefaults(suiteName: "com.leetllm.ios.ui-tests") {
            return ReaderSettings(userDefaults: defaults)
        }
        #endif
        return ReaderSettings()
    }()

    @Published var fontSize: Double {
        didSet { userDefaults.set(fontSize, forKey: "reader_font_size") }
    }
    @Published var fontTheme: String {
        didSet { userDefaults.set(fontTheme, forKey: "reader_font_theme") }
    }
    @Published var readerColorScheme: String {
        didSet { userDefaults.set(readerColorScheme, forKey: "reader_color_scheme") }
    }

    private let userDefaults: UserDefaults

    init(userDefaults: UserDefaults = .standard) {
        self.userDefaults = userDefaults
        let savedSize = userDefaults.object(forKey: "reader_font_size") as? Double ?? 18.0
        fontSize = savedSize.isFinite ? min(max(savedSize, 14), 30) : 18
        let savedFont = userDefaults.string(forKey: "reader_font_theme") ?? "serif"
        fontTheme = ["serif", "sans"].contains(savedFont) ? savedFont : "serif"
        let savedScheme = userDefaults.string(forKey: "reader_color_scheme") ?? "system"
        readerColorScheme = ["system", "light", "dark"].contains(savedScheme) ? savedScheme : "system"
    }

    var currentColorScheme: ColorScheme? {
        switch readerColorScheme {
        case "light": return .light
        case "dark": return .dark
        default: return nil
        }
    }
}
