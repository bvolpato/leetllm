"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { PublicMobileNav } from "./public-mobile-nav"
import { useIsLoggedIn } from "@/lib/use-is-logged-in"

/**
 * Client-side auth island for the site header.
 * Renders the logged-out CTA during SSR/hydration, then uses shared
 * client auth state for signed-in users. This keeps auth out of the
 * server render path so the header shell ships in initial HTML.
 *
 * Profile data loads after shared auth state resolves, keeping Supabase
 * out of the critical rendering path.
 */
export function HeaderAuthButtons() {
  const pathname = usePathname()
  const { user, isLoggedIn, authLoaded } = useIsLoggedIn()
  const [profileInitial, setProfileInitial] = useState<{ userId: string; initial: string } | null>(null)
  const isActivationPage = pathname === "/learn" || pathname === "/start"
  const loggedOutHref = isActivationPage ? "/login" : "/start"
  const loggedOutLabel = isActivationPage ? "Login" : "Get Started"
  const fallbackInitial = (user?.email?.split("@")[0] || "U").charAt(0).toUpperCase()
  const initials = profileInitial && profileInitial.userId === user?.id
    ? profileInitial.initial
    : fallbackInitial

  useEffect(() => {
    if (!user) return

    let cancelled = false
    const currentUser = user

    async function loadProfile() {
      try {
        const { createClient } = await import("@/lib/supabase/client")
        const supabase = createClient()
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", currentUser.id)
          .single()

        if (!cancelled && profile?.display_name) {
          setProfileInitial({
            userId: currentUser.id,
            initial: profile.display_name.charAt(0).toUpperCase(),
          })
        }
      } catch {
        // Email initial remains available when profile lookup fails.
      }
    }

    void loadProfile()
    return () => {
      cancelled = true
    }
  }, [user])

  return (
    <>
      {authLoaded && isLoggedIn ? (
        <>
          <span className="text-sm text-muted-foreground hidden lg:block truncate max-w-[180px]">{user?.email ?? ""}</span>
          <form action="/api/auth/signout" method="POST" className="hidden md:block">
            <Button variant="ghost" size="sm" type="submit" className="text-muted-foreground hover:text-foreground">
              Sign out
            </Button>
          </form>
          <Link
            href="/dashboard"
            aria-label="Open learning dashboard"
            title="Learning dashboard"
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/20 text-xs font-bold text-primary transition-colors hover:bg-primary/30 sm:h-8 sm:w-8"
          >
            {initials}
          </Link>
        </>
      ) : (
        <Button asChild size="sm" className="hidden md:inline-flex px-4 gap-1.5">
          <Link href={loggedOutHref}>
            {loggedOutLabel}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      )}
      <PublicMobileNav
        isLoggedIn={isLoggedIn}
        email={user?.email ?? ""}
        loggedOutHref={loggedOutHref}
        loggedOutLabel={loggedOutLabel}
      />
    </>
  )
}
