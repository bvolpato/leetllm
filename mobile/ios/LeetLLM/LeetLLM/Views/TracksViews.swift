import SwiftUI

struct TracksView: View {
    @ObservedObject private var dataService = DataService.shared
    @ObservedObject private var progressStore = ProgressStore.shared
    @ObservedObject private var navigation = AppNavigation.shared
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass
    @State private var selectedSlug: String?
    @State private var showingLearningPlan = false

    var body: some View {
        Group {
            #if targetEnvironment(macCatalyst)
            MacSplitView(sidebarWidth: 310) {
                List {
                    trackListContent(withSimultaneousGesture: true)
                }
                .listStyle(.sidebar)
                .scrollContentBackground(.hidden)
            } detail: {
                if let track = selectedTrack ?? dataService.tracks.first {
                    TrackDetailView(track: track)
                        .id(track.slug)
                } else {
                    EmptyStateView(title: "No Tracks", message: "Bundled tracks are unavailable.", systemImage: "map")
                }
            }
            #else
            if horizontalSizeClass == .regular {
                NavigationSplitView {
                    trackList
                        .navigationTitle("Tracks")
                        .navigationBarTitleDisplayMode(.inline)
                        .navigationSplitViewColumnWidth(min: 240, ideal: 285, max: 340)
                } detail: {
                    if let track = selectedTrack ?? dataService.tracks.first {
                        TrackDetailView(track: track)
                            .id(track.slug)
                    } else {
                        EmptyStateView(title: "No Tracks", message: "Bundled tracks are unavailable.", systemImage: "map")
                    }
                }
            } else {
                NavigationStack {
                    trackList
                        .navigationTitle(horizontalSizeClass == .regular ? "Tracks" : "")
                        .navigationBarTitleDisplayMode(.inline)
                        .navigationDestination(for: String.self) { slug in
                            if let track = dataService.tracks.first(where: { $0.slug == slug }) {
                                TrackDetailView(track: track)
                            }
                        }
                }
            }
            #endif
        }
        .sheet(isPresented: $showingLearningPlan) {
            LearningPlanSheet()
                .environmentObject(dataService)
                .environmentObject(progressStore)
        }
        .onChange(of: navigation.openPlan) { _, open in
            if open {
                showingLearningPlan = true
                navigation.openPlan = false
            }
        }
        .onChange(of: selectedSlug) { _, slug in
            if let slug { navigation.selectedTrackSlug = slug }
        }
        .onAppear {
            if navigation.openPlan {
                showingLearningPlan = true
                navigation.openPlan = false
            }
            if horizontalSizeClass == .regular, selectedSlug == nil {
                selectedSlug = navigation.selectedTrackSlug ?? dataService.tracks.first?.slug
            }
        }
    }

    private var selectedTrack: LearningTrack? {
        guard let selectedSlug else { return nil }
        return dataService.tracks.first { $0.slug == selectedSlug }
    }

    @ViewBuilder
    private var trackList: some View {
        if horizontalSizeClass == .regular {
            List(selection: $selectedSlug) {
                trackListContent(withSimultaneousGesture: true)
            }
            .listStyle(.sidebar)
        } else {
            List {
                trackListContent(withSimultaneousGesture: false)
            }
            .listStyle(.insetGrouped)
        }
    }

