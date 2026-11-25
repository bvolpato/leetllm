import "server-only"

import type { PersonalizationTokenUsage } from "./personalization-telemetry"

export const DEFAULT_PERSONALIZATION_MODELS = "codex/gpt-6-luna:high,google/gemini-3.5-flash-lite"
export const PERSONALIZATION_PROMPT_VERSION = "2026-07-23-v7"

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta"
const GEMINI_TIMEOUT_MS = 120_000
const MAX_OUTPUT_TOKENS = 65_536
const CODEX_TRANSIENT_BREAKER_MS = 15_000
const CODEX_RATE_LIMIT_BREAKER_MS = 60_000
const CODEX_CONFIGURATION_BREAKER_MS = 5 * 60_000

let codexBlockedUntil = 0

export type PersonalizationProviderName = "codex" | "google"
export type JsonSchema = Record<string, unknown>

export interface PersonalizationProviderRoute {
    provider: PersonalizationProviderName
    model: string
    reasoningEffort?: "low" | "medium" | "high" | "xhigh"
    id: string
}

export interface PersonalizationProviderPart {
    text?: string
    inlineData?: {
        mimeType: string
        data: string
    }
}

interface GeminiResponse {
    candidates?: Array<{
        content?: { parts?: PersonalizationProviderPart[] }
        finishReason?: string
    }>
    usageMetadata?: PersonalizationTokenUsage
}

export class PersonalizationProviderError extends Error {
    readonly status: number
    readonly retryable: boolean
    readonly code: string

    constructor(message: string, status = 502, retryable = false, code = "provider_unavailable") {
        super(message)
        this.name = "PersonalizationProviderError"
        this.status = status
        this.retryable = retryable
        this.code = code
    }
}

function configuredModels() {
    const configured = process.env.PERSONALIZATION_MODELS?.trim()
    if (configured) return configured

    const legacyGeminiModel = process.env.GEMINI_PERSONALIZATION_MODEL?.trim()
    return legacyGeminiModel ? `google/${legacyGeminiModel.replace(/^google\//, "")}` : DEFAULT_PERSONALIZATION_MODELS
}

export function parsePersonalizationModels(value: string): PersonalizationProviderRoute[] {
    const routes = value.split(",").map((route) => route.trim()).filter(Boolean)
    if (routes.length === 0) throw new Error("PERSONALIZATION_MODELS must contain at least one model")

    const seen = new Set<string>()
    return routes.map((route): PersonalizationProviderRoute => {
        const separator = route.indexOf("/")
        if (separator <= 0 || separator === route.length - 1) {
            throw new Error(`Invalid personalization model route: ${route}`)
        }
        const provider = route.slice(0, separator)
        const configuredModel = route.slice(separator + 1)
        if (provider !== "codex" && provider !== "google") {
            throw new Error(`Unsupported personalization provider: ${provider}`)
        }
        if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*(:[a-z]+)?$/.test(configuredModel)) {
            throw new Error(`Invalid personalization model: ${configuredModel}`)
        }
        if (seen.has(route)) throw new Error(`Duplicate personalization model route: ${route}`)
        seen.add(route)

        if (provider === "google") {
            if (configuredModel.includes(":")) throw new Error(`Google model cannot set reasoning effort: ${route}`)
            return { provider, model: configuredModel, id: route }
        }

        const effortSeparator = configuredModel.lastIndexOf(":")
        const model = effortSeparator === -1 ? configuredModel : configuredModel.slice(0, effortSeparator)
        const effort = effortSeparator === -1 ? undefined : configuredModel.slice(effortSeparator + 1)
        if (effort !== undefined && !["low", "medium", "high", "xhigh"].includes(effort)) {
            throw new Error(`Unsupported Codex reasoning effort: ${effort}`)
        }
        return {
            provider,
            model,
            ...(effort ? { reasoningEffort: effort as PersonalizationProviderRoute["reasoningEffort"] } : {}),
            id: route,
        }
    })
}

export const PERSONALIZATION_ROUTES = parsePersonalizationModels(configuredModels())
export const PERSONALIZATION_MODEL = PERSONALIZATION_ROUTES.map(({ id }) => id).join(",")

function getGeminiApiKey() {
    const apiKey = process.env.GEMINI_API_KEY
        ?.split(",")
        .map((candidate) => candidate.trim())
        .find(Boolean)
    if (!apiKey) {
        throw new PersonalizationProviderError(
            "Personalization provider is not configured",
            503,
            false,
            "provider_not_configured",
        )
    }
    return apiKey
}

