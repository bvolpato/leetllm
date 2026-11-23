import { describe, expect, test } from "vitest"
import { glossaryPlainText } from "./ios-glossary-text"

describe("iOS glossary list text", () => {
    test("keeps labels while removing Markdown source syntax", () => {
        expect(
            glossaryPlainText(
                "An **access control list (ACL)** defines *who* may call `deploy()` through [RBAC](glossary://rbac).",
            ),
        ).toBe("An access control list (ACL) defines who may call deploy() through RBAC.")
    })

    test("turns common inline LaTeX into readable preview text", () => {
        expect(
            glossaryPlainText("The **learning rate** $\\eta$ scales updates with $\\Delta W = -\\eta \\nabla L$ each step."),
        ).toBe("The learning rate η scales updates with Δ W = -η ∇ L each step.")
    })

    test("uses only first paragraph and truncates on a word boundary", () => {
        const result = glossaryPlainText(`${"token ".repeat(60)}\n\nHidden detail`, 80)
        expect(result).toMatch(/…$/)
        expect(result).not.toContain("Hidden detail")
        expect(result.length).toBeLessThanOrEqual(81)
    })

    test("removes source headings and fenced code from excerpts", () => {
        expect(glossaryPlainText('#### 2. BM25 negatives Find hard negatives. ```text Query: "secret"')).toBe(
            "2. BM25 negatives Find hard negatives.",
        )
    })

    test("removes unmatched Markdown left by an upstream excerpt", () => {
        expect(glossaryPlainText("The context degrades. **Rotary...")).toBe("The context degrades. Rotary...")
    })
})
