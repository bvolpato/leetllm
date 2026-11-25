import { createHash } from "crypto"
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs"
import { basename, dirname, extname, join, relative, resolve, sep } from "path"
import { fileURLToPath } from "url"

export type ContentImageManifestEntry = {
    v: string
    w?: number
    h?: number
}

export type ContentImageManifest = Record<string, ContentImageManifestEntry>

const MEDIA_EXTENSIONS = new Set([".png", ".gif", ".mp4", ".vtt"])

function isTrackedContentMedia(relativePath: string): boolean {
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

export function buildContentImageManifest(sourceContentDir: string): ContentImageManifest {
    const manifest: ContentImageManifest = {}
    for (const fullPath of walk(sourceContentDir)) {
        const rel = relative(sourceContentDir, fullPath).split(sep).join("/")
        if (!isTrackedContentMedia(rel)) continue

        const buffer = readFileSync(fullPath)
        const v = createHash("sha256").update(buffer).digest("hex").slice(0, 12)
        const dims = extname(rel).toLowerCase() === ".png" ? readPngDimensions(buffer) : null
        manifest[rel] = dims ? { v, w: dims.w, h: dims.h } : { v }
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
    const count = Object.keys(manifest).length
    console.log(
        `${written ? "Wrote" : "Unchanged"} ${outputPath} with ${count} content media entries `
        + `(${(serialized.length / 1024).toFixed(1)} KiB)`,
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
