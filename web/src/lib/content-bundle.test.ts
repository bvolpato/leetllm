import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, describe, expect, test } from "vitest"
import { loadContentBundle, materializeEmbeddedIllustrationSources } from "./content-bundle"

const tempDirs: string[] = []

function makeArticleDir() {
    const dir = mkdtempSync(join(tmpdir(), "leetllm-content-bundle-"))
    tempDirs.push(dir)
    return dir
}

afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
        rmSync(dir, { recursive: true, force: true })
    }
})

describe("loadContentBundle", () => {
    test("loads legacy metadata.json plus content.md", () => {
        const articleDir = makeArticleDir()
        writeFileSync(join(articleDir, "metadata.json"), JSON.stringify({ slug: "legacy" }))
        writeFileSync(join(articleDir, "content.md"), "# Legacy article\n")

        const bundle = loadContentBundle(articleDir)

        expect(bundle?.metadata).toEqual({ slug: "legacy" })
        expect(bundle?.body).toBe("# Legacy article")
        expect(bundle?.metadataPath).toBe(join(articleDir, "metadata.json"))
    })

    test("loads JSON frontmatter from content.md without metadata.json", () => {
        const articleDir = makeArticleDir()
        writeFileSync(
            join(articleDir, "content.md"),
            [
                "---",
                JSON.stringify({ slug: "frontmatter", title: "Frontmatter" }, null, 2),
                "---",
                "# Frontmatter article",
                "",
            ].join("\n")
        )

        const bundle = loadContentBundle(articleDir)

        expect(bundle?.metadata).toEqual({ slug: "frontmatter", title: "Frontmatter" })
        expect(bundle?.body).toBe("# Frontmatter article")
        expect(bundle?.metadataPath).toBeUndefined()
    })

    test("selects audience text before materializing illustrations without changing the source", () => {
        const articleDir = makeArticleDir()
        const contentPath = join(articleDir, "content.md")
        const body = [
            "Shared explanation.",
            "<!-- leetllm: audience:website:start -->",
            "Website walkthrough.",
            "<!-- leetllm: audience:website:end -->",
            "<!-- leetllm: audience:book:start -->",
            "Book derivation.",
            '```tsx render="illustration"',
            "export default function Diagram() { return <svg /> }",
            "```",
            "<!-- leetllm: audience:book:end -->",
        ].join("\n")
        const source = `---\n${JSON.stringify({ slug: "audiences" })}\n---\n\n${body}\n`
        writeFileSync(contentPath, source)

        const website = loadContentBundle(articleDir, "website")
        expect(website?.body).toContain("Website walkthrough.")
        expect(website?.body).not.toContain("Book derivation.")
        expect(website?.body).not.toContain("leetllm: audience")
        expect(website?.sourceBody).toBe(body)
        expect(() => loadContentBundle(articleDir, "book")).toThrow(/needs name/)
        expect(readFileSync(contentPath, "utf8")).toBe(source)
    })

    test("keeps both audience variants for authoring tools by default", () => {
        const articleDir = makeArticleDir()
        const body = [
            "Shared explanation.",
            "<!-- leetllm: audience:website:start -->",
            "Website walkthrough.",
            "<!-- leetllm: audience:website:end -->",
            "<!-- leetllm: audience:book:start -->",
            "Book derivation.",
            "<!-- leetllm: audience:book:end -->",
        ].join("\n")
        writeFileSync(join(articleDir, "metadata.json"), JSON.stringify({ slug: "audiences" }))
        writeFileSync(join(articleDir, "content.md"), body)

        const raw = loadContentBundle(articleDir)
        expect(raw?.body).toBe(body)
        expect(raw?.sourceBody).toBe(body)
        expect(loadContentBundle(articleDir, "book")?.body).toContain("Book derivation.")
        expect(loadContentBundle(articleDir, "book")?.body).not.toContain("Website walkthrough.")
    })
})

describe("materializeEmbeddedIllustrationSources", () => {
    test("turns renderable illustration source fences into displayed figures", () => {
        const markdown = [
            "Intro.",
            "",
            "```typescript render=\"illustration\" name=\"demo\" alt=\"Demo diagram\" caption=\"Caption text\"",
            "export default function Demo() {",
            "  return <svg />",
            "}",
            "```",
            "",
            "Outro.",
        ].join("\n")

        expect(materializeEmbeddedIllustrationSources(markdown)).toBe(
            [
                "Intro.",
                "",
                '<figure>',
                '<img src="illustrations/_generated/demo_dark.png" alt="Demo diagram" />',
                '<figcaption>Caption text</figcaption>',
                '</figure>',
                "",
                "Outro.",
            ].join("\n")
        )
    })

    test("uses exported alt only as a legacy fallback", () => {
        const markdown = [
            "```typescript render=\"illustration\" name=\"demo\"",
            "export const alt = 'Legacy alt fallback'",
            "export default function Demo() { return <svg /> }",
            "```",
        ].join("\n")

        expect(materializeEmbeddedIllustrationSources(markdown)).toBe(
            [
                '<figure>',
                '<img src="illustrations/_generated/demo_dark.png" alt="Legacy alt fallback" />',
                '</figure>',
            ].join("\n")
        )
    })
})
