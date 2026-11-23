export interface PersonalizationTokenUsage {
    promptTokenCount?: number
    cachedContentTokenCount?: number
    candidatesTokenCount?: number
    thoughtsTokenCount?: number
    totalTokenCount?: number
}

export const PERSONALIZATION_PRICING_VERSION = "google-ai-2026-07-23-standard"

// Paid standard tier: https://ai.google.dev/gemini-api/docs/pricing
const MODEL_PRICING_USD_PER_MILLION = {
    "gemini-3.5-flash-lite": {
        input: 0.30,
        cachedInput: 0.03,
        output: 2.50,
    },
} as const

function tokenCount(value: number | undefined) {
    return Number.isFinite(value) && value! > 0 ? Math.floor(value!) : 0
}

export interface PersonalizationUsageMeasurement {
    providerCalls: number
    providerModels?: string[]
    inputTokens: number
    cachedInputTokens: number
    outputTokens: number
    thinkingTokens: number
    totalTokens: number
    estimatedCostMicrousd: number | null
    pricingVersion: string | null
}

export function measurePersonalizationUsage(
    modelId: string,
    usage: PersonalizationTokenUsage | undefined,
    providerCalls = 0,
): PersonalizationUsageMeasurement {
    const inputTokens = tokenCount(usage?.promptTokenCount)
    const cachedInputTokens = Math.min(inputTokens, tokenCount(usage?.cachedContentTokenCount))
    const candidateTokens = tokenCount(usage?.candidatesTokenCount)
    const thinkingTokens = tokenCount(usage?.thoughtsTokenCount)
    const outputTokens = candidateTokens + thinkingTokens
    const totalTokens = tokenCount(usage?.totalTokenCount) || inputTokens + outputTokens
    const pricing = MODEL_PRICING_USD_PER_MILLION[modelId as keyof typeof MODEL_PRICING_USD_PER_MILLION]
    const hasReportedUsage = usage !== undefined && Object.values(usage).some((value) => value !== undefined)

    if (!pricing || !hasReportedUsage) {
        return {
            providerCalls,
            inputTokens,
            cachedInputTokens,
            outputTokens,
            thinkingTokens,
            totalTokens,
            estimatedCostMicrousd: null,
            pricingVersion: null,
        }
    }

    const estimatedCostMicrousd = Math.round(
        (inputTokens - cachedInputTokens) * pricing.input
        + cachedInputTokens * pricing.cachedInput
        + outputTokens * pricing.output,
    )
    return {
        providerCalls,
        inputTokens,
        cachedInputTokens,
        outputTokens,
        thinkingTokens,
        totalTokens,
        estimatedCostMicrousd,
        pricingVersion: PERSONALIZATION_PRICING_VERSION,
    }
}

