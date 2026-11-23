import { beforeEach, describe, expect, test, vi } from "vitest"
import { NextRequest } from "next/server"

const { createClientMock } = vi.hoisted(() => ({ createClientMock: vi.fn() }))

vi.mock("@/lib/supabase/server", () => ({ createClient: createClientMock }))

import { GET } from "./route"

function commentsQuery(...results: Array<unknown>) {
    const query = {
        select: vi.fn(),
        eq: vi.fn(),
        order: vi.fn(),
        abortSignal: vi.fn(),
    }
    query.select.mockReturnValue(query)
    query.eq.mockReturnValue(query)
    query.order.mockReturnValue(query)
    results.forEach((result) => query.abortSignal.mockResolvedValueOnce(result))
    return query
}

describe("comments route", () => {
    beforeEach(() => createClientMock.mockReset())

    test("retries a transient comments read once", async () => {
        const query = commentsQuery(
            { data: null, error: { message: "TypeError: fetch failed", code: "" }, status: 0 },
            { data: [], error: null, status: 200 },
        )
        createClientMock.mockResolvedValue({
            auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
            from: vi.fn().mockReturnValue(query),
        })

        const response = await GET(new NextRequest("https://leetllm.com/api/comments?slug=attention"))

        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({ comments: [] })
        expect(query.abortSignal).toHaveBeenCalledTimes(2)
    })

    test("returns a bounded retryable response when Supabase remains unavailable", async () => {
        const failure = { data: null, error: { message: "TypeError: fetch failed", code: "" }, status: 0 }
        const query = commentsQuery(failure, failure)
        createClientMock.mockResolvedValue({
            auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
            from: vi.fn().mockReturnValue(query),
        })
        const error = vi.spyOn(console, "error").mockImplementation(() => {})

        const response = await GET(new NextRequest("https://leetllm.com/api/comments?slug=attention"))

        expect(response.status).toBe(503)
        expect(response.headers.get("retry-after")).toBe("2")
        expect(await response.json()).toEqual({ error: "Comments are temporarily unavailable" })
        expect(query.abortSignal).toHaveBeenCalledTimes(2)
        expect(error).toHaveBeenCalledWith(
            "[COMMENTS_QUERY_FAILED]",
            JSON.stringify({ status: 0, code: "network", transient: true }),
        )
        error.mockRestore()
    })
})
