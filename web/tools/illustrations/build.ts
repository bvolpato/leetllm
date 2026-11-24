/**
 * LeetLLM Illustration Framework — Build Script
 *
 * Scans for illustration source files and renders them to PNG.
 * Each illustration is rendered in both dark and light themes.
 *
 * Uses hash-based caching to skip unchanged illustrations.
 * Framework file changes (lib/*.ts) trigger a full rebuild.
 *
 * Usage:
 *   npx tsx tools/illustrations/build.ts                           # Render changed only
 *   npx tsx tools/illustrations/build.ts --force                   # Force rebuild all
 *   npx tsx tools/illustrations/build.ts --article fundamentals/scaled-dot-product-attention
 *   npx tsx tools/illustrations/build.ts --file path/to/illustration.tsx
 */

import { readdir, stat, writeFile, readFile, mkdir, unlink, rename, rm } from 'fs/promises'
import { join, relative, dirname, basename, resolve } from 'path'
import { existsSync } from 'fs'
import { parseArgs } from 'node:util'
import { spawn } from 'node:child_process'
import { availableParallelism, tmpdir } from 'node:os'
import { mkdtemp } from 'fs/promises'
import sharp from 'sharp'
import {
    renderAnimationGif,
    renderToPng,
    sampleAnimationFrames,
    type DefinedAnimation,
    type ThemeMode,
    type WatermarkInput,
} from 'vizmatic'
import { captionsToVtt, renderFilmVideo } from 'vizmatic/stage/export'
import type { FilmDefinition } from 'vizmatic/stage'
import { checkCache } from './lib/cache'
import { findIllustrationEntries, isIllustrationEntry } from './discovery'
import { parseEmbeddedIllustrationBlocks } from './embedded'
import { getLeetLLMWatermark } from './lib/watermark'
import { prepareArticleFigure } from './lib/presentation'

const CONTENT_DIR = join(dirname(new URL(import.meta.url).pathname), '..', '..', 'src', 'content')

// ─── CLI Args ────────────────────────────────────────────────────────────────

const { values: args } = parseArgs({
    options: {
        article: { type: 'string' },
        file: { type: 'string' },
        force: { type: 'boolean', default: false },
        output: { type: 'string' },
        watermark: { type: 'boolean', default: false },
        'no-watermark': { type: 'boolean', default: false },
        'no-title': { type: 'boolean', default: true },
        'worker-list': { type: 'string' },
        'worker-result': { type: 'string' },
        help: { type: 'boolean', short: 'h', default: false },
    },
})
const articleFilter = args.article
const fileFilter = args.file
const forceRebuild = args.force
const outputRoot = args.output ? resolve(args.output) : undefined
const workerListPath = args['worker-list']
const workerResultPath = args['worker-result']

async function renderToPngAtomic(
    element: Parameters<typeof renderToPng>[0],
    options: Parameters<typeof renderToPng>[1],
    transparentCreateFn?: Parameters<typeof renderToPng>[2],
    theme?: Parameters<typeof renderToPng>[3],
) {
    const finalPath = options.outputPath
    if (!finalPath) {
        return renderToPng(element, options, transparentCreateFn, theme)
    }
    const tmpPath = `${finalPath}.tmp.${process.pid}.${Math.random().toString(36).slice(2, 8)}.png`
    await mkdir(dirname(finalPath), { recursive: true })
    try {
        await renderToPng(element, { ...options, outputPath: tmpPath }, transparentCreateFn, theme)
        const rawPng = await readFile(tmpPath)
        const optimizedPng = await sharp(rawPng)
            .png({ compressionLevel: 9, adaptiveFiltering: true, effort: 8 })
            .toBuffer()
        if (optimizedPng.byteLength < rawPng.byteLength) {
            await writeFile(tmpPath, optimizedPng)
        }
        await rename(tmpPath, finalPath)
    } catch (error) {
        await unlink(tmpPath).catch(() => undefined)
        throw error
    }
}

function outputDirectory(file: string): string {
    const sourceDirectory = relative(CONTENT_DIR, resolve(dirname(file)))
    if (sourceDirectory.startsWith('..')) throw new Error('Figure must be inside src/content.')
    return outputRoot
        ? join(outputRoot, sourceDirectory, '_generated')
        : join(dirname(file), '_generated')
}

