import SwiftUI

private let leetyThinkingMessages = [
    "Following the token trail...",
    "Consulting the attention heads...",
    "Connecting the clever bits...",
    "Checking the math twice...",
    "Turning page notes into clarity...",
    "Warming up a tiny lightbulb...",
]

private struct LeetyThinkingView: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var messageIndex = Int.random(in: leetyThinkingMessages.indices)

    var body: some View {
        HStack(spacing: 9) {
            ProgressView()
                .controlSize(.small)
                .tint(.indigo)
            Text(leetyThinkingMessages[messageIndex])
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .contentTransition(.opacity)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 11)
        .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Leety is preparing an answer")
        .task(id: reduceMotion) {
            guard !reduceMotion else { return }
            while !Task.isCancelled {
                try? await Task.sleep(for: .seconds(2.6))
                guard !Task.isCancelled else { return }
                withAnimation(.easeInOut(duration: 0.25)) {
                    messageIndex = (messageIndex + 1) % leetyThinkingMessages.count
                }
            }
        }
    }
}

struct LeetyLauncher: View {
    let pathname: String
    let title: String
    let compact: Bool

    init(pathname: String, title: String, compact: Bool = false) {
        self.pathname = pathname
        self.title = title
        self.compact = compact
    }

    @ObservedObject private var syncClient = PersistentSyncClient.shared
    @State private var isPresented = false
    @State private var showSignInPrompt = false

    private var accountID: String? {
        syncClient.userID ?? syncClient.userEmail?.lowercased()
    }

    var body: some View {
        if syncClient.isAuthenticated, let accountID {
            Button {
                isPresented = true
            } label: {
                launcherLabel(locked: false)
            }
            .buttonStyle(.plain)
            .accessibilityLabel("Ask Leety about this page")
            .sheet(isPresented: $isPresented) {
                LeetyChatView(pathname: pathname, title: title, accountID: accountID)
                    .id("\(accountID):\(pathname)")
                    .presentationDetents([.large])
                    .presentationDragIndicator(.visible)
            }
            .onChange(of: syncClient.isAuthenticated) { _, isAuthenticated in
                if !isAuthenticated {
                    isPresented = false
                }
            }
            .onChange(of: syncClient.userID) { _, _ in isPresented = false }
        } else {
            Button {
                showSignInPrompt = true
            } label: {
                launcherLabel(locked: true)
            }
            .buttonStyle(.plain)
            .accessibilityLabel("Sign in to ask Leety about this page")
            .confirmationDialog("Sign in to ask Leety", isPresented: $showSignInPrompt) {
                Button("Open Settings") {
                    NotificationCenter.default.post(name: Notification.Name("SwitchToSettingsTab"), object: nil)
                }
                Button("Not now", role: .cancel) {}
            } message: {
                Text("Leety is available to signed-in readers.")
            }
        }
    }

    private func launcherLabel(locked: Bool) -> some View {
        Group {
            if compact {
                LeetyMarkView(size: 24)
                    .overlay(alignment: .bottomTrailing) {
                        if locked {
                            Image(systemName: "lock.fill")
                                .font(.system(size: 7, weight: .bold))
                                .foregroundStyle(.white)
                                .padding(2)
                                .background(.secondary, in: Circle())
                                .offset(x: 2, y: 2)
                        }
                    }
                    .frame(width: 44, height: 44)
                    .contentShape(Rectangle())
            } else {
                ViewThatFits(in: .horizontal) {
                    Label {
                        Text("Ask Leety")
                            .font(.subheadline.bold())
                    } icon: {
                        LeetyMarkView(size: 31)
                            .overlay(alignment: .bottomTrailing) {
                                if locked {
                                    Image(systemName: "lock.fill")
                                        .font(.system(size: 8, weight: .bold))
                                        .foregroundStyle(.white)
                                        .padding(4)
                                        .background(.secondary, in: Circle())
                                        .offset(x: 5, y: 5)
                                }
                            }
                    }
                    .padding(.horizontal, 14)
                    .padding(.vertical, 10)

                    LeetyMarkView(size: 34)
                        .padding(10)
                }
                .background(.ultraThinMaterial, in: Capsule())
                .overlay(Capsule().stroke(locked ? Color.secondary.opacity(0.2) : Color.indigo.opacity(0.28), lineWidth: 1))
                .shadow(color: (locked ? Color.secondary : Color.indigo).opacity(0.2), radius: 14, y: 7)
            }
        }
        .foregroundStyle(locked ? Color.secondary : Color.indigo)
    }
}

