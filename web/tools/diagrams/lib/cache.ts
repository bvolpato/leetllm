/**
 * Diagram Build Cache
 *
 * Tracks content hashes for mermaid diagram blocks extracted from .md files.
 * Only re-renders diagrams whose content has changed.
 *
 * Cache key per diagram = hash(mermaid definition string)
 * Framework hash = hash(all lib/*.ts files concatenated)
 *
 * If the framework hash changes, ALL diagrams are rebuilt.
 * If only a diagram block changed, only that one is rebuilt.
 */

import { readFile, writeFile, mkdir, readdir } from 'fs/promises'
import { existsSync } from 'fs'
import { createHash } from 'crypto'
import { join, dirname, basename } from 'path'

const CACHE_DIR = join(dirname(new URL(import.meta.url).pathname), '..', '.cache')
const CACHE_FILE = join(CACHE_DIR, 'diagrams.json')

interface CacheManifest {
    /** Hash of all framework lib files — if this changes, rebuild everything */
    frameworkHash: string
    /** Per-diagram hash: "articleSlug/index" → contentHash */
    diagrams: Record<string, string>
}

export function hashContent(content: string): string {
    return createHash('sha256').update(content).digest('hex').slice(0, 16)
}

/**
 * Compute a combined hash of all framework files (lib/*.ts).
 * Any change to render.ts, cache.ts, etc. forces a full rebuild.
 */
async function computeFrameworkHash(): Promise<string> {
    const libDir = dirname(new URL(import.meta.url).pathname)
    const entries = await readdir(libDir)
    const tsFiles = entries.filter((f) => f.endsWith('.ts')).sort()

    const contents: string[] = []
    for (const file of tsFiles) {
        const content = await readFile(join(libDir, file), 'utf-8')
        contents.push(`--- ${file} ---\n${content}`)
    }

    const packageJson = JSON.parse(await readFile(join(libDir, '..', '..', '..', 'package.json'), 'utf-8'))
    contents.push(JSON.stringify({ mermaid: packageJson.dependencies.mermaid, katex: packageJson.dependencies.katex }))

    return hashContent(contents.join('\n'))
}

async function loadCache(): Promise<CacheManifest> {
    try {
        const raw = await readFile(CACHE_FILE, 'utf-8')
        return JSON.parse(raw) as CacheManifest
    } catch {
        return { frameworkHash: '', diagrams: {} }
    }
}

async function saveCache(manifest: CacheManifest): Promise<void> {
    await mkdir(CACHE_DIR, { recursive: true })
    await writeFile(CACHE_FILE, JSON.stringify(manifest, null, 2) + '\n')
}

export interface DiagramEntry {
    /** Unique key for the diagram, e.g., "fundamentals/attention/content.md#0" */
    key: string
    /** Raw mermaid definition */
    content: string
    /** Directory of the article (for output path) */
    articleDir: string
    /** Index of this diagram within the markdown file */
    index: number
    /** Source file path (content.md) */
    sourceFile: string
}

/** Check if the output PNGs for a diagram entry actually exist on disk */
function outputFilesExist(entry: DiagramEntry): boolean {
    const outputDir = join(entry.articleDir, 'diagrams', '_generated')
    const baseName = `${basename(entry.sourceFile, '.md')}_diagram_${entry.index}`
    const darkPath = join(outputDir, `${baseName}_dark.png`)
    const lightPath = join(outputDir, `${baseName}_light.png`)
    return existsSync(darkPath) && existsSync(lightPath)
}

export async function checkDiagramCache(entries: DiagramEntry[], opts?: { partialRun?: boolean }): Promise<{
    toRender: DiagramEntry[]
    cached: DiagramEntry[]
    frameworkChanged: boolean
    updater: { save: () => Promise<void> }
}> {
    const [cache, frameworkHash] = await Promise.all([
        loadCache(),
        computeFrameworkHash(),
    ])

    const frameworkChanged = cache.frameworkHash !== frameworkHash
    // Preserve untouched entries only if they were rendered with this framework.
    const newManifest: CacheManifest = {
        frameworkHash,
        diagrams: opts?.partialRun && !frameworkChanged ? { ...cache.diagrams } : {},
    }

    const toRender: DiagramEntry[] = []
    const cached: DiagramEntry[] = []

    for (const entry of entries) {
        const contentHash = hashContent(entry.content)
        newManifest.diagrams[entry.key] = contentHash

        // Cache hit only if:
        //   1. Framework hasn't changed
        //   2. Content hash matches
        //   3. Output PNGs exist on disk
        if (!frameworkChanged && cache.diagrams[entry.key] === contentHash && outputFilesExist(entry)) {
            cached.push(entry)
        } else {
            toRender.push(entry)
        }
    }

    return {
        toRender,
        cached,
        frameworkChanged,
        updater: {
            async save() {
                await saveCache(newManifest)
            },
        },
    }
}
