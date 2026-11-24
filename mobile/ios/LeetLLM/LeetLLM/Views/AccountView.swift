import AuthenticationServices
import SwiftUI

struct AccountView: View {
    @ObservedObject private var dataService = DataService.shared
    @ObservedObject private var progressStore = ProgressStore.shared
    @ObservedObject private var syncClient = PersistentSyncClient.shared
    @ObservedObject private var readerSettings = ReaderSettings.shared
    @Environment(\.colorScheme) private var colorScheme
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass
    
    @State private var email = ""
    @State private var password = ""
    @State private var isSigningIn = false
    @State private var isSyncing = false
    @State private var errorMessage: String? = nil
    @State private var successMessage: String? = nil
    @State private var accountAction: AccountAction?
    @State private var isSigningOut = false
    @State private var isDeletingAccount = false
    @State private var showingReaderSettings = false
    @State private var syncTask: Task<Void, Never>? = nil
    @FocusState private var focusedField: SignInField?

    private enum SignInField {
        case email
        case password
    }

    private enum AccountAction {
        case reset, signOut, delete

        var title: String {
            switch self {
            case .reset: return "Reset local progress?"
            case .signOut: return "Sign out and clear local progress?"
            case .delete: return "Delete your account permanently?"
            }
        }

        var explanation: String {
            switch self {
            case .reset: return "This removes notes, bookmarks, quiz attempts, reading positions, and your local plan. Synced progress remains in your account and can return when you sync."
            case .signOut: return "This clears progress from this device. Synced progress remains in your account."
            case .delete: return "This deletes your account and all local and synced progress. This cannot be undone."
            }
        }
    }

    private var lessonProgress: Double {
        guard !dataService.lessons.isEmpty else { return 0 }
        return Double(readCount) / Double(dataService.lessons.count)
    }

    private var readCount: Int {
        dataService.lessons.filter { progressStore.isRead($0.slug) }.count
    }

    private var canSignIn: Bool {
        !email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && !password.isEmpty && syncClient.isOnline && !isSigningIn
    }

    private var learningPlan: GeneratedLearningPlan? {
        guard let selection = progressStore.learningPlanSelection,
              let configuration = dataService.learningPlanConfiguration else { return nil }
        return LearningPlanBuilder.build(
            tracks: dataService.tracks,
            configuration: configuration,
            selection: selection
        )
    }

    var body: some View {
        NavigationStack {
            List {
                overviewSection
                appearanceSection
                syncSection
                progressSection
                learningPlanSection
                bundleSection
                aboutSection
                resetSection
            }
            .background(Color(uiColor: .systemGroupedBackground))
            #if targetEnvironment(macCatalyst)
            .toolbar(.hidden, for: .navigationBar)
            #else
            .navigationTitle(horizontalSizeClass == .regular ? "Settings" : "")
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .scrollDismissesKeyboard(.interactively)
            .toolbar {
                ToolbarItemGroup(placement: .keyboard) {
                    Spacer()
                    Button("Done") { focusedField = nil }
                }
            }
            .sheet(isPresented: $showingReaderSettings) {
                ReaderSettingsView()
                    .environmentObject(readerSettings)
                    .presentationDetents([.medium, .large])
                    .presentationDragIndicator(.visible)
            }
            .alert(
                accountAction?.title ?? "",
                isPresented: Binding(get: { accountAction != nil }, set: { if !$0 { accountAction = nil } })
            ) {
                switch accountAction {
                case .reset:
                    Button("Reset", role: .destructive) {
                        progressStore.resetAll()
                        successMessage = "Local progress was reset."
                        errorMessage = nil
                    }
                case .signOut:
                    Button("Sign Out & Clear Progress", role: .destructive) { performSignOut() }
                case .delete:
                    Button("Delete Permanently", role: .destructive) { performDeleteAccount() }
                case nil: EmptyView()
                }
                Button("Cancel", role: .cancel) {}
            } message: {
                Text(accountAction?.explanation ?? "")
            }
            .onAppear {
                if syncClient.isAuthenticated && syncClient.isOnline && syncClient.lastSyncedAt == nil {
                    performSync()
                }
            }
            .task {
                guard !syncClient.isAuthenticated && syncClient.availableSocialProviders.isEmpty else { return }
                await syncClient.refreshProviderAvailability()
            }
            .onChange(of: syncClient.isOnline) { _, online in
                if online && syncClient.isAuthenticated && !isSigningOut && !isDeletingAccount {
                    performSync()
                } else if online && !syncClient.isAuthenticated && syncClient.availableSocialProviders.isEmpty {
                    Task { await syncClient.refreshProviderAvailability() }
                }
            }
        }
    }