struct LeetyMarkView: View {
    let size: CGFloat

    var body: some View {
        Canvas { context, canvasSize in
            let lineScale = min(canvasSize.width, canvasSize.height) / 64
            let brain = leetyBrainPath(in: canvasSize)

            context.opacity = 0.13
            context.fill(brain, with: .foreground)
            context.opacity = 1
            context.stroke(
                brain,
                with: .foreground,
                style: StrokeStyle(lineWidth: 3.2 * lineScale, lineCap: .round, lineJoin: .round)
            )

            context.opacity = 0.58
            context.stroke(
                leetyFoldPath(in: canvasSize),
                with: .foreground,
                style: StrokeStyle(lineWidth: 2.25 * lineScale, lineCap: .round, lineJoin: .round)
            )
            context.opacity = 1

            for center in [CGPoint(x: 24.5, y: 34.2), CGPoint(x: 38.3, y: 34.2)] {
                let eye = CGRect(
                    x: (center.x - 2.35) * lineScale,
                    y: (center.y - 2.35) * lineScale,
                    width: 4.7 * lineScale,
                    height: 4.7 * lineScale
                )
                context.fill(Path(ellipseIn: eye), with: .foreground)
            }

            context.stroke(
                leetySmilePath(in: canvasSize),
                with: .foreground,
                style: StrokeStyle(lineWidth: 2.5 * lineScale, lineCap: .round, lineJoin: .round)
            )
            context.opacity = 0.82
            context.fill(leetySparkPath(in: canvasSize), with: .foreground)
        }
        .frame(width: size, height: size)
        .accessibilityHidden(true)
    }
}

private func leetyPoint(_ x: CGFloat, _ y: CGFloat, in size: CGSize) -> CGPoint {
    CGPoint(x: x * size.width / 64, y: y * size.height / 64)
}

private func leetyBrainPath(in size: CGSize) -> Path {
    var path = Path()
    path.move(to: leetyPoint(32, 10.6, in: size))
    path.addCurve(
        to: leetyPoint(19.8, 13.1, in: size),
        control1: leetyPoint(28.2, 7.5, in: size),
        control2: leetyPoint(22.2, 8.4, in: size)
    )
    path.addCurve(
        to: leetyPoint(9.5, 23.1, in: size),
        control1: leetyPoint(14.1, 13, in: size),
        control2: leetyPoint(9.5, 17.4, in: size)
    )
    path.addCurve(
        to: leetyPoint(10, 36.3, in: size),
        control1: leetyPoint(5.5, 26.3, in: size),
        control2: leetyPoint(5.7, 33.2, in: size)
    )
    path.addCurve(
        to: leetyPoint(20.7, 48.5, in: size),
        control1: leetyPoint(9.3, 42.8, in: size),
        control2: leetyPoint(14.3, 48.3, in: size)
    )
    path.addCurve(
        to: leetyPoint(33.4, 51.1, in: size),
        control1: leetyPoint(23.2, 53.2, in: size),
        control2: leetyPoint(29.3, 54.3, in: size)
    )
    path.addLine(to: leetyPoint(38.9, 56, in: size))
    path.addLine(to: leetyPoint(40, 48.6, in: size))
    path.addCurve(
        to: leetyPoint(50.2, 35.4, in: size),
        control1: leetyPoint(46.7, 47.4, in: size),
        control2: leetyPoint(51.3, 41.5, in: size)
    )
    path.addCurve(
        to: leetyPoint(51.5, 22.8, in: size),
        control1: leetyPoint(54.2, 32.6, in: size),
        control2: leetyPoint(55, 26.3, in: size)
    )
    path.addCurve(
        to: leetyPoint(40.9, 12.8, in: size),
        control1: leetyPoint(51.3, 17, in: size),
        control2: leetyPoint(46.6, 12.6, in: size)
    )
    path.addCurve(
        to: leetyPoint(32, 10.6, in: size),
        control1: leetyPoint(38.8, 8.9, in: size),
        control2: leetyPoint(34.7, 8.4, in: size)
    )
    path.closeSubpath()
    return path
}

