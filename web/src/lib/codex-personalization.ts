import "server-only"

import type { PersonalizationTokenUsage } from "./personalization-telemetry"
import {
    boundCodexTimeoutMs,
    CodexPersonalizationError,
    disposeCodexPersonalizationRuntime,
    generateLocalCodexStructuredJson,
    isCodexErrorCode,
    isLocalCodexConfigured,
    parseCodexPersonalizationModel,
    resolveCodexRequestModel,
    type CodexMcpServer,
    type CodexPersonalizationErrorCode,
    type CodexPersonalizationModel,
    type CodexPersonalizationRoute,
    type GenerateCodexParams,
} from "./codex-runner-core"

export {
    CodexPersonalizationError,
    disposeCodexPersonalizationRuntime,
    parseCodexPersonalizationModel,
    type CodexMcpServer,
    type CodexPersonalizationErrorCode,
    type CodexPersonalizationModel,
    type CodexPersonalizationRoute,
}

interface CachedToken {
    audience: string
    token: string
    expiresAtMs: number
}

let cachedIdToken: CachedToken | null = null

function parseJwtExpiryMs(jwt: string): number {
    try {
        const parts = jwt.split(".")
        if (parts.length !== 3) return Date.now() + 5 * 60_000
        const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as { exp?: number }
        if (typeof payload.exp === "number" && Number.isFinite(payload.exp)) {
            return payload.exp * 1000
        }
    } catch {
        // Fallback to conservative 5-minute TTL if token cannot be decoded.
    }
    return Date.now() + 5 * 60_000
}

function resolveRemoteCodexRunnerUrl(): URL | null {
    const raw = process.env.CODEX_RUNNER_URL?.trim()
    if (!raw) return null
    try {
        const parsed = new URL(raw)
        if (parsed.protocol !== "https:" && parsed.hostname !== "127.0.0.1" && parsed.hostname !== "localhost") {
            return null
        }
        return parsed
    } catch {
        return null
    }
}

async function fetchCloudRunIdToken(audience: string): Promise<string> {
    if (process.env.CODEX_RUNNER_AUTH_TOKEN) {
        return process.env.CODEX_RUNNER_AUTH_TOKEN
    }

    const now = Date.now()
    if (cachedIdToken && cachedIdToken.audience === audience && cachedIdToken.expiresAtMs - 60_000 > now) {
        return cachedIdToken.token
    }

    const metadataUrl = `http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/identity?audience=${encodeURIComponent(audience)}`
    let response: Response
    try {
        response = await fetch(metadataUrl, {
            headers: { "Metadata-Flavor": "Google" },
            signal: AbortSignal.timeout(5_000),
        })
    } catch {
        throw new CodexPersonalizationError("unavailable")
    }

    if (!response.ok) {
        throw new CodexPersonalizationError("unavailable")
    }
    const token = (await response.text()).trim()
    if (!token) {
        throw new CodexPersonalizationError("unavailable")
    }

    cachedIdToken = {
        audience,
        token,
        expiresAtMs: parseJwtExpiryMs(token),
    }
    return token
}

export function resetCodexRemoteTokenCacheForTests() {
    cachedIdToken = null
}

export async function isCodexPersonalizationConfigured() {
    if (resolveRemoteCodexRunnerUrl()) return true
    return isLocalCodexConfigured()
}

async function generateRemoteCodexStructuredJson<T>(
    remoteUrl: URL,
    params: GenerateCodexParams,
): Promise<{
    value: T
    usage: PersonalizationTokenUsage | undefined
    providerModelId: string
}> {
    const model = resolveCodexRequestModel(params.route, params.model)
    const boundedTimeoutMs = boundCodexTimeoutMs(params.timeoutMs)
    const effectiveDeadlineAt = params.deadlineAt ?? Date.now() + boundedTimeoutMs
    const remainingMs = Math.min(boundedTimeoutMs, effectiveDeadlineAt - Date.now())
    if (remainingMs <= 0) {
        throw new CodexPersonalizationError("timeout")
    }

    const endpoint = new URL("/generate", remoteUrl.origin)
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    }
    if (remoteUrl.protocol === "https:" || process.env.CODEX_RUNNER_AUTH_TOKEN) {
        const token = await fetchCloudRunIdToken(remoteUrl.origin)
        headers.Authorization = `Bearer ${token}`
    }

    const fetchTimeoutMs = remainingMs + 10_000
    let response: Response
    try {
        response = await fetch(endpoint, {
            method: "POST",
            headers,
            body: JSON.stringify({
                model: model.routeId,
                systemInstruction: params.systemInstruction,
                prompt: params.prompt,
                schema: params.schema,
                maxOutputTokens: params.maxOutputTokens,
                timeoutMs: remainingMs,
                mcpServers: params.mcpServers ?? [],
                stableWorkspaceId: params.stableWorkspaceId,
            }),
            signal: AbortSignal.timeout(fetchTimeoutMs),
        })
    } catch (error) {
        if (error instanceof DOMException && (error.name === "TimeoutError" || error.name === "AbortError")) {
            throw new CodexPersonalizationError("timeout")
        }
        throw new CodexPersonalizationError("unavailable")
    }

    let payload: unknown
    try {
        payload = await response.json()
    } catch {
        payload = null
    }

    if (!response.ok) {
        const errorCode = payload && typeof payload === "object" && "errorCode" in payload
            ? (payload as { errorCode?: unknown }).errorCode
            : undefined
        if (isCodexErrorCode(errorCode)) {
            throw new CodexPersonalizationError(errorCode)
        }
        if (response.status === 429) throw new CodexPersonalizationError("rate_limited")
        if (response.status === 504) throw new CodexPersonalizationError("timeout")
        if (response.status === 401 || response.status === 403) throw new CodexPersonalizationError("auth")
        throw new CodexPersonalizationError("unavailable")
    }

    if (!payload || typeof payload !== "object" || !("value" in payload)) {
        throw new CodexPersonalizationError("invalid_response")
    }
    const { value, usage, providerModelId } = payload as {
        value: T
        usage?: PersonalizationTokenUsage
        providerModelId?: string
    }
    params.onUsage?.(usage)
    return {
        value,
        usage,
        providerModelId: params.route?.id ?? providerModelId ?? model.routeId,
    }
}

export async function generateCodexStructuredJson<T>(
    params: GenerateCodexParams,
): Promise<{
    value: T
    usage: PersonalizationTokenUsage | undefined
    providerModelId: string
}> {
    const remoteUrl = resolveRemoteCodexRunnerUrl()
    if (remoteUrl) {
        return generateRemoteCodexStructuredJson<T>(remoteUrl, params)
    }
    return generateLocalCodexStructuredJson<T>(params)
}
