import AuthenticationServices
import Combine
import CryptoKit
import Foundation
import Network
import Security
import UIKit

enum SocialAuthProvider: String, CaseIterable, Hashable {
    case google
    case apple
}

enum OAuthCallbackParser {
    static func parseAuthorizationCode(_ url: URL) throws -> String {
        guard url.scheme?.lowercased() == "com.leetllm.ios",
              url.host?.lowercased() == "auth",
              url.path == "/callback" else {
            throw SyncClientError.networkError("OAuth callback URL was invalid.")
        }

        var values: [String: String] = [:]
        for item in URLComponents(url: url, resolvingAgainstBaseURL: false)?.queryItems ?? [] {
            values[item.name] = item.value
        }

        if let error = values["error_description"] ?? values["error"] {
            throw SyncClientError.apiError(error)
        }
        guard let code = values["code"], !code.isEmpty else {
            throw SyncClientError.networkError("OAuth callback did not contain an authorization code.")
        }
        return code
    }
}

enum OAuthPKCE {
    static func generateCodeVerifier() throws -> String {
        var bytes = [UInt8](repeating: 0, count: 64)
        let status = bytes.withUnsafeMutableBufferPointer { buffer in
            guard let baseAddress = buffer.baseAddress else { return errSecParam }
            return SecRandomCopyBytes(kSecRandomDefault, buffer.count, baseAddress)
        }
        guard status == errSecSuccess else {
            throw SyncClientError.networkError("Could not secure Google sign-in.")
        }
        return base64URLString(Data(bytes))
    }

    static func codeChallenge(for verifier: String) -> String {
        base64URLString(Data(SHA256.hash(data: Data(verifier.utf8))))
    }

    private static func base64URLString(_ data: Data) -> String {
        data.base64EncodedString()
            .replacingOccurrences(of: "+", with: "-")
            .replacingOccurrences(of: "/", with: "_")
            .replacingOccurrences(of: "=", with: "")
    }
}

struct SyncSummary: Equatable {
    let uploadedLessons: Int
    let uploadedQuizzes: Int
    let uploadedPlans: Int
    let mergedLessons: Int
    let mergedQuizzes: Int
    let mergedPlans: Int

    var totalChanges: Int {
        uploadedLessons + uploadedQuizzes + uploadedPlans + mergedLessons + mergedQuizzes + mergedPlans
    }

    var message: String {
        guard totalChanges > 0 else {
            return "Progress already up to date."
        }
        return "Synced \(totalChanges) changes: \(uploadedLessons) lessons uploaded, \(uploadedQuizzes) quizzes uploaded, \(uploadedPlans) plans uploaded, \(mergedLessons) lessons restored, \(mergedQuizzes) quizzes restored, \(mergedPlans) plans restored."
    }
}

@MainActor
protocol SyncClient: ObservableObject {
    var isAuthenticated: Bool { get }
    var userID: String? { get }
    var userEmail: String? { get }
    var isOnline: Bool { get }
    var lastSyncedAt: Date? { get }
    var availableSocialProviders: Set<SocialAuthProvider> { get }
    func signIn(email: String, password: String) async throws
    func signInWithGoogle() async throws
    func prepareAppleSignIn(_ request: ASAuthorizationAppleIDRequest)
    func signInWithApple(_ credential: ASAuthorizationAppleIDCredential) async throws
    func refreshProviderAvailability() async
    func signOut() async
    func data(forAuthenticatedRequest request: URLRequest) async throws -> (Data, HTTPURLResponse)
    func sync(progressStore: ProgressStore, learningPlanConfiguration: LearningPlanConfiguration?) async throws -> SyncSummary
    func deleteAccount() async throws
}

@MainActor
final class PersistentSyncClient: SyncClient, ObservableObject {
    static let shared = PersistentSyncClient()

