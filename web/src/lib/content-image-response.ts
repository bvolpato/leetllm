import "server-only"

import { existsSync, readFileSync, realpathSync, statSync } from "fs"
import { isAbsolute, join, relative, resolve } from "path"
import sharp from "sharp"
import { NextResponse } from "next/server"

const RESPONSIVE_WIDTHS = new Set([320, 640, 960, 1280, 1600])
const VERSION_PATTERN = /^(?:1|[a-f0-9]{12})$/
const RESPONSIVE_ENCODER_VERSION = "2"
const MAX_QUERY_LENGTH = 64
const MAX_PATH_LENGTH = 1024
const MAX_SOURCE_BYTES = 10 * 1024 * 1024
const MAX_IMAGE_PIXELS = 12_000_000
const MAX_IMAGE_EDGE = 6_000
const MAX_ACTIVE_TRANSFORMS = 2
const MAX_QUEUED_TRANSFORMS = 4
const MAX_CACHE_ITEMS = 24
const MAX_CACHE_BYTES = 24 * 1024 * 1024

type ResponsiveVariant = {
    buffer: Buffer
    width: number
    height: number
}

type ResponsiveVariantResult = ResponsiveVariant | "original"

type VariantCacheEntry = ResponsiveVariant & { byteLength: number }

const variantCache = new Map<string, VariantCacheEntry>()
const inFlightVariants = new Map<string, Promise<ResponsiveVariantResult | null>>()
let variantCacheBytes = 0
let activeTransforms = 0
const transformWaiters: Array<() => void> = []

function invalidPath() {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 })
}

function invalidVariant() {
    return NextResponse.json({ error: "Invalid image variant" }, { status: 400 })
}

function imageCacheHeaders(version: string | null): Record<string, string> {
    const cacheControl = version
        ? "public, max-age=31536000, immutable"
        : "public, max-age=300, s-maxage=300"

    return {
        "Cache-Control": cacheControl,
        "CDN-Cache-Control": cacheControl,
        "Cloudflare-CDN-Cache-Control": cacheControl,
        "X-Content-Type-Options": "nosniff",
    }
}

function uncachedOriginalImageResponse(filePath: string): NextResponse {
    const buffer = readFileSync(filePath)
    return new NextResponse(buffer, {
        status: 200,
        headers: {
            "Cache-Control": "no-store",
            "CDN-Cache-Control": "no-store",
            "Cloudflare-CDN-Cache-Control": "no-store",
            "Content-Type": "image/png",
            "Content-Length": buffer.length.toString(),
            "X-Content-Type-Options": "nosniff",
        },
    })
}

function parseResponsiveRequest(url: URL): {
    width: number
    version: string | null
    encoderVersion: string | null
} | null | false {
    const { search, searchParams } = url
    if (search.length > MAX_QUERY_LENGTH) return false
    if (!searchParams.has("w")) return null

    const params = Array.from(searchParams.entries())
    if (params.some(([key]) => key !== "w" && key !== "v" && key !== "cv")) return false
    if (searchParams.getAll("w").length !== 1
        || searchParams.getAll("v").length > 1
        || searchParams.getAll("cv").length > 1) return false

    const widthText = searchParams.get("w")
    const width = widthText && /^\d{1,4}$/.test(widthText) ? Number(widthText) : NaN
    if (!Number.isSafeInteger(width) || !RESPONSIVE_WIDTHS.has(width)) return false

    const version = searchParams.get("v")
    if (version !== null && !VERSION_PATTERN.test(version)) return false

    const encoderVersion = searchParams.get("cv")
    if (encoderVersion !== null && encoderVersion !== RESPONSIVE_ENCODER_VERSION) return false

    return { width, version, encoderVersion }
}

function parseImageVersion(url: URL): string | null | false {
    if (url.search.length > MAX_QUERY_LENGTH) return false
    const params = Array.from(url.searchParams.entries())
    if (params.some(([key]) => key !== "v") || url.searchParams.getAll("v").length > 1) return false

    const version = url.searchParams.get("v")
    if (version !== null && !VERSION_PATTERN.test(version)) return false
    return version
}

function takeTransformSlot(): Promise<boolean> {
    if (activeTransforms < MAX_ACTIVE_TRANSFORMS) {
        activeTransforms += 1
        return Promise.resolve(true)
    }
    if (transformWaiters.length >= MAX_QUEUED_TRANSFORMS) return Promise.resolve(false)

    return new Promise((resolveSlot) => {
        transformWaiters.push(() => resolveSlot(true))
    })
}

