import { beforeEach, describe, expect, test, vi } from "vitest"
import { NextRequest } from "next/server"

const { createClientMock } = vi.hoisted(() => ({ createClientMock: vi.fn() }))

vi.mock("@/lib/supabase/server", () => ({ createClient: createClientMock }))

import { POST } from "./route"

describe("login route", () => {
    beforeEach(() => createClientMock.mockReset())

    test("rejects malformed multipart data without invoking Supabase", async () => {
        const response = await POST(new NextRequest("https://leetllm.com/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "multipart/form-data; boundary=missing-body-boundary",
                Origin: "https://leetllm.com",
            },
            body: "not-a-valid-multipart-body",
        }))

        expect(response.status).toBe(400)
        expect(await response.json()).toEqual({ error: "Invalid login form data" })
        expect(createClientMock).not.toHaveBeenCalled()
    })

    test("signs in and preserves a safe post-auth destination", async () => {
        const signInWithPassword = vi.fn().mockResolvedValue({ error: null })
        createClientMock.mockResolvedValue({ auth: { signInWithPassword } })
        const form = new FormData()
        form.set("email", "learner@example.com")
        form.set("password", "secret-password")
        form.set("next", "/learn/attention")

        const response = await POST(new NextRequest("https://leetllm.com/api/auth/login", {
            method: "POST",
            headers: { Origin: "https://leetllm.com" },
            body: form,
        }))

        expect(response.status).toBe(303)
        expect(response.headers.get("location")).toBe("https://leetllm.com/learn/attention")
        expect(signInWithPassword).toHaveBeenCalledWith({
            email: "learner@example.com",
            password: "secret-password",
        })
    })
})
