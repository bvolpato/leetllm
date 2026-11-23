const RESPONSIVE_IMAGE_WIDTHS = [320, 640, 960, 1280, 1600] as const
const VERSION_PATTERN = /^(?:1|[a-f0-9]{12})$/
const RESPONSIVE_ENCODER_VERSION = "2"

/** Offer cached WebP variants only when intrinsic pixels are known. */
export function getResponsiveContentImageProps(
    src: string | undefined,
    intrinsicWidth?: number,
    sizes = "100vw",
): { srcSet?: string; sizes?: string } {
    if (!src || !src.startsWith("/cdn/content-image/") || src.includes("#")
        || !Number.isInteger(intrinsicWidth) || !intrinsicWidth || intrinsicWidth <= 0) return {}

    const [pathname, rawQuery = ""] = src.split("?", 2)
    if (!pathname.endsWith(".png") || !pathname.slice("/cdn/content-image/".length).includes("/_generated/")) {
        return {}
    }

    const search = new URLSearchParams(rawQuery)
    const entries = Array.from(search.entries())
    if (entries.some(([key]) => key !== "v") || search.getAll("v").length > 1) return {}

    const version = search.get("v")
    if (version !== null && !VERSION_PATTERN.test(version)) return {}

    const candidateWidths = RESPONSIVE_IMAGE_WIDTHS.filter((width) => width <= intrinsicWidth)
    const candidates = candidateWidths.map((width) => {
        const query = new URLSearchParams({ w: String(width) })
        if (version !== null) query.set("v", version)
        query.set("cv", RESPONSIVE_ENCODER_VERSION)
        return `${pathname}?${query.toString()} ${width}w`
    })

    if (version !== null && !RESPONSIVE_IMAGE_WIDTHS.some((width) => width === intrinsicWidth)) {
        candidates.push(`${src} ${intrinsicWidth}w`)
    }
    if (candidates.length === 0) return {}

    return { srcSet: candidates.join(", "), sizes }
}
