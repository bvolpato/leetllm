import { describe, expect, test } from "vitest"
import { glossaryPreviewStartsWithTitle } from "./glossary-preview"

describe("glossaryPreviewStartsWithTitle", () => {
    test("recognizes plain and Markdown-emphasized term names", () => {
        expect(glossaryPreviewStartsWithTitle("**SkyRL** is an RL stack.", "SkyRL")).toBe(true)
        expect(glossaryPreviewStartsWithTitle("Cosine similarity measures alignment.", "Cosine similarity")).toBe(true)
    })

    test("keeps a separate title when definition opens differently", () => {
        expect(glossaryPreviewStartsWithTitle("Fully Sharded Data Parallel shards model state.", "FSDP")).toBe(false)
        expect(glossaryPreviewStartsWithTitle("A matrix stores rows and columns.", "Matrix")).toBe(false)
    })
})