    @ViewBuilder
    private func trackListContent(withSimultaneousGesture: Bool) -> some View {
        Section("Your plan") {
            Button {
                showingLearningPlan = true
            } label: {
                if let selection = progressStore.learningPlanSelection,
                   let configuration = dataService.learningPlanConfiguration,
                   let plan = LearningPlanBuilder.build(
                       tracks: dataService.tracks,
                       configuration: configuration,
                       selection: selection
                   ) {
                    LearningPlanSummaryRow(plan: plan)
                } else {
                    HStack(spacing: 10) {
                        Image(systemName: "calendar.badge.plus")
                            .font(.title3)
                            .foregroundStyle(.indigo)
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Personal Learning Plan")
                                .font(.subheadline.weight(.semibold))
                                .foregroundStyle(.primary)
                            Text("Set study goals & pace")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                        Image(systemName: "chevron.right")
                            .font(.caption2)
                            .foregroundStyle(.tertiary)
                    }
                    .padding(.vertical, 3)
                }
            }
            .buttonStyle(.plain)
        }

        Section("Learning Tracks") {
            ForEach(dataService.tracks) { track in
                #if targetEnvironment(macCatalyst)
                Button {
                    selectedSlug = track.slug
                } label: {
                    TrackRow(track: track, isSelected: selectedSlug == track.slug)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .listRowBackground(macSidebarRowBackground(isSelected: selectedSlug == track.slug))
                #else
                if withSimultaneousGesture {
                    NavigationLink(value: track.slug) {
                        TrackRow(track: track, isSelected: selectedSlug == track.slug)
                    }
                    .simultaneousGesture(TapGesture().onEnded {
                        selectedSlug = track.slug
                    })
                } else {
                    NavigationLink(value: track.slug) {
                        TrackRow(track: track, isSelected: false)
                    }
                }
                #endif
            }
        }
    }
}

private struct LearningPlanSummaryRow: View {
    let plan: GeneratedLearningPlan
    @ObservedObject private var progressStore = ProgressStore.shared

    private var completedCount: Int {
        plan.lessons.filter { progressStore.isRead($0.slug) }.count
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Label(plan.track.title, systemImage: "calendar")
                    .font(.subheadline.weight(.semibold))
                    .lineLimit(1)
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
            }
            ProgressView(value: Double(completedCount), total: Double(max(plan.lessons.count, 1)))
                .tint(.indigo)
            HStack {
                StatusPill("\(plan.weeks.count) wks", systemImage: "calendar", tint: .indigo)
                Spacer()
                Text("\(completedCount)/\(plan.lessons.count) read")
                    .font(.caption2.monospacedDigit())
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 3)
    }
}

private struct TrackRow: View {
    let track: LearningTrack
    let isSelected: Bool
    @ObservedObject private var progressStore = ProgressStore.shared

    private var readCount: Int {
        track.lessonSlugs.filter { progressStore.isRead($0) }.count
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 5) {
            HStack(alignment: .center, spacing: 6) {
                Text(track.title)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.primary)
                    .lineLimit(1)
                Spacer(minLength: 4)
                StatusPill(
                    track.level,
                    tint: track.level == "Beginner" ? .green : track.level == "Intermediate" ? .blue : .purple
                )
            }
            Text(track.description)
                .font(.caption)
                .foregroundStyle(.secondary)
                .lineLimit(1)
            HStack(spacing: 8) {
                ProgressView(value: Double(readCount), total: Double(max(track.lessonSlugs.count, 1)))
                    .tint(.indigo)
                Text("\(readCount)/\(track.lessonSlugs.count)")
                    .font(.caption2.monospacedDigit())
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 3)
    }
}

struct TrackDetailView: View {
    let track: LearningTrack
    @ObservedObject private var dataService = DataService.shared
    @ObservedObject private var progressStore = ProgressStore.shared
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass
    @State private var showingPlan = false

    private var readCount: Int {
        track.lessonSlugs.filter { progressStore.isRead($0) }.count
    }

    var body: some View {
        Group {
            if horizontalSizeClass == .regular {
                ScrollView {
                    LazyVStack(alignment: .leading, spacing: 20) {
                        trackHeroCard
                        LazyVStack(alignment: .leading, spacing: 10) {
                            Text("LESSONS (\(track.lessons.count))")
                                .font(.caption.weight(.bold))
                                .foregroundStyle(.secondary)
                                .padding(.horizontal, 4)

                            ForEach(track.lessons) { lesson in
                                trackLessonCard(lesson)
                            }
                        }
                    }
                    .padding(.horizontal, 24)
                    .padding(.vertical, 20)
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
            } else {
                trackDetailListContent
                    .listStyle(.insetGrouped)
            }
        }
        #if !targetEnvironment(macCatalyst)
        .navigationTitle(horizontalSizeClass == .regular ? "" : track.title)
        .navigationBarTitleDisplayMode(.inline)
        #endif
        .sheet(isPresented: $showingPlan) {
            LearningPlanSheet(preferredTrackSlug: track.slug)
                .environmentObject(dataService)
                .environmentObject(progressStore)
        }
    }

    private var trackHeroCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 8) {
                StatusPill(track.level, tint: track.level == "Beginner" ? .green : track.level == "Intermediate" ? .blue : .purple)
                StatusPill(track.timeEstimate, systemImage: "clock", tint: .secondary)
                if !track.timeEstimate.lowercased().contains("lesson") {
                    StatusPill("\(track.lessonSlugs.count) lessons", systemImage: "book.pages", tint: .secondary)
                }
            }

