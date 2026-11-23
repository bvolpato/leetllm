import { getBlogPosts } from "@/lib/blog"
import { BlogPostCard } from "@/components/blog-post-card"
import type { Metadata } from "next"
import Link from "next/link"
import { Rss } from "lucide-react"

export const metadata: Metadata = {
    title: "Blog",
    description:
        "Practical notes on AI engineering, LLM systems, evaluation, agents, and developer workflows.",
    alternates: {
        canonical: "/blog",
        types: {
            "application/rss+xml": "/blog/rss.xml",
        },
    },
    openGraph: {
        title: "Blog | LeetLLM",
        description:
            "Practical notes on AI engineering, LLM systems, evaluation, agents, and developer workflows.",
        url: "https://leetllm.com/blog",
        type: "website",
        images: [
            {
                url: "https://leetllm.com/default-og-image.png",
                width: 1200,
                height: 630,
                alt: "LeetLLM Open Graph Image",
                type: "image/png",
            }
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Blog | LeetLLM",
        description: "Practical notes on AI engineering, LLM systems, evaluation, agents, and developer workflows.",
        images: ["https://leetllm.com/default-og-image.png"],
    }
}

// Blog content ships with the image.
export const revalidate = false

export default function BlogPage() {
    const posts = getBlogPosts()
    const [featuredPost, ...remainingPosts] = posts

    return (
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
            <header className="mb-8 flex flex-col gap-5 border-b border-border/35 pb-7 sm:mb-10 md:flex-row md:items-end md:justify-between">
                <div className="max-w-2xl">
                    <p className="text-sm font-medium text-primary/80">Blog</p>
                    <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-5xl">
                        AI Engineering Blog
                    </h1>
                    <p className="mt-4 text-base leading-relaxed text-muted-foreground/85 sm:text-lg">
                        Explore the questions that come up while building with AI: which tools to try, how to judge a result, and what to do when a promising idea breaks.
                    </p>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground/75">
                    <span>{posts.length} posts</span>
                    <Link
                        href="/blog/rss.xml"
                        className="inline-flex items-center gap-1.5 rounded-md border border-border/50 px-3 py-1.5 transition-colors hover:border-primary/50 hover:text-foreground"
                    >
                        <Rss className="h-3.5 w-3.5" />
                        RSS
                    </Link>
                </div>
            </header>

            {featuredPost && (
                <section aria-label="Featured blog post">
                    <BlogPostCard post={featuredPost} variant="feature" />
                </section>
            )}

            {remainingPosts.length > 0 && (
                <section className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-label="Blog posts">
                    {remainingPosts.map((post) => (
                        <BlogPostCard key={post.id} post={post} />
                    ))}
                </section>
            )}

            {posts.length === 0 && (
                <div className="border-y border-border/45 py-10 text-center">
                    <h2 className="text-xl font-semibold">No blog posts yet</h2>
                    <p className="mt-2 text-sm text-muted-foreground/75">
                        Articles will appear here once published.
                    </p>
                </div>
            )}
        </div>
    )
}
