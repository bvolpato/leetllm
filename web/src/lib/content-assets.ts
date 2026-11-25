export const DEFAULT_CONTENT_ASSETS_ORIGIN = "https://assets.leetllm.com"
export const CONTENT_ASSETS_PREFIX = "/v1/"
export const RESPONSIVE_IMAGE_WIDTHS = [320, 640, 960, 1280, 1600] as const
export const RESPONSIVE_ENCODER_VERSION = "2"

const VERSION_PATTERN = /^(?:1|[a-f0-9]{12})$/
const SAFE_RELATIVE_PATH_PATTERN = /^[A-Za-z0-9_./-]+$/

export function normalizeOrigin(value: string | undefined): string | null {
    const trimmed = value?.trim()
    if (!trimmed) return null
    try {
        const parsed = new URL(trimmed)
        if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null
        return parsed.origin
    } catch {
        return null
    }
}

/**
 * Returns the configured public R2 CDN origin (for example `https://assets.leetllm.com`),
 * or `null` when content media should be served locally through `/cdn/content-image/`.
 */
export function getContentAssetsOrigin(): string | null {
    return normalizeOrigin(process.env.NEXT_PUBLIC_CONTENT_ASSETS_ORIGIN)
}

export function isTrustedContentAssetsOrigin(origin: string): boolean {
    if (origin === DEFAULT_CONTENT_ASSETS_ORIGIN) return true
    const configured = getContentAssetsOrigin()
    return configured !== null && origin === configured
}

export function buildPublicContentAssetUrl(
    origin: string,
    relativePath: string,
    version: string,
): string {
    return `${origin}${CONTENT_ASSETS_PREFIX}${version}/${relativePath}`
}

export function buildPublicResponsiveWebpUrl(
    origin: string,
    relativePath: string,
    version: string,
    width: number,
): string {
    return `${origin}${CONTENT_ASSETS_PREFIX}${version}-w${width}-cv${RESPONSIVE_ENCODER_VERSION}/${relativePath}.webp`
}

export interface ParsedContentImageUrl {
    kind: "local" | "cdn"
    origin?: string
    relativePath: string
    version: string | null
}

function isSafeRelativePath(relativePath: string): boolean {
    if (!relativePath || relativePath.startsWith("/") || relativePath.includes("..") || relativePath.includes("//")) {
        return false
    }
    return SAFE_RELATIVE_PATH_PATTERN.test(relativePath)
}

/**
 * Parses either a local `/cdn/content-image/...` or `/api/content-image/...` URL
 * or a trusted R2 CDN URL (`https://assets.leetllm.com/v1/<version>/<relativePath>`).
 */
export function parseContentImageUrl(src: string | undefined): ParsedContentImageUrl | null {
    if (!src || src.includes("#")) return null

    if (src.startsWith("/cdn/content-image/") || src.startsWith("/api/content-image/")) {
        const prefix = src.startsWith("/cdn/content-image/") ? "/cdn/content-image/" : "/api/content-image/"
        const [pathname, rawQuery = ""] = src.split("?", 2)
        const relativePath = pathname.slice(prefix.length)
        if (!isSafeRelativePath(relativePath)) return null

        const search = new URLSearchParams(rawQuery)
        const entries = Array.from(search.entries())
        if (entries.some(([key]) => key !== "v") || search.getAll("v").length > 1) return null
        const version = search.get("v")
        if (version !== null && !VERSION_PATTERN.test(version)) return null

        return {
            kind: "local",
            relativePath,
            version,
        }
    }

    if (src.startsWith("https://") || src.startsWith("http://")) {
        let parsed: URL
        try {
            parsed = new URL(src)
        } catch {
            return null
        }
        if (parsed.search || !isTrustedContentAssetsOrigin(parsed.origin)) return null
        if (!parsed.pathname.startsWith(CONTENT_ASSETS_PREFIX)) return null

        const remainder = parsed.pathname.slice(CONTENT_ASSETS_PREFIX.length)
        const slashIndex = remainder.indexOf("/")
        if (slashIndex <= 0) return null

        const version = remainder.slice(0, slashIndex)
        const relativePath = remainder.slice(slashIndex + 1)
        if (!VERSION_PATTERN.test(version) || !isSafeRelativePath(relativePath)) return null

        return {
            kind: "cdn",
            origin: parsed.origin,
            relativePath,
            version,
        }
    }

    return null
}

/**
 * Validates canonical fallback image URLs embedded in personalized Mermaid/Vizmatic visuals.
 */
export function isSafeContentImageFallbackUrl(value: unknown): value is string {
    if (typeof value !== "string" || value.length > 500 || value.includes("..")) return false
    if (/^\/(?:cdn|api)\/content-image\/[A-Za-z0-9_./?=-]+$/.test(value)) return true
    return parseContentImageUrl(value)?.kind === "cdn"
}
