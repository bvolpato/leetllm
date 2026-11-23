import Combine
import Foundation

enum LeetyMessageRole: String, Codable {
    case user
    case assistant
}

struct LeetySource: Codable, Hashable {
    let title: String
    let url: String
}

struct LeetyChatMessage: Codable, Identifiable, Hashable {
    let id: UUID
    let role: LeetyMessageRole
    let content: String
    let isRefusal: Bool
    let isError: Bool
    let sources: [LeetySource]

    init(
        id: UUID = UUID(),
        role: LeetyMessageRole,
        content: String,
        isRefusal: Bool = false,
        isError: Bool = false,
        sources: [LeetySource] = []
    ) {
        self.id = id
        self.role = role
        self.content = content
        self.isRefusal = isRefusal
        self.isError = isError
        self.sources = sources
    }
}

struct LeetyStoredConversation: Codable {
    let messages: [LeetyChatMessage]
    let pageTitle: String?
    let pendingRequestID: UUID?
}

enum LeetyConversationStore {
    private static let prefix = "leetllm.leety.conversation"

    static func load(accountID: String, pathname: String) -> LeetyStoredConversation {
        guard let data = UserDefaults.standard.data(forKey: key(accountID: accountID, pathname: pathname)),
              let stored = try? JSONDecoder().decode(LeetyStoredConversation.self, from: data) else {
            return LeetyStoredConversation(messages: [], pageTitle: nil, pendingRequestID: nil)
        }
        var messages = Array(stored.messages.suffix(24))
        var pendingRequestID = stored.pendingRequestID
        if let last = messages.last,
           last.isError,
           ["Load failed", "Failed to fetch", "Network request failed"].contains(last.content.trimmingCharacters(in: .whitespacesAndNewlines)) {
            messages.removeLast()
            if pendingRequestID == nil, messages.last?.role == .user {
                pendingRequestID = UUID()
            }
        }
        return LeetyStoredConversation(
            messages: messages,
            pageTitle: stored.pageTitle,
            pendingRequestID: pendingRequestID
        )
    }

    static func save(_ conversation: LeetyStoredConversation, accountID: String, pathname: String) {
        guard let data = try? JSONEncoder().encode(conversation) else { return }
        UserDefaults.standard.set(data, forKey: key(accountID: accountID, pathname: pathname))
    }

    static func clear(accountID: String, pathname: String) {
        UserDefaults.standard.removeObject(forKey: key(accountID: accountID, pathname: pathname))
    }

    static func clearAll(accountID: String) {
        let prefix = accountPrefix(accountID)
        for key in UserDefaults.standard.dictionaryRepresentation().keys where key.hasPrefix(prefix) {
            UserDefaults.standard.removeObject(forKey: key)
        }
    }

    private static func key(accountID: String, pathname: String) -> String {
        "\(accountPrefix(accountID))\(encoded(pathname))"
    }

    private static func accountPrefix(_ accountID: String) -> String {
        "\(prefix).\(encoded(accountID))."
    }

    private static func encoded(_ value: String) -> String {
        Data(value.utf8)
            .base64EncodedString()
            .replacingOccurrences(of: "/", with: "_")
            .replacingOccurrences(of: "+", with: "-")
            .replacingOccurrences(of: "=", with: "")
    }
}

@MainActor
protocol LeetyAnswerProviding {
    func answer(pathname: String, messages: [LeetyChatMessage], requestID: UUID) async throws -> LeetyResponse
}

@MainActor
final class LeetyClient: LeetyAnswerProviding {
    private let syncClient: PersistentSyncClient
    private let endpoint = URL(string: "https://leetllm.com/api/leety")!

    init(syncClient: PersistentSyncClient? = nil) {
        self.syncClient = syncClient ?? .shared
    }

    func answer(pathname: String, messages: [LeetyChatMessage], requestID: UUID) async throws -> LeetyResponse {
        var request = URLRequest(url: endpoint, timeoutInterval: 120)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.setValue("no-store", forHTTPHeaderField: "Cache-Control")
        request.httpBody = try JSONEncoder().encode(LeetyRequest(
            pathname: pathname,
            messages: requestMessages(from: messages),
            requestId: requestID.uuidString.lowercased()
        ))

        let (data, response) = try await syncClient.data(forAuthenticatedRequest: request)
        guard (200..<300).contains(response.statusCode) else {
            let error = try? JSONDecoder().decode(LeetyErrorResponse.self, from: data)
            throw LeetyClientError.server(
                error?.error ?? "Leety could not answer right now.",
                retryable: error?.retryable == true || response.statusCode == 429 || response.statusCode >= 500
            )
        }
        guard let result = try? JSONDecoder().decode(LeetyResponse.self, from: data) else {
            throw LeetyClientError.invalidResponse
        }
        return result
    }