    @Published private(set) var isAuthenticated: Bool = false
    @Published private(set) var userID: String? = nil
    @Published private(set) var userEmail: String? = nil
    @Published private(set) var isOnline: Bool = true
    @Published private(set) var lastSyncedAt: Date? = nil
    @Published private(set) var availableSocialProviders: Set<SocialAuthProvider> = []

    private let supabaseURL = "https://ofszhffsiduopulardkg.supabase.co"
    private let supabaseAnonKey = "sb_publishable_V3ypGIDT6S2k5jIuCyQ3Ww_kLLLfAEj"
    private let baseURL = "https://leetllm.com"
    private let monitor = NWPathMonitor()
    private let monitorQueue = DispatchQueue(label: "com.leetllm.sync.network")
    private let sessionStore = KeychainSessionStore(service: "com.leetllm.ios.auth")
    private let webAuthContextProvider = WebAuthenticationContextProvider()
    private var webAuthSession: ASWebAuthenticationSession?
    private var pendingGoogleCodeVerifier: String?
    private var pendingAppleNonce: String?

    private init() {
        migrateLegacySessionIfNeeded()
        userID = sessionStore.accessToken.flatMap(Self.userID(fromAccessToken:))
        userEmail = UserDefaults.standard.string(forKey: DefaultsKeys.userEmail)
        lastSyncedAt = UserDefaults.standard.object(forKey: DefaultsKeys.lastSyncedAt) as? Date
        isAuthenticated = sessionStore.accessToken != nil
        startNetworkMonitor()
    }

    func signIn(email: String, password: String) async throws {
        guard isOnline else {
            throw SyncClientError.offline
        }

        let url = URL(string: "\(supabaseURL)/auth/v1/token?grant_type=password")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue(supabaseAnonKey, forHTTPHeaderField: "apikey")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let body: [String: String] = [
            "email": email,
            "password": password
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw SyncClientError.networkError("Invalid server response.")
        }

        guard httpResponse.statusCode == 200 else {
            throw SyncClientError.apiError(apiMessage(from: data, fallback: "Authentication failed (Status \(httpResponse.statusCode))."))
        }

        guard let token = try? JSONDecoder().decode(AuthTokenResponse.self, from: data) else {
            throw SyncClientError.networkError("Could not parse access token.")
        }

        storeSession(token, fallbackEmail: email)
    }

    func refreshProviderAvailability() async {
        guard isOnline else { return }
        let url = URL(string: "\(supabaseURL)/auth/v1/settings")!
        var request = URLRequest(url: url)
        request.setValue(supabaseAnonKey, forHTTPHeaderField: "apikey")

        guard let (data, response) = try? await URLSession.shared.data(for: request),
              let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200,
              let settings = try? JSONDecoder().decode(AuthSettings.self, from: data) else { return }

        availableSocialProviders = Set(SocialAuthProvider.allCases.filter { settings.external[$0.rawValue] == true })
    }

