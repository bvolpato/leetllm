import SwiftUI
import UIKit

@MainActor
final class AppNavigation: ObservableObject {
    static let shared = AppNavigation()

    @Published var learnRoute: LearnRoute?
    @Published var quizSlug: String?
    @Published var openPlan = false
    @Published var selectedPracticeSlug: String?
    @Published var selectedTrackSlug: String?
    @Published var selectedGlossaryID: String?
    @Published var isSidebarVisible = true
}

struct AppRootView: View {
    @ObservedObject private var dataService = DataService.shared
    @ObservedObject private var progressStore = ProgressStore.shared
    @ObservedObject private var syncClient = PersistentSyncClient.shared
    @Environment(\.scenePhase) private var scenePhase
    private let launchRoute: String?
    private let launchQuery: String

    init() {
        launchRoute = Self.launchArgumentValue("--initial-route")
        launchQuery = Self.launchArgumentValue("--initial-query") ?? ""
        let args = ProcessInfo.processInfo.arguments
        let skipSplash = args.contains("--no-splash") || args.contains("--ui-testing")
        _showSplash = State(initialValue: !skipSplash)
    }

    @State private var showSplash: Bool
    @State private var hasScheduledSplashDismissal = false
    @State private var selectedTab = 0
    @State private var mountedTabs: Set<TabType> = [.learn]
    @State private var didSetInitialTab = false
    @ObservedObject private var navigation = AppNavigation.shared
    @ObservedObject private var readerSettings = ReaderSettings.shared

    enum TabType: Int, CaseIterable, Identifiable {
        case learn = 0
        case practice = 1
        case tracks = 2
        case glossary = 3
        case settings = 4

        var id: Int { rawValue }

        var title: String {
            switch self {
            case .learn: return "Learn"
            case .practice: return "Practice"
            case .tracks: return "Tracks"
            case .glossary: return "Glossary"
            case .settings: return "Settings"
            }
        }

        var image: String {
            switch self {
            case .learn: return "book.closed.fill"
            case .practice: return "checklist.checked"
            case .tracks: return "map.fill"
            case .glossary: return "text.book.closed.fill"
            case .settings: return "gearshape.fill"
            }
        }
    }