    private func requestMessages(from messages: [LeetyChatMessage]) -> [LeetyRequestMessage] {
        var selected: [LeetyRequestMessage] = []
        var characterCount = 0
        for message in messages.filter({ !$0.isError }).reversed() {
            let content = String(message.content.prefix(4_000))
            guard characterCount + content.count <= 24_000 else { break }
            selected.append(LeetyRequestMessage(role: message.role, content: content))
            characterCount += content.count
            if selected.count == 24 { break }
        }
        return Array(selected.reversed())
    }
}

@MainActor
final class LeetyConversation: ObservableObject {
    @Published private(set) var messages: [LeetyChatMessage]
    @Published private(set) var pageTitle: String?
    @Published private(set) var isSending = false
    @Published private(set) var connectionMessage: String?

    let pathname: String
    let fallbackTitle: String

    var canResume: Bool {
        pendingRequestID != nil && !isSending
    }

    private let accountID: String
    private let client: any LeetyAnswerProviding
    private var sendTask: Task<Void, Never>?
    private var pendingRequestID: UUID?

    init(pathname: String, title: String, accountID: String, client: (any LeetyAnswerProviding)? = nil) {
        self.pathname = pathname
        fallbackTitle = title
        self.accountID = accountID
        self.client = client ?? LeetyClient()
        let stored = LeetyConversationStore.load(accountID: accountID, pathname: pathname)
        messages = stored.messages
        pageTitle = stored.pageTitle
        pendingRequestID = stored.pendingRequestID
        connectionMessage = stored.pendingRequestID == nil ? nil : "Your question is saved and ready to resume."

        if let requestID = stored.pendingRequestID {
            startSend(requestID: requestID)
        }
    }

    func submit(_ question: String) {
        let content = question.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !content.isEmpty, !isSending else { return }

        let userMessage = LeetyChatMessage(role: .user, content: String(content.prefix(4_000)))
        messages = Array((messages + [userMessage]).suffix(24))
        let requestID = UUID()
        pendingRequestID = requestID
        connectionMessage = nil
        persist()
        startSend(requestID: requestID)
    }

    func resumeIfNeeded() {
        guard let requestID = pendingRequestID, !isSending else { return }
        startSend(requestID: requestID)
    }

    private func startSend(requestID: UUID) {
        sendTask?.cancel()
        isSending = true
        connectionMessage = nil
        sendTask = Task { [weak self] in
            guard let self else { return }
            do {
                let response = try await client.answer(pathname: pathname, messages: messages, requestID: requestID)
                try Task.checkCancellation()
                pageTitle = response.pageTitle
                pendingRequestID = nil
                append(LeetyChatMessage(
                    role: .assistant,
                    content: response.answer,
                    isRefusal: response.status == "refusal",
                    sources: response.sources
                ))
            } catch is CancellationError {
                return
            } catch {
                guard !Task.isCancelled else { return }
                if error.isRetryableLeetyFailure {
                    connectionMessage = "Connection paused. Your question is saved."
                } else {
                    pendingRequestID = nil
                    connectionMessage = error.localizedDescription
                }
                persist()
            }
            isSending = false
            sendTask = nil
        }
    }

    func reset() {
        sendTask?.cancel()
        sendTask = nil
        isSending = false
        messages = []
        pageTitle = nil
        pendingRequestID = nil
        connectionMessage = nil
        LeetyConversationStore.clear(accountID: accountID, pathname: pathname)
    }

    func suspend() {
        sendTask?.cancel()
        sendTask = nil
        isSending = false
        if pendingRequestID != nil { connectionMessage = "Your question is saved and ready to resume." }
        persist()
    }

    private func append(_ message: LeetyChatMessage) {
        messages = Array((messages + [message]).suffix(24))
        persist()
    }

    private func persist() {
        LeetyConversationStore.save(
            LeetyStoredConversation(
                messages: messages,
                pageTitle: pageTitle,
                pendingRequestID: pendingRequestID
            ),
            accountID: accountID,
            pathname: pathname
        )
    }
}

struct LeetyResponse: Decodable {
    let status: String
    let answer: String
    let sources: [LeetySource]
    let pageTitle: String
}

private struct LeetyRequest: Encodable {
    let pathname: String
    let messages: [LeetyRequestMessage]
    let requestId: String
}

private struct LeetyRequestMessage: Encodable {
    let role: LeetyMessageRole
    let content: String
}

private struct LeetyErrorResponse: Decodable {
    let error: String
    let retryable: Bool?
}

enum LeetyClientError: LocalizedError {
    case server(String, retryable: Bool)
    case invalidResponse

    var errorDescription: String? {
        switch self {
        case .server(let message, _):
            return message
        case .invalidResponse:
            return "Leety returned an invalid response."
        }
    }
}

private extension Error {
    var isRetryableLeetyFailure: Bool {
        if self is URLError { return true }
        if case .offline? = self as? SyncClientError { return true }
        if case let .server(_, retryable)? = self as? LeetyClientError { return retryable }
        return false
    }
}
