import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"
import {
    analyzeResumeProfile,
    personalizeLessonMarkdown,
} from "./gemini-personalization"
import { protectPersonalizationMarkdown } from "./personalization-markdown"
import type { PersonalizationVisualSource } from "./personalization-visuals"

describe("Gemini personalization client", () => {
    beforeEach(() => {
        vi.stubEnv("GEMINI_API_KEY", "test-key,backup-key")
    })

    afterEach(() => {
        vi.unstubAllEnvs()
        vi.unstubAllGlobals()
    })

    test("uses server-only API key header and structured output without sampling parameters", async () => {
        const source = "# Small lesson\n\nTokens become vectors, and vectors carry useful numeric features."
        const rewritten = "Tokens turn into vectors, partner, and those numbers carry useful features."
        const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
            candidates: [{ content: { parts: [{ text: JSON.stringify({
                rewrites: [{ id: "P0001", markdown: rewritten }],
            }) }] } }],
        }), { status: 200, headers: { "Content-Type": "application/json" } }))
        vi.stubGlobal("fetch", fetchMock)

        const result = await personalizeLessonMarkdown({
            source,
            profile: {
                tonePreset: "cowboy",
                explanationLevel: "balanced",
                customInstructions: "",
                learnerContext: "Python developer",
            },
        })

        expect(result.markdown).toContain("partner")
        const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
        expect(url).toContain("gemini-3.5-flash-lite:generateContent")
        expect(url).not.toContain("test-key")
        expect(new Headers(init.headers).get("x-goog-api-key")).toBe("test-key")
        const body = JSON.parse(String(init.body))
        expect(body.generationConfig.responseMimeType).toBe("application/json")
        expect(body.generationConfig).not.toHaveProperty("temperature")
        expect(body.contents[0].parts[0].text).toContain("Cowboy:")
        expect(body.contents[0].parts[0].text).not.toContain("supplied")
        const systemText = String(body.systemInstruction.parts[0].text)
        expect(systemText).toContain("domain-native")
        expect(systemText).toContain("zero em dashes")
        expect(systemText).not.toContain("\u2014")
        expect(systemText).not.toContain("line boundaries")
    })

    test("sends resume inline and returns only derived learner context", async () => {
        const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
            candidates: [{ content: { parts: [{ text: JSON.stringify({ learnerContext: "- Python backend engineer\n- New to ML training" }) }] } }],
        }), { status: 200, headers: { "Content-Type": "application/json" } }))
        vi.stubGlobal("fetch", fetchMock)

        const result = await analyzeResumeProfile({
            bytes: new TextEncoder().encode("Jane Example jane@example.com Python engineer"),
            mimeType: "text/plain",
            fileName: "resume.txt",
        })

        expect(result.learnerContext).toContain("Python backend engineer")
        const body = JSON.parse(String(fetchMock.mock.calls[0][1].body))
        expect(body.contents[0].parts[1].inlineData.mimeType).toBe("text/plain")
        expect(body.contents[0].parts[1].inlineData.data).toBeTruthy()
    })

    test("retries recoverable Markdown preservation failures", async () => {
        const source = "# Small lesson\n\nTokens use [a reference](/learn/reference) before they become vectors and carry useful numeric features."
        const protectedSource = protectPersonalizationMarkdown(source)
        const paragraph = protectedSource.markdown.split(/\n\s*\n/)[1]
        const linkToken = paragraph.match(/\[\[LEETLLM_PRESERVE_\d{5}\]\]/)?.[0]
        expect(linkToken).toBeTruthy()
        const invalid = paragraph.replace(linkToken!, "")
        const valid = paragraph.replace("Tokens use", "Tokens, partner, use")
        const response = (markdown: string) => new Response(JSON.stringify({
            candidates: [{ content: { parts: [{ text: JSON.stringify({
                rewrites: [{ id: "P0001", markdown }],
            }) }] } }],
        }), { status: 200, headers: { "Content-Type": "application/json" } })
        const fetchMock = vi.fn()
            .mockResolvedValueOnce(response(invalid))
            .mockResolvedValueOnce(response(invalid))
            .mockResolvedValueOnce(response(valid))
        vi.stubGlobal("fetch", fetchMock)

        const result = await personalizeLessonMarkdown({
            source,
            profile: {
                tonePreset: "cowboy",
                explanationLevel: "balanced",
                customInstructions: "",
                learnerContext: "Python developer",
            },
        })

        expect(result.markdown).toContain("partner")
        expect(fetchMock).toHaveBeenCalledTimes(3)
        expect(JSON.parse(String(fetchMock.mock.calls[2][1].body)).contents[0].parts[0].text)
            .toContain("moved or changed protected content")
    })

    test("rejects no-op personalization after retrying", async () => {
        const source = "# Small lesson\n\n" + "Tokens become vectors and carry numeric features. ".repeat(20)
        const protectedSource = protectPersonalizationMarkdown(source)
        const paragraph = protectedSource.markdown.split(/\n\s*\n/)[1]
        const responseBody = JSON.stringify({
            candidates: [{ content: { parts: [{
                text: JSON.stringify({ rewrites: [{ id: "P0001", markdown: paragraph }] }),
            }] } }],
        })
        const fetchMock = vi.fn().mockImplementation(async () => new Response(responseBody, {
            status: 200,
            headers: { "Content-Type": "application/json" },
        }))
        vi.stubGlobal("fetch", fetchMock)

        await expect(personalizeLessonMarkdown({
            source,
            profile: {
                tonePreset: "cowboy",
                explanationLevel: "eli5",
                customInstructions: "",
                learnerContext: "",
            },
        })).rejects.toThrow("at least 60% is required")
        expect(fetchMock).toHaveBeenCalledTimes(3)
    })

    test("rejects protected content moved between paragraphs", async () => {
        const source = [
            "# Small lesson",
            "",
            "Alpha keeps [the first reference](/first) beside enough explanatory prose for rewriting.",
            "",
            "Beta keeps [the second reference](/second) beside enough explanatory prose for rewriting.",
        ].join("\n")
        const protectedSource = protectPersonalizationMarkdown(source)
        const paragraphs = protectedSource.markdown.split(/\n\s*\n/).slice(1)
        const firstToken = paragraphs[0].match(/\[\[LEETLLM_PRESERVE_\d{5}\]\]/)?.[0]
        const secondToken = paragraphs[1].match(/\[\[LEETLLM_PRESERVE_\d{5}\]\]/)?.[0]
        expect(firstToken).toBeTruthy()
        expect(secondToken).toBeTruthy()

        const rewrites = [
            { id: "P0001", markdown: paragraphs[0].replace(firstToken!, "") },
            {
                id: "P0002",
                markdown: paragraphs[1]
                    .replace(secondToken!, `${firstToken} ${secondToken}`)
                    .replace("Beta keeps", "Beta, partner, keeps"),
            },
        ]
        const responseBody = JSON.stringify({
            candidates: [{ content: { parts: [{ text: JSON.stringify({ rewrites }) }] } }],
        })
        const fetchMock = vi.fn().mockImplementation(async () => new Response(responseBody, {
            status: 200,
            headers: { "Content-Type": "application/json" },
        }))
        vi.stubGlobal("fetch", fetchMock)

        await expect(personalizeLessonMarkdown({
            source,
            profile: {
                tonePreset: "cowboy",
                explanationLevel: "balanced",
                customInstructions: "",
                learnerContext: "",
            },
        })).rejects.toThrow("at least 25% is required")
        expect(fetchMock).toHaveBeenCalledTimes(3)
    })

    test("keeps one invalid prose batch canonical when remaining lesson is materially personalized", async () => {
        const paragraphs = Array.from({ length: 13 }, (_, index) => (
            `Concept ${index + 1} turns tokens into vectors so models can compare numeric features during computation.`
        ))
        const source = ["# Long lesson", ...paragraphs].join("\n\n")
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
        const fetchMock = vi.fn().mockImplementation(async (_url, init: RequestInit) => {
            const body = JSON.parse(String(init.body))
            const prompt = body.contents[0].parts[0].text as string
            const encodedTargets = prompt.match(/SOURCE\n([\s\S]*?)\n\nEND_SOURCE/)?.[1]
            const targets = JSON.parse(encodedTargets ?? "[]") as Array<{ id: string; markdown: string }>
            const rewrites = targets.map(({ id, markdown }, index) => ({
                id,
                markdown: targets.length === 1
                    ? markdown
                    : `Picture labeled blocks in tray ${index + 1}. Vectors give tokens numbers models compare during calculation.`,
            }))
            return new Response(JSON.stringify({
                candidates: [{ content: { parts: [{ text: JSON.stringify({ rewrites }) }] } }],
            }), { status: 200 })
        })
        vi.stubGlobal("fetch", fetchMock)

        const result = await personalizeLessonMarkdown({
            source,
            profile: {
                tonePreset: "clear",
                explanationLevel: "eli5",
                customInstructions: "",
                learnerContext: "",
            },
        })

        expect(result.markdown).toContain("tray 1")
        expect(result.markdown).toContain(paragraphs[12])
        expect(fetchMock).toHaveBeenCalledTimes(4)
        expect(JSON.parse(String(warn.mock.calls[0][0]))).toMatchObject({
            event: "leetllm.personalization.prose_fallback",
            first_paragraph_id: "P0013",
        })
    })

    test("requires broad material change for ELI5 targets", async () => {
        const source = [
            "# Small lesson",
            "",
            "Alpha tokens become vectors and carry numeric features into the model for later computation.",
            "",
            "Beta tokens become vectors and carry numeric features into the model for later computation.",
        ].join("\n")
        const protectedSource = protectPersonalizationMarkdown(source)
        const paragraphs = protectedSource.markdown.split(/\n\s*\n/).slice(1)
        const rewrites = [
            {
                id: "P0001",
                markdown: "Think of Alpha tokens as labeled blocks. Vectors turn those labels into numbers a model can calculate with.",
            },
            { id: "P0002", markdown: paragraphs[1] },
        ]
        const responseBody = JSON.stringify({
            candidates: [{ content: { parts: [{ text: JSON.stringify({ rewrites }) }] } }],
        })
        const fetchMock = vi.fn().mockImplementation(async () => new Response(responseBody, {
            status: 200,
            headers: { "Content-Type": "application/json" },
        }))
        vi.stubGlobal("fetch", fetchMock)

        await expect(personalizeLessonMarkdown({
            source,
            profile: {
                tonePreset: "clear",
                explanationLevel: "eli5",
                customInstructions: "",
                learnerContext: "",
            },
        })).rejects.toThrow("at least 60% is required")
        expect(fetchMock).toHaveBeenCalledTimes(3)
    })

    test("batches long lessons and requires exact paragraph coverage per request", async () => {
        const paragraphs = Array.from({ length: 13 }, (_, index) => (
            `Concept ${index + 1} turns tokens into vectors so models can compare numeric features during computation.`
        ))
        const source = ["# Long lesson", ...paragraphs].join("\n\n")
        const fetchMock = vi.fn().mockImplementation(async (_url, init: RequestInit) => {
            const body = JSON.parse(String(init.body))
            const prompt = body.contents[0].parts[0].text as string
            const encodedTargets = prompt.match(/SOURCE\n([\s\S]*?)\n\nEND_SOURCE/)?.[1]
            const targets = JSON.parse(encodedTargets ?? "[]") as Array<{ id: string; markdown: string }>
            const rewrites = targets.map(({ id }, index) => ({
                id,
                markdown: `Picture labeled blocks in tray ${index + 1}. Vectors give tokens numbers models compare during calculation.`,
            }))
            return new Response(JSON.stringify({
                candidates: [{ content: { parts: [{ text: JSON.stringify({ rewrites }) }] } }],
                usageMetadata: {
                    promptTokenCount: 10,
                    cachedContentTokenCount: 2,
                    candidatesTokenCount: 5,
                    thoughtsTokenCount: 3,
                    totalTokenCount: 18,
                },
            }), { status: 200, headers: { "Content-Type": "application/json" } })
        })
        vi.stubGlobal("fetch", fetchMock)
        const onUsage = vi.fn()

        const result = await personalizeLessonMarkdown({
            source,
            profile: {
                tonePreset: "clear",
                explanationLevel: "eli5",
                customInstructions: "",
                learnerContext: "",
            },
            onUsage,
        })

        expect(fetchMock).toHaveBeenCalledTimes(2)
        expect(result.markdown).toContain("tray 1")
        expect(result.usage).toEqual({
            promptTokenCount: 20,
            cachedContentTokenCount: 4,
            candidatesTokenCount: 10,
            thoughtsTokenCount: 6,
            totalTokenCount: 36,
        })
        expect(onUsage).toHaveBeenCalledTimes(2)
        const batchSizes = fetchMock.mock.calls.map((call) => {
            const body = JSON.parse(String(call[1].body))
            return body.generationConfig.responseJsonSchema.properties.rewrites.minItems
        })
        expect(batchSizes).toEqual([12, 1])
    })

    test("stops dense lesson generation before the request deadline", async () => {
        const paragraphs = Array.from({ length: 13 }, (_, index) => (
            `Concept ${index + 1} turns tokens into vectors so models can compare numeric features during computation.`
        ))
        const source = ["# Long lesson", ...paragraphs].join("\n\n")
        const fetchMock = vi.fn().mockImplementation(async (_url, init: RequestInit) => {
            const body = JSON.parse(String(init.body))
            const prompt = body.contents[0].parts[0].text as string
            const encodedTargets = prompt.match(/SOURCE\n([\s\S]*?)\n\nEND_SOURCE/)?.[1]
            const targets = JSON.parse(encodedTargets ?? "[]") as Array<{ id: string }>
            return new Response(JSON.stringify({
                candidates: [{ content: { parts: [{ text: JSON.stringify({
                    rewrites: targets.map(({ id }, index) => ({
                        id,
                        markdown: `Picture labeled blocks in tray ${index + 1}. Vectors give tokens numbers models compare during calculation.`,
                    })),
                }) }] } }],
            }), { status: 200 })
        })
        vi.stubGlobal("fetch", fetchMock)
        vi.spyOn(Date, "now")
            .mockReturnValueOnce(1_000)
            .mockReturnValueOnce(1_000)
            .mockReturnValue(241_001)

        await expect(personalizeLessonMarkdown({
            source,
            profile: {
                tonePreset: "clear",
                explanationLevel: "eli5",
                customInstructions: "",
                learnerContext: "",
            },
        })).rejects.toMatchObject({
            message: "Personalization generation timed out",
            status: 504,
        })
        expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    test("personalizes dense visual sets with capped parallel provider calls", async () => {
        const visuals: PersonalizationVisualSource[] = Array.from({ length: 4 }, (_, index) => {
            const number = index + 1
            return {
                id: `M${String(number).padStart(4, "0")}`,
                kind: "mermaid",
                name: `diagram_${number}`,
                source: `flowchart LR\nA${number}[Request] --> B${number}[Check]`,
                alt: `Request ${number} reaches check ${number}.`,
                canonicalMarkup: `<figure data-visual="${number}"><img src="/cdn/content-image/lesson/diagram_${number}_dark.png" /></figure>`,
            }
        })
        const source = [
            "# Visual lesson",
            "Tokens become vectors so models can compare useful numeric features during computation.",
            ...visuals.map((visual) => visual.canonicalMarkup),
        ].join("\n\n")
        let activeVisualCalls = 0
        let maximumVisualCalls = 0
        let visualSystemInstruction = ""
        let visualPrompt = ""
        const fetchMock = vi.fn().mockImplementation(async (_url, init: RequestInit) => {
            const body = JSON.parse(String(init.body))
            const prompt = body.contents[0].parts[0].text as string
            if (body.generationConfig.responseJsonSchema.properties.rewrites) {
                return new Response(JSON.stringify({
                    candidates: [{ content: { parts: [{ text: JSON.stringify({
                        rewrites: [{
                            id: "P0001",
                            markdown: "Picture tokens as labeled blocks. Vectors give models useful numbers to compare during calculation.",
                        }],
                    }) }] } }],
                }), { status: 200 })
            }

            if (!visualSystemInstruction) {
                visualSystemInstruction = String(body.systemInstruction?.parts?.[0]?.text ?? "")
                visualPrompt = prompt
            }
            activeVisualCalls++
            maximumVisualCalls = Math.max(maximumVisualCalls, activeVisualCalls)
            await new Promise((resolve) => setTimeout(resolve, 25))
            activeVisualCalls--
            const id = prompt.match(/"id":"(M\d{4})"/)?.[1]
            const number = Number(id?.slice(1))
            return new Response(JSON.stringify({
                candidates: [{ content: { parts: [{ text: JSON.stringify({
                    visuals: [{
                        id,
                        kind: "mermaid",
                        source: `flowchart TB\nA${number}[Learner request] --> B${number}[Safety check]`,
                    }],
                }) }] } }],
                usageMetadata: { totalTokenCount: 1 },
            }), { status: 200 })
        })
        vi.stubGlobal("fetch", fetchMock)

        const result = await personalizeLessonMarkdown({
            source,
            visuals,
            profile: {
                tonePreset: "clear",
                explanationLevel: "eli5",
                customInstructions: "",
                learnerContext: "",
            },
        })

        expect((result.markdown.match(/```mermaid/g) ?? [])).toHaveLength(4)
        expect(maximumVisualCalls).toBe(3)
        expect(fetchMock).toHaveBeenCalledTimes(5)
        expect(visualSystemInstruction).toContain("genuine visual encoding")
        expect(visualSystemInstruction).toContain("height <= 1.35 * width")
        expect(visualSystemInstruction).toContain("zero em dashes")
        expect(visualSystemInstruction).not.toContain("\u2014")
        expect(visualPrompt).toContain("VISUAL_OUTPUT_RULES")
        expect(visualPrompt).toContain("height <= 1.35 * width")
        expect(visualPrompt).not.toContain("VISUAL_OUTPUT_CONTRACT")
        expect(visualPrompt).not.toContain("No custom style supplied")
    })

    test("rejects invalid JSON when provider returns malformed output", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
            candidates: [{ content: { parts: [{ text: "not json" }] } }],
        }), { status: 200, headers: { "Content-Type": "application/json" } })))

        await expect(analyzeResumeProfile({
            bytes: new TextEncoder().encode("resume"),
            mimeType: "text/plain",
            fileName: "resume.txt",
        })).rejects.toThrow("invalid JSON")
    })
})
