import Foundation

struct SearchResults {
    let lessons: [LessonIndexItem]
    let blogs: [BlogIndexItem]
    let glossary: [GlossaryEntry]
    let quizzes: [TheoryQuiz]
}

struct SearchIndex {
    let dataService: DataService
    let userEmail: String?
    let isAuthenticated: Bool

    @MainActor
    func search(_ rawQuery: String) -> SearchResults {
        let query = rawQuery.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard !query.isEmpty else {
            return SearchResults(
                lessons: dataService.lessons,
                blogs: [],
                glossary: dataService.glossary,
                quizzes: dataService.theoryQuizzes
            )
        }

        return SearchResults(
            lessons: dataService.lessons.filter { lesson in
                let inMetadata = haystack([
                    lesson.title,
                    lesson.section,
                    lesson.category,
                    lesson.difficulty,
                    lesson.shortDescription,
                    lesson.keyConceptsTested.joined(separator: " "),
                ]).contains(query)
                if inMetadata { return true }
                if let detail = dataService.lesson(slug: lesson.slug) {
                    return detail.content.lowercased().contains(query)
                }
                return false
            },
            blogs: [],
            glossary: dataService.glossary.filter { entry in
                dataService.glossaryMatches(entry, normalizedQuery: query)
            },
            quizzes: dataService.theoryQuizzes.filter { quiz in
                haystack([
                    quiz.title,
                    quiz.level,
                    quiz.description,
                    quiz.sections.joined(separator: " "),
                    quiz.questions.map(\.question).joined(separator: " "),
                ]).contains(query)
            }
        )
    }

    private func haystack(_ values: [String]) -> String {
        values.joined(separator: " ").lowercased()
    }
}
