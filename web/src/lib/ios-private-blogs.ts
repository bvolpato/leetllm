import { readFileSync, realpathSync } from "node:fs"
import { join, sep } from "node:path"
import { getBlogPostBySlug } from "./blog"

export const IOS_MASTERCLASS_SLUG = "glm-53-training-masterclass-3c1efdc30f7c0d3341d5"

export function getIOSMasterclassEmail(): string | null {
    const configured = process.env.IOS_PRIVATE_BLOG_EMAIL?.trim().toLowerCase()
    return configured || null
}

export function getIOSPrivateBlogs(accessEmail?: string) {
    const resolvedEmail = accessEmail?.trim().toLowerCase() || getIOSMasterclassEmail()
    if (!resolvedEmail) throw new Error("Private masterclass access email is not configured")
    const post = getBlogPostBySlug(IOS_MASTERCLASS_SLUG)
    if (!post?.private || post.draft) throw new Error("Private masterclass is unavailable")

    const slug = post.slug
    const root = realpathSync(join(process.cwd(), "src/content/blog", slug))
    const images: Record<string, string> = {}
    const imagePrefix = `/cdn/content-image/blog/${slug}/`

    function imagePath(url: string | undefined): string | undefined {
        if (!url?.startsWith(imagePrefix)) return undefined
        const relativePath = decodeURIComponent(url.slice(imagePrefix.length).split("?")[0])
        if (!relativePath.endsWith(".png")) return undefined
        const file = realpathSync(join(root, relativePath))
        if (!file.startsWith(root + sep)) throw new Error("Invalid private image path")
        const key = `private-blog-images/${slug}/${relativePath}`
        images[key] ??= readFileSync(file).toString("base64")
        return key
    }

    const content = post.content.replace(/\/cdn\/content-image\/[^"')\s]+/g, (url) => {
        return imagePath(url) ?? `https://leetllm.com${url}`
    })
    const coverImage = imagePath(post.coverImage)
    const coverImageDark = coverImage?.includes("_light.png")
        ? imagePath(post.coverImage?.replace("_light.png", "_dark.png"))
        : coverImage
    const coverImageLight = coverImage?.includes("_dark.png")
        ? imagePath(post.coverImage?.replace("_dark.png", "_light.png"))
        : coverImage

    return {
        blogs: [{
            id: post.id,
            slug: post.slug,
            title: post.title,
            excerpt: post.excerpt,
            author: post.author,
            publishedAt: post.publishedAt,
            updatedAt: post.updatedAt,
            tags: post.tags,
            timeEstimate: post.timeEstimate,
            featured: post.featured ?? false,
            accessEmail: resolvedEmail,
            coverImage,
            coverImageDark,
            coverImageLight,
            content,
            references: Object.entries(post.references).map(([key, reference]) => ({ key, ...reference })),
            images: Object.keys(images).map((path) => ({ path })),
        }],
        images,
    }
}
