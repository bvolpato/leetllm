import { render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, test, vi } from "vitest"
import { HeaderAuthButtons } from "./header-auth-buttons"

const mockUsePathname = vi.fn()

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}))

vi.mock("@/lib/use-is-logged-in", () => ({
  useIsLoggedIn: () => ({ user: null, isLoggedIn: false, authLoaded: true }),
}))

describe("HeaderAuthButtons", () => {
  beforeEach(() => {
    mockUsePathname.mockReset()
  })

  test("shows Login on learn landing for logged-out users", async () => {
    mockUsePathname.mockReturnValue("/learn")

    render(<HeaderAuthButtons />)

    await waitFor(() => expect(screen.getByRole("link", { name: /login/i }).getAttribute("href")).toBe("/login"))
    expect(screen.queryByRole("link", { name: /get started/i })).toBeNull()
  })

  test("shows Get Started away from learn landing for logged-out users", async () => {
    mockUsePathname.mockReturnValue("/")

    render(<HeaderAuthButtons />)

    await waitFor(() => expect(screen.getByRole("link", { name: /get started/i }).getAttribute("href")).toBe("/start"))
  })

  test("shows Login on plan builder for logged-out users", async () => {
    mockUsePathname.mockReturnValue("/start")

    render(<HeaderAuthButtons />)

    await waitFor(() => expect(screen.getByRole("link", { name: /login/i }).getAttribute("href")).toBe("/login"))
  })
})