// ─── Find Illustration Files ─────────────────────────────────────────────────

async function findContentFiles(baseDir: string): Promise<string[]> {
    const results: string[] = []

    async function walk(dir: string) {
        try {
            const entries = await readdir(dir, { withFileTypes: true })
            for (const entry of entries) {
                const fullPath = join(dir, entry.name)
                if (entry.isDirectory()) {
                    if (entry.name === '_generated' || entry.name === 'node_modules') continue
                    await walk(fullPath)
                } else if (entry.name === 'content.md') {
                    results.push(fullPath)
                }
            }
        } catch {
            // Skip unreadable directories
        }
    }

    await walk(baseDir)
    return results.sort()
}

async function prepareEmbeddedIllustrationFiles(
    baseDir: string,
    existingFiles: Set<string>,
): Promise<string[]> {
    const tempFiles: string[] = []

    for (const contentPath of await findContentFiles(baseDir)) {
        const markdown = await readFile(contentPath, 'utf-8')
        const blocks = parseEmbeddedIllustrationBlocks(markdown, contentPath)
        if (blocks.length === 0) continue

        const illustrationDir = join(dirname(contentPath), 'illustrations')
        await mkdir(illustrationDir, { recursive: true })

        for (const block of blocks) {
            const filePath = join(illustrationDir, `${block.name}.tsx`)
            if (existingFiles.has(filePath)) continue

            let source = block.source
            if (block.alt && !/\bexport\s+const\s+alt\b/.test(source)) {
                source = `export const alt = ${JSON.stringify(block.alt)}\n${source}`
            }

            await writeFile(filePath, `${source.trim()}\n`)
            tempFiles.push(filePath)
            existingFiles.add(filePath)
        }
    }

    return tempFiles
}

async function removeTempFiles(files: string[]) {
    await Promise.all(files.map((file) => unlink(file).catch(() => undefined)))
}

// ─── Render Single Illustration ──────────────────────────────────────────────

const THEMES: ThemeMode[] = ['dark', 'light']

function resolveWatermark(
    watermark: WatermarkInput | undefined,
    theme: ThemeMode,
): WatermarkInput | undefined {
    if (
        args['no-watermark'] ||
        !args.watermark ||
        process.env.NO_WATERMARK === '1' ||
        process.env.BOOK_BUILD === '1' ||
        watermark === false
    ) {
        return undefined
    }
    if (watermark === undefined || watermark === true) return getLeetLLMWatermark(theme)
    return watermark
}

// Tracks alt text extracted from each illustration module, keyed by output dir.
const altTextMap = new Map<string, Record<string, string>>()
// Tracks the currently valid illustration base names per output dir when the run
// scope fully enumerates an article or the whole content tree.
const currentIllustrationKeys = new Map<string, Set<string>>()