    func signInWithGoogle() async throws {
        guard isOnline else { throw SyncClientError.offline }
        guard availableSocialProviders.contains(.google) else {
            throw SyncClientError.providerUnavailable("Google")
        }
        guard pendingGoogleCodeVerifier == nil else {
            throw SyncClientError.networkError("Google sign-in is already in progress.")
        }

        let codeVerifier = try OAuthPKCE.generateCodeVerifier()
        pendingGoogleCodeVerifier = codeVerifier
        defer { pendingGoogleCodeVerifier = nil }

        var components = URLComponents(string: "\(supabaseURL)/auth/v1/authorize")!
        components.queryItems = [
            URLQueryItem(name: "provider", value: SocialAuthProvider.google.rawValue),
            URLQueryItem(name: "redirect_to", value: "\(baseURL)/auth/callback/ios"),
            URLQueryItem(name: "code_challenge", value: OAuthPKCE.codeChallenge(for: codeVerifier)),
            URLQueryItem(name: "code_challenge_method", value: "s256"),
        ]
        guard let authorizationURL = components.url else {
            throw SyncClientError.networkError("Could not create Google sign-in URL.")
        }

        let callbackURL = try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<URL, Error>) in
            let session = ASWebAuthenticationSession(
                url: authorizationURL,
                callbackURLScheme: "com.leetllm.ios"
            ) { [weak self] url, error in
                Task { @MainActor in
                    self?.webAuthSession = nil
                    if let error {
                        continuation.resume(throwing: error)
                    } else if let url {
                        continuation.resume(returning: url)
                    } else {
                        continuation.resume(throwing: SyncClientError.networkError("Google sign-in returned no session."))
                    }
                }
            }
            session.presentationContextProvider = webAuthContextProvider
            session.prefersEphemeralWebBrowserSession = false
            webAuthSession = session
            if !session.start() {
                webAuthSession = nil
                continuation.resume(throwing: SyncClientError.networkError("Could not open Google sign-in."))
            }
        }

        let authorizationCode = try OAuthCallbackParser.parseAuthorizationCode(callbackURL)
        guard let pendingGoogleCodeVerifier else {
            throw SyncClientError.networkError("Google sign-in session expired. Please try again.")
        }
        let token = try await exchangeAuthorizationCode(
            authorizationCode,
            codeVerifier: pendingGoogleCodeVerifier
        )
        storeSession(token, fallbackEmail: token.user?.email)
    }

    func prepareAppleSignIn(_ request: ASAuthorizationAppleIDRequest) {
        let nonce = UUID().uuidString + UUID().uuidString
        pendingAppleNonce = nonce
        request.requestedScopes = [.email, .fullName]
        request.nonce = SHA256.hash(data: Data(nonce.utf8)).map { String(format: "%02x", $0) }.joined()
    }

    func signInWithApple(_ credential: ASAuthorizationAppleIDCredential) async throws {
        guard isOnline else { throw SyncClientError.offline }
        guard availableSocialProviders.contains(.apple) else {
            throw SyncClientError.providerUnavailable("Apple")
        }
        guard let nonce = pendingAppleNonce else {
            throw SyncClientError.networkError("Apple sign-in session expired. Please try again.")
        }
        pendingAppleNonce = nil
        guard let identityToken = credential.identityToken.flatMap({ String(data: $0, encoding: .utf8) }) else {
            throw SyncClientError.networkError("Apple did not return an identity token.")
        }

        let url = URL(string: "\(supabaseURL)/auth/v1/token?grant_type=id_token")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue(supabaseAnonKey, forHTTPHeaderField: "apikey")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: [
            "provider": SocialAuthProvider.apple.rawValue,
            "id_token": identityToken,
            "nonce": nonce,
        ])

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw SyncClientError.networkError("Invalid server response.")
        }
        guard httpResponse.statusCode == 200 else {
            throw SyncClientError.apiError(apiMessage(from: data, fallback: "Apple sign-in failed (Status \(httpResponse.statusCode))."))
        }
        guard let token = try? JSONDecoder().decode(AuthTokenResponse.self, from: data) else {
            throw SyncClientError.networkError("Could not parse Apple session.")
        }

        storeSession(token, fallbackEmail: credential.email)
        if let metadata = appleNameMetadata(credential.fullName) {
            try? await updateUserMetadata(metadata, accessToken: token.accessToken)
        }
    }

    func signOut() async {
        clearSession()
    }

    func data(forAuthenticatedRequest request: URLRequest) async throws -> (Data, HTTPURLResponse) {
        try await data(forAuthenticatedRequest: request, using: .shared)
    }

    func refreshPrivateBlogs(in dataService: DataService) async {
        await dataService.refreshPrivateBlogs(
            accountID: isAuthenticated ? userID : nil,
            userEmail: userEmail
        ) {
            let configuration = URLSessionConfiguration.ephemeral
            configuration.urlCache = nil
            configuration.requestCachePolicy = .reloadIgnoringLocalCacheData
            let session = URLSession(configuration: configuration)
            defer { session.invalidateAndCancel() }
            var request = URLRequest(url: URL(string: "\(self.baseURL)/api/ios/private-blogs")!, timeoutInterval: 60)
            request.setValue("application/json", forHTTPHeaderField: "Accept")
            request.setValue("no-store", forHTTPHeaderField: "Cache-Control")
            let (data, response) = try await self.data(forAuthenticatedRequest: request, using: session)
            guard response.statusCode == 200 else {
                throw SyncClientError.apiError("Private articles are unavailable.")
            }
            return try JSONDecoder().decode(PrivateBlogResponse.self, from: data)
        }
    }

    private func data(forAuthenticatedRequest request: URLRequest, using session: URLSession) async throws -> (Data, HTTPURLResponse) {
        guard isAuthenticated else {
            throw SyncClientError.notAuthenticated
        }
        guard isOnline else {
            throw SyncClientError.offline
        }

        var authenticatedRequest = request
        authenticatedRequest.setValue("Bearer \(try await validAccessToken())", forHTTPHeaderField: "Authorization")
        var (data, response) = try await session.data(for: authenticatedRequest)
        guard var httpResponse = response as? HTTPURLResponse else {
            throw SyncClientError.networkError("Invalid server response.")
        }

        if httpResponse.statusCode == 401, let refreshToken = sessionStore.refreshToken {
            authenticatedRequest.setValue("Bearer \(try await refreshAccessToken(refreshToken))", forHTTPHeaderField: "Authorization")
            (data, response) = try await session.data(for: authenticatedRequest)
            guard let refreshedResponse = response as? HTTPURLResponse else {
                throw SyncClientError.networkError("Invalid server response.")
            }
            httpResponse = refreshedResponse
        }

        if httpResponse.statusCode == 401 {
            clearSession()
            throw SyncClientError.sessionExpired
        }
        return (data, httpResponse)
    }

    func deleteAccount() async throws {
        guard isAuthenticated else {
            throw SyncClientError.notAuthenticated
        }
        guard isOnline else {
            throw SyncClientError.offline
        }

        let token = try await validAccessToken()
        let url = URL(string: "\(baseURL)/api/auth/delete-account")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw SyncClientError.networkError("Invalid server response.")
        }
        if httpResponse.statusCode == 401 {
            clearSession()
            throw SyncClientError.sessionExpired
        }
        guard (200..<300).contains(httpResponse.statusCode) else {
            throw SyncClientError.apiError(apiMessage(from: data, fallback: "Failed to delete account (Status \(httpResponse.statusCode))."))
        }

        clearSession()
    }

    func sync(
        progressStore: ProgressStore,
        learningPlanConfiguration: LearningPlanConfiguration?
    ) async throws -> SyncSummary {
        guard isAuthenticated else {
            throw SyncClientError.notAuthenticated
        }
        guard isOnline else {
            throw SyncClientError.offline
        }

        let token = try await validAccessToken()
        async let onlineLessonsTask = fetchSlugs(endpoint: "/api/progress", token: token)
        async let onlineQuizzesTask = fetchSlugs(endpoint: "/api/practice/progress?kind=quiz", token: token)
        async let onlinePlanTask = fetchLearningPlan(token: token)
        let (onlineLessons, onlineQuizzes, onlinePlan) = try await (
            onlineLessonsTask,
            onlineQuizzesTask,
            onlinePlanTask
        )
        try Task.checkCancellation()
        let localLessons = progressStore.readLessonSlugs
        let localQuizzes = progressStore.passedTheoryQuizSlugs

        let uploadedLessons = try await uploadSlugsConcurrently(
            localLessons.subtracting(onlineLessons).sorted(),
            endpoint: "/api/progress",
            token: token
        )

        let uploadedQuizzes = try await uploadSlugsConcurrently(
            localQuizzes.subtracting(onlineQuizzes).sorted(),
            endpoint: "/api/practice/progress",
            extraFields: ["kind": "quiz"],
            token: token
        )

        var uploadedPlans = 0
        var mergedPlans = 0
        if let configuration = learningPlanConfiguration {
            let remoteSelection = onlinePlan.flatMap { selection(from: $0, configuration: configuration) }
            if let localSelection = progressStore.learningPlanSelection,
               let goal = configuration.goals.first(where: { $0.trackSlug == localSelection.trackSlug }),
               configuration.levels.contains(where: { $0.value == localSelection.level }),
               configuration.weeklyHours.contains(where: { $0.value == localSelection.weeklyHours }),
               progressStore.learningPlanNeedsSync || remoteSelection == nil {
                let answers: [String: Any] = [
                    "goal": goal.value,
                    "level": localSelection.level,
                    "weeklyHours": localSelection.weeklyHours,
                ]
                try await uploadProgress(
                    endpoint: "/api/study-state",
                    body: [
                        "action": "plan",
                        "answers": answers,
                    ],
                    token: token
                )
                try Task.checkCancellation()
                progressStore.markLearningPlanSynced()
                uploadedPlans = 1
            } else if let remoteSelection {
                try Task.checkCancellation()
                mergedPlans = progressStore.mergeRemoteLearningPlan(remoteSelection)
            }
        }

        try Task.checkCancellation()
        let mergedLessons = progressStore.mergeRemoteReadLessons(onlineLessons)
        let mergedQuizzes = progressStore.mergeRemoteTheoryQuizPasses(onlineQuizzes)
        let syncedAt = Date()
        lastSyncedAt = syncedAt
        UserDefaults.standard.set(syncedAt, forKey: DefaultsKeys.lastSyncedAt)

        return SyncSummary(
            uploadedLessons: uploadedLessons,
            uploadedQuizzes: uploadedQuizzes,
            uploadedPlans: uploadedPlans,
            mergedLessons: mergedLessons,
            mergedQuizzes: mergedQuizzes,
            mergedPlans: mergedPlans
        )
    }

    private func fetchLearningPlan(token: String) async throws -> RemoteLearningPlan? {
        let url = URL(string: "\(baseURL)/api/study-state")!
        var request = URLRequest(url: url)
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw SyncClientError.networkError("Invalid server response.")
        }
        if httpResponse.statusCode == 401 {
            clearSession()
            throw SyncClientError.sessionExpired
        }
        guard httpResponse.statusCode == 200 else {
            throw SyncClientError.apiError(apiMessage(from: data, fallback: "Failed to fetch learning plan (Status \(httpResponse.statusCode))."))
        }

        return try JSONDecoder().decode(RemoteStudyState.self, from: data).plan
    }

    private func selection(
        from plan: RemoteLearningPlan,
        configuration: LearningPlanConfiguration
    ) -> LearningPlanSelection? {
        guard let goal = configuration.goals.first(where: { $0.value == plan.goal }),
              goal.trackSlug == plan.trackSlug,
              configuration.levels.contains(where: { $0.value == plan.level }),
              configuration.weeklyHours.contains(where: { $0.value == plan.weeklyHours }) else { return nil }
        return LearningPlanSelection(trackSlug: goal.trackSlug, level: plan.level, weeklyHours: plan.weeklyHours)
    }

    private func fetchSlugs(endpoint: String, token: String) async throws -> Set<String> {
        let url = URL(string: "\(baseURL)\(endpoint)")!
        var request = URLRequest(url: url)
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw SyncClientError.networkError("Invalid server response.")
        }
        if httpResponse.statusCode == 401 {
            clearSession()
            throw SyncClientError.sessionExpired
        }
        guard httpResponse.statusCode == 200 else {
            throw SyncClientError.apiError(apiMessage(from: data, fallback: "Failed to fetch progress (Status \(httpResponse.statusCode))."))
        }

        guard let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let slugs = json["slugs"] as? [String] else {
            return []
        }
        return Set(slugs)
    }

    private func uploadSlugsConcurrently(
        _ slugs: [String],
        endpoint: String,
        extraFields: [String: String] = [:],
        token: String,
        maxConcurrency: Int = 6
    ) async throws -> Int {
        guard !slugs.isEmpty else { return 0 }
        return try await withThrowingTaskGroup(of: Void.self) { group in
            var iterator = slugs.makeIterator()
            var inFlight = 0
            var completed = 0

            while inFlight < maxConcurrency, let slug = iterator.next() {
                try Task.checkCancellation()
                var payload = extraFields
                payload["slug"] = slug
                let bodyData = try JSONSerialization.data(withJSONObject: payload)
                group.addTask {
                    try await self.uploadProgressData(endpoint: endpoint, bodyData: bodyData, token: token)
                }
                inFlight += 1
            }

            while try await group.next() != nil {
                completed += 1
                inFlight -= 1
                if let slug = iterator.next() {
                    try Task.checkCancellation()
                    var payload = extraFields
                    payload["slug"] = slug
                    let bodyData = try JSONSerialization.data(withJSONObject: payload)
                    group.addTask {
                        try await self.uploadProgressData(endpoint: endpoint, bodyData: bodyData, token: token)
                    }
                    inFlight += 1
                }
            }

            return completed
        }
    }

    private func uploadProgress(endpoint: String, body: [String: Any], token: String) async throws {
        let bodyData = try JSONSerialization.data(withJSONObject: body)
        try await uploadProgressData(endpoint: endpoint, bodyData: bodyData, token: token)
    }

    private func uploadProgressData(endpoint: String, bodyData: Data, token: String) async throws {
        let url = URL(string: "\(baseURL)\(endpoint)")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = bodyData

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw SyncClientError.networkError("Invalid server response.")
        }
        if httpResponse.statusCode == 401 {
            clearSession()
            throw SyncClientError.sessionExpired
        }
        guard (200..<300).contains(httpResponse.statusCode) else {
            throw SyncClientError.apiError(apiMessage(from: data, fallback: "Failed to upload progress (Status \(httpResponse.statusCode))."))
        }
    }

    private func exchangeAuthorizationCode(
        _ authorizationCode: String,
        codeVerifier: String
    ) async throws -> AuthTokenResponse {
        let url = URL(string: "\(supabaseURL)/auth/v1/token?grant_type=pkce")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue(supabaseAnonKey, forHTTPHeaderField: "apikey")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: [
            "auth_code": authorizationCode,
            "code_verifier": codeVerifier,
        ])

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw SyncClientError.networkError("Invalid server response.")
        }
        guard httpResponse.statusCode == 200 else {
            throw SyncClientError.apiError(
                apiMessage(
                    from: data,
                    fallback: "Google sign-in failed (Status \(httpResponse.statusCode))."
                )
            )
        }
        guard let token = try? JSONDecoder().decode(AuthTokenResponse.self, from: data) else {
            throw SyncClientError.networkError("Could not parse Google session.")
        }
        return token
    }

    private func appleNameMetadata(_ name: PersonNameComponents?) -> [String: String]? {
        guard let name else { return nil }
        let parts = [name.givenName, name.middleName, name.familyName].compactMap { $0 }
        guard !parts.isEmpty else { return nil }
        var metadata = ["full_name": parts.joined(separator: " ")]
        if let givenName = name.givenName { metadata["given_name"] = givenName }
        if let familyName = name.familyName { metadata["family_name"] = familyName }
        return metadata
    }

    private func updateUserMetadata(_ metadata: [String: String], accessToken: String) async throws {
        let url = URL(string: "\(supabaseURL)/auth/v1/user")!
        var request = URLRequest(url: url)
        request.httpMethod = "PUT"
        request.setValue(supabaseAnonKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: ["data": metadata])
        let (_, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse,
              (200..<300).contains(httpResponse.statusCode) else {
            throw SyncClientError.networkError("Could not save Apple profile name.")
        }
    }

    private func validAccessToken() async throws -> String {
        guard let accessToken = sessionStore.accessToken else {
            throw SyncClientError.notAuthenticated
        }

        if let expiresAt = UserDefaults.standard.object(forKey: DefaultsKeys.expiresAt) as? Date,
           expiresAt <= Date().addingTimeInterval(30) {
            guard let refreshToken = sessionStore.refreshToken else {
                clearSession()
                throw SyncClientError.sessionExpired
            }
            return try await refreshAccessToken(refreshToken)
        }

        return accessToken
    }

    private func refreshAccessToken(_ refreshToken: String) async throws -> String {
        let url = URL(string: "\(supabaseURL)/auth/v1/token?grant_type=refresh_token")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue(supabaseAnonKey, forHTTPHeaderField: "apikey")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: ["refresh_token": refreshToken])

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw SyncClientError.networkError("Invalid server response.")
        }
        guard httpResponse.statusCode == 200 else {
            clearSession()
            throw SyncClientError.sessionExpired
        }

        guard let token = try? JSONDecoder().decode(AuthTokenResponse.self, from: data) else {
            throw SyncClientError.networkError("Could not refresh access token.")
        }

        storeSession(token, fallbackEmail: userEmail)
        return token.accessToken
    }

    private func storeSession(_ token: AuthTokenResponse, fallbackEmail: String?) {
        sessionStore.accessToken = token.accessToken
        if let refreshToken = token.refreshToken {
            sessionStore.refreshToken = refreshToken
        }
        if let expiresIn = token.expiresIn {
            UserDefaults.standard.set(Date().addingTimeInterval(max(expiresIn - 60, 60)), forKey: DefaultsKeys.expiresAt)
        } else {
            UserDefaults.standard.removeObject(forKey: DefaultsKeys.expiresAt)
        }

        let email = token.user?.email ?? fallbackEmail
        if let email {
            UserDefaults.standard.set(email, forKey: DefaultsKeys.userEmail)
        }

        let nextUserID = token.user?.id ?? Self.userID(fromAccessToken: token.accessToken)
        if nextUserID != userID || email != userEmail {
            DataService.shared.clearPrivateBlogs()
        }
        userID = nextUserID
        userEmail = email
        isAuthenticated = true
    }

    private func clearSession() {
        DataService.shared.clearPrivateBlogs()
        sessionStore.clear()
        UserDefaults.standard.removeObject(forKey: DefaultsKeys.userEmail)
        UserDefaults.standard.removeObject(forKey: DefaultsKeys.expiresAt)
        UserDefaults.standard.removeObject(forKey: DefaultsKeys.lastSyncedAt)
        userID = nil
        userEmail = nil
        lastSyncedAt = nil
        isAuthenticated = false
    }

    private func migrateLegacySessionIfNeeded() {
        if sessionStore.accessToken == nil,
           let accessToken = UserDefaults.standard.string(forKey: DefaultsKeys.accessToken) {
            sessionStore.accessToken = accessToken
            if sessionStore.accessToken == accessToken {
                UserDefaults.standard.removeObject(forKey: DefaultsKeys.accessToken)
            }
        } else {
            UserDefaults.standard.removeObject(forKey: DefaultsKeys.accessToken)
        }
        if sessionStore.refreshToken == nil,
           let refreshToken = UserDefaults.standard.string(forKey: DefaultsKeys.refreshToken) {
            sessionStore.refreshToken = refreshToken
            if sessionStore.refreshToken == refreshToken {
                UserDefaults.standard.removeObject(forKey: DefaultsKeys.refreshToken)
            }
        } else {
            UserDefaults.standard.removeObject(forKey: DefaultsKeys.refreshToken)
        }
    }

    private func startNetworkMonitor() {
        #if DEBUG
        if ProcessInfo.processInfo.arguments.contains("--offline") {
            isOnline = false
            return
        }
        #endif
        monitor.pathUpdateHandler = { [weak self] path in
            Task { @MainActor in
                self?.isOnline = path.status == .satisfied
            }
        }
        monitor.start(queue: monitorQueue)
    }

    private func apiMessage(from data: Data, fallback: String) -> String {
        guard let errorObj = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            return fallback
        }
        if let message = errorObj["error_description"] as? String {
            return message
        }
        if let message = errorObj["error"] as? String {
            return message
        }
        if let message = errorObj["message"] as? String {
            return message
        }
        return fallback
    }

    private static func userID(fromAccessToken token: String) -> String? {
        let parts = token.split(separator: ".")
        guard parts.count > 1 else { return nil }
        var payload = String(parts[1])
            .replacingOccurrences(of: "-", with: "+")
            .replacingOccurrences(of: "_", with: "/")
        payload.append(String(repeating: "=", count: (4 - payload.count % 4) % 4))
        guard let data = Data(base64Encoded: payload),
              let object = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            return nil
        }
        return object["sub"] as? String
    }
}

