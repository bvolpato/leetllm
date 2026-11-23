import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, test, vi } from "vitest"
import { PublicMobileNav } from "./public-mobile-nav"
import { MobileNav } from "./mobile-nav"

vi.mock("next/navigation", () => ({ usePathname: () => "/learn/transformer-architecture" }))

vi.mock("@/app/(auth)/actions", () => ({ signOut: vi.fn() }))

afterEach(() => vi.unstubAllGlobals())

describe("PublicMobileNav", () => {
    test("renders menu trigger with visible surface styles", () => {
        render(
            <PublicMobileNav
                isLoggedIn={false}
                email=""
                loggedOutHref="/learn"
                loggedOutLabel="Get Started"
            />
        )

        const trigger = screen.getByRole("button", { name: "Open menu" })
        expect(trigger.className).toContain("border")
        expect(trigger.className).toContain("bg-card")
        expect(trigger.className).toContain("shadow-lg")
        expect(trigger.className).toContain("ring-1")
    })

    test("opens menu drawer", () => {
        render(
            <PublicMobileNav
                isLoggedIn={false}
                email=""
                loggedOutHref="/learn"
                loggedOutLabel="Get Started"
            />
        )

        fireEvent.click(screen.getByRole("button", { name: "Open menu" }))

        expect(screen.getByRole("button", { name: "Close menu" })).toBeDefined()
        expect(screen.getByText("Menu")).toBeDefined()
        expect(screen.getByRole("link", { name: "Glossary" }).getAttribute("href")).toBe("/glossary")
        expect(screen.getByRole("link", { name: "Learn" }).getAttribute("aria-current")).toBe("true")
    })

    test("opens a labeled modal and restores focus on Escape", async () => {
        render(<PublicMobileNav isLoggedIn={false} email="" loggedOutHref="/start" loggedOutLabel="Get Started" />)
        const trigger = screen.getByRole("button", { name: "Open menu" })
        trigger.focus()
        fireEvent.click(trigger)
        const dialog = screen.getByRole("dialog", { name: "Menu" })
        expect(dialog.getAttribute("aria-modal")).toBe("true")
        expect(dialog.contains(document.activeElement)).toBe(true)
        expect(screen.getByRole("link", { name: "Get Started" }).getAttribute("href")).toBe("/start")
        expect(screen.queryByRole("button", { name: "Get Started" })).toBeNull()

        fireEvent.keyDown(dialog, { key: "Escape" })
        await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
        await waitFor(() => expect(document.activeElement).toBe(trigger))
    })

    test("retains signed-in destinations and closes from its close control", async () => {
        render(<PublicMobileNav isLoggedIn email="learner@example.test" loggedOutHref="/login" loggedOutLabel="Login" />)
        fireEvent.click(screen.getByRole("button", { name: "Open menu" }))
        expect(screen.getByRole("link", { name: "Dashboard" }).getAttribute("href")).toBe("/dashboard")
        expect(screen.getByRole("button", { name: "Sign out" })).toBeDefined()
        fireEvent.click(screen.getByRole("button", { name: "Close menu" }))
        await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    })

    test("closes the modal when the viewport crosses to desktop", async () => {
        let onChange!: (event: MediaQueryListEvent) => void
        vi.stubGlobal("matchMedia", vi.fn(() => ({
            addEventListener: (_type: string, listener: typeof onChange) => { onChange = listener },
            removeEventListener: vi.fn(),
        })))
        render(<PublicMobileNav isLoggedIn={false} email="" loggedOutHref="/start" loggedOutLabel="Get Started" />)
        fireEvent.click(screen.getByRole("button", { name: "Open menu" }))
        expect(screen.getByRole("dialog")).toBeDefined()

        act(() => onChange({ matches: true } as MediaQueryListEvent))
        await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    })
})

test("authenticated MobileNav also dismisses on Escape and restores its trigger", async () => {
    render(<MobileNav navLinks={[{ href: "/dashboard", label: "Dashboard" }]} email="learner@example.test" />)
    const trigger = screen.getByRole("button", { name: "Open menu" })
    trigger.focus()
    fireEvent.click(trigger)
    const dialog = screen.getByRole("dialog", { name: "Menu" })
    expect(dialog.contains(document.activeElement)).toBe(true)
    expect(screen.getByRole("link", { name: "Dashboard" }).getAttribute("href")).toBe("/dashboard")
    expect(screen.getByRole("button", { name: "Sign out" })).toBeDefined()
    fireEvent.keyDown(dialog, { key: "Escape" })
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    await waitFor(() => expect(document.activeElement).toBe(trigger))
})
