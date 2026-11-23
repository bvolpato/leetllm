import { notFound, permanentRedirect } from "next/navigation"
import { getImageDimensions } from "@/lib/image-utils"
import {
    getQuestionForUser,
    getQuestionsForUser,
    getCanonicalQuestionSlug,
    difficultyConfig,
    categoryConfig,
    sectionConfig,
    sections,
} from "@/lib/questions"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    ArrowLeft,
    Clock,
    ArrowRight,
    ExternalLink,
    FileText,
    ChevronRight,
} from "lucide-react"
import Link from "next/link"
import { PersonalizedLessonContent } from "@/components/personalized-lesson-content"
import { MasteryQuiz } from "@/components/mastery-quiz"
import { ArticlePageClient } from "./article-page-client"
import { ArticleLayoutShell } from "./article-layout-shell"
import { ArticleComments } from "@/components/article-comments"
import { ArticleTracker } from "@/components/article-tracker"
import { LessonStudyTools } from "@/components/lesson-study-tools"
import { ArticlePrintButton } from "@/components/article-print-button"
import { CopyMarkdownButton } from "@/components/copy-markdown-button"
import { LessonVideoButton } from "@/components/lesson-video-button"
import { getLessonVideo } from "@/lib/lesson-videos"
import { toJsonLd } from "@/lib/utils"
import type { Metadata } from "next"
import { formatReadingTime } from "@/lib/content-utils"
import { extractLessonBody } from "@/lib/lesson-content"

interface PageProps {
    params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params
    const canonicalSlug = getCanonicalQuestionSlug(slug)
    if (!canonicalSlug) notFound()
    const question = getQuestionForUser(canonicalSlug, false)
    if (!question) notFound()

    let ogImage = question.socialImage || question.coverImage || "/default-og-image.png"
    let imgWidth = 1200
    let imgHeight = 630

    if (ogImage.startsWith("/cdn/content-image/") || ogImage.startsWith("/api/content-image/")) {
        const dims = getImageDimensions(ogImage)
        if (dims) {
            imgWidth = dims.width
            imgHeight = dims.height
        }
        ogImage = `https://leetllm.com${ogImage}`
    } else if (ogImage.startsWith("/")) {
        ogImage = `https://leetllm.com${ogImage}?v=1`
    }

    return {
        title: question.title,
        description: question.shortDescription,
        alternates: {
            canonical: `/learn/${question.slug}`,
        },
        openGraph: {
            title: `${question.title} | LeetLLM`,
            description: question.shortDescription,
            url: `https://leetllm.com/learn/${question.slug}`,
            type: "article",
            images: [
                {
                    url: ogImage,
                    width: imgWidth,
                    height: imgHeight,
                    alt: question.title,
                    type: "image/png",
                }
            ],
        },
        twitter: {
            card: "summary_large_image",
            title: `${question.title} | LeetLLM`,
            description: question.shortDescription,
            images: [ogImage],
        },
        keywords: [question.category, question.section, "LLM", "AI Engineering", question.title].filter(Boolean),
    }
}

// Content ships with the image. Auth-only UI and personalized content resolve client-side.
export const revalidate = false
export const dynamicParams = false

export async function generateStaticParams() {
    return getQuestionsForUser(false).map((question) => ({ slug: question.slug }))
}

