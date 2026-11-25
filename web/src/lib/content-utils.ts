import { createHash } from "crypto"
import { closeSync, existsSync, openSync, readFileSync, readSync, statSync } from "fs"
import { join, relative, sep } from "path"
import { decodeHTMLAttribute } from "entities"
import { buildPublicContentAssetUrl, getContentAssetsOrigin } from "./content-assets"

// ═══════════════════════════════════════════════════════════════
//  SHARED TYPES
// ═══════════════════════════════════════════════════════════════

export interface Reference {
    title: string
    authors: string
    year: number
    url: string
    type: 'paper' | 'resource'
    venue?: string
    note?: string
}

export function canonicalReferenceUrl(url: string): string {
    const match = url.match(/^https?:\/\/r\.jina\.ai\/(https?:\/\/.+)$/)
    return match ? match[1] : url
}

function htmlAttribute(value: string | number): string {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
}

function htmlAttributeValue(markup: string, name: string): string | undefined {
    const attributes = markup.matchAll(/\s+([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)
    for (const attribute of attributes) {
        if (attribute[1].toLowerCase() === name.toLowerCase()) {
            return attribute[2] ?? attribute[3] ?? attribute[4]
        }
    }
    return undefined
}

function sanitizeReference(ref: Reference): Reference {
    const url = canonicalReferenceUrl(ref.url)
    return url === ref.url ? ref : { ...ref, url }
}

function sanitizeReferences(references: Record<string, Reference>): Record<string, Reference> {
    return Object.fromEntries(
        Object.entries(references).map(([key, ref]) => [key, sanitizeReference(ref)])
    )
}

const WORDS_PER_MINUTE = 220
const CODE_WORD_WEIGHT = 0.35
const TABLE_CELL_WEIGHT = 0.35
const MIN_MINUTES_BY_DIFFICULTY: Record<string, number> = {
    Easy: 5,
    Medium: 7,
    Hard: 9,
}
const MIN_BLOG_MINUTES = 5
const WORD_RE = /[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)?/g
const FENCED_BLOCK_RE = /```[\s\S]*?```/g

// ═══════════════════════════════════════════════════════════════
//  GLOBAL REFERENCES
// ═══════════════════════════════════════════════════════════════

const CONTENT_DIR = join(process.cwd(), "src", "content")

/** Global reference registry — loaded once, used to resolve array-format references. */
let _globalRefsCache: Record<string, Reference> | null = null
export function getGlobalReferences(): Record<string, Reference> {
    if (!_globalRefsCache) {
        const refsPath = join(CONTENT_DIR, "references.json")
        if (existsSync(/* turbopackIgnore: true */ refsPath)) {
            _globalRefsCache = sanitizeReferences(JSON.parse(readFileSync(/* turbopackIgnore: true */ refsPath, "utf-8")))
        } else {
            _globalRefsCache = {}
        }
    }
    return _globalRefsCache!
}

export function resetGlobalRefsCache(): void {
    _globalRefsCache = null
}

export function extractCitationKeys(markdown: string): string[] {
    const cleaned = markdown.replace(/^\[\^[\w]+\]:.*$/gm, "")
    const keys: string[] = []

    for (const match of cleaned.matchAll(/\[\^(\w+)\]/g)) {
        if (!keys.includes(match[1])) {
            keys.push(match[1])
        }
    }

    return keys
}

export function resolveReferencesFromContent(markdown: string, sourceLabel: string): Record<string, Reference> {
    const globalRefs = getGlobalReferences()
    const resolved: Record<string, Reference> = {}
    const missingKeys: string[] = []

    for (const key of extractCitationKeys(markdown)) {
        if (globalRefs[key]) {
            resolved[key] = globalRefs[key]
        } else {
            missingKeys.push(key)
        }
    }

    if (missingKeys.length > 0) {
        throw new Error(
            `[CONTENT ERROR] Missing reference key(s) in references.json for ${sourceLabel}: ${missingKeys.join(", ")}`
        )
    }

    return resolved
}

function countWords(text: string): number {
    return text.match(WORD_RE)?.length ?? 0
}

function splitFencedBlocks(markdown: string): { prose: string; blocks: string[] } {
    const blocks: string[] = []
    const prose = markdown.replace(FENCED_BLOCK_RE, (block) => {
        if (!block.startsWith("```mastery-quiz")) {
            blocks.push(block)
        }
        return "\n"
    })

    return { prose, blocks }
}

function stripMarkdownNoise(markdown: string): string {
    const lines = markdown
        .split("\n")
        .filter((line) => {
            const stripped = line.trim()
            return !stripped.startsWith("![") && !(stripped.startsWith("[^") && stripped.includes("]:"))
        })

    return lines
        .join("\n")
        .replace(/!\[[^\]]*]\([^)]+\)/g, " ")
        .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
        .replace(/`([^`]+)`/g, "$1")
        .replace(/[*_>#~]/g, " ")
}

export function estimateReadingTime(content: string, difficulty: string = "Medium", isBlog: boolean = false): number {
    const { prose, blocks } = splitFencedBlocks(content)
    const proseText = stripMarkdownNoise(prose)
    const proseWords = countWords(proseText)
    const codeWords = blocks.reduce((sum, block) => sum + countWords(block), 0)
    const tableCells = prose
        .split("\n")
        .filter((line) => line.trim().startsWith("|") && line.trim().endsWith("|"))
        .reduce((sum, line) => sum + Math.max(0, line.split("|").length - 2), 0)

    const weightedWords = proseWords + (codeWords * CODE_WORD_WEIGHT) + (tableCells * TABLE_CELL_WEIGHT)
    const estimate = Math.ceil(weightedWords / WORDS_PER_MINUTE)
    const minMinutes = isBlog ? MIN_BLOG_MINUTES : (MIN_MINUTES_BY_DIFFICULTY[difficulty] ?? MIN_MINUTES_BY_DIFFICULTY.Medium)

    return Math.max(minMinutes, estimate)
}

export function formatReadingTime(minutes: number): string {
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const remainder = minutes % 60
    return remainder === 0 ? `${hours}h` : `${hours}h ${remainder}m`
}

// ═══════════════════════════════════════════════════════════════
//  IMAGE / ILLUSTRATION UTILITIES
// ═══════════════════════════════════════════════════════════════

type PngDimensions = {
    natural: { w: number; h: number }
    display: { w: number; h: number }
}

export type PrebuiltImageManifestEntry = {
    v: string
    w?: number
    h?: number
    pub?: 1
    rw?: 1
}

let prebuiltImagesCache: Record<string, PrebuiltImageManifestEntry> | null = null
const pngDimensionsCache = new Map<string, { sig: string; value: PngDimensions | null }>()
const contentImageVersionCache = new Map<string, { sig: string; version: string }>()

function isProductionEnv(): boolean {
    return process.env.NODE_ENV === "production"
}

function shouldUsePrebuiltImageManifest(): boolean {
    return isProductionEnv() || Boolean(getContentAssetsOrigin())
}

function getPrebuiltImageManifest(): Record<string, PrebuiltImageManifestEntry> {
    if (!prebuiltImagesCache) {
        try {
            const manifestPath = join(/* turbopackIgnore: true */ process.cwd(), "src", "generated", "content-image-manifest.json")
            prebuiltImagesCache = JSON.parse(readFileSync(/* turbopackIgnore: true */ manifestPath, "utf8")) as Record<string, PrebuiltImageManifestEntry>
        } catch {
            prebuiltImagesCache = {}
        }
    }
    return prebuiltImagesCache
}

export function getContentImageManifestEntry(relativePath: string): PrebuiltImageManifestEntry | undefined {
    if (!shouldUsePrebuiltImageManifest()) return undefined
    return getPrebuiltImageManifest()[relativePath]
}

export function resetPrebuiltImageManifestCacheForTests(): void {
    prebuiltImagesCache = null
}

function prebuiltImageEntry(absolutePath: string): PrebuiltImageManifestEntry | undefined {
    if (!shouldUsePrebuiltImageManifest()) return undefined
    const rel = relative(CONTENT_DIR, absolutePath).split(sep).join("/")
    if (!rel || rel.startsWith("..") || rel.startsWith("/")) return undefined
    return getPrebuiltImageManifest()[rel]
}

export function hasContentMediaFile(absolutePath: string): boolean {
    return Boolean(prebuiltImageEntry(absolutePath)) || existsSync(/* turbopackIgnore: true */ absolutePath)
}

function hasContentFile(absolutePath: string): boolean {
    return hasContentMediaFile(absolutePath)
}

function pngDimensions(filePath: string): PngDimensions | null {
    try {
        const prebuilt = prebuiltImageEntry(filePath)
        if (prebuilt?.w && prebuilt?.h) {
            return {
                natural: { w: prebuilt.w, h: prebuilt.h },
                display: { w: Math.round(prebuilt.w / 2), h: Math.round(prebuilt.h / 2) },
            }
        }

        const isProd = isProductionEnv()
        const cached = pngDimensionsCache.get(filePath)
        let sig = ""
        if (isProd) {
            if (cached) return cached.value
        } else {
            const fileStat = statSync(/* turbopackIgnore: true */ filePath)
            sig = `${fileStat.size}:${fileStat.mtimeMs}`
            if (cached && cached.sig === sig) return cached.value
        }

        const fd = openSync(/* turbopackIgnore: true */ filePath, "r")
        let value: PngDimensions | null = null
        try {
            const buf = Buffer.allocUnsafe(24)
            const bytesRead = readSync(fd, buf, 0, 24, 0)
            // PNG IHDR: bytes 16-19 = width, 20-23 = height (big-endian uint32)
            if (bytesRead >= 24) {
                const naturalW = buf.readUInt32BE(16)
                const naturalH = buf.readUInt32BE(20)
                value = {
                    natural: { w: naturalW, h: naturalH },
                    display: { w: Math.round(naturalW / 2), h: Math.round(naturalH / 2) },
                }
            }
        } finally {
            closeSync(fd)
        }

        pngDimensionsCache.set(filePath, { sig, value })
        return value
    } catch {
        return null
    }
}

/** Return the source pixel dimensions used when selecting responsive image variants. */
export function pngNaturalSize(filePath: string): { w: number; h: number } | null {
    return pngDimensions(filePath)?.natural ?? null
}

/**
 * Return intended display dimensions (half natural size, since all
 * illustrations and diagrams are rendered at 2× retina).
 */
export function pngDisplaySize(filePath: string): { w: number; h: number } | null {
    return pngDimensions(filePath)?.display ?? null
}

/**
 * Build a URL path for a content image served by /cdn/content-image/[...path].
 * Converts an absolute file path inside the content directory to a relative
 * URL, e.g.:
 *   /home/.../src/content/fundamentals/slug/illustrations/_generated/foo_dark.png
 *   → /cdn/content-image/fundamentals/slug/illustrations/_generated/foo_dark.png
 */
export function contentImageUrl(absolutePath: string): string {
    const rel = relative(CONTENT_DIR, absolutePath).split(sep).join("/")
    const prebuilt = prebuiltImageEntry(absolutePath)
    if (prebuilt?.v) {
        const assetsOrigin = getContentAssetsOrigin()
        if (assetsOrigin && prebuilt.pub === 1) {
            return buildPublicContentAssetUrl(assetsOrigin, rel, prebuilt.v)
        }
        return `/cdn/content-image/${rel}?v=${prebuilt.v}`
    }
    let version = "1"
    try {
        const isProd = isProductionEnv()
        const cached = contentImageVersionCache.get(absolutePath)
        let sig = ""
        if (isProd) {
            if (cached) return `/cdn/content-image/${rel}?v=${cached.version}`
        } else {
            const fileStat = statSync(/* turbopackIgnore: true */ absolutePath)
            sig = `${fileStat.size}:${fileStat.mtimeMs}`
            if (cached && cached.sig === sig) return `/cdn/content-image/${rel}?v=${cached.version}`
        }

        version = createHash("sha256")
            .update(readFileSync(/* turbopackIgnore: true */ absolutePath))
            .digest("hex")
            .slice(0, 12)
        contentImageVersionCache.set(absolutePath, { sig, version })
    } catch { /* fall back to static version */ }
    return `/cdn/content-image/${rel}?v=${version}`
}

export function contentAssetUrl(absolutePath: string): string {
    const rel = relative(CONTENT_DIR, absolutePath)
    return `/api/content-asset/${rel}`
}

export function normalizeContentImageUrl(imagePath: string | undefined, contentDir: string): string | undefined {
    if (!imagePath || imagePath.startsWith("/") || /^https?:\/\//.test(imagePath)) {
        return imagePath
    }

    return contentImageUrl(join(contentDir, imagePath))
}

/**
 * Resolves relative illustration paths in markdown to URL-based image tags.
 * Generates one themed <img> per illustration with dark/light source metadata.
 * MarkdownRenderer selects active source and wraps it in semantic <picture>,
 * keeping reader-mode extraction to one image.
 *
 * Images are served via /cdn/content-image/ with aggressive cache headers,
 * avoiding the massive HTML payload caused by inline base64 data URIs.
 *
 * Supports patterns in content.md:
 *   - HTML: src="illustrations/attention_flow.png"
 *   - Markdown: ![alt](illustrations/attention_flow.png)
 *   - Markdown: ![alt](illustrations/_generated/attention_flow.png)
 *   - Markdown: ![alt](illustrations/_generated/attention_flow_dark.png)
 *
 * The build step renders both filename_dark.png and filename_light.png
 * into illustrations/_generated/. This function strips an optional
 * _dark/_light suffix, checks both exist, and replaces single reference
 * with one theme-aware image.
 */
export function resolveIllustrations(markdown: string, contentDir: string): string {
    // Load alt text manifest from build step (accessibility descriptions)
    const altManifestPath = join(contentDir, "illustrations", "_generated", "alt.json")
    let altManifest: Record<string, string> = {}
    if (existsSync(/* turbopackIgnore: true */ altManifestPath)) {
        try {
            altManifest = JSON.parse(readFileSync(/* turbopackIgnore: true */ altManifestPath, 'utf-8'))
        } catch { /* ignore parse errors */ }
    }

    // Helper: given a base name (without .png), build themed image HTML
    function wrapFigure(innerHtml: string, wrap: boolean): string {
        return wrap ? `<figure>\n${innerHtml}\n</figure>` : innerHtml
    }

    function buildThemedImages(rawBase: string, markdownAlt: string, wrap = true): string | null {
        // Strip _dark / _light suffix if present so that a markdown reference
        // like `benchmark_matrix_dark.png` correctly finds both themed variants
        // (`benchmark_matrix_dark.png` and `benchmark_matrix_light.png`).
        const base = rawBase.replace(/_(dark|light)$/, '')

        const filmManifest = join(contentDir, "illustrations", "_generated", `${base}_film.json`)
        const filmFiles = Object.fromEntries(['dark', 'light'].flatMap(theme => [
            [`${theme}Video`, join(contentDir, "illustrations", "_generated", `${base}_${theme}.mp4`)],
            [`${theme}Captions`, join(contentDir, "illustrations", "_generated", `${base}_${theme}.vtt`)],
            [`${theme}Fallback`, join(contentDir, "illustrations", "_generated", `${base}_${theme}.png`)],
        ]))
        if (existsSync(/* turbopackIgnore: true */ filmManifest) && Object.values(filmFiles).every(path => hasContentFile(path))) {
            const metadata = JSON.parse(readFileSync(/* turbopackIgnore: true */ filmManifest, 'utf-8'))
            const filmData = JSON.stringify({
                kind: 'film',
                alt: altManifest[base] || markdownAlt,
                width: metadata.width,
                height: metadata.height,
                duration: metadata.duration,
                ...Object.fromEntries(Object.entries(filmFiles).map(([key, path]) => [key, contentImageUrl(path)])),
            })
            const dataAttr = `data-animated-illustration="${htmlAttribute(filmData)}"`
            const dark = htmlAttribute(contentImageUrl(filmFiles.darkFallback))
            const light = htmlAttribute(contentImageUrl(filmFiles.lightFallback))
            return wrapFigure(`<img src="${dark}" alt="${htmlAttribute(altManifest[base] || markdownAlt)}" data-themed-image="true" data-dark-src="${dark}" data-light-src="${light}" ${dataAttr} />`, wrap)
        }

        // ─── Check for timeline animation (GIF + static fallback) ────
        const animationManifest = join(contentDir, "illustrations", "_generated", `${base}_animation.json`)
        const darkGif = join(contentDir, "illustrations", "_generated", `${base}_dark.gif`)
        const lightGif = join(contentDir, "illustrations", "_generated", `${base}_light.gif`)
        const darkFallback = join(contentDir, "illustrations", "_generated", `${base}_dark.png`)
        const lightFallback = join(contentDir, "illustrations", "_generated", `${base}_light.png`)
        if (
            existsSync(/* turbopackIgnore: true */ animationManifest) &&
            hasContentFile(darkGif) &&
            hasContentFile(lightGif) &&
            hasContentFile(darkFallback) &&
            hasContentFile(lightFallback)
        ) {
            const rawAlt = altManifest[base] || markdownAlt
            const metadata = JSON.parse(readFileSync(/* turbopackIgnore: true */ animationManifest, 'utf-8'))
            const animationData = JSON.stringify({
                kind: 'timeline',
                alt: rawAlt,
                width: metadata.width,
                height: metadata.height,
                duration: metadata.duration,
                fps: metadata.fps,
                darkGif: contentImageUrl(darkGif),
                lightGif: contentImageUrl(lightGif),
                darkFallback: contentImageUrl(darkFallback),
                lightFallback: contentImageUrl(lightFallback),
            })
            const dataAttr = `data-animated-illustration="${htmlAttribute(animationData)}"`
            return wrap ? `<figure ${dataAttr}></figure>` : `<div ${dataAttr}></div>`
        }

        // ─── Check for animated illustration (scene-based stepper) ───
        const darkManifest = join(contentDir, "illustrations", "_generated", `${base}_dark_manifest.json`)
        const lightManifest = join(contentDir, "illustrations", "_generated", `${base}_light_manifest.json`)
        if (existsSync(/* turbopackIgnore: true */ darkManifest) && existsSync(/* turbopackIgnore: true */ lightManifest)) {
            const rawAlt = altManifest[base] || markdownAlt
            // Read manifests to get scene metadata
            const darkData = JSON.parse(readFileSync(/* turbopackIgnore: true */ darkManifest, 'utf-8'))
            const lightData = JSON.parse(readFileSync(/* turbopackIgnore: true */ lightManifest, 'utf-8'))

            // Build scene image URLs for both themes
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const darkScenes = darkData.scenes.map((s: any) => {
                const scenePath = join(contentDir, "illustrations", "_generated", `${base}_scene${s.index}_dark.png`)
                return contentImageUrl(scenePath)
            })
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const lightScenes = lightData.scenes.map((s: any) => {
                const scenePath = join(contentDir, "illustrations", "_generated", `${base}_scene${s.index}_light.png`)
                return contentImageUrl(scenePath)
            })

            // Encode scene data as a JSON data attribute for the client stepper
            const sceneData = JSON.stringify({
                alt: rawAlt,
                width: darkData.width,
                height: darkData.height,
                darkScenes,
                lightScenes,
                scenes: darkData.scenes, // metadata (duration, transition, label)
            })

            // Emit a container that the MarkdownRenderer will hydrate
            const dataAttr = `data-animated-illustration="${htmlAttribute(sceneData)}"`
            return wrap ? `<figure ${dataAttr}></figure>` : `<div ${dataAttr}></div>`
        }

        // ─── Static illustration (PNG / GIF) ─────────────────────────
        const darkPath = join(contentDir, "illustrations", "_generated", `${base}_dark.png`)
        const lightPath = join(contentDir, "illustrations", "_generated", `${base}_light.png`)
        const legacyPath = join(contentDir, "illustrations", "_generated", `${base}.png`)

        const hasDark = hasContentFile(darkPath)
        const hasLight = hasContentFile(lightPath)
        const hasLegacy = hasContentFile(legacyPath)

        if (!hasDark && !hasLight && !hasLegacy) {
            console.warn(`  ⚠ Illustration not found: ${darkPath}`)
            return null
        }

        // Prefer alt text from the illustration source code (alt.json) over markdown.
        const rawAlt = altManifest[base] || markdownAlt
        const alt = htmlAttribute(rawAlt)

        // If only legacy (un-themed) exists, single image
        if (!hasDark && !hasLight && hasLegacy) {
            const src = contentImageUrl(legacyPath)
            const dimensions = pngDimensions(legacyPath)
            const sizeAttrs = dimensions
                ? ` width="${dimensions.display.w}" height="${dimensions.display.h}" data-natural-width="${dimensions.natural.w}"`
                : ''
            return wrapFigure(`<img src="${htmlAttribute(src)}" alt="${alt}" class="max-w-full"${sizeAttrs} />`, wrap)
        }

        const darkSrc = hasDark ? contentImageUrl(darkPath) : undefined
        const lightSrc = hasLight ? contentImageUrl(lightPath) : undefined
        const initialSrc = darkSrc ?? lightSrc
        if (!initialSrc) return null

        const darkDimensions = hasDark ? pngDimensions(darkPath) : null
        const lightDimensions = hasLight ? pngDimensions(lightPath) : null
        const initialDimensions = hasDark ? darkDimensions : lightDimensions
        const sizeAttrs = initialDimensions
            ? ` width="${initialDimensions.display.w}" height="${initialDimensions.display.h}" data-natural-width="${initialDimensions.natural.w}"`
            : ''
        const themeAttrs = [
            darkSrc ? `data-dark-src="${htmlAttribute(darkSrc)}"` : '',
            lightSrc ? `data-light-src="${htmlAttribute(lightSrc)}"` : '',
            darkDimensions ? `data-dark-width="${darkDimensions.display.w}" data-dark-height="${darkDimensions.display.h}" data-dark-natural-width="${darkDimensions.natural.w}"` : '',
            lightDimensions ? `data-light-width="${lightDimensions.display.w}" data-light-height="${lightDimensions.display.h}" data-light-natural-width="${lightDimensions.natural.w}"` : '',
        ].filter(Boolean).join(' ')

        return wrapFigure(
            `<img src="${htmlAttribute(initialSrc)}" alt="${alt}" class="max-w-full" data-themed-image="true" ${themeAttrs}${sizeAttrs} />`,
            wrap,
        )
    }

    function isInsideFigure(source: string, offset: number): boolean {
        const before = source.slice(0, offset).toLowerCase()
        return before.lastIndexOf("<figure") > before.lastIndexOf("</figure>")
    }

    // 1) Match markdown images: ![alt](illustrations/... .png) or ![alt](illustrations/_generated/... .png)
    let result = markdown.replace(
        /!\[([^\]]*)\]\((?:\.\/)?illustrations\/(?:_generated\/)?([^)]+\.png)\)/g,
        (match, alt: string, filename: string) => {
            const base = filename.replace(/\.png$/, '')
            const themed = buildThemedImages(base, alt)
            return themed ?? match
        }
    )

    // Match the whole tag while allowing `>` inside either quoted attribute value.
    result = result.replace(
        /<img\b(?:"[^"]*"|'[^']*'|[^'">])*>/gi,
        (match, offset: number, source: string) => {
            const rawSrc = htmlAttributeValue(match, "src")
            if (!rawSrc) return match

            const src = decodeHTMLAttribute(rawSrc)
            const sourceMatch = src.match(/^(?:\.\/)?illustrations\/(?:_generated\/)?(.+\.png)$/)
            if (!sourceMatch) return match

            // HTML attribute values have already had character references decoded by the browser.
            const rawAlt = htmlAttributeValue(match, "alt")
            const alt = rawAlt === undefined ? "Illustration" : decodeHTMLAttribute(rawAlt)
            const base = sourceMatch[1].replace(/\.png$/, "")
            const themed = buildThemedImages(base, alt, !isInsideFigure(source, offset))
            return themed ?? match
        },
    )

    return result
}

function normalizeMermaidLabel(raw: string): string {
    return raw
        .replace(/\\n/g, " ")
        .replace(/<br\s*\/?>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/&quot;/g, "\"")
        .replace(/&nbsp;/g, " ")
        .replace(/\s+/g, " ")
        .trim()
}

function uniqueMeaningfulLabels(labels: string[]): string[] {
    const seen = new Set<string>()
    const result: string[] = []

    for (const raw of labels) {
        const label = normalizeMermaidLabel(raw)
        if (!label || !/[A-Za-z]/.test(label)) {
            continue
        }

        const key = label.toLowerCase()
        if (seen.has(key)) {
            continue
        }
        seen.add(key)
        result.push(label)
    }

    return result
}

function formatLabelList(labels: string[]): string {
    if (labels.length === 1) return labels[0]
    if (labels.length === 2) return `${labels[0]} and ${labels[1]}`
    return `${labels.slice(0, -1).join(", ")}, and ${labels.at(-1)}`
}

function authoredMermaidDescription(block: string): string | undefined {
    const singleLine = block.match(/^[ \t]*accDescr[ \t]*:[ \t]*(.*)$/im)?.[1]
    if (singleLine !== undefined) {
        const description = normalizeMermaidLabel(singleLine)
        if (description) return description
    }

    const multiline = block.match(/^[ \t]*accDescr[ \t]*\{[ \t]*\r?\n?([\s\S]*?)^[ \t]*\}[ \t]*$/im)?.[1]
    if (multiline !== undefined) {
        const description = normalizeMermaidLabel(multiline)
        if (description) return description
    }

    return undefined
}

export function summarizeMermaidDiagram(block: string): string {
    const authoredDescription = authoredMermaidDescription(block)
    if (authoredDescription) return authoredDescription

    const subgraphLabels = uniqueMeaningfulLabels(
        Array.from(block.matchAll(/subgraph\s+[A-Za-z0-9_]+\s*\[\s*"([^"]+)"\s*\]/g), (match) => match[1])
    )

    const quotedLabels = uniqueMeaningfulLabels(
        Array.from(block.matchAll(/"([^"]+)"/g), (match) => match[1])
    )

    const participantLabels = uniqueMeaningfulLabels(
        Array.from(block.matchAll(/^\s*participant\s+\w+(?:\s+as\s+([^\n]+))?/gm), (match) => match[1] ?? "")
    )

    const labels = [...subgraphLabels]
    const labelLimit = isFiveStageLinearFlow(block) ? 5 : 4
    for (const label of [...quotedLabels, ...participantLabels]) {
        if (labels.length >= labelLimit) {
            break
        }
        if (!labels.includes(label)) {
            labels.push(label)
        }
    }

    if (labels.length === 0) {
        return "Diagram"
    }

    return `Diagram showing ${formatLabelList(labels)}.`
}

function isFiveStageLinearFlow(block: string): boolean {
    if (!/^\s*(?:flowchart|graph)\b/im.test(block)) return false

    const edges = Array.from(block.matchAll(/^\s*([A-Za-z][\w]*)\b[^\n]*?-->\s*([A-Za-z][\w]*)\b/gm), (match) => [match[1], match[2]] as const)
    const nodes = new Set(edges.flatMap(([from, to]) => [from, to]))
    if (nodes.size !== 5 || edges.length !== 4) return false

    const incoming = new Map<string, number>()
    const outgoing = new Map<string, string>()
    for (const [from, to] of edges) {
        if (outgoing.has(from)) return false
        outgoing.set(from, to)
        incoming.set(to, (incoming.get(to) ?? 0) + 1)
    }
    if ([...incoming.values()].some((count) => count !== 1)) return false

    const sources = [...nodes].filter((node) => !incoming.has(node))
    if (sources.length !== 1) return false

    const visited = new Set<string>()
    let node: string | undefined = sources[0]
    while (node && !visited.has(node)) {
        visited.add(node)
        node = outgoing.get(node)
    }
    return visited.size === 5 && node === undefined
}

/**
 * Resolves mermaid code fences in markdown to pre-rendered PNG images.
 * The diagram build step (tools/diagrams/build.ts) renders both
 * content_diagram_N_dark.png and content_diagram_N_light.png
 * into diagrams/_generated/. This function checks both exist and
 * replaces Mermaid fence with one theme-aware <img> using URL references.
 */
export function resolveDiagrams(markdown: string, contentDir: string, sourceFile: string, sourceMarkdown?: string): string {
    let diagramIndex = 0
    const sourceDiagrams = sourceMarkdown === undefined ? undefined : Array.from(sourceMarkdown.matchAll(/```mermaid\n([\s\S]*?)```/g), match => match[0])

    return markdown.replace(
        /```mermaid\n([\s\S]*?)```/g,
        (match) => {
            const sourceIndex = sourceDiagrams ? sourceDiagrams.indexOf(match) : diagramIndex
            if (sourceIndex < 0) throw new Error(`${sourceFile}: retained Mermaid diagram does not match its full source`)
            const baseName = sourceFile.replace(/\.md$/, '')
            const darkPath = join(contentDir, 'diagrams', '_generated', `${baseName}_diagram_${sourceIndex}_dark.png`)
            const lightPath = join(contentDir, 'diagrams', '_generated', `${baseName}_diagram_${sourceIndex}_light.png`)

            diagramIndex++

            const hasDark = hasContentFile(darkPath)
            const hasLight = hasContentFile(lightPath)

            if (!hasDark && !hasLight) {
                // No pre-rendered diagrams found — keep the original mermaid block
                // (client-side fallback or build not yet run)
                return match
            }

            const authoredDescription = authoredMermaidDescription(match)
            const diagramAlt = authoredDescription ?? summarizeMermaidDiagram(match)
            const darkSrc = hasDark ? contentImageUrl(darkPath) : undefined
            const lightSrc = hasLight ? contentImageUrl(lightPath) : undefined
            const initialSrc = darkSrc ?? lightSrc
            if (!initialSrc) return match

            const darkDimensions = hasDark ? pngDimensions(darkPath) : null
            const lightDimensions = hasLight ? pngDimensions(lightPath) : null
            const initialDimensions = hasDark ? darkDimensions : lightDimensions
            const sizeAttrs = initialDimensions
                ? ` width="${initialDimensions.display.w}" height="${initialDimensions.display.h}" data-natural-width="${initialDimensions.natural.w}"`
                : ''
            const themeAttrs = [
                darkSrc ? `data-dark-src="${htmlAttribute(darkSrc)}"` : '',
                lightSrc ? `data-light-src="${htmlAttribute(lightSrc)}"` : '',
                darkDimensions ? `data-dark-width="${darkDimensions.display.w}" data-dark-height="${darkDimensions.display.h}" data-dark-natural-width="${darkDimensions.natural.w}"` : '',
                lightDimensions ? `data-light-width="${lightDimensions.display.w}" data-light-height="${lightDimensions.display.h}" data-light-natural-width="${lightDimensions.natural.w}"` : '',
            ].filter(Boolean).join(' ')
            const autoAttr = authoredDescription ? '' : ' data-diagram-auto="true"'

            return `<figure data-diagram-alt="${htmlAttribute(diagramAlt)}"${autoAttr}>\n<img src="${htmlAttribute(initialSrc)}" alt="${htmlAttribute(diagramAlt)}" class="max-w-full" data-themed-image="true" ${themeAttrs}${sizeAttrs} />\n</figure>`
        }
    )
}

/**
 * Resolves article-local asset links to download URLs served by
 * /api/content-asset/[...path].
 *
 * Supported patterns:
 *   - Markdown links: [Download](assets/file.txt)
 *   - HTML anchors: href="assets/file.txt"
 */
export function resolveAssetLinks(markdown: string, contentDir: string): string {
    let result = markdown.replace(
        /\[([^\]]+)\]\((?:\.\/)?assets\/([^)]+)\)/g,
        (match, label: string, relativeAssetPath: string) => {
            const absolutePath = join(contentDir, "assets", relativeAssetPath)
            if (!existsSync(/* turbopackIgnore: true */ absolutePath)) {
                console.warn(`  ⚠ Asset not found: ${absolutePath}`)
                return match
            }
            return `[${label}](${contentAssetUrl(absolutePath)})`
        }
    )

    result = result.replace(
        /href="(?:\.\/)?assets\/([^"]+)"/g,
        (match, relativeAssetPath: string) => {
            const absolutePath = join(contentDir, "assets", relativeAssetPath)
            if (!existsSync(/* turbopackIgnore: true */ absolutePath)) {
                console.warn(`  ⚠ Asset not found: ${absolutePath}`)
                return match
            }
            return `href="${contentAssetUrl(absolutePath)}"`
        }
    )

    return result
}

/**
 * Convert [^key] inline citations into numbered superscript links that open
 * the corresponding source directly while carrying metadata for hover previews.
 *
 * Also strips any manually-written GFM footnote definitions ([^key]: ...)
 * from the markdown to prevent a duplicate "Footnotes" section.
 */
export function resolveReferences(
    markdown: string,
    references: Record<string, Reference>
): string {
    if (!references || Object.keys(references).length === 0) return markdown

    // First, strip GFM footnote definitions ([^key]: ...) BEFORE scanning for
    // inline citations. This prevents definitions from being counted as citations
    // and avoids a duplicate "Footnotes" section from remark-gfm.
    const cleaned = markdown.replace(/^\[\^[\w]+\]:.*$/gm, '').replace(/\n{3,}/g, '\n\n')

    // Assign a stable number to each cited key in order of first appearance.
    // We match ALL [^key] occurrences — the GFM definitions are already stripped above.
    const citedKeys: string[] = []
    const citeRegex = /\[\^(\w+)\]/g
    let match
    while ((match = citeRegex.exec(cleaned)) !== null) {
        if (!citedKeys.includes(match[1])) {
            citedKeys.push(match[1])
        }
    }

    if (citedKeys.length === 0) return cleaned

    // Replace [^key] with numbered superscript links
    const result = cleaned.replace(/\[\^(\w+)\]/g, (_full, key) => {
        const idx = citedKeys.indexOf(key)
        if (idx === -1 || !references[key]) return _full
        const ref = references[key]
        const number = idx + 1
        const label = `Open reference ${number}: ${ref.title}`

        return [
            "<sup>",
            `<a href="${htmlAttribute(ref.url)}"`,
            ` target="_blank"`,
            ` rel="noopener noreferrer"`,
            ` title="${htmlAttribute(`${ref.title} - ${ref.url}`)}"`,
            ` aria-label="${htmlAttribute(label)}"`,
            ` data-reference-link="true"`,
            ` data-reference-key="${htmlAttribute(key)}"`,
            ` data-reference-number="${number}"`,
            ` data-reference-title="${htmlAttribute(ref.title)}"`,
            ` data-reference-url="${htmlAttribute(ref.url)}">`,
            `[${number}]`,
            "</a>",
            "</sup>",
        ].join("")
    })

    return result.trimEnd() + '\n'
}

/**
 * Full content resolution pipeline: illustrations → diagrams → references.
 */
export function resolveContent(
    rawContent: string,
    contentDir: string,
    references: Record<string, Reference>,
    sourceFile: string = 'content.md',
    sourceMarkdown?: string,
): string {
    const withIllustrations = resolveIllustrations(rawContent, contentDir)
    const withDiagrams = resolveDiagrams(withIllustrations, contentDir, sourceFile, sourceMarkdown)
    const withAssets = resolveAssetLinks(withDiagrams, contentDir)
    return resolveReferences(withAssets, references)
}

/**
 * Resolve glossary-term media: illustrations + pre-rendered Mermaid under
 * `web/src/content/glossary/<entryId>/…`.
 */
export function resolveGlossaryEntryMedia(entryId: string, markdown: string): string {
    if (!markdown || !entryId) return markdown
    const contentDir = join(CONTENT_DIR, "glossary", entryId)
    const withIllustrations = resolveIllustrations(markdown, contentDir)
    return resolveDiagrams(withIllustrations, contentDir, `${entryId}.md`)
}