export function createPersonalizationUsageTracker() {
    let providerCalls = 0
    let usage: PersonalizationTokenUsage = {}
    const usageByModel = new Map<string, PersonalizationTokenUsage>()
    const providerModels = new Set<string>()

    return {
        record(responseUsage: PersonalizationTokenUsage | undefined, providerModelId?: string) {
            providerCalls++
            if (providerModelId) providerModels.add(providerModelId)
            if (!responseUsage) return
            usage = {
                promptTokenCount: tokenCount(usage.promptTokenCount) + tokenCount(responseUsage.promptTokenCount),
                cachedContentTokenCount: tokenCount(usage.cachedContentTokenCount) + tokenCount(responseUsage.cachedContentTokenCount),
                candidatesTokenCount: tokenCount(usage.candidatesTokenCount) + tokenCount(responseUsage.candidatesTokenCount),
                thoughtsTokenCount: tokenCount(usage.thoughtsTokenCount) + tokenCount(responseUsage.thoughtsTokenCount),
                totalTokenCount: tokenCount(usage.totalTokenCount) + tokenCount(responseUsage.totalTokenCount),
            }
            if (providerModelId) {
                const current = usageByModel.get(providerModelId) ?? {}
                usageByModel.set(providerModelId, {
                    promptTokenCount: tokenCount(current.promptTokenCount) + tokenCount(responseUsage.promptTokenCount),
                    cachedContentTokenCount: tokenCount(current.cachedContentTokenCount) + tokenCount(responseUsage.cachedContentTokenCount),
                    candidatesTokenCount: tokenCount(current.candidatesTokenCount) + tokenCount(responseUsage.candidatesTokenCount),
                    thoughtsTokenCount: tokenCount(current.thoughtsTokenCount) + tokenCount(responseUsage.thoughtsTokenCount),
                    totalTokenCount: tokenCount(current.totalTokenCount) + tokenCount(responseUsage.totalTokenCount),
                })
            }
        },
        measure(modelId: string) {
            const measurement = measurePersonalizationUsage(modelId, usage, providerCalls)
            if (providerModels.size === 0) return measurement

            const providerMeasurements = [...usageByModel].map(([providerModelId, providerUsage]) => (
                measurePersonalizationUsage(providerModelId.replace(/^[^/]+\//, "").replace(/:[a-z]+$/, ""), providerUsage)
            ))
            const hasUnpricedUsage = providerModels.size !== usageByModel.size
                || [...providerModels].some((providerModelId) => providerModelId.startsWith("codex/"))
                || providerMeasurements.some(({ estimatedCostMicrousd }) => estimatedCostMicrousd === null)
            return {
                ...measurement,
                providerModels: [...providerModels],
                estimatedCostMicrousd: hasUnpricedUsage
                    ? null
                    : providerMeasurements.reduce((total, item) => total + (item.estimatedCostMicrousd ?? 0), 0),
                pricingVersion: hasUnpricedUsage ? null : PERSONALIZATION_PRICING_VERSION,
            }
        },
    }
}

export function emitPersonalizationGenerationMetric({
    articleSlug,
    requestKind,
    status,
    modelId,
    promptVersion,
    durationMs,
    inputChars,
    outputChars,
    usageId,
    usage,
    errorCode,
}: {
    articleSlug: string | null
    requestKind: "lesson" | "resume"
    status: "cached" | "succeeded" | "failed"
    modelId: string
    promptVersion?: string
    durationMs: number
    inputChars: number
    outputChars?: number
    usageId?: number | string
    usage?: PersonalizationUsageMeasurement
    errorCode?: string
}) {
    const estimatedCostMicrousd = usage?.estimatedCostMicrousd ?? (status === "cached" ? 0 : null)
    console.info(JSON.stringify({
        severity: "INFO",
        message: "Personalization generation usage",
        event: "leetllm.personalization.generation",
        metric: "leetllm.personalization.estimated_cost_usd",
        ...(estimatedCostMicrousd === null ? {} : {
            metric_value: estimatedCostMicrousd / 1_000_000,
        }),
        ...(usageId === undefined ? {} : { usage_id: usageId }),
        article_slug: articleSlug,
        request_kind: requestKind,
        status,
        model_id: modelId,
        ...(promptVersion ? { prompt_version: promptVersion } : {}),
        duration_ms: durationMs,
        input_chars: inputChars,
        ...(outputChars === undefined ? {} : { output_chars: outputChars }),
        provider_calls: usage?.providerCalls ?? 0,
        ...(usage?.providerModels?.length ? { provider_models: usage.providerModels } : {}),
        input_tokens: usage?.inputTokens ?? 0,
        cached_input_tokens: usage?.cachedInputTokens ?? 0,
        output_tokens: usage?.outputTokens ?? 0,
        thinking_tokens: usage?.thinkingTokens ?? 0,
        total_tokens: usage?.totalTokens ?? 0,
        ...(estimatedCostMicrousd === null ? {} : { estimated_cost_microusd: estimatedCostMicrousd }),
        ...(usage?.pricingVersion ? { pricing_version: usage.pricingVersion } : {}),
        ...(errorCode ? { error_code: errorCode } : {}),
    }))
}
