import { createHash } from 'node:crypto'
import { homedir } from 'node:os'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { mkdir, readdir, readFile, unlink, writeFile } from 'node:fs/promises'
import { basename, dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import React, {
    cloneElement,
    isValidElement,
    type CSSProperties,
    type ReactElement,
    type ReactNode,
} from 'react'
import * as vizmatic from 'vizmatic'
import { parseEmbeddedIllustrationBlocks } from './embedded'
import { loadContentBundle } from '../../src/lib/content-bundle'
import { filterContentForAudience, type ContentEdition } from '../../src/lib/content-audience'
import { Resvg } from '@resvg/resvg-js'
import { prepareSvgForPrint } from './lib/svg-print'
import {
    BOOK_LABEL_TARGET_PT,
    BOOK_SMALLEST_LABEL_PT,
    bookDisplayScale,
    figureLabelStats,
    minimumBookLabelPixels,
    preparePrintTypography,
    textCollisions,
    type FigureLabelStats,
} from './lib/print-typography'

const WEB_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const CONTENT_DIR = join(WEB_DIR, 'src/content')
const OUTPUT_DIR = resolve(WEB_DIR, '../build/book/illustrations')
const OVERRIDE_DIR = join(WEB_DIR, 'tools/book/figures')

interface ReviewedCaptionBand {
    headings?: string[]
    notes: string[]
}

// Reviewed annotation bands only. These exceptions do not change treatment of
// arbitrary monospace labels or text attached to positioned diagram nodes.
const REVIEWED_CAPTION_BANDS: Record<string, ReviewedCaptionBand> = {
    'fundamentals/tokenization-bpe-wordpiece-sentencepiece/bpe_merge_steps': {
        headings: ['Inference Contract'],
        notes: [],
    },
    'fundamentals/tokenization-bpe-wordpiece-sentencepiece/normalization_pipeline': {
        headings: ['Production Policy: Normalization is Part of the Checkpoint Contract'],
        notes: [
            'Pin normalization logic inside the tokenizer configuration. Never apply arbitrary external Unicode normalization steps.',
            'Equal visible text does not imply equal code points. Keep one configured normalizer on every request path.',
        ],
    },
    'training/constitutional-ai-automated-red-teaming/safety_metric_dashboard': {
        headings: ['Audit Principle: Slices Reveal What Aggregate Metrics Obscure'],
        notes: [
            'Small slice counts need broader testing. False refusal is one utility failure; a baseline is needed to attribute loss to alignment.',
        ],
    },
    'agents/agent-memory-persistence-patterns/retrieval_score_tradeoff': {
        notes: [
            'At two half-lives, B has 25% of its initial recency signal. Age does not establish whether its content is still valid.',
        ],
    },
    'llmops/responsible-ai-governance-ethics-compliance/agent_audit_evidence_chain': {
        headings: ['Rewriting the log changes its head, not the protected anchor'],
        notes: [
            "Prefixes shown; verification compares full hashes. A protected anchor exposes rewrites, but doesn't prove the events were true.",
        ],
    },
}

// These authored captions and their adjacent explanations already cover all
// removed annotation bands. Appending them again obscures the figure's point.
const REVIEWED_CAPTION_NOTES: Record<string, string[]> = {
    'fundamentals/tokenization-bpe-wordpiece-sentencepiece/normalization_pipeline': [],
    'fundamentals/inference-mechanics-ttft-tps-kv-cache/latency_breakdown': [],
    'training/instruction-tuning-chat-templates/chat_structure': [],
    'training/instruction-tuning-chat-templates/instruction_tuning': [],
    'training/reward-modeling-from-preference-data/reward_modeling': [],
    'system-design/design-conversational-ai-support-bot/guardrail_pipeline': [],
    'system-design/design-conversational-ai-support-bot/escalation_state': [],
    'retrieval/vector-database-internals-hnsw-ivf/vector_db_internals': [],
    'retrieval/vector-database-internals-hnsw-ivf/scatter_gather_topk': [],
    'llmops/data-labeling-human-feedback-active-learning/data_labeling_active_learning': [],
    'fundamentals/model-parallelism-for-llm-inference/pipeline_bubbles': [],
    'fundamentals/model-parallelism-for-llm-inference/serving_capacity': [],
}

export interface BookIllustration {
    path: string
    notes: string[]
    /** Printed width, which keeps labels at one size across the book. */
    widthPt?: number
    /** The smallest fraction of that width the layout may use to fit a page. */
    shrink?: number
}

interface BookManifest {
    fingerprint: string
    images: Record<
        string,
        {
            notes: string[]
            minimumLabelPt?: number
            svg?: string
            widthPt?: number
            shrink?: number
        }
    >
}

// Keep a small gutter. The figure margin in the page layout supplies the rest.
const SVG_CROP_PADDING = 6
const SVG_HEIGHT_CROP_PERCENT = 10

function measureSvg(svg: string, width: number): vizmatic.CropRegion {
    const raster = new Resvg(svg, {
        fitTo: { mode: 'width', value: width },
        background: 'rgba(0, 0, 0, 0)',
    }).render()
    const pixels = new Uint8Array(raster.pixels.buffer)
    return vizmatic.detectContentBounds(
        pixels,
        raster.width,
        raster.height,
        vizmatic.detectBackgroundColor(pixels),
        SVG_CROP_PADDING,
    )
}

function setSvgViewport(
    svg: string,
    region: vizmatic.CropRegion,
): { svg: string; width: number; height: number } {
    const x = Math.max(0, Math.floor(region.x))
    const y = Math.max(0, Math.floor(region.y))
    const width = Math.max(1, Math.ceil(region.width))
    const height = Math.max(1, Math.ceil(region.height))
    const setAttribute = (attributes: string, name: string, value: string) => {
        const pattern = new RegExp(`\\s${name}="[^"]*"`)
        return pattern.test(attributes)
            ? attributes.replace(pattern, ` ${name}="${value}"`)
            : `${attributes} ${name}="${value}"`
    }
    return {
        svg: svg.replace(
            /^<svg\b([^>]*)>/,
            (_match, attributes: string) =>
                `<svg${setAttribute(setAttribute(setAttribute(attributes, 'width', String(width)), 'height', String(height)), 'viewBox', `${x} ${y} ${width} ${height}`)}>`,
        ),
        width,
        height,
    }
}

/**
 * Render a tightly cropped vector figure. This follows the same two steps as the
 * PNG renderer: re-layout when much of the height is blank, then crop the viewport
 * without another layout, because a narrower canvas can rewrap text.
 */
async function renderPrintSvg(
    element: ReactNode,
    width: number,
    height: number,
): Promise<{
    svg: string
    width: number
    height: number
    stats: FigureLabelStats
    collisions: string[]
}> {
    const render = async (targetHeight: number) => {
        const nodes: vizmatic.SatoriNode[] = []
        const svg = await vizmatic.renderToSvg(element, width, targetHeight, {
            background: 'transparent',
            theme: 'light',
            watermark: false,
            onNodeDetected: (node) => nodes.push(node),
        })
        return { svg, nodes, bounds: measureSvg(svg, width) }
    }
    let result = await render(height)
    const croppedHeight = Math.ceil(result.bounds.y + result.bounds.height)
    if (((height - croppedHeight) / height) * 100 >= SVG_HEIGHT_CROP_PERCENT)
        result = await render(croppedHeight)
    return {
        ...setSvgViewport(prepareSvgForPrint(result.svg, width, height), result.bounds),
        stats: figureLabelStats(result.nodes),
        collisions: textCollisions(result.nodes),
    }
}

interface ElementProps {
    children?: ReactNode
    style?: CSSProperties
    title?: string
    subtitle?: string
    text?: string
    background?: string
    [key: string]: unknown
}

function normalizeSatoriElements(node: ReactNode): ReactNode {
    if (Array.isArray(node)) return node.map(normalizeSatoriElements)
    const reactElement = isValidElement(node)
    if (!reactElement && !(node && typeof node === 'object' && 'type' in node && 'props' in node))
        return node
    const el = node as ReactElement<ElementProps>
    const children =
        el.props.children === undefined
            ? {}
            : { children: normalizeSatoriElements(el.props.children) }
    // Satori accepts legacy element records; React's child traversal requires
    // real elements throughout the tree, including children of JSX wrappers.
    return reactElement
        ? cloneElement(el, children)
        : React.createElement(el.type, { ...el.props, ...children, key: el.key ?? undefined })
}

function plainText(node: ReactNode): string {
    if (typeof node === 'string' || typeof node === 'number') return String(node)
    if (Array.isArray(node)) return node.map(plainText).join(' ')
    if (!isValidElement(node)) return ''
    return plainText((node.props as ElementProps).children)
}

function isProse(text: string): boolean {
    const words = text.trim().split(/\s+/)
    // Equations, units, short annotations, legends, and node labels stay in the
    // figure. Complete explanatory sentences belong with the figure caption.
    return words.length >= 12 && /[.!?](?:\s|$)/.test(text) && /[a-z]{3}/.test(text)
}

function hasGraphic(node: ReactNode): boolean {
    if (Array.isArray(node)) return node.some(hasGraphic)
    if (!isValidElement(node)) return false
    if (node.type === 'svg' || node.type === 'img') return true
    const props = node.props as ElementProps
    const style = props.style
    // Keep standalone matrix cells and other marks. A tiny tone strip does not
    // make an otherwise empty annotation card a useful visual.
    if (
        style &&
        Number(style.width) >= 8 &&
        Number(style.height) >= 8 &&
        (style.backgroundColor || style.background || style.border)
    )
        return true
    return hasGraphic(props.children)
}

/**
 * Remove presentation chrome and move complete explanatory sentences to the
 * caption. Every removed text block is returned; technical caveats are retained.
 * Structural frames, chart titles, axes, formulas, and compact labels survive.
 */
export function prepareBookFigure(
    element: ReactNode,
    figureKey?: string,
): { element: ReactNode; notes: string[] } {
    const notes: string[] = []
    const reviewed = figureKey ? REVIEWED_CAPTION_BANDS[figureKey] : undefined
    const note = (text: string | undefined) => {
        const normalized = text?.replace(/\s+/g, ' ').trim()
        if (normalized && !notes.includes(normalized)) notes.push(normalized)
    }

    function visit(
        node: ReactNode,
        root = false,
        inSvg = false,
        inCode = false,
        positioned = false,
    ): ReactNode {
        if (Array.isArray(node))
            return node
                .map((child) => visit(child, root, inSvg, inCode, positioned))
                .filter((child) => child != null)
        if (!isValidElement(node)) return node
        const el = node as ReactElement<ElementProps>
        const props = el.props

        if (el.type === vizmatic.TitleBar) {
            note(props.subtitle)
            return null
        }
        if (el.type === vizmatic.Scene) {
            note(props.subtitle)
            return visit(
                normalizeSatoriElements(
                    vizmatic.Scene({
                        ...props,
                        title: undefined,
                        subtitle: undefined,
                    } as Parameters<typeof vizmatic.Scene>[0]),
                ),
                root,
                inSvg,
                inCode,
                positioned,
            )
        }
        if (el.type === vizmatic.Canvas) {
            return visit(
                normalizeSatoriElements(
                    vizmatic.Canvas({ ...props, background: 'transparent' } as Parameters<
                        typeof vizmatic.Canvas
                    >[0]),
                ),
                root,
                inSvg,
                inCode,
                positioned,
            )
        }

        // Illustration components are pure functions, as required by Satori.
        // Expand article-local wrappers as well as shared primitives so static
        // animation frames receive the same print treatment as direct calls.
        if (typeof el.type === 'function') {
            const rendered = (el.type as (props: ElementProps) => ReactNode)(props)
            return visit(normalizeSatoriElements(rendered), root, inSvg, inCode, positioned)
        }

        const svg = inSvg || el.type === 'svg'
        const code =
            inCode ||
            el.type === 'code' ||
            el.type === 'pre' ||
            /mono/i.test(String(props.style?.fontFamily ?? ''))
        const diagramNode = positioned || props.style?.position === 'absolute'
        const children = React.Children.toArray(props.children)
        const isTextBlock =
            children.length > 0 &&
            children.every((child) => typeof child === 'string' || typeof child === 'number')
        const text = plainText(props.children).replace(/\s+/g, ' ').trim()
        if (reviewed?.headings?.includes(text) && !hasGraphic(props.children)) return null
        if (isTextBlock && reviewed) {
            if (reviewed.notes.includes(text)) {
                note(text)
                return null
            }
        }
        if (!svg && !code && !diagramNode && isTextBlock && isProse(plainText(props.children))) {
            note(plainText(props.children))
            return null
        }

        const noteCount = notes.length
        const cleanedChildren = children
            .map((child) => visit(child, false, svg, code, diagramNode))
            .filter((child) => child != null)
        if (children.length > 0 && cleanedChildren.length === 0 && !svg) return null
        if (
            notes.length > noteCount &&
            !plainText(cleanedChildren).trim() &&
            !hasGraphic(cleanedChildren)
        )
            return null
        const style: CSSProperties = { ...props.style }
        // Shadows are decorative; borders inside diagrams encode grouping.
        delete style.boxShadow
        if (root && typeof el.type === 'string') {
            style.background = 'transparent'
            style.backgroundColor = 'transparent'
            delete style.backgroundImage
            delete style.border
            delete style.borderTop
            delete style.borderRight
            delete style.borderBottom
            delete style.borderLeft
            delete style.borderRadius
            style.padding = typeof style.padding === 'number' ? Math.min(style.padding, 16) : 16
        }
        const overrides: ElementProps = { style }
        if (children.length > 0)
            overrides.children = cleanedChildren.length === 1 ? cleanedChildren[0] : cleanedChildren
        return cloneElement(el, overrides)
    }

    return { element: visit(normalizeSatoriElements(element), true), notes }
}

function contentPath(relativePath: string): string {
    const path = resolve(CONTENT_DIR, relativePath)
    if (!path.startsWith(CONTENT_DIR + sep))
        throw new Error(`Invalid book content path: ${relativePath}`)
    return path
}

async function sourceFiles(directory: string): Promise<string[]> {
    if (!existsSync(directory)) return []
    const files: string[] = []
    for (const entry of await readdir(directory, { withFileTypes: true })) {
        if (entry.name === '_generated' || entry.name.startsWith('.book-')) continue
        const path = join(directory, entry.name)
        if (entry.isDirectory()) files.push(...(await sourceFiles(path)))
        else if (/\.(?:tsx?|json|md)$/.test(entry.name)) files.push(path)
    }
    return files.sort()
}

const LOCAL_IMPORT = /(?:\bfrom\s*|\bimport\s*\(?\s*)['"]((?:\.{1,2}|@)\/[^'"]+)['"]/g

function resolveLocalImport(fromFile: string, specifier: string): string | null {
    const base = specifier.startsWith('@/')
        ? join(WEB_DIR, 'src', specifier.slice(2))
        : resolve(dirname(fromFile), specifier)
    const stem = base.replace(/\.[cm]?jsx?$/, '')
    const candidates = [
        base,
        ...['.ts', '.tsx', '.mts', '.js', '.jsx', '/index.ts', '/index.tsx'].map(
            (suffix) => `${stem}${suffix}`,
        ),
    ]
    return (
        candidates.find((candidate) => existsSync(candidate) && statSync(candidate).isFile()) ??
        null
    )
}

/**
 * List the given files and every local file they import, at any depth. Figures share
 * kits across chapter folders, and a shared kit can sit behind a re-export, so a figure
 * is stale when anything it reaches changes, not only the files in its own folder.
 */
export async function localImportClosure(files: string[]): Promise<string[]> {
    const seen = new Set(files)
    const queue = [...files]
    while (queue.length) {
        const file = queue.pop()!
        if (!/\.(?:tsx?|mts|jsx?|md)$/.test(file)) continue
        for (const match of (await readFile(file, 'utf8')).matchAll(LOCAL_IMPORT)) {
            const target = resolveLocalImport(file, match[1])
            if (target && !seen.has(target)) {
                seen.add(target)
                queue.push(target)
            }
        }
    }
    return [...seen].sort()
}

async function fingerprintArticle(files: string[], labelTargetPt: number): Promise<string> {
    const hash = createHash('sha256')
    hash.update(String(labelTargetPt))
    for (const file of [
        ...(await localImportClosure(files)),
        fileURLToPath(import.meta.url),
        join(WEB_DIR, 'tools/illustrations/lib/print-typography.ts'),
        join(WEB_DIR, 'tools/illustrations/lib/svg-print.ts'),
        join(WEB_DIR, 'pnpm-lock.yaml'),
        join(WEB_DIR, 'node_modules/vizmatic/package.json'),
        join(WEB_DIR, 'node_modules/vizmatic/dist/index.js'),
        join(WEB_DIR, 'node_modules/vizmatic/dist/index.cjs'),
    ]) {
        hash.update(file).update(await readFile(file))
    }

    const assetDirectories = [
        process.env.VIZMATIC_ASSET_DIR,
        join(WEB_DIR, 'node_modules/vizmatic/assets'),
        join(WEB_DIR, 'node_modules/vizmatic/dist/assets'),
        join(process.cwd(), 'assets'),
    ].filter((directory): directory is string => Boolean(directory))
    const assetDirectory = assetDirectories.find(existsSync)
    const fontCacheDirectory =
        process.env.VIZMATIC_FONT_DIR ??
        join(process.env.XDG_CACHE_HOME ?? join(homedir(), '.cache'), 'vizmatic', 'fonts')
    const fontDirectories = [
        process.env.VIZMATIC_FONT_DIR,
        assetDirectory ? join(assetDirectory, 'fonts') : undefined,
        fontCacheDirectory,
    ].filter((directory): directory is string => Boolean(directory))
    const fontFiles = [
        'Inter-Regular.ttf',
        'Inter-SemiBold.ttf',
        'Inter-Bold.ttf',
        'JetBrainsMono-Regular.ttf',
        'NotoSans-Regular.ttf',
        'NotoSansMath-Regular.ttf',
    ]
    for (const filename of fontFiles) {
        const fontPath = fontDirectories
            .map((directory) => join(directory, filename))
            .find(existsSync)
        if (fontPath) hash.update(fontPath).update(await readFile(fontPath))
    }
    return hash.digest('hex')
}

const pending = new Map<string, Promise<void>>()

/** Only rendered book references require a print asset, including retained scene names. */
export function retainedBookIllustrationNames(markdown: string): Set<string> {
    const visible = markdown
        .replace(/^```[^\n]*\n[\s\S]*?^```\s*$/gm, '')
        .replace(/<!--[\s\S]*?-->/g, '')
    return new Set(
        Array.from(visible.matchAll(/illustrations\/_generated\/([\w-]+)\.(?:png|gif)/g), (match) =>
            match[1].replace(/_(?:dark|light)$/, ''),
        ),
    )
}

/** Build separate light, cropped print assets without changing website assets. */
export async function ensureBookIllustrations(
    articleRelativePath: string,
    labelTargetPt = BOOK_LABEL_TARGET_PT,
    edition: ContentEdition = 'reference',
): Promise<void> {
    const active = pending.get(articleRelativePath)
    if (active) return active
    const build = buildArticle(articleRelativePath, labelTargetPt, edition)
    pending.set(articleRelativePath, build)
    try {
        await build
    } finally {
        pending.delete(articleRelativePath)
    }
}

async function buildArticle(
    articleRelativePath: string,
    labelTargetPt: number,
    edition: ContentEdition,
): Promise<void> {
    const articleDir = contentPath(articleRelativePath)
    const files = await sourceFiles(articleDir)
    const overrideDir = join(OVERRIDE_DIR, basename(articleDir))
    const overrideFiles = await sourceFiles(overrideDir)
    const contentFile = join(articleDir, 'content.md')
    const bundle = loadContentBundle(articleDir, 'book', edition)
    if (!bundle)
        throw new Error(`Content bundle missing for book illustrations: ${articleRelativePath}`)
    const retained = retainedBookIllustrationNames(bundle.body)
    const sources = new Set(Array.from(retained, (name) => name.replace(/_scene\d+$/, '')))
    const sourcePaths = files.filter(
        (path) =>
            path.endsWith('.tsx') &&
            dirname(path) === join(articleDir, 'illustrations') &&
            sources.has(basename(path, '.tsx')),
    )
    const embedded = parseEmbeddedIllustrationBlocks(
        filterContentForAudience(bundle.sourceBody, 'book', contentFile, edition),
        contentFile,
    )

    const fingerprint = createHash('sha256')
        .update(await fingerprintArticle([...files, ...overrideFiles], labelTargetPt))
        .update(edition)
        .digest('hex')
    const outputDir = join(OUTPUT_DIR, articleRelativePath)
    const manifestPath = join(outputDir, 'manifest.json')
    if (existsSync(manifestPath)) {
        const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as BookManifest
        if (
            manifest.fingerprint === fingerprint &&
            Object.keys(manifest.images).every((name) => existsSync(join(outputDir, name)))
        )
            return
    }

    const temporary: string[] = []
    await mkdir(join(articleDir, 'illustrations'), { recursive: true })
    try {
        for (const block of embedded) {
            if (sourcePaths.some((path) => basename(path, '.tsx') === block.name)) continue
            const path = join(articleDir, 'illustrations', `.book-${process.pid}-${block.name}.tsx`)
            await writeFile(path, `${block.source}\n`)
            temporary.push(path)
            sourcePaths.push(path)
        }

        const manifest: BookManifest = { fingerprint, images: {} }
        for (const path of sourcePaths) {
            const imported = await import(path)
            const nestedDefault = imported.default
            const mod =
                nestedDefault &&
                typeof nestedDefault === 'object' &&
                ('create' in nestedDefault || 'default' in nestedDefault)
                    ? { ...imported, ...nestedDefault }
                    : imported
            const name = basename(path, '.tsx').replace(new RegExp(`^\\.book-${process.pid}-`), '')
            const overridePath = join(overrideDir, `${name}.tsx`)
            let override:
                | {
                      width: number
                      height: number
                      create: (theme: vizmatic.ThemeMode) => ReactNode
                      captionNotes?: string[]
                  }
                | undefined
            if (existsSync(overridePath)) {
                const importedOverride = await import(overridePath)
                const nestedOverride = importedOverride.default
                const candidate =
                    nestedOverride &&
                    typeof nestedOverride === 'object' &&
                    'create' in nestedOverride
                        ? { ...importedOverride, ...nestedOverride }
                        : importedOverride
                if (
                    !(candidate.width > 0) ||
                    !(candidate.height > 0) ||
                    typeof candidate.create !== 'function'
                ) {
                    throw new Error(
                        `${overridePath}: book figure overrides must export positive width, height, and create(theme)`,
                    )
                }
                if (
                    candidate.captionNotes !== undefined &&
                    (!Array.isArray(candidate.captionNotes) ||
                        candidate.captionNotes.some((note: unknown) => typeof note !== 'string'))
                ) {
                    throw new Error(`${overridePath}: captionNotes must be an array of strings`)
                }
                override = candidate
            }
            const width = override?.width || mod.width || 800
            const height = override?.height || mod.height || 500
            let scenes: ReactNode[] = []
            if (typeof mod.createScenes === 'function')
                scenes = mod
                    .createScenes('light')
                    .map((scene: { element: ReactNode }) => scene.element)
            else if (typeof mod.create === 'function') scenes = [mod.create('light')]
            else if (typeof mod.createAnimation === 'function') {
                const animation = mod.createAnimation('light') as vizmatic.DefinedAnimation<object>
                const frame = vizmatic.sampleAnimationFrames(animation).at(-1)
                if (frame) scenes = [animation.render(frame.state, frame.frame)]
            } else if (isValidElement(mod.default)) scenes = [mod.default]
            else continue

            for (const [index, scene] of scenes.entries()) {
                const outputName =
                    typeof mod.createScenes === 'function'
                        ? `${name}_scene${index}_light.png`
                        : `${name}_light.png`
                if (!retained.has(name) && !retained.has(`${name}_scene${index}`)) continue
                const figureKey = `${articleRelativePath}/${name}`
                const sourceFigure = prepareBookFigure(scene, figureKey)
                const figure = override
                    ? prepareBookFigure(override.create('light'), figureKey)
                    : sourceFigure
                // An explicitly reviewed caption can omit source bands already
                // explained by its authored caption or the adjacent body text.
                const notes = override?.captionNotes ??
                    REVIEWED_CAPTION_NOTES[figureKey] ?? [
                        ...new Set([...sourceFigure.notes, ...figure.notes]),
                    ]
                if (!figure.element)
                    throw new Error(`${path}: book transformation removed the entire figure`)
                // Raising small labels can push a hand-placed figure past its canvas or make its
                // labels collide. Take the largest size that stays clean. A clean figure with
                // small labels reads better than one with large labels printed on top of each other.
                const png = {
                    width,
                    height,
                    outputPath: join(outputDir, outputName),
                    background: 'transparent',
                    theme: 'light',
                    watermark: false,
                    crop: 'both',
                    scale: 2,
                } as const
                type Attempt = {
                    element: ReactNode
                    canvas: { width: number; height: number }
                    vector: Awaited<ReturnType<typeof renderPrintSvg>>
                }
                let attempt: Attempt | undefined
                let rendered: Attempt | undefined
                const tryRender = async (
                    element: ReactNode,
                    canvas: { width: number; height: number },
                ): Promise<Attempt | undefined> => {
                    try {
                        await vizmatic.renderToPng(element, { ...png, ...canvas })
                    } catch (error) {
                        if (error instanceof vizmatic.CanvasOverflowError) return undefined
                        throw new Error(
                            `Book illustration ${relative(CONTENT_DIR, path)}: ${error instanceof Error ? error.message : String(error)}`,
                            { cause: error },
                        )
                    }
                    return {
                        element,
                        canvas,
                        vector: await renderPrintSvg(element, canvas.width, canvas.height),
                    }
                }
                for (const target of labelTargetPt > 0
                    ? [
                          labelTargetPt,
                          labelTargetPt - 0.5,
                          labelTargetPt - 1,
                          labelTargetPt - 1.5,
                          labelTargetPt - 2,
                          0,
                      ]
                    : [0]) {
                    rendered = await tryRender(
                        target > 0
                            ? preparePrintTypography(
                                  figure.element,
                                  minimumBookLabelPixels(width, height, target),
                              )
                            : figure.element,
                        { width, height },
                    )
                    if (!rendered) continue
                    if (
                        !attempt ||
                        rendered.vector.collisions.length < attempt.vector.collisions.length
                    )
                        attempt = rendered
                    if (attempt.vector.collisions.length === 0) break
                }
                // A figure that overflows its own canvas would clip. Margins cost nothing, since the
                // crop removes them, so grow the canvas and tell the figure's owner.
                for (const growth of attempt ? [] : [1.02, 1.05, 1.1, 1.25]) {
                    rendered = await tryRender(figure.element, {
                        width: Math.ceil(width * growth),
                        height: Math.ceil(height * growth),
                    })
                    if (!rendered) continue
                    attempt = rendered
                    console.warn(
                        `  Canvas overflow: ${relative(CONTENT_DIR, path)} needs ${attempt.canvas.width}x${attempt.canvas.height}, not ${width}x${height}. Fix its dimensions.`,
                    )
                    break
                }
                if (!attempt)
                    throw new Error(
                        `Book illustration ${relative(CONTENT_DIR, path)}: content overflows a ${width}x${height} canvas by more than a quarter`,
                    )
                if (attempt !== rendered)
                    await vizmatic.renderToPng(attempt.element, { ...png, ...attempt.canvas })
                const { vector } = attempt
                if (vector.collisions.length) {
                    console.warn(
                        `  Colliding labels: ${relative(CONTENT_DIR, path)}: ${vector.collisions.slice(0, 3).join('; ')}`,
                    )
                }
                const scale = bookDisplayScale(vector.width, vector.height, vector.stats)
                const smallestPrinted = vector.stats.smallestPx
                    ? vector.stats.smallestPx * scale
                    : undefined
                if (labelTargetPt > 0 && smallestPrinted && smallestPrinted < 8) {
                    console.warn(
                        `  Small print labels: ${relative(CONTENT_DIR, path)} reaches ${smallestPrinted.toFixed(1)} pt. Redraw it for the book column to reach 8 pt.`,
                    )
                }
                // Print vector art. The PNG stays as a fallback and a check on the layout.
                const svgName = outputName.replace(/\.png$/, '.svg')
                await writeFile(join(outputDir, svgName), vector.svg)
                manifest.images[outputName] = {
                    notes,
                    ...(labelTargetPt > 0 && smallestPrinted
                        ? { minimumLabelPt: smallestPrinted }
                        : {}),
                    svg: svgName,
                    widthPt: Math.round(vector.width * scale * 100) / 100,
                    shrink: smallestPrinted
                        ? Math.max(0.86, Math.min(1, BOOK_SMALLEST_LABEL_PT / smallestPrinted))
                        : 0.86,
                }
            }
        }
        await mkdir(outputDir, { recursive: true })
        await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n')
    } finally {
        await Promise.all(temporary.map((path) => unlink(path)))
    }
}

/** Resolve a src/content-relative generated image after ensureBookIllustrations. */
export function resolveBookIllustration(contentRelativePath: string): BookIllustration | null {
    const source = contentPath(contentRelativePath)
    const generatedDir = dirname(source)
    if (
        basename(generatedDir) !== '_generated' ||
        basename(dirname(generatedDir)) !== 'illustrations'
    )
        return null
    const articleRelativePath = relative(CONTENT_DIR, dirname(dirname(generatedDir)))
    const outputDir = join(OUTPUT_DIR, articleRelativePath)
    const manifestPath = join(outputDir, 'manifest.json')
    if (!existsSync(manifestPath)) return null
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as BookManifest
    const name = basename(source).replace(/_(?:dark|light)\.(?:png|gif)$/, '_light.png')
    const entry = manifest.images[name]
    const path = join(outputDir, name)
    if (!entry || !existsSync(path)) return null
    const vector = entry.svg ? join(outputDir, entry.svg) : undefined
    return {
        path: vector && existsSync(vector) ? vector : path,
        notes: entry.notes,
        widthPt: entry.widthPt,
        shrink: entry.shrink,
    }
}
