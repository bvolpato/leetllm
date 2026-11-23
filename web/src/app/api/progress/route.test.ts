import { beforeEach, describe, expect, test, vi } from "vitest"
import { NextRequest } from "next/server"

const { createClientMock } = vi.hoisted(() => ({ createClientMock: vi.fn() }))

vi.mock("@/lib/supabase/server", () => ({ createClient: createClientMock }))

import { DELETE, GET, PUT } from "./route"

describe("progress route", () => {
    beforeEach(() => createClientMock.mockReset())

    test("returns completed slugs and unread tombstones", async () => {
        const rows = [
            { article_slug: "attention", read_at: "2026-01-01", completed: true, updated_at: "2026-01-02" },
            { article_slug: "embeddings", read_at: "2026-01-01", completed: false, updated_at: "2026-01-03" },
        ]
        const query = {
            select: vi.fn(),
            eq: vi.fn(),
            not: vi.fn(),
        }
        query.select.mockReturnValue(query)
        query.eq.mockReturnValue(query)
        query.not.mockReturnValueOnce(query).mockResolvedValueOnce({ data: rows, error: null })
        createClientMock.mockResolvedValue({
            auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }) },
            from: vi.fn().mockReturnValue(query),
        })

        const response = await GET()

        expect(await response.json()).toEqual({
            slugs: ["attention"],
            completed: [{ slug: "attention", completedAt: "2026-01-02" }],
            progress: [
                { slug: "attention", completed: true, updatedAt: "2026-01-02" },
                { slug: "embeddings", completed: false, updatedAt: "2026-01-03" },
            ],
        })
    })

    test("stores unread as a tombstone instead of deleting progress", async () => {
        const upsert = vi.fn().mockResolvedValue({ error: null })
        createClientMock.mockResolvedValue({
            auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }) },
            from: vi.fn().mockReturnValue({ upsert }),
        })
        const request = new NextRequest("http://localhost/api/progress", {
            method: "DELETE",
            body: JSON.stringify({ slug: "attention" }),
            headers: { "Content-Type": "application/json" },
        })

        const response = await DELETE(request)

        expect(response.status).toBe(200)
        expect(upsert).toHaveBeenCalledWith(
            expect.objectContaining({ user_id: "user-1", article_slug: "attention", completed: false }),
            { onConflict: "user_id,article_slug" }
        )
    })

    test("records first article open without overwriting existing completion", async () => {
        const upsert = vi.fn().mockResolvedValue({ error: null })
        createClientMock.mockResolvedValue({
            auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }) },
            from: vi.fn().mockReturnValue({ upsert }),
        })
        const request = new NextRequest("http://localhost/api/progress", {
            method: "PUT",
            body: JSON.stringify({ slug: "attention" }),
            headers: { "Content-Type": "application/json" },
        })

        const response = await PUT(request)

        expect(response.status).toBe(200)
        expect(upsert).toHaveBeenCalledWith(
            expect.objectContaining({
                user_id: "user-1",
                article_slug: "attention",
                completed: false,
            }),
            { onConflict: "user_id,article_slug", ignoreDuplicates: true }
        )
    })
})
