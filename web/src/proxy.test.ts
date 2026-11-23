import { beforeEach, describe, expect, test, vi } from "vitest"
import { NextRequest, NextResponse } from "next/server"
import { proxy } from "./proxy"
import { updateSession } from "@/lib/supabase/middleware"

vi.mock("@/lib/supabase/middleware", () => ({
    updateSession: vi.fn(),
}))

describe("public lesson navigation", () => {
    beforeEach(() => {
        vi.mocked(updateSession).mockReset()
        vi.mocked(updateSession).mockResolvedValue(NextResponse.next())
    })

    test.each([
        ["GET", "/learn"],
        ["GET", "/learn/vectors-matrices-tensors"],
        ["HEAD", "/learn/vectors-matrices-tensors"],
        ["GET", "/learn/vectors-matrices-tensors.md"],
    ])("serves static %s %s without waiting for authentication", async (method, pathname) => {
        const request = new NextRequest(`https://leetllm.com${pathname}`, {
            method,
            headers: {
                cookie: "sb-project-auth-token.0=chunk-one; sb-project-auth-token.1=chunk-two",
                RSC: "1",
                "Next-Router-Prefetch": "1",
            },
        })

        const response = await proxy(request)

        expect(updateSession).not.toHaveBeenCalled()
        expect(response.headers.get("x-middleware-next")).toBe("1")
        expect(response.headers.get("cache-control")).toBeNull()
        expect(response.headers.get("set-cookie")).toBeNull()
    })

    test.each([
        ["GET", "/dashboard"],
        ["GET", "/settings/personalization"],
        ["GET", "/api/user-study-state"],
        ["GET", "/login"],
        ["POST", "/learn/vectors-matrices-tensors"],
        ["GET", "/learn/vectors-matrices-tensors/account"],
    ])("preserves authentication for %s %s", async (method, pathname) => {
        const request = new NextRequest(`https://leetllm.com${pathname}`, {
            method,
            headers: { cookie: "sb-project-auth-token.0=chunk-one" },
        })

        const response = await proxy(request)

        expect(updateSession).toHaveBeenCalledWith(request)
        expect(response.headers.get("cache-control")).toBe("private, no-store, must-revalidate")
    })
})

describe("content redirects", () => {
    test.each([
        ["blog", ""],
        ["blog", ".md"],
        ["api/md", ""],
        ["api/md", ".md"],
    ])("redirects the former private GLM masterclass %s route (%s) to GLM-5.3", async (prefix, extension) => {
        const request = new NextRequest(`https://leetllm.com/${prefix}/glm-52-training-masterclass-3c1efdc30f7c0d3341d5${extension}?source=bookmark`)

        const response = await proxy(request)

        expect(response.status).toBe(308)
        expect(response.headers.get("location")).toBe(
            `https://leetllm.com/${prefix}/glm-53-training-masterclass-3c1efdc30f7c0d3341d5${extension}?source=bookmark`
        )
    })

    test("permanently redirects canonical blog aliases and preserves query parameters", async () => {
        const request = new NextRequest("https://leetllm.com/blog/run-qwen36-local?source=bookmark")

        const response = await proxy(request)

        expect(response.status).toBe(308)
        expect(response.headers.get("location")).toBe(
            "https://leetllm.com/blog/run-qwen36-local-unsloth-gguf?source=bookmark"
        )
    })

    test("permanently redirects retired indexed blog URLs and preserves query parameters", async () => {
        const request = new NextRequest("https://leetllm.com/blog/run-qwen35-local-ollama?source=google")

        const response = await proxy(request)

        expect(response.status).toBe(308)
        expect(response.headers.get("location")).toBe(
            "https://leetllm.com/blog/run-qwen36-local-unsloth-gguf?source=google"
        )
    })
})

describe("legacy auth posts", () => {
    test.each(["/login", "/signup"])("rejects direct POST %s before Server Action parsing", async (pathname) => {
        const request = new NextRequest(`https://leetllm.com${pathname}`, {
            method: "POST",
            headers: { "Content-Type": "multipart/form-data; boundary=missing" },
            body: "malformed",
        })

        const response = await proxy(request)

        expect(response.status).toBe(400)
        expect(await response.json()).toEqual({ error: "Submit this form from the current page" })
    })
})
