import SwiftUI
import UIKit

@main
struct LeetLLMApp: App {
    @StateObject private var dataService = DataService.shared
    @StateObject private var progressStore = ProgressStore.shared
    @StateObject private var readerSettings = ReaderSettings.shared
    @StateObject private var syncClient = PersistentSyncClient.shared

    var body: some Scene {
        WindowGroup {
            AppRootView()
                .environmentObject(dataService)
                .environmentObject(progressStore)
                .environmentObject(readerSettings)
                .environmentObject(syncClient)
                #if DEBUG && targetEnvironment(macCatalyst)
                .onAppear(perform: configureNativeCaptureWindow)
                #endif
        }
        .defaultSize(width: 1100, height: 780)
        .commands {
            CommandMenu("Navigate") {
                Button {
                    NotificationCenter.default.post(name: Notification.Name("SwitchToLearnTab"), object: nil)
                } label: {
                    Label("Learn", systemImage: "book.closed.fill")
                }
                .keyboardShortcut("1", modifiers: .command)

                Button {
                    NotificationCenter.default.post(name: Notification.Name("SwitchToPracticeTab"), object: nil)
                } label: {
                    Label("Practice", systemImage: "checklist.checked")
                }
                .keyboardShortcut("2", modifiers: .command)

                Button {
                    NotificationCenter.default.post(name: Notification.Name("SwitchToTracksTab"), object: nil)
                } label: {
                    Label("Tracks", systemImage: "map.fill")
                }
                .keyboardShortcut("3", modifiers: .command)

                Button {
                    NotificationCenter.default.post(name: Notification.Name("SwitchToGlossaryTab"), object: nil)
                } label: {
                    Label("Glossary", systemImage: "text.book.closed.fill")
                }
                .keyboardShortcut("4", modifiers: .command)

                Button {
                    NotificationCenter.default.post(name: Notification.Name("SwitchToSettingsTab"), object: nil)
                } label: {
                    Label("Settings", systemImage: "gearshape.fill")
                }
                .keyboardShortcut("5", modifiers: .command)
            }

            CommandMenu("Reader") {
                Button("Reader Settings...") {
                    NotificationCenter.default.post(name: Notification.Name("ToggleReaderSettings"), object: nil)
                }
                .keyboardShortcut("r", modifiers: [.command, .shift])

                Button("Toggle Font Style") {
                    NotificationCenter.default.post(name: Notification.Name("ToggleFontStyle"), object: nil)
                }
                .keyboardShortcut("f", modifiers: [.command, .shift])

                Divider()

                Button("Increase Text Size") {
                    NotificationCenter.default.post(name: Notification.Name("IncreaseFontSize"), object: nil)
                }
                .keyboardShortcut("=", modifiers: .command)

                Button("Decrease Text Size") {
                    NotificationCenter.default.post(name: Notification.Name("DecreaseFontSize"), object: nil)
                }
                .keyboardShortcut("-", modifiers: .command)

                Button("Reset Text Size") {
                    NotificationCenter.default.post(name: Notification.Name("ResetFontSize"), object: nil)
                }
                .keyboardShortcut("0", modifiers: .command)
            }

            CommandGroup(replacing: .help) {
                Link("LeetLLM Curriculum Web", destination: URL(string: "https://leetllm.com")!)
                Link("AI Engineering Roadmap", destination: URL(string: "https://leetllm.com/roadmap")!)
                Link("Privacy Policy", destination: URL(string: "https://leetllm.com/privacy")!)
            }
        }
    }

    #if DEBUG && targetEnvironment(macCatalyst)
    @MainActor
    private func configureNativeCaptureWindow() {
        guard ProcessInfo.processInfo.arguments.contains("--native-mac-capture-window") else { return }
        DispatchQueue.main.async {
            guard let scene = UIApplication.shared.connectedScenes.compactMap({ $0 as? UIWindowScene }).first else { return }
            print("Native capture geometry before request: \(scene.effectiveGeometry.systemFrame), content: \(scene.windows.first?.bounds ?? .zero)")
            scene.requestGeometryUpdate(.Mac(systemFrame: CGRect(x: 40, y: 40, width: 1280, height: 800))) { error in
                print("Native capture geometry request failed: \(error.localizedDescription)")
            }
        }
    }
    #endif
}
