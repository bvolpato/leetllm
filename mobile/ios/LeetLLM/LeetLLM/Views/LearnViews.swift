import SwiftUI

enum LearnRoute: Codable, Hashable {
    case lesson(String)

    enum CodingKeys: String, CodingKey {
        case lesson
        case blog
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        if let slug = try container.decodeIfPresent(String.self, forKey: .lesson) {
            self = .lesson(slug)
        } else if let slug = try container.decodeIfPresent(String.self, forKey: .blog) {
            self = .lesson(slug)
        } else {
            throw DecodingError.dataCorrupted(DecodingError.Context(codingPath: decoder.codingPath, debugDescription: "Unknown route"))
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        switch self {
        case .lesson(let slug):
            try container.encode(slug, forKey: .lesson)
        }
    }
}

private enum LessonLibrary: String, CaseIterable, Identifiable {
    case all = "All lessons"
    case unread = "Unread"
    case saved = "Bookmarks"
    case notes = "With notes"
    case completed = "Read"
    var id: String { rawValue }
}

struct LearnView: View {
    @ObservedObject private var dataService = DataService.shared
    @ObservedObject private var progressStore = ProgressStore.shared
    @ObservedObject private var syncClient = PersistentSyncClient.shared
    @ObservedObject private var navigation = AppNavigation.shared
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass
    @State private var query = ""
    @State private var selection: LearnRoute? = LearnView.initialSelection()
    @State private var columnVisibility: NavigationSplitViewVisibility = .doubleColumn
    @State private var showFullList = false
    @State private var contentSearchMatches = ContentSearchMatches.empty
    @State private var isSearchingContent = false
    @State private var library: LessonLibrary = .all

    @State private var navigationPath = NavigationPath()
    @State private var didInitialize = false

    private static func initialSelection() -> LearnRoute? {
        let arguments = ProcessInfo.processInfo.arguments
        if let index = arguments.firstIndex(of: "--initial-route") {
            let valIndex = arguments.index(after: index)
            if valIndex < arguments.endIndex {
                let route = arguments[valIndex]
                let query = {
                    if let qIndex = arguments.firstIndex(of: "--initial-query") {
                        let qValIndex = arguments.index(after: qIndex)
                        if qValIndex < arguments.endIndex {
                            return arguments[qValIndex]
                        }
                    }
                    return ""
                }()
                
                if (route == "lesson" || route == "blog") && !query.isEmpty {
                    return .lesson(query)
                }
            }
        }
        return nil
    }

    var body: some View {
        Group {
            #if targetEnvironment(macCatalyst)
            MacSplitView(sidebarWidth: 315) {
                VStack(spacing: 0) {
                    MacSidebarSearchBar(text: $query, placeholder: "Search lessons and concepts")
                    List {
                        listContent
                    }
                    .listStyle(.sidebar)
                    .scrollContentBackground(.hidden)
                }
            } detail: {
                selectedDetail
            }
            #else
            if horizontalSizeClass == .regular {
                if showFullList {
                    NavigationStack {
                        fullPageLearnList
                            .navigationTitle("Learn")
                            .navigationBarTitleDisplayMode(.inline)
                            .navigationDestination(for: LearnRoute.self) { route in
                                detail(for: route)
                            }
                    }
                } else {
                    NavigationSplitView(columnVisibility: $columnVisibility) {
                        learnList
                            .navigationTitle("Learn")
                            .navigationBarTitleDisplayMode(.inline)
                            .navigationSplitViewColumnWidth(min: 240, ideal: 285, max: 340)
                    } detail: {
                        selectedDetail
                    }
                }
            } else {
                NavigationStack(path: $navigationPath) {
                    learnList
                        .navigationTitle(horizontalSizeClass == .regular ? "Learn" : "")
                        .navigationBarTitleDisplayMode(.inline)
                        .navigationDestination(for: LearnRoute.self) { route in
                            detail(for: route)
                        }
                }
            }
            #endif
        }
        .onAppear {
            if let route = navigation.learnRoute {
                openRoute(route)
                navigation.learnRoute = nil
            }
            guard !didInitialize else { return }
            didInitialize = true
            if let initial = Self.initialSelection() {
                selection = initial
                if horizontalSizeClass != .regular {
                    navigationPath = NavigationPath([initial])
                }
            } else if selection == nil {
                if let lastRoute = progressStore.lastViewedRoute {
                    selection = lastRoute
                } else if let first = dataService.lessons.first {
                    selection = .lesson(first.slug)
                }
            }
        }
        .task(id: "\(query):\(dataService.privateContentVersion)") {
            let normalized = query.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
            guard normalized.count >= 2 else {
                contentSearchMatches = .empty
                isSearchingContent = false
                return
            }
            contentSearchMatches = .empty
            isSearchingContent = true
            defer {
                if query.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() == normalized {
                    isSearchingContent = false
                }
            }
            try? await Task.sleep(for: .milliseconds(250))
            guard !Task.isCancelled else { return }
            let matches = await dataService.contentSearchMatches(normalizedQuery: normalized)
            guard !Task.isCancelled else { return }
            contentSearchMatches = matches
        }
        .onChange(of: navigation.learnRoute) { _, route in
            guard let route else { return }
            openRoute(route)
            navigation.learnRoute = nil
        }
        .onReceive(NotificationCenter.default.publisher(for: Notification.Name("LearnTabTapped"))) { _ in
            showFullList = false
            columnVisibility = .doubleColumn
        }
        .onReceive(NotificationCenter.default.publisher(for: Notification.Name("LearnTabDoubleTapped"))) { _ in
            if horizontalSizeClass == .regular {
                showFullList = false
                columnVisibility = .doubleColumn
            } else {
                navigationPath = NavigationPath()
            }
        }
    }