function delay(milliseconds: number) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

function normalizeProviderError(error: unknown) {
    if (error instanceof PersonalizationProviderError) return error
    if (error && typeof error === "object") {
        const candidate = error as { code?: unknown; status?: unknown; retryable?: unknown }
        if (
            typeof candidate.code === "string"
            && typeof candidate.status === "number"
            && typeof candidate.retryable === "boolean"
        ) {
            const status = candidate.status === 429 ? 429 : candidate.status === 504 ? 504 : 502
            return new PersonalizationProviderError(
                status === 429
                    ? "Personalization provider is busy. Try again shortly."
                    : status === 504
                        ? "Personalization provider timed out"
                        : "Personalization provider is unavailable",
                status,
                candidate.retryable,
                `codex_${candidate.code.replace(/[^a-z0-9_]/gi, "_").toLowerCase()}`,
            )
        }
    }
    return new PersonalizationProviderError("Personalization provider is unavailable")
}

function openCodexCircuit(error: PersonalizationProviderError) {
    const duration = error.status === 429
        ? CODEX_RATE_LIMIT_BREAKER_MS
        : error.status === 504
            ? CODEX_CONFIGURATION_BREAKER_MS
        : error.retryable
            ? CODEX_TRANSIENT_BREAKER_MS
            : CODEX_CONFIGURATION_BREAKER_MS
    codexBlockedUntil = Date.now() + duration
}

export function isCodexCircuitOpen(): boolean {
    return Date.now() < codexBlockedUntil
}

export function openCodexCircuitBreaker(error?: unknown) {
    const normalized = normalizeProviderError(error)
    openCodexCircuit(normalized)
}

export function closeCodexCircuitBreaker() {
    codexBlockedUntil = 0
}

async function generateGeminiStructuredJson<T>({
    route,
    systemInstruction,
    parts,
    schema,
    maxOutputTokens,
    deadlineAt,
    onUsage,
}: {
    route: PersonalizationProviderRoute
    systemInstruction: string
    parts: PersonalizationProviderPart[]
    schema: JsonSchema
    maxOutputTokens: number
    deadlineAt?: number
    onUsage?: (usage: PersonalizationTokenUsage | undefined, providerModelId: string) => void
}): Promise<{ value: T; usage: PersonalizationTokenUsage | undefined; providerModelId: string }> {
    const apiKey = getGeminiApiKey()
    const endpoint = `${GEMINI_API_BASE}/models/${encodeURIComponent(route.model)}:generateContent`
    let lastError: PersonalizationProviderError | null = null

    for (let attempt = 0; attempt < 2; attempt++) {
        const remaining = deadlineAt === undefined ? GEMINI_TIMEOUT_MS : deadlineAt - Date.now()
        if (remaining <= 0) {
            throw new PersonalizationProviderError(
                "Personalization generation timed out",
                504,
                false,
                "provider_timeout",
            )
        }
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), Math.min(GEMINI_TIMEOUT_MS, remaining))

        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": apiKey,
                },
                body: JSON.stringify({
                    systemInstruction: { parts: [{ text: systemInstruction }] },
                    contents: [{ role: "user", parts }],
                    generationConfig: {
                        maxOutputTokens,
                        responseMimeType: "application/json",
                        responseJsonSchema: schema,
                    },
                }),
                cache: "no-store",
                signal: controller.signal,
            })

            if (!response.ok) {
                onUsage?.(undefined, route.id)
                const retryable = response.status === 429 || response.status >= 500
                const error = new PersonalizationProviderError(
                    response.status === 429
                        ? "Personalization provider is busy. Try again shortly."
                        : "Personalization provider request failed",
                    response.status === 429 ? 429 : 502,
                    retryable,
                    response.status === 429 ? "provider_rate_limited" : "provider_request_failed",
                )
                if (!retryable || attempt === 1) throw error
                lastError = error
                await delay(500 + Math.floor(Math.random() * 500))
                continue
            }

            const payload = await response.json() as GeminiResponse
            onUsage?.(payload.usageMetadata, route.id)
            const candidate = payload.candidates?.[0]
            const text = candidate?.content?.parts?.map((part) => part.text ?? "").join("").trim()
            if (!text) {
                throw new PersonalizationProviderError(
                    `Personalization provider returned no content${candidate?.finishReason ? ` (${candidate.finishReason})` : ""}`,
                    502,
                    false,
                    "provider_empty_response",
                )
            }

            try {
                return { value: JSON.parse(text) as T, usage: payload.usageMetadata, providerModelId: route.id }
            } catch {
                throw new PersonalizationProviderError(
                    "Personalization provider returned invalid JSON",
                    502,
                    false,
                    "provider_invalid_json",
                )
            }
        } catch (error) {
            if (error instanceof PersonalizationProviderError) throw error
            const timedOut = error instanceof Error && error.name === "AbortError"
            if (timedOut && deadlineAt !== undefined && Date.now() >= deadlineAt) {
                throw new PersonalizationProviderError(
                    "Personalization generation timed out",
                    504,
                    false,
                    "provider_timeout",
                )
            }
            onUsage?.(undefined, route.id)
            const wrapped = new PersonalizationProviderError(
                timedOut ? "Personalization provider timed out" : "Personalization provider is unavailable",
                timedOut ? 504 : 502,
                true,
                timedOut ? "provider_timeout" : "provider_unavailable",
            )
            if (attempt === 1) throw wrapped
            lastError = wrapped
            await delay(500 + Math.floor(Math.random() * 500))
        } finally {
            clearTimeout(timeout)
        }
    }

    throw lastError ?? new PersonalizationProviderError("Personalization provider is unavailable")
}