enum SyncClientError: LocalizedError {
    case notAuthenticated
    case offline
    case sessionExpired
    case providerUnavailable(String)
    case apiError(String)
    case networkError(String)

    var errorDescription: String? {
        switch self {
        case .notAuthenticated:
            return "Please sign in to sync progress."
        case .offline:
            return "You are offline. Sync will retry when connection returns."
        case .sessionExpired:
            return "Session expired. Please sign in again."
        case .providerUnavailable(let provider):
            return "\(provider) sign-in is not configured yet."
        case .apiError(let message):
            return message
        case .networkError(let message):
            return message
        }
    }
}

private enum DefaultsKeys {
    static let accessToken = "sync_access_token"
    static let refreshToken = "sync_refresh_token"
    static let userEmail = "sync_user_email"
    static let expiresAt = "sync_token_expires_at"
    static let lastSyncedAt = "sync_last_synced_at"
}

private struct AuthTokenResponse: Decodable {
    let accessToken: String
    let refreshToken: String?
    let expiresIn: TimeInterval?
    let user: AuthUser?

    enum CodingKeys: String, CodingKey {
        case accessToken = "access_token"
        case refreshToken = "refresh_token"
        case expiresIn = "expires_in"
        case user
    }
}

private struct AuthUser: Decodable {
    let id: String?
    let email: String?
}