export default async function LearnArticlePage({ params }: PageProps) {
    const requestedSlug = (await params).slug
    const canonicalSlug = getCanonicalQuestionSlug(requestedSlug)

    if (!canonicalSlug) {
        notFound()
    }

    if (canonicalSlug !== requestedSlug) {
        permanentRedirect(`/learn/${canonicalSlug}`)
    }

    const slug = canonicalSlug
    const question = getQuestionForUser(slug, false)

    if (!question) {
        notFound()
    }

    const video = getLessonVideo(slug)

    const diff = difficultyConfig[question.difficulty]
    const cat = categoryConfig[question.category]
    const secConfig = sectionConfig[question.section]

    // Get all articles for navigation
    const allQuestions = getQuestionsForUser(false)

    // Find next/prev articles
    const currentIndex = allQuestions.findIndex((q) => q.slug === slug)
    const prevArticle = currentIndex > 0 ? allQuestions[currentIndex - 1] : null
    const nextArticle =
        currentIndex < allQuestions.length - 1 ? allQuestions[currentIndex + 1] : null

    // Prepare sidebar section data
    const sidebarSections = sections.map((section) => ({
        name: section,
        config: sectionConfig[section],
        questions: allQuestions
            .filter((q) => q.section === section)
            .map((q) => ({
                id: q.id,
                title: q.title,
                slug: q.slug,
            })),
    }))

    const totalCount = allQuestions.length
    const { content, masteryQuestions, nextCallout } = extractLessonBody(question.content)
    const shareImage = question.socialImage || question.coverImage
    const shareImageUrl = shareImage
        ? (shareImage.startsWith("http") ? shareImage : `https://leetllm.com${shareImage}`)
        : undefined

    return (
        <div
            className="print-article learn-reading-page mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12"
            data-print-article
            data-leety-access={question.hidden ? "link" : undefined}
        >
            {/* JSON-LD structured data for Google rich snippets */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: toJsonLd({
                        '@context': 'https://schema.org',
                        '@type': 'Article',
                        headline: question.title,
                        description: question.shortDescription,
                        url: `https://leetllm.com/learn/${slug}`,
                        publisher: {
                            '@type': 'Organization',
                            name: 'LeetLLM',
                            url: 'https://leetllm.com',
                        },
                        educationalLevel: question.difficulty,
                        keywords: question.keyConceptsTested.join(', '),
                        ...(shareImageUrl ? { image: shareImageUrl } : {}),
                    })
                }}
            />
            <ArticleTracker slug={slug} section={question.section} isFree />
            <ArticleLayoutShell
                sidebar={
                    <div className="space-y-4">
                        <Link
                            href="/learn"
                            className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors group mb-2"
                        >
                            <ArrowLeft className="h-3 w-3 group-hover:-translate-x-0.5 transition-transform" />
                            All Topics
                        </Link>

                        <ArticlePageClient
                            variant="sidebar"
                            slug={slug}
                            sidebarSections={sidebarSections}
                            totalCount={totalCount}
                        />
                    </div>
                }
            >
                <article
                    id="lesson-content"
                    tabIndex={-1}
                    className="learn-reading-column min-w-0 scroll-mt-20"
                    data-reader-article
                    itemScope
                    itemType="https://schema.org/Article"
                >
                    {/* Mobile back */}
                    <Link
                        href="/learn"
                        data-print-hidden
                        className="xl:hidden inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group mb-6"
                    >
                        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                        Back to Topics
                    </Link>

                    {/* Breadcrumb */}
                    <div data-print-hidden className="flex items-center gap-2 text-sm [color:var(--reading-subtle)] mb-6 flex-wrap">
                        <Link href="/learn" className="hover:text-primary transition-colors">
                            Learn
                        </Link>
                        <ChevronRight className="h-3 w-3" />
                        <span className={secConfig.color}>{question.section}</span>
                        <ChevronRight className="h-3 w-3" />
                        <span className="[color:var(--reading-muted)] truncate">{question.title}</span>
                    </div>

                    {/* Header */}
                    <header className="reader-prose-header space-y-4 mb-10">
                        <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-2xl">{cat.icon}</span>
                            <Badge
                                variant="outline"
                                className={`${diff.bg} ${diff.border} ${diff.color}`}
                            >
                                {question.difficulty}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                                {question.category}
                            </span>
                        </div>

                        <h1 itemProp="headline" className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight [color:var(--reading-heading)]">
                            {question.title}
                        </h1>

                        <p itemProp="description" className="text-lg sm:text-xl [color:var(--reading-muted)] leading-relaxed max-w-none">
                            {question.shortDescription}
                        </p>

                        <div className="flex items-center gap-4 text-sm [color:var(--reading-subtle)] flex-wrap">
                            <span className="flex items-center gap-1.5">
                                <Clock className="h-4 w-4" />
                                {formatReadingTime(question.timeEstimate)} read
                            </span>
                            <div className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-2">
                                {video && <LessonVideoButton key={video.sha256} video={video} />}
                                <CopyMarkdownButton slug={slug} />
                                <ArticlePrintButton />
                                <LessonStudyTools key={slug} slug={slug} title={question.title} />
                            </div>
                        </div>

                        <div data-print-hidden className="rounded-lg border border-border/50 bg-muted/20 p-4">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="min-w-0">
                                    <div className="text-xs font-semibold uppercase tracking-wide [color:var(--reading-subtle)]">
                                        Learning path
                                    </div>
                                    <div className="mt-1 text-sm [color:var(--reading-muted)]">
                                        Step {currentIndex + 1} of {totalCount} in the full curriculum
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {prevArticle && (
                                        <Button asChild variant="outline" size="sm" className="h-auto min-h-8 max-w-full gap-2 whitespace-normal py-1.5">
                                            <Link href={`/learn/${prevArticle.slug}`} aria-label={`Previous lesson: ${prevArticle.title}`}>
                                                <ArrowLeft className="h-4 w-4 flex-shrink-0" />
                                                <span className="line-clamp-2 max-w-[18rem] text-left leading-snug">
                                                    {prevArticle.title}
                                                </span>
                                            </Link>
                                        </Button>
                                    )}
                                    {nextArticle && (
                                        <Button asChild variant="outline" size="sm" className="h-auto min-h-8 max-w-full gap-2 whitespace-normal py-1.5">
                                            <Link href={`/learn/${nextArticle.slug}`} aria-label={`Next lesson: ${nextArticle.title}`}>
                                                <span className="line-clamp-2 max-w-[18rem] text-right leading-snug">
                                                    {nextArticle.title}
                                                </span>
                                                <ArrowRight className="h-4 w-4 flex-shrink-0" />
                                            </Link>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Main Content */}
                    <div itemProp="articleBody" className="max-w-none mb-10">
                        <PersonalizedLessonContent key={slug} slug={slug} content={content} />
                    </div>

                    {masteryQuestions && (
                        <MasteryQuiz slug={slug} questions={masteryQuestions} />
                    )}

                    {/* Completion + Next Article */}
                    <ArticlePageClient
                        variant="footer"
                        slug={slug}
                        articleTitle={question.title}
                        articleDescription={question.shortDescription}
                        nextCallout={nextCallout ?? undefined}
                        nextSlug={nextArticle?.slug}
                        nextTitle={nextArticle?.title}
                        prevSlug={prevArticle?.slug}
                        prevTitle={prevArticle?.title}
                        totalCount={totalCount}
                        hasMasteryQuiz={Boolean(masteryQuestions)}
                    />

                    {/* References */}
                    {question.references && Object.keys(question.references).length > 0 && (
                        <Card data-print-references className="reader-prose-block learn-reading-card mb-8 gap-3 py-4">
                            <CardHeader className="pb-0">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <FileText data-print-hidden className="h-4 w-4 text-primary" />
                                    References
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {Object.entries(question.references).map(([key, ref]) => (
                                        <a
                                            key={key}
                                            id={`ref-${key}`}
                                            href={ref.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            data-print-reference
                                            className="group flex items-start gap-3 p-3 rounded-lg border [border-color:var(--reading-border)] bg-background/30 hover:bg-primary/5 hover:border-primary/20 transition-all scroll-mt-24"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium [color:var(--reading-heading)] group-hover:text-primary transition-colors leading-snug [overflow-wrap:anywhere]">
                                                    {ref.title}
                                                </p>
                                                <p className="text-xs [color:var(--reading-subtle)] mt-1 [overflow-wrap:anywhere]">
                                                    {ref.authors} · {ref.year}{ref.venue ? ` · ${ref.venue}` : ''}
                                                </p>
                                                <span data-print-only data-print-reference-url>
                                                    {ref.url}
                                                </span>
                                            </div>
                                            <ExternalLink data-print-hidden className="h-3.5 w-3.5 text-muted-foreground/60 group-hover:text-primary flex-shrink-0 mt-0.5 transition-colors" />
                                        </a>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Discussion / Comments */}
                    <div data-print-hidden>
                        <ArticleComments key={slug} slug={slug} />
                    </div>
                </article>
            </ArticleLayoutShell>
        </div>
    )
}
