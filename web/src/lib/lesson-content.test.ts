import { describe, expect, test } from "vitest"
import { extractLessonBody, extractNextCallout } from "./lesson-content"

describe("lesson handoff extraction", () => {
    test.each([
        ["Continue to ", "Follow the same tensor through attention."],
        ["Study ", "Study Attention. Follow the same tensor through attention."],
        ["Use these shapes in ", "Use these shapes in Attention. Follow the same tensor through attention."],
        ["", "Follow the same tensor through attention."],
    ])("preserves handoff guidance with prefix '%s'", (prefix, description) => {
        const handoff = `> **Next:** ${prefix}[Attention](/learn/attention). Follow the same tensor through attention.`
        expect(extractNextCallout(`Lesson body.\n\n${handoff}`)).toEqual({
            content: "Lesson body.",
            callout: {
                title: "Attention",
                href: "/learn/attention",
                description,
            },
        })
    })

    test("extracts a handoff without a description", () => {
        expect(extractNextCallout("> **Next:** [Attention](/learn/attention)").callout).toEqual({
            title: "Attention",
            href: "/learn/attention",
            description: "",
        })
    })

    test("leaves non-lesson links in the body", () => {
        const content = "Lesson body.\n\n> **Next:** Study [Notes](/blog/notes). Read the notes."
        expect(extractNextCallout(content)).toEqual({ content, callout: null })
    })

    test("keeps quiz extraction separate from the varied handoff wording", () => {
        const questions = Array.from({ length: 5 }, (_, index) => ({
            question: `Shape question ${index + 1}?`,
            options: ["A", "B", "C", "D"],
            answer: "A",
            explanation: "The shape determines the answer.",
        }))
        const content = `Lesson body.\n\n\`\`\`mastery-quiz\n${JSON.stringify(questions)}\n\`\`\`\n\n> **Next:** Study [Attention](/learn/attention). Follow the tensor.`
        expect(extractLessonBody(content)).toEqual({
            content: "Lesson body.",
            masteryQuestions: questions,
            nextCallout: {
                title: "Attention",
                href: "/learn/attention",
                description: "Study Attention. Follow the tensor.",
            },
        })
    })
})
