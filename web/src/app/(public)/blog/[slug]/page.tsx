import { notFound } from "next/navigation"
import {
    getBlogPostBySlug,
    getBlogPosts,
} from "@/lib/blog"
import { getImageDimensions } from "@/lib/image-utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TopicLine } from "@/components/blog-post-card"
import {
    ArrowLeft,
    Clock,
    Calendar,
    ExternalLink,
    FileText,
    User,
} from "lucide-react"
import Link from "next/link"
import { ServerMarkdownRenderer } from "@/components/server-markdown-renderer"
import { ShareButtons } from "@/components/share-buttons"
import { ArticleFooterNav } from "@/components/article-footer-nav"
import { ArticlePrintButton } from "@/components/article-print-button"
import { CopyMarkdownButton } from "@/components/copy-markdown-button"
import { formatReadingTime } from "@/lib/content-utils"
import { toJsonLd } from "@/lib/utils"
import type { Metadata } from "next"

interface PageProps {
    params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params
    const post = getBlogPostBySlug(slug)
    if (!post) notFound()

    if (post.private) {
        return {
            title: post.title,
            description: post.excerpt,
            alternates: {
                canonical: null,
            },
            openGraph: null,
            twitter: null,
            robots: {
                index: false,
                follow: false,
                nocache: true,
                googleBot: {
                    index: false,
                    follow: false,
                    noimageindex: true,
                },
            },
        }
    }

    let ogImage = post.socialImage || post.coverImage || "/default-og-image.png"
    let imgWidth = 1200
    let imgHeight = 630

    if (ogImage.startsWith("/cdn/content-image/") || ogImage.startsWith("/api/content-image/")) {
        const dims = getImageDimensions(ogImage)
        if (dims) {
            imgWidth = dims.width
            imgHeight = dims.height
        }
        // Build an absolute URL out of it so social media platforms can fetch it
        ogImage = `https://leetllm.com${ogImage}`
    } else if (ogImage.startsWith("/")) {
        ogImage = `https://leetllm.com${ogImage}?v=1`
    }

    return {
        title: post.title,
        description: post.excerpt,
        alternates: {
            canonical: `/blog/${slug}`,
        },
        openGraph: {
            title: `${post.title} | LeetLLM`,
            description: post.excerpt,
            url: `https://leetllm.com/blog/${slug}`,
            type: "article",
            publishedTime: post.publishedAt,
            modifiedTime: post.updatedAt ?? post.publishedAt,
            authors: [post.author.name],
            tags: post.tags,
            images: [
                {
                    url: ogImage,
                    width: imgWidth,
                    height: imgHeight,
                    alt: post.title,
                    type: "image/png",
                }
            ],
        },
        twitter: {
            card: "summary_large_image",
            title: `${post.title} | LeetLLM`,
            description: post.excerpt,
            images: [ogImage],
        },
        keywords: [...post.tags, "LLM", "AI Engineering", post.title].filter(Boolean),
    }
}

// Blog content ships with the image.
export const revalidate = false
export const dynamicParams = true

export async function generateStaticParams() {
    return getBlogPosts()
        .map((post) => ({ slug: post.slug }))
}

function formatDate(dateStr: string): string {
    const date = new Date(dateStr + "T00:00:00")
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    })
}