    @ViewBuilder
    private var overviewSection: some View {
        Section {
            VStack(alignment: .leading, spacing: 8) {
                Text("\(readCount) of \(dataService.lessons.count) lessons read")
                    .font(.subheadline.weight(.semibold))
                ProgressView(value: lessonProgress)
                    .tint(.indigo)
                    .accessibilityLabel("Curriculum progress")
                Label("Offline bundle ready", systemImage: "checkmark.circle")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .padding(.vertical, 4)
        }
    }

    @ViewBuilder
    private var appearanceSection: some View {
        Section("Appearance & Reading") {
            Picker("Theme", selection: $readerSettings.readerColorScheme) {
                Text("System").tag("system")
                Text("Light").tag("light")
                Text("Dark").tag("dark")
            }
            .pickerStyle(.segmented)

            Picker("Font style", selection: $readerSettings.fontTheme) {
                Text("Serif").tag("serif")
                Text("Sans-Serif").tag("sans")
            }
            .pickerStyle(.segmented)

            HStack {
                Label("Text size", systemImage: "textformat.size")
                Spacer()
                Button {
                    if readerSettings.fontSize > 14 {
                        readerSettings.fontSize -= 1
                    }
                } label: {
                    Image(systemName: "minus.circle.fill")
                        .font(.title3)
                        .foregroundStyle(readerSettings.fontSize <= 14 ? Color.secondary.opacity(0.4) : Color.indigo)
                }
                .buttonStyle(.plain)
                .disabled(readerSettings.fontSize <= 14)
                .accessibilityLabel("Decrease text size")

                Text("\(Int(readerSettings.fontSize)) pt")
                    .font(.subheadline.monospacedDigit().weight(.semibold))
                    .frame(minWidth: 48, alignment: .center)

                Button {
                    if readerSettings.fontSize < 30 {
                        readerSettings.fontSize += 1
                    }
                } label: {
                    Image(systemName: "plus.circle.fill")
                        .font(.title3)
                        .foregroundStyle(readerSettings.fontSize >= 30 ? Color.secondary.opacity(0.4) : Color.indigo)
                }
                .buttonStyle(.plain)
                .disabled(readerSettings.fontSize >= 30)
                .accessibilityLabel("Increase text size")
            }

            Button {
                showingReaderSettings = true
            } label: {
                Label("Reading appearance", systemImage: "slider.horizontal.3")
            }
        }
    }

    @ViewBuilder
    private var syncSection: some View {
        Section("Sync") {
            if syncClient.isAuthenticated {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Signed in as")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        Text(syncClient.userEmail ?? "")
                            .font(.headline)
                    }
                    Spacer()
                    StatusPill(syncClient.isOnline ? "online" : "offline", tint: syncClient.isOnline ? .green : .orange)
                }
                .padding(.vertical, 4)

                AccountMetricRow(
                    title: "Last sync",
                    value: syncClient.lastSyncedAt.map { relativeDate($0) } ?? "Never",
                    systemImage: "clock.arrow.circlepath"
                )

                if isSyncing {
                    HStack {
                        Spacer()
                        ProgressView("Syncing progress...")
                        Spacer()
                    }
                    .padding(.vertical, 8)
                } else {
                    Button {
                        performSync()
                    } label: {
                        Label("Sync Now", systemImage: "arrow.triangle.2.circlepath")
                    }
                    .disabled(!syncClient.isOnline || isSigningOut || isDeletingAccount)
                }

                if isSigningOut {
                    HStack {
                        Spacer()
                        ProgressView("Signing out...")
                        Spacer()
                    }
                    .padding(.vertical, 8)
                } else {
                    Button(role: .destructive) {
                        accountAction = .signOut
                    } label: {
                        Label("Sign Out", systemImage: "power")
                    }
                    .disabled(isDeletingAccount || isSyncing)
                }

                if isDeletingAccount {
                    HStack {
                        Spacer()
                        ProgressView("Deleting account...")
                        Spacer()
                    }
                    .padding(.vertical, 8)
                } else {
                    Button(role: .destructive) {
                        accountAction = .delete
                    } label: {
                        Label("Delete Account & Synced Progress", systemImage: "person.crop.circle.badge.xmark")
                    }
                    .disabled(!syncClient.isOnline || isSigningOut || isSyncing)
                }
            } else {
                VStack(spacing: 10) {
                    HStack {
                        Label(syncClient.isOnline ? "Online" : "Offline", systemImage: syncClient.isOnline ? "wifi" : "wifi.slash")
                            .foregroundStyle(syncClient.isOnline ? .green : .orange)
                        Spacer()
                    }

                    if syncClient.availableSocialProviders.contains(.google) {
                        Button {
                            performGoogleSignIn()
                        } label: {
                            Label("Continue with Google", systemImage: "globe")
                                .frame(maxWidth: .infinity, minHeight: 44)
                        }
                        .buttonStyle(.bordered)
                        .disabled(isSigningIn || !syncClient.isOnline)
                    }

                    if syncClient.availableSocialProviders.contains(.apple) {
                        SignInWithAppleButton(.continue) { request in
                            syncClient.prepareAppleSignIn(request)
                        } onCompletion: { result in
                            performAppleSignIn(result)
                        }
                        .signInWithAppleButtonStyle(colorScheme == .dark ? .white : .black)
                        .frame(height: 44)
                        .disabled(isSigningIn || !syncClient.isOnline)
                    }

                    if !syncClient.availableSocialProviders.isEmpty {
                        HStack {
                            Rectangle().frame(height: 1).foregroundStyle(.tertiary)
                            Text("or use email")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            Rectangle().frame(height: 1).foregroundStyle(.tertiary)
                        }
                        .padding(.vertical, 4)
                    }

                    TextField("Email", text: $email)
                        .textFieldStyle(.roundedBorder)
                        .textInputAutocapitalization(.none)
                        .autocorrectionDisabled(true)
                        .keyboardType(.emailAddress)
                        .textContentType(.username)
                        .submitLabel(.next)
                        .focused($focusedField, equals: .email)
                        .onSubmit { focusedField = .password }

                    SecureField("Password", text: $password)
                        .textFieldStyle(.roundedBorder)
                        .textContentType(.password)
                        .submitLabel(.go)
                        .focused($focusedField, equals: .password)
                        .onSubmit {
                            if canSignIn {
                                performSignIn()
                            }
                        }
                    
                    if isSigningIn {
                        ProgressView()
                            .padding(.top, 5)
                    } else {
                        Button {
                            performSignIn()
                        } label: {
                            Text("Sign In")
                                .bold()
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.borderedProminent)
                        .tint(.indigo)
                        .disabled(!canSignIn)
                        .padding(.top, 5)
                    }

                    ViewThatFits(in: .horizontal) {
                        HStack(spacing: 16) {
                            accountLinks
                        }
                        VStack(alignment: .leading, spacing: 0) {
                            accountLinks
                        }
                    }
                    .font(.caption)
                    .padding(.top, 4)
                }
                .padding(.vertical, 8)
            }

            Text("Sync covers lessons read, passed theory quizzes, and your personal plan. Bookmarks, notes, mastery attempts, and weekly checks stay on this device until you reset progress or sign out.")
                .font(.caption)
                .foregroundStyle(.secondary)

            if let errorMessage {
                Text(errorMessage)
                    .font(.caption)
                    .foregroundStyle(.red)
            }

            if let successMessage {
                Text(successMessage)
                    .font(.caption)
                    .foregroundStyle(.green)
            }
        }
    }

    @ViewBuilder
    private var progressSection: some View {
        Section("Progress") {
            AccountMetricRow(title: "Theory quizzes", value: "\(progressStore.theoryQuizResults.values.filter { $0.passed }.count)/\(dataService.theoryQuizzes.count)", systemImage: "checklist.checked")
            AccountMetricRow(title: "Mastery checks", value: "\(progressStore.masteryQuizResults.values.filter { $0.passed }.count)", systemImage: "seal.fill")
            AccountMetricRow(title: "Weekly checks", value: "\(progressStore.sectionQuizResults.values.filter { $0.passed }.count)", systemImage: "checklist.checked")
            AccountMetricRow(title: "Bookmarks", value: "\(progressStore.bookmarkedLessonSlugs.count)", systemImage: "bookmark.fill")
            AccountMetricRow(title: "Notes", value: "\(progressStore.notes.count)", systemImage: "note.text")
        }
    }

    @ViewBuilder
    private var learningPlanSection: some View {
        if let learningPlan {
            Section("Learning plan") {
                AccountMetricRow(title: learningPlan.track.title, value: "\(learningPlan.weeks.count) weeks", systemImage: "calendar")
                AccountMetricRow(
                    title: "Lessons completed",
                    value: "\(learningPlan.lessons.filter { progressStore.isRead($0.slug) }.count)/\(learningPlan.lessons.count)",
                    systemImage: "checkmark.circle"
                )
                Button {
                    NotificationCenter.default.post(name: Notification.Name("OpenLearningPlan"), object: nil)
                } label: {
                    Label("Open Plan", systemImage: "arrow.right.circle")
                }
            }
        }
    }

    @ViewBuilder
    private var bundleSection: some View {
        Section("Bundle") {
            AccountMetricRow(title: "Lessons", value: "\(dataService.lessons.count)", systemImage: "book.closed.fill")
            AccountMetricRow(title: "Glossary", value: "\(dataService.glossary.count)", systemImage: "text.book.closed.fill")
            if let manifest = dataService.manifest {
                AccountMetricRow(title: "Images", value: "\(manifest.copiedImageCount)", systemImage: "photo.stack.fill")
                AccountMetricRow(title: "Generated", value: shortDate(manifest.generatedAt), systemImage: "calendar")
            }
        }
    }

    @ViewBuilder
    private var aboutSection: some View {
        Section("About") {
            Link("Privacy policy", destination: URL(string: "https://leetllm.com/privacy")!)
            Link("Terms of use", destination: URL(string: "https://leetllm.com/terms")!)
            AccountMetricRow(title: "Version", value: Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "", systemImage: "info.circle")
        }
    }

    @ViewBuilder
    private var resetSection: some View {
        Section {
            Button(role: .destructive) {
                accountAction = .reset
            } label: {
                Label("Reset Local Progress", systemImage: "trash")
            }
            .disabled(isSyncing || isSigningOut || isDeletingAccount || isSigningIn)
        }
    }

    private func performSignIn() {
        guard canSignIn else { return }
        focusedField = nil
        isSigningIn = true
        errorMessage = nil
        successMessage = nil
        
        Task {
            do {
                try await syncClient.signIn(email: email.trimmingCharacters(in: .whitespacesAndNewlines), password: password)
                email = ""
                password = ""
                performSync()
            } catch {
                errorMessage = error.localizedDescription
            }
            isSigningIn = false
        }
    }

    private func performGoogleSignIn() {
        guard !isSigningIn else { return }
        isSigningIn = true
        errorMessage = nil
        successMessage = nil

        Task {
            do {
                try await syncClient.signInWithGoogle()
                performSync()
            } catch {
                errorMessage = error.localizedDescription
            }
            isSigningIn = false
        }
    }

    private func performAppleSignIn(_ result: Result<ASAuthorization, Error>) {
        guard !isSigningIn else { return }
        isSigningIn = true
        errorMessage = nil
        successMessage = nil

        Task {
            do {
                guard let credential = try result.get().credential as? ASAuthorizationAppleIDCredential else {
                    throw SyncClientError.networkError("Apple did not return a valid credential.")
                }
                try await syncClient.signInWithApple(credential)
                performSync()
            } catch {
                errorMessage = error.localizedDescription
            }
            isSigningIn = false
        }
    }

    private func performSync() {
        guard !isSyncing, !isSigningOut, !isDeletingAccount else { return }
        isSyncing = true
        errorMessage = nil
        successMessage = nil
        
        syncTask = Task {
            do {
                let summary = try await syncClient.sync(
                    progressStore: progressStore,
                    learningPlanConfiguration: dataService.learningPlanConfiguration
                )
                successMessage = summary.message
            } catch is CancellationError {
            } catch {
                if !Task.isCancelled {
                    errorMessage = error.localizedDescription
                }
            }
            isSyncing = false
            syncTask = nil
        }
    }

    private func performSignOut() {
        guard !isSigningOut else { return }
        isSigningOut = true
        errorMessage = nil
        successMessage = nil
        let activeSyncTask = syncTask
        activeSyncTask?.cancel()

        Task {
            await activeSyncTask?.value
            await syncClient.signOut()
            progressStore.resetAll()
            successMessage = "Signed out and cleared local progress."
            isSigningOut = false
            if syncClient.isOnline && syncClient.availableSocialProviders.isEmpty {
                await syncClient.refreshProviderAvailability()
            }
        }
    }

    private func performDeleteAccount() {
        guard !isDeletingAccount else { return }
        isDeletingAccount = true
        errorMessage = nil
        successMessage = nil
        let activeSyncTask = syncTask
        let leetyAccountID = syncClient.userID ?? syncClient.userEmail?.lowercased()
        activeSyncTask?.cancel()
        
        Task {
            await activeSyncTask?.value
            do {
                try await syncClient.deleteAccount()
                if let leetyAccountID {
                    LeetyConversationStore.clearAll(accountID: leetyAccountID)
                }
                progressStore.resetAll()
                successMessage = "Your account and synced progress have been permanently deleted."
            } catch {
                errorMessage = error.localizedDescription
            }
            isDeletingAccount = false
        }
    }

    @ViewBuilder
    private var accountLinks: some View {
        Link("Create account", destination: URL(string: "https://leetllm.com/signup")!)
            .frame(minHeight: 44)
        Link("Privacy", destination: URL(string: "https://leetllm.com/privacy")!)
            .frame(minHeight: 44)
        Link("Terms", destination: URL(string: "https://leetllm.com/terms")!)
            .frame(minHeight: 44)
    }

    private func shortDate(_ value: String) -> String {
        String(value.prefix(10))
    }

    private func relativeDate(_ date: Date) -> String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .short
        return formatter.localizedString(for: date, relativeTo: Date())
    }
}

private struct AccountMetricRow: View {
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