            ContentTitle(track.title)

            Text(track.description)
                .font(.body)
                .foregroundStyle(.secondary)

            Divider()

            VStack(alignment: .leading, spacing: 8) {
                Label(track.audience, systemImage: "person.2.fill")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                Label(track.outcome, systemImage: "flag.checkered")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }

            VStack(alignment: .leading, spacing: 5) {
                ProgressView(value: Double(readCount), total: Double(max(track.lessonSlugs.count, 1)))
                    .tint(.indigo)
                HStack {
                    Text("\(readCount) of \(track.lessonSlugs.count) lessons read")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Spacer()
                    Text("\(Int((Double(readCount) / Double(max(track.lessonSlugs.count, 1))) * 100))%")
                        .font(.caption.monospacedDigit().weight(.semibold))
                        .foregroundStyle(.secondary)
                }
            }

            HStack(spacing: 12) {
                if let next = track.lessons.first(where: { !progressStore.isRead($0.slug) }) {
                    Button {
                        NotificationCenter.default.post(name: Notification.Name("NavigateToRoute"), object: LearnRoute.lesson(next.slug))
                    } label: {
                        Label(readCount == 0 ? "Start track" : "Continue track", systemImage: "play.fill")
                            .font(.subheadline.weight(.semibold))
                    }
                    .buttonStyle(.borderedProminent)
                    .controlSize(.regular)
                }

                Button {
                    showingPlan = true
                } label: {
                    Label("Plan this track", systemImage: "calendar.badge.plus")
                        .font(.subheadline.weight(.medium))
                }
                .buttonStyle(.bordered)
                .controlSize(.regular)
            }
        }
        .padding(20)
        .background(Color(uiColor: .secondarySystemBackground).opacity(0.65), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .stroke(Color.primary.opacity(0.08), lineWidth: 1)
        }
    }

    private func trackLessonCard(_ lesson: TrackLesson) -> some View {
        Button {
            NotificationCenter.default.post(name: Notification.Name("NavigateToRoute"), object: LearnRoute.lesson(lesson.slug))
        } label: {
            HStack(alignment: .top, spacing: 14) {
                Text("\(lesson.index)")
                    .font(.caption.weight(.bold))
                    .foregroundStyle(progressStore.isRead(lesson.slug) ? .white : .secondary)
                    .frame(width: 26, height: 26)
                    .background(
                        Circle()
                            .fill(progressStore.isRead(lesson.slug) ? Color.green : Color.primary.opacity(0.08))
                    )
                    .padding(.top, 2)

                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        Text(lesson.title)
                            .font(.headline)
                            .foregroundStyle(.primary)
                        Spacer()
                        if progressStore.isRead(lesson.slug) {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundStyle(.green)
                        }
                        Image(systemName: "chevron.right")
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(.tertiary)
                    }
                    Text(lesson.shortDescription)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .lineLimit(2)
                        .multilineTextAlignment(.leading)
                    HStack(spacing: 8) {
                        StatusPill(lesson.difficulty, tint: difficultyTint(lesson.difficulty))
                        StatusPill("\(lesson.timeEstimate)m", systemImage: "clock", tint: .secondary)
                    }
                }
            }
            .padding(14)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color(uiColor: .secondarySystemBackground).opacity(0.45), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .stroke(Color.primary.opacity(0.07), lineWidth: 1)
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }

    private var trackDetailListContent: some View {
        List {
            Section {
                VStack(alignment: .leading, spacing: 10) {
                    HStack(spacing: 8) {
                        StatusPill(track.level, tint: track.level == "Beginner" ? .green : track.level == "Intermediate" ? .blue : .purple)
                        StatusPill(track.timeEstimate, systemImage: "clock", tint: .secondary)
                        if !track.timeEstimate.lowercased().contains("lesson") {
                            StatusPill("\(track.lessonSlugs.count) lessons", systemImage: "book.pages", tint: .secondary)
                        }
                    }

                    ContentTitle(track.title)

                    Text(track.description)
                        .font(.body)
                        .foregroundStyle(.secondary)

                    Divider()

                    VStack(alignment: .leading, spacing: 6) {
                        Label(track.audience, systemImage: "person.2.fill")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                        Label(track.outcome, systemImage: "flag.checkered")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }

                    VStack(alignment: .leading, spacing: 4) {
                        ProgressView(value: Double(readCount), total: Double(max(track.lessonSlugs.count, 1)))
                            .tint(.indigo)
                        HStack {
                            Text("\(readCount) of \(track.lessonSlugs.count) lessons read")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            Spacer()
                            Text("\(Int((Double(readCount) / Double(max(track.lessonSlugs.count, 1))) * 100))%")
                                .font(.caption.monospacedDigit().weight(.semibold))
                                .foregroundStyle(.secondary)
                        }
                    }

                    HStack(spacing: 12) {
                        if let next = track.lessons.first(where: { !progressStore.isRead($0.slug) }) {
                            Button {
                                NotificationCenter.default.post(name: Notification.Name("NavigateToRoute"), object: LearnRoute.lesson(next.slug))
                            } label: {
                                Label(readCount == 0 ? "Start track" : "Continue track", systemImage: "play.fill")
                                    .font(.subheadline.weight(.semibold))
                            }
                            .buttonStyle(.borderedProminent)
                            .controlSize(.regular)
                        }

                        Button {
                            showingPlan = true
                        } label: {
                            Label("Plan this track", systemImage: "calendar.badge.plus")
                                .font(.subheadline.weight(.medium))
                        }
                        .buttonStyle(.bordered)
                        .controlSize(.regular)
                    }
                }
                .padding(.vertical, 8)
            }

            Section("Lessons") {
                ForEach(track.lessons) { lesson in
                    Button {
                        NotificationCenter.default.post(name: Notification.Name("NavigateToRoute"), object: LearnRoute.lesson(lesson.slug))
                    } label: {
                        HStack(alignment: .top, spacing: 12) {
                            Text("\(lesson.index)")
                                .font(.caption.weight(.bold))
                                .foregroundStyle(.secondary)
                                .frame(width: 24, height: 24)
                                .background(.thinMaterial, in: Circle())

                            VStack(alignment: .leading, spacing: 6) {
                                HStack {
                                    Text(lesson.title)
                                        .font(.headline)
                                        .foregroundStyle(.primary)
                                    Spacer()
                                    if progressStore.isRead(lesson.slug) {
                                        Image(systemName: "checkmark.circle.fill")
                                            .foregroundStyle(.green)
                                    }
                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundStyle(.tertiary)
                                }
                                Text(lesson.shortDescription)
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                                    .lineLimit(2)
                                HStack {
                                    StatusPill(lesson.difficulty, tint: difficultyTint(lesson.difficulty))
                                    StatusPill("\(lesson.timeEstimate)m", systemImage: "clock", tint: .secondary)
                                }
                            }
                        }
                        .padding(.vertical, 4)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }
}

private struct LearningPlanSheet: View {
    var preferredTrackSlug: String? = nil
    @ObservedObject private var dataService = DataService.shared
    @ObservedObject private var progressStore = ProgressStore.shared
    @Environment(\.dismiss) private var dismiss
    @State private var editingPlan = false

    private var plan: GeneratedLearningPlan? {
        guard let selection = progressStore.learningPlanSelection,
              let configuration = dataService.learningPlanConfiguration else { return nil }
        return LearningPlanBuilder.build(
            tracks: dataService.tracks,
            configuration: configuration,
            selection: selection
        )
    }

    private var showingCurrentPlan: Bool {
        plan != nil && !editingPlan && (preferredTrackSlug == nil || preferredTrackSlug == plan?.track.slug)
    }

    var body: some View {
        NavigationStack {
            Group {
                if let plan, showingCurrentPlan {
                    LearningPlanDetail(plan: plan)
                } else {
                    if let configuration = dataService.learningPlanConfiguration {
                        LearningPlanForm(
                            tracks: dataService.tracks,
                            configuration: configuration,
                            existingSelection: progressStore.learningPlanSelection,
                            preferredTrackSlug: preferredTrackSlug
                        ) { selection in
                            progressStore.saveLearningPlan(selection)
                            editingPlan = false
                        }
                    } else {
                        ContentUnavailableView("Plan Unavailable", systemImage: "calendar.badge.exclamationmark")
                    }
                }
            }
            .navigationTitle(showingCurrentPlan ? "Your Plan" : "Build Plan")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button {
                        dismiss()
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .symbolRenderingMode(.hierarchical)
                            .font(.title3)
                            .foregroundStyle(.secondary)
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("Close")
                }
                if showingCurrentPlan {
                    ToolbarItem(placement: .primaryAction) {
                        Button {
                            editingPlan = true
                        } label: {
                            #if targetEnvironment(macCatalyst)
                            Image(systemName: "slider.horizontal.3")
                                .font(.body.weight(.semibold))
                            #else
                            Text("Edit")
                                .font(.body.weight(.medium))
                            #endif
                        }
                        .accessibilityLabel("Edit")
                    }
                }
            }
            #if targetEnvironment(macCatalyst)
            .frame(minWidth: 500, idealWidth: 560, minHeight: 520, idealHeight: 640)
            #else
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            #endif
        }
    }
}

private struct LearningPlanForm: View {
    let tracks: [LearningTrack]
    let configuration: LearningPlanConfiguration
    let onSave: (LearningPlanSelection) -> Void
    @State private var selectedTrackSlug: String
    @State private var level: String
    @State private var weeklyHours: Int

    init(
        tracks: [LearningTrack],
        configuration: LearningPlanConfiguration,
        existingSelection: LearningPlanSelection?,
        preferredTrackSlug: String? = nil,
        onSave: @escaping (LearningPlanSelection) -> Void
    ) {
        self.tracks = tracks
        self.configuration = configuration
        self.onSave = onSave
        _selectedTrackSlug = State(initialValue: preferredTrackSlug ?? existingSelection?.trackSlug ?? configuration.goals.first?.trackSlug ?? "")
        _level = State(initialValue: existingSelection?.level ?? configuration.levels.first?.value ?? "")
        _weeklyHours = State(initialValue: existingSelection?.weeklyHours ?? configuration.weeklyHours.first?.value ?? 0)
    }

    private var selection: LearningPlanSelection {
        LearningPlanSelection(trackSlug: selectedTrackSlug, level: level, weeklyHours: weeklyHours)
    }

    private var selectedGoal: LearningPlanGoal? {
        configuration.goals.first { $0.trackSlug == selectedTrackSlug }
    }

    private var preview: GeneratedLearningPlan? {
        LearningPlanBuilder.build(tracks: tracks, configuration: configuration, selection: selection)
    }

    private var selectedLevel: LearningPlanLevel? {
        configuration.levels.first { $0.value == level }
    }

    var body: some View {
        Form {
            Section("Goal") {
                Picker("Track", selection: $selectedTrackSlug) {
                    ForEach(configuration.goals) { goal in
                        Text(goal.title).tag(goal.trackSlug)
                    }
                }
                if let selectedGoal {
                    Text(selectedGoal.description)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
            }

            Section("Current level") {
                Picker("Experience", selection: $level) {
                    ForEach(configuration.levels) { option in
                        Text(option.title).tag(option.value)
                    }
                }
                Text(selectedLevel?.description ?? "")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }

            Section("Weekly time") {
                Picker("Study time", selection: $weeklyHours) {
                    ForEach(configuration.weeklyHours) { option in
                        Text(option.title).tag(option.value)
                    }
                }
                .pickerStyle(.segmented)
            }

            if let preview {
                Section("Plan preview") {
                    PlanMetricRow(title: "Duration", value: "\(preview.weeks.count) weeks", systemImage: "calendar")
                    PlanMetricRow(title: "Lessons", value: "\(preview.lessons.count)", systemImage: "book.pages")
                    PlanMetricRow(
                        title: "Learning loop",
                        value: "\(preview.weeks.flatMap(\.activities).count) activities",
                        systemImage: "checklist"
                    )
                    if preview.foundationBridgeLessonCount > 0 {
                        Label(
                            "Includes \(preview.foundationBridgeLessonCount) prerequisite lessons before the core track.",
                            systemImage: "arrow.triangle.branch"
                        )
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    }
                }
            }

            Section {
                Button {
                    onSave(selection)
                } label: {
                    Label("Build My Plan", systemImage: "wand.and.stars")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .disabled(preview == nil)
            }
        }
    }
}

private struct LearningPlanDetail: View {
    let plan: GeneratedLearningPlan
    @ObservedObject private var progressStore = ProgressStore.shared
    @Environment(\.dismiss) private var dismiss
    @State private var selectedSectionCheck: LearningPlanActivity?

    private var completedCount: Int {
        plan.lessons.filter { progressStore.isRead($0.slug) }.count
    }

    private var nextLesson: TrackLesson? {
        plan.lessons.first { !progressStore.isRead($0.slug) }
    }

    var body: some View {
        List {
            Section {
                VStack(alignment: .leading, spacing: 12) {
                    Text(plan.track.title)
                        .font(.title2.bold())
                    Text(plan.track.outcome)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    ProgressView(value: Double(completedCount), total: Double(max(plan.lessons.count, 1)))
                    HStack {
                        StatusPill("\(plan.weeks.count) weeks", systemImage: "calendar", tint: .indigo)
                        StatusPill("\(completedCount)/\(plan.lessons.count)", systemImage: "checkmark.circle", tint: .secondary)
                    }
                    if plan.foundationBridgeLessonCount > 0 {
                        Text("\(plan.foundationBridgeLessonCount) prerequisites + \(plan.track.lessons.count) track lessons")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    if let nextLesson {
                        Button {
                            openLesson(nextLesson.slug)
                        } label: {
                            Label(completedCount > 0 ? "Continue Plan" : "Start Plan", systemImage: "arrow.right.circle.fill")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.borderedProminent)
                    }
                }
                .padding(.vertical, 6)
            }

            ForEach(plan.weeks) { week in
                Section {
                    ForEach(week.activities) { activity in
                        activityRow(activity)
                    }
                } header: {
                    VStack(alignment: .leading, spacing: 2) {
                        HStack {
                            Text("Week \(week.number): \(week.title)")
                            Spacer()
                            Text("~\(week.totalMinutes) min")
                        }
                        Text(week.focus)
                            .font(.caption)
                            .textCase(nil)
                    }
                }
            }
        }
        .listStyle(.insetGrouped)
        .sheet(item: $selectedSectionCheck) { activity in
            NavigationStack {
                SectionCheckDetailView(activity: activity)
                    .toolbar {
                        ToolbarItem(placement: .cancellationAction) {
                            Button {
                                selectedSectionCheck = nil
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
    }

    private func openLesson(_ slug: String) {
        dismiss()
        NotificationCenter.default.post(name: Notification.Name("NavigateToRoute"), object: LearnRoute.lesson(slug))
    }

    @ViewBuilder
    private func activityRow(_ activity: LearningPlanActivity) -> some View {
        if activity.template.kind == "section", !(activity.template.questions ?? []).isEmpty {
            Button {
                selectedSectionCheck = activity
            } label: {
                activityLabel(activity)
            }
            .buttonStyle(.plain)
        } else if activity.template.kind == "coding", let href = activity.template.href,
           let url = URL(string: "https://leetllm.com\(href)") {
            Link(destination: url) {
                activityLabel(activity, trailingText: activity.template.required ? "Web lab" : "Optional web lab")
            }
            .accessibilityHint("Opens this coding exercise on the LeetLLM website")
        } else if activity.template.kind == "exam", let slug = activity.template.quizSlug {
            Button {
                openTheoryQuiz(slug)
            } label: {
                activityLabel(activity, trailingText: activity.template.required ? nil : "Optional")
            }
            .buttonStyle(.plain)
        } else if activity.template.kind == "milestone" {
            activityLabel(activity, trailingText: activity.template.required ? nil : "Optional")
        } else if let slug = activity.template.lessonSlug {
            Button {
                openLesson(slug)
            } label: {
                activityLabel(activity)
            }
            .buttonStyle(.plain)
        } else {
            activityLabel(activity)
        }
    }

    private func activityLabel(_ activity: LearningPlanActivity, trailingText: String? = nil) -> some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: activityIcon(activity))
                .foregroundStyle(activityComplete(activity) ? .green : activity.template.kind == "milestone" ? .orange : .secondary)
            VStack(alignment: .leading, spacing: 4) {
                Text(activityKindLabel(activity.template.kind))
                    .font(.caption2.bold())
                    .foregroundStyle(.indigo)
                    .textCase(.uppercase)
                Text(activity.template.title)
                    .foregroundStyle(.primary)
                Text(activity.template.description)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(3)
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 4) {
                Text("\(activity.template.minutes)m")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                if let trailingText {
                    Text(trailingText)
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .padding(.vertical, 3)
    }

    private func activityComplete(_ activity: LearningPlanActivity) -> Bool {
        if activity.template.kind == "lesson", let slug = activity.template.lessonSlug {
            return progressStore.isRead(slug)
        }
        if activity.template.kind == "section", let slug = activity.template.quizSlug {
            return progressStore.quizResult(kind: .section, slug: slug)?.passed == true
        }
        if activity.template.kind == "exam", let slug = activity.template.quizSlug {
            return progressStore.quizResult(kind: .theory, slug: slug)?.passed == true
        }
        return false
    }

    private func activityIcon(_ activity: LearningPlanActivity) -> String {
        if activityComplete(activity) { return "checkmark.circle.fill" }
        switch activity.template.kind {
        case "section": return "brain.head.profile"
        case "coding": return "chevron.left.forwardslash.chevron.right"
        case "exam": return "graduationcap"
        case "milestone": return "flag.checkered"
        default: return "book.closed"
        }
    }

    private func activityKindLabel(_ kind: String) -> String {
        switch kind {
        case "section": return "Section check"
        case "coding": return "Coding lab"
        case "exam": return "Exam"
        case "milestone": return "Milestone"
        default: return "Learn"
        }
    }

    private func openTheoryQuiz(_ slug: String) {
        dismiss()
        NotificationCenter.default.post(name: Notification.Name("OpenTheoryQuiz"), object: slug)
    }
}

private struct SectionCheckDetailView: View {
    let activity: LearningPlanActivity

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 22) {
                VStack(alignment: .leading, spacing: 8) {
                    ContentTitle(activity.template.title)
                    Text(activity.template.description)
                        .font(.body)
                        .foregroundStyle(.secondary)
                }

                if let slug = activity.template.quizSlug,
                   let questions = activity.template.questions,
                   !questions.isEmpty {
                    QuizRunnerView(
                        title: "Section Check",
                        subtitle: "\(questions.count) questions",
                        prompts: questions.enumerated().map { QuizPrompt(id: $0.offset, question: $0.element) },
                        resultKind: .section,
                        resultSlug: slug
                    )
                }
            }
            .padding(24)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .navigationTitle("Weekly Check")
        .navigationBarTitleDisplayMode(.inline)
    }
}

private struct PlanMetricRow: View {
    let title: String
    let value: String
    let systemImage: String

    var body: some View {
        HStack {
            Label(title, systemImage: systemImage)
            Spacer()
            Text(value)
                .foregroundStyle(.secondary)
                .monospacedDigit()
        }
    }
}
