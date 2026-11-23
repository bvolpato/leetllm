import { describe, expect, test } from "vitest"
import fixtures from "./content-audience.fixtures.json"
import { filterContentForAudience, isVisibleToAudience, type ContentAudience, type ContentEdition } from "./content-audience"

const audiences: ContentAudience[] = ["book", "website"]

describe.each(audiences)("%s content selection", audience => {
    test.each(fixtures.passages)("$name", fixture => {
        expect(filterContentForAudience(fixture.content, audience, "lesson/content.md")).toBe(fixture[audience])
    })

    test.each(fixtures.errors)("rejects $name, including excluded branches", fixture => {
        expect(() => filterContentForAudience(fixture.content, audience, "lesson/content.md"))
            .toThrow(`lesson/content.md:${fixture.line}:`)
        expect(() => filterContentForAudience(fixture.content, audience)).toThrow(fixture.message)
    })

    test.each(fixtures.visibility)("$name", fixture => {
        const original = JSON.stringify(fixture.metadata)
        expect(isVisibleToAudience(fixture.metadata, audience)).toBe(fixture[audience])
        expect(JSON.stringify(fixture.metadata)).toBe(original)
    })

    test.each(fixtures.invalidVisibility)("rejects invalid visibility %j", metadata => {
        expect(() => isVisibleToAudience(metadata, audience)).toThrow("Invalid content visibility")
    })
})

describe("authored book editions", () => {
    test.each(fixtures.editions)("$name", fixture => {
        expect(filterContentForAudience(fixture.content, fixture.audience as ContentAudience, "chapter.md", fixture.edition as ContentEdition)).toBe(fixture.expected)
    })

    test("validates hidden edition branches and nesting", () => {
        expect(() => filterContentForAudience("<!-- leetllm: edition:reference:start -->hidden\n<!-- leetllm: edition:reader:end -->", "book", "chapter.md", "reader"))
            .toThrow("Mismatched edition:reader:end; edition:reference:start opened on line 1")
        expect(() => filterContentForAudience("<!-- leetllm: edition:abridged:start -->", "book"))
            .toThrow("Invalid edition marker")
    })
})
