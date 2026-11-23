import { render, screen } from "@testing-library/react"
import { expect, test, vi } from "vitest"
import { AuthProvider, useIsLoggedIn } from "./use-is-logged-in"

const getUser = vi.hoisted(() => vi.fn().mockResolvedValue({
    data: { user: { id: "test-user", email: "reader@example.com" } },
}))
const unsubscribe = vi.hoisted(() => vi.fn())

vi.mock("@/lib/supabase/client", () => ({
    createClient: () => ({
        auth: {
            getUser,
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe } } }),
        },
    }),
}))

function AuthConsumer({ label }: { label: string }) {
    const { isLoggedIn, authLoaded } = useIsLoggedIn()
    return <div>{label}:{authLoaded ? String(isLoggedIn) : "loading"}</div>
}

test("shares one auth lookup across consumers", async () => {
    render(
        <AuthProvider>
            <AuthConsumer label="header" />
            <AuthConsumer label="article" />
            <AuthConsumer label="comments" />
        </AuthProvider>
    )

    expect(await screen.findByText("header:true")).toBeTruthy()
    expect(screen.getByText("article:true")).toBeTruthy()
    expect(screen.getByText("comments:true")).toBeTruthy()
    expect(getUser).toHaveBeenCalledTimes(1)
})
