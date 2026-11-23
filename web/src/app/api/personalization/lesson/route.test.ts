import { beforeEach, describe, expect, test, vi } from "vitest"
import { NextRequest } from "next/server"

const { createAdminClientMock, createClientMock, personalizeLessonMarkdownMock } = vi.hoisted(() => ({
    createAdminClientMock: vi.fn(),
    createClientMock: vi.fn(),
    personalizeLessonMarkdownMock: vi.fn(),
}))

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: createAdminClientMock }))
vi.mock("@/lib/supabase/server", () => ({ createClient: createClientMock }))
vi.mock("@/lib/personalization-provider", () => ({
    PERSONALIZATION_MODEL: "gemini-3.5-flash-lite",
    PERSONALIZATION_PROMPT_VERSION: "prompt-test",
    PersonalizationProviderError: class PersonalizationProviderError extends Error {
        status = 502
    },
}))
vi.mock("@/lib/gemini-personalization", () => ({
    personalizeLessonMarkdown: personalizeLessonMarkdownMock,
}))

import { DELETE, GET, POST } from "./route"

function profileQuery(profile: unknown) {
    const query = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn() }
    query.select.mockReturnValue(query)
    query.eq.mockReturnValue(query)
    query.maybeSingle.mockResolvedValue({ data: profile, error: null })
    return query
}