private func leetyFoldPath(in size: CGSize) -> Path {
    var path = Path()
    path.move(to: leetyPoint(31.9, 12.8, in: size))
    path.addLine(to: leetyPoint(31.9, 23.2, in: size))

    path.move(to: leetyPoint(30.6, 15.4, in: size))
    path.addCurve(
        to: leetyPoint(23.4, 18.9, in: size),
        control1: leetyPoint(27.3, 13.3, in: size),
        control2: leetyPoint(23.2, 15.3, in: size)
    )
    path.addCurve(
        to: leetyPoint(17.1, 24.8, in: size),
        control1: leetyPoint(19.4, 18.3, in: size),
        control2: leetyPoint(16.5, 21.2, in: size)
    )

    path.move(to: leetyPoint(14.6, 30.1, in: size))
    path.addCurve(
        to: leetyPoint(22.9, 29.6, in: size),
        control1: leetyPoint(16.7, 27.5, in: size),
        control2: leetyPoint(20.5, 27.3, in: size)
    )

    path.move(to: leetyPoint(33.2, 15.4, in: size))
    path.addCurve(
        to: leetyPoint(40.4, 18.9, in: size),
        control1: leetyPoint(36.5, 13.3, in: size),
        control2: leetyPoint(40.6, 15.3, in: size)
    )
    path.addCurve(
        to: leetyPoint(46.7, 24.8, in: size),
        control1: leetyPoint(44.4, 18.3, in: size),
        control2: leetyPoint(47.3, 21.2, in: size)
    )

    path.move(to: leetyPoint(49.2, 30.1, in: size))
    path.addCurve(
        to: leetyPoint(40.9, 29.6, in: size),
        control1: leetyPoint(47.1, 27.5, in: size),
        control2: leetyPoint(43.3, 27.3, in: size)
    )
    return path
}

private func leetySmilePath(in size: CGSize) -> Path {
    var path = Path()
    path.move(to: leetyPoint(24.8, 40, in: size))
    path.addCurve(
        to: leetyPoint(38.3, 40, in: size),
        control1: leetyPoint(28.2, 45.5, in: size),
        control2: leetyPoint(34.9, 45.5, in: size)
    )
    return path
}

private func leetySparkPath(in size: CGSize) -> Path {
    var path = Path()
    path.move(to: leetyPoint(51.5, 3, in: size))
    path.addLine(to: leetyPoint(53.6, 8.4, in: size))
    path.addLine(to: leetyPoint(59, 10.5, in: size))
    path.addLine(to: leetyPoint(53.6, 12.6, in: size))
    path.addLine(to: leetyPoint(51.5, 18, in: size))
    path.addLine(to: leetyPoint(49.4, 12.6, in: size))
    path.addLine(to: leetyPoint(44, 10.5, in: size))
    path.addLine(to: leetyPoint(49.4, 8.4, in: size))
    path.closeSubpath()
    return path
}

private struct LeetyChatView: View {
    @StateObject private var conversation: LeetyConversation
    @State private var draft = ""
    @State private var confirmReset = false
    @FocusState private var composerFocused: Bool
    @Environment(\.dismiss) private var dismiss
    @Environment(\.scenePhase) private var scenePhase