private struct AuthSettings: Decodable {
    let external: [String: Bool]
}

private final class WebAuthenticationContextProvider: NSObject, ASWebAuthenticationPresentationContextProviding {
    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap(\.windows)
            .first(where: \.isKeyWindow) ?? UIWindow()
    }
}

private final class KeychainSessionStore {
    private let service: String

    init(service: String) {
        self.service = service
    }

    var accessToken: String? {
        get { read(account: "access-token") }
        set { write(newValue, account: "access-token") }
    }

    var refreshToken: String? {
        get { read(account: "refresh-token") }
        set { write(newValue, account: "refresh-token") }
    }

    func clear() {
        write(nil, account: "access-token")
        write(nil, account: "refresh-token")
    }

    private func read(account: String) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne,
        ]
        var result: CFTypeRef?
        guard SecItemCopyMatching(query as CFDictionary, &result) == errSecSuccess,
              let data = result as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }

    private func write(_ value: String?, account: String) {
        let key: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
        ]
        guard let value else {
            SecItemDelete(key as CFDictionary)
            return
        }
        let attributes: [String: Any] = [
            kSecValueData as String: Data(value.utf8),
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly,
        ]
        if SecItemUpdate(key as CFDictionary, attributes as CFDictionary) == errSecItemNotFound {
            var item = key
            attributes.forEach { item[$0.key] = $0.value }
            SecItemAdd(item as CFDictionary, nil)
        }
    }
}

private struct RemoteStudyState: Decodable, Sendable {
    let plan: RemoteLearningPlan?
}

private struct RemoteLearningPlan: Decodable, Sendable {
    let goal: String
    let level: String
    let weeklyHours: Int
    let trackSlug: String
}
