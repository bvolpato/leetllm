import { existsSync, readFileSync, readdirSync } from "fs"
import { basename, join } from "path"
import { describe, expect, test } from "vitest"
import {
    GLOSSARY_ENTRIES_BY_IMPORTANCE,
    type GlossaryEntryWithId,
} from "../src/generated/glossary"

const webRoot = process.cwd()
const contentRoot = join(webRoot, "src", "content")
const iosGlossaryIndex = join(
    webRoot,
    "..",
    "mobile",
    "ios",
    "LeetLLM",
    "LeetLLM",
    "Resources",
    "data",
    "glossary",
    "index.json",
)
const iosDataRoot = join(webRoot, "..", "mobile", "ios", "LeetLLM", "LeetLLM", "Resources", "data")

function entryTextBlob(entry: GlossaryEntryWithId): string {
    const details = entry.details ?? []
    return [
        entry.definition,
        entry.example,
        entry.relevance,
        entry.intuition ?? "",
        entry.formula ?? "",
        ...details.map((d: { content: string }) => d.content),
    ].join("\n")
}

describe("iOS glossary media wiring", () => {
    test("generated glossary resolves mermaid to CDN figure HTML for visual terms", () => {
        const visual = GLOSSARY_ENTRIES_BY_IMPORTANCE.filter((entry) => {
            const blob = entryTextBlob(entry)
            return blob.includes("data-diagram-alt") || blob.includes("_diagram_0_")
        })
        expect(visual.length).toBeGreaterThanOrEqual(30)

        const softmax = GLOSSARY_ENTRIES_BY_IMPORTANCE.find((e) => e.id === "softmax" || e.title === "Softmax")
        expect(softmax).toBeDefined()
        const softmaxEntry = softmax as GlossaryEntryWithId
        const detailHtml = (softmaxEntry.details ?? []).map((d) => d.content).join("\n")
        expect(detailHtml).toContain("/cdn/content-image/glossary/softmax/diagrams/_generated/")
        expect(detailHtml).not.toContain("```mermaid")
    })

    test("glossary mermaid sources have pre-rendered dark/light PNGs on disk", () => {
        const glossaryDir = join(contentRoot, "glossary")
        const ids = readdirSync(glossaryDir)
            .filter((name) => name.endsWith(".md"))
            .map((name) => basename(name, ".md"))

        let mermaidCount = 0
        for (const id of ids) {
            const md = readFileSync(join(glossaryDir, `${id}.md`), "utf8")
            if (!md.includes("```mermaid")) continue
            mermaidCount += 1
            const dark = join(glossaryDir, id, "diagrams", "_generated", `${id}_diagram_0_dark.png`)
            const light = join(glossaryDir, id, "diagrams", "_generated", `${id}_diagram_0_light.png`)
            expect(existsSync(dark), `missing ${dark}`).toBe(true)
            expect(existsSync(light), `missing ${light}`).toBe(true)
        }
        expect(mermaidCount).toBeGreaterThanOrEqual(30)
    })

    test.skipIf(!existsSync(iosGlossaryIndex))(
        "iOS bundled glossary rewrites CDN paths to offline images/ and packs PNGs",
        () => {
            const entries = JSON.parse(readFileSync(iosGlossaryIndex, "utf8")) as Array<{
                id?: string
                title?: string
                details?: { title: string; content: string }[]
                images?: { path: string; theme?: string }[]
            }>

            const withImages = entries.filter((e) => (e.images?.length ?? 0) > 0)
            expect(withImages.length).toBeGreaterThanOrEqual(30)

            const softmax = entries.find((e) => e.id === "softmax" || e.title === "Softmax")
            expect(softmax?.images?.length).toBeGreaterThanOrEqual(2)
            expect(JSON.stringify(softmax)).not.toContain("/cdn/content-image/")
            expect(JSON.stringify(softmax)).not.toContain("?v=")

            for (const img of softmax!.images ?? []) {
                expect(img.path.startsWith("images/glossary/")).toBe(true)
                expect(existsSync(join(iosDataRoot, img.path))).toBe(true)
            }

            const diagramDetail = softmax?.details?.find(
                (d) => /diagram/i.test(d.title) || d.content.includes("<img"),
            )
            expect(diagramDetail?.content).toContain('src="images/glossary/softmax/')
        },
    )
})
