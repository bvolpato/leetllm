import SwiftUI

struct PracticeView: View {
    @ObservedObject private var dataService = DataService.shared
    @ObservedObject private var progressStore = ProgressStore.shared
    @ObservedObject private var navigation = AppNavigation.shared
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass
    @State private var selectedSlug: String?
    @State private var navigationPath = NavigationPath()
    @State private var query = ""

    var body: some View {
        Group {
            #if targetEnvironment(macCatalyst)
            MacSplitView(sidebarWidth: 300) {
                VStack(spacing: 0) {
                    MacSidebarSearchBar(text: $query, placeholder: "Search quizzes")
                    List {
                        quizListContent(withSimultaneousGesture: true)
                    }
                    .listStyle(.sidebar)
                    .scrollContentBackground(.hidden)
                }
            } detail: {
                if let quiz = selectedQuiz ?? dataService.theoryQuizzes.first {
                    TheoryQuizDetailView(quiz: quiz)
                        .id(quiz.slug)
                } else {
                    EmptyStateView(title: "No Quizzes", message: "Bundled quizzes are unavailable.", systemImage: "checklist")
                }
            }
            #else
            if horizontalSizeClass == .regular {
                NavigationSplitView {
                    quizList
                        .navigationTitle("Practice")
                        .navigationBarTitleDisplayMode(.inline)
                        .navigationSplitViewColumnWidth(min: 240, ideal: 285, max: 340)
                } detail: {
                    if let quiz = selectedQuiz ?? dataService.theoryQuizzes.first {
                        TheoryQuizDetailView(quiz: quiz)
                            .id(quiz.slug)
                    } else {
                        EmptyStateView(title: "No Quizzes", message: "Bundled quizzes are unavailable.", systemImage: "checklist")
                    }
                }
            } else {
                NavigationStack(path: $navigationPath) {
                    quizList
                        .navigationTitle(horizontalSizeClass == .regular ? "Practice" : "")
                        .navigationBarTitleDisplayMode(.inline)
                        .navigationDestination(for: String.self) { slug in
                            if let quiz = dataService.theoryQuizzes.first(where: { $0.slug == slug }) {
                                TheoryQuizDetailView(quiz: quiz)
                            }
                        }
                }
            }
            #endif
        }
        .onChange(of: navigation.quizSlug) { _, slug in
            if let slug { openQuiz(slug) }
        }
        .onChange(of: selectedSlug) { _, slug in
            if let slug { navigation.selectedPracticeSlug = slug }
        }
        .onAppear {
            if let slug = navigation.quizSlug {
                openQuiz(slug)
            } else if horizontalSizeClass == .regular, selectedSlug == nil {
                selectedSlug = navigation.selectedPracticeSlug ?? dataService.theoryQuizzes.first?.slug
            }
        }
    }

    private func openQuiz(_ slug: String) {
        guard dataService.theoryQuizzes.contains(where: { $0.slug == slug }) else { return }
        selectedSlug = slug
        navigation.selectedPracticeSlug = slug
        if horizontalSizeClass != .regular { navigationPath = NavigationPath([slug]) }
        navigation.quizSlug = nil
    }

    private var selectedQuiz: TheoryQuiz? {
        guard let selectedSlug else { return nil }
        return dataService.theoryQuizzes.first { $0.slug == selectedSlug }
    }

    @ViewBuilder
    private var quizList: some View {
        if horizontalSizeClass == .regular {
            List(selection: $selectedSlug) {
                quizListContent(withSimultaneousGesture: true)
            }
            .listStyle(.sidebar)
            .searchable(text: $query, placement: .navigationBarDrawer(displayMode: .always), prompt: "Search quizzes")
        } else {
            List {
                quizListContent(withSimultaneousGesture: false)
            }
            .listStyle(.insetGrouped)
            .searchable(text: $query, prompt: "Search quizzes")
        }
    }

