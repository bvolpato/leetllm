import { beforeEach, describe, expect, test, vi } from "vitest"
import { NextRequest } from "next/server"

const { createServerClientMock } = vi.hoisted(() => ({ createServerClientMock: vi.fn() }))

vi.mock("@supabase/ssr", () => ({ createServerClient: createServerClientMock }))

import { GET, POST } from "./route"

describe("signout route", () => {
    beforeEach(() => createServerClientMock.mockReset())

    test("signs out and redirects with POST-redirect-GET semantics", async () => {
        const signOut = vi.fn().mockResolvedValue({ error: null })
        createServerClientMock.mockReturnValue({ auth: { signOut } })

        const response = await POST(new NextRequest("http://internal:8080/api/auth/signout", {
            method: "POST",
            headers: {
                "x-forwarded-host": "leetllm.com",
                "x-forwarded-proto": "https",
            },
        }))

        expect(response.status).toBe(303)
        expect(response.headers.get("location")).toBe("https://leetllm.com/")
        expect(signOut).toHaveBeenCalledOnce()
    })

    test("rejects GET requests", async () => {
        const response = await GET()

        expect(response.status).toBe(405)
        expect(await response.json()).toEqual({ error: "Use POST to sign out" })
    })
})
