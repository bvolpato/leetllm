import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, expect, test } from "vitest"
import { processFolder } from "./generate_social_banners"

const roots: string[] = []

afterEach(() => {
    for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

test("website banner prompts omit book-only prose and skip website-invisible articles", () => {
    const articleDir = mkdtempSync(join(tmpdir(), "leetllm-banner-audience-"))
    roots.push(articleDir)
    const body = [
        "<!-- leetllm: audience:book:start -->", "Book-only explanation.",
        "<!-- leetllm: audience:book:end -->",
        "<!-- leetllm: audience:website:start -->", "Website explanation.",
        "<!-- leetllm: audience:website:end -->",
    ].join("\n")
    const writeBundle = (visibility: Record<string, boolean>) => writeFileSync(join(articleDir, "content.md"),
        `---\n${JSON.stringify({ title: "Example", slug: "example", visibility })}\n---\n\n${body}`)

    writeBundle({ book: false })
    const prompt = processFolder(articleDir)?.prompt
    expect(prompt).toContain("Website explanation.")
    expect(prompt).not.toContain("Book-only explanation.")
    expect(prompt).not.toContain("leetllm: audience")

    writeBundle({ website: false, book: true })
    expect(processFolder(articleDir)).toBeNull()
})
