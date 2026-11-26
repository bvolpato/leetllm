import "server-only"

import { realpathSync } from "fs"
import { open, readFile, realpath, stat } from "fs/promises"
import { isAbsolute, join, relative, resolve } from "path"
import sharp from "sharp"
import { NextResponse } from "next/server"
import {
    buildPublicContentAssetUrl,
    buildPublicResponsiveWebpUrl,
    getContentAssetsOrigin,
} from "./content-assets"
import { getContentImageManifestEntry } from "./content-utils"

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
const MAX_CACHE_ENTRIES = 128
const MAX_CACHE_BYTES = 64 * 1024 * 1024
const DEFAULT_CONTENT_DIR = join(process.cwd(), "src", "content")

let cachedDefaultContentDir: string | null = null
try {
    cachedDefaultContentDir = realpathSync(/* turbopackIgnore: true */ DEFAULT_CONTENT_DIR)
} catch {
    cachedDefaultContentDir = null
}

type ResponsiveVariant = {
    buffer: Buffer
    width: number
    height: number
}

type ResponsiveVariantResult = ResponsiveVariant | "original" | "saturated"

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

function weakEtag(size: number, mtimeMs: number): string {
    return `W/"${size}-${Math.trunc(mtimeMs)}"`
}

function matchesIfNoneMatch(ifNoneMatch: string | null, etag: string): boolean {
    if (!ifNoneMatch) return false
    const normalizedTarget = etag.startsWith("W/") ? etag.slice(2) : etag
    return ifNoneMatch.split(",").some((candidate) => {
        const trimmed = candidate.trim()
        if (trimmed === "*") return true
        const normalizedCandidate = trimmed.startsWith("W/") ? trimmed.slice(2) : trimmed
        return normalizedCandidate === normalizedTarget
    })
}

function toResponseBytes(buffer: Buffer): Uint8Array<ArrayBuffer> {
    return buffer.buffer instanceof ArrayBuffer
        ? new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)
        : Uint8Array.from(buffer)
}

