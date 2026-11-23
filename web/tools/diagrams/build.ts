/**
 * LeetLLM Diagram Builder — Build Script
 *
 * Scans all content markdown files for ```mermaid``` code blocks and renders
 * them to PNG images (dark + light theme variants) using Puppeteer.
 *
 * The rendered PNGs are saved into each article's diagrams/_generated/ directory.
 * At runtime, resolveContentDiagrams() in questions.ts replaces the mermaid
 * code fences with <img> tags pointing to the pre-rendered PNGs.
 *
 * Uses hash-based caching to skip unchanged diagrams.
 *
 * Usage:
 *   npx tsx tools/diagrams/build.ts                # Render changed only
 *   npx tsx tools/diagrams/build.ts --force         # Force rebuild all
 *   npx tsx tools/diagrams/build.ts --article fundamentals/scaled-dot-product-attention
 */

import { readdir, readFile, stat, unlink } from 'fs/promises'
import { join, relative, dirname, basename } from 'path'
import { existsSync } from 'fs'
import { parseArgs } from 'node:util'
import { renderDiagram, closeBrowser, type ThemeMode } from './lib/render'
import { checkDiagramCache, type DiagramEntry } from './lib/cache'

const CONTENT_DIR = join(dirname(new URL(import.meta.url).pathname), '..', '..', 'src', 'content')
const THEMES: ThemeMode[] = ['dark', 'light']

// ─── CLI Args ────────────────────────────────────────────────────────────────

const { values: args } = parseArgs({
    options: {
        article: { type: 'string' },
        force: { type: 'boolean', default: false },
        help: { type: 'boolean', short: 'h', default: false },
    },
})
const articleFilter = args.article
const forceRebuild = args.force
const renderConcurrency = Math.max(1, Number(process.env.DIAGRAM_RENDER_CONCURRENCY || '2'))

// ─── Extract Mermaid Blocks ──────────────────────────────────────────────────

const MERMAID_RE = /```mermaid\n([\s\S]*?)```/g

interface MermaidBlock {
    content: string
    index: number
}

interface ExpectedArticleOutputs {
    articleDir: string
    filenames: Set<string>
}

function extractMermaidBlocks(markdown: string): MermaidBlock[] {
    const blocks: MermaidBlock[] = []
    let match: RegExpExecArray | null
    let index = 0

    // Reset regex state
    MERMAID_RE.lastIndex = 0

    while ((match = MERMAID_RE.exec(markdown)) !== null) {
        blocks.push({
            content: match[1].trim(),
            index: index++,
        })
    }
    return blocks
}

// ─── Find All Articles ───────────────────────────────────────────────────────

async function findArticleDirs(baseDir: string): Promise<string[]> {
    const results: string[] = []

    // Walk section folders (fundamentals/, agents/, etc.)
    const sections = await readdir(baseDir, { withFileTypes: true })
    for (const section of sections) {
        if (!section.isDirectory()) continue
        // Glossary terms are flat *.md files; handled separately in collectDiagrams.
        if (section.name === 'glossary' || section.name === 'practice') continue
        const sectionPath = join(baseDir, section.name)
        const articles = await readdir(sectionPath, { withFileTypes: true })
        for (const article of articles) {
            if (!article.isDirectory()) continue
            const articlePath = join(sectionPath, article.name)
            // Only include articles that have markdown with mermaid blocks
            results.push(articlePath)
        }
    }

    return results.sort()
}

// ─── Collect All Diagram Entries ─────────────────────────────────────────────

async function collectDiagrams(
    articleDirs: string[],
    options: { includeGlossary?: boolean; glossaryId?: string } = {},
): Promise<DiagramEntry[]> {
    const entries: DiagramEntry[] = []
    const includeGlossary = options.includeGlossary !== false

    for (const articleDir of articleDirs) {
        const relPath = relative(CONTENT_DIR, articleDir)

        for (const filename of ['content.md']) {
            const filePath = join(articleDir, filename)
            if (!existsSync(filePath)) continue

            const markdown = await readFile(filePath, 'utf-8')
            const blocks = extractMermaidBlocks(markdown)

            for (const block of blocks) {
                entries.push({
                    key: `${relPath}/${filename}#${block.index}`,
                    content: block.content,
                    articleDir,
                    index: block.index,
                    sourceFile: filename,
                })
            }
        }
    }

    // Glossary: flat web/src/content/glossary/<id>.md → PNGs under glossary/<id>/diagrams/_generated/
    const glossaryDir = join(CONTENT_DIR, 'glossary')
    if (includeGlossary && existsSync(glossaryDir)) {
        const glossaryFiles = await readdir(glossaryDir, { withFileTypes: true })
        for (const entry of glossaryFiles) {
            if (!entry.isFile() || !entry.name.endsWith('.md')) continue
            const id = basename(entry.name, '.md')
            if (options.glossaryId && options.glossaryId !== id) continue
            const filePath = join(glossaryDir, entry.name)
            const markdown = await readFile(filePath, 'utf-8')
            const blocks = extractMermaidBlocks(markdown)
            if (blocks.length === 0) continue

            const articleDir = join(glossaryDir, id)
            for (const block of blocks) {
                entries.push({
                    key: `glossary/${id}/${entry.name}#${block.index}`,
                    content: block.content,
                    articleDir,
                    index: block.index,
                    sourceFile: entry.name,
                })
            }
        }
    }

    return entries
}

