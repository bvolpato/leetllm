import { describe, expect, test } from "vitest"
import {
    PERSONALIZATION_LIMITS,
    toPersonalizationProfile,
    validatePersonalizationProfileInput,
    validateResumeUpload,
} from "./personalization-profile"

describe("personalization profile validation", () => {
    test("normalizes a valid profile", () => {
        expect(validatePersonalizationProfileInput({
            tone: "cowboy",
            explanationLevel: "eli5",
            customInstructions: "  Prefer small examples. ",
            learnerContext: " Python developer ",
            clearResumeContext: false,
        })).toEqual({
            tone: "cowboy",
            explanationLevel: "eli5",
            customInstructions: "Prefer small examples.",
            learnerContext: "Python developer",
            clearResumeContext: false,
        })
    })

    test("rejects unknown enums and oversized instructions", () => {
        expect(() => validatePersonalizationProfileInput({
            tone: "pirate",
            explanationLevel: "balanced",
            customInstructions: "",
            learnerContext: "",
            clearResumeContext: false,
        })).toThrow("Invalid tone")
        expect(() => validatePersonalizationProfileInput({
            tone: "clear",
            explanationLevel: "balanced",
            customInstructions: "x".repeat(PERSONALIZATION_LIMITS.customInstructions + 1),
            learnerContext: "",
            clearResumeContext: false,
        })).toThrow("Custom instructions")
    })

    test("maps a stored row to the public profile shape", () => {
        expect(toPersonalizationProfile({
            tone_preset: "professional",
            explanation_level: "advanced",
            custom_instructions: "Use systems examples",
            learner_context: "Staff engineer",
            resume_context: "Distributed systems and Python",
            resume_filename: "resume.pdf",
            resume_updated_at: "2026-07-23T11:59:00.000Z",
            revision: 4,
            updated_at: "2026-07-23T12:00:00.000Z",
        })).toMatchObject({
            tone: "professional",
            explanationLevel: "advanced",
            resumeContext: "Distributed systems and Python",
            revision: 4,
        })
    })
})

describe("resume upload validation", () => {
    function uploadedFile(contents: string, name: string, type: string): File {
        const bytes = new TextEncoder().encode(contents)
        return {
            name,
            type,
            size: bytes.byteLength,
            arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
        } as File
    }

    test("accepts UTF-8 Markdown and normalizes its MIME type", async () => {
        const file = uploadedFile("# Experience\nPython and ML", "resume.md", "text/plain")
        const result = await validateResumeUpload(file)

        expect(result.fileName).toBe("resume.md")
        expect(result.mimeType).toBe("text/markdown")
        expect(new TextDecoder().decode(result.bytes)).toContain("Python and ML")
    })

    test("rejects disguised PDFs", async () => {
        const file = uploadedFile("not a PDF", "resume.pdf", "application/pdf")
        await expect(validateResumeUpload(file)).rejects.toThrow("not a valid PDF")
    })
})