    var body: some View {
        ZStack {
            Group {
                if let loadError = dataService.loadError {
                    ContentUnavailableView {
                        Label("Content Unavailable", systemImage: "externaldrive.badge.exclamationmark")
                    } description: {
                        Text(loadError)
                    } actions: {
                        Button("Try Again") {
                            dataService.load()
                        }
                        .buttonStyle(.borderedProminent)
                    }
                } else if let launchRoute, shouldLaunchDirectly(launchRoute) {
                    launchDestination(for: launchRoute)
                        .id(progressStore.resetGeneration)
                } else {
                    mainNavigationContent
                        .onReceive(NotificationCenter.default.publisher(for: Notification.Name("SwitchToLearnTab"))) { _ in
                            selectTab(.learn)
                        }
                        .onReceive(NotificationCenter.default.publisher(for: Notification.Name("SwitchToPracticeTab"))) { _ in
                            selectTab(.practice)
                        }
                        .onReceive(NotificationCenter.default.publisher(for: Notification.Name("SwitchToTracksTab"))) { _ in
                            selectTab(.tracks)
                        }
                        .onReceive(NotificationCenter.default.publisher(for: Notification.Name("SwitchToGlossaryTab"))) { _ in
                            selectTab(.glossary)
                        }
                        .onReceive(NotificationCenter.default.publisher(for: Notification.Name("SwitchToAccountTab"))) { _ in
                            selectTab(.settings)
                        }
                        .onReceive(NotificationCenter.default.publisher(for: Notification.Name("SwitchToSettingsTab"))) { _ in
                            selectTab(.settings)
                        }
                        .onReceive(NotificationCenter.default.publisher(for: Notification.Name("IncreaseFontSize"))) { _ in
                            readerSettings.fontSize = min(readerSettings.fontSize + 2, 30)
                        }
                        .onReceive(NotificationCenter.default.publisher(for: Notification.Name("DecreaseFontSize"))) { _ in
                            readerSettings.fontSize = max(readerSettings.fontSize - 2, 14)
                        }
                        .onReceive(NotificationCenter.default.publisher(for: Notification.Name("ResetFontSize"))) { _ in
                            readerSettings.fontSize = 18
                        }
                        .background {
                            Group {
                                Button("") {
                                    readerSettings.fontSize = min(readerSettings.fontSize + 2, 30)
                                }
                                .keyboardShortcut("+", modifiers: .command)
                                Button("") {
                                    readerSettings.fontSize = min(readerSettings.fontSize + 2, 30)
                                }
                                .keyboardShortcut("=", modifiers: .command)
                                Button("") {
                                    readerSettings.fontSize = max(readerSettings.fontSize - 2, 14)
                                }
                                .keyboardShortcut("-", modifiers: .command)
                                Button("") {
                                    readerSettings.fontSize = 18
                                }
                                .keyboardShortcut("0", modifiers: .command)
                            }
                            .opacity(0)
                            .allowsHitTesting(false)
                            .accessibilityHidden(true)
                        }
                }
            }
            #if targetEnvironment(macCatalyst)
            .frame(minWidth: 780, maxWidth: .infinity, minHeight: 520, maxHeight: .infinity)
            #endif
            .environmentObject(navigation)

            if showSplash {
                LeetLLMSplashScreen()
                    .transition(
                        .asymmetric(
                            insertion: .opacity,
                            removal: .scale(scale: 1.08).combined(with: .opacity)
                        )
                    )
                    .zIndex(100)
                    .onTapGesture {
                        withAnimation(.easeOut(duration: 0.25)) {
                            showSplash = false
                        }
                    }
            }
        }
        .onAppear {
            dismissSplashIfReady()
            guard !didSetInitialTab else { return }
            didSetInitialTab = true
            switch launchRoute {
            case "practice":
                selectedTab = TabType.practice.rawValue
                mountedTabs.insert(.practice)
            case "tracks":
                selectedTab = TabType.tracks.rawValue
                mountedTabs.insert(.tracks)
            case "glossary":
                selectedTab = TabType.glossary.rawValue
                mountedTabs.insert(.glossary)
            case "account", "settings":
                selectedTab = TabType.settings.rawValue
                mountedTabs.insert(.settings)
            default: break
            }
        }
        .onChange(of: dataService.isInitialLoadComplete) { _, _ in
            dismissSplashIfReady()
        }
        .onChange(of: dataService.loadError) { _, _ in
            dismissSplashIfReady()
        }
        .onChange(of: selectedTab) { _, newValue in
            if let tab = TabType(rawValue: newValue) {
                mountedTabs.insert(tab)
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: Notification.Name("NavigateToRoute"))) { notification in
            guard let route = notification.object as? LearnRoute else { return }
            navigation.learnRoute = route
            selectedTab = TabType.learn.rawValue
        }
        .onReceive(NotificationCenter.default.publisher(for: Notification.Name("OpenTheoryQuiz"))) { notification in
            guard let slug = notification.object as? String else { return }
            navigation.quizSlug = slug
            selectedTab = TabType.practice.rawValue
        }
        .onReceive(NotificationCenter.default.publisher(for: Notification.Name("OpenLearningPlan"))) { _ in
            navigation.openPlan = true
            selectedTab = TabType.tracks.rawValue
        }
        .background {
            ThemeCoordinator(scheme: readerSettings.readerColorScheme)
        }
        .preferredColorScheme(readerSettings.currentColorScheme)
        .onChange(of: scenePhase) { _, phase in
            if phase != .active {
                progressStore.flushPendingPersistence()
            }
        }
    }

    private func selectTab(_ tab: TabType) {
        mountedTabs.insert(tab)
        if selectedTab == tab.rawValue, tab == .learn {
            NotificationCenter.default.post(name: Notification.Name("LearnTabDoubleTapped"), object: nil)
        } else {
            selectedTab = tab.rawValue
            if tab == .learn {
                NotificationCenter.default.post(name: Notification.Name("LearnTabTapped"), object: nil)
            }
        }
    }

