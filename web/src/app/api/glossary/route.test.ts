import { NextRequest } from "next/server"
import { expect, test } from "vitest"
import { GET as search } from "./route"
import { GET as definition } from "./[id]/route"

test("serves one complete definition with related navigation and public caching", async () => {
    const response = await definition(new NextRequest("https://leetllm.com/api/glossary/ti-to"), {
        params: Promise.resolve({ id: "ti-to" }),
    })
    expect(response.status).toBe(200)
    const entry = await response.json()
    expect(entry.id).toBe("ti-to")
    expect(entry.title).toBe("TI/TO")
    expect(entry.definition).toContain("tokenization schema")
    expect(entry.intuition).toContain("UTF-8")
    expect(entry.related).toContainEqual({ id: "loss-mask", title: "Loss mask" })
    expect(response.headers.get("Cache-Control")).toContain("public")
})

test.each(["missing-definition", "constructor", "../matrix"])("rejects unknown or invalid definition %s", async (id) => {
    const response = await definition(new NextRequest("https://leetllm.com/api/glossary/invalid"), {
        params: Promise.resolve({ id }),
    })
    expect(response.status).toBe(404)
    expect(response.headers.get("Cache-Control")).toBe("no-store")
})

test("search finds prose outside titles and aliases without returning full definitions", async () => {
    const response = search(new NextRequest("https://leetllm.com/api/glossary?q=conditioning%20prefix"))
    expect(response.status).toBe(200)
    const ids = await response.json()
    expect(ids).toContain("ti-to")
    expect(ids.every((id: unknown) => typeof id === "string")).toBe(true)
})

test.each(["", "x".repeat(201)])("bounds search input", async (query) => {
    const response = search(new NextRequest(`https://leetllm.com/api/glossary?q=${query}`))
    expect(response.status).toBe(400)
})
