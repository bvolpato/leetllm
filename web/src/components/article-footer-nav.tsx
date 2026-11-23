import Link from "next/link"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface AdjacentArticleLink {
    href: string
    title?: string
}

interface ArticleFooterNavProps {
    previous?: AdjacentArticleLink | null
    next?: AdjacentArticleLink | null
    className?: string
}

export function ArticleFooterNav({
    previous,
    next,
    className,
}: ArticleFooterNavProps) {
    if (!previous && !next) return null

    return (
        <div
            className={cn(
                "grid gap-3 pt-6 border-t border-border/30 sm:grid-cols-2",
                className
            )}
        >
            {previous ? (
                <Button
                    asChild
                    variant="ghost"
                    className="h-full min-h-16 w-full justify-start gap-3 whitespace-normal px-4 py-3 text-left"
                >
                    <Link href={previous.href} className="group min-w-0">
                        <ArrowLeft className="h-4 w-4 flex-shrink-0 group-hover:-translate-x-0.5 transition-transform" />
                        <span className="min-w-0 flex-1">
                            <span className="mb-0.5 block text-xs [color:var(--reading-subtle)]">
                                Previous
                            </span>
                            <span className="block text-sm font-medium leading-snug line-clamp-2">
                                {previous.title}
                            </span>
                        </span>
                    </Link>
                </Button>
            ) : (
                <div className="hidden sm:block" />
            )}
            {next ? (
                <Button
                    asChild
                    variant="ghost"
                    className="h-full min-h-16 w-full justify-end gap-3 whitespace-normal px-4 py-3 text-right"
                >
                    <Link href={next.href} className="group min-w-0">
                        <span className="min-w-0 flex-1">
                            <span className="mb-0.5 block text-xs [color:var(--reading-subtle)]">
                                Next
                            </span>
                            <span className="block text-sm font-medium leading-snug line-clamp-2">
                                {next.title}
                            </span>
                        </span>
                        <ArrowRight className="h-4 w-4 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                </Button>
            ) : (
                <div className="hidden sm:block" />
            )}
        </div>
    )
}
