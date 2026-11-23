import XCTest
import UIKit

final class LearningFlowsTests: XCTestCase {
    private var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        XCUIDevice.shared.orientation = .portrait
        app = XCUIApplication()
    }

    override func tearDownWithError() throws {
        app.terminate()
        XCUIDevice.shared.orientation = .portrait
    }

    private func launch(_ route: String = "learn", query: String? = nil, reset: Bool = true) {
        app.launchArguments = ["--ui-testing", "--offline", "--initial-route", route]
        if reset { app.launchArguments.append("--reset-ui-state") }
        if let query { app.launchArguments += ["--initial-query", query] }
        app.launch()
    }

    private func reveal(_ element: XCUIElement, scrollDown: Bool = false, maxSwipes: Int = 10, file: StaticString = #filePath, line: UInt = #line) {
        for _ in 0..<maxSwipes {
            let bottomEdge = app.tabBars.firstMatch.exists && app.tabBars.firstMatch.frame.minY > app.frame.midY
                ? app.tabBars.firstMatch.frame.minY
                : app.frame.maxY - 35
            if element.waitForExistence(timeout: 1), element.isHittable,
               element.frame.midY > app.frame.minY + 40,
               element.frame.midY < bottomEdge {
                return
            }
            if scrollDown {
                app.swipeDown()
            } else {
                app.swipeUp()
            }
        }
        capture("unreachable-element")
        XCTFail("The requested control is not visible: \(element)", file: file, line: line)
    }

    private func tap(_ element: XCUIElement, scrollDown: Bool = false, maxSwipes: Int = 10, file: StaticString = #filePath, line: UInt = #line) {
        reveal(element, scrollDown: scrollDown, maxSwipes: maxSwipes, file: file, line: line)
        XCTAssertTrue(element.isEnabled, file: file, line: line)
        element.tap()
    }

    private func capture(_ name: String) {
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }

    private func openLessonActions(_ action: String) {
        tap(app.buttons["Lesson actions"])
        tap(app.buttons[action])
    }

    func testHomeAndPersonalPlanOpenLessonAcrossTabs() {
        launch()
        XCTAssertTrue(app.buttons["continue-learning"].waitForExistence(timeout: 10))
        capture("learn-home")
        tap(app.buttons["Build a personal plan"])
        XCTAssertTrue(app.navigationBars["Build Plan"].waitForExistence(timeout: 10))
        capture("plan-builder")
        tap(app.buttons["Build My Plan"])
        XCTAssertTrue(app.navigationBars["Your Plan"].waitForExistence(timeout: 10))
        capture("personal-plan")
        tap(app.buttons["Start Plan"])
        XCTAssertTrue(app.buttons["Lesson actions"].waitForExistence(timeout: 10))
        capture("plan-lesson")
    }

    func testNotesAutosaveAcrossAppRestart() {
        launch("lesson", query: "python-for-ai-engineering")
        openLessonActions("Notes")
        let editor = app.textViews["lesson-note-editor"]
        tap(editor)
        editor.typeText("Recall: test shapes before training.")
        app.terminate()
        launch("lesson", query: "python-for-ai-engineering", reset: false)
        openLessonActions("Notes")
        XCTAssertEqual(app.textViews["lesson-note-editor"].value as? String, "Recall: test shapes before training.")
        capture("saved-note")
    }

    func testBookmarksLibraryAndEmptySearchRecovery() {
        launch("lesson", query: "python-for-ai-engineering")
        tap(app.buttons["Bookmark"])
        if UIDevice.current.userInterfaceIdiom == .phone {
            tap(app.navigationBars.buttons.firstMatch)
        }
        tap(app.buttons["lesson-library"])
        tap(app.buttons["Bookmarks"])
        XCTAssertTrue(app.staticTexts["Python for AI Engineering"].waitForExistence(timeout: 10))
        capture("bookmarks-library")
        let search = app.searchFields.firstMatch
        tap(search, scrollDown: true)
        search.typeText("no-such-lesson-zzzz")
        tap(app.keyboards.buttons["Search"])
        XCTAssertTrue(app.staticTexts["No Results"].waitForExistence(timeout: 10))
        capture("empty-search")
        tap(app.buttons["Clear search"])
        XCTAssertTrue(app.staticTexts["Python for AI Engineering"].waitForExistence(timeout: 10))
    }

    func testLessonContentsAndResumeAfterRestart() {
        launch("lesson", query: "git-shell-linux-reproducible-ai")
        openLessonActions("Contents")
        tap(app.buttons["Meet the terminal, shell, and repository"])
        XCTAssertTrue(app.staticTexts["Meet the terminal, shell, and repository"].firstMatch.isHittable)
        capture("lesson-reader")
        app.terminate()
        launch("lesson", query: "git-shell-linux-reproducible-ai", reset: false)
        XCTAssertTrue(app.buttons["Lesson actions"].waitForExistence(timeout: 10))
        capture("lesson-resumed")
    }

    func testBundledPracticeFixtureOpensOffline() {
        launch("lesson", query: "git-shell-linux-reproducible-ai")
        openLessonActions("Contents")
        tap(app.buttons["Commit the three-row fixture"])
        tap(app.webViews.links["fixture"].firstMatch)
        XCTAssertTrue(app.navigationBars["access_requests.jsonl"].waitForExistence(timeout: 10))
        let fileContents = app.textViews["practice-file-content"]
        XCTAssertTrue(fileContents.waitForExistence(timeout: 10))
        XCTAssertTrue((fileContents.value as? String ?? "").contains("102"))
        capture("offline-fixture-preview")
        tap(app.buttons["Done"].firstMatch)
        XCTAssertTrue(app.buttons["Lesson actions"].exists)
    }

    func testLeetySignInPromptOpensAccount() {
        launch("lesson", query: "python-for-ai-engineering")
        tap(app.buttons["Sign in to ask Leety about this page"])
        tap(app.buttons["Open Settings"])
        XCTAssertTrue(app.buttons["Sign In"].waitForExistence(timeout: 10))
        XCTAssertFalse(app.buttons["Sign In"].isEnabled)
    }

    func testAccessibilityDescriptions() throws {
        launch("lesson", query: "python-for-ai-engineering")
        XCTAssertTrue(app.buttons["Lesson actions"].waitForExistence(timeout: 10))
        try app.performAccessibilityAudit(for: .sufficientElementDescription)
    }

    func testColdLaunchPerformance() {
        app.launchArguments = ["--ui-testing", "--offline", "--reset-ui-state"]
        measure(metrics: [XCTApplicationLaunchMetric(waitUntilResponsive: true)]) {
            app.launch()
            XCTAssertTrue(app.buttons["continue-learning"].waitForExistence(timeout: 10))
            app.terminate()
        }
    }

    func testReaderContentsAndAppearance() {
        launch("lesson", query: "python-for-ai-engineering")
        openLessonActions("Contents")
        XCTAssertTrue(app.navigationBars["Contents"].waitForExistence(timeout: 10))
        capture("reader-contents")
        tap(app.buttons["One row is ordinary Python data"])
        XCTAssertTrue(app.staticTexts["One row is ordinary Python data"].firstMatch.waitForExistence(timeout: 10))
        XCTAssertTrue(app.staticTexts["One row is ordinary Python data"].firstMatch.isHittable)
        capture("reader-section-jump")
        openLessonActions("Contents")
        tap(app.buttons["Introduction"])
        tap(app.buttons["Reader settings"])
        XCTAssertTrue(app.buttons["Increase text size"].waitForExistence(timeout: 10))
        tap(app.buttons["Increase text size"])
        XCTAssertTrue(app.staticTexts["19 pt"].exists)
        tap(app.buttons["Dark"])
        capture("reader-dark-settings")
        tap(app.buttons["Done"])
        capture("reader-dark")
        XCTAssertTrue(app.buttons["Bookmark"].exists)
        tap(app.buttons["Bookmark"])
        XCTAssertTrue(app.buttons["Bookmarked"].exists)
        tap(app.buttons["Mark Read"])
        XCTAssertTrue(app.buttons["Read"].exists)
    }

    func testLessonIllustrationSurvivesScrollingAndZoom() {
        launch("lesson", query: "word-embeddings-contextual-representations")
        let illustration = app.buttons["Illustration"].firstMatch
        XCTAssertTrue(illustration.waitForExistence(timeout: 10))

        for _ in 0..<2 {
            app.swipeUp()
            app.swipeUp()
            reveal(illustration, scrollDown: true)
            XCTAssertTrue(illustration.isHittable)
        }

        tap(illustration)
        let close = app.buttons["Close illustration"]
        XCTAssertTrue(close.waitForExistence(timeout: 10))
        tap(close)
        XCTAssertTrue(close.waitForNonExistence(timeout: 5))
        XCTAssertTrue(illustration.waitForExistence(timeout: 10))

        app.terminate()
        launch("lesson", query: "scaled-dot-product-attention")
        tap(app.buttons["Reader settings"])
        tap(app.buttons["Light"])
        tap(app.buttons["Done"])
        openLessonActions("Contents")
        tap(app.buttons["The core formula"])
        let diagram = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Diagram showing ")).firstMatch
        let diagramClose = app.buttons["Close illustration"]
        reveal(diagram)
        tap(diagram)
        XCTAssertTrue(diagramClose.waitForExistence(timeout: 10))
        tap(diagramClose)
        XCTAssertTrue(diagramClose.waitForNonExistence(timeout: 5))
        tap(app.buttons["Reader settings"])
        tap(app.buttons["Dark"])
        tap(app.buttons["Done"])
        reveal(diagram)
        tap(diagram)
        XCTAssertTrue(diagramClose.waitForExistence(timeout: 10))
        tap(diagramClose)
        XCTAssertTrue(diagramClose.waitForNonExistence(timeout: 5))
    }

    func testQuizDraftPersistsAndOtherQuizStartsFresh() {
        launch("quiz", query: "beginner-ai-systems-foundations")
        tap(app.buttons["quiz-option-0-0"])
        XCTAssertEqual(app.buttons["quiz-option-0-0"].value as? String, "Selected")
        tap(app.buttons["quiz-next"])
        XCTAssertTrue(app.buttons["quiz-option-1-0"].exists)
        app.terminate()
        launch("quiz", query: "beginner-ai-systems-foundations", reset: false)
        reveal(app.buttons["quiz-option-1-0"])
        XCTAssertTrue(app.buttons["quiz-option-1-0"].exists)
        XCTAssertTrue(app.staticTexts["1/12 answered"].exists)
        capture("resumed-quiz")
        app.terminate()
        launch("quiz", query: "intermediate-llm-product-systems", reset: false)
        reveal(app.buttons["quiz-option-0-0"])
        XCTAssertTrue(app.buttons["quiz-option-0-0"].exists)
        XCTAssertFalse(app.buttons["quiz-check"].isEnabled)
    }

    func testQuizCorrectionsCanBeCheckedAgain() {
        launch("quiz", query: "beginner-ai-systems-foundations")
        for index in 0..<12 {
            tap(app.buttons["quiz-option-\(index)-0"])
            XCTAssertEqual(app.buttons["quiz-option-\(index)-0"].value as? String, "Selected")
            if index < 11 { tap(app.buttons["quiz-next"]) }
        }
        tap(app.buttons["quiz-check"])

        var incorrectQuestionIDs = Set<Int>()
        for index in 0..<12 {
            let reportQuestion = app.descendants(matching: .any).matching(identifier: "quiz-report-question-\(index)").firstMatch
            let status = app.descendants(matching: .any).matching(identifier: "quiz-report-status-\(index)").firstMatch
            let submitted = app.descendants(matching: .any).matching(identifier: "quiz-report-submitted-\(index)").firstMatch
            let correct = app.descendants(matching: .any).matching(identifier: "quiz-report-correct-\(index)").firstMatch
            let explanation = app.descendants(matching: .any).matching(identifier: "quiz-report-explanation-\(index)").firstMatch
            reveal(status)
            XCTAssertTrue(reportQuestion.exists)
            XCTAssertTrue(status.label.hasPrefix("Last check · "))
            XCTAssertTrue(submitted.label.hasPrefix("Your submitted answer: "))
            XCTAssertTrue(correct.label.hasPrefix("Correct answer: "))
            let submittedAnswer = String(submitted.label.dropFirst("Your submitted answer: ".count))
            let correctAnswer = String(correct.label.dropFirst("Correct answer: ".count))
            XCTAssertEqual(status.label, submittedAnswer == correctAnswer ? "Last check · Correct" : "Last check · Incorrect")
            if submittedAnswer != correctAnswer { incorrectQuestionIDs.insert(index) }
            XCTAssertFalse(explanation.label.isEmpty)
        }
        XCTAssertFalse(app.buttons["quiz-next"].exists)
        XCTAssertFalse(app.buttons["Previous"].exists)
        XCTAssertFalse(app.buttons["quiz-question-menu"].exists)
        capture("quiz-report")

        let filter = app.segmentedControls["quiz-report-filter"]
        tap(filter.buttons["Incorrect"], scrollDown: true, maxSwipes: 24)
        for index in 0..<12 {
            let question = app.descendants(matching: .any).matching(identifier: "quiz-report-question-\(index)").firstMatch
            XCTAssertEqual(question.exists, incorrectQuestionIDs.contains(index))
        }
        XCTAssertEqual(app.descendants(matching: .any).matching(identifier: "quiz-report-no-incorrect").firstMatch.exists, incorrectQuestionIDs.isEmpty)
        tap(filter.buttons["All"])
        XCTAssertTrue(app.descendants(matching: .any).matching(identifier: "quiz-report-question-0").firstMatch.exists)

        app.terminate()
        launch("quiz", query: "beginner-ai-systems-foundations", reset: false)
        XCTAssertTrue(app.descendants(matching: .any).matching(identifier: "quiz-report-status-0").firstMatch.waitForExistence(timeout: 10))
        XCTAssertFalse(app.buttons["quiz-next"].exists)
        let firstSubmitted = app.descendants(matching: .any).matching(identifier: "quiz-report-submitted-0").firstMatch
        let submittedBeforeEdit = firstSubmitted.label
        tap(app.buttons["quiz-report-edit-0"])
        XCTAssertEqual(app.buttons["quiz-report-edit-0"].value as? String, "Editing")
        XCTAssertFalse(app.buttons["quiz-option-1-0"].exists)
        XCTAssertFalse(app.buttons["quiz-check"].exists)
        tap(app.buttons["quiz-option-0-1"])
        XCTAssertTrue(app.descendants(matching: .any).matching(identifier: "quiz-report-stale").firstMatch.exists)
        XCTAssertTrue(app.descendants(matching: .any).matching(identifier: "quiz-report-current-0").firstMatch.exists)
        XCTAssertEqual(firstSubmitted.label, submittedBeforeEdit)
        capture("quiz-answer-changed")
        XCTAssertTrue(app.buttons["quiz-check"].isEnabled)
        tap(app.buttons["quiz-report-check-0"])
        XCTAssertTrue(app.descendants(matching: .any).matching(identifier: "quiz-report-status-0").firstMatch.exists)
        XCTAssertEqual(app.buttons["quiz-report-edit-0"].value as? String, "Collapsed")
        XCTAssertFalse(app.buttons["quiz-option-0-1"].exists)
        XCTAssertFalse(app.buttons["quiz-next"].exists)
        XCTAssertFalse(app.descendants(matching: .any).matching(identifier: "quiz-report-stale").firstMatch.exists)
        XCTAssertFalse(app.descendants(matching: .any).matching(identifier: "quiz-report-current-0").firstMatch.exists)
        XCTAssertNotEqual(firstSubmitted.label, submittedBeforeEdit)
        capture("corrected-quiz")
        tap(app.buttons["New attempt"], maxSwipes: 24)
        tap(app.buttons["Keep answers"])
        XCTAssertTrue(app.descendants(matching: .any).matching(identifier: "quiz-report-status-0").firstMatch.exists)
        tap(app.buttons["quiz-report-edit-0"], scrollDown: true, maxSwipes: 24)
        reveal(app.buttons["quiz-option-0-1"])
        XCTAssertTrue((app.buttons["quiz-option-0-1"].value as? String)?.hasPrefix("Selected") == true)
    }

    func testPracticeSearchRevealsMatchingTheoryQuizzes() {
        launch("practice")
        let search = app.searchFields.firstMatch
        tap(search, scrollDown: true)
        search.typeText("Foundations")
        tap(app.keyboards.buttons["Search"])
        let quiz = app.staticTexts["Beginner AI Systems Foundations"].firstMatch
        reveal(quiz)
        XCTAssertTrue(quiz.isHittable)
        capture("practice-quiz-search")
    }

    func testGlossarySearchAndRelatedTerms() {
        launch("glossary")
        let search = app.searchFields.firstMatch
        tap(search, scrollDown: true)
        search.typeText("vllm")
        app.keyboards.buttons["Search"].tap()
        XCTAssertTrue(app.staticTexts["vLLM"].waitForExistence(timeout: 10))
        tap(app.staticTexts["vLLM"].firstMatch)
        capture("glossary-vllm")
        XCTAssertTrue(app.staticTexts["vLLM"].waitForExistence(timeout: 10))
    }

    func testOfflineAccountAndResetCancellation() {
        launch("account")
        XCTAssertTrue(app.staticTexts["Offline"].waitForExistence(timeout: 10))
        XCTAssertFalse(app.buttons["Sign In"].isEnabled)
        capture("offline-account")
        tap(app.buttons["Reset Local Progress"])
        tap(app.buttons["Cancel"])
        XCTAssertTrue(app.buttons["Reset Local Progress"].exists)
    }

    func testResetClearsOpenReaderState() {
        launch()
        tap(app.buttons["continue-learning"])
        tap(app.buttons["Bookmark"])
        openLessonActions("Notes")
        let editor = app.textViews["lesson-note-editor"]
        tap(editor)
        editor.typeText("This note belongs to the old local state.")
        tap(app.navigationBars.buttons["Done"])
        app.descendants(matching: .any).matching(identifier: "Settings").firstMatch.tap()
        tap(app.buttons["Reset Local Progress"])
        tap(app.alerts.buttons["Reset"])
        app.descendants(matching: .any).matching(identifier: "Learn").firstMatch.tap()
        tap(app.buttons["continue-learning"])
        XCTAssertTrue(app.buttons["Bookmark"].waitForExistence(timeout: 10))
        openLessonActions("Notes")
        XCTAssertEqual(app.textViews["lesson-note-editor"].value as? String, "")
        capture("reset-reader-state")
    }

    func testLayoutsInLandscapeAndLargeText() {
        launch("lesson", query: "transformer-architecture-end-to-end")
        XCTAssertTrue(app.buttons["Lesson actions"].waitForExistence(timeout: 10))
        XCUIDevice.shared.orientation = .landscapeLeft
        capture("reader-landscape")
        XCTAssertTrue(app.buttons["Reader settings"].waitForExistence(timeout: 10))
        XCUIDevice.shared.orientation = .portrait
        tap(app.buttons["Reader settings"])
        for _ in 0..<12 { tap(app.buttons["Increase text size"]) }
        XCTAssertTrue(app.staticTexts["30 pt"].exists)
        XCTAssertFalse(app.buttons["Increase text size"].isEnabled)
        tap(app.buttons["Done"])
        capture("reader-large-text")
    }

    func testEveryMainScreenLaunches() {
        for route in ["learn", "practice", "tracks", "glossary", "account"] {
            launch(route)
            switch route {
            case "learn":
                XCTAssertTrue(app.buttons["continue-learning"].waitForExistence(timeout: 10))
            case "practice", "glossary":
                let search = app.searchFields.firstMatch
                XCTAssertTrue(search.waitForExistence(timeout: 10))
                XCTAssertEqual(search.placeholderValue, route == "practice" ? "Search quizzes" : "Search terms and definitions")
            case "tracks":
                let plan = app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "Personal Learning Plan")).firstMatch
                XCTAssertTrue(plan.waitForExistence(timeout: 10))
                XCTAssertTrue(plan.isHittable)
            case "account":
                XCTAssertTrue(app.staticTexts["Offline"].waitForExistence(timeout: 10))
            default:
                XCTFail("Unhandled launch route: \(route)")
            }
            capture("screen-\(route)")
            app.terminate()
        }
    }
}