async function renderIllustration(filePath: string): Promise<boolean> {
    const relPath = relative(CONTENT_DIR, filePath)
    const outputDir = outputDirectory(filePath)
    const baseName = basename(filePath, '.tsx')

    try {
        // Dynamic import of the illustration module
        const rawMod = await import(filePath)
        const defaultMod = rawMod.default
        const usesDefaultModule =
            rawMod.default &&
            typeof rawMod.default === 'object' &&
            ('default' in rawMod.default ||
                'create' in rawMod.default ||
                'width' in rawMod.default ||
                'height' in rawMod.default)
        const mod = usesDefaultModule ? { ...rawMod, ...defaultMod } : rawMod

        const width = mod.width || 800
        const height = mod.height || 500
        const watermark = mod.watermark as WatermarkInput | undefined
        const opaqueBackground = mod.opaqueBackground === true
        const animations = new Map<ThemeMode, DefinedAnimation<object>>()
        const hasTimelineAnimation = typeof mod.createAnimation === 'function'
        const hasFilm = typeof mod.createFilm === 'function'

        if (hasFilm && (hasTimelineAnimation || typeof mod.createScenes === 'function')) {
            throw new Error(
                'Choose createFilm, createAnimation, or createScenes for one illustration.',
            )
        }
        if (hasFilm && typeof mod.create !== 'function') {
            throw new Error('A film needs create(theme) for its static reading and print fallback.')
        }
        if (!hasFilm) {
            await Promise.all(
                [
                    join(outputDir, `${baseName}_film.json`),
                    ...THEMES.flatMap((theme) => [
                        join(outputDir, `${baseName}_${theme}.mp4`),
                        join(outputDir, `${baseName}_${theme}.vtt`),
                    ]),
                ].map((path) => unlink(path).catch(() => undefined)),
            )
        }

        if (!hasTimelineAnimation) {
            await Promise.all(
                [
                    join(outputDir, `${baseName}_animation.json`),
                    join(outputDir, `${baseName}_dark.gif`),
                    join(outputDir, `${baseName}_light.gif`),
                ].map((path) => unlink(path).catch(() => undefined)),
            )
        }

        // Extract alt text for accessibility
        if (mod.alt && typeof mod.alt === 'string') {
            const existing = altTextMap.get(outputDir) || {}
            existing[baseName] = mod.alt
            altTextMap.set(outputDir, existing)
        } else {
            console.warn(`  ⚠ ${relPath} — missing 'export const alt' (accessibility)`)
        }

        // ─── Animated illustrations (scene-based stepper) ─────────────────
        if (mod.createScenes && typeof mod.createScenes === 'function') {
            for (const theme of THEMES) {
                const scenes = mod.createScenes(theme)
                console.log(`  🎬 ${relPath} [${theme}] — ${scenes.length} scene(s)`)

                // Render each scene as a separate PNG
                for (let i = 0; i < scenes.length; i++) {
                    const scene = scenes[i]
                    const outputPath = join(outputDir, `${baseName}_scene${i}_${theme}.png`)
                    const renderOptions = {
                        width,
                        height,
                        outputPath,
                        watermark: resolveWatermark(watermark, theme),
                        background: opaqueBackground ? 'theme' : 'transparent',
                        crop: 'both',
                    } satisfies Parameters<typeof renderToPng>[1]
                    await renderToPngAtomic(
                        prepareArticleFigure(
                            scene.element,
                            opaqueBackground,
                            args['no-title'] ?? true,
                        ),
                        renderOptions,
                    )
                }

                // Write manifest with scene metadata for the client stepper
                const manifest = {
                    baseName,
                    width,
                    height,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    scenes: scenes.map((s: any, i: number) => ({
                        index: i,
                        duration: s.duration,
                        transition: s.transition ?? 'none',
                        transitionDuration: s.transitionDuration ?? 400,
                        label: s.label,
                    })),
                }
                const manifestPath = join(outputDir, `${baseName}_${theme}_manifest.json`)
                const { writeFile, mkdir } = await import('fs/promises')
                await mkdir(dirname(manifestPath), { recursive: true })
                await writeFile(manifestPath, JSON.stringify(manifest, null, 2))
            }

            console.log(
                `  ✓ ${relPath} → ${baseName}_scene*_dark.png, ${baseName}_scene*_light.png`,
            )
            return true
        }

        // Stage films keep real video controls and the authored static figure.
        if (hasFilm) {
            let metadata:
                { width: number; height: number; duration: number; fps: number } | undefined
            for (const theme of THEMES) {
                const definition = (await mod.createFilm(theme)) as FilmDefinition
                const compiled = await definition.compile()
                const dimensions = {
                    width: compiled.width,
                    height: compiled.height,
                    duration: compiled.duration * 1000,
                    fps: compiled.fps,
                }
                if (metadata && JSON.stringify(metadata) !== JSON.stringify(dimensions)) {
                    throw new Error('Dark and light films must share dimensions and timing.')
                }
                metadata = dimensions
                await renderFilmVideo(compiled, join(outputDir, `${baseName}_${theme}.mp4`), {
                    width: 1280,
                    quality: 'high',
                    motionBlur: 1,
                    workers: 2,
                    threads: 2,
                    memoryBudget: 256 * 1024 * 1024,
                })
                await writeFile(
                    join(outputDir, `${baseName}_${theme}.vtt`),
                    captionsToVtt(compiled),
                )
            }
            await writeFile(
                join(outputDir, `${baseName}_film.json`),
                JSON.stringify(metadata, null, 2) + '\n',
            )
            console.log(`  🎞 ${relPath} → ${baseName}_dark.mp4, ${baseName}_light.mp4`)
        }

        // ─── Timeline animations (GIF + static PNG fallback) ─────────────
        if (hasTimelineAnimation) {
            let duration = 0
            let fps = 0

            for (const theme of THEMES) {
                const animation = mod.createAnimation(theme) as DefinedAnimation<object>
                animations.set(theme, animation)
                duration = animation.duration
                fps = animation.fps

                const outputPath = join(outputDir, `${baseName}_${theme}.gif`)
                await renderAnimationGif(animation, {
                    width,
                    height,
                    outputPath,
                    watermark: resolveWatermark(watermark, theme),
                    background: 'theme',
                    theme,
                    fps: animation.fps,
                })
            }

            await mkdir(outputDir, { recursive: true })
            await writeFile(
                join(outputDir, `${baseName}_animation.json`),
                JSON.stringify({ baseName, width, height, duration, fps }, null, 2) + '\n',
            )
            console.log(`  🎞 ${relPath} → ${baseName}_dark.gif, ${baseName}_light.gif`)
        }

        // ─── Static illustrations (PNG) ──────────────────────────────
        const createFn = mod.create || null
        const staticElement = mod.default || null

        if (!createFn && !staticElement && animations.size === 0) {
            console.error(
                `  ✗ ${relPath} — no create(), createAnimation(), createScenes(), or default export`,
            )
            return false
        }

        for (const theme of THEMES) {
            const outputName = `${baseName}_${theme}.png`
            const outputPath = join(outputDir, outputName)

            const animation = animations.get(theme)
            const finalFrame = animation ? sampleAnimationFrames(animation).at(-1) : undefined
            const element = createFn
                ? createFn(theme)
                : finalFrame
                  ? animation!.render(finalFrame.state, finalFrame.frame)
                  : staticElement
            const transparentCreateFn = createFn
                ? (renderTheme: ThemeMode) =>
                      prepareArticleFigure(
                          createFn(renderTheme),
                          opaqueBackground,
                          args['no-title'] ?? true,
                      )
                : undefined
            const renderOptions = {
                width,
                height,
                outputPath,
                watermark: resolveWatermark(watermark, theme),
                background: opaqueBackground ? 'theme' : 'transparent',
                crop: 'both',
            } satisfies Parameters<typeof renderToPng>[1]
            await renderToPngAtomic(
                prepareArticleFigure(element, opaqueBackground, args['no-title'] ?? true),
                renderOptions,
                transparentCreateFn || undefined,
                theme,
            )
        }

        console.log(`  ✓ ${relPath} → ${baseName}_dark.png, ${baseName}_light.png`)
        return true
    } catch (error) {
        console.error(`  ✗ ${relPath} — ${error}`)
        return false
    }
}

