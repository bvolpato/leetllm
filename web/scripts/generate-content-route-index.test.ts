import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, describe, expect, test } from "vitest"
import {
    buildContentRouteManifests,
    writeContentRouteManifests,
} from "./generate-content-route-index"

const temporaryRoots: string[] = []

afterEach(() => {
    for (const root of temporaryRoots.splice(0)) rmSync(root, { recursive: true, force: true })
})

function contentRoot(): string {
    const root = mkdtempSync(join(tmpdir(), "leetllm-route-index-"))
    temporaryRoots.push(root)
    return root
}

function writeBundle(root: string, folder: string, directory: string, metadata: Record<string, unknown>) {
    const articleDir = join(root, folder, directory)
    mkdirSync(articleDir, { recursive: true })
    writeFileSync(
        join(articleDir, "content.md"),
        `---\n${JSON.stringify(metadata, null, 2)}\n---\n\nBody\n`,
    )
}

describe("content route index generation", () => {
    test("indexes canonical routes, aliases, visibility, redirects, and glossary slugs", () => {
        const root = contentRoot()
        writeBundle(root, "foundations", "directory-name", {
            slug: "canonical-question",
            aliases: ["legacy-question"],
            hidden: true,
        })
        writeBundle(root, "blog", "private-directory", {
            slug: "private-post",
            aliases: ["private-legacy"],
            private: true,
        })
        writeBundle(root, "blog", "retired-directory", {
            slug: "retired-post",
            draft: true,
            private: true,
            redirectTo: "/blog/private-post",
        })
        mkdirSync(join(root, "glossary"), { recursive: true })
        writeFileSync(join(root, "glossary", "indexed-term.md"), "---\ntitle: Indexed term\n---\n")

        writeBundle(root, "blog", "public-directory", {
            slug: "public-post",
            aliases: ["legacy-post"],
        })

        const { routes: index, aliases } = buildContentRouteManifests(root)

        expect(index.questions["canonical-question"]).toEqual({
            directory: "foundations/directory-name",
            canonicalSlug: "canonical-question",
            hidden: true,
        })
        expect(index.questions["legacy-question"]).toEqual(index.questions["canonical-question"])
        expect(index.questions["directory-name"]).toBeUndefined()
        expect(index.blogs["private-post"]).toMatchObject({ private: true, draft: false })
        expect(index.blogs["retired-post"]).toMatchObject({
            draft: true,
            private: true,
            redirectTo: "/blog/private-post",
        })
        expect(index.glossary).toEqual(["indexed-term"])
        expect(JSON.stringify(index)).not.toContain(root)
        expect(aliases).toEqual({
            learn: {},
            blog: {
                "legacy-post": "public-post",
                "private-legacy": "private-post",
                "retired-post": "private-post",
            },
        })
    })

    test("rewrites alias output without retaining stale aliases", () => {
        const root = contentRoot()
        const outputDir = join(root, "generated")
        const routesPath = join(outputDir, "content-route-index.json")
        const aliasesPath = join(outputDir, "content-aliases.json")
        writeBundle(root, "foundations", "directory-name", {
            slug: "canonical-question",
            aliases: ["old-question-alias"],
        })

        writeContentRouteManifests(root, routesPath, aliasesPath)
        writeBundle(root, "foundations", "directory-name", {
            slug: "canonical-question",
            aliases: ["new-question-alias"],
        })
        writeContentRouteManifests(root, routesPath, aliasesPath)

        const aliases = JSON.parse(readFileSync(aliasesPath, "utf8"))
        expect(aliases.learn).toEqual({ "new-question-alias": "canonical-question" })
        expect(aliases.learn["old-question-alias"]).toBeUndefined()
    })

    test("blocks book-only article and blog routes and their aliases on the website", () => {
        const root = contentRoot()
        writeBundle(root, "foundations", "book-only-chapter", {
            slug: "book-only-chapter",
            aliases: ["book-chapter-alias"],
            visibility: { website: false, book: true },
        })
        writeBundle(root, "foundations", "website-only-lesson", {
            slug: "website-only-lesson",
            visibility: { book: false },
        })
        writeBundle(root, "blog", "book-only-post", {
            slug: "book-only-post",
            aliases: ["book-post-alias"],
            visibility: { website: false },
        })
        writeBundle(root, "blog", "website-only-post", {
            slug: "website-only-post",
            visibility: { book: false },
        })

        const { routes, aliases } = buildContentRouteManifests(root)
        expect(routes.questions["book-only-chapter"].hidden).toBe(true)
        expect(routes.questions["book-chapter-alias"].hidden).toBe(true)
        expect(routes.questions["website-only-lesson"].hidden).toBe(false)
        expect(routes.blogs["book-only-post"].hidden).toBe(true)
        expect(routes.blogs["website-only-post"].hidden).toBeUndefined()
        expect(aliases).toEqual({ learn: {}, blog: {} })
    })

    test("rejects an alias that collides with a canonical slug", () => {
        const root = contentRoot()
        writeBundle(root, "foundations", "first-directory", { slug: "first-question" })
        writeBundle(root, "preparation", "second-directory", {
            slug: "second-question",
            aliases: ["first-question"],
        })

        expect(() => buildContentRouteManifests(root)).toThrow(/alias first-question conflicts/)
    })

    test("rejects blog aliases and redirects that do not target a non-draft canonical post", () => {
        const root = contentRoot()
        writeBundle(root, "blog", "draft-target", {
            slug: "draft-target",
            draft: true,
        })
        writeBundle(root, "blog", "retired", {
            slug: "retired-post",
            redirectTo: "/blog/draft-target",
        })

        expect(() => buildContentRouteManifests(root)).toThrow(
            /Blog aliases and redirects must target website-visible non-draft canonical posts: draft-target/,
        )
    })

    test("rejects a public redirect to a book-only blog post", () => {
        const root = contentRoot()
        writeBundle(root, "blog", "book-target", {
            slug: "book-target",
            visibility: { website: false },
        })
        writeBundle(root, "blog", "retired", {
            slug: "retired-post",
            redirectTo: "/blog/book-target",
        })

        expect(() => buildContentRouteManifests(root)).toThrow(/website-visible.*book-target/)
    })
})
