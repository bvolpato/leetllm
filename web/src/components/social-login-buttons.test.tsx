import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, test, vi } from "vitest"
import { SocialLoginButtons } from "./social-login-buttons"

const mocks = vi.hoisted(() => ({
    signInWithOAuth: vi.fn(),
    trackFunnel: vi.fn(),
}))

vi.mock("next/navigation", () => ({
    useSearchParams: () => new URLSearchParams("next=/dashboard"),
}))

vi.mock("@/lib/supabase/client", () => ({
    createClient: () => ({ auth: { signInWithOAuth: mocks.signInWithOAuth } }),
}))

vi.mock("@/lib/analytics", () => ({
    trackFunnel: mocks.trackFunnel,
}))

describe("SocialLoginButtons", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co")
        vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "publishable-key")
        mocks.signInWithOAuth.mockResolvedValue({ data: { url: null }, error: null })
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ external: { google: true, apple: true } }),
        }))
    })

    test("shows providers enabled by Supabase", async () => {
        render(<SocialLoginButtons />)

        expect(await screen.findByRole("button", { name: "Continue with Apple" })).toBeTruthy()
        expect(screen.getByRole("button", { name: "Continue with Google" })).toBeTruthy()
    })

    test("starts Apple signup with preserved destination", async () => {
        render(<SocialLoginButtons intent="signup" />)
        fireEvent.click(await screen.findByRole("button", { name: "Continue with Apple" }))

        await waitFor(() => expect(mocks.signInWithOAuth).toHaveBeenCalledWith({
            provider: "apple",
            options: {
                redirectTo: `${window.location.origin}/auth/callback?next=%2Fdashboard&signup=1`,
            },
        }))
        expect(mocks.trackFunnel).toHaveBeenCalledWith({ step: "signup_start", method: "apple" })
    })
})