function releaseTransformSlot() {
    const next = transformWaiters.shift()
    if (next) {
        next()
    } else {
        activeTransforms -= 1
    }
}

function readCachedVariant(key: string): ResponsiveVariant | undefined {
    const cached = variantCache.get(key)
    if (!cached) return undefined

    variantCache.delete(key)
    variantCache.set(key, cached)
    return cached
}

function rememberVariant(key: string, variant: ResponsiveVariant) {
    if (variant.buffer.length > MAX_CACHE_BYTES) return

    const previous = variantCache.get(key)
    if (previous) {
        variantCacheBytes -= previous.byteLength
        variantCache.delete(key)
    }

    const entry = { ...variant, byteLength: variant.buffer.length }
    variantCache.set(key, entry)
    variantCacheBytes += entry.byteLength

    while (variantCache.size > MAX_CACHE_ITEMS || variantCacheBytes > MAX_CACHE_BYTES) {
        const oldestKey = variantCache.keys().next().value as string | undefined
        if (!oldestKey) break
        const oldest = variantCache.get(oldestKey)
        variantCache.delete(oldestKey)
        if (oldest) variantCacheBytes -= oldest.byteLength
    }
}

async function renderVariant(
    filePath: string,
    width: number,
    isDiagram: boolean,
    encoderVersion: string | null,
): Promise<ResponsiveVariantResult | null> {
    const hasSlot = await takeTransformSlot()
    if (!hasSlot) return "original"

    try {
        const fileStat = statSync(filePath)
        if (!fileStat.isFile() || fileStat.size <= 0 || fileStat.size > MAX_SOURCE_BYTES) {
            return "original"
        }

        const input = readFileSync(filePath)
        const source = sharp(input, {
            failOn: "error",
            limitInputPixels: MAX_IMAGE_PIXELS,
            pages: 1,
            animated: false,
        })
        const metadata = await source.metadata()

        if (metadata.format !== "png" || !metadata.width || !metadata.height) {
            return "original"
        }
        if (metadata.width > MAX_IMAGE_EDGE || metadata.height > MAX_IMAGE_EDGE
            || metadata.width * metadata.height > MAX_IMAGE_PIXELS) {
            return "original"
        }

        const resize = () => sharp(input, {
            failOn: "error",
            limitInputPixels: MAX_IMAGE_PIXELS,
            pages: 1,
            animated: false,
        }).resize({ width, fit: "inside", withoutEnlargement: true, kernel: "lanczos3" })

        let { data, info } = await resize()
            .webp(isDiagram ? { lossless: true, effort: 4 } : { quality: 90, effort: 4 })
            .toBuffer({ resolveWithObject: true })

        if (isDiagram && encoderVersion === RESPONSIVE_ENCODER_VERSION && data.length > fileStat.size) {
            const lossy = await resize()
                .webp({ quality: 95, effort: 4 })
                .toBuffer({ resolveWithObject: true })
            if (lossy.data.length < data.length) ({ data, info } = lossy)
        }

        return { buffer: data, width: info.width, height: info.height }
    } catch {
        return "original"
    } finally {
        releaseTransformSlot()
    }
}

async function getResponsiveVariant(
    filePath: string,
    cacheKey: string,
    width: number,
    isDiagram: boolean,
    encoderVersion: string | null,
): Promise<ResponsiveVariantResult | null> {
    const cached = readCachedVariant(cacheKey)
    if (cached) return cached

    const pending = inFlightVariants.get(cacheKey)
    if (pending) return pending

    const work = renderVariant(filePath, width, isDiagram, encoderVersion)
    inFlightVariants.set(cacheKey, work)
    try {
        const variant = await work
        if (variant && variant !== "original") rememberVariant(cacheKey, variant)
        return variant
    } finally {
        if (inFlightVariants.get(cacheKey) === work) inFlightVariants.delete(cacheKey)
    }
}

/**
 * Serves pre-rendered illustrations (PNG/GIF/MP4) from the
 * content directory. Responsive WebP variants are opt-in through a fixed
 * `?w=` allowlist, so original PNG/GIF URLs remain stable for readers, print,
 * and social previews. The optional `cv=2` parameter opts into the current
 * diagram-size fallback while leaving older immutable variants unchanged.
 */
