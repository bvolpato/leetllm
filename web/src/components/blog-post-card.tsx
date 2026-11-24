/* eslint-disable @next/next/no-img-element */
import Link from "next/link"
import { ArrowRight, Calendar, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getTagConfig, type BlogPost } from "@/lib/blog"
import { formatReadingTime } from "@/lib/content-utils"
import { getResponsiveContentImageProps } from "@/lib/responsive-content-image"

export function formatBlogDate(dateStr: string, variant: "long" | "short" = "long"): string {
    const date = new Date(dateStr + "T00:00:00")
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: variant === "long" ? "long" : "short",
        day: "numeric",
    })
}

export function TopicLine({ tags, limit = 2 }: { tags: string[]; limit?: number }) {
    const visibleTags = tags.slice(0, limit)
    const hiddenCount = Math.max(0, tags.length - visibleTags.length)

    return (
        <div className="flex flex-wrap items-center gap-1.5">
            {visibleTags.map((tag) => (
                <Badge
                    key={tag}
                    variant="outline"
                    className={`${getTagConfig(tag).color} border-current/20 bg-background/40 text-[10px]`}
                >
                    {tag}
                </Badge>
            ))}
            {hiddenCount > 0 && (
                <Badge
                    variant="outline"
                    className="border-border/45 bg-background/40 text-[10px] text-muted-foreground/75"
                >
                    +{hiddenCount}
                </Badge>
            )}
        </div>
    )
}

function PostMeta({ post }: { post: BlogPost }) {
    return (
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <time dateTime={post.publishedAt} className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatBlogDate(post.publishedAt, "short")}
            </time>
            <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatReadingTime(post.timeEstimate)}
            </span>
        </div>
    )
}

function getThemePair(
    src: string | undefined,
    resolvedPair?: { dark?: string; light?: string },
): { dark?: string; light?: string } {
    if (resolvedPair?.dark || resolvedPair?.light) return resolvedPair
    if (!src) return {}

    if (src.includes("_dark.png")) {
        return {
            dark: src,
            light: src.replace("_dark.png", "_light.png"),
        }
    }

    if (src.includes("_light.png")) {
        return {
            dark: src.replace("_light.png", "_dark.png"),
            light: src,
        }
    }

    return { dark: src }
}

export function BlogCoverImage({
    post,
    priority = false,
    className = "",
    imageClassName = "",
    sizes = "(min-width: 1024px) 33vw, 100vw",
}: {
    post: BlogPost
    priority?: boolean
    className?: string
    imageClassName?: string
    sizes?: string
}) {
    const images = getThemePair(post.coverImage, post.coverImageThemeUrls)
    const frameClassName = [
        "relative overflow-hidden rounded-lg border border-border/45 bg-card/75",
        "shadow-sm shadow-black/10 transition-colors group-hover:border-primary/35",
        className,
    ].filter(Boolean).join(" ")

    if (!images.dark && !images.light) {
        return (
            <div className={frameClassName}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,hsl(var(--primary)/0.25),transparent_34%),linear-gradient(135deg,hsl(var(--card)),hsl(var(--muted)/0.22))]" />
            </div>
        )
    }

    const baseImageClassName = [
        "absolute inset-0 h-full w-full object-contain",
        imageClassName || "p-3",
    ].join(" ")

    return (
        <div className={frameClassName}>
            {images.dark && (
                <img
                    src={images.dark}
                    {...getResponsiveContentImageProps(images.dark, post.coverImageNaturalWidths?.dark, sizes)}
                    alt=""
                    className={`${baseImageClassName} ${images.light ? "hidden dark:block" : ""}`}
                    loading={priority ? "eager" : "lazy"}
                    fetchPriority={priority ? "high" : "auto"}
                    decoding="async"
                />
            )}
            {images.light && (
                <img
                    src={images.light}
                    {...getResponsiveContentImageProps(images.light, post.coverImageNaturalWidths?.light, sizes)}
                    alt=""
                    className={`${baseImageClassName} block dark:hidden`}
                    loading={priority && !images.dark ? "eager" : "lazy"}
                    fetchPriority={priority && !images.dark ? "high" : "auto"}
                    decoding="async"
                />
            )}
        </div>
    )
}

