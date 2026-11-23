import { beforeEach, describe, expect, test, vi } from "vitest"

const { getUser, getIOSMasterclassEmail, getIOSPrivateBlogs } = vi.hoisted(() => ({
    getUser: vi.fn(),
    getIOSMasterclassEmail: vi.fn(),
    getIOSPrivateBlogs: vi.fn(),
}))
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ auth: { getUser } }) }))
vi.mock("@/lib/ios-private-blogs", () => ({
    getIOSMasterclassEmail,
    getIOSPrivateBlogs,
}))
import { GET } from "./route"

describe("iOS private blog access", () => {
    beforeEach(() => {
        vi.resetAllMocks()
        getIOSMasterclassEmail.mockReturnValue("owner@example.com")
    })

    test("rejects missing or invalid sessions before loading content", async () => {
        getUser.mockResolvedValue({ data: { user: null }, error: null })
        const response = await GET()
        expect(response.status).toBe(401)
        expect(response.headers.get("Cache-Control")).toContain("private, no-store")
        expect(getIOSPrivateBlogs).not.toHaveBeenCalled()
    })

    test.each([
        { email: "someone@example.com", email_confirmed_at: "2026-01-01" },
        { email: "owner@example.com", email_confirmed_at: null },
    ])("does not disclose content to an unauthorized identity: %j", async (user) => {
        getUser.mockResolvedValue({ data: { user }, error: null })
        const response = await GET()
        expect(await response.json()).toEqual({ blogs: [], images: {} })
        expect(getIOSPrivateBlogs).not.toHaveBeenCalled()
    })

    test("returns empty catalog when no owner email is configured", async () => {
        getIOSMasterclassEmail.mockReturnValue(null)
        getUser.mockResolvedValue({ data: { user: { email: "owner@example.com", email_confirmed_at: "2026-01-01" } }, error: null })
        const response = await GET()
        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({ blogs: [], images: {} })
        expect(getIOSPrivateBlogs).not.toHaveBeenCalled()
    })

    test("serves the masterclass only to the verified owner without caching", async () => {
        getUser.mockResolvedValue({ data: { user: { email: " OWNER@example.com ", email_confirmed_at: "2026-01-01" } }, error: null })
        const payload = { blogs: [{ slug: "glm-53-masterclass", content: "Private lesson" }], images: {} }
        getIOSPrivateBlogs.mockReturnValue(payload)
        const response = await GET()
        expect(response.status).toBe(200)
        expect(await response.json()).toEqual(payload)
        expect(response.headers.get("Cache-Control")).toContain("private, no-store")
        expect(response.headers.get("Vary")).toBe("Cookie, Authorization")
        expect(response.headers.get("X-Robots-Tag")).toContain("noindex")
    })

    test("reports unavailable assets without returning partial private content", async () => {
        getUser.mockResolvedValue({ data: { user: { email: "owner@example.com", email_confirmed_at: "2026-01-01" } }, error: null })
        getIOSPrivateBlogs.mockImplementation(() => { throw new Error("missing asset") })
        const response = await GET()
        expect(response.status).toBe(503)
        expect(await response.json()).toEqual({ error: "Private articles are temporarily unavailable" })
    })
})
