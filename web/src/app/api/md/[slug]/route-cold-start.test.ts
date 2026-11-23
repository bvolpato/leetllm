import { NextRequest } from "next/server"
import { afterEach, describe, expect, test, vi } from "vitest"

afterEach(() => {
    vi.doUnmock("@/lib/content-bundle")
    vi.resetModules()
})

async function loadRouteWithBundleSpy() {
    const original = await vi.importActual<typeof import("@/lib/content-bundle")>("@/lib/content-bundle")
    const loadContentBundle = vi.fn(original.loadContentBundle)
    vi.doMock("@/lib/content-bundle", () => ({ ...original, loadContentBundle }))
    const { GET } = await import("./route")
    return { GET, loadContentBundle }
}

async function requestMarkdown(GET: typeof import("./route").GET, slug: string) {
    return GET(
        new NextRequest(`http://localhost/api/md/${slug}`, {
            headers: { "Accept-Encoding": "identity" },
        }),
        { params: Promise.resolve({ slug }) },
    )
}

describe("indexed Markdown route lookup", () => {
    test("loads only the requested public blog bundle", async () => {
        const { GET, loadContentBundle } = await loadRouteWithBundleSpy()
        const response = await requestMarkdown(GET, "run-qwen36-local-unsloth-gguf")

        expect(response.status).toBe(200)
        expect(response.headers.get("Cache-Control")).toBe("public, s-maxage=3600, stale-while-revalidate=600")
        expect(loadContentBundle).toHaveBeenCalledTimes(1)
    })

    test("preserves private blog cache and indexing controls", async () => {
        const { GET, loadContentBundle } = await loadRouteWithBundleSpy()
        const response = await requestMarkdown(GET, "context-engineering-beyond-prompt-engineering")

        expect(response.status).toBe(200)
        expect(response.headers.get("Cache-Control")).toBe("private, no-store")
        expect(response.headers.get("X-Robots-Tag")).toBe("noindex, nofollow, noarchive")
        expect(loadContentBundle).toHaveBeenCalledTimes(1)
    })

    test("serves indexed glossary Markdown without loading content bundles", async () => {
        const { GET, loadContentBundle } = await loadRouteWithBundleSpy()
        const response = await requestMarkdown(GET, "ab-testing")

        expect(response.status).toBe(200)
        expect(await response.text()).toContain("# A/B testing")
        expect(loadContentBundle).not.toHaveBeenCalled()
    })

    test("returns missing and draft routes without scanning content", async () => {
        const { GET, loadContentBundle } = await loadRouteWithBundleSpy()

        for (const slug of ["does-not-exist", "run-qwen35-local-ollama"]) {
            const response = await requestMarkdown(GET, slug)
            expect(response.status).toBe(404)
            expect(response.headers.get("Cache-Control")).toBe("private, no-store")
        }
        expect(loadContentBundle).not.toHaveBeenCalled()
    })
})