async function collectExpectedOutputs(
    articleDirs: string[],
    entries: DiagramEntry[],
    options: { includeGlossary?: boolean; glossaryId?: string } = {},
): Promise<ExpectedArticleOutputs[]> {
    const byArticle = new Map<string, Set<string>>()

    for (const articleDir of articleDirs) {
        byArticle.set(articleDir, new Set())
    }

    const glossaryDir = join(CONTENT_DIR, 'glossary')
    if (options.includeGlossary !== false && existsSync(glossaryDir)) {
        for (const entry of await readdir(glossaryDir, { withFileTypes: true })) {
            if (!entry.isFile() || !entry.name.endsWith('.md')) continue
            const id = basename(entry.name, '.md')
            if (options.glossaryId && options.glossaryId !== id) continue
            byArticle.set(join(glossaryDir, id), new Set())
        }
    }

    for (const entry of entries) {
        const filenames = byArticle.get(entry.articleDir) ?? new Set<string>()
        const baseName = `${basename(entry.sourceFile, '.md')}_diagram_${entry.index}`
        for (const theme of THEMES) {
            filenames.add(`${baseName}_${theme}.png`)
        }
        byArticle.set(entry.articleDir, filenames)
    }

    return Array.from(byArticle, ([articleDir, filenames]) => ({ articleDir, filenames }))
}

async function cleanupStaleOutputs(expectedOutputs: ExpectedArticleOutputs[]): Promise<number> {
    let removed = 0

    for (const { articleDir, filenames } of expectedOutputs) {
        const outputDir = join(articleDir, 'diagrams', '_generated')
        if (!existsSync(outputDir)) continue

        const outputEntries = await readdir(outputDir, { withFileTypes: true })
        for (const entry of outputEntries) {
            if (!entry.isFile()) continue
            if (!/_diagram_\d+_(dark|light)\.png$/.test(entry.name)) continue
            if (filenames.has(entry.name)) continue

            await unlink(join(outputDir, entry.name))
            removed++
        }
    }

    return removed
}

// ─── Render a Single Diagram ─────────────────────────────────────────────────

/** Errors indicating the browser crashed and a retry should succeed */
function isBrowserCrashError(msg: string): boolean {
    return msg.includes('ConnectionClosedError') ||
           msg.includes('Connection closed') ||
           msg.includes('Protocol error') ||
           msg.includes('TargetCloseError') ||
           msg.includes('Target closed') ||
           msg.includes('Waiting failed') ||
           msg.includes('Navigation failed') ||
           msg.includes('frame was detached') ||
           msg.includes('Session closed')
}

const MAX_RETRIES = 2

async function renderDiagramEntry(entry: DiagramEntry): Promise<'ok' | 'timeout' | 'error'> {
    const relPath = relative(CONTENT_DIR, entry.articleDir)
    const outputDir = join(entry.articleDir, 'diagrams', '_generated')
    const baseName = `${basename(entry.sourceFile, '.md')}_diagram_${entry.index}`

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            for (const theme of THEMES) {
                const outputName = `${baseName}_${theme}.png`
                const outputPath = join(outputDir, outputName)
                await renderDiagram(entry.content, theme, outputPath)
            }

            console.log(`  ✓ ${relPath}/${entry.sourceFile} #${entry.index} → ${baseName}_dark.png, ${baseName}_light.png`)
            return 'ok'
        } catch (error) {
            const msg = String(error)
            const isTimeout = msg.includes('TimeoutError') || msg.includes('exceeded')
            if (isTimeout) {
                // Timeouts are warnings — cached PNGs from prior runs remain usable
                console.warn(`  ⚠ ${relPath}/${entry.sourceFile} #${entry.index} — timeout (cached PNG may still be valid)`)
                return 'timeout'
            }

            // Retry on browser crash errors — getBrowser() will auto-relaunch
            if (isBrowserCrashError(msg) && attempt < MAX_RETRIES) {
                console.warn(`  ↻ ${relPath}/${entry.sourceFile} #${entry.index} — browser crashed, retrying...`)
                // Brief pause to let the lock settle and browser relaunch
                await new Promise(r => setTimeout(r, 500))
                continue
            }

            console.error(`  ✗ ${relPath}/${entry.sourceFile} #${entry.index} — ${error}`)
            return 'error'
        }
    }
    return 'error' // unreachable, but TypeScript needs it
}

// ─── Concurrency Limiter ─────────────────────────────────────────────────────

/**
 * Run tasks with a maximum concurrency limit.
 * Processes all tasks but caps simultaneous in-flight count.
 */
