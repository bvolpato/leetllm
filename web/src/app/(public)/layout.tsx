import { SiteHeader } from "@/components/layout/site-header"
import { PublicFooter } from "@/components/layout/public-footer"
import { ReadingProgressProvider } from "@/lib/reading-progress"
import { AuthProvider } from "@/lib/use-is-logged-in"
import { LeetyGate } from "@/components/leety-chat"

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <ReadingProgressProvider>
        <div className="relative flex min-h-screen flex-col">
          <a
            href="#main-content"
            data-print-hidden
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-background focus:px-4 focus:py-3 focus:text-foreground focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            Skip to content
          </a>
          <SiteHeader />
          <main id="main-content" tabIndex={-1} className="flex-1 scroll-mt-20">{children}</main>
          <PublicFooter />
        </div>
        <LeetyGate />
      </ReadingProgressProvider>
    </AuthProvider>
  )
}