export async function generateStructuredJson<T>({
    systemInstruction,
    parts,
    schema,
    maxOutputTokens = MAX_OUTPUT_TOKENS,
    deadlineAt,
    onUsage,
    providers,
}: {
    systemInstruction: string
    parts: PersonalizationProviderPart[]
    schema: JsonSchema
    maxOutputTokens?: number
    deadlineAt?: number
    onUsage?: (usage: PersonalizationTokenUsage | undefined, providerModelId: string) => void
    providers?: PersonalizationProviderName[]
}): Promise<{ value: T; usage: PersonalizationTokenUsage | undefined; providerModelId: string }> {
    const allowedProviders = providers ? new Set(providers) : null
    const routes = PERSONALIZATION_ROUTES.filter(({ provider }) => !allowedProviders || allowedProviders.has(provider))
    if (routes.length === 0) {
        throw new PersonalizationProviderError(
            "Personalization provider is not configured",
            503,
            false,
            "provider_not_configured",
        )
    }

    let lastError: PersonalizationProviderError | undefined
    for (const route of routes) {
        if (
            route.provider === "codex"
            && process.env.NODE_ENV === "test"
            && !process.env.CODEX_AUTH_JSON_B64
            && !process.env.CODEX_RUNNER_URL
        ) {
            continue
        }
        try {
            if (route.provider === "google") {
                return await generateGeminiStructuredJson<T>({
                    route,
                    systemInstruction,
                    parts,
                    schema,
                    maxOutputTokens,
                    deadlineAt,
                    onUsage,
                })
            }

            if (parts.some((part) => part.inlineData)) continue
            if (Date.now() < codexBlockedUntil) continue
            const { generateCodexStructuredJson, isCodexPersonalizationConfigured } = await import("./codex-personalization")
            if (!await isCodexPersonalizationConfigured()) {
                codexBlockedUntil = Date.now() + CODEX_CONFIGURATION_BREAKER_MS
                console.warn(JSON.stringify({
                    severity: "WARNING",
                    message: "Personalization provider skipped",
                    event: "leetllm.personalization.provider_fallback",
                    provider_model_id: route.id,
                    error_code: "codex_not_configured",
                }))
                continue
            }
            const prompt = parts.map((part) => part.text ?? "").filter(Boolean).join("\n\n")
            const result = await generateCodexStructuredJson<T>({
                route,
                systemInstruction,
                prompt,
                schema,
                maxOutputTokens,
                deadlineAt,
            })
            codexBlockedUntil = 0
            onUsage?.(result.usage, route.id)
            return { ...result, providerModelId: route.id }
        } catch (error) {
            if (route.provider === "codex") onUsage?.(undefined, route.id)
            const providerError = normalizeProviderError(error)
            if (route.provider === "codex") openCodexCircuit(providerError)
            lastError = providerError
            console.warn(JSON.stringify({
                severity: "WARNING",
                message: "Personalization provider fallback",
                event: "leetllm.personalization.provider_fallback",
                provider_model_id: route.id,
                error_code: providerError.code,
            }))
        }
    }

    throw lastError ?? new PersonalizationProviderError("Personalization provider is unavailable")
}
