"use client"

import { useState } from "react"
import { SectionProgress, OverallProgress, LoginToTrackPrompt, MarkAsReadButton } from "@/components/reading-progress"
import { useReadingProgress } from "@/lib/reading-progress"
import { ShareButtons } from "@/components/share-buttons"
import { ArticleFooterNav } from "@/components/article-footer-nav"
import { useIsLoggedIn } from "@/lib/use-is-logged-in"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Check, ChevronRight } from "lucide-react"
import Link from "next/link"

interface SidebarSection {
    name: string
    config: { icon: string; description: string; color: string }
    questions: {
        id: string
        title: string
        slug: string
    }[]
}

interface NextCallout {
    title: string
    href: string
    description: string
}

export function ArticlePageClient({
    variant,
    slug,
    articleTitle,
    articleDescription,
    sidebarSections,
    nextCallout,
    nextSlug,
    nextTitle,
    prevSlug,
    prevTitle,
    isLoggedIn,
    totalCount,
    hasMasteryQuiz = false,
}: {
    variant: "sidebar" | "footer"
    slug: string
    articleTitle?: string
    articleDescription?: string
    sidebarSections?: SidebarSection[]
    nextCallout?: NextCallout
    nextSlug?: string
    nextTitle?: string
    prevSlug?: string
    prevTitle?: string
    isLoggedIn?: boolean
    totalCount: number
    hasMasteryQuiz?: boolean
}) {
    const { isLoggedIn: clientIsLoggedIn, authLoaded } = useIsLoggedIn()
    const resolvedIsLoggedIn = authLoaded ? clientIsLoggedIn : (isLoggedIn ?? false)

    if (variant === "sidebar" && sidebarSections) {
        return (
            <SidebarContent
                slug={slug}
                sections={sidebarSections}
                isLoggedIn={resolvedIsLoggedIn}
                authLoaded={authLoaded}
                totalCount={totalCount}
            />
        )
    }

    return (
        <FooterContent
            slug={slug}
            articleTitle={articleTitle}
            articleDescription={articleDescription}
            nextCallout={nextCallout}
            nextSlug={nextSlug}
            nextTitle={nextTitle}
            prevSlug={prevSlug}
            prevTitle={prevTitle}
            isLoggedIn={resolvedIsLoggedIn}
            authLoaded={authLoaded}
            hasMasteryQuiz={hasMasteryQuiz}
        />
    )
}

function SidebarContent({
    slug,
    sections,
    isLoggedIn,
    authLoaded,
    totalCount,
}: {
    slug: string
    sections: SidebarSection[]
    isLoggedIn: boolean
    authLoaded: boolean
    totalCount: number
}) {
    const { isRead } = useReadingProgress()
    const [prefetchSlug, setPrefetchSlug] = useState<string | null>(null)

    return (
        <div className="space-y-5">
            {/* Overall Progress */}
            <OverallProgress totalArticles={totalCount} />

            {/* Section navigation */}
            {sections.map((section) => {
                const sectionSlugs = section.questions.map((q) => q.slug)
                const isCurrentSection = section.questions.some((q) => q.slug === slug)
                const readCount = sectionSlugs.filter(isRead).length

                return (
                    <div key={section.name}>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm">{section.config.icon}</span>
                            <span
                                className={`text-xs font-semibold ${isCurrentSection
                                    ? "text-primary"
                                    : "[color:var(--reading-heading)]"
                                    }`}
                            >
                                {section.name}
                            </span>
                            <span className="ml-auto text-[11px] [color:var(--reading-subtle)]">
                                {readCount}/{section.questions.length}
                            </span>
                        </div>
                        <SectionProgress sectionSlugs={sectionSlugs} />
                        <nav aria-label={`${section.name} lessons`} className="mt-2 space-y-0.5">
                            {section.questions.map((q) => {
                                const isCurrent = q.slug === slug
                                const read = isRead(q.slug)

                                return (
                                    <Link
                                        key={q.id}
                                        href={`/learn/${q.slug}`}
                                        prefetch={prefetchSlug === q.slug && !isCurrent ? null : false}
                                        onMouseEnter={() => setPrefetchSlug(q.slug)}
                                        onFocus={() => setPrefetchSlug(q.slug)}
                                        aria-current={isCurrent ? "page" : undefined}
                                        className={`group flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs leading-snug transition-all duration-200 ${isCurrent
                                            ? "bg-primary/10 text-primary font-medium border border-primary/20"
                                            : read
                                                ? "text-emerald-500/90 hover:text-emerald-500"
                                                : "[color:var(--reading-muted)] hover:[color:var(--reading-heading)] hover:bg-card/60"
                                            }`}
                                    >
                                        {isCurrent ? (
                                            <ChevronRight className="h-2.5 w-2.5 flex-shrink-0 text-primary" />
                                        ) : read ? (
                                            <Check className="h-2.5 w-2.5 flex-shrink-0 text-emerald-400" />
                                        ) : (
                                            <span className="w-2.5 h-2.5 rounded-full border border-muted-foreground/60 flex-shrink-0" />
                                        )}
                                        <span className="min-w-0 flex-1 break-words">{q.title}</span>
                                    </Link>
                                )
                            })}
                        </nav>
                    </div>
                )
            })}

            {/* Login CTA */}
            <LoginToTrackPrompt isLoggedIn={isLoggedIn} authLoaded={authLoaded} />
        </div>
    )
}