export default async function BlogPostPage({ params }: PageProps) {
    const { slug } = await params
    const post = getBlogPostBySlug(slug)

    if (!post) {
        notFound()
    }

    // Get all posts for navigation
    const allPosts = getBlogPosts()
    const currentIndex = allPosts.findIndex((p) => p.slug === slug)
    const prevPost = !post.private && currentIndex > 0 ? allPosts[currentIndex - 1] : null
    const nextPost =
        !post.private && currentIndex >= 0 && currentIndex < allPosts.length - 1
            ? allPosts[currentIndex + 1]
            : null
    const articleImage = post.socialImage || post.coverImage

    return (
        <div
            className="print-article mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:py-12"
            data-print-article
            data-leety-access={post.private ? "link" : undefined}
        >
            {!post.private && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: toJsonLd({
                            '@context': 'https://schema.org',
                            '@type': 'Article',
                            headline: post.title,
                            description: post.excerpt,
                            url: `https://leetllm.com/blog/${slug}`,
                            datePublished: post.publishedAt,
                            dateModified: post.updatedAt ?? post.publishedAt,
                            author: {
                                '@type': 'Person',
                                name: post.author.name,
                            },
                            publisher: {
                                '@type': 'Organization',
                                name: 'LeetLLM',
                                url: 'https://leetllm.com',
                            },
                            keywords: post.tags.join(', '),
                            ...(articleImage ? {
                                image: articleImage.startsWith('http')
                                    ? articleImage
                                    : `https://leetllm.com${articleImage}`
                            } : {}),
                        })
                    }}
                />
            )}
            <article
                className="min-w-0"
                data-reader-article
                itemScope
                itemType="https://schema.org/Article"
            >
                {!post.private && (
                    <Link
                        href="/blog"
                        data-print-hidden
                        className="group mb-7 inline-flex items-center gap-2 text-sm [color:var(--reading-subtle)] transition-colors hover:[color:var(--reading-heading)]"
                    >
                        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                        Blog
                    </Link>
                )}

                <header className="reader-prose-header mb-9 space-y-4 border-b border-border/30 pb-7">
                    <TopicLine tags={post.tags} limit={4} />

                    <h1 itemProp="headline" className="text-3xl font-bold leading-tight sm:text-4xl">
                        {post.title}
                    </h1>

                    <p itemProp="description" className="max-w-2xl text-base leading-relaxed [color:var(--reading-muted)] sm:text-lg">
                        {post.excerpt}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 text-sm [color:var(--reading-subtle)]">
                        {post.author.name !== "LeetLLM Team" && (
                            <span itemProp="author" itemScope itemType="https://schema.org/Person" className="flex items-center gap-1.5">
                                <User className="h-4 w-4" />
                                <span itemProp="name">{post.author.name}</span>
                            </span>
                        )}
                        <time dateTime={post.publishedAt} itemProp="datePublished" className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4" />
                            {formatDate(post.publishedAt)}
                        </time>
                        {post.updatedAt && post.updatedAt !== post.publishedAt && (
                            <time dateTime={post.updatedAt} itemProp="dateModified" className="flex items-center gap-1.5 [color:var(--reading-muted)]">
                                Updated {formatDate(post.updatedAt)}
                            </time>
                        )}
                        <span className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4" />
                            {formatReadingTime(post.timeEstimate)} read
                        </span>
                        <div className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-2">
                            <CopyMarkdownButton
                                slug={slug}
                                className="border-[color:var(--reading-border)] [color:var(--reading-muted)] hover:[color:var(--reading-heading)]"
                            />
                            <ArticlePrintButton
                                className="border-[color:var(--reading-border)] [color:var(--reading-muted)] hover:[color:var(--reading-heading)]"
                            />
                        </div>
                    </div>
                </header>

                <div itemProp="articleBody" className="mb-8">
                    <ServerMarkdownRenderer content={post.content} contentKey={slug} showTableOfContents />
                </div>

                {!post.private && (
                    <div data-print-hidden>
                        <ArticleFooterNav
                            previous={prevPost ? { href: `/blog/${prevPost.slug}`, title: prevPost.title } : null}
                            next={nextPost ? { href: `/blog/${nextPost.slug}`, title: nextPost.title } : null}
                            className="mb-8 mt-6"
                        />

                        <ShareButtons
                            url={`/blog/${slug}`}
                            title={post.title}
                            description={post.excerpt}
                        />
                    </div>
                )}

                {post.references &&
                    Object.keys(post.references).length > 0 && (
                        <Card data-print-references className="bg-card/60 border-border/50 mt-8 mb-8 gap-3 py-4">
                            <CardHeader className="pb-0">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <FileText data-print-hidden className="h-4 w-4 text-primary" />
                                    References
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {Object.entries(post.references).map(
                                        ([key, ref]) => (
                                            <a
                                                key={key}
                                                id={`ref-${key}`}
                                                href={ref.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                data-print-reference
                                                className="group flex items-start gap-3 p-3 rounded-lg border border-border/40 bg-background/30 hover:bg-primary/5 hover:border-primary/20 transition-all scroll-mt-24"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-foreground/90 group-hover:text-primary transition-colors leading-snug">
                                                        {ref.title}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {ref.authors} ·{" "}
                                                        {ref.year}
                                                        {ref.venue
                                                            ? ` · ${ref.venue}`
                                                            : ""}
                                                    </p>
                                                    <span data-print-only data-print-reference-url>
                                                        {ref.url}
                                                    </span>
                                                </div>
                                                <ExternalLink data-print-hidden className="h-3.5 w-3.5 text-muted-foreground/60 group-hover:text-primary flex-shrink-0 mt-0.5 transition-colors" />
                                            </a>
                                        )
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

            </article>
        </div>
    )
}
