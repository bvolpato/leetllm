import { describe, expect, test, vi } from "vitest"

vi.mock("server-only", () => ({}))

import { getLeetyPageContext } from "./leety-context"

describe("getLeetyPageContext", () => {
    test("loads lesson Markdown from trusted content source", () => {
        const context = getLeetyPageContext("/learn/numpy-and-tensor-shapes")

        expect(context).toMatchObject({
            kind: "lesson",
            slug: "numpy-and-tensor-shapes",
            canonicalPath: "/learn/numpy-and-tensor-shapes",
            allowAnonymous: false,
        })
        expect(context?.markdown).toContain("# Tensors, Shapes & Matrix Arithmetic")
        expect(context?.markdown.length).toBeGreaterThan(1_000)
    })

    test("resolves direct private blog routes only by canonical slug", () => {
        const context = getLeetyPageContext("/blog/glm-53-training-masterclass-3c1efdc30f7c0d3341d5")

        expect(context).toMatchObject({
            kind: "blog",
            title: "GLM-5.3 Training Masterclass",
            canonicalPath: "/blog/glm-53-training-masterclass-3c1efdc30f7c0d3341d5",
            allowAnonymous: true,
        })
        expect(context?.markdown).toContain("## Table of contents")
    })

    test.each([
        "/learn",
        "/glossary",
        "/learn/../../etc/passwd",
        "/blog/not-a-real-post",
        "https://leetllm.com/learn/numpy-and-tensor-shapes",
    ])("rejects unsupported or unsafe page path %s", (pathname) => {
        expect(getLeetyPageContext(pathname)).toBeNull()
    })
})