function FooterContent({
    slug,
    articleTitle,
    articleDescription,
    nextCallout,
    nextSlug,
    nextTitle,
    prevSlug,
    prevTitle,
    isLoggedIn,
    authLoaded,
    hasMasteryQuiz,
}: {
    slug: string
    articleTitle?: string
    articleDescription?: string
    nextCallout?: NextCallout
    nextSlug?: string
    nextTitle?: string
    prevSlug?: string
    prevTitle?: string
    isLoggedIn: boolean
    authLoaded: boolean
    hasMasteryQuiz: boolean
}) {
    return (
        <div data-print-hidden className="space-y-6 pt-4">
            {!hasMasteryQuiz && (
                <MarkAsReadButton slug={slug} isLoggedIn={isLoggedIn} authLoaded={authLoaded} />
            )}

            {nextCallout && <NextLessonCallout callout={nextCallout} />}

            {/* Prev / Next Navigation */}
            <ArticleFooterNav
                previous={prevSlug ? { href: `/learn/${prevSlug}`, title: prevTitle } : null}
                next={
                    nextCallout
                        ? null
                        : nextSlug
                            ? { href: `/learn/${nextSlug}`, title: nextTitle }
                            : null
                }
                className="pt-2 border-border/20"
            />

            {/* Share */}
            {articleTitle && (
                <ShareButtons
                    url={`/learn/${slug}`}
                    title={articleTitle}
                    description={articleDescription}
                />
            )}
        </div>
    )
}

function NextLessonCallout({ callout }: { callout: NextCallout }) {
    return (
        <Link
            href={callout.href}
            className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
            <Card className="learn-reading-card gap-3 py-4 border-primary/20 bg-primary/5 transition-colors group-hover:border-primary/30 group-hover:bg-primary/10">
                <CardHeader className="pb-0">
                    <CardTitle className="text-base flex items-center gap-2">
                        <ArrowRight className="h-4 w-4 text-primary" />
                        Next Step
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="inline-flex max-w-full items-center gap-2 text-base font-semibold [color:var(--reading-heading)] transition-colors group-hover:text-primary">
                        <span className="min-w-0">
                            Continue to {callout.title}
                        </span>
                        <ArrowRight className="h-4 w-4 flex-shrink-0 text-primary transition-transform group-hover:translate-x-0.5" />
                    </div>
                    <p className="mt-2 text-sm leading-relaxed [color:var(--reading-muted)]">
                        {callout.description}
                    </p>
                </CardContent>
            </Card>
        </Link>
    )
}
