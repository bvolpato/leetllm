import { readdirSync, existsSync } from "fs"
import { join } from "path"
import {
    type Reference,
    estimateReadingTime,
    resetGlobalRefsCache,
    resolveContent,
    resolveReferencesFromContent,
    contentImageUrl,
    normalizeContentImageUrl,
    pngNaturalSize,
} from "./content-utils"
import { loadContentBundle } from "./content-bundle"
import { getBlogRoute } from "./content-route-index"
import { isVisibleToAudience, type ContentAudience } from "./content-audience"

// ═══════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════

export interface BlogAuthor {
    name: string
    avatar?: string
    url?: string
}

export interface BlogPost {
    id: string
    title: string
    slug: string
    aliases?: string[]
    author: BlogAuthor
    publishedAt: string        // YYYY-MM-DD
    updatedAt?: string         // YYYY-MM-DD
    verifiedAt?: string        // YYYY-MM-DD
    refreshAfter?: string      // YYYY-MM-DD
    excerpt: string
    coverImage?: string
    coverImageThemeUrls?: { dark?: string; light?: string }
    coverImageNaturalWidths?: { dark?: number; light?: number }
    socialImage?: string
    tags: string[]
    timeEstimate: number
    references: Record<string, Reference>
    featured?: boolean
    draft?: boolean
    private?: boolean
    hidden?: boolean
    visibility?: Partial<Record<ContentAudience, boolean>>
    redirectTo?: string
    content: string
}

type BlogPostMetadata = Omit<BlogPost, "content" | "timeEstimate" | "references" | "socialImage" | "coverImageThemeUrls" | "coverImageNaturalWidths">
export type BlogPostSummary = Omit<BlogPost, "content"> & { content: string }

// ═══════════════════════════════════════════════════════════════
//  CONTENT LOADER
// ═══════════════════════════════════════════════════════════════

const BLOG_DIR = join(process.cwd(), "src", "content", "blog")
const CONTENT_DIR = join(process.cwd(), "src", "content")

function contentImageAsset(src: string | undefined): { src: string; naturalWidth?: number } | undefined {
    if (!src?.startsWith("/cdn/content-image/")) return undefined

    const pathname = src.split("?", 1)[0]
    const segments = pathname.slice("/cdn/content-image/".length).split("/")
    if (segments.some((segment) => !segment || segment.split(".").some((part) => !/^[A-Za-z0-9_-]+$/.test(part)))) {
        return undefined
    }

    const filePath = join(/* turbopackIgnore: true */ CONTENT_DIR, ...segments)
    if (!existsSync(/* turbopackIgnore: true */ filePath)) return undefined
    return {
        src: contentImageUrl(filePath),
        naturalWidth: pngNaturalSize(filePath)?.w,
    }
}

function coverImageMetadata(src: string | undefined): {
    themeUrls?: { dark?: string; light?: string }
    naturalWidths?: { dark?: number; light?: number }
} | undefined {
    if (!src) return undefined

    const queryStart = src.indexOf("?")
    const pathname = queryStart === -1 ? src : src.slice(0, queryStart)
    const query = queryStart === -1 ? "" : src.slice(queryStart)
    const themeMatch = pathname.match(/_(dark|light)\.png$/)
    const darkSrc = themeMatch
        ? `${pathname.replace(/_(dark|light)\.png$/, "_dark.png")}${query}`
        : src
    const lightSrc = themeMatch
        ? `${pathname.replace(/_(dark|light)\.png$/, "_light.png")}${query}`
        : undefined

    const dark = contentImageAsset(darkSrc)
    const light = contentImageAsset(lightSrc)
    if (!dark && !light) return undefined

    if (!themeMatch) {
        return { naturalWidths: { dark: dark?.naturalWidth } }
    }

    const preferredDark = dark ?? light
    const preferredLight = light ?? dark
    return {
        themeUrls: { dark: preferredDark?.src, light: preferredLight?.src },
        naturalWidths: {
            dark: preferredDark?.naturalWidth,
            light: preferredLight?.naturalWidth,
        },
    }
}

function isSocialBanner(imagePath: string | undefined): boolean {
    return imagePath?.includes("/social_banner.png") || imagePath === "social_banner.png" || false
}