    @ViewBuilder
    private var learnList: some View {
        if horizontalSizeClass == .regular {
            List(selection: $selection) {
                listContent
            }
            .listStyle(.sidebar)
            .searchable(text: $query, placement: .navigationBarDrawer(displayMode: .always), prompt: "Search lessons and concepts")
            .scrollDismissesKeyboard(.interactively)
        } else {
            List {
                listContent
            }
            .listStyle(.insetGrouped)
            .searchable(text: $query, prompt: "Search lessons and concepts")
            .scrollDismissesKeyboard(.interactively)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Menu {
                        Picker("Library", selection: $library) {
                            ForEach(LessonLibrary.allCases) { item in
                                Text(item.rawValue).tag(item)
                            }
                        }
                    } label: {
                        Image(systemName: library == .all ? "line.3.horizontal.decrease.circle" : "line.3.horizontal.decrease.circle.fill")
                            .accessibilityLabel("Filter library")
                    }
                    .accessibilityIdentifier("lesson-library")
                }
            }
        }
    }

    @ViewBuilder
    private var listContent: some View {
        if library == .all, query.isEmpty {
            learningHome
        }
        if shouldShowResumeCard, let lastRoute = progressStore.lastViewedRoute {
            resumeSection(for: lastRoute)
        }

        if horizontalSizeClass == .regular {
            searchSection
        }
        lessonSections
    }

    private func resumeSection(for route: LearnRoute) -> some View {
        Section("Resume Reading") {
            Button {
                triggerResume(route)
            } label: {
                HStack(spacing: 10) {
                    Image(systemName: "play.circle.fill")
                        .font(horizontalSizeClass == .regular ? .body : .title2)
                        .foregroundStyle(.indigo)
                    
                    VStack(alignment: .leading, spacing: 2) {
                        Text(title(for: route))
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(.primary)
                            .lineLimit(1)
                        Text(subtitle(for: route))
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                    
                    Spacer()
                    
                    if horizontalSizeClass == .regular {
                        Image(systemName: "arrow.right")
                            .font(.caption)
                            .foregroundStyle(.tertiary)
                    } else {
                        Button("Resume") {
                            triggerResume(route)
                        }
                        .buttonStyle(.borderedProminent)
                        .tint(.indigo)
                        .controlSize(.small)
                    }
                }
                .padding(.vertical, 2)
            }
            .buttonStyle(.plain)
        }
    }

    private var fullPageLearnList: some View {
        List {
            if shouldShowResumeCard, let lastRoute = progressStore.lastViewedRoute {
                resumeSection(for: lastRoute)
            }

            if horizontalSizeClass == .regular {
                searchSection
            }

            let lessons = filteredLessons
            ForEach(groupedSections(lessons), id: \.0) { section, items in
                Section(section) {
                    ForEach(items) { lesson in
                        Button {
                            showFullList = false
                            selection = .lesson(lesson.slug)
                            columnVisibility = .doubleColumn
                        } label: {
                            HStack {
                                LessonRow(
                                    lesson: lesson,
                                    isRead: progressStore.isRead(lesson.slug),
                                    searchQuery: query,
                                    contentSnippet: contentSearchMatches.lessonSnippets[lesson.slug],
                                    isCompact: false
                                )
                                Spacer()
                                Image(systemName: "chevron.right")
                                    .font(.caption)
                                    .foregroundStyle(.tertiary)
                            }
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
        .listStyle(.insetGrouped)
    }

    private var searchSection: some View {
        Section {
            Picker("Library", selection: $library) {
                ForEach(LessonLibrary.allCases) { item in
                    Text(item.rawValue).tag(item)
                }
            }
            .accessibilityIdentifier("lesson-library")

            Text("\(filteredLessons.count) \(filteredLessons.count == 1 ? "lesson" : "lessons") available offline")
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
    }

    private var learningHome: some View {
        Section {
            VStack(alignment: .leading, spacing: 6) {
                HStack(spacing: 8) {
                    ProgressView(value: Double(completedLessonCount), total: Double(max(dataService.lessons.count, 1)))
                        .tint(.indigo)
                    Text("\(completedLessonCount)/\(dataService.lessons.count)")
                        .font(.caption2.monospacedDigit().weight(.medium))
                        .foregroundStyle(.secondary)
                }

                if let lesson = nextLesson {
                    Button {
                        openRoute(.lesson(lesson.slug))
                    } label: {
                        HStack(spacing: 6) {
                            Image(systemName: "play.circle.fill")
                                .foregroundStyle(.indigo)
                                .font(.caption)
                            Text(completedLessonCount == 0 ? "Start:" : "Next:")
                                .font(.caption2.bold())
                                .foregroundStyle(.secondary)
                            Text(lesson.title)
                                .font(.caption.weight(.medium))
                                .foregroundStyle(.primary)
                                .lineLimit(1)
                                .truncationMode(.tail)
                            Spacer()
                        }
                    }
                    .buttonStyle(.plain)
                    .accessibilityIdentifier("continue-learning")
                } else {
                    Text("You have read every lesson. Practice what you learned or revisit your bookmarks.")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }

                Button {
                    NotificationCenter.default.post(name: Notification.Name("OpenLearningPlan"), object: nil)
                } label: {
                    Label(progressStore.learningPlanSelection == nil ? "Build a personal plan" : "Open learning plan", systemImage: "calendar")
                        .font(.caption2)
                        .lineLimit(1)
                        .truncationMode(.tail)
                }
                .buttonStyle(.plain)
                .foregroundStyle(.indigo)
            }
            .padding(.vertical, 2)
        }
    }

    private var completedLessonCount: Int {
        dataService.lessons.filter { progressStore.isRead($0.slug) }.count
    }

    private var nextLesson: LessonIndexItem? {
        if let selection = progressStore.learningPlanSelection,
           let configuration = dataService.learningPlanConfiguration,
           let plan = LearningPlanBuilder.build(tracks: dataService.tracks, configuration: configuration, selection: selection),
           let next = plan.lessons.first(where: { !progressStore.isRead($0.slug) }) {
            return dataService.lessonIndex(slug: next.slug)
        }
        return dataService.lessons.first { !progressStore.isRead($0.slug) }
    }

    @ViewBuilder
    private var lessonSections: some View {
        let lessons = filteredLessons
        if lessons.isEmpty {
            searchStatus
        } else {
            ForEach(groupedSections(lessons), id: \.0) { section, items in
                Section {
                    ForEach(items) { lesson in
                        #if targetEnvironment(macCatalyst)
                        Button {
                            selection = .lesson(lesson.slug)
                        } label: {
                            LessonRow(
                                lesson: lesson,
                                isRead: progressStore.isRead(lesson.slug),
                                isSelected: selection == .lesson(lesson.slug),
                                searchQuery: query,
                                contentSnippet: contentSearchMatches.lessonSnippets[lesson.slug],
                                isCompact: true
                            )
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)
                        .listRowBackground(macSidebarRowBackground(isSelected: selection == .lesson(lesson.slug)))
                        #else
                        NavigationLink(value: LearnRoute.lesson(lesson.slug)) {
                            LessonRow(
                                lesson: lesson,
                                isRead: progressStore.isRead(lesson.slug),
                                isSelected: selection == .lesson(lesson.slug),
                                searchQuery: query,
                                contentSnippet: contentSearchMatches.lessonSnippets[lesson.slug],
                                isCompact: true
                            )
                        }
                        #endif
                    }
                } header: {
                    HStack {
                        Text(section)
                        Spacer()
                        let readCount = items.filter { progressStore.isRead($0.slug) }.count
                        if readCount > 0 {
                            Text("\(readCount)/\(items.count)")
                                .font(.caption2.monospacedDigit())
                                .foregroundStyle(readCount == items.count ? .green : .secondary)
                        }
                    }
                }
            }
        }
    }

    @ViewBuilder
    private var searchStatus: some View {
        Section {
            if isSearchingContent {
                ProgressView("Searching article text...")
            } else {
                if query.isEmpty, library != .all {
                    ContentUnavailableView {
                        Label("No \(library.rawValue.lowercased()) lessons", systemImage: library == .saved ? "bookmark" : "book.closed")
                    } description: {
                        Text("Use the reader to mark lessons read, add bookmarks, or write notes.")
                    } actions: {
                        Button("Show all lessons") { library = .all }
                    }
                } else {
                    ContentUnavailableView {
                        Label("No Results", systemImage: "magnifyingglass")
                    } description: {
                        Text("Try another word or clear the search to see your library.")
                    } actions: {
                        Button("Clear search") { query = "" }
                    }
                }
            }
        }
    }

    private var filteredLessons: [LessonIndexItem] {
        let normalized = query.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        let lessons = dataService.lessons.filter { lesson in
            switch library {
            case .all: return true
            case .unread: return !progressStore.isRead(lesson.slug)
            case .saved: return progressStore.isBookmarked(lesson.slug)
            case .notes: return !progressStore.note(for: lesson.slug).isEmpty
            case .completed: return progressStore.isRead(lesson.slug)
            }
        }
        guard !normalized.isEmpty else { return lessons }
        return lessons.filter { lesson in
            let inMetadata = [
                lesson.title,
                lesson.section,
                lesson.category,
                lesson.difficulty,
                lesson.shortDescription,
                lesson.keyConceptsTested.joined(separator: " "),
            ].joined(separator: " ").lowercased().contains(normalized)
            
            if inMetadata { return true }
            return contentSearchMatches.lessonSnippets[lesson.slug] != nil
        }
    }

    private func groupedSections(_ lessons: [LessonIndexItem]) -> [(String, [LessonIndexItem])] {
        var result: [(String, [LessonIndexItem])] = []
        for lesson in lessons {
            if let last = result.indices.last, result[last].0 == lesson.section {
                result[last].1.append(lesson)
            } else {
                result.append((lesson.section, [lesson]))
            }
        }
        return result
    }

    @ViewBuilder
    private var selectedDetail: some View {
        if let selection {
            detail(for: selection)
        } else if let first = dataService.lessons.first {
            LessonDetailView(slug: first.slug)
        } else {
            EmptyStateView(title: "No Content", message: "Bundled lessons are unavailable.", systemImage: "book.closed")
        }
    }

    @ViewBuilder
    private func detail(for route: LearnRoute) -> some View {
        switch route {
        case .lesson(let slug):
            LessonDetailView(slug: slug)
                .id(slug)
        }
    }

    private var shouldShowResumeCard: Bool {
        guard query.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
              library == .all else { return false }
        if let lastRoute = progressStore.lastViewedRoute {
            if horizontalSizeClass == .regular {
                return selection != lastRoute
            }
            return true
        }
        return false
    }

    private func triggerResume(_ route: LearnRoute) {
        openRoute(route)
    }

    private func openRoute(_ route: LearnRoute) {
        didInitialize = true
        if horizontalSizeClass == .regular {
            showFullList = false
            selection = route
            columnVisibility = .doubleColumn
        } else {
            navigationPath = NavigationPath([route])
        }
    }

    private func title(for route: LearnRoute) -> String {
        switch route {
        case .lesson(let slug):
            return dataService.lessons.first { $0.slug == slug }?.title ?? "Lesson"
        }
    }

    private func subtitle(for route: LearnRoute) -> String {
        switch route {
        case .lesson(let slug):
            if let lesson = dataService.lessons.first(where: { $0.slug == slug }) {
                return "\(lesson.category) • \(lesson.timeEstimate)m read"
            }
            return "Lesson"
        }
    }
}

private struct LessonRow: View {
    let lesson: LessonIndexItem
    let isRead: Bool
    var isSelected = false
    var searchQuery: String = ""
    var contentSnippet: String? = nil
    var isCompact: Bool = false
    @ObservedObject private var progressStore = ProgressStore.shared

    private var searchSnippet: AttributedString? {
        let normalized = searchQuery.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard !normalized.isEmpty else { return nil }
        
        let inTitle = lesson.title.lowercased().contains(normalized)
        let inDesc = lesson.shortDescription.lowercased().contains(normalized)
        if inTitle || inDesc { return nil }
        
        guard let contentSnippet else { return nil }
        return makeSearchSnippet(content: contentSnippet, query: normalized)
    }

    var body: some View {
        if isCompact {
            HStack(alignment: .center, spacing: 10) {
                Image(systemName: isRead ? "checkmark.circle.fill" : "circle")
                    .font(.subheadline)
                    .foregroundStyle(isRead ? Color.green : Color.secondary.opacity(0.6))
                    .frame(width: 18)

                VStack(alignment: .leading, spacing: 3) {
                    HStack(alignment: .firstTextBaseline, spacing: 6) {
                        Text(lesson.title)
                            .font(.subheadline.weight(.medium))
                            .lineLimit(2)
                            .foregroundStyle(.primary)

                        if progressStore.isBookmarked(lesson.slug) {
                            Image(systemName: "bookmark.fill")
                                .font(.caption2)
                                .foregroundStyle(.yellow)
                        }
                    }

                    if let searchSnippet {
                        HStack(alignment: .top, spacing: 4) {
                            Image(systemName: "magnifyingglass")
                                .font(.caption2)
                                .foregroundStyle(.indigo)
                                .padding(.top, 1)
                            Text(searchSnippet)
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                                .lineLimit(2)
                        }
                        .padding(4)
                        .background(Color.primary.opacity(0.04), in: RoundedRectangle(cornerRadius: 4))
                    } else {
                        HStack(spacing: 6) {
                            Text("\(lesson.timeEstimate)m")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                            Text("•")
                                .font(.caption2)
                                .foregroundStyle(.tertiary)
                            Text(lesson.difficulty)
                                .font(.caption2.weight(.medium))
                                .foregroundStyle(difficultyTint(lesson.difficulty))
                        }
                    }
                }

                Spacer(minLength: 0)
            }
            .padding(.vertical, 3)
            .accessibilityElement(children: .combine)
            .accessibilityValue(isRead ? "Read" : "Unread")
        } else {
            HStack(alignment: .top, spacing: 12) {
                Image(systemName: isRead ? "checkmark.circle.fill" : "circle")
                    .foregroundStyle(isRead ? Color.green : Color.secondary)
                    .padding(.top, 3)

                VStack(alignment: .leading, spacing: 7) {
                    HStack(alignment: .top) {
                        Text(lesson.title)
                            .font(.headline)
                            .foregroundStyle(.primary)
                            .lineLimit(2)
                        if progressStore.isBookmarked(lesson.slug) {
                            Spacer()
                            Image(systemName: "bookmark.fill")
                                .foregroundStyle(.yellow)
                                .font(.subheadline)
                        }
                    }
                    Text(lesson.shortDescription)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .lineLimit(3)

                    if let searchSnippet {
                        HStack(alignment: .top, spacing: 4) {
                            Image(systemName: "magnifyingglass")
                                .font(.caption)
                                .foregroundStyle(.indigo)
                                .padding(.top, 2)
                            Text(searchSnippet)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                                .lineLimit(2)
                        }
                        .padding(6)
                        .background(Color.primary.opacity(0.04), in: RoundedRectangle(cornerRadius: 6))
                    }

                    HStack {
                        StatusPill(lesson.difficulty, tint: difficultyTint(lesson.difficulty))
                        StatusPill("\(lesson.timeEstimate)m", systemImage: "clock", tint: .secondary)
                    }
                }
            }
            .padding(.vertical, 4)
            .accessibilityElement(children: .combine)
            .accessibilityValue(isRead ? "Read" : "Unread")
        }
    }
}

private func makeSearchSnippet(content: String, query: String) -> AttributedString? {
    let cleanContent = content
        .replacingOccurrences(of: "\n", with: " ")
        .replacingOccurrences(of: "\r", with: " ")
        .replacingOccurrences(of: "#", with: "")
        .replacingOccurrences(of: "*", with: "")
        .replacingOccurrences(of: "`", with: "")
        .replacingOccurrences(of: "_", with: "")
        .replacingOccurrences(of: ">", with: "")
        .replacingOccurrences(of: "[", with: "")
        .replacingOccurrences(of: "]", with: "")
        .replacingOccurrences(of: "(", with: "")
        .replacingOccurrences(of: ")", with: "")

    guard let range = cleanContent.range(of: query, options: .caseInsensitive) else {
        return nil
    }

    let matchStart = range.lowerBound
    let matchEnd = range.upperBound
    let startOffset = cleanContent.distance(from: cleanContent.startIndex, to: matchStart)
    let endOffset = cleanContent.distance(from: cleanContent.startIndex, to: matchEnd)
    let prefixLength = min(startOffset, 60)
    let suffixLength = min(cleanContent.count - endOffset, 60)
    let startIndex = cleanContent.index(matchStart, offsetBy: -prefixLength)
    let endIndex = cleanContent.index(matchEnd, offsetBy: suffixLength)
    let rawSnippet = String(cleanContent[startIndex..<endIndex]).trimmingCharacters(in: .whitespacesAndNewlines)
    let prefixDot = startOffset > 60 ? "..." : ""
    let suffixDot = (cleanContent.count - endOffset) > 60 ? "..." : ""
    let finalString = "\(prefixDot)\(rawSnippet)\(suffixDot)"

    var attr = AttributedString(finalString)
    if let matchRange = finalString.range(of: query, options: .caseInsensitive),
       let attributedRange = Range(matchRange, in: attr) {
        attr[attributedRange].backgroundColor = .yellow.opacity(0.3)
        attr[attributedRange].font = .subheadline.bold()
        attr[attributedRange].foregroundColor = .primary
    }
    return attr
}

struct LessonDetailView: View {
    let slug: String
    @ObservedObject private var dataService = DataService.shared
    @ObservedObject private var progressStore = ProgressStore.shared
    @ObservedObject private var readerSettings = ReaderSettings.shared
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    @State private var noteDraft = ""
    @State private var isReaderSettingsPresented = false
    @State private var scrollPositionID: String? = nil
    @State private var showingContents = false
    @State private var showingNotes = false
    @State private var didRestorePosition = false

    var body: some View {
        Group {
            if let lesson = dataService.lesson(slug: slug) {
                ScrollView {
                    LazyVStack(alignment: .leading, spacing: 14) {
                        VStack(alignment: .leading, spacing: 10) {
                            ViewThatFits(in: .horizontal) {
                                HStack(alignment: .center, spacing: 8) {
                                    HStack(spacing: 6) {
                                        StatusPill(lesson.difficulty, tint: difficultyTint(lesson.difficulty))
                                        StatusPill(lesson.section, tint: .indigo)
                                        StatusPill("\(lesson.timeEstimate)m", systemImage: "clock", tint: .secondary)
                                    }
                                    Spacer(minLength: 12)
                                    HStack(spacing: 8) {
                                        lessonActions(lesson)
                                    }
                                }
                                VStack(alignment: .leading, spacing: 8) {
                                    HStack(spacing: 6) {
                                        StatusPill(lesson.difficulty, tint: difficultyTint(lesson.difficulty))
                                        StatusPill(lesson.section, tint: .indigo)
                                        StatusPill("\(lesson.timeEstimate)m", systemImage: "clock", tint: .secondary)
                                    }
                                    HStack(spacing: 8) {
                                        lessonActions(lesson)
                                    }
                                }
                            }

                            ContentTitle(lesson.title)
                                .textSelection(.enabled)

                            Text(lesson.shortDescription)
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                                .textSelection(.enabled)
                        }
                        .id("header")

                        ThemedBundleImage(image: lesson)
                            .id("cover")

                        MarkdownContentView(
                            markdown: lesson.content,
                            excludePaths: [lesson.coverImage, lesson.coverImageLight, lesson.coverImageDark].compactMap { $0 },
                            scrollPrefix: "lesson"
                        )

                        if let mastery = lesson.masteryQuiz, !mastery.isEmpty {
                            Divider()
                            QuizRunnerView(
                                title: "Mastery Check",
                                subtitle: "\(mastery.count) questions",
                                prompts: mastery.enumerated().map { QuizPrompt(id: $0.offset, question: $0.element) },
                                resultKind: .mastery,
                                resultSlug: lesson.slug
                            )
                            .id("mastery")
                        }

                        navigationButtons(for: lesson)
                            .id("navigation")

                        LessonNotesView(slug: lesson.slug, noteDraft: $noteDraft)
                            .id("notes")

                        ReferenceListView(references: lesson.references)
                            .id("references")
                    }
                    .padding(.horizontal, 24)
                    .padding(.vertical, 20)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .scrollTargetLayout()
                }
                .id(slug)
                .scrollPosition(id: $scrollPositionID)
                #if !targetEnvironment(macCatalyst)
                .navigationTitle(scrollPositionID == nil || scrollPositionID == "header" ? "" : lesson.title)
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .topBarTrailing) {
                        Menu {
                            Button("Contents", systemImage: "list.bullet") { showingContents = true }
                            Button("Notes", systemImage: "note.text") { showingNotes = true }
                            if !(lesson.masteryQuiz ?? []).isEmpty {
                                Button("Mastery check", systemImage: "checkmark.seal") { scrollPositionID = "mastery" }
                            }
                            Button("Back to top", systemImage: "arrow.up.to.line") { scrollPositionID = "header" }
                            ShareLink(item: URL(string: "https://leetllm.com/learn/\(lesson.slug)")!)
                        } label: {
                            Image(systemName: "ellipsis.circle")
                        }
                        .accessibilityLabel("Lesson actions")
                    }
                    ToolbarItem(placement: .topBarTrailing) {
                        Button {
                            isReaderSettingsPresented = true
                        } label: {
                            Image(systemName: "textformat.size")
                        }
                        .accessibilityLabel("Reader settings")
                    }
                    ToolbarItem(placement: .topBarTrailing) {
                        LeetyLauncher(pathname: "/learn/\(lesson.slug)", title: lesson.title, compact: true)
                    }
                }
                #endif
                .sheet(isPresented: $isReaderSettingsPresented) {
                    ReaderSettingsView()
                        .environmentObject(readerSettings)
                        .presentationDetents([.medium, .large])
                        .presentationDragIndicator(.visible)
                }
                .sheet(isPresented: $showingContents) {
                    ReaderContentsView(markdown: lesson.content, prefix: "lesson") { anchor in
                        scrollPositionID = anchor
                    }
                }
                .sheet(isPresented: $showingNotes) {
                    NavigationStack {
                        LessonNoteEditor(slug: lesson.slug, noteDraft: $noteDraft)
                            .padding()
                            .navigationTitle("Lesson notes")
                            .navigationBarTitleDisplayMode(.inline)
                            .toolbar {
                                ToolbarItem(placement: .confirmationAction) {
                                    Button {
                                        showingNotes = false
                                    } label: {
                                        #if targetEnvironment(macCatalyst)
                                        Image(systemName: "xmark.circle.fill")
                                            .symbolRenderingMode(.hierarchical)
                                            .font(.title3)
                                            .foregroundStyle(.secondary)
                                        #else
                                        Text("Done")
                                        #endif
                                    }
                                    .accessibilityLabel("Done")
                                }
                            }
                    }
                    .environmentObject(progressStore)
                }
                .onChange(of: scrollPositionID) { _, newVal in
                    if let newVal {
                        progressStore.saveScrollPosition(newVal, for: lesson.slug)
                    }
                }
                .onDisappear {
                    progressStore.flushPendingScrollPosition()
                }
                .onAppear {
                    guard !didRestorePosition else { return }
                    didRestorePosition = true
                    noteDraft = progressStore.note(for: lesson.slug)
                    progressStore.trackViewedRoute(.lesson(lesson.slug))
                    
                    scrollPositionID = progressStore.scrollPosition(for: lesson.slug)
                }
            } else {
                EmptyStateView(title: "Lesson Missing", message: slug, systemImage: "exclamationmark.triangle")
            }
        }
    }

    @ViewBuilder
    private func lessonActions(_ lesson: LessonDetail) -> some View {
        let isRead = progressStore.isRead(lesson.slug)
        let isBookmarked = progressStore.isBookmarked(lesson.slug)

        if isRead {
            Button {
                progressStore.markRead(lesson.slug, read: false)
            } label: {
                Label("Read", systemImage: "checkmark.circle.fill")
                    .font(.caption.weight(.medium))
            }
            .buttonStyle(.borderedProminent)
            .tint(.green)
            .controlSize(.small)
            .accessibilityIdentifier("lesson-mark-read")
        } else {
            Button {
                progressStore.markRead(lesson.slug, read: true)
            } label: {
                Label("Mark Read", systemImage: "circle")
                    .font(.caption.weight(.medium))
            }
            .buttonStyle(.bordered)
            .tint(.indigo)
            .controlSize(.small)
            .accessibilityIdentifier("lesson-mark-read")
        }

        if isBookmarked {
            Button {
                progressStore.toggleBookmark(lesson.slug)
            } label: {
                Label("Bookmarked", systemImage: "bookmark.fill")
                    .font(.caption.weight(.medium))
            }
            .buttonStyle(.borderedProminent)
            .tint(.orange)
            .controlSize(.small)
            .accessibilityIdentifier("lesson-bookmark")
        } else {
            Button {
                progressStore.toggleBookmark(lesson.slug)
            } label: {
                Label("Bookmark", systemImage: "bookmark")
                    .font(.caption.weight(.medium))
            }
            .buttonStyle(.bordered)
            .tint(.secondary)
            .controlSize(.small)
            .accessibilityIdentifier("lesson-bookmark")
        }

        #if targetEnvironment(macCatalyst)
        Button {
            showingContents = true
        } label: {
            Label("Contents", systemImage: "list.bullet")
                .font(.caption.weight(.medium))
        }
        .buttonStyle(.bordered)
        .tint(.secondary)
        .controlSize(.small)
        .accessibilityLabel("Contents")

        Button {
            showingNotes = true
        } label: {
            Label("Notes", systemImage: "note.text")
                .font(.caption.weight(.medium))
        }
        .buttonStyle(.bordered)
        .tint(.secondary)
        .controlSize(.small)
        .accessibilityLabel("Notes")

        LeetyLauncher(pathname: "/learn/\(lesson.slug)", title: lesson.title, compact: true)
        #endif
    }

    @ViewBuilder
    private func navigationButtons(for lesson: LessonDetail) -> some View {
        HStack(spacing: 16) {
            if let prevSlug = lesson.previousSlug, let prev = dataService.lessons.first(where: { $0.slug == prevSlug }) {
                Button {
                    NotificationCenter.default.post(name: Notification.Name("NavigateToRoute"), object: LearnRoute.lesson(prev.slug))
                } label: {
                    HStack(spacing: 8) {
                        Image(systemName: "chevron.left")
                            .font(.subheadline.bold())
                            .foregroundStyle(.indigo)
                        
                        VStack(alignment: .leading, spacing: 4) {
                            Text("PREVIOUS")
                                .font(.caption2.bold())
                                .foregroundStyle(.secondary)
                            Text(prev.title)
                                .font(.subheadline.bold())
                                .fixedSize(horizontal: false, vertical: true)
                                .foregroundStyle(.primary)
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding()
                    .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 10))
                    .overlay(RoundedRectangle(cornerRadius: 10).stroke(.quaternary, lineWidth: 1))
                }
                .buttonStyle(.plain)
            } else {
                Spacer()
            }
            
            if let nextSlug = lesson.nextSlug, let next = dataService.lessons.first(where: { $0.slug == nextSlug }) {
                Button {
                    NotificationCenter.default.post(name: Notification.Name("NavigateToRoute"), object: LearnRoute.lesson(next.slug))
                } label: {
                    HStack(spacing: 8) {
                        VStack(alignment: .trailing, spacing: 4) {
                            Text("NEXT")
                                .font(.caption2.bold())
                                .foregroundStyle(.secondary)
                            Text(next.title)
                                .font(.subheadline.bold())
                                .fixedSize(horizontal: false, vertical: true)
                                .foregroundStyle(.primary)
                        }
                        
                        Image(systemName: "chevron.right")
                            .font(.subheadline.bold())
                            .foregroundStyle(.indigo)
                    }
                    .frame(maxWidth: .infinity, alignment: .trailing)
                    .padding()
                    .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 10))
                    .overlay(RoundedRectangle(cornerRadius: 10).stroke(.quaternary, lineWidth: 1))
                }
                .buttonStyle(.plain)
            } else {
                Spacer()
            }
        }
        .padding(.vertical, 12)
    }
}



private struct LessonNotesView: View {
    let slug: String
    @Binding var noteDraft: String
    @ObservedObject private var progressStore = ProgressStore.shared

    var body: some View {
        DisclosureGroup {
            LessonNoteEditor(slug: slug, noteDraft: $noteDraft)
                .padding(.top, 8)
        } label: {
            Label("Notes", systemImage: "note.text")
                .font(.headline)
        }
    }
}

private struct LessonNoteEditor: View {
    let slug: String
    @Binding var noteDraft: String
    @ObservedObject private var progressStore = ProgressStore.shared
    @FocusState private var isFocused: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Write a summary, a question, or an idea to revisit.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
            TextEditor(text: $noteDraft)
                .focused($isFocused)
                .accessibilityLabel("Lesson notes")
                .accessibilityIdentifier("lesson-note-editor")
                .frame(minHeight: 180)
                .scrollContentBackground(.hidden)
                .padding(8)
                .background(Color(uiColor: .secondarySystemBackground), in: RoundedRectangle(cornerRadius: 10))
                .onChange(of: noteDraft) { _, text in
                    progressStore.saveNote(text, for: slug)
                }
            Label("Saved automatically on this device", systemImage: "checkmark.circle")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .toolbar {
            ToolbarItemGroup(placement: .keyboard) {
                Spacer()
                Button("Done") { isFocused = false }
            }
        }
    }
}

struct ReferenceListView: View {
    let references: [ReferenceRecord]
    @Environment(\.openURL) private var openURL

    var body: some View {
        if !references.isEmpty {
            VStack(alignment: .leading, spacing: 12) {
                Text("References")
                    .font(.title2.bold())
                ForEach(references) { reference in
                    Menu {
                        Button {
                            if let url = URL(string: reference.url) {
                                openURL(url)
                            }
                        } label: {
                            Label("Open in Browser", systemImage: "safari")
                        }

                        Button {
                            UIPasteboard.general.string = reference.url
                        } label: {
                            Label("Copy Link", systemImage: "doc.on.doc")
                        }

                        if let url = URL(string: reference.url) {
                            ShareLink(item: url) {
                                Label("Share Link...", systemImage: "square.and.arrow.up")
                            }
                        }
                    } label: {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(reference.title)
                                .font(.headline)
                                .multilineTextAlignment(.leading)
                            Text([reference.authors, String(reference.year), reference.venue].compactMap { $0 }.joined(separator: " · "))
                                .font(.caption)
                                .foregroundStyle(.secondary)
                                .multilineTextAlignment(.leading)
                            Text(reference.url)
                                .font(.caption)
                                .foregroundStyle(.indigo)
                                .lineLimit(2)
                                .multilineTextAlignment(.leading)
                        }
                        .padding(12)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }
}

func difficultyTint(_ difficulty: String) -> Color {
    switch difficulty {
    case "Easy":
        return .green
    case "Medium":
        return .orange
    case "Hard":
        return .red
    default:
        return .indigo
    }
}
