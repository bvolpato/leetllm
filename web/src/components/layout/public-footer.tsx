"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BrainCircuit } from "lucide-react"

export function PublicFooter() {
    const pathname = usePathname()
    if (pathname.startsWith("/practice/")) return null

    return (
        <footer data-print-hidden className="border-t border-border/40 bg-card/30">
            <div className="container mx-auto max-w-5xl px-4 py-12">
                <div className="grid gap-8 md:grid-cols-4">
                    <div className="md:col-span-2">
                        <Link href="/" className="mb-4 flex items-center space-x-2.5">
                            <BrainCircuit className="h-5 w-5 text-primary" />
                            <span className="text-lg font-bold tracking-tight">LeetLLM</span>
                        </Link>
                        <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
                            Your go-to resource for mastering AI &amp; LLM systems.
                        </p>
                    </div>
                    <div>
                        <h3 className="mb-3 text-sm font-semibold">Product</h3>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                            <li><Link href="/learn" className="inline-block py-1.5 transition-colors hover:text-foreground">Learn</Link></li>
                            <li><Link href="/glossary" prefetch={false} className="inline-block py-1.5 transition-colors hover:text-foreground">Glossary</Link></li>
                            <li><Link href="/tracks" className="inline-block py-1.5 transition-colors hover:text-foreground">Tracks</Link></li>
                            <li><Link href="/practice" className="inline-block py-1.5 transition-colors hover:text-foreground">Practice</Link></li>
                            <li><Link href="/blog" prefetch={false} className="inline-block py-1.5 transition-colors hover:text-foreground">Blog</Link></li>
                            <li><Link href="/blog/rss.xml" className="inline-block py-1.5 transition-colors hover:text-foreground">RSS</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="mb-3 text-sm font-semibold">Legal</h3>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                            <li><Link href="/terms" className="inline-block py-1.5 transition-colors hover:text-foreground">Terms of Service</Link></li>
                            <li><Link href="/privacy" className="inline-block py-1.5 transition-colors hover:text-foreground">Privacy Policy</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="mt-10 border-t border-border/40 pt-6">
                    <p className="text-center text-sm text-muted-foreground/80">
                        © {new Date().getFullYear()} LeetLLM. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    )
}
