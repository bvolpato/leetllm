import { describe, expect, test } from "vitest"
import { extractLessonBody } from "./lesson-content"
import {
    protectPersonalizationMarkdown,
    validateAndRestorePersonalizedMarkdown,
} from "./personalization-markdown"
import { getQuestionBySlug } from "./questions"

const SOURCE = `# Attention

Attention lets each token gather context from other tokens. This sentence stays available for rewriting.

<figure><img src="/cdn/content-image/example.png" alt="Example" /></figure>

Use <span data-glossary="softmax">softmax</span> to normalize scores.[Reference](/learn/reference)

$$y = Wx$$

| token | score |
|---|---:|
| cat | 0.8 |

\`\`\`python
scores = [0.8, 0.2]
\`\`\``

describe("personalized Markdown boundary", () => {
    test("restores every canonical technical block byte for byte", () => {
        const protectedSource = protectPersonalizationMarkdown(SOURCE)
        const rewritten = protectedSource.markdown.replace(
            "Attention lets each token gather context from other tokens. This sentence stays available for rewriting.",
            "Each token can look across nearby context and collect useful information. This prose was rewritten.",
        )
        const restored = validateAndRestorePersonalizedMarkdown(rewritten, protectedSource)

        expect(restored).toContain("<figure><img src=\"/cdn/content-image/example.png\"")
        expect(restored).toContain("<span data-glossary=\"softmax\">softmax</span>")
        expect(restored).toContain("[Reference](/learn/reference)")
        expect(restored).toContain("$$y = Wx$$")
        expect(restored).toContain("scores = [0.8, 0.2]")
        expect(restored).toContain("Each token can look across nearby context")
    })

    test("rejects missing, duplicated, or reordered protected blocks", () => {
        const protectedSource = protectPersonalizationMarkdown(SOURCE)
        const [first, second] = protectedSource.expectedTokens

        expect(() => validateAndRestorePersonalizedMarkdown(
            protectedSource.markdown.replace(first, ""),
            protectedSource,
        )).toThrow("Protected block count changed")
        expect(() => validateAndRestorePersonalizedMarkdown(
            protectedSource.markdown.replace(first, `${first}${first}`),
            protectedSource,
        )).toThrow("Protected block count changed")
        expect(() => validateAndRestorePersonalizedMarkdown(
            protectedSource.markdown.replace(first, "TEMP").replace(second, first).replace("TEMP", second),
            protectedSource,
        )).toThrow("Protected block order changed")
    })

    test("rejects model-authored HTML, links, images, and unsafe protocols", () => {
        const protectedSource = protectPersonalizationMarkdown(SOURCE)

        expect(() => validateAndRestorePersonalizedMarkdown(
            `${protectedSource.markdown}\n<script>alert(1)</script>`,
            protectedSource,
        )).toThrow("Model-authored HTML")
        expect(() => validateAndRestorePersonalizedMarkdown(
            `${protectedSource.markdown}\n[Injected](https://example.com)`,
            protectedSource,
        )).toThrow("Model-authored links or images")
        expect(() => validateAndRestorePersonalizedMarkdown(
            `${protectedSource.markdown}\njavascript:alert(1)`,
            protectedSource,
        )).toThrow("Unsafe URL protocol")
        expect(() => validateAndRestorePersonalizedMarkdown(
            `${protectedSource.markdown}\nVisit https://evil.example/reset`,
            protectedSource,
        )).toThrow("Model-authored autolinks")
        expect(() => validateAndRestorePersonalizedMarkdown(
            `${protectedSource.markdown}\nContact attacker@example.com`,
            protectedSource,
        )).toThrow("Model-authored autolinks")
    })

    test("allows a prose data label but rejects a data URL", () => {
        const source = "Sensitive data: review before release."
        const protectedSource = protectPersonalizationMarkdown(source)

        expect(validateAndRestorePersonalizedMarkdown(protectedSource.markdown, protectedSource)).toBe(source)
        expect(() => validateAndRestorePersonalizedMarkdown(
            `${protectedSource.markdown}\ndata:text/plain,secret`,
            protectedSource,
        )).toThrow("Unsafe URL protocol")
        expect(() => validateAndRestorePersonalizedMarkdown(
            `${protectedSource.markdown}\ndata:,secret`,
            protectedSource,
        )).toThrow("Unsafe URL protocol")
    })

    test("round-trips canonical comments and autolinks in a real lesson", () => {
        const question = getQuestionBySlug("guardrails-safety-filters-production")
        expect(question).toBeDefined()

        const source = extractLessonBody(question!.content).content
        const protectedSource = protectPersonalizationMarkdown(source)

        expect(validateAndRestorePersonalizedMarkdown(
            protectedSource.markdown,
            protectedSource,
        )).toBe(source.trim())
    })
})
