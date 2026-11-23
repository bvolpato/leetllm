import { beforeEach, describe, expect, test, vi } from "vitest"
import { NextRequest } from "next/server"

const { createClientMock, renderSvgMock } = vi.hoisted(() => ({
    createClientMock: vi.fn(),
    renderSvgMock: vi.fn(),
}))

vi.mock("@/lib/supabase/server", () => ({ createClient: createClientMock }))
vi.mock("@/lib/personalization-vizmatic", async (importOriginal) => {
    const original = await importOriginal<typeof import("@/lib/personalization-vizmatic")>()
    return { ...original, renderVizmaticSceneSvg: renderSvgMock }
})

import { POST, runtime } from "./route"

const spec = {
    width: 900,
    height: 520,
    alt: "A three-stage learning flow",
    root: {
        type: "Scene",
        props: { title: "Learning flow" },
        children: [{
            type: "Flow",
            props: {
                stages: [
                    { title: "Read", tone: "blue" },
                    { title: "Build", tone: "purple" },
                    { title: "Verify", tone: "green" },
                ],
            },
        }],
    },
}

function authenticatedClient(markdown = `\`\`\`vizmatic\n${JSON.stringify(spec)}\n\`\`\``) {
    const query = {
        select: vi.fn(),
        eq: vi.fn(),
        maybeSingle: vi.fn().mockResolvedValue({ data: { markdown }, error: null }),
    }
    query.select.mockReturnValue(query)
    query.eq.mockReturnValue(query)
    return {
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }) },
        from: vi.fn().mockReturnValue(query),
    }
}

describe("personalized Vizmatic render route", () => {
    beforeEach(() => {
        createClientMock.mockReset()
        renderSvgMock.mockReset()
    })

    test("uses Node runtime and requires authentication", async () => {
        createClientMock.mockResolvedValue({
            auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
        })

        const response = await POST(new NextRequest("http://localhost/api/personalization/render-vizmatic", {
            method: "POST",
            body: JSON.stringify({ spec, theme: "light", slug: "lesson" }),
        }))

        expect(runtime).toBe("nodejs")
        expect(response.status).toBe(401)
        expect(response.headers.get("cache-control")).toContain("private, no-store")
        expect(renderSvgMock).not.toHaveBeenCalled()
    })

    test("rejects cross-origin requests before authentication", async () => {
        const response = await POST(new NextRequest("http://localhost/api/personalization/render-vizmatic", {
            method: "POST",
            headers: { Origin: "https://evil.example" },
            body: JSON.stringify({ spec, theme: "dark", slug: "lesson" }),
        }))

        expect(response.status).toBe(403)
        expect(createClientMock).not.toHaveBeenCalled()
    })

    test("renders validated specs as private SVG", async () => {
        createClientMock.mockResolvedValue(authenticatedClient())
        renderSvgMock.mockResolvedValue("<svg><text>Learning flow</text></svg>")

        const response = await POST(new NextRequest("http://localhost/api/personalization/render-vizmatic", {
            method: "POST",
            headers: { Origin: "http://localhost", "Content-Type": "application/json" },
            body: JSON.stringify({ spec, theme: "dark", slug: "lesson" }),
        }))

        expect(response.status).toBe(200)
        expect(response.headers.get("content-type")).toContain("image/svg+xml")
        expect(response.headers.get("cache-control")).toContain("private, no-store")
        expect(response.headers.get("x-content-type-options")).toBe("nosniff")
        expect(await response.text()).toContain("Learning flow")
        expect(renderSvgMock).toHaveBeenCalledWith(spec, "dark", {
            signal: expect.any(AbortSignal),
        })
    })

    test("rejects unsafe specs with a generic error", async () => {
        createClientMock.mockResolvedValue(authenticatedClient())
        const unsafe = structuredClone(spec)
        ;(unsafe.root.children[0].props as Record<string, unknown>).style = { position: "absolute" }

        const response = await POST(new NextRequest("http://localhost/api/personalization/render-vizmatic", {
            method: "POST",
            headers: { Origin: "http://localhost" },
            body: JSON.stringify({ spec: unsafe, theme: "dark", slug: "lesson" }),
        }))

        expect(response.status).toBe(400)
        expect(await response.json()).toEqual({ error: "Invalid visualization" })
        expect(renderSvgMock).not.toHaveBeenCalled()
    })

    test("rejects valid scenes that are not in the user's cached lesson", async () => {
        createClientMock.mockResolvedValue(authenticatedClient("# Personalized lesson without this scene"))

        const response = await POST(new NextRequest("http://localhost/api/personalization/render-vizmatic", {
            method: "POST",
            headers: { Origin: "http://localhost" },
            body: JSON.stringify({ spec, theme: "light", slug: "lesson" }),
        }))

        expect(response.status).toBe(403)
        expect(await response.json()).toEqual({ error: "Visualization unavailable" })
        expect(renderSvgMock).not.toHaveBeenCalled()
    })
})
