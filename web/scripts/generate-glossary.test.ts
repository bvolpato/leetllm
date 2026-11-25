import { execFileSync } from "node:child_process"
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, expect, test } from "vitest"

const roots: string[] = []
const webRoot = process.cwd()

afterEach(() => {
    for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

test("glossary usage exports only website-visible articles and passages", () => {
    const root = mkdtempSync(join(tmpdir(), "leetllm-glossary-audience-"))
    roots.push(root)
    const contentDir = join(root, "src", "content")
    const glossaryDir = join(contentDir, "glossary")
    mkdirSync(glossaryDir, { recursive: true })
    writeFileSync(join(glossaryDir, "example-term.md"), [
        "---", "title: Example term", "importance: 50", "---", "",
        "A concrete teaching term.", "", "## Example", "A worked example.", "",
        "## Why it matters here", "It names a useful idea.",
    ].join("\n"))

    const writeBundle = (folder: string, slug: string, metadata: Record<string, unknown>, body: string) => {
        const articleDir = join(contentDir, folder, slug)
        mkdirSync(articleDir, { recursive: true })
        writeFileSync(join(articleDir, "content.md"), `---\n${JSON.stringify({ title: slug, slug, ...metadata })}\n---\n\n${body}`)
    }
    const term = '<span data-glossary="example-term">term</span>'
    writeBundle("fundamentals", "shared-article", {}, [
        "<!-- leetllm: audience:book:start -->", `Book-only explanation of ${term}.`,
        "<!-- leetllm: audience:book:end -->", "",
        "<!-- leetllm: audience:website:start -->", `Website explanation of ${term}.`,
        "<!-- leetllm: audience:website:end -->",
    ].join("\n"))
    writeBundle("fundamentals", "book-only-article", { visibility: { website: false } }, `Hidden article explanation of ${term}.`)
    writeBundle("blog", "book-only-post", { visibility: { website: false } }, `Hidden blog explanation of ${term}.`)
    writeBundle("blog", "website-only-post", { visibility: { book: false } }, `Public blog explanation of ${term}.`)

    execFileSync(join(webRoot, "node_modules", ".bin", "tsx"), [join(webRoot, "scripts", "generate-glossary.ts")], { cwd: root })
    const generated = JSON.parse(readFileSync(join(root, "src", "generated", "glossary-data.json"), "utf8")) as Record<
        string,
        { usage?: Array<{ title: string; url: string; excerpt: string }> }
    >
    const usages = generated["example-term"]?.usage ?? []

    expect(usages).toHaveLength(2)
    expect(usages).toEqual(expect.arrayContaining([
        { title: "website-only-post", url: "/blog/website-only-post", excerpt: "Public blog explanation of term." },
        { title: "shared-article", url: "/learn/shared-article", excerpt: "Website explanation of term." },
    ]))
})
