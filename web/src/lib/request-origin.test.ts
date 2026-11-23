import { describe, expect, test } from "vitest"
import { getRequestOrigin, isSameOrigin, safeInternalPath } from "./request-origin"

describe("request origin", () => {
    test("keeps direct localhost callbacks on HTTP", () => {
        expect(getRequestOrigin(
            new Headers({ host: "localhost:3000" }),
            "http://localhost:3000/auth/callback?code=example",
        )).toBe("http://localhost:3000")
    })

    test("uses trusted proxy origin in production", () => {
        expect(getRequestOrigin(new Headers({
            host: "internal:8080",
            "x-forwarded-host": "leetllm.com",
            "x-forwarded-proto": "https",
        }), "http://internal:8080/auth/callback")).toBe("https://leetllm.com")
    })

    test("derives local server-action origin without request URL", () => {
        expect(getRequestOrigin(new Headers({ host: "127.0.0.1:3000" })))
            .toBe("http://127.0.0.1:3000")
    })

    test("accepts direct and proxy-matched origins but rejects cross-origin writes", () => {
        expect(isSameOrigin(new Request("http://127.0.0.1:3100/api", {
            headers: { origin: "http://127.0.0.1:3100", host: "127.0.0.1:3100" },
        }))).toBe(true)
        expect(isSameOrigin(new Request("http://internal:8080/api", {
            headers: {
                origin: "https://leetllm.com",
                host: "internal:8080",
                "x-forwarded-host": "leetllm.com",
                "x-forwarded-proto": "https",
            },
        }))).toBe(true)
        expect(isSameOrigin(new Request("https://leetllm.com/api", {
            headers: { origin: "https://attacker.example", host: "leetllm.com" },
        }))).toBe(false)
    })

    test("allows only internal post-auth redirect paths", () => {
        expect(safeInternalPath("/learn/attention")).toBe("/learn/attention")
        expect(safeInternalPath("https://attacker.example")).toBe("/learn")
        expect(safeInternalPath("//attacker.example")).toBe("/learn")
        expect(safeInternalPath(null, "/dashboard")).toBe("/dashboard")
    })
})