    init(pathname: String, title: String, accountID: String) {
        _conversation = StateObject(wrappedValue: LeetyConversation(
            pathname: pathname,
            title: title,
            accountID: accountID
        ))
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                messages
                Divider()
                composer
            }
            .navigationTitle("Leety")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button {
                        confirmReset = true
                    } label: {
                        Image(systemName: "arrow.counterclockwise")
                    }
                    .disabled(conversation.messages.isEmpty && !conversation.isSending)
                    .accessibilityLabel("Start over")
                }
                ToolbarItem(placement: .principal) {
                    HStack(spacing: 9) {
                        LeetyMarkView(size: 30)
                            .foregroundStyle(.indigo)
                        VStack(alignment: .leading, spacing: 1) {
                            Text("Leety")
                                .font(.headline)
                            Text(conversation.pageTitle ?? conversation.fallbackTitle)
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                                .lineLimit(1)
                        }
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button {
                        dismiss()
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
            .confirmationDialog("Start a new conversation?", isPresented: $confirmReset) {
                Button("Start over", role: .destructive) {
                    conversation.reset()
                    draft = ""
                }
                Button("Keep conversation", role: .cancel) {}
            } message: {
                Text("This clears Leety messages saved for this page.")
            }
            .onChange(of: scenePhase) { _, phase in
                if phase == .active {
                    conversation.resumeIfNeeded()
                }
            }
            .onDisappear { conversation.suspend() }
        }
    }

    private var messages: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(spacing: 14) {
                    if conversation.messages.isEmpty {
                        emptyState
                    }

                    ForEach(conversation.messages) { message in
                        LeetyMessageView(message: message)
                            .id(message.id)
                    }

                    if conversation.isSending {
                        HStack {
                            LeetyThinkingView()
                            Spacer(minLength: 44)
                        }
                    }

                    if let connectionMessage = conversation.connectionMessage, !conversation.isSending {
                        HStack {
                            HStack(alignment: .top, spacing: 10) {
                                Image(systemName: "wifi.exclamationmark")
                                    .foregroundStyle(.indigo)
                                VStack(alignment: .leading, spacing: 9) {
                                    Text(connectionMessage)
                                        .font(.subheadline)
                                    if conversation.canResume {
                                        Button("Resume answer") {
                                            conversation.resumeIfNeeded()
                                        }
                                        .buttonStyle(.bordered)
                                        .controlSize(.small)
                                        .tint(.indigo)
                                    }
                                }
                            }
                            .padding(.horizontal, 14)
                            .padding(.vertical, 12)
                            .background(Color.indigo.opacity(0.07), in: RoundedRectangle(cornerRadius: 18, style: .continuous))
                            Spacer(minLength: 44)
                        }
                    }

                    Color.clear
                        .frame(height: 1)
                        .id("leety-bottom")
                }
                .padding()
                .frame(maxWidth: 720)
                .frame(maxWidth: .infinity)
            }
            .onChange(of: conversation.messages.count) { _, _ in
                withAnimation(.easeOut(duration: 0.2)) {
                    proxy.scrollTo("leety-bottom", anchor: .bottom)
                }
            }
            .onChange(of: conversation.isSending) { _, _ in
                withAnimation(.easeOut(duration: 0.2)) {
                    proxy.scrollTo("leety-bottom", anchor: .bottom)
                }
            }
        }
    }

    private var emptyState: some View {
        VStack(spacing: 16) {
            LeetyMarkView(size: 68)
                .foregroundStyle(.indigo)
                .padding(18)
                .background(Color.indigo.opacity(0.09), in: RoundedRectangle(cornerRadius: 28, style: .continuous))

            VStack(spacing: 7) {
                Text("Turn the hard part into your advantage")
                    .font(.title3.bold())
                    .multilineTextAlignment(.center)
                Text("Pull apart a diagram, trace an equation, pressure-test a claim, or ask for missing intuition.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }

            VStack(spacing: 8) {
                ForEach([
                    "Walk me through the hardest part",
                    "Connect this to a real system",
                    "Challenge my understanding",
                ], id: \.self) { suggestion in
                    Button(suggestion) {
                        draft = suggestion
                        composerFocused = true
                    }
                    .buttonStyle(.bordered)
                    .tint(.indigo)
                }
            }
        }
        .padding(.vertical, 34)
        .frame(maxWidth: 430)
    }

    private var composer: some View {
        VStack(spacing: 8) {
            HStack(alignment: .bottom, spacing: 10) {
                TextField("Ask about this page...", text: $draft, axis: .vertical)
                    .lineLimit(1...5)
                    .textFieldStyle(.plain)
                    .focused($composerFocused)
                    .disabled(conversation.isSending)
                    .onKeyPress(.return, phases: .down) { keyPress in
                        guard keyPress.modifiers.isEmpty else { return .ignored }
                        submit()
                        return .handled
                    }
                    .accessibilityHint("Press Return to send, or Shift-Return to add a line.")

                Button {
                    submit()
                } label: {
                    Image(systemName: conversation.isSending ? "ellipsis" : "arrow.up")
                        .font(.system(size: 15, weight: .bold))
                        .frame(width: 44, height: 44)
                        .foregroundStyle(.white)
                        .background(
                            draft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || conversation.isSending
                                ? Color.secondary.opacity(0.35)
                                : Color.indigo,
                            in: Circle()
                        )
                }
                .buttonStyle(.plain)
                .disabled(draft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || conversation.isSending)
                .accessibilityLabel("Send question")
            }
            .padding(10)
            .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 18, style: .continuous).stroke(.quaternary))

            Label("Return sends. Shift-Return adds a line.", systemImage: "keyboard")
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .padding(.horizontal)
        .padding(.top, 10)
        .padding(.bottom, 8)
        .background(.bar)
    }

    private func submit() {
        let question = draft.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !question.isEmpty, !conversation.isSending else { return }
        draft = ""
        conversation.submit(question)
    }
}

