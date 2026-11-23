import { beforeEach, describe, expect, test, vi } from "vitest"
import { NextRequest } from "next/server"

const storedProfile = {
    tone_preset: "clear",
    explanation_level: "balanced",
    custom_instructions: "",
    learner_context: "",
    resume_context: "",
    resume_filename: null,
    resume_updated_at: null,
    revision: 3,
    updated_at: "2026-07-23T12:00:00.000Z",
}

function query(data: unknown) {
    const chain = {
        select: vi.fn(),
        eq: vi.fn(),
        upsert: vi.fn(),
        update: vi.fn(),
        maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
        single: vi.fn().mockResolvedValue({ data, error: null }),
    }
    for (const method of [chain.select, chain.eq, chain.upsert, chain.update]) method.mockReturnValue(chain)
    return chain
}

describe("personalization read paths", () => {
    let profileQuery: ReturnType<typeof query>
    let lessonQuery: ReturnType<typeof query>
    let client: {
        auth: { getUser: ReturnType<typeof vi.fn> }
        from: ReturnType<typeof vi.fn>
        rpc: ReturnType<typeof vi.fn>
    }
    const generationLoaded = vi.fn()
    const generate = vi.fn()
    const analyzeResume = vi.fn()
    const extractVisuals = vi.fn()

    beforeEach(() => {
        vi.resetModules()
        generationLoaded.mockReset()
        generate.mockReset().mockResolvedValue({ markdown: "Generated lesson" })
        analyzeResume.mockReset().mockResolvedValue({ learnerContext: "Software engineer with Python and distributed systems experience." })
        extractVisuals.mockReset().mockReturnValue([])
        profileQuery = query(null)
        lessonQuery = query({ markdown: "Cached lesson", generated_at: "2026-07-23T12:00:00.000Z" })
        client = {
            auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }) },
            from: vi.fn((table: string) => table === "user_personalization_profiles" ? profileQuery : lessonQuery),
            rpc: vi.fn().mockResolvedValue({ data: 42, error: null }),
        }
        vi.doMock("@/lib/supabase/server", () => ({ createClient: async () => client }))
        vi.doMock("@/lib/supabase/admin", () => ({
            createAdminClient: () => ({ from: () => ({ upsert: async () => ({ error: null }) }) }),
        }))
        vi.doMock("@/lib/personalization-provider", () => ({
            PERSONALIZATION_MODEL: "model-test",
            PERSONALIZATION_PROMPT_VERSION: "prompt-test",
            PersonalizationProviderError: class extends Error {},
        }))
        vi.doMock("@/lib/gemini-personalization", () => {
            generationLoaded()
            return {
                PERSONALIZATION_MODEL: "model-test",
                PERSONALIZATION_PROMPT_VERSION: "prompt-test",
                GeminiPersonalizationError: class extends Error {},
                personalizeLessonMarkdown: generate,
                analyzeResumeProfile: analyzeResume,
            }
        })
        vi.doMock("@/lib/questions", () => ({
            getCanonicalQuestionSlug: (slug: string) => ["known-lesson", "known-alias"].includes(slug) ? "known-lesson" : undefined,
            getQuestionBySlug: () => ({ slug: "known-lesson", title: "Known lesson", content: "# Known lesson\n\nCanonical prose." }),
        }))
        vi.doMock("@/lib/personalization-visuals", () => ({ extractPersonalizationVisuals: extractVisuals }))
    })

    test.each(["lesson", "profile"])("does not initialize generation on %s GET without a profile", async (kind) => {
        const route = kind === "lesson" ? await import("./lesson/route") : await import("./profile/route")
        const response = await route.GET(new NextRequest("http://localhost/api/personalization/lesson?slug=known-alias"))

        expect(response.status).toBe(200)
        expect(response.headers.get("cache-control")).toContain("private, no-store")
        expect(generationLoaded).not.toHaveBeenCalled()
        expect(extractVisuals).not.toHaveBeenCalled()
        if (kind === "lesson") expect(await response.json()).toEqual({ profileConfigured: false, personalized: null })
    })

    test("still rejects unknown slugs before the no-profile response", async () => {
        const { GET } = await import("./lesson/route")
        const response = await GET(new NextRequest("http://localhost/api/personalization/lesson?slug=unknown"))

        expect(response.status).toBe(400)
        expect(await response.json()).toEqual({ error: "Unknown lesson" })
        expect(client.from).not.toHaveBeenCalled()
        expect(generationLoaded).not.toHaveBeenCalled()
        expect(extractVisuals).not.toHaveBeenCalled()
    })

    test("reads the configured lesson cache with its full source and identity keys", async () => {
        profileQuery = query(storedProfile)
        const { GET } = await import("./lesson/route")
        const response = await GET(new NextRequest("http://localhost/api/personalization/lesson?slug=known-alias"))

        expect(await response.json()).toMatchObject({ profileConfigured: true, personalized: { markdown: "Cached lesson" } })
        expect(extractVisuals).toHaveBeenCalledOnce()
        expect(lessonQuery.eq.mock.calls).toEqual([
            ["user_id", "user-1"],
            ["article_slug", "known-lesson"],
            ["source_hash", expect.stringMatching(/^[a-f0-9]{64}$/)],
            ["profile_revision", 3],
            ["model_id", "model-test"],
            ["prompt_version", "prompt-test"],
        ])
        expect(generationLoaded).not.toHaveBeenCalled()
    })

    test("returns a POST cache hit without initializing generation or claiming quota", async () => {
        profileQuery = query(storedProfile)
        const { POST } = await import("./lesson/route")
        const response = await POST(new NextRequest("http://localhost/api/personalization/lesson", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug: "known-lesson" }),
        }))

        expect(await response.json()).toMatchObject({ markdown: "Cached lesson", cached: true })
        expect(client.rpc).not.toHaveBeenCalled()
        expect(generationLoaded).not.toHaveBeenCalled()
    })

    test("loads generation for an authorized uncached request", async () => {
        profileQuery = query(storedProfile)
        const { POST } = await import("./lesson/route")
        const response = await POST(new NextRequest("http://localhost/api/personalization/lesson", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug: "known-lesson", regenerate: true }),
        }))

        expect(await response.json()).toMatchObject({ markdown: "Generated lesson", cached: false })
        expect(client.rpc).toHaveBeenCalledOnce()
        expect(generationLoaded).toHaveBeenCalledOnce()
        expect(generate).toHaveBeenCalledOnce()
    })

    test.each([false, true])("saves preferences and loads analysis only for a supplied resume: %s", async (withResume) => {
        profileQuery = query(storedProfile)
        const { PUT } = await import("./profile/route")
        const form = new FormData()
        for (const [key, value] of Object.entries({ tone: "clear", explanationLevel: "balanced", customInstructions: "", learnerContext: "", clearResumeContext: "false" })) form.set(key, value)
        if (withResume) {
            const bytes = new TextEncoder().encode("Python and distributed systems experience.")
            const resume = new File([bytes], "resume.txt", { type: "text/plain" })
            Object.defineProperty(resume, "arrayBuffer", { value: async () => bytes.buffer })
            form.set("resume", resume)
        }
        const request = new NextRequest("http://localhost/api/personalization/profile", {
            method: "PUT",
            headers: { "Content-Type": "multipart/form-data; boundary=test" },
        })
        vi.spyOn(request, "formData").mockResolvedValue(form)

        const response = await PUT(request)

        expect(response.status).toBe(200)
        expect(generationLoaded).toHaveBeenCalledTimes(withResume ? 1 : 0)
        expect(analyzeResume).toHaveBeenCalledTimes(withResume ? 1 : 0)
        expect(profileQuery.upsert).toHaveBeenCalledWith(expect.objectContaining({
            resume_context: withResume ? "Software engineer with Python and distributed systems experience." : "",
        }), { onConflict: "user_id" })
    })
})
