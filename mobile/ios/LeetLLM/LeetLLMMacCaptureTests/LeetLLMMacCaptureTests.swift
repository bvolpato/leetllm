import CoreGraphics
import ImageIO
import XCTest

final class LeetLLMMacCaptureTests: XCTestCase {
    private struct CaptureSpec {
        let name: String
        let route: String
        let query: String?
    }

    func testCaptureNativeMacScreenshots() throws {
        continueAfterFailure = false
        let captures: [CaptureSpec] = [
            CaptureSpec(name: "01_learn", route: "lesson", query: "transformer-architecture-end-to-end"),
            CaptureSpec(name: "02_practice", route: "practice", query: nil),
            CaptureSpec(name: "03_tracks", route: "tracks", query: nil),
            CaptureSpec(name: "04_glossary", route: "glossary", query: nil),
        ]

        for spec in captures {
            let app = XCUIApplication()
            app.launchArguments = [
                "--ui-testing",
                "--offline",
                "--reset-ui-state",
                "--no-splash",
                "--native-mac-capture-window",
                "--initial-route", spec.route,
                "-AppleLanguages", "(en)",
                "-AppleLocale", "en_US",
            ]
            if let query = spec.query {
                app.launchArguments += ["--initial-query", query]
            }
            app.launch()
            defer { app.terminate() }

            let window = app.windows.firstMatch
            XCTAssertTrue(window.waitForExistence(timeout: 20), app.debugDescription)

            switch spec.route {
            case "lesson":
                XCTAssertTrue(app.buttons["lesson-mark-read"].waitForExistence(timeout: 20))
            case "practice":
                XCTAssertTrue(app.buttons["quiz-option-0-0"].waitForExistence(timeout: 20))
            case "tracks":
                let planButton = app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "Personal Learning Plan")).firstMatch
                XCTAssertTrue(planButton.waitForExistence(timeout: 20))
            case "glossary":
                XCTAssertTrue(app.textFields["Search terms and definitions"].waitForExistence(timeout: 20))
            default:
                XCTFail("Unhandled route \(spec.route)")
            }

            let geometry = XCTNSPredicateExpectation(
                predicate: NSPredicate { _, _ in
                    abs(window.frame.width - 1280) < 1 && abs(window.frame.height - 800) < 1
                },
                object: window
            )
            XCTAssertEqual(XCTWaiter.wait(for: [geometry], timeout: 10), .completed)
            RunLoop.current.run(until: Date().addingTimeInterval(0.6))

            let screenshot = window.screenshot()
            let source = try XCTUnwrap(CGImageSourceCreateWithData(screenshot.pngRepresentation as CFData, nil))
            let image = try XCTUnwrap(CGImageSourceCreateImageAtIndex(source, 0, nil))
            XCTAssertTrue(
                [(1280, 800), (2560, 1600)].contains { $0.0 == image.width && $0.1 == image.height },
                "Native window capture must have an accepted 16:10 size, got \(image.width)x\(image.height)"
            )
            let attachment = XCTAttachment(screenshot: screenshot)
            attachment.name = spec.name
            attachment.lifetime = .keepAlways
            add(attachment)
        }
    }
}
