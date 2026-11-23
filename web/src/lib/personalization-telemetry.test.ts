import { describe, expect, test, vi } from "vitest"
import {
    createPersonalizationUsageTracker,
    emitPersonalizationGenerationMetric,
    measurePersonalizationUsage,
    PERSONALIZATION_PRICING_VERSION,
} from "./personalization-telemetry"

describe("personalization usage telemetry", () => {
    test("prices standard Gemini Flash-Lite input, cached input, response, and thinking tokens", () => {
        expect(measurePersonalizationUsage("gemini-3.5-flash-lite", {
            promptTokenCount: 10_000,
            cachedContentTokenCount: 2_000,
            candidatesTokenCount: 4_000,
            thoughtsTokenCount: 1_000,
            totalTokenCount: 15_000,
        })).toEqual({
            providerCalls: 0,
            inputTokens: 10_000,
            cachedInputTokens: 2_000,
            outputTokens: 5_000,
            thinkingTokens: 1_000,
            totalTokens: 15_000,
            estimatedCostMicrousd: 14_960,
            pricingVersion: PERSONALIZATION_PRICING_VERSION,
        })
    })

    test("keeps usage but omits cost for an unpriced model", () => {
        expect(measurePersonalizationUsage("future-model", {
            promptTokenCount: 10,
            candidatesTokenCount: 5,
            thoughtsTokenCount: 2,
        })).toEqual({
            providerCalls: 0,
            inputTokens: 10,
            cachedInputTokens: 0,
            outputTokens: 7,
            thinkingTokens: 2,
            totalTokens: 17,
            estimatedCostMicrousd: null,
            pricingVersion: null,
        })
    })

    test("tracks every provider response, including retries, for article-level cost", () => {
        const tracker = createPersonalizationUsageTracker()
        tracker.record({ promptTokenCount: 100, candidatesTokenCount: 20, totalTokenCount: 120 })
        tracker.record({ promptTokenCount: 80, candidatesTokenCount: 10, thoughtsTokenCount: 5, totalTokenCount: 95 })

        expect(tracker.measure("gemini-3.5-flash-lite")).toMatchObject({
            providerCalls: 2,
            inputTokens: 180,
            outputTokens: 35,
            thinkingTokens: 5,
            totalTokens: 215,
            estimatedCostMicrousd: 142,
        })
    })

    test("records fallback providers and avoids incomplete mixed-provider cost claims", () => {
        const tracker = createPersonalizationUsageTracker()
        tracker.record(undefined, "codex/gpt-6-luna:high")
        tracker.record(
            { promptTokenCount: 100, candidatesTokenCount: 20, totalTokenCount: 120 },
            "google/gemini-3.5-flash-lite",
        )

        expect(tracker.measure("codex/gpt-6-luna:high,google/gemini-3.5-flash-lite")).toMatchObject({
            providerCalls: 2,
            providerModels: ["codex/gpt-6-luna:high", "google/gemini-3.5-flash-lite"],
            inputTokens: 100,
            outputTokens: 20,
            estimatedCostMicrousd: null,
            pricingVersion: null,
        })
    })

    test("does not claim zero cost when provider usage metadata is missing", () => {
        expect(measurePersonalizationUsage("gemini-3.5-flash-lite", undefined)).toMatchObject({
            estimatedCostMicrousd: null,
            pricingVersion: null,
        })
    })

    test("emits one structured cost event without user data", () => {
        const info = vi.spyOn(console, "info").mockImplementation(() => {})
        const usage = measurePersonalizationUsage("gemini-3.5-flash-lite", {
            promptTokenCount: 10,
            candidatesTokenCount: 5,
        })

        emitPersonalizationGenerationMetric({
            articleSlug: "example-lesson",
            requestKind: "lesson",
            status: "succeeded",
            modelId: "gemini-3.5-flash-lite",
            promptVersion: "prompt-v1",
            durationMs: 123,
            inputChars: 40,
            outputChars: 20,
            usageId: 42,
            usage,
        })

        const event = JSON.parse(String(info.mock.calls[0][0]))
        expect(event).toMatchObject({
            event: "leetllm.personalization.generation",
            metric: "leetllm.personalization.estimated_cost_usd",
            article_slug: "example-lesson",
            usage_id: 42,
            provider_calls: 0,
            input_tokens: 10,
            output_tokens: 5,
            estimated_cost_microusd: 16,
        })
        expect(event).not.toHaveProperty("user_id")
        info.mockRestore()
    })
})
