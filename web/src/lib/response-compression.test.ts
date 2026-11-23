import { describe, expect, test } from "vitest"

import { acceptsGzip, compressedResponse } from "./response-compression"

const body = "compressible markdown response\n".repeat(200)

describe("response compression", () => {
    test("negotiates gzip quality values and wildcards", () => {
        expect(acceptsGzip("gzip")).toBe(true)
        expect(acceptsGzip("br, gzip;q=0.5")).toBe(true)
        expect(acceptsGzip("*;q=0.8")).toBe(true)
        expect(acceptsGzip("gzip;q=0, *;q=1")).toBe(false)
        expect(acceptsGzip("br")).toBe(false)
        expect(acceptsGzip(null)).toBe(false)
    })

    test("defers encoding to Next.js server compression with Vary: Accept-Encoding", async () => {
        const response = compressedResponse(
            new Request("https://leetllm.com/api/md/example", {
                headers: { "Accept-Encoding": "gzip" },
            }),
            body,
            { headers: { "Content-Type": "text/markdown; charset=utf-8" } },
        )

        expect(response.headers.get("Content-Encoding")).toBeNull()
        expect(response.headers.get("Vary")).toBe("Accept-Encoding")
        expect(await response.text()).toBe(body)
        expect(response.headers.get("Content-Length")).toBe(Buffer.byteLength(body).toString())
    })

    test("returns identity with a correct vary header when gzip is unsupported", async () => {
        const response = compressedResponse(
            new Request("https://leetllm.com/api/md/example", {
                headers: { "Accept-Encoding": "identity" },
            }),
            body,
            { headers: { "Content-Type": "text/markdown; charset=utf-8" } },
        )

        expect(response.headers.get("Content-Encoding")).toBeNull()
        expect(response.headers.get("Vary")).toBe("Accept-Encoding")
        expect(await response.text()).toBe(body)
        expect(response.headers.get("Content-Length")).toBe(Buffer.byteLength(body).toString())
    })

    test("does not mark compressed formats or no-transform responses for encoding", async () => {
        const request = new Request("https://leetllm.com/image", {
            headers: { "Accept-Encoding": "gzip" },
        })
        const image = compressedResponse(request, new Uint8Array(2_048), {
            headers: { "Content-Type": "image/png" },
        })
        const streaming = compressedResponse(request, body, {
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "private, no-store, no-transform",
            },
        })

        expect(image.headers.get("Content-Encoding")).toBeNull()
        expect(image.headers.get("Vary")).toBeNull()
        expect(streaming.headers.get("Content-Encoding")).toBeNull()
        expect(streaming.headers.get("Vary")).toBeNull()
        expect(await streaming.text()).toBe(body)
    })
})