private struct LeetyMessageView: View {
    let message: LeetyChatMessage

    var body: some View {
        HStack {
            if message.role == .user {
                Spacer(minLength: 44)
            }

            VStack(alignment: .leading, spacing: 10) {
                if message.role == .assistant {
                    VStack(alignment: .leading, spacing: 8) {
                        MarkdownContentView(
                            markdown: message.content,
                            scrollPrefix: "leety-\(message.id.uuidString)"
                        )
                    }
                } else {
                    Text(message.content)
                        .font(.body)
                        .textSelection(.enabled)
                }

                if !message.sources.isEmpty {
                    Divider()
                    Text("Sources")
                        .font(.caption.bold())
                        .foregroundStyle(.secondary)
                    ForEach(message.sources, id: \.url) { source in
                        if let url = URL(string: source.url) {
                            Link(destination: url) {
                                Label(source.title, systemImage: "arrow.up.right.square")
                                    .font(.caption)
                                    .multilineTextAlignment(.leading)
                            }
                        }
                    }
                }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
            .foregroundStyle(message.role == .user ? Color.white : Color.primary)
            .background(bubbleColor, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
            .overlay {
                if message.role == .assistant {
                    RoundedRectangle(cornerRadius: 18, style: .continuous)
                        .stroke(message.isRefusal ? Color.orange.opacity(0.28) : Color.secondary.opacity(0.15))
                }
            }

            if message.role == .assistant {
                Spacer(minLength: 44)
            }
        }
    }

    private var bubbleColor: Color {
        if message.role == .user { return .indigo }
        if message.isRefusal { return .orange.opacity(0.08) }
        return Color(uiColor: .secondarySystemBackground)
    }
}