function firstIllustrationImage(rawContent: string, postDir: string): string | undefined {
    const htmlMatch = rawContent.match(/src="(illustrations\/(?:_generated\/)?[^"]+\.png)"/)
    if (htmlMatch) return contentImageUrl(join(postDir, htmlMatch[1]))

    const markdownMatch = rawContent.match(/!\[[^\]]*]\((illustrations\/(?:_generated\/)?[^)]+\.png)\)/)
    if (markdownMatch) return contentImageUrl(join(postDir, markdownMatch[1]))

    return undefined
}

function loadBlogPost(postDir: string): BlogPost | null {
    const bundle = loadContentBundle(postDir, "website")

    if (!bundle || !isVisibleToAudience(bundle.metadata, "website")) return null

    const metadata = bundle.metadata as BlogPostMetadata

    // Skip drafts in production
    if (metadata.draft && process.env.NODE_ENV === "production") return null

    const rawContent = bundle.body
    const resolvedRefs = resolveReferencesFromContent(rawContent, bundle.contentPath)
    const content = resolveContent(rawContent, postDir, resolvedRefs, "content.md", bundle.sourceBody)
    const timeEstimate = estimateReadingTime(rawContent, "Medium", true)

    const socialBannerPath = join(postDir, "social_banner.png")
    const hasSocialBanner = existsSync(/* turbopackIgnore: true */ socialBannerPath)
    const socialImage = hasSocialBanner
        ? contentImageUrl(socialBannerPath)
        : undefined

    const normalizedCover = normalizeContentImageUrl(metadata.coverImage, postDir)
    const coverImage = isSocialBanner(normalizedCover)
        ? firstIllustrationImage(rawContent, postDir)
        : normalizedCover ?? firstIllustrationImage(rawContent, postDir)
    const coverMetadata = coverImageMetadata(coverImage)

    if (hasSocialBanner) {
        metadata.coverImage = coverImage
    } else if (!coverImage) {
        const firstImageMatch = content.match(/<img[^>]+src="([^">]+)"/)
        if (firstImageMatch) {
            metadata.coverImage = firstImageMatch[1]
        }
    } else {
        metadata.coverImage = coverImage
    }

    return {
        ...metadata,
        coverImageThemeUrls: coverMetadata?.themeUrls,
        coverImageNaturalWidths: coverMetadata?.naturalWidths,
        socialImage,
        timeEstimate,
        references: resolvedRefs,
        content,
    }
}

function loadAllBlogPosts(): BlogPost[] {
    if (!existsSync(/* turbopackIgnore: true */ BLOG_DIR)) return []

    const postDirs = readdirSync(/* turbopackIgnore: true */ BLOG_DIR, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)

    const posts: BlogPost[] = []

    for (const slug of postDirs) {
        const postDir = join(BLOG_DIR, slug)
        const post = loadBlogPost(postDir)
        if (post) posts.push(post)
    }

    // Sort by publishedAt (newest first). Social/SEO feature flags should not
    // reshape the reader-facing archive order.
    return posts.sort((a, b) => {
        const dateDiff = new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        if (dateDiff !== 0) return dateDiff
        return a.title.localeCompare(b.title)
    })
}

// ═══════════════════════════════════════════════════════════════
//  CACHED ACCESS
// ═══════════════════════════════════════════════════════════════

let _blogCache: BlogPost[] | null = null
const _singleBlogCache = new Map<string, BlogPost>()
const isDev = process.env.NODE_ENV === "development"

/** Returns all blog posts including private ones for direct-route resolution. */
export function getAllBlogPostsIncludingPrivate(): BlogPost[] {
    if (isDev || !_blogCache) {
        resetGlobalRefsCache()
        _blogCache = loadAllBlogPosts()
    }
    return _blogCache
}

/** Returns canonical public blog posts only. Used by /blog listing, sitemap, etc. */
export function getBlogPosts(): BlogPost[] {
    return getAllBlogPostsIncludingPrivate().filter((p) => !p.private && !p.draft && !p.redirectTo)
}

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
    if (_blogCache || isDev) {
        return getAllBlogPostsIncludingPrivate().find((p) => p.slug === slug && !p.draft)
    }

    const cached = _singleBlogCache.get(slug)
    if (cached) return cached

    const route = getBlogRoute(slug)
    if (!route || route.draft || route.hidden) return undefined

    const post = loadBlogPost(join(/* turbopackIgnore: true */ process.cwd(), "src", "content", /* turbopackIgnore: true */ route.directory))
    if (!post || post.slug !== route.canonicalSlug || post.slug !== slug || post.draft) return undefined

    _singleBlogCache.set(post.slug, post)
    return post
}