/**
 * Writes _generated/alt.json for each article that has illustrations.
 * Merges with any existing alt.json so that cached (un-rebuilt) illustrations
 * keep their alt text even when only a subset is re-rendered.
 */
async function writeAltManifests() {
    for (const [outputDir, newEntries] of altTextMap) {
        await mkdir(outputDir, { recursive: true })
        const altPath = join(outputDir, 'alt.json')

        // Merge with existing manifest
        let existing: Record<string, string> = {}
        if (existsSync(altPath)) {
            try {
                existing = JSON.parse(await readFile(altPath, 'utf-8'))
            } catch {
                /* ignore parse errors */
            }
        }

        const validKeys = currentIllustrationKeys.get(outputDir)
        const prunedExisting = validKeys
            ? Object.fromEntries(Object.entries(existing).filter(([key]) => validKeys.has(key)))
            : existing

        const merged = { ...prunedExisting, ...newEntries }
        await writeFile(altPath, JSON.stringify(merged, null, 2) + '\n')
    }
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

interface WorkerResult {
    built: string[]
    failed: number
    altEntries: Array<[string, Record<string, string>]>
}

async function runMultiProcessBuild(
    filesToBuild: string[],
    workerCount: number,
): Promise<{
    built: string[]
    failed: number
    altEntries: Array<[string, Record<string, string>]>
}> {
    const shards: string[][] = Array.from({ length: workerCount }, () => [])
    filesToBuild.forEach((file, index) => {
        shards[index % workerCount].push(file)
    })

    const activeShards = shards.filter((shard) => shard.length > 0)
    const tempDir = await mkdtemp(join(tmpdir(), 'leetllm-illustrations-'))
    const scriptPath = new URL(import.meta.url).pathname

    const forwardedFlags: string[] = []
    if (outputRoot) forwardedFlags.push('--output', outputRoot)
    if (args.watermark) forwardedFlags.push('--watermark')
    if (args['no-watermark']) forwardedFlags.push('--no-watermark')
    if (args['no-title'] === false) forwardedFlags.push('--no-title=false')

    try {
        const results = await Promise.all(
            activeShards.map(async (shard, index): Promise<WorkerResult> => {
                const listFile = join(tempDir, `shard-${index}.json`)
                const resultFile = join(tempDir, `result-${index}.json`)
                await writeFile(listFile, JSON.stringify(shard))

                await new Promise<void>((resolvePromise, rejectPromise) => {
                    const child = spawn(
                        process.execPath,
                        [
                            ...process.execArgv,
                            scriptPath,
                            ...forwardedFlags,
                            '--worker-list',
                            listFile,
                            '--worker-result',
                            resultFile,
                        ],
                        { stdio: 'inherit', env: process.env },
                    )
                    child.on('error', rejectPromise)
                    child.on('exit', (code) => {
                        if (code === 0 || existsSync(resultFile)) {
                            resolvePromise()
                        } else {
                            rejectPromise(
                                new Error(`Illustration worker ${index} exited with code ${code}`),
                            )
                        }
                    })
                })

                return JSON.parse(await readFile(resultFile, 'utf-8')) as WorkerResult
            }),
        )

        const built: string[] = []
        let failed = 0
        const altEntries: Array<[string, Record<string, string>]> = []
        for (const result of results) {
            built.push(...result.built)
            failed += result.failed
            altEntries.push(...result.altEntries)
        }
        return { built, failed, altEntries }
    } finally {
        await rm(tempDir, { recursive: true, force: true }).catch(() => undefined)
    }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
    if (workerListPath && workerResultPath) {
        const shardFiles = JSON.parse(await readFile(workerListPath, 'utf-8')) as string[]
        const built: string[] = []
        let failed = 0
        for (const file of shardFiles) {
            const ok = await renderIllustration(file)
            if (ok) built.push(file)
            else failed++
        }
        const payload: WorkerResult = {
            built,
            failed,
            altEntries: Array.from(altTextMap.entries()),
        }
        await writeFile(workerResultPath, JSON.stringify(payload))
        if (failed > 0) process.exitCode = 1
        return
    }

    if (args.help) {
        console.log(
            'Usage: pnpm illustrations:build [--article <section/slug> | --file <path>] [--force] [--output <directory>]\n\n--output writes an isolated tree and bypasses the normal cache.\nWithout a filter, builds changed illustrations across all bundles.\n--help, -h  Show this help without rendering or changing files.',
        )
        return
    }
    if (articleFilter !== undefined && fileFilter !== undefined) {
        throw new Error('Use either --article or --file, not both.')
    }
    if (articleFilter === '' || fileFilter === '') {
        throw new Error('A build filter must not be empty.')
    }
    console.log('\n🎨 LeetLLM Illustration Builder\n')

    let files: string[]
    let useCache = !forceRebuild && !outputRoot
    let tempEmbeddedFiles: string[] = []

    try {
        if (fileFilter) {
            // Render a single specific file — always render, no cache check
            if (!isIllustrationEntry(fileFilter))
                throw new Error('--file must name an illustration entry, not an _parts helper.')
            files = [resolve(fileFilter)]
            useCache = false
            console.log(`Rendering single file: ${fileFilter}\n`)
        } else if (articleFilter) {
            // Render illustrations for a specific article.
            const articleDir = join(CONTENT_DIR, articleFilter)
            try {
                await stat(articleDir)
            } catch {
                console.error(`No article directory found at: ${articleDir}`)
                process.exitCode = 1
                return
            }

            files = await findIllustrationEntries(articleDir)
            tempEmbeddedFiles = await prepareEmbeddedIllustrationFiles(articleDir, new Set(files))
            files = [...files, ...tempEmbeddedFiles].sort()
            console.log(`Rendering illustrations for: ${articleFilter}\n`)
        } else {
            // Render all illustrations.
            files = await findIllustrationEntries(CONTENT_DIR)
            tempEmbeddedFiles = await prepareEmbeddedIllustrationFiles(CONTENT_DIR, new Set(files))
            files = [...files, ...tempEmbeddedFiles].sort()
            console.log(`Found ${files.length} illustration(s) across all articles\n`)
        }

        if (files.length === 0) {
            console.log('No illustration files found.')
            console.log('Create .tsx files in web/src/content/{section}/{article}/illustrations/')
            return
        }

        if (!fileFilter) {
            for (const file of files) {
                const outputDir = outputDirectory(file)
                const baseName = basename(file, '.tsx')
                const keys = currentIllustrationKeys.get(outputDir) || new Set<string>()
                keys.add(baseName)
                currentIllustrationKeys.set(outputDir, keys)
            }
        }

        // ─── Cache check ─────────────────────────────────────────────────────────
        let filesToBuild: string[]
        let cacheUpdater: Awaited<ReturnType<typeof checkCache>>['updater'] | null = null

        if (useCache) {
            const isPartialRun = !!(articleFilter || fileFilter)
            const cacheResult = await checkCache(files, { partialRun: isPartialRun })
            filesToBuild = cacheResult.filesToBuild
            cacheUpdater = cacheResult.updater

            const skipped = files.length - filesToBuild.length
            if (skipped > 0) {
                console.log(`  ⚡ ${skipped} illustration(s) unchanged, skipping`)
            }
            if (filesToBuild.length === 0) {
                console.log(
                    `\n✨ All ${files.length} illustrations up to date — nothing to render\n`,
                )
                await cacheUpdater.save()
                return
            }
            console.log(`  🔨 ${filesToBuild.length} illustration(s) need rendering\n`)
        } else {
            filesToBuild = files
            if (forceRebuild) console.log('  ⚠ Force rebuild — ignoring cache\n')
        }

        let successes = 0
        let failures = 0

        const requestedWorkers = Number(process.env.ILLUSTRATION_WORKERS || '0')
        const defaultWorkers = Math.min(Math.max(1, availableParallelism() - 1), 6)
        const workerCount = requestedWorkers > 0 ? requestedWorkers : defaultWorkers

        if (workerCount > 1 && filesToBuild.length >= 16) {
            console.log(`  ⚡ Fanning out across ${workerCount} worker processes\n`)
            const workerSummary = await runMultiProcessBuild(filesToBuild, workerCount)
            for (const file of workerSummary.built) {
                cacheUpdater?.markBuilt(file)
            }
            for (const [outputDir, entries] of workerSummary.altEntries) {
                const existing = altTextMap.get(outputDir) || {}
                altTextMap.set(outputDir, { ...existing, ...entries })
            }
            successes = workerSummary.built.length
            failures = workerSummary.failed
        } else {
            // Small batches run in-process to avoid worker startup overhead.
            const CONCURRENCY = 4
            const tasks = filesToBuild.map((file) => async () => {
                const success = await renderIllustration(file)
                if (success) cacheUpdater?.markBuilt(file)
                return success
            })
            const results = await runConcurrent(tasks, CONCURRENCY)
            for (const ok of results) {
                if (ok) successes++
                else failures++
            }
        }

        // Write alt text manifests for accessibility
        await writeAltManifests()

        // Save cache (even on partial failure — successful ones are still cached)
        if (cacheUpdater) {
            await cacheUpdater.save()
        }

        console.log(
            `\n✨ Done: ${successes} rendered (${successes * 2} PNGs), ${failures} failed\n`,
        )
        if (failures > 0) process.exitCode = 1
    } finally {
        await removeTempFiles(tempEmbeddedFiles)
    }
}

main().catch((err) => {
    console.error('Fatal error:', err)
    process.exit(1)
})
