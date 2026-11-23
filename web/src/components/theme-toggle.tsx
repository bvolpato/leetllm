"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useSyncExternalStore } from "react"
import { Button } from "@/components/ui/button"

const themeToggleClassName =
    "h-9 w-9 rounded-lg border border-border/70 bg-card text-muted-foreground shadow-lg shadow-black/10 ring-1 ring-black/5 transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring dark:shadow-black/30 dark:ring-white/10 sm:h-8 sm:w-8"

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
