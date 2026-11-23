import { beforeEach, describe, expect, test, vi } from "vitest"
import { NextRequest } from "next/server"

const { analyzeResumeProfileMock, createClientMock } = vi.hoisted(() => ({
    analyzeResumeProfileMock: vi.fn(),
    createClientMock: vi.fn(),
}))

vi.mock("@/lib/supabase/server", () => ({ createClient: createClientMock }))
vi.mock("@/lib/personalization-provider", () => ({
    PERSONALIZATION_MODEL: "gemini-test",
    PersonalizationProviderError: class PersonalizationProviderError extends Error {
        status = 502
    },
}))
vi.mock("@/lib/gemini-personalization", () => ({
    analyzeResumeProfile: analyzeResumeProfileMock,
}))

import { GET, PUT } from "./route"

const storedProfile = {
    tone_preset: "cowboy",
    explanation_level: "eli5",
    custom_instructions: "Use Python examples",
    learner_context: "Backend engineer",
    resume_context: "",
    resume_filename: null,
    resume_updated_at: null,
    revision: 1,
    updated_at: "2026-07-23T12:00:00.000Z",
}

function queryWithResult(method: "maybeSingle" | "single", result: unknown) {
    const query = {
        select: vi.fn(),
        eq: vi.fn(),
        upsert: vi.fn(),
        maybeSingle: vi.fn(),
        single: vi.fn(),
    }
    query.select.mockReturnValue(query)
    query.eq.mockReturnValue(query)
    query.upsert.mockReturnValue(query)
    query[method].mockResolvedValue(result)
    return query
}

describe("personalization profile route", () => {
    beforeEach(() => {
        createClientMock.mockReset()
        analyzeResumeProfileMock.mockReset()
    })

    test("requires authentication and disables private response caching", async () => {
        createClientMock.mockResolvedValue({
            auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
        })

        const response = await GET()

        expect(response.status).toBe(401)
        expect(response.headers.get("cache-control")).toBe("private, no-store")
    })

    test("requires authentication before saving preferences", async () => {
        createClientMock.mockResolvedValue({
            auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
        })
        const request = new NextRequest("http://localhost/api/personalization/profile", {
            method: "PUT",
            body: new FormData(),
        })
        const formDataSpy = vi.spyOn(request, "formData")

        const response = await PUT(request)

        expect(response.status).toBe(401)
        expect(formDataSpy).not.toHaveBeenCalled()
        expect(analyzeResumeProfileMock).not.toHaveBeenCalled()
    })

    test("rejects cross-origin writes before parsing multipart data", async () => {
        createClientMock.mockResolvedValue({
            auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }) },
        })
        const request = new NextRequest("http://localhost/api/personalization/profile", {
            method: "PUT",
            headers: {
                Origin: "https://evil.example",
                "Content-Type": "multipart/form-data; boundary=test",
            },
        })
        const formDataSpy = vi.spyOn(request, "formData")

        const response = await PUT(request)

        expect(response.status).toBe(403)
        expect(formDataSpy).not.toHaveBeenCalled()
    })

    test("saves validated preferences without replacing resume context", async () => {
        const currentQuery = queryWithResult("maybeSingle", { data: null, error: null })
        const savedQuery = queryWithResult("single", { data: storedProfile, error: null })
        const from = vi.fn()
            .mockReturnValueOnce(currentQuery)
            .mockReturnValueOnce(savedQuery)
        createClientMock.mockResolvedValue({
            auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }) },
            from,
        })
        const formData = new FormData()
        formData.set("tone", "cowboy")
        formData.set("explanationLevel", "eli5")
        formData.set("customInstructions", "Use Python examples")
        formData.set("learnerContext", "Backend engineer")
        formData.set("clearResumeContext", "false")
        const request = new NextRequest("http://localhost/api/personalization/profile", {
            method: "PUT",
            body: formData,
        })

        const response = await PUT(request)

        expect(response.status).toBe(200)
        expect(savedQuery.upsert).toHaveBeenCalledWith(expect.objectContaining({
            user_id: "user-1",
            tone_preset: "cowboy",
            explanation_level: "eli5",
            resume_context: "",
        }), { onConflict: "user_id" })
        expect(await response.json()).toMatchObject({
            profile: { tone: "cowboy", explanationLevel: "eli5", revision: 1 },
        })
    })
})