    @ViewBuilder
    private func quizListContent(withSimultaneousGesture: Bool) -> some View {
        if !filteredQuizzes.isEmpty {
            Section("Theory quizzes") {
                ForEach(filteredQuizzes) { quiz in
                    #if targetEnvironment(macCatalyst)
                    Button {
                        selectedSlug = quiz.slug
                    } label: {
                        QuizListRow(
                            quiz: quiz,
                            result: progressStore.quizResult(kind: .theory, slug: quiz.slug),
                            isSelected: selectedSlug == quiz.slug
                        )
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .listRowBackground(macSidebarRowBackground(isSelected: selectedSlug == quiz.slug))
                    #else
                    if withSimultaneousGesture {
                        NavigationLink(value: quiz.slug) {
                            QuizListRow(
                                quiz: quiz,
                                result: progressStore.quizResult(kind: .theory, slug: quiz.slug),
                                isSelected: selectedSlug == quiz.slug
                            )
                        }
                        .simultaneousGesture(TapGesture().onEnded {
                            selectedSlug = quiz.slug
                        })
                    } else {
                        NavigationLink(value: quiz.slug) {
                            QuizListRow(
                                quiz: quiz,
                                result: progressStore.quizResult(kind: .theory, slug: quiz.slug),
                                isSelected: false
                            )
                        }
                    }
                    #endif
                }
            }
        }

        if filteredQuizzes.isEmpty {
            ContentUnavailableView.search(text: query)
        }
    }

    private var filteredQuizzes: [TheoryQuiz] {
        let search = query.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !search.isEmpty else { return dataService.theoryQuizzes }
        return dataService.theoryQuizzes.filter {
            [$0.title, $0.description, $0.level, $0.sections.joined(separator: " ")].joined(separator: " ").localizedCaseInsensitiveContains(search)
        }
    }
}

private struct QuizListRow: View {
    let quiz: TheoryQuiz
    let result: StoredQuizResult?
    let isSelected: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 8) {
                Text(quiz.title)
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(.primary)
                    .lineLimit(1)
                Spacer()
                if let result, result.passed {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundStyle(Color.green)
                        .font(.caption)
                }
            }
            HStack(spacing: 6) {
                StatusPill(quiz.level, tint: quizTint(quiz.level))
                Text("\(quiz.questions.count)q · \(quiz.estimatedMinutes)m")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                if let result {
                    Text("•")
                        .font(.caption2)
                        .foregroundStyle(.tertiary)
                    Text("\(result.score)%")
                        .font(.caption2.weight(.medium))
                        .foregroundStyle(.orange)
                }
            }
        }
        .padding(.vertical, 3)
    }
}

struct TheoryQuizDetailView: View {
    let quiz: TheoryQuiz
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass

    var body: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 16) {
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            StatusPill(quiz.level, tint: quizTint(quiz.level))
                            StatusPill("\(quiz.estimatedMinutes)m", systemImage: "clock", tint: .secondary)
                        }
                        ContentTitle(quiz.title)
                        Text(quiz.description)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                        Text(quiz.sections.joined(separator: " · "))
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    }

                    QuizRunnerView(
                        title: "Quiz",
                        subtitle: "\(quiz.questions.count) questions",
                        showsHeading: false,
                        prompts: quiz.questions.enumerated().map { QuizPrompt(id: $0.offset, question: $0.element) },
                        resultKind: .theory,
                        resultSlug: quiz.slug,
                        onQuestionChange: { proxy.scrollTo("quiz-runner", anchor: .top) }
                    )
                    .id("quiz-runner")
                }
                .padding(24)
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .navigationTitle(horizontalSizeClass == .regular ? "" : quiz.title)
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}

struct QuizRunnerView: View {
    let title: String
    let subtitle: String
    var showsHeading = true
    let prompts: [QuizPrompt]
    let resultKind: QuizResultKind
    let resultSlug: String
    var onQuestionChange: () -> Void = {}

