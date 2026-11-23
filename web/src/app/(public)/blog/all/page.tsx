import { getBlogPosts } from "@/lib/blog"
import { BlogPostCard } from "@/components/blog-post-card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Blog Archive",
    description: "All public LeetLLM blog posts.",
}

// Blog content ships with the image.
export const revalidate = false

export default function BlogAllPage() {
    const posts = getBlogPosts()

    return (
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
            <header className="mb-8 border-b border-border/35 pb-8 sm:mb-10">
                <Link
                    href="/blog"
                    className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Blog
                </Link>
                <h1 className="text-3xl font-bold leading-tight sm:text-5xl">
                    Blog Archive
                </h1>
                <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground/85 sm:text-lg">
                    All public LeetLLM posts, newest first.
                </p>
            </header>

            {posts.length > 0 && (
                <section>
                    <div className="mb-4 text-sm font-semibold text-muted-foreground/70">
                        {posts.length} posts
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {posts.map((post, index) => (
                            <BlogPostCard
                                key={post.id}
                                post={post}
                                priority={index === 0}
                            />
                        ))}
                    </div>
                </section>
            )}
        </div>
    )
}
