"use client"

import {
    createContext,
    createElement,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react"
import type { User } from "@supabase/supabase-js"

interface AuthContextValue {
    user: User | null
    isLoggedIn: boolean
    authLoaded: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [authLoaded, setAuthLoaded] = useState(false)

    useEffect(() => {
        let cancelled = false
        let unsubscribe: (() => void) | undefined

        async function loadAuth() {
            try {
                const { createClient } = await import("@/lib/supabase/client")
                const supabase = createClient()

                const {
                    data: { subscription },
                } = supabase.auth.onAuthStateChange((_event, session) => {
                    if (cancelled) return
                    setUser(session?.user ?? null)
                    setAuthLoaded(true)
                })
                unsubscribe = () => subscription.unsubscribe()

                const {
                    data: { user },
                } = await supabase.auth.getUser()

                if (cancelled) return
                setUser(user)
            } catch {
                if (!cancelled) {
                    setUser(null)
                }
            } finally {
                if (!cancelled) {
                    setAuthLoaded(true)
                }
            }
        }

        void loadAuth()

        return () => {
            cancelled = true
            unsubscribe?.()
        }
    }, [])

    const value = useMemo(() => ({
        user,
        isLoggedIn: user !== null,
        authLoaded,
    }), [authLoaded, user])

    return createElement(AuthContext.Provider, { value }, children)
}

export function useIsLoggedIn() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error("useIsLoggedIn must be used within AuthProvider")
    }
    return context
}