    @ViewBuilder
    private var mainNavigationContent: some View {
        #if targetEnvironment(macCatalyst)
        let activeTab = TabType(rawValue: selectedTab) ?? .learn
        VStack(spacing: 0) {
            MacTopNavigationBar(
                selectedTab: Binding(
                    get: { activeTab },
                    set: { selectTab($0) }
                ),
                completedLessons: dataService.lessons.filter { progressStore.isRead($0.slug) }.count,
                totalLessons: dataService.lessons.count
            )
            Divider()
            ZStack {
                if mountedTabs.contains(.learn) || activeTab == .learn {
                    LearnView()
                        .id(progressStore.resetGeneration)
                        .opacity(activeTab == .learn ? 1 : 0)
                        .allowsHitTesting(activeTab == .learn)
                        .accessibilityHidden(activeTab != .learn)
                }
                if mountedTabs.contains(.practice) || activeTab == .practice {
                    PracticeView()
                        .id(progressStore.resetGeneration)
                        .opacity(activeTab == .practice ? 1 : 0)
                        .allowsHitTesting(activeTab == .practice)
                        .accessibilityHidden(activeTab != .practice)
                }
                if mountedTabs.contains(.tracks) || activeTab == .tracks {
                    TracksView()
                        .id(progressStore.resetGeneration)
                        .opacity(activeTab == .tracks ? 1 : 0)
                        .allowsHitTesting(activeTab == .tracks)
                        .accessibilityHidden(activeTab != .tracks)
                }
                if mountedTabs.contains(.glossary) || activeTab == .glossary {
                    GlossaryView()
                        .opacity(activeTab == .glossary ? 1 : 0)
                        .allowsHitTesting(activeTab == .glossary)
                        .accessibilityHidden(activeTab != .glossary)
                }
                if mountedTabs.contains(.settings) || activeTab == .settings {
                    AccountView()
                        .opacity(activeTab == .settings ? 1 : 0)
                        .allowsHitTesting(activeTab == .settings)
                        .accessibilityHidden(activeTab != .settings)
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .tint(.indigo)
        #else
        TabView(selection: Binding(
            get: { selectedTab },
            set: { value in
                if let tab = TabType(rawValue: value) {
                    selectTab(tab)
                }
            }
        )) {
            LearnView()
                .id(progressStore.resetGeneration)
                .tabItem { Label("Learn", systemImage: "book.closed.fill") }
                .tag(TabType.learn.rawValue)

            PracticeView()
                .id(progressStore.resetGeneration)
                .tabItem { Label("Practice", systemImage: "checklist.checked") }
                .tag(TabType.practice.rawValue)

            TracksView()
                .id(progressStore.resetGeneration)
                .tabItem { Label("Tracks", systemImage: "map.fill") }
                .tag(TabType.tracks.rawValue)

            GlossaryView()
                .tabItem { Label("Glossary", systemImage: "text.book.closed.fill") }
                .tag(TabType.glossary.rawValue)

            AccountView()
                .tabItem { Label("Settings", systemImage: "gearshape.fill") }
                .tag(TabType.settings.rawValue)
        }
        .tint(.indigo)
        #endif
    }

    @ViewBuilder
    private func launchDestination(for route: String) -> some View {
        NavigationStack {
            switch route {
            case "learn":
                LearnView()
            case "lesson":
                LessonDetailView(slug: launchQuery.isEmpty ? dataService.lessons.first?.slug ?? "" : launchQuery)
            case "practice":
                PracticeView()
            case "quiz":
                if let quiz = dataService.theoryQuizzes.first(where: { $0.slug == launchQuery }) ?? dataService.theoryQuizzes.first {
                    TheoryQuizDetailView(quiz: quiz)
                } else {
                    PracticeView()
                }
            case "tracks":
                TracksView()
            case "track":
                if let track = dataService.tracks.first(where: { $0.slug == launchQuery }) ?? dataService.tracks.first {
                    TrackDetailView(track: track)
                } else {
                    TracksView()
                }
            case "glossary":
                GlossaryView()
            case "term":
                if let entry = dataService.glossaryEntry(id: launchQuery) ?? dataService.glossary.first {
                    GlossaryDetailView(entry: entry)
                } else {
                    GlossaryView()
                }
            case "account", "settings":
                AccountView()
            default:
                LearnView()
            }
        }
    }

    private func shouldLaunchDirectly(_ route: String) -> Bool {
        ["quiz", "track", "term"].contains(route)
    }

    private static func launchArgumentValue(_ name: String) -> String? {
        let arguments = ProcessInfo.processInfo.arguments
        guard let index = arguments.firstIndex(of: name) else { return nil }
        let valueIndex = arguments.index(after: index)
        guard valueIndex < arguments.endIndex else { return nil }
        return arguments[valueIndex]
    }

    private func dismissSplashIfReady() {
        guard showSplash, !hasScheduledSplashDismissal else { return }
        let args = ProcessInfo.processInfo.arguments
        if args.contains("--no-splash") || args.contains("--ui-testing") {
            showSplash = false
            return
        }
        guard dataService.isInitialLoadComplete || dataService.loadError != nil else { return }
        hasScheduledSplashDismissal = true
        Task { @MainActor in
            try? await Task.sleep(for: .milliseconds(200))
            withAnimation(.easeOut(duration: 0.28)) {
                showSplash = false
            }
        }
    }
}

#if targetEnvironment(macCatalyst)
struct MacSplitView<Sidebar: View, Detail: View>: View {
    @ObservedObject private var navigation = AppNavigation.shared
    var sidebarWidth: CGFloat = 310
    @ViewBuilder let sidebar: () -> Sidebar
    @ViewBuilder let detail: () -> Detail

    var body: some View {
        HStack(spacing: 0) {
            if navigation.isSidebarVisible {
                sidebar()
                    .frame(width: sidebarWidth)
                    .frame(maxHeight: .infinity)
                    .background(Color(uiColor: .secondarySystemBackground).opacity(0.45))
                    .transition(.move(edge: .leading).combined(with: .opacity))

                Divider()
            }

            detail()
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(Color(uiColor: .systemBackground))
        }
        .animation(.snappy(duration: 0.22), value: navigation.isSidebarVisible)
    }
}

struct MacSidebarSearchBar: View {
    @Binding var text: String
    let placeholder: String

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: "magnifyingglass")
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(.secondary)

            TextField(placeholder, text: $text)
                .textFieldStyle(.plain)
                .font(.system(size: 13))
                .accessibilityLabel(placeholder)

            if !text.isEmpty {
                Button {
                    text = ""
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .font(.system(size: 13))
                        .foregroundStyle(.secondary)
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Clear search")
            }
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 7)
        .background(
            RoundedRectangle(cornerRadius: 9, style: .continuous)
                .fill(Color.primary.opacity(0.06))
                .overlay(
                    RoundedRectangle(cornerRadius: 9, style: .continuous)
                        .stroke(Color.primary.opacity(0.08), lineWidth: 1)
                )
        )
        .padding(.horizontal, 12)
        .padding(.top, 10)
        .padding(.bottom, 6)
    }
}

@ViewBuilder
func macSidebarRowBackground(isSelected: Bool) -> some View {
    if isSelected {
        RoundedRectangle(cornerRadius: 9, style: .continuous)
            .fill(Color.indigo.opacity(0.14))
            .overlay(
                RoundedRectangle(cornerRadius: 9, style: .continuous)
                    .strokeBorder(Color.indigo.opacity(0.45), lineWidth: 1)
            )
            .padding(.vertical, 1)
    } else {
        Color.clear
    }
}

private struct MacTopNavigationBar: View {
    @Binding var selectedTab: AppRootView.TabType
    let completedLessons: Int
    let totalLessons: Int
    @ObservedObject private var readerSettings = ReaderSettings.shared
    @ObservedObject private var navigation = AppNavigation.shared
    @Environment(\.colorScheme) private var colorScheme
    @State private var hoveredTab: AppRootView.TabType?
    @State private var showingQuickReaderSettings = false

