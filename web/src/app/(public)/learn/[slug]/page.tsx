import { notFound, permanentRedirect } from "next/navigation"
import { getImageDimensions } from "@/lib/image-utils"
import {
    getQuestionForUser,
    getQuestionsForUser,
    getCanonicalQuestionSlug,
    difficultyConfig,
    sectionConfig,
    sections,
} from "@/lib/questions"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    ArrowLeft,
    ExternalLink,
    FileText,
    ChevronRight,
} from "lucide-react"
import Link from "next/link"
import {
    ArticleReaderBody,
    ArticleReaderProvider,
    ArticleReadingTime,
    PersonalizeToolbarPopover,
} from "@/components/personalized-lesson-content"
import { ArticleReadingProgressBar } from "@/components/article-reading-progress-bar"
import { ArticleRightRailToc } from "@/components/lesson-table-of-contents"
import { ServerMarkdownRenderer } from "@/components/server-markdown-renderer"
import { MasteryQuiz } from "@/components/mastery-quiz"
import { renderMasteryQuizNodes } from "@/components/server-inline-markdown"
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

    const dims = getImageDimensions(ogImage)
    if (dims) {
        imgWidth = dims.width
        imgHeight = dims.height
    }
    if (ogImage.startsWith("/cdn/content-image/") || ogImage.startsWith("/api/content-image/")) {
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
    const allReferences = question.references
    const shareImage = question.socialImage || question.coverImage
    const shareImageUrl = shareImage
        ? (shareImage.startsWith("http") ? shareImage : `https://leetllm.com${shareImage}`)
        : undefined

    return (
        <div
            className="print-article learn-reading-page mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10"
            data-print-article
            data-leety-access={question.hidden ? "link" : undefined}
        >
            <ArticleReadingProgressBar targetId="lesson-content" />
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
                sidebarHeader={
                    <Link
                        href="/learn"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group"
                    >
                        <ArrowLeft className="h-3 w-3 group-hover:-translate-x-0.5 transition-transform" />
                        All Topics
                    </Link>
                }
                sidebar={
                    <ArticlePageClient
                        variant="sidebar"
                        slug={slug}
                        sidebarSections={sidebarSections}
                        totalCount={totalCount}
                    />
                }
                rightRail={<ArticleRightRailToc containerId="lesson-content" />}
            >
                <article
                    id="lesson-content"
                    tabIndex={-1}
                    className="learn-reading-column min-w-0 scroll-mt-20"
                    data-reader-article
                    itemScope
                    itemType="https://schema.org/Article"
                >
                    <ArticleReaderProvider
                        slug={slug}
                        readerTimeEstimate={question.timeEstimate}
                    >
                        {/* Mobile back */}
                        <Link
                            href="/learn"
                            data-print-hidden
                            className="reader-prose-block xl:hidden inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group mb-4"
                        >
                            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                            Back to Topics
                        </Link>

                        {/* Header */}
                        <header className="reader-prose-header space-y-4 mb-8 border-b [border-color:var(--reading-border)]/70 pb-6">
                            {/* Breadcrumb */}
                            <div data-print-hidden className="flex items-center gap-1.5 text-xs [color:var(--reading-subtle)] flex-wrap">
                                <Link href="/learn" className="hover:text-primary transition-colors">
                                    Learn
                                </Link>
                                <ChevronRight className="h-3 w-3 opacity-70" />
                                <Link
                                    href={`/learn#${question.section.toLowerCase().replace(/ /g, "-")}`}
                                    className="[color:var(--reading-muted)] hover:text-primary transition-colors"
                                >
                                    {question.section}
                                </Link>
                                <ChevronRight className="h-3 w-3 opacity-70" />
                                <span className="[color:var(--reading-subtle)] truncate">{question.title}</span>
                            </div>

                            <div className="flex items-center gap-2.5 flex-wrap">
                                <Badge
                                    variant="outline"
                                    className={`${diff.bg} ${diff.border} ${diff.color}`}
                                >
                                    {question.difficulty}
                                </Badge>
                                <span className="text-xs font-medium [color:var(--reading-subtle)]">
                                    {question.category}
                                </span>
                                <span aria-hidden="true" className="text-xs [color:var(--reading-subtle)]">·</span>
                                <ArticleReadingTime />
                            </div>

                            <h1 itemProp="headline" className="text-3xl sm:text-[2.35rem] font-bold tracking-tight leading-[1.14] [color:var(--reading-heading)]">
                                {question.title}
                            </h1>

                            <p itemProp="description" className="text-lg [color:var(--reading-muted)] leading-relaxed max-w-none">
                                {question.shortDescription}
                            </p>

                            <div data-print-hidden className="flex flex-wrap items-center justify-between gap-2 pt-1">
                                <div className="flex flex-wrap items-center gap-1.5">
                                    {video && <LessonVideoButton key={video.sha256} video={video} />}
                                    <PersonalizeToolbarPopover align="left" />
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <CopyMarkdownButton
                                        slug={slug}
                                        label="Copy"
                                        ariaLabel="Copy as markdown"
                                        className="border-[color:var(--reading-border)] [color:var(--reading-muted)] hover:[color:var(--reading-heading)]"
                                    />
                                    <ArticlePrintButton
                                        label="PDF"
                                        ariaLabel="Print / Save PDF"
                                        className="border-[color:var(--reading-border)] [color:var(--reading-muted)] hover:[color:var(--reading-heading)]"
                                    />
                                    <LessonStudyTools key={slug} slug={slug} title={question.title} />
                                </div>
                            </div>
                        </header>

                        {/* Main Content */}
                        <div itemProp="articleBody" className="max-w-none mb-10">
                            <ArticleReaderBody
                                readerContent={
                                    <ServerMarkdownRenderer
                                        content={content}
                                        contentKey={slug}
                                        showTableOfContents
                                        hideInlineTocOnDesktop
                                    />
                                }
                                hideInlineTocOnDesktop
                            />
                        </div>
                    </ArticleReaderProvider>

                    {masteryQuestions && (
                        <MasteryQuiz
                            slug={slug}
                            questions={masteryQuestions}
                            renderedQuestions={renderMasteryQuizNodes(masteryQuestions)}
                        />
                    )}

                    {/* Completion + Next Article */}
                    <div className="reader-prose-block">
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
                    </div>

                    {/* References */}
                    {allReferences && Object.keys(allReferences).length > 0 && (
                        <Card data-print-references className="reader-prose-block learn-reading-card mt-8 mb-8 gap-3 py-4">
                            <CardHeader className="pb-0">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <FileText data-print-hidden className="h-4 w-4 text-primary" />
                                    References
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {Object.entries(allReferences).map(([key, ref]) => (
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
                                                <p className="text-sm font-medium [color:var(--reading-heading)] group-hover:text-primary transition-colors leading-snug [overflow-wrap:break-word]">
                                                    {ref.title}
                                                </p>
                                                <p className="text-xs [color:var(--reading-subtle)] mt-1 [overflow-wrap:break-word]">
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
                    <div data-print-hidden className="reader-prose-block">
                        <ArticleComments key={slug} slug={slug} />
                    </div>
                </article>
            </ArticleLayoutShell>
        </div>
    )
}
