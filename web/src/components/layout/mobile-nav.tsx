"use client"

import { useEffect, useState } from "react"
import { Menu, X, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { signOut } from "@/app/(auth)/actions"
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { NavLink } from "./nav-link"

const mobileMenuButtonClassName =
    "md:hidden inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-card text-foreground shadow-lg shadow-black/10 ring-1 ring-black/5 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:shadow-black/30 dark:ring-white/10"

interface MobileNavProps {
    navLinks: { href: string; label: string }[]
    email: string
}

export function MobileNav({ navLinks, email }: MobileNavProps) {
    const [open, setOpen] = useState(false)

    useEffect(() => {
        if (!window.matchMedia) return
        const desktop = window.matchMedia("(min-width: 768px)")
        function closeOnDesktop(event: MediaQueryListEvent) {
            if (event.matches) setOpen(false)
        }
        desktop.addEventListener("change", closeOnDesktop)
        return () => desktop.removeEventListener("change", closeOnDesktop)
    }, [])

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <button type="button" className={mobileMenuButtonClassName} aria-label="Open menu">
                    <Menu className="h-5 w-5 text-foreground" />
                </button>
            </SheetTrigger>
            <SheetContent
                showCloseButton={false}
                aria-modal="true"
                aria-describedby={undefined}
                className="h-[100dvh] w-72 max-w-[85vw] gap-0 border-l border-border/60 bg-card shadow-2xl ring-1 ring-border/50 md:hidden"
            >
                <div className="flex shrink-0 items-center justify-between border-b border-border/30 p-4">
                    <SheetTitle className="sr-only">Menu</SheetTitle>
                    <span className="min-w-0 truncate pr-3 text-sm font-medium text-muted-foreground">{email}</span>
                    <SheetClose asChild>
                        <button type="button" className={mobileMenuButtonClassName} aria-label="Close menu">
                            <X className="h-5 w-5" />
                        </button>
                    </SheetClose>
                </div>
                <nav aria-label="Main navigation" className="flex min-h-0 flex-1 flex-col space-y-1 overflow-y-auto p-4">
                    {navLinks.map((link) => (
                        <NavLink
                            key={link.href}
                            href={link.href}
                            onClick={() => setOpen(false)}
                            className="flex min-h-11 shrink-0 items-center rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            {link.label}
                        </NavLink>
                    ))}
                </nav>
                <div className="shrink-0 border-t border-border/30 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                    <form action={signOut}>
                        <Button variant="ghost" type="submit" className="min-h-11 w-full gap-2 text-muted-foreground" size="sm">
                            <LogOut className="h-3.5 w-3.5" />
                            Sign out
                        </Button>
                    </form>
                </div>
            </SheetContent>
        </Sheet>
    )
}