    private var isEffectiveDark: Bool {
        if readerSettings.readerColorScheme == "light" { return false }
        if readerSettings.readerColorScheme == "dark" { return true }
        return colorScheme == .dark
    }

    var body: some View {
        HStack(spacing: 12) {
            if selectedTab != .settings {
                Button {
                    withAnimation(.snappy(duration: 0.22)) {
                        navigation.isSidebarVisible.toggle()
                    }
                } label: {
                    Image(systemName: "sidebar.left")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(navigation.isSidebarVisible ? Color.indigo : Color.secondary)
                        .frame(width: 28, height: 28)
                        .background(
                            RoundedRectangle(cornerRadius: 7, style: .continuous)
                                .fill(navigation.isSidebarVisible ? Color.indigo.opacity(0.12) : Color.primary.opacity(0.05))
                        )
                }
                .buttonStyle(.plain)
                .help(navigation.isSidebarVisible ? "Hide Sidebar" : "Show Sidebar")
                .accessibilityLabel(navigation.isSidebarVisible ? "Hide Sidebar" : "Show Sidebar")
            }

            // Brand & Progress
            Button {
                selectedTab = .learn
            } label: {
                HStack(spacing: 9) {
                    ZStack {
                        RoundedRectangle(cornerRadius: 8, style: .continuous)
                            .fill(
                                LinearGradient(
                                    colors: [Color(hex: "#6366F1"), Color(hex: "#4F46E5"), Color(hex: "#06B6D4")],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                            .frame(width: 28, height: 28)
                        Image(systemName: "brain.head.profile")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundStyle(.white)
                    }
                    Text("LeetLLM")
                        .font(.system(size: 15, weight: .bold, design: .rounded))
                        .foregroundStyle(.primary)

                    if totalLessons > 0 {
                        Text("\(completedLessons)/\(totalLessons)")
                            .font(.caption2.monospacedDigit().weight(.semibold))
                            .foregroundStyle(.indigo)
                            .padding(.horizontal, 7)
                            .padding(.vertical, 3)
                            .background(Color.indigo.opacity(0.12), in: Capsule())
                    }
                }
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel("LeetLLM Home, \(completedLessons) of \(totalLessons) lessons read")

            Spacer(minLength: 8)

            // Center Segmented Tab Switcher with Icons + Labels
            HStack(spacing: 4) {
                ForEach(AppRootView.TabType.allCases) { tab in
                    let isSelected = selectedTab == tab
                    let isHovered = hoveredTab == tab
                    Button {
                        withAnimation(.snappy(duration: 0.2)) {
                            selectedTab = tab
                        }
                    } label: {
                        HStack(spacing: 6) {
                            Image(systemName: tab.image)
                                .font(.system(size: 13, weight: isSelected ? .semibold : .medium))
                            Text(tab.title)
                                .font(.system(size: 13, weight: isSelected ? .semibold : .medium))
                        }
                        .padding(.horizontal, 13)
                        .padding(.vertical, 6)
                        .foregroundStyle(isSelected ? Color.white : Color.primary.opacity(isHovered ? 0.95 : 0.78))
                        .background {
                            if isSelected {
                                Capsule(style: .continuous)
                                    .fill(
                                        LinearGradient(
                                            colors: [Color(hex: "#6366F1"), Color(hex: "#4F46E5")],
                                            startPoint: .top,
                                            endPoint: .bottom
                                        )
                                    )
                                    .shadow(color: Color.indigo.opacity(0.28), radius: 4, y: 1)
                            } else if isHovered {
                                Capsule(style: .continuous)
                                    .fill(Color.primary.opacity(0.07))
                            }
                        }
                        .contentShape(Capsule(style: .continuous))
                    }
                    .buttonStyle(.plain)
                    .fixedSize()
                    .onHover { hovering in
                        hoveredTab = hovering ? tab : (hoveredTab == tab ? nil : hoveredTab)
                    }
                    .accessibilityIdentifier(tab.title)
                    .accessibilityLabel(tab.title)
                    .accessibilityAddTraits(isSelected ? .isSelected : [])
                }
            }
            .padding(4)
            .background(
                Capsule(style: .continuous)
                    .fill(Color.primary.opacity(isEffectiveDark ? 0.08 : 0.05))
                    .overlay(
                        Capsule(style: .continuous)
                            .stroke(Color.primary.opacity(isEffectiveDark ? 0.12 : 0.08), lineWidth: 1)
                    )
            )

            Spacer(minLength: 8)

            // Quick Appearance & Typography Controls
            HStack(spacing: 6) {
                Button {
                    readerSettings.readerColorScheme = isEffectiveDark ? "light" : "dark"
                } label: {
                    Image(systemName: isEffectiveDark ? "sun.max.fill" : "moon.stars.fill")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(isEffectiveDark ? .yellow : .indigo)
                        .frame(width: 30, height: 30)
                        .background(Color.primary.opacity(0.06), in: Circle())
                }
                .buttonStyle(.plain)
                .help(isEffectiveDark ? "Switch to Light Mode" : "Switch to Dark Mode")
                .accessibilityLabel(isEffectiveDark ? "Switch to Light Mode" : "Switch to Dark Mode")

                Button {
                    showingQuickReaderSettings.toggle()
                } label: {
                    Image(systemName: "textformat.size")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(.primary.opacity(0.85))
                        .frame(width: 30, height: 30)
                        .background(Color.primary.opacity(0.06), in: Circle())
                }
                .buttonStyle(.plain)
                .help("Text & Appearance Options")
                .accessibilityLabel("Text options")
                .popover(isPresented: $showingQuickReaderSettings, arrowEdge: .top) {
                    ReaderSettingsView()
                        .environmentObject(readerSettings)
                        .frame(width: 340, height: 340)
                }
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 8)
        .background {
            Color(uiColor: .secondarySystemBackground)
                .opacity(0.95)
                .ignoresSafeArea(.container, edges: .top)
        }
        .onReceive(NotificationCenter.default.publisher(for: Notification.Name("ToggleReaderSettings"))) { _ in
            showingQuickReaderSettings.toggle()
        }
        .onReceive(NotificationCenter.default.publisher(for: Notification.Name("ToggleFontStyle"))) { _ in
            readerSettings.fontTheme = readerSettings.fontTheme == "serif" ? "sans" : "serif"
        }
    }
}
#endif

private struct ThemeCoordinator: UIViewRepresentable {
    let scheme: String

    final class Coordinator {
        var lastAppliedScheme: String?
    }

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    func makeUIView(context: Context) -> UIView {
        let view = UIView(frame: .zero)
        view.isHidden = true
        view.isUserInteractionEnabled = false
        return view
    }

    func updateUIView(_ uiView: UIView, context: Context) {
        guard context.coordinator.lastAppliedScheme != scheme else { return }
        context.coordinator.lastAppliedScheme = scheme
        let style: UIUserInterfaceStyle = {
            switch scheme {
            case "light": return .light
            case "dark": return .dark
            default: return .unspecified
            }
        }()
        DispatchQueue.main.async {
            if let window = uiView.window, window.overrideUserInterfaceStyle != style {
                window.overrideUserInterfaceStyle = style
            }
            for scene in UIApplication.shared.connectedScenes {
                if let windowScene = scene as? UIWindowScene {
                    #if targetEnvironment(macCatalyst)
                    windowScene.title = ""
                    if let sizeRestrictions = windowScene.sizeRestrictions {
                        sizeRestrictions.minimumSize = CGSize(width: 780, height: 520)
                        sizeRestrictions.maximumSize = CGSize(width: 10000, height: 10000)
                    }
                    if let titlebar = windowScene.titlebar {
                        if titlebar.toolbar != nil {
                            titlebar.toolbar = nil
                        }
                        titlebar.titleVisibility = .hidden
                        titlebar.separatorStyle = .none
                    }
                    #endif
                    for window in windowScene.windows {
                        if window.overrideUserInterfaceStyle != style {
                            window.overrideUserInterfaceStyle = style
                        }
                    }
                }
            }
            #if targetEnvironment(macCatalyst)
            applyMacAppKitAppearance(scheme: scheme)
            #endif
        }
    }

    #if targetEnvironment(macCatalyst)
    private func applyMacAppKitAppearance(scheme: String) {
        guard let nsAppClass = NSClassFromString("NSApplication") as? NSObject.Type,
              let nsApp = nsAppClass.perform(NSSelectorFromString("sharedApplication"))?.takeUnretainedValue() as? NSObject else {
            return
        }
        let appearance: AnyObject? = {
            guard let nsAppearanceClass = NSClassFromString("NSAppearance") as? NSObject.Type else { return nil }
            let sel = NSSelectorFromString("appearanceNamed:")
            switch scheme {
            case "light":
                return nsAppearanceClass.perform(sel, with: "NSAppearanceNameAqua")?.takeUnretainedValue()
            case "dark":
                return nsAppearanceClass.perform(sel, with: "NSAppearanceNameDarkAqua")?.takeUnretainedValue()
            default:
                return nil
            }
        }()
        nsApp.setValue(appearance, forKey: "appearance")
        if let windows = nsApp.value(forKey: "windows") as? [NSObject] {
            for win in windows {
                win.setValue(appearance, forKey: "appearance")
                win.setValue("", forKey: "title")
            }
        }
    }
    #endif
}

#Preview {
    AppRootView()
        .environmentObject(DataService.shared)
        .environmentObject(ProgressStore.preview)
        .environmentObject(ReaderSettings.shared)
        .environmentObject(PersistentSyncClient.shared)
}

struct LeetLLMSplashScreen: View {
    @State private var hasAppeared = false
    @State private var pulseGlow = false
    @State private var shimmerOffset: CGFloat = -160
    @State private var neuralRingRotation: Double = 0

    var body: some View {
        ZStack {
            // Deep space background
            Color(hex: "#060812")
                .ignoresSafeArea()

            // Primary ambient breathing glow (electric indigo / violet)
            RadialGradient(
                gradient: Gradient(colors: [
                    Color(hex: "#6366F1").opacity(pulseGlow ? 0.28 : 0.10),
                    Color(hex: "#8B5CF6").opacity(pulseGlow ? 0.14 : 0.03),
                    Color.clear
                ]),
                center: .center,
                startRadius: 8,
                endRadius: pulseGlow ? 300 : 180
            )
            .ignoresSafeArea()
            .scaleEffect(hasAppeared ? 1.0 : 0.82)

            // Secondary ambient breathing glow (electric cyan pulse)
            RadialGradient(
                gradient: Gradient(colors: [
                    Color(hex: "#06B6D4").opacity(pulseGlow ? 0.18 : 0.05),
                    Color.clear
                ]),
                center: .center,
                startRadius: 24,
                endRadius: pulseGlow ? 220 : 130
            )
            .ignoresSafeArea()
            .offset(y: -40)

            // Futuristic orbital neural rings
            ZStack {
                Circle()
                    .stroke(
                        AngularGradient(
                            gradient: Gradient(colors: [
                                Color(hex: "#6366F1").opacity(0.38),
                                Color(hex: "#06B6D4").opacity(0.30),
                                Color.clear,
                                Color(hex: "#8B5CF6").opacity(0.32),
                                Color(hex: "#6366F1").opacity(0.38)
                            ]),
                            center: .center
                        ),
                        style: StrokeStyle(lineWidth: 1.5, dash: [6, 10])
                    )
                    .frame(width: 172, height: 172)
                    .rotationEffect(.degrees(neuralRingRotation))

                Circle()
                    .stroke(
                        Color(hex: "#38BDF8").opacity(pulseGlow ? 0.25 : 0.08),
                        lineWidth: 1
                    )
                    .frame(width: 216, height: 216)
            }
            .scaleEffect(hasAppeared ? 1.0 : 0.75)
            .opacity(hasAppeared ? 1.0 : 0.0)

            VStack(spacing: 22) {
                // Futuristic Neural Badge with Shimmer
                ZStack {
                    // Outer diffuse glow
                    RoundedRectangle(cornerRadius: 26, style: .continuous)
                        .fill(
                            LinearGradient(
                                colors: [Color(hex: "#6366F1"), Color(hex: "#8B5CF6"), Color(hex: "#06B6D4")],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 88, height: 88)
                        .blur(radius: pulseGlow ? 22 : 12)
                        .opacity(pulseGlow ? 0.65 : 0.32)

                    // Core Badge surface
                    RoundedRectangle(cornerRadius: 26, style: .continuous)
                        .fill(
                            LinearGradient(
                                colors: [
                                    Color(hex: "#1E1B4B"),
                                    Color(hex: "#312E81"),
                                    Color(hex: "#0A0D1F")
                                ],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 88, height: 88)
                        .overlay(
                            RoundedRectangle(cornerRadius: 26, style: .continuous)
                                .stroke(
                                    LinearGradient(
                                        colors: [
                                            Color.white.opacity(0.65),
                                            Color(hex: "#38BDF8").opacity(0.45),
                                            Color(hex: "#6366F1").opacity(0.2)
                                        ],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    ),
                                    lineWidth: 1.5
                                )
                        )

                    // Sweeping light highlight
                    RoundedRectangle(cornerRadius: 26, style: .continuous)
                        .fill(
                            LinearGradient(
                                colors: [
                                    Color.white.opacity(0),
                                    Color.white.opacity(0.45),
                                    Color(hex: "#38BDF8").opacity(0.35),
                                    Color.white.opacity(0)
                                ],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .frame(width: 48, height: 88)
                        .rotationEffect(.degrees(25))
                        .offset(x: shimmerOffset)
                        .mask(
                            RoundedRectangle(cornerRadius: 26, style: .continuous)
                                .frame(width: 88, height: 88)
                        )

                    // Brain / Neural SF Symbol with gradient & glow
                    Image(systemName: "brain.head.profile")
                        .font(.system(size: 42, weight: .bold))
                        .foregroundStyle(
                            LinearGradient(
                                colors: [
                                    Color.white,
                                    Color(hex: "#E0E7FF"),
                                    Color(hex: "#67E8F9")
                                ],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .shadow(color: Color(hex: "#38BDF8").opacity(0.7), radius: 8, x: 0, y: 2)
                }
                .scaleEffect(hasAppeared ? 1.0 : 0.72)
                .opacity(hasAppeared ? 1.0 : 0.0)

                VStack(spacing: 8) {
                    // Pill chip
                    Text("PRODUCTION AI & LLM ENGINEERING")
                        .font(.system(size: 9.5, weight: .bold, design: .monospaced))
                        .tracking(1.8)
                        .foregroundStyle(Color(hex: "#38BDF8"))
                        .padding(.horizontal, 11)
                        .padding(.vertical, 4.5)
                        .background(
                            Capsule()
                                .fill(Color(hex: "#06B6D4").opacity(0.12))
                                .overlay(
                                    Capsule()
                                        .stroke(Color(hex: "#06B6D4").opacity(0.35), lineWidth: 1)
                                )
                        )
                        .scaleEffect(hasAppeared ? 1.0 : 0.9)
                        .opacity(hasAppeared ? 1.0 : 0.0)

                    // Main Title
                    Text("LeetLLM")
                        .font(.system(size: 42, weight: .heavy, design: .rounded))
                        .tracking(-0.6)
                        .foregroundStyle(
                            LinearGradient(
                                colors: [
                                    Color.white,
                                    Color(hex: "#EEF2FF"),
                                    Color(hex: "#C7D2FE")
                                ],
                                startPoint: .top,
                                endPoint: .bottom
                            )
                        )
                        .shadow(color: Color(hex: "#6366F1").opacity(0.55), radius: 14, x: 0, y: 4)
                        .scaleEffect(hasAppeared ? 1.0 : 0.92)
                        .opacity(hasAppeared ? 1.0 : 0.0)

                    // Subtitle
                    Text("Master AI & LLMs from First Principles")
                        .font(.system(size: 15, weight: .medium))
                        .foregroundColor(Color(hex: "#CBD5E1"))
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 24)
                        .opacity(hasAppeared ? 1.0 : 0.0)
                        .offset(y: hasAppeared ? 0 : 6)
                }

                Spacer().frame(height: 8)

                ProgressView()
                    .progressViewStyle(CircularProgressViewStyle(tint: Color(hex: "#38BDF8")))
                    .scaleEffect(1.05)
                    .opacity(hasAppeared ? 0.9 : 0.0)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .accessibilityIdentifier("splashScreen")
        .onAppear {
            withAnimation(.spring(response: 0.65, dampingFraction: 0.72)) {
                hasAppeared = true
            }
            withAnimation(.easeInOut(duration: 1.8).repeatForever(autoreverses: true)) {
                pulseGlow = true
            }
            withAnimation(.linear(duration: 9).repeatForever(autoreverses: false)) {
                neuralRingRotation = 360
            }
            withAnimation(.easeInOut(duration: 1.15).delay(0.25)) {
                shimmerOffset = 160
            }
        }
    }
}

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue:  Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