export function BlogPostCard({
    post,
    variant = "default",
    priority = false,
}: {
    post: BlogPost
    variant?: "default" | "feature" | "compact"
    priority?: boolean
}) {
    const isFeature = variant === "feature"
    const isCompact = variant === "compact"
    const imagePriority = isFeature || priority

    if (isFeature) {
        return (
            <Link
                href={`/blog/${post.slug}`}
                prefetch={false}
                className="group block"
            >
                <article className="grid overflow-hidden rounded-xl border border-border/55 bg-card/55 shadow-sm shadow-black/5 transition-all hover:border-primary/35 hover:bg-card/75 hover:shadow-md md:grid-cols-[minmax(0,1fr)_24rem]">
                    <div className="flex min-w-0 flex-col p-6 sm:p-7">
                        <TopicLine tags={post.tags} limit={3} />
                        <h2 className="mt-4 max-w-3xl text-2xl font-semibold leading-tight transition-colors group-hover:text-primary sm:text-3xl">
                            {post.title}
                        </h2>
                        <p className="mt-3 max-w-2xl flex-1 text-base leading-relaxed text-muted-foreground">
                            {post.excerpt}
                        </p>
                        <div className="mt-5 flex items-center justify-between gap-4 border-t border-border/40 pt-4">
                            <PostMeta post={post} />
                            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                                Read
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                            </span>
                        </div>
                    </div>
                    <BlogCoverImage
                        post={post}
                        priority={imagePriority}
                        className="order-first aspect-[16/9] rounded-none border-0 border-b border-border/35 md:order-last md:h-full md:min-h-72 md:border-b-0 md:border-l"
                        imageClassName="p-4"
                        sizes="(min-width: 768px) 384px, 100vw"
                    />
                </article>
            </Link>
        )
    }

    return (
        <Link href={`/blog/${post.slug}`} prefetch={false} className="group block">
            <article
                className={
                    isCompact
                        ? "grid gap-4 rounded-xl border border-border/50 bg-card/45 p-4 transition-all hover:border-primary/30 hover:bg-card/65 sm:grid-cols-[9rem_minmax(0,1fr)]"
                        : "flex h-full flex-col overflow-hidden rounded-xl border border-border/50 bg-card/45 shadow-sm shadow-black/5 transition-all hover:border-primary/35 hover:bg-card/65 hover:shadow-md"
                }
            >
                <BlogCoverImage
                    post={post}
                    priority={imagePriority}
                    className={
                        isCompact
                            ? "aspect-[16/10]"
                            : "aspect-[16/9] rounded-none border-0 border-b border-border/35"
                    }
                    sizes={isCompact ? "(min-width: 640px) 144px, 100vw" : "(min-width: 1024px) 33vw, 100vw"}
                />
                <div className={isCompact ? "min-w-0" : "flex flex-1 flex-col p-5"}>
                    <TopicLine tags={post.tags} limit={isCompact ? 2 : 3} />
                    <h3
                        className={
                            isCompact
                                ? "mt-3 text-base font-semibold leading-snug transition-colors group-hover:text-primary"
                                : "mt-3 text-lg font-semibold leading-snug transition-colors group-hover:text-primary"
                        }
                    >
                        {post.title}
                    </h3>
                    <p
                        className={
                            isCompact
                                ? "mt-3 text-sm leading-relaxed text-muted-foreground/75"
                                : "mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground/80"
                        }
                    >
                        {post.excerpt}
                    </p>
                    <div
                        className={
                            isCompact
                                ? "mt-3 flex items-center justify-between gap-4"
                                : "mt-5 flex items-center justify-between gap-4 border-t border-border/35 pt-4"
                        }
                    >
                        <PostMeta post={post} />
                        <ArrowRight className="h-4 w-4 text-primary/65 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                    </div>
                </div>
            </article>
        </Link>
    )
}
