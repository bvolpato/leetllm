import Combine
import XCTest
@testable import LeetLLM

@MainActor
final class QuizScoringTests: XCTestCase {
    func testQuizDraftSurvivesRestartAndIsScopedToQuizKind() {
        let suite = "leetllm-ios-tests-draft"
        let defaults = UserDefaults(suiteName: suite)!
        defaults.removePersistentDomain(forName: suite)
        defer { defaults.removePersistentDomain(forName: suite) }
        let prompts = [QuizPrompt(id: 0, question: MasteryQuizQuestion(question: "Choose a shape", options: ["Matrix", "Scalar"], answer: "Matrix", explanation: "A matrix has two axes."))]
        let store = ProgressStore(userDefaults: defaults, namespace: "draft")
        let result = store.recordQuizResult(kind: .mastery, slug: "shapes", correct: 0, total: 1)
        let draft = StoredQuizDraft(prompts: prompts, selections: [0: "Matrix"], checkedSelections: [0: "Scalar"], result: result, seed: "saved-order", questionIndex: 0)
        store.saveQuizDraft(draft, kind: .mastery, slug: "shapes")

        let restored = ProgressStore(userDefaults: defaults, namespace: "draft")
        let saved = restored.quizDraft(kind: .mastery, slug: "shapes", prompts: prompts)
        XCTAssertEqual(saved?.selections, [0: "Matrix"])
        XCTAssertEqual(saved?.checkedSelections, [0: "Scalar"])
        XCTAssertEqual(saved?.seed, "saved-order")
        XCTAssertEqual(saved?.result?.score, 0)
        XCTAssertNil(restored.quizDraft(kind: .theory, slug: "shapes", prompts: prompts))
        XCTAssertNil(restored.quizDraft(kind: .mastery, slug: "other", prompts: prompts))

        restored.removeQuizDraft(kind: .mastery, slug: "shapes")
        XCTAssertNil(restored.quizDraft(kind: .mastery, slug: "shapes", prompts: prompts))
        XCTAssertNotNil(restored.quizResult(kind: .mastery, slug: "shapes"))
    }

    func testContentChangeInvalidatesQuizDraftAndResetClearsIt() {
        let suite = "leetllm-ios-tests-draft-reset"
        let defaults = UserDefaults(suiteName: suite)!
        defaults.removePersistentDomain(forName: suite)
        defer { defaults.removePersistentDomain(forName: suite) }
        let prompts = [QuizPrompt(id: 0, question: MasteryQuizQuestion(question: "Old question", options: ["A", "B"], answer: "A", explanation: "A"))]
        let updated = [QuizPrompt(id: 0, question: MasteryQuizQuestion(question: "New question", options: ["A", "B"], answer: "B", explanation: "B"))]
        let store = ProgressStore(userDefaults: defaults, namespace: "draft-reset")
        store.saveQuizDraft(StoredQuizDraft(prompts: prompts, selections: [0: "A"], checkedSelections: nil, result: nil, seed: "seed", questionIndex: 0), kind: .theory, slug: "quiz")
        XCTAssertNil(store.quizDraft(kind: .theory, slug: "quiz", prompts: updated))
        store.resetAll()
        let restored = ProgressStore(userDefaults: defaults, namespace: "draft-reset")
        XCTAssertNil(restored.quizDraft(kind: .theory, slug: "quiz", prompts: prompts))
    }

    func testNoteSavingAvoidsUnnecessaryPublishedChanges() {
        let suite = "leetllm-ios-tests-note"
        let defaults = UserDefaults(suiteName: suite)!
        defaults.removePersistentDomain(forName: suite)
        defer { defaults.removePersistentDomain(forName: suite) }
        let store = ProgressStore(userDefaults: defaults, namespace: "notes")
        store.saveNote("A useful note", for: "lesson")
        var changes = 0
        let observation = store.objectWillChange.sink { changes += 1 }
        store.saveNote("  A useful note\n", for: "lesson")
        XCTAssertEqual(changes, 0)
        let restored = ProgressStore(userDefaults: defaults, namespace: "notes")
        XCTAssertEqual(restored.note(for: "lesson"), "A useful note")
        withExtendedLifetime(observation) {}
    }

    func testQuizOptionOrderIsDeterministicAndRetainsOptions() {
        let options = ["Correct", "Distractor A", "Distractor B", "Distractor C"]

        let first = QuizOptionOrder.permuted(options: options, seed: "lesson:attempt:0")
        let second = QuizOptionOrder.permuted(options: options, seed: "lesson:attempt:0")

        XCTAssertEqual(first, second)
        XCTAssertNotEqual(first, options)
        XCTAssertEqual(Set(first), Set(options))
        XCTAssertEqual(first.count, options.count)
        XCTAssertTrue(first.contains("Correct"))
    }

    func testQuizOptionOrderChangesForAnotherAttemptSeed() {
        let options = ["Correct", "Distractor A", "Distractor B", "Distractor C"]

        let first = QuizOptionOrder.permuted(options: options, seed: "lesson:attempt:0")
        let second = QuizOptionOrder.permuted(options: options, seed: "lesson:attempt:1")

        XCTAssertNotEqual(first, second)
    }

    func testCorrectOptionReachesEveryPositionAcrossAttemptSeeds() {
        let options = ["Correct", "Distractor A", "Distractor B", "Distractor C"]
        let positions = Set((0..<128).compactMap { attempt in
            QuizOptionOrder.permuted(
                options: options,
                seed: "lesson:attempt:\(attempt)"
            ).firstIndex(of: "Correct")
        })

        XCTAssertEqual(positions, Set(options.indices))
    }