async function originalImageFallbackResponse(
    filePath: string,
    cacheControl: string,
    etag: string,
): Promise<NextResponse> {
    const buffer = await readFile(/* turbopackIgnore: true */ filePath)
    return new NextResponse(toResponseBytes(buffer), {
        status: 200,
        headers: {
            "Cache-Control": cacheControl,
            "CDN-Cache-Control": cacheControl,
            "Cloudflare-CDN-Cache-Control": cacheControl,
            "ETag": etag,
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

    while (variantCache.size > MAX_CACHE_ENTRIES || variantCacheBytes > MAX_CACHE_BYTES) {
        const oldestKey = variantCache.keys().next().value as string | undefined
        if (!oldestKey) break
        const oldest = variantCache.get(oldestKey)
        variantCache.delete(oldestKey)
        if (oldest) variantCacheBytes -= oldest.byteLength
    }
}

async function renderVariant(
    filePath: string,
    fileSize: number,
    width: number,
    isDiagram: boolean,
    encoderVersion: string | null,
): Promise<ResponsiveVariantResult | null> {
    const hasSlot = await takeTransformSlot()
    if (!hasSlot) return "saturated"

    try {
        if (fileSize <= 0 || fileSize > MAX_SOURCE_BYTES) {
            return "original"
        }

        const input = await readFile(/* turbopackIgnore: true */ filePath)
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

        const resized = source
            .clone()
            .resize({ width, fit: "inside", withoutEnlargement: true, kernel: "lanczos3" })

        let { data, info } = await resized
            .clone()
            .webp(isDiagram ? { lossless: true, effort: 4 } : { quality: 90, effort: 4 })
            .toBuffer({ resolveWithObject: true })

        if (isDiagram && encoderVersion === RESPONSIVE_ENCODER_VERSION && data.length > fileSize) {
            const lossy = await resized
                .clone()
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
    fileSize: number,
    cacheKey: string,
    width: number,
    isDiagram: boolean,
    encoderVersion: string | null,
): Promise<ResponsiveVariantResult | null> {
    const cached = readCachedVariant(cacheKey)
    if (cached) return cached

    const pending = inFlightVariants.get(cacheKey)
    if (pending) return pending

    const work = renderVariant(filePath, fileSize, width, isDiagram, encoderVersion)
    inFlightVariants.set(cacheKey, work)
    try {
        const variant = await work
        if (variant && variant !== "original" && variant !== "saturated") rememberVariant(cacheKey, variant)
        return variant
    } finally {
        if (inFlightVariants.get(cacheKey) === work) inFlightVariants.delete(cacheKey)
    }
}

async function readFileSlice(filePath: string, start: number, length: number): Promise<Buffer> {
    const slice = Buffer.allocUnsafe(length)
    const handle = await open(/* turbopackIgnore: true */ filePath, "r")
    let bytesRead = 0
    try {
        while (bytesRead < length) {
            const result = await handle.read(slice, bytesRead, length - bytesRead, start + bytesRead)
            if (result.bytesRead === 0) break
            bytesRead += result.bytesRead
        }
    } finally {
        await handle.close()
    }
    return bytesRead === length ? slice : slice.subarray(0, bytesRead)
}

function isNotFoundError(error: unknown): boolean {
    const code = (error as NodeJS.ErrnoException | null)?.code
    return code === "ENOENT" || code === "ENOTDIR"
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
    contentDirectory = DEFAULT_CONTENT_DIR,
    rangeHeader: string | null = null,
    ifNoneMatch: string | null = null,
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

    const contentDir = contentDirectory === DEFAULT_CONTENT_DIR && cachedDefaultContentDir
        ? cachedDefaultContentDir
        : await realpath(/* turbopackIgnore: true */ contentDirectory)
    const unresolvedPath = resolve(contentDir, ...pathSegments)
    const unresolvedRelative = relative(contentDir, unresolvedPath)
    if (unresolvedRelative.startsWith("..") || isAbsolute(unresolvedRelative)) return invalidPath()

    let filePath: string
    try {
        filePath = await realpath(/* turbopackIgnore: true */ unresolvedPath)
    } catch (error) {
        if (isNotFoundError(error)) {
            const assetsOrigin = getContentAssetsOrigin()
            const manifestEntry = assetsOrigin ? getContentImageManifestEntry(fullPath) : undefined
            if (assetsOrigin && manifestEntry?.pub === 1 && manifestEntry.v) {
                const requestedVersion = responsiveRequest ? responsiveRequest.version : originalVersion
                const useResponsiveWebp = Boolean(
                    responsiveRequest
                    && manifestEntry.rw === 1
                    && manifestEntry.w
                    && responsiveRequest.width <= manifestEntry.w,
                )
                const targetUrl = useResponsiveWebp && responsiveRequest
                    ? buildPublicResponsiveWebpUrl(assetsOrigin, fullPath, manifestEntry.v, responsiveRequest.width)
                    : buildPublicContentAssetUrl(assetsOrigin, fullPath, manifestEntry.v)
                const cacheControl = requestedVersion === manifestEntry.v
                    ? "public, max-age=31536000, immutable"
                    : "public, max-age=300, s-maxage=3600"
                return NextResponse.redirect(targetUrl, {
                    status: 308,
                    headers: {
                        "Cache-Control": cacheControl,
                        "CDN-Cache-Control": cacheControl,
                        "Cloudflare-CDN-Cache-Control": cacheControl,
                        "X-Content-Type-Options": "nosniff",
                    },
                })
            }
            const isPrivatePath = pathSegments[0] === "blog" && pathSegments[1]?.includes("masterclass")
            const notFoundCache = isPrivatePath ? "no-store" : "public, max-age=60, s-maxage=3600"
            return NextResponse.json(
                { error: "Not found" },
                {
                    status: 404,
                    headers: {
                        "Cache-Control": notFoundCache,
                        "CDN-Cache-Control": notFoundCache,
                        "Cloudflare-CDN-Cache-Control": notFoundCache,
                    },
                },
            )
        }
        return NextResponse.json({ error: "Read error" }, { status: 500 })
    }

    const resolvedRelative = relative(contentDir, filePath)
    if (resolvedRelative.startsWith("..") || isAbsolute(resolvedRelative)) return invalidPath()

    try {
        const fileStat = await stat(/* turbopackIgnore: true */ filePath)
        if (!fileStat.isFile()) {
            return NextResponse.json({ error: "Not found" }, { status: 404 })
        }

        const etag = weakEtag(fileStat.size, fileStat.mtimeMs)
        const version = responsiveRequest ? responsiveRequest.version : originalVersion
        if (matchesIfNoneMatch(ifNoneMatch, etag)) {
            return new NextResponse(null, {
                status: 304,
                headers: {
                    ...imageCacheHeaders(version),
                    "ETag": etag,
                },
            })
        }

        if (responsiveRequest) {
            const { width, encoderVersion } = responsiveRequest
            const cacheKey = `${filePath}:${fileStat.size}:${fileStat.mtimeMs}?w=${width}&cv=${encoderVersion ?? "legacy"}`
            const variant = await getResponsiveVariant(
                filePath,
                fileStat.size,
                cacheKey,
                width,
                pathSegments.includes("diagrams"),
                encoderVersion,
            )
            if (variant === "saturated") {
                return await originalImageFallbackResponse(filePath, "public, max-age=60", etag)
            }
            if (!variant || variant === "original") {
                return await originalImageFallbackResponse(filePath, "no-store", etag)
            }

            return new NextResponse(toResponseBytes(variant.buffer), {
                status: 200,
                headers: {
                    ...imageCacheHeaders(version),
                    "ETag": etag,
                    "Content-Type": "image/webp",
                    "Content-Length": variant.buffer.length.toString(),
                    "X-Image-Width": variant.width.toString(),
                    "X-Image-Height": variant.height.toString(),
                },
            })
        }

        const contentType = isVideo ? "video/mp4" : isCaptions ? "text/vtt; charset=utf-8" : isGif ? "image/gif" : "image/png"
        if (isVideo && rangeHeader) {
            const match = rangeHeader.length <= 80 ? /^bytes=(\d*)-(\d*)$/.exec(rangeHeader) : null
            const size = fileStat.size
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
            const slice = await readFileSlice(filePath, start, end - start + 1)
            return new NextResponse(toResponseBytes(slice), {
                status: 206,
                headers: {
                    ...imageCacheHeaders(originalVersion),
                    "ETag": etag,
                    "Content-Type": contentType,
                    "Content-Length": String(slice.length),
                    "Content-Range": `bytes ${start}-${end}/${size}`,
                    "Accept-Ranges": "bytes",
                },
            })
        }

        const buffer = await readFile(/* turbopackIgnore: true */ filePath)
        return new NextResponse(toResponseBytes(buffer), {
            status: 200,
            headers: {
                "Content-Type": contentType,
                "Content-Length": buffer.length.toString(),
                "Accept-Ranges": "bytes",
                "ETag": etag,
                ...imageCacheHeaders(originalVersion),
            },
        })
    } catch {
        return NextResponse.json({ error: "Read error" }, { status: 500 })
    }
}
