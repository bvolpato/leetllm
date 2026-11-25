import { createHash } from "crypto"
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs"
import { basename, dirname, extname, join, relative, resolve, sep } from "path"
import { fileURLToPath } from "url"
import { isVisibleToAudience } from "../src/lib/content-audience"
import { loadContentBundle } from "../src/lib/content-bundle"

export type ContentImageManifestEntry = {
    v: string
    w?: number
    h?: number
    /** Present (1) only for publicly visible content eligible for public R2 CDN delivery. */
    pub?: 1
    /** Present (1) only when responsive WebP variants are pre-rendered in R2 CDN. */
    rw?: 1
}

export type ContentImageManifest = Record<string, ContentImageManifestEntry>

const MEDIA_EXTENSIONS = new Set([".png", ".gif", ".mp4", ".vtt"])
const MAX_RESPONSIVE_SOURCE_BYTES = 10 * 1024 * 1024
const MAX_RESPONSIVE_IMAGE_PIXELS = 12_000_000
const MAX_RESPONSIVE_IMAGE_EDGE = 6_000

export function isTrackedContentMedia(relativePath: string): boolean {
    const name = basename(relativePath)
    if (name === "social_banner.png") return true
    if (!relativePath.includes("/illustrations/_generated/") && !relativePath.includes("/diagrams/_generated/")) {
        return false
    }
    return MEDIA_EXTENSIONS.has(extname(name).toLowerCase())
}

function walk(dir: string): string[] {
    if (!existsSync(dir)) return []
    return readdirSync(dir, { withFileTypes: true })
        .sort((left, right) => left.name.localeCompare(right.name))
        .flatMap((entry) => {
            const fullPath = join(dir, entry.name)
            return entry.isDirectory() ? walk(fullPath) : [fullPath]
        })
}

function readPngDimensions(buffer: Buffer): { w: number; h: number } | null {
    if (
        buffer.length >= 24
        && buffer[0] === 0x89
        && buffer[1] === 0x50
        && buffer[2] === 0x4e
        && buffer[3] === 0x47
    ) {
        return {
            w: buffer.readUInt32BE(16),
            h: buffer.readUInt32BE(20),
        }
    }
    return null
}

export function createBundlePublicClassifier(sourceContentDir: string): (rel: string) => boolean {
    const cache = new Map<string, boolean>()

    return (rel: string): boolean => {
        const segments = rel.split("/")
        const section = segments[0]
        if (!section) return false
        if (section === "glossary" || section === "practice") return true

        const slug = segments[1]
        if (!slug) return false
        const key = `${section}/${slug}`
        const cached = cache.get(key)
        if (cached !== undefined) return cached

        const bundleDir = join(sourceContentDir, section, slug)
        const bundle = loadContentBundle(bundleDir, "website")
        if (!bundle) {
            cache.set(key, false)
            return false
        }
        const meta = bundle.metadata as {
            private?: boolean
            draft?: boolean
            hidden?: boolean
            status?: string
            visibility?: { website?: boolean }
        }
        const isPublic = meta.private !== true
            && meta.draft !== true
            && meta.hidden !== true
            && meta.status !== "hidden"
            && isVisibleToAudience(bundle.metadata, "website")
        cache.set(key, isPublic)
        return isPublic
    }
}

export function buildContentImageManifest(sourceContentDir: string): ContentImageManifest {
    const manifest: ContentImageManifest = {}
    const isPublicAsset = createBundlePublicClassifier(sourceContentDir)

    for (const fullPath of walk(sourceContentDir)) {
        const rel = relative(sourceContentDir, fullPath).split(sep).join("/")
        if (!isTrackedContentMedia(rel)) continue

        const buffer = readFileSync(fullPath)
        const v = createHash("sha256").update(buffer).digest("hex").slice(0, 12)
        const isPng = extname(rel).toLowerCase() === ".png"
        const dims = isPng ? readPngDimensions(buffer) : null
        const pub = isPublicAsset(rel)
        const isSocialBanner = basename(rel) === "social_banner.png"
        const rw = pub
            && isPng
            && !isSocialBanner
            && buffer.length > 0
            && buffer.length <= MAX_RESPONSIVE_SOURCE_BYTES
            && dims !== null
            && dims.w > 0
            && dims.h > 0
            && dims.w <= MAX_RESPONSIVE_IMAGE_EDGE
            && dims.h <= MAX_RESPONSIVE_IMAGE_EDGE
            && dims.w * dims.h <= MAX_RESPONSIVE_IMAGE_PIXELS

        const entry: ContentImageManifestEntry = { v }
        if (dims) {
            entry.w = dims.w
            entry.h = dims.h
        }
        if (pub) entry.pub = 1
        if (rw) entry.rw = 1
        manifest[rel] = entry
    }
    return manifest
}

function writeIfChanged(path: string, content: string): boolean {
    if (existsSync(path)) {
        try {
            if (readFileSync(path, "utf8") === content) return false
        } catch {
            // Fall through and rewrite on read error
        }
    }
    writeFileSync(path, content)
    return true
}

export function writeContentImageManifest(sourceContentDir: string, outputPath: string): ContentImageManifest {
    const manifest = buildContentImageManifest(sourceContentDir)
    const serialized = JSON.stringify(manifest) + "\n"
    mkdirSync(dirname(outputPath), { recursive: true })
    const written = writeIfChanged(outputPath, serialized)
    const entries = Object.values(manifest)
    const publicCount = entries.filter((entry) => entry.pub === 1).length
    const privateCount = entries.length - publicCount
    console.log(
        `${written ? "Wrote" : "Unchanged"} ${outputPath} with ${entries.length} content media entries `
        + `(${publicCount} public, ${privateCount} private, ${(serialized.length / 1024).toFixed(1)} KiB)`,
    )
    return manifest
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const rootDir = process.cwd()
    writeContentImageManifest(
        join(rootDir, "src", "content"),
        join(rootDir, "src", "generated", "content-image-manifest.json"),
    )
}
