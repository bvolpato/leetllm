import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, expect, test, vi } from "vitest"
import { AuthProvider, useIsLoggedIn } from "./use-is-logged-in"

const getUser = vi.hoisted(() => vi.fn().mockResolvedValue({
    data: { user: { id: "test-user", email: "reader@example.com" } },
}))
const unsubscribe = vi.hoisted(() => vi.fn())
const createClient = vi.hoisted(() => vi.fn(() => ({
    auth: {
        getUser,
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe } } }),
    },
})))

vi.mock("@/lib/supabase/client", () => ({
    createClient,
}))

function clearCookies() {
    for (const cookie of document.cookie.split(";")) {
        const name = cookie.split("=")[0]?.trim()
        if (name) {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
        }
    }
}

beforeEach(() => {
    clearCookies()
    createClient.mockClear()
    getUser.mockClear()
    unsubscribe.mockClear()
})

function AuthConsumer({ label }: { label: string }) {
    const { isLoggedIn, authLoaded } = useIsLoggedIn()
    return <div>{label}:{authLoaded ? String(isLoggedIn) : "loading"}</div>
}

test("shares one auth lookup across consumers when an auth cookie exists", async () => {
    document.cookie = "sb-project-auth-token=test-session; path=/"
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

test("skips loading supabase client for anonymous visitors until an auth cookie appears", async () => {
    render(
        <AuthProvider>
            <AuthConsumer label="header" />
        </AuthProvider>
    )

    expect(await screen.findByText("header:false")).toBeTruthy()
    expect(createClient).not.toHaveBeenCalled()
    expect(getUser).not.toHaveBeenCalled()

    document.cookie = "sb-project-auth-token.0=chunk-one; path=/"
    fireEvent(window, new Event("focus"))

    expect(await screen.findByText("header:true")).toBeTruthy()
    expect(createClient).toHaveBeenCalledTimes(1)
    expect(getUser).toHaveBeenCalledTimes(1)
})