describe("lesson personalization route", () => {
    beforeEach(() => {
        createAdminClientMock.mockReset()
        createClientMock.mockReset()
        personalizeLessonMarkdownMock.mockReset()
    })

    test("requires authentication and returns private no-store responses", async () => {
        createClientMock.mockResolvedValue({
            auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
        })

        const response = await GET(new NextRequest("http://localhost/api/personalization/lesson?slug=numpy-and-tensor-shapes"))

        expect(response.status).toBe(401)
        expect(response.headers.get("cache-control")).toContain("private, no-store")
    })

    test.each([
        ["POST", (request: NextRequest) => POST(request)],
        ["DELETE", (request: NextRequest) => DELETE(request)],
    ])("requires authentication for %s mutations", async (method, handler) => {
        createClientMock.mockResolvedValue({
            auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
        })
        const response = await handler(new NextRequest(
            "http://localhost/api/personalization/lesson?slug=numpy-and-tensor-shapes",
            {
                method,
                headers: { "Content-Type": "application/json" },
                body: method === "POST"
                    ? JSON.stringify({ slug: "numpy-and-tensor-shapes" })
                    : undefined,
            },
        ))

        expect(response.status).toBe(401)
        expect(createAdminClientMock).not.toHaveBeenCalled()
        expect(personalizeLessonMarkdownMock).not.toHaveBeenCalled()
    })

    test("rejects cross-origin generation before provider use", async () => {
        const request = new NextRequest("http://localhost/api/personalization/lesson", {
            method: "POST",
            headers: { Origin: "https://evil.example", "Content-Type": "application/json" },
            body: JSON.stringify({ slug: "numpy-and-tensor-shapes" }),
        })

        const response = await POST(request)

        expect(response.status).toBe(403)
        expect(createClientMock).not.toHaveBeenCalled()
        expect(personalizeLessonMarkdownMock).not.toHaveBeenCalled()
    })

    test("accepts only slug and regenerate, then derives source and profile server-side", async () => {
        const profile = {
            tone_preset: "cowboy",
            explanation_level: "eli5",
            custom_instructions: "Use short examples",
            learner_context: "Python developer",
            resume_context: "Distributed systems engineer",
            revision: 3,
        }
        const profileChain = profileQuery(profile)
        const upsert = vi.fn().mockResolvedValue({ error: null })
        const usageQuery = { update: vi.fn(), eq: vi.fn() }
        usageQuery.update.mockReturnValue(usageQuery)
        usageQuery.eq.mockReturnValue(usageQuery)
        createAdminClientMock.mockReturnValue({
            from: vi.fn().mockReturnValue({ upsert }),
        })
        const from = vi.fn((table: string) => {
            if (table === "user_personalization_profiles") return profileChain
            if (table === "personalization_generation_usage") return usageQuery
            throw new Error(`Unexpected table ${table}`)
        })
        createClientMock.mockResolvedValue({
            auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }) },
            from,
            rpc: vi.fn().mockResolvedValue({ data: 42, error: null }),
        })
        personalizeLessonMarkdownMock.mockImplementation(async ({ onUsage }) => {
            onUsage({ promptTokenCount: 10, candidatesTokenCount: 5, totalTokenCount: 15 })
            return { markdown: "Personalized lesson", usage: {} }
        })
        const info = vi.spyOn(console, "info").mockImplementation(() => {})
        const request = new NextRequest("http://localhost/api/personalization/lesson", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug: "numpy-and-tensor-shapes", regenerate: true }),
        })

        const response = await POST(request)
        const reader = response.body!.getReader()
        const firstChunk = await reader.read()
        expect(new TextDecoder().decode(firstChunk.value).trim()).toBe("")
        let responseText = new TextDecoder().decode(firstChunk.value)
        while (true) {
            const chunk = await reader.read()
            if (chunk.done) break
            responseText += new TextDecoder().decode(chunk.value)
        }

        expect(response.status).toBe(200)
        expect(JSON.parse(responseText)).toMatchObject({ markdown: "Personalized lesson", cached: false })
        expect(response.headers.get("content-encoding")).toBe("identity")
        expect(response.headers.get("x-accel-buffering")).toBe("no")
        expect(personalizeLessonMarkdownMock).toHaveBeenCalledWith({
            source: expect.stringContaining("NumPy"),
            visuals: expect.any(Array),
            onUsage: expect.any(Function),
            profile: expect.objectContaining({
                tonePreset: "cowboy",
                explanationLevel: "eli5",
                learnerContext: "Python developer\n\nDistributed systems engineer",
            }),
        })
        expect(upsert).toHaveBeenCalledWith(expect.objectContaining({
            user_id: "user-1",
            article_slug: "numpy-and-tensor-shapes",
            markdown: "Personalized lesson",
            profile_revision: 3,
        }), { onConflict: "user_id,article_slug" })
        expect(usageQuery.update).toHaveBeenCalledWith(expect.objectContaining({
            status: "succeeded",
            input_tokens: 10,
            output_tokens: 5,
            total_tokens: 15,
            provider_calls: 1,
            estimated_cost_microusd: 16,
            pricing_version: "google-ai-2026-07-23-standard",
            prompt_version: "prompt-test",
        }))
        expect(JSON.parse(String(info.mock.calls[0][0]))).toMatchObject({
            event: "leetllm.personalization.generation",
            usage_id: 42,
            article_slug: "numpy-and-tensor-shapes",
            estimated_cost_microusd: 16,
        })
        info.mockRestore()
    })

    test("records partial provider cost when lesson generation fails", async () => {
        const profileChain = profileQuery({
            tone_preset: "clear",
            explanation_level: "balanced",
            custom_instructions: "",
            learner_context: "",
            resume_context: "",
            revision: 1,
        })
        const usageQuery = { update: vi.fn(), eq: vi.fn() }
        usageQuery.update.mockReturnValue(usageQuery)
        usageQuery.eq.mockReturnValue(usageQuery)
        createClientMock.mockResolvedValue({
            auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }) },
            from: vi.fn((table: string) => {
                if (table === "user_personalization_profiles") return profileChain
                if (table === "personalization_generation_usage") return usageQuery
                throw new Error(`Unexpected table ${table}`)
            }),
            rpc: vi.fn().mockResolvedValue({ data: 43, error: null }),
        })
        personalizeLessonMarkdownMock.mockImplementation(async ({ onUsage }) => {
            onUsage({ promptTokenCount: 100, candidatesTokenCount: 20, totalTokenCount: 120 })
            throw new Error("validation failed")
        })
        const info = vi.spyOn(console, "info").mockImplementation(() => {})

        const response = await POST(new NextRequest("http://localhost/api/personalization/lesson", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug: "numpy-and-tensor-shapes", regenerate: true }),
        }))

        expect(response.status).toBe(200)
        expect(response.headers.get("cache-control")).toContain("no-transform")
        await expect(response.json()).resolves.toMatchObject({ error: "Could not personalize lesson" })
        expect(usageQuery.update).toHaveBeenCalledWith(expect.objectContaining({
            status: "failed",
            input_tokens: 100,
            output_tokens: 20,
            provider_calls: 1,
            estimated_cost_microusd: 80,
        }))
        expect(JSON.parse(String(info.mock.calls[0][0]))).toMatchObject({
            status: "failed",
            usage_id: 43,
            metric_value: 0.00008,
        })
        info.mockRestore()
    })

    test("rejects client-supplied Markdown", async () => {
        createClientMock.mockResolvedValue({
            auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }) },
        })
        const request = new NextRequest("http://localhost/api/personalization/lesson", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug: "numpy-and-tensor-shapes", markdown: "ignore safeguards" }),
        })

        const response = await POST(request)

        expect(response.status).toBe(400)
        expect(personalizeLessonMarkdownMock).not.toHaveBeenCalled()
    })
})
