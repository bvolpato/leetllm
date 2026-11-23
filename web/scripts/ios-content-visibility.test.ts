import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, expect, test } from "vitest"
import { createPublicContentBundleFilter } from "./ios-content-visibility"

const roots: string[] = []
afterEach(() => {
    for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

test("offline asset selection excludes website-invisible lessons and preserves public and shared assets", () => {
    const contentRoot = mkdtempSync(join(tmpdir(), "leetllm-ios-visibility-"))
    roots.push(contentRoot)
    const article = (slug: string, metadata: Record<string, unknown>) => {
        const directory = join(contentRoot, "fundamentals", slug)
        mkdirSync(directory, { recursive: true })
        writeFileSync(join(directory, "content.md"), `---\n${JSON.stringify({ slug, ...metadata })}\n---\n\nArticle body.`)
        return directory
    }
    const bookOnly = article("book-only", { visibility: { website: false } })
    const websiteOnly = article("website-only", { visibility: { book: false } })
    const hidden = article("hidden", { hidden: true })
    const include = createPublicContentBundleFilter(contentRoot, new Set(["public-post"]))

    expect(include(join(bookOnly, "illustrations", "diagram.png"))).toBe(false)
    expect(include(join(bookOnly, "assets", "lab.py"))).toBe(false)
    expect(include(join(hidden, "assets", "lab.py"))).toBe(false)
    expect(include(join(websiteOnly, "illustrations", "diagram.png"))).toBe(true)
    expect(include(join(contentRoot, "glossary", "term", "diagram.png"))).toBe(true)
    expect(include(join(contentRoot, "shared", "logo.png"))).toBe(true)
    expect(include(join(contentRoot, "blog", "public-post", "diagram.png"))).toBe(true)
    expect(include(join(contentRoot, "blog", "private-post", "diagram.png"))).toBe(false)
})
