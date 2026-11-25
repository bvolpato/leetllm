import {
    buildPublicResponsiveWebpUrl,
    parseContentImageUrl,
    RESPONSIVE_ENCODER_VERSION,
    RESPONSIVE_IMAGE_WIDTHS,
} from "./content-assets"

/** Offer cached WebP variants only when intrinsic pixels are known. */
export function getResponsiveContentImageProps(
    src: string | undefined,
    intrinsicWidth?: number,
    sizes = "100vw",
): { srcSet?: string; sizes?: string } {
    if (!src || src.includes("#")
        || !Number.isInteger(intrinsicWidth) || !intrinsicWidth || intrinsicWidth <= 0) return {}

    const parsed = parseContentImageUrl(src)
    if (!parsed) return {}
    if (parsed.kind === "local" && !src.startsWith("/cdn/content-image/")) return {}
    if (!parsed.relativePath.endsWith(".png") || !parsed.relativePath.includes("/_generated/")) {
        return {}
    }

    const candidateWidths = RESPONSIVE_IMAGE_WIDTHS.filter((width) => width <= intrinsicWidth)
    let candidates: string[]

    if (parsed.kind === "cdn") {
        if (!parsed.origin || !parsed.version) return {}
        const origin = parsed.origin
        const version = parsed.version
        candidates = candidateWidths.map((width) =>
            `${buildPublicResponsiveWebpUrl(origin, parsed.relativePath, version, width)} ${width}w`,
        )
    } else {
        const pathname = src.split("?", 1)[0]
        candidates = candidateWidths.map((width) => {
            const query = new URLSearchParams({ w: String(width) })
            if (parsed.version !== null) query.set("v", parsed.version)
            query.set("cv", RESPONSIVE_ENCODER_VERSION)
            return `${pathname}?${query.toString()} ${width}w`
        })
    }

    if (parsed.version !== null && !RESPONSIVE_IMAGE_WIDTHS.some((width) => width === intrinsicWidth)) {
        candidates.push(`${src} ${intrinsicWidth}w`)
    }
    if (candidates.length === 0) return {}

    return { srcSet: candidates.join(", "), sizes }
}