    @ObservedObject private var progressStore = ProgressStore.shared
    @State private var selections: [Int: String] = [:]
    @State private var checkedSelections: [Int: String]?
    @State private var latestResult: StoredQuizResult?
    @State private var attemptSeed = UUID().uuidString
    @State private var questionIndex = 0
    @State private var didLoadDraft = false
    @State private var confirmReset = false
    @State private var editingPromptID: Int?
    @State private var reportFilter: QuizReportFilter = .all

    private var displayedOptions: [Int: [String]] {
        Dictionary(uniqueKeysWithValues: prompts.map { prompt in
            let seed = "\(resultSlug):\(attemptSeed):\(prompt.id):\(prompt.question)"
            return (prompt.id, QuizOptionOrder.permuted(options: prompt.options, seed: seed))
        })
    }

    private var allAnswered: Bool {
        !prompts.isEmpty && prompts.allSatisfy { prompt in
            prompt.options.contains(selections[prompt.id] ?? "")
        }
    }

    private var bestResult: StoredQuizResult? {
        progressStore.quizResult(kind: resultKind, slug: resultSlug)
    }

    private var hasCheckedReport: Bool {
        checkedSelections != nil && latestResult != nil
    }

    private var reportPrompts: [QuizPrompt] {
        reportFilter == .all ? prompts : prompts.filter { checkedSelections?[$0.id] != $0.answer }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            if showsHeading {
                ViewThatFits(in: .horizontal) {
                    HStack(alignment: .firstTextBaseline) {
                        quizHeading
                        Spacer()
                        if let bestResult {
                            StatusPill("best \(bestResult.score)%", systemImage: "star.fill", tint: .orange)
                        }
                    }
                    VStack(alignment: .leading, spacing: 4) {
                        quizHeading
                        if let bestResult {
                            StatusPill("best \(bestResult.score)%", systemImage: "star.fill", tint: .orange)
                        }
                    }
                }
            } else if let bestResult {
                HStack {
                    Spacer()
                    StatusPill("best \(bestResult.score)%", systemImage: "star.fill", tint: .orange)
                }
            }

            if prompts.isEmpty {
                EmptyStateView(title: "No questions", message: "This quiz is unavailable.", systemImage: "checklist")
            } else if hasCheckedReport {
                if let latestResult {
                    ResultCard(result: latestResult)
                }

                Picker("Report questions", selection: $reportFilter) {
                    Text("All").tag(QuizReportFilter.all)
                    Text("Incorrect").tag(QuizReportFilter.incorrect)
                }
                .pickerStyle(.segmented)
                .accessibilityIdentifier("quiz-report-filter")

                if checkedSelections != selections {
                    Label("Your current answers changed. The report below shows your last checked answers. Check again to update it.", systemImage: "arrow.triangle.2.circlepath")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .accessibilityIdentifier("quiz-report-stale")
                    checkButton()
                }

                if reportPrompts.isEmpty {
                    Label("All answers correct", systemImage: "checkmark.circle")
                        .font(.headline)
                        .accessibilityIdentifier("quiz-report-no-incorrect")
                }

                ForEach(reportPrompts) { prompt in
                    reportQuestionCard(prompt)
                }
            } else {
                ProgressView(value: Double(selections.count), total: Double(prompts.count))
                    .accessibilityLabel("Questions answered")
                Text("\(selections.count)/\(prompts.count) answered")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .accessibilityIdentifier("quiz-answered-count")
                Menu {
                    ForEach(Array(prompts.enumerated()), id: \.element.id) { index, prompt in
                        Button {
                            questionIndex = index
                        } label: {
                            Label("Question \(index + 1)", systemImage: selections[prompt.id] == nil ? "circle" : "checkmark.circle")
                        }
                    }
                } label: {
                    Label("Question \(questionIndex + 1) of \(prompts.count)", systemImage: "list.bullet")
                        .font(.subheadline.weight(.semibold))
                        .frame(minHeight: 44)
                }
                .accessibilityIdentifier("quiz-question-menu")

                if prompts.indices.contains(questionIndex) {
                    questionCard(prompts[questionIndex])
                }

                HStack {
                    Button("Previous", systemImage: "chevron.left") { questionIndex -= 1 }
                        .disabled(questionIndex == 0)
                    Spacer()
                    Button("Next", systemImage: "chevron.right") { questionIndex += 1 }
                        .disabled(questionIndex >= prompts.count - 1)
                        .accessibilityIdentifier("quiz-next")
                }
                .buttonStyle(.bordered)
                .controlSize(.large)
            }

            if hasCheckedReport {
                HStack {
                    Spacer()
                    resetButton
                }
            } else {
                ViewThatFits(in: .horizontal) {
                    HStack {
                        Spacer()
                        resetButton
                        checkButton()
                    }
                    VStack(alignment: .leading, spacing: 10) {
                        HStack {
                            resetButton
                            checkButton()
                        }
                    }
                }
            }
        }
        .onAppear {
            guard !didLoadDraft else { return }
            loadDraft()
        }
        .onChange(of: resultSlug) { _, _ in loadDraft() }
        .onChange(of: reportFilter) { _, _ in
            editingPromptID = nil
            onQuestionChange()
        }
        .onChange(of: selections) { _, _ in saveDraft() }
        .onChange(of: questionIndex) { _, _ in
            saveDraft()
            onQuestionChange()
        }
        .alert("Start a new attempt?", isPresented: $confirmReset) {
            Button("Start new attempt", role: .destructive) { reset() }
            Button("Keep answers", role: .cancel) {}
        } message: {
            Text("This clears the current answers. Your best score stays saved.")
        }
    }

    private var quizHeading: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title).font(.headline)
            Text(subtitle).font(.footnote).foregroundStyle(.secondary)
        }
    }

    @ViewBuilder
    private var resetButton: some View {
        Button {
            confirmReset = true
        } label: {
            Label("New attempt", systemImage: "arrow.counterclockwise")
        }
        .buttonStyle(.bordered)
        .controlSize(.large)
    }

    @ViewBuilder
    private func checkButton(identifier: String = "quiz-check") -> some View {
        Button {
            submit()
        } label: {
            Label(checkedSelections == nil ? "Check" : "Check again", systemImage: "checkmark.circle.fill")
        }
        .buttonStyle(.borderedProminent)
        .controlSize(.large)
        .disabled(!allAnswered || checkedSelections == selections)
        .accessibilityIdentifier(identifier)
    }

    private func questionCard(_ prompt: QuizPrompt) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            if let section = prompt.section {
                Text(section)
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.indigo)
            }
            InlineMarkdownContent(
                text: "**\(prompt.id + 1).** \(prompt.question)",
                font: .headline,
                fontScale: 0.95,
                isBold: true
            )
            .accessibilityAddTraits(.isHeader)

            VStack(spacing: 8) {
                ForEach(displayedOptions[prompt.id] ?? prompt.options, id: \.self) { option in
                    answerButton(option: option, prompt: prompt)
                }
            }

            if let checkedSelections {
                VStack(alignment: .leading, spacing: 5) {
                    InlineMarkdownContent(
                        text: checkedSelections[prompt.id] == prompt.answer ? "**Last check: Correct**" : "**Last check. Correct answer:** \(prompt.answer)",
                        font: .subheadline.weight(.semibold),
                        fontScale: 0.85,
                        isBold: true
                    )
                    InlineMarkdownContent(
                        text: prompt.explanation,
                        font: .subheadline,
                        fontScale: 0.85
                    )
                }
                .padding(12)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background((checkedSelections[prompt.id] == prompt.answer ? Color.green : Color.orange).opacity(0.12), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
    }

    private func reportQuestionCard(_ prompt: QuizPrompt) -> some View {
        let submittedAnswer = checkedSelections?[prompt.id] ?? "No answer"
        let isCorrect = checkedSelections?[prompt.id] == prompt.answer
        let currentAnswer = selections[prompt.id]

        return VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 6) {
                Image(systemName: isCorrect ? "checkmark.circle.fill" : "xmark.circle.fill")
                    .accessibilityHidden(true)
                Text(isCorrect ? "Last check · Correct" : "Last check · Incorrect")
                    .accessibilityIdentifier("quiz-report-status-\(prompt.id)")
            }
            .font(.subheadline.weight(.semibold))
            .foregroundStyle(isCorrect ? .green : .red)

            if let section = prompt.section {
                Text(section)
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.indigo)
            }

            InlineMarkdownContent(
                text: "**\(prompt.id + 1).** \(prompt.question)",
                font: .headline,
                fontScale: 0.95,
                isBold: true
            )
            .accessibilityAddTraits(.isHeader)

            reportAnswer(label: "Your submitted answer", value: submittedAnswer, identifier: "quiz-report-submitted-\(prompt.id)")

            if let currentAnswer, currentAnswer != submittedAnswer {
                reportAnswer(label: "Current answer · not checked", value: currentAnswer, identifier: "quiz-report-current-\(prompt.id)")
            }

            reportAnswer(label: "Correct answer", value: prompt.answer, identifier: "quiz-report-correct-\(prompt.id)")

            VStack(alignment: .leading, spacing: 5) {
                Text("Explanation")
                    .font(.subheadline.weight(.semibold))
                InlineMarkdownContent(text: prompt.explanation, font: .subheadline, fontScale: 0.85)
            }
            .padding(12)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background((isCorrect ? Color.green : Color.orange).opacity(0.12), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
            .accessibilityElement(children: .combine)
            .accessibilityIdentifier("quiz-report-explanation-\(prompt.id)")

            Button {
                editingPromptID = editingPromptID == prompt.id ? nil : prompt.id
            } label: {
                Label(editingPromptID == prompt.id ? "Done editing" : "Change answer", systemImage: editingPromptID == prompt.id ? "checkmark" : "pencil")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.indigo)
                    .frame(minHeight: 44)
                    .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .accessibilityValue(editingPromptID == prompt.id ? "Editing" : "Collapsed")
            .accessibilityIdentifier("quiz-report-edit-\(prompt.id)")

            if editingPromptID == prompt.id {
                Text("Choose an option to change your answer")
                    .font(.subheadline.weight(.semibold))
                VStack(spacing: 8) {
                    ForEach(displayedOptions[prompt.id] ?? prompt.options, id: \.self) { option in
                        answerButton(option: option, prompt: prompt)
                    }
                }
                if checkedSelections != selections {
                    checkButton(identifier: "quiz-report-check-\(prompt.id)")
                }
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("quiz-report-question-\(prompt.id)")
    }

    private func reportAnswer(label: String, value: String, identifier: String) -> some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(label)
                .font(.caption.weight(.semibold))
                .foregroundStyle(.secondary)
            InlineMarkdownContent(text: value, font: .subheadline, fontScale: 0.85)
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("\(label): \(value)")
        .accessibilityIdentifier(identifier)
    }

    private func answerButton(option: String, prompt: QuizPrompt) -> some View {
        let selected = selections[prompt.id] == option
        let checked = checkedSelections?[prompt.id]
        let isCorrect = option == prompt.answer
        let showCorrect = checkedSelections != nil && isCorrect
        let showWrong = checked == option && !isCorrect

        return Button {
            selections[prompt.id] = option
        } label: {
            HStack(alignment: .top, spacing: 10) {
                Image(systemName: showWrong ? "xmark.circle.fill" : showCorrect ? "checkmark.circle.fill" : selected ? "largecircle.fill.circle" : "circle")
                    .padding(.top, 2)
                InlineMarkdownContent(text: option, allowsTextSelection: false)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .multilineTextAlignment(.leading)
                    .allowsHitTesting(false)
                if selected {
                    Image(systemName: "checkmark")
                        .accessibilityHidden(true)
                }
            }
            .padding(12)
            .frame(minHeight: 44)
            .foregroundStyle(.primary)
            .background(answerBackground(selected: selected, showCorrect: showCorrect, showWrong: showWrong), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: 10, style: .continuous)
                    .stroke(answerBorder(selected: selected, showCorrect: showCorrect, showWrong: showWrong), lineWidth: 1)
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityValue(answerAccessibilityValue(selected: selected, showCorrect: showCorrect, showWrong: showWrong))
        .accessibilityAddTraits(selected ? .isSelected : [])
        .accessibilityIdentifier("quiz-option-\(prompt.id)-\((displayedOptions[prompt.id] ?? prompt.options).firstIndex(of: option) ?? 0)")
    }

    private func answerAccessibilityValue(selected: Bool, showCorrect: Bool, showWrong: Bool) -> String {
        if showCorrect { return selected ? "Selected, correct" : "Correct answer" }
        if showWrong { return selected ? "Selected, incorrect in last check" : "Incorrect in last check" }
        return selected ? "Selected" : "Not selected"
    }

    private func answerBackground(selected: Bool, showCorrect: Bool, showWrong: Bool) -> Color {
        if showCorrect { return .green.opacity(0.16) }
        if showWrong { return .red.opacity(0.14) }
        if selected { return .indigo.opacity(0.14) }
        return .clear
    }

    private func answerBorder(selected: Bool, showCorrect: Bool, showWrong: Bool) -> Color {
        if showCorrect { return .green.opacity(0.55) }
        if showWrong { return .red.opacity(0.55) }
        if selected { return .indigo.opacity(0.55) }
        return .secondary.opacity(0.25)
    }

    private func submit() {
        guard allAnswered, checkedSelections != selections else { return }
        let correct = prompts.filter { selections[$0.id] == $0.answer }.count
        checkedSelections = selections
        latestResult = progressStore.recordQuizResult(kind: resultKind, slug: resultSlug, correct: correct, total: prompts.count)
        editingPromptID = nil
        saveDraft()
        onQuestionChange()
    }

    private func reset() {
        selections = [:]
        checkedSelections = nil
        latestResult = nil
        attemptSeed = UUID().uuidString
        questionIndex = 0
        editingPromptID = nil
        reportFilter = .all
        progressStore.removeQuizDraft(kind: resultKind, slug: resultSlug)
        onQuestionChange()
    }

    private func loadDraft() {
        didLoadDraft = false
        if let draft = progressStore.quizDraft(kind: resultKind, slug: resultSlug, prompts: prompts) {
            selections = draft.selections
            checkedSelections = draft.checkedSelections
            latestResult = draft.result
            attemptSeed = draft.seed
            questionIndex = min(max(draft.questionIndex, 0), max(prompts.count - 1, 0))
        } else {
            selections = [:]
            checkedSelections = nil
            latestResult = nil
            attemptSeed = UUID().uuidString
            questionIndex = 0
        }
        editingPromptID = nil
        reportFilter = .all
        didLoadDraft = true
    }

    private func saveDraft() {
        guard didLoadDraft else { return }
        progressStore.saveQuizDraft(
            StoredQuizDraft(prompts: prompts, selections: selections, checkedSelections: checkedSelections,
                            result: latestResult, seed: attemptSeed, questionIndex: questionIndex),
            kind: resultKind, slug: resultSlug
        )
    }
}

private enum QuizReportFilter {
    case all
    case incorrect
}

private struct ResultCard: View {
    let result: StoredQuizResult

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: result.passed ? "checkmark.seal.fill" : "exclamationmark.triangle.fill")
                .foregroundStyle(result.passed ? .green : .orange)
            VStack(alignment: .leading, spacing: 4) {
                Text("Last attempt · \(result.correct)/\(result.total) correct · \(result.score)%")
                    .font(.headline)
                Text(result.passed ? "Passed" : "Score 75% or higher to complete this quiz.")
                    .foregroundStyle(.primary)
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background((result.passed ? Color.green : Color.orange).opacity(0.12), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
    }
}

private func quizTint(_ level: String) -> Color {
    switch level {
    case "Beginner":
        return .green
    case "Intermediate":
        return .blue
    case "Advanced":
        return .orange
    case "Expert":
        return .purple
    default:
        return .indigo
    }
}
