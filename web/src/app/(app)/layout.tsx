import Link from "next/link"
import { BrainCircuit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { createClient } from "@/lib/supabase/server"
import { signOut } from "@/app/(auth)/actions"
import { redirect } from "next/navigation"
import { MobileNav } from "@/components/layout/mobile-nav"
import { LeetyGate } from "@/components/leety-chat"
import { AuthProvider } from "@/lib/use-is-logged-in"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile display data. Login is only used for progress tracking.
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single()

  const displayName = profile?.display_name || user.email?.split('@')[0] || 'U'
  const initials = displayName.charAt(0).toUpperCase()

  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/learn", label: "Learn" },
    { href: "/start", label: "My Plan" },
    { href: "/practice", label: "Practice" },
    { href: "/settings/personalization", label: "Personalize" },
  ]

  return (
    <AuthProvider>
      <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-14 sm:h-16 max-w-6xl items-center px-4">
          <Link href="/dashboard" className="mr-4 sm:mr-8 flex items-center space-x-2 sm:space-x-2.5 group flex-shrink-0">
            <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 border border-primary/20 group-hover:bg-primary/20 transition-colors">
              <BrainCircuit className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-primary" />
            </div>
            <span className="font-bold text-base sm:text-lg tracking-tight">
              LeetLLM
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex flex-1 items-center space-x-1 text-sm font-medium">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-2 transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center space-x-2 sm:space-x-3">
            <span className="text-sm text-muted-foreground hidden lg:block truncate max-w-[180px]">{user.email}</span>
            <form action={signOut} className="hidden md:block">
              <Button variant="ghost" size="sm" type="submit" className="text-muted-foreground hover:text-foreground">
                Sign out
              </Button>
            </form>
            <ThemeToggle />
            <Link
              href="/settings/personalization"
              aria-label="Open personalization settings"
              className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0 hover:bg-primary/30 transition-colors"
            >
              {initials}
            </Link>
            {/* Mobile hamburger */}
            <MobileNav
              navLinks={navLinks}
              email={user.email || ""}
            />
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto max-w-6xl py-6 sm:py-8 px-4">{children}</main>
      <footer className="border-t border-border/30 bg-card/20">
        <div className="container mx-auto max-w-6xl px-4 py-4 sm:py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground/50">
          <span>© {new Date().getFullYear()} LeetLLM. All rights reserved.</span>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-foreground/70 transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-foreground/70 transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
      </div>
      <LeetyGate />
    </AuthProvider>
  )
}