export function getBlogPostsByTag(tag: string): BlogPost[] {
    return getBlogPosts().filter((p) => p.tags.includes(tag))
}

export function getAllBlogTags(): string[] {
    const tags = new Set<string>()
    for (const post of getBlogPosts()) {
        for (const tag of post.tags) {
            tags.add(tag)
        }
    }
    return [...tags].sort()
}

// ═══════════════════════════════════════════════════════════════
//  TAG CONFIG
// ═══════════════════════════════════════════════════════════════

export const tagConfig: Record<string, { color: string; icon: string }> = {
    "AI Coding": { color: "text-blue-400", icon: "⌨" },
    "AI Coding Plans": { color: "text-blue-400", icon: "⌨" },
    "AI Engineering": { color: "text-cyan-400", icon: "◎" },
    "AI Infrastructure": { color: "text-slate-400", icon: "▦" },
    "API Pricing": { color: "text-emerald-400", icon: "$" },
    "Architecture": { color: "text-indigo-400", icon: "▤" },
    "Career": { color: "text-emerald-400", icon: "↗" },
    "Claude Code": { color: "text-orange-400", icon: "C" },
    "Codex": { color: "text-sky-400", icon: "C" },
    "Comparison": { color: "text-violet-400", icon: "⇄" },
    "Compensation": { color: "text-lime-400", icon: "$" },
    "Cost Optimization": { color: "text-emerald-400", icon: "$" },
    "Cursor": { color: "text-purple-400", icon: "C" },
    "DeepSeek": { color: "text-teal-400", icon: "D" },
    "Developer Experience": { color: "text-sky-400", icon: "⌘" },
    "Developer Tools": { color: "text-sky-400", icon: "⌘" },
    "Gemma 4": { color: "text-fuchsia-400", icon: "G" },
    "GGUF": { color: "text-amber-400", icon: "G" },
    "GitHub Copilot": { color: "text-blue-400", icon: "G" },
    "GPU Inference": { color: "text-orange-400", icon: "▣" },
    "Inference": { color: "text-orange-400", icon: "▣" },
    "Interview Prep": { color: "text-emerald-400", icon: "?" },
    "Local LLM": { color: "text-cyan-400", icon: "⌂" },
    "MoE": { color: "text-fuchsia-400", icon: "M" },
    "Ollama": { color: "text-stone-400", icon: "O" },
    "Open Models": { color: "text-teal-400", icon: "◇" },
    "OpenClaw": { color: "text-sky-400", icon: "O" },
    "Portfolio": { color: "text-emerald-400", icon: "▥" },
    "Production": { color: "text-slate-400", icon: "▦" },
    "Production AI": { color: "text-slate-400", icon: "▦" },
    "Projects": { color: "text-emerald-400", icon: "▥" },
    "Qwen3.6": { color: "text-violet-400", icon: "Q" },
    "Qwen Cloud": { color: "text-violet-400", icon: "Q" },
    "Roadmap": { color: "text-emerald-400", icon: "→" },
    "SGLang": { color: "text-orange-400", icon: "S" },
    "System Design": { color: "text-indigo-400", icon: "▤" },
    "Tools": { color: "text-sky-400", icon: "⌘" },
    "Tutorial": { color: "text-amber-400", icon: "▸" },
    "Unsloth": { color: "text-rose-400", icon: "U" },
    "vLLM": { color: "text-orange-400", icon: "V" },
    "Benchmarks": { color: "text-sky-400", icon: "📊" },
    "Evaluation": { color: "text-amber-400", icon: "📐" },
    "SWE-bench": { color: "text-emerald-400", icon: "🧪" },
    "Agents": { color: "text-blue-400", icon: "🤖" },
    "Research": { color: "text-purple-400", icon: "🔬" },
    "Deep Dive": { color: "text-rose-400", icon: "🏊" },
    "Models": { color: "text-fuchsia-400", icon: "🧠" },
    "Training": { color: "text-orange-400", icon: "⚡" },
    "Infrastructure": { color: "text-slate-400", icon: "🏗️" },
    "Industry": { color: "text-teal-400", icon: "🏢" },
    "Context Windows": { color: "text-cyan-400", icon: "📏" },
    "Long Context": { color: "text-indigo-400", icon: "📜" },
}

export function getTagConfig(tag: string): { color: string; icon: string } {
    return tagConfig[tag] ?? { color: "text-muted-foreground", icon: "🏷️" }
}
