import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"

const { generateCodexStructuredJsonMock, isCodexPersonalizationConfiguredMock } = vi.hoisted(() => ({
    generateCodexStructuredJsonMock: vi.fn(),
    isCodexPersonalizationConfiguredMock: vi.fn(),
}))

vi.mock("./codex-personalization", () => ({
    generateCodexStructuredJson: generateCodexStructuredJsonMock,
    isCodexPersonalizationConfigured: isCodexPersonalizationConfiguredMock,
}))

import {
    DEFAULT_PERSONALIZATION_MODELS,
    generateStructuredJson,
    parsePersonalizationModels,
} from "./personalization-provider"

const schema = {
    type: "object",
    properties: { answer: { type: "string" } },
    required: ["answer"],
    additionalProperties: false,
}

describe("personalization provider router", () => {
    beforeEach(() => {
        vi.stubEnv("GEMINI_API_KEY", "test-key")
        vi.stubEnv("CODEX_AUTH_JSON_B64", "test-isolated-auth")
        generateCodexStructuredJsonMock.mockReset()
        isCodexPersonalizationConfiguredMock.mockResolvedValue(true)
    })

    afterEach(() => {
        vi.unstubAllEnvs()
        vi.unstubAllGlobals()
        vi.restoreAllMocks()
    })

    test("parses ordered provider routes and Codex reasoning effort", () => {
        expect(parsePersonalizationModels(DEFAULT_PERSONALIZATION_MODELS)).toEqual([
            {
                provider: "codex",
                model: "gpt-6-luna",
                reasoningEffort: "high",
                id: "codex/gpt-6-luna:high",
            },
            {
                provider: "google",
                model: "gemini-3.5-flash-lite",
                id: "google/gemini-3.5-flash-lite",
            },
        ])
    })

    test("uses Codex first for text-only structured generation", async () => {
        generateCodexStructuredJsonMock.mockResolvedValue({
            value: { answer: "codex" },
            usage: { promptTokenCount: 20, candidatesTokenCount: 4, totalTokenCount: 24 },
        })
        const fetchMock = vi.fn()
        vi.stubGlobal("fetch", fetchMock)

        const result = await generateStructuredJson<{ answer: string }>({
            systemInstruction: "Return structured output.",
            parts: [{ text: "Question" }],
            schema,
        })

        expect(result.value.answer).toBe("codex")
        expect(generateCodexStructuredJsonMock).toHaveBeenCalledWith(expect.objectContaining({
            route: expect.objectContaining({ model: "gpt-6-luna", reasoningEffort: "high" }),
            prompt: "Question",
        }))
        expect(fetchMock).not.toHaveBeenCalled()
    })

    test("falls back to Gemini without leaking Codex failure details", async () => {
        generateCodexStructuredJsonMock.mockRejectedValue(new Error("secret upstream response"))
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
        const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
            candidates: [{ content: { parts: [{ text: JSON.stringify({ answer: "gemini" }) }] } }],
            usageMetadata: { promptTokenCount: 12, candidatesTokenCount: 3, totalTokenCount: 15 },
        }), { status: 200, headers: { "Content-Type": "application/json" } }))
        vi.stubGlobal("fetch", fetchMock)
        const onUsage = vi.fn()

        const result = await generateStructuredJson<{ answer: string }>({
            systemInstruction: "Return structured output.",
            parts: [{ text: "Question" }],
            schema,
            onUsage,
        })

        expect(result.value.answer).toBe("gemini")
        expect(onUsage).toHaveBeenNthCalledWith(1, undefined, "codex/gpt-6-luna:high")
        expect(onUsage).toHaveBeenNthCalledWith(2, expect.objectContaining({ totalTokenCount: 15 }), "google/gemini-3.5-flash-lite")
        expect(String(warn.mock.calls[0][0])).not.toContain("secret upstream response")
        expect(String(warn.mock.calls[0][0])).toContain("provider_unavailable")
    })

    test("keeps binary resume data on Gemini", async () => {
        const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
            candidates: [{ content: { parts: [{ text: JSON.stringify({ answer: "resume" }) }] } }],
        }), { status: 200, headers: { "Content-Type": "application/json" } }))
        vi.stubGlobal("fetch", fetchMock)

        await generateStructuredJson({
            systemInstruction: "Analyze resume.",
            parts: [{ inlineData: { mimeType: "text/plain", data: "cmVzdW1l" } }],
            schema,
            providers: ["google"],
        })

        expect(generateCodexStructuredJsonMock).not.toHaveBeenCalled()
        const body = JSON.parse(String(fetchMock.mock.calls[0][1].body))
        expect(body.contents[0].parts[0].inlineData.data).toBe("cmVzdW1l")
    })
})
