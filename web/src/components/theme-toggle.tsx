"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useSyncExternalStore } from "react"
import { Button } from "@/components/ui/button"

const themeToggleClassName =
    "h-9 w-9 rounded-md border border-border/60 bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring sm:h-8 sm:w-8"

// SSR-safe mount detection using useSyncExternalStore (React 18+ recommended pattern)
const emptySubscribe = () => () => { }
function useMounted() {
    return useSyncExternalStore(
        emptySubscribe,
        () => true,  // client
        () => false,  // server
    )
}

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()
    const mounted = useMounted()

    if (!mounted) {
        return (
            <Button variant="ghost" size="icon" className={themeToggleClassName} aria-label="Toggle theme">
                <Sun className="h-4 w-4" />
            </Button>
        )
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            className={themeToggleClassName}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
            {theme === "dark" ? (
                <Sun className="h-4 w-4 transition-transform duration-200" />
            ) : (
                <Moon className="h-4 w-4 transition-transform duration-200" />
            )}
        </Button>
    )
}
