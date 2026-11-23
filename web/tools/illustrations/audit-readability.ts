import { createHash } from 'node:crypto'
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'
import { cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react'
import { renderToPngWithOutput, type ThemeMode } from 'vizmatic'
import { prepareArticleFigure } from './lib/presentation'

interface LabelProps {
    children?: ReactNode
    style?: { fontSize?: number | string; verticalAlign?: string }
    fontSize?: number | string
    'data-readability-font'?: number
    'data-readability-script'?: boolean
}

function fontPixels(value: number | string | undefined, inherited: number): number {
    if (value === undefined) return inherited
    if (typeof value === 'number') return value
    const match = /^([\d.]+)(px|pt|em|rem|%)?$/.exec(value)
    if (!match) throw new Error(`Unsupported label font size: ${value}`)
    const amount = Number(match[1])
    if (match[2] === 'pt') return (amount * 4) / 3
    if (match[2] === 'em') return amount * inherited
    if (match[2] === 'rem') return amount * 16
    if (match[2] === '%') return (amount * inherited) / 100
    return amount
}

/** Attach measurement metadata without changing layout, including inherited math type. */
export function markLabelFonts(
    node: ReactNode,
    inherited = 16,
    inheritedScript = false,
): ReactNode {
    if (Array.isArray(node))
        return node.map((child) => markLabelFonts(child, inherited, inheritedScript))
    if (
        !isValidElement(node) &&
        !(node && typeof node === 'object' && 'type' in node && 'props' in node)
    )
        return node
    const el = node as ReactElement<LabelProps>
    const font = fontPixels(el.props.style?.fontSize ?? el.props.fontSize, inherited)
    const directText = [el.props.children]
        .flat(Infinity)
        .some(
            (child) =>
                typeof child === 'number' || (typeof child === 'string' && child.trim().length > 0),
        )
    if (directText && (!Number.isFinite(font) || font <= 0)) {
        throw new Error('Source font sizes must be positive finite numbers.')
    }
    const script =
        inheritedScript ||
        el.type === 'sub' ||
        el.type === 'sup' ||
        el.props.style?.verticalAlign === 'sub' ||
        el.props.style?.verticalAlign === 'super'
    const overrides = {
        'data-readability-font': font,
        'data-readability-script': script,
        ...(el.props.children !== undefined
            ? { children: markLabelFonts(el.props.children, font, script) }
            : {}),
    }
    return isValidElement(node)
        ? cloneElement(el, overrides)
        : { ...el, props: { ...el.props, ...overrides } }
}

export interface MeasuredLabel {
    text: string
    sourceFontPx: number
    script: boolean
}

export function measuredLabel(node: {
    textContent?: unknown
    props: Record<string, unknown>
    width: number
    height: number
}): MeasuredLabel | null {
    const text =
        typeof node.textContent === 'string' || typeof node.textContent === 'number'
            ? String(node.textContent).trim()
            : ''
    const sourceFontPx = node.props['data-readability-font']
    if (!text || typeof sourceFontPx !== 'number' || node.width <= 0 || node.height <= 0)
        return null
    return { text, sourceFontPx, script: node.props['data-readability-script'] === true }
}

export function assessLabels(
    labels: MeasuredLabel[],
    renderedWidth: number,
    displayWidth: number,
    minimumCssPx: number,
    bounds?: { renderedHeight: number; maxDisplayHeight: number },
) {
    if (![renderedWidth, displayWidth, minimumCssPx].every((n) => Number.isFinite(n) && n > 0)) {
        throw new Error(
            'Rendered width, display width and minimum label size must be positive numbers.',
        )
    }
    if (bounds) {
        if (
            ![bounds.renderedHeight, bounds.maxDisplayHeight].every(
                (n) => Number.isFinite(n) && n > 0,
            )
        ) {
            throw new Error('Rendered height and maximum display height must be positive numbers.')
        }
        displayWidth = Math.min(
            displayWidth,
            (bounds.maxDisplayHeight * renderedWidth) / bounds.renderedHeight,
        )
    }
    const measured = labels.map((label) => {
        if (!Number.isFinite(label.sourceFontPx) || label.sourceFontPx <= 0) {
            throw new Error('Source font sizes must be positive finite numbers.')
        }
        const displayFontPx = (label.sourceFontPx * displayWidth) / renderedWidth
        const requiredCssPx = minimumCssPx * (label.script ? 0.7 : 1)
        return {
            ...label,
            displayFontPx,
            requiredCssPx,
            passes: displayFontPx + 0.01 >= requiredCssPx,
        }
    })
    return {
        displayWidth,
        passed: measured.length > 0 && measured.every((label) => label.passes),
        labels: measured,
    }
}

async function main() {
    const { values } = parseArgs({
        options: {
            file: { type: 'string', multiple: true },
            article: { type: 'string' },
            'display-width': { type: 'string', default: '343' },
            'max-display-height': { type: 'string', default: '800' },
            'min-css-px': { type: 'string', default: '10' },
            output: { type: 'string' },
            help: { type: 'boolean', default: false },
        },
    })
    if (values.help) {
        console.log(
            "pnpm exec tsx tools/illustrations/audit-readability.ts --article foundations/python-for-ai-engineering [--display-width 343] [--max-display-height 800] [--min-css-px 10] [--output report.json]\nUse --file path.tsx (repeatable) for individual static figures. The height limit defaults to the article page's 800px cap and reduces each figure's displayed width to preserve its aspect ratio. JSON is also written to stdout. A failing label or no observed text exits 1. Math scripts use 70% of the requested floor.",
        )
        return
    }
    const web = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
    const content = join(web, 'src/content')
    const files = (values.file ?? []).map((file) => resolve(file))
    if (values.article) {
        const bundle = resolve(content, values.article)
        if (relative(content, bundle).startsWith('..'))
            throw new Error('Article must be inside src/content.')
        const dir = join(bundle, 'illustrations')
        for (const file of (await readdir(dir)).sort())
            if (file.endsWith('.tsx')) files.push(join(dir, file))
    }
    if (!files.length) throw new Error('Supply --article or at least one --file.')
    const displayWidth = Number(values['display-width']),
        minimumCssPx = Number(values['min-css-px'])
    const maxDisplayHeight = Number(values['max-display-height'])
    assessLabels([], 1, displayWidth, minimumCssPx, { renderedHeight: 1, maxDisplayHeight })
    const temporary = await mkdtemp(join(tmpdir(), 'leetllm-label-audit-'))
    const results = []
    try {
        for (const [index, file] of [...new Set(files)].entries()) {
            const mod = await import(pathToFileURL(file).href)
            if (mod.createScenes || mod.createAnimation)
                throw new Error(`Animated figure requires a temporal review: ${file}`)
            const sourceSha256 = createHash('sha256')
                .update(await readFile(file))
                .digest('hex')
            for (const theme of ['dark', 'light'] as ThemeMode[]) {
                const labels = new Map<string, MeasuredLabel>()
                const create = (mode: ThemeMode) =>
                    markLabelFonts(
                        prepareArticleFigure(
                            typeof mod.create === 'function' ? mod.create(mode) : mod.default,
                            mod.opaqueBackground === true,
                        ) as ReactNode,
                    )
                const rendered = await renderToPngWithOutput(
                    create(theme),
                    {
                        width: mod.width || 1100,
                        height: mod.height || 500,
                        outputPath: join(temporary, `${index}-${theme}.png`),
                        crop: 'both',
                        scale: 2,
                        theme,
                        background: mod.opaqueBackground === true ? 'theme' : 'transparent',
                        onNodeDetected: (node) => {
                            const label = measuredLabel(node)
                            if (label) labels.set(JSON.stringify(label), label)
                        },
                    },
                    create,
                    theme,
                )
                results.push({
                    file: relative(web, file),
                    sourceSha256,
                    theme,
                    renderedWidth: rendered.width,
                    renderedHeight: rendered.height,
                    ...assessLabels(
                        [...labels.values()],
                        rendered.width,
                        displayWidth,
                        minimumCssPx,
                        { renderedHeight: rendered.height, maxDisplayHeight },
                    ),
                })
            }
        }
    } finally {
        await rm(temporary, { recursive: true, force: true })
    }
    const report = {
        schemaVersion: 1,
        displayWidth,
        maxDisplayHeight,
        minimumCssPx,
        passed: results.every((result) => result.passed),
        results,
        limits: [
            'Nominal font size at the requested image width, reduced by the height limit. Each result records its assessed displayWidth. Browser layout may constrain it further.',
            'This does not score visual quality, contrast, clipping or overlap.',
            'Only Satori-observed text is measured. Text baked into nested SVGs or images requires visual review.',
            'Default 10px is a lower bound for secondary labels. Aim for at least 12px for teaching labels and values.',
        ],
    }
    const json = JSON.stringify(report, null, 2) + '\n'
    if (values.output) await writeFile(resolve(values.output), json)
    process.stdout.write(json)
    if (!report.passed) process.exitCode = 1
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    main().catch((error) => {
        console.error(error)
        process.exitCode = 1
    })
}