async function runConcurrent<T>(tasks: (() => Promise<T>)[], concurrency: number): Promise<T[]> {
    const results: T[] = new Array(tasks.length)
    let index = 0

    async function worker() {
        while (index < tasks.length) {
            const i = index++
            results[i] = await tasks[i]()
        }
    }

    await Promise.all(Array.from({ length: Math.min(concurrency, tasks.length) }, worker))
    return results
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
    if (args.help) {
        console.log('Usage: pnpm diagrams:build [--article <section/slug>] [--force]\n\nWithout a filter, builds changed diagrams across all bundles and the glossary.\n--help, -h  Show this help without rendering or changing files.')
        return
    }
    if (articleFilter === '') {
        throw new Error('An article filter must not be empty.')
    }
    console.log('\n📊 LeetLLM Diagram Builder\n')

    let articleDirs: string[]

    let includeGlossary = true
    let glossaryId: string | undefined

    if (articleFilter) {
        if (articleFilter === 'glossary') {
            articleDirs = []
            includeGlossary = true
            console.log(`Rendering diagrams for: all glossary terms\n`)
        } else if (articleFilter.startsWith('glossary/')) {
            articleDirs = []
            includeGlossary = true
            glossaryId = articleFilter.slice('glossary/'.length)
            console.log(`Rendering diagrams for: glossary/${glossaryId}\n`)
        } else {
            const articlePath = join(CONTENT_DIR, articleFilter)
            try {
                await stat(articlePath)
                articleDirs = [articlePath]
                includeGlossary = false
            } catch {
                console.error(`Article not found: ${articlePath}`)
                process.exit(1)
            }
            console.log(`Rendering diagrams for: ${articleFilter}\n`)
        }
    } else {
        articleDirs = await findArticleDirs(CONTENT_DIR)
        includeGlossary = true
        console.log(`Scanning ${articleDirs.length} article(s) + glossary...\n`)
    }

    // Collect all mermaid blocks (lesson articles + glossary terms)
    const entries = await collectDiagrams(articleDirs, { includeGlossary, glossaryId })
    const expectedOutputs = await collectExpectedOutputs(articleDirs, entries, { includeGlossary, glossaryId })
    const removedOutputs = await cleanupStaleOutputs(expectedOutputs)

    if (entries.length === 0) {
        if (removedOutputs > 0) {
            console.log(`Removed ${removedOutputs} stale diagram PNG(s).`)
        }
        console.log('No mermaid diagrams found.')
        process.exit(0)
    }

    console.log(`Found ${entries.length} diagram(s) across all articles\n`)
    if (removedOutputs > 0) {
        console.log(`  🧹 Removed ${removedOutputs} stale diagram PNG(s)\n`)
    }

    // Cache check
    let toRender: DiagramEntry[]
    let cacheUpdater: { save: () => Promise<void> } | null = null

    if (forceRebuild) {
        toRender = entries
        console.log('  ⚠ Force rebuild — ignoring cache\n')
    } else {
        const cacheResult = await checkDiagramCache(entries, { partialRun: !!articleFilter })
        toRender = cacheResult.toRender
        cacheUpdater = cacheResult.updater

        if (cacheResult.frameworkChanged) {
            console.log('  ⚠ Renderer changed — rebuilding all diagrams')
        }

        const skipped = cacheResult.cached.length
        if (skipped > 0) {
            console.log(`  ⚡ ${skipped} diagram(s) unchanged, skipping`)
        }
        if (toRender.length === 0) {
            console.log(`\n✨ All ${entries.length} diagrams up to date — nothing to render\n`)
            await cacheUpdater.save()
            return
        }
        console.log(`  🔨 ${toRender.length} diagram(s) need rendering\n`)
    }

    let successes = 0
    let timeouts = 0
    let errors = 0

    const tasks = toRender.map(entry => () => renderDiagramEntry(entry))
    const results = await runConcurrent(tasks, renderConcurrency)
    for (const result of results) {
        if (result === 'ok') successes++
        else if (result === 'timeout') timeouts++
        else errors++
    }

    // A failed or timed-out render must not mark its new source hash current.
    // Otherwise later builds silently keep serving the old PNG for new content.
    if (cacheUpdater && errors === 0 && timeouts === 0) {
        await cacheUpdater.save()
    } else if (cacheUpdater) {
        console.warn('  ⚠ Diagram cache not updated because some renders failed or timed out.')
    }

    // Close browser
    await closeBrowser()

    console.log(`\n✨ Done: ${successes} rendered (${successes * 2} PNGs)`)
    if (timeouts > 0) {
        console.warn(`\n⚠ ${timeouts} diagram(s) timed out (cached PNGs from prior builds are still served).`)
    }
    if (errors > 0) {
        console.error(`\n❌ ${errors} diagram(s) had invalid mermaid syntax. Fix them before deploying.`)
        process.exit(1)
    }
    console.log()
}

main().then(() => {
    process.exit(0)
}).catch(async (err) => {
    console.error('Fatal error:', err)
    await closeBrowser()
    process.exit(1)
})
