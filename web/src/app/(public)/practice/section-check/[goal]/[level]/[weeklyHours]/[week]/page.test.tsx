import { render, screen } from "@testing-library/react"
import { describe, expect, test, vi } from "vitest"
import SectionCheckPage from "./page"

vi.mock("@/components/mastery-quiz", () => ({ KnowledgeCheck: () => null }))
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("Not found") } }))

describe("SectionCheckPage", () => {
    test("returns to the same plan and week without relying on saved browser state", async () => {
        render(await SectionCheckPage({ params: Promise.resolve({ goal: "rag", level: "working", weeklyHours: "4", week: "2" }) }))
        const url = new URL(screen.getByRole("link", { name: "Back to plan" }).getAttribute("href")!, "https://leetllm.com")
        expect(url.pathname).toBe("/start")
        expect(Object.fromEntries(url.searchParams)).toEqual({ goal: "rag", level: "working", weeklyHours: "4" })
        expect(url.hash).toBe("#week-2")
    })

    test("rejects invalid answers before presenting a section check", async () => {
        await expect(SectionCheckPage({ params: Promise.resolve({ goal: "unknown", level: "working", weeklyHours: "4", week: "2" }) })).rejects.toThrow("Not found")
    })
})