    func testShuffledCorrectAnswerStillScoresByText() {
        let question = MasteryQuizQuestion(
            question: "Which option is correct?",
            options: ["Correct", "Distractor A", "Distractor B"],
            answer: "Correct",
            explanation: "The first option is correct."
        )
        let prompt = QuizPrompt(id: 0, question: question)
        let displayed = QuizOptionOrder.permuted(
            options: prompt.options,
            seed: "lesson:attempt:0:\(prompt.question)"
        )
        guard let selectedOption = displayed.first(where: { $0 == prompt.answer }) else {
            return XCTFail("Shuffled options dropped the correct answer")
        }
        let selections = [prompt.id: selectedOption]

        XCTAssertEqual(selectedOption, prompt.answer)
        XCTAssertEqual(
            [prompt].filter { selections[$0.id] == $0.answer }.count,
            1
        )
    }

    func testQuizResultKeepsBestScoreAndCountsAttempts() {
        let defaults = UserDefaults(suiteName: "leetllm-ios-tests")!
        defaults.removePersistentDomain(forName: "leetllm-ios-tests")
        let store = ProgressStore(userDefaults: defaults, namespace: "tests")

        let first = store.recordQuizResult(kind: .theory, slug: "beginner", correct: 8, total: 10)
        XCTAssertEqual(first.score, 80)
        XCTAssertTrue(first.passed)

        let second = store.recordQuizResult(kind: .theory, slug: "beginner", correct: 6, total: 10)
        XCTAssertEqual(second.score, 60)

        let stored = store.quizResult(kind: .theory, slug: "beginner")
        XCTAssertEqual(stored?.score, 80)
        XCTAssertEqual(stored?.attempts, 2)
    }

    func testRemoteMergeRestoresReadLessonsAndPassedQuizzes() {
        let defaults = UserDefaults(suiteName: "leetllm-ios-tests-merge")!
        defaults.removePersistentDomain(forName: "leetllm-ios-tests-merge")
        let store = ProgressStore(userDefaults: defaults, namespace: "merge-tests")

        let lessonCount = store.mergeRemoteReadLessons(["attention-basics", "transformer-blocks"])
        let quizCount = store.mergeRemoteTheoryQuizPasses(["beginner", "advanced"])

        XCTAssertEqual(lessonCount, 2)
        XCTAssertEqual(quizCount, 2)
        XCTAssertTrue(store.isRead("attention-basics"))
        XCTAssertTrue(store.passedTheoryQuizSlugs.contains("beginner"))
        XCTAssertEqual(store.quizResult(kind: .theory, slug: "advanced")?.score, 100)

        XCTAssertEqual(store.mergeRemoteReadLessons(["attention-basics"]), 0)
        XCTAssertEqual(store.mergeRemoteTheoryQuizPasses(["beginner"]), 0)
    }

    func testStoresSectionChecksSeparately() {
        let defaults = UserDefaults(suiteName: "leetllm-ios-tests-section")!
        defaults.removePersistentDomain(forName: "leetllm-ios-tests-section")
        let store = ProgressStore(userDefaults: defaults, namespace: "section-tests")

        let result = store.recordQuizResult(kind: .section, slug: "rag-working-4h-week-2-1234abcd", correct: 7, total: 8)
        let boundary = store.recordQuizResult(kind: .section, slug: "rag-working-4h-week-3-1234abcd", correct: 6, total: 8)

        XCTAssertTrue(result.passed)
        XCTAssertTrue(boundary.passed)
        XCTAssertEqual(store.quizResult(kind: .section, slug: "rag-working-4h-week-2-1234abcd")?.score, 88)
        XCTAssertNil(store.quizResult(kind: .mastery, slug: "rag-working-4h-week-2-1234abcd"))
    }

    func testScrollPositionChangesDoNotInvalidateTheEntireApp() {
        let suiteName = "leetllm-ios-tests-scroll"
        let defaults = UserDefaults(suiteName: suiteName)!
        defaults.removePersistentDomain(forName: suiteName)
        defer { defaults.removePersistentDomain(forName: suiteName) }

        let store = ProgressStore(userDefaults: defaults, namespace: "scroll-tests")
        var publishedChanges = 0
        let observation = store.objectWillChange.sink {
            publishedChanges += 1
        }

        store.saveScrollPosition("lesson_block_2", for: "transformers")
        store.saveScrollPosition("lesson_block_6", for: "transformers")
        store.saveScrollPosition("lesson_block_6", for: "transformers")

        XCTAssertEqual(publishedChanges, 0)
        XCTAssertNil(defaults.data(forKey: "leetllm_ios_progress_scroll-tests"))

        store.flushPendingScrollPosition()

        let restored = ProgressStore(userDefaults: defaults, namespace: "scroll-tests")
        XCTAssertEqual(restored.scrollPosition(for: "transformers"), "lesson_block_6")
        withExtendedLifetime(observation) {}
    }

    func testRepeatedRouteDoesNotRepublishOrRewriteProgress() {
        let suiteName = "leetllm-ios-tests-routes"
        let defaults = UserDefaults(suiteName: suiteName)!
        defaults.removePersistentDomain(forName: suiteName)
        defer { defaults.removePersistentDomain(forName: suiteName) }

        let store = ProgressStore(userDefaults: defaults, namespace: "route-tests")
        store.trackViewedRoute(.lesson("transformers"))
        var publishedChanges = 0
        let observation = store.objectWillChange.sink {
            publishedChanges += 1
        }

        store.trackViewedRoute(.lesson("transformers"))

        XCTAssertEqual(publishedChanges, 0)
        withExtendedLifetime(observation) {}
    }
}
