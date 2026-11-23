import { describe, expect, test } from "vitest"
import { GET } from "./route"

describe("iOS OAuth callback", () => {
    test("forwards PKCE code and strips bearer tokens and unrelated parameters", async () => {
        const request = new Request(
            "https://leetllm.com/auth/callback/ios?code=auth-code-123&access_token=secret&refresh_token=secret&next=%2Fadmin"
        )

        const response = await GET(request)
        const callback = new URL(response.headers.get("Location")!)

        expect(response.status).toBe(302)
        expect(callback.origin).toBe("null")
        expect(callback.protocol).toBe("com.leetllm.ios:")
        expect(callback.host).toBe("auth")
        expect(callback.pathname).toBe("/callback")
        expect(callback.searchParams.get("code")).toBe("auth-code-123")
        expect(callback.searchParams.has("access_token")).toBe(false)
        expect(callback.searchParams.has("refresh_token")).toBe(false)
        expect(callback.searchParams.has("next")).toBe(false)
    })

    test("forwards provider errors without unrelated parameters", async () => {
        const request = new Request(
            "https://leetllm.com/auth/callback/ios?error=access_denied&error_description=Access%20denied&error_code=provider_error&state=secret"
        )

        const response = await GET(request)
        const callback = new URL(response.headers.get("Location")!)

        expect(response.status).toBe(302)
        expect(callback.searchParams.get("error")).toBe("access_denied")
        expect(callback.searchParams.get("error_description")).toBe("Access denied")
        expect(callback.searchParams.get("error_code")).toBe("provider_error")
        expect(callback.searchParams.has("state")).toBe(false)
    })

    test("rejects requests without a PKCE result", async () => {
        const response = await GET(new Request("https://leetllm.com/auth/callback/ios?access_token=secret"))

        expect(response.status).toBe(400)
        expect(response.headers.get("Cache-Control")).toBe("no-store")
    })
})