export async function serveContentImage(
    pathSegments: string[],
    requestUrl?: URL,
    contentDirectory = join(process.cwd(), "src", "content"),
    rangeHeader: string | null = null,
): Promise<NextResponse> {
    if (!Array.isArray(pathSegments) || pathSegments.length < 1 || pathSegments.length > 16
        || pathSegments.some((segment) => typeof segment !== "string"
            || segment.length > 255
            || !/^[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*$/.test(segment))) {
        return invalidPath()
    }

    const fullPath = pathSegments.join("/")
    if (fullPath.length > MAX_PATH_LENGTH) return invalidPath()

    const isSocialBanner = fullPath.endsWith("/social_banner.png") || fullPath === "social_banner.png"
    const isPng = fullPath.endsWith(".png")
    const isGif = fullPath.endsWith(".gif")
    const isVideo = fullPath.endsWith(".mp4")
    const isCaptions = fullPath.endsWith(".vtt")
    if ((!isPng && !isGif && !isVideo && !isCaptions) || (!pathSegments.includes("_generated") && !isSocialBanner)) {
        return invalidPath()
    }

    const responsiveRequest = requestUrl ? parseResponsiveRequest(requestUrl) : null
    if (responsiveRequest === false || (responsiveRequest && (!isPng || isSocialBanner))) {
        return invalidVariant()
    }
    const originalVersion = !responsiveRequest && requestUrl ? parseImageVersion(requestUrl) : null
    if (originalVersion === false) return invalidVariant()

    const contentDir = realpathSync(/* turbopackIgnore: true */ contentDirectory)
    const unresolvedPath = resolve(contentDir, ...pathSegments)
    const unresolvedRelative = relative(contentDir, unresolvedPath)
    if (unresolvedRelative.startsWith("..") || isAbsolute(unresolvedRelative)) return invalidPath()

    if (!existsSync(unresolvedPath)) {
        return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    try {
        const filePath = realpathSync(unresolvedPath)
        const resolvedRelative = relative(contentDir, filePath)
        if (resolvedRelative.startsWith("..") || isAbsolute(resolvedRelative)) return invalidPath()

        if (responsiveRequest) {
            const { width, version, encoderVersion } = responsiveRequest
            const fileStat = statSync(filePath)
            const cacheKey = `${filePath}:${fileStat.size}:${fileStat.mtimeMs}?w=${width}&cv=${encoderVersion ?? "legacy"}`
            const variant = await getResponsiveVariant(
                filePath,
                cacheKey,
                width,
                pathSegments.includes("diagrams"),
                encoderVersion,
            )
            if (!variant || variant === "original") {
                return uncachedOriginalImageResponse(filePath)
            }

            const imageBytes = variant.buffer.buffer instanceof ArrayBuffer
                ? new Uint8Array(variant.buffer.buffer, variant.buffer.byteOffset, variant.buffer.byteLength)
                : Uint8Array.from(variant.buffer)
            return new NextResponse(imageBytes, {
                status: 200,
                headers: {
                    ...imageCacheHeaders(version),
                    "Content-Type": "image/webp",
                    "Content-Length": variant.buffer.length.toString(),
                    "X-Image-Width": variant.width.toString(),
                    "X-Image-Height": variant.height.toString(),
                },
            })
        }

        const buffer = readFileSync(filePath)
        const contentType = isVideo ? "video/mp4" : isCaptions ? "text/vtt; charset=utf-8" : isGif ? "image/gif" : "image/png"
        if (isVideo && rangeHeader) {
            const match = rangeHeader.length <= 80 ? /^bytes=(\d*)-(\d*)$/.exec(rangeHeader) : null
            const size = buffer.length
            let start = match?.[1] ? Number(match[1]) : 0
            let end = match?.[2] ? Number(match[2]) : size - 1
            if (match && !match[1] && match[2]) {
                start = Math.max(0, size - Number(match[2]))
                end = size - 1
            }
            if (!match || (!match[1] && !match[2]) || !Number.isSafeInteger(start)
                || !Number.isSafeInteger(end) || start >= size || end < start) {
                return new NextResponse(null, {
                    status: 416,
                    headers: { "Content-Range": `bytes */${size}`, "Cache-Control": "no-store" },
                })
            }
            end = Math.min(end, size - 1)
            return new NextResponse(buffer.subarray(start, end + 1), {
                status: 206,
                headers: {
                    ...imageCacheHeaders(originalVersion),
                    "Content-Type": contentType,
                    "Content-Length": String(end - start + 1),
                    "Content-Range": `bytes ${start}-${end}/${size}`,
                    "Accept-Ranges": "bytes",
                },
            })
        }
        return new NextResponse(buffer, {
            status: 200,
            headers: {
                "Content-Type": contentType,
                "Content-Length": buffer.length.toString(),
                "Accept-Ranges": "bytes",
                ...imageCacheHeaders(originalVersion),
            },
        })
    } catch {
        return NextResponse.json({ error: "Read error" }, { status: 500 })
    }
}
