import Link from "next/link"
import { BrainCircuit } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { HeaderAuthButtons } from "./header-auth-buttons"
import { NavLink } from "./nav-link"

/**
 * Server-rendered site header. The logo, nav links, and layout all ship
 * in the initial HTML so they appear immediately (improving FCP/LCP on
 * mobile). Auth, current-section cues, and the theme toggle hydrate as
 * small client islands.
 */
export function SiteHeader() {
  return (
    <header data-print-hidden className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/85 backdrop-blur-xl">
      <div className="container mx-auto flex h-14 sm:h-16 max-w-6xl items-center px-4 sm:px-6">
        <Link href="/" className="mr-5 sm:mr-8 flex items-center space-x-2.5 group flex-shrink-0">
          <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 border border-primary/20 group-hover:bg-primary/20 transition-colors">
            <BrainCircuit className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-primary" />
          </div>
          <span className="font-bold text-base sm:text-lg tracking-tight">
            LeetLLM
          </span>
        </Link>
        {/* Desktop nav: server-rendered, no JS needed */}
        <nav aria-label="Primary navigation" className="hidden md:flex flex-1 items-center gap-1 text-sm font-medium">
          <NavLink
            href="/start"
            className="rounded-md px-2.5 py-1.5 transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            My Plan
          </NavLink>
          <NavLink
            href="/learn"
            prefetch={false}
            className="rounded-md px-2.5 py-1.5 transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Learn
          </NavLink>
          <NavLink
            href="/glossary"
            prefetch={false}
            className="rounded-md px-2.5 py-1.5 transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Glossary
          </NavLink>
          <NavLink
            href="/tracks"
            className="rounded-md px-2.5 py-1.5 transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Tracks
          </NavLink>
          <NavLink
            href="/practice"
            prefetch={false}
            className="rounded-md px-2.5 py-1.5 transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Practice
          </NavLink>
          <NavLink
            href="/blog"
            prefetch={false}
            className="rounded-md px-2.5 py-1.5 transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Blog
          </NavLink>
        </nav>
        <div className="ml-auto flex items-center space-x-2 sm:space-x-3">
          <div id="leety-launcher-host" data-leety-launcher-host className="flex shrink-0 items-center" />
          <ThemeToggle />
          <HeaderAuthButtons />
        </div>
      </div>
    </header>
  )
}
