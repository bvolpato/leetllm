import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadContentBundle } from '../../src/lib/content-bundle'
import { filterContentForAudience, type ContentEdition } from '../../src/lib/content-audience'
import { summarizeMermaidDiagram } from '../../src/lib/content-utils'
import { BOOK_DIAGRAM_SCALE, closeBrowser, renderDiagram } from './lib/render'
import { BOOK_BODY_LABEL_PT, BOOK_FIGURE_HEIGHT_PT, BOOK_FIGURE_WIDTH_PT } from '../illustrations/lib/print-typography'
import { bookFontPaths } from '../book/fonts'
import { BOOK_DIAGRAM_CAPTIONS } from '../book/diagram-captions'

const WEB_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const CONTENT_DIR = join(WEB_DIR, 'src/content')
const OUTPUT_DIR = resolve(WEB_DIR, '../build/book/diagrams')
const MERMAID = /```mermaid\n([\s\S]*?)```/g

interface BookDiagram {
    index: number
    source: string
    block: string
}

function articleDirectory(articleRelativePath: string): string {
    const directory = resolve(CONTENT_DIR, articleRelativePath)
    if (!directory.startsWith(CONTENT_DIR + sep)) throw new Error(`Invalid book diagram directory: ${articleRelativePath}`)
    return directory
}

function bookSourceDiagrams(sourceMarkdown: string, edition: ContentEdition): BookDiagram[] {
    const sourceBlocks = Array.from(sourceMarkdown.matchAll(MERMAID), (match, index) => ({
        index,
        source: match[1].trim(),
        block: match[0],
    }))
    let nonce = 0
    let markerPrefix = `%%__LEETLLM_BOOK_DIAGRAM_SOURCE_INDEX_${nonce}_`
    while (sourceMarkdown.includes(markerPrefix)) {
        nonce++
        markerPrefix = `%%__LEETLLM_BOOK_DIAGRAM_SOURCE_INDEX_${nonce}_`
    }
    let sourceIndex = 0
    const taggedSource = sourceMarkdown.replace(MERMAID, block => {
        const index = sourceIndex++
        const marker = `${markerPrefix}${index}__%%`
        return block.replace(/^```mermaid\n/, opening => `${opening}${marker}\n`)
    })
    const bookSource = filterContentForAudience(taggedSource, 'book', '<book diagrams>', edition)

    return Array.from(bookSource.matchAll(MERMAID), match => {
        const markerLine = match[1].split(/\r?\n/, 1)[0]
        const ordinalText = markerLine.startsWith(markerPrefix) && markerLine.endsWith('__%%')
            ? markerLine.slice(markerPrefix.length, -4)
            : ''
        const index = Number(ordinalText)
        const original = Number.isInteger(index) ? sourceBlocks[index] : undefined
        if (!original) throw new Error('Book-visible Mermaid diagram lost its original source index')
        const visibleSource = match[1].slice(markerLine.length).replace(/^\r?\n/, '').trim()
        if (visibleSource !== original.source) throw new Error('Book-visible Mermaid diagram no longer matches its original source')
        return original
    })
}

function diagramsFor(markdown: string, sourceMarkdown: string, edition: ContentEdition): BookDiagram[] {
    const sourceBlocks = bookSourceDiagrams(sourceMarkdown, edition)
    const entries: BookDiagram[] = []
    let sourceCursor = 0
    for (const match of markdown.matchAll(MERMAID)) {
        let found = sourceCursor
        while (found < sourceBlocks.length && sourceBlocks[found].block !== match[0]) found++
        if (found >= sourceBlocks.length) throw new Error('Retained book Mermaid diagram does not match its full source')
        entries.push(sourceBlocks[found])
        sourceCursor = found + 1
    }
    return entries
}

function imageName(index: number): string {
    return `content_diagram_${index}_light.png`
}

function escapeAttribute(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Replace retained fences using their original source indices, independent of website assets. */
export function resolveBookDiagramMarkdown(markdown: string, articleRelativePath: string, sourceMarkdown: string, displayWidths: Record<string, number> = {}, edition: ContentEdition = 'reference'): string {
    articleDirectory(articleRelativePath)
    const entries = diagramsFor(markdown, sourceMarkdown, edition)
    let entryIndex = 0
    return markdown.replace(MERMAID, block => {
        const entry = entries[entryIndex++]
        if (!entry || entry.block !== block) throw new Error('Retained book Mermaid diagram does not match its full source')
        const index = entry.index
        const src = `/cdn/content-image/${articleRelativePath}/diagrams/_generated/${imageName(index)}`
        const alt = escapeAttribute(summarizeMermaidDiagram(block))
        const width = displayWidths[imageName(index)]
        const sizing = width ? ` style="width:${width.toFixed(2)}pt;max-width:100%"` : ''
        const caption = BOOK_DIAGRAM_CAPTIONS[`${articleRelativePath}/${index}`]
        const captionHtml = caption ? `\n<figcaption>${escapeAttribute(caption)}</figcaption>` : ''
        return `<figure data-diagram-alt="${alt}">\n<img src="${src}" alt="${alt}"${sizing} />${captionHtml}\n</figure>`
    })
}

/** Select the isolated print SVG, or its PNG for math. Never silently fall back to framed website diagrams. */
export function resolveBookDiagram(contentRelativePath: string, requireExisting = true): string | null {
    const match = /^(.+)\/diagrams\/_generated\/(content_diagram_\d+)_(?:dark|light)\.png$/.exec(contentRelativePath)
    if (!match) return null
    articleDirectory(match[1])
    const path = join(OUTPUT_DIR, match[1], `${match[2]}_light.png`)
    const vector = path.replace(/\.png$/, '.svg')
    if (existsSync(vector)) return vector
    if (requireExisting && !existsSync(path)) throw new Error(`Missing print diagram: ${path}. Prepare the book diagrams before rendering.`)
    return path
}

export { closeBrowser as closeBookDiagramBrowser }

/** Build light, transparent SVG captures without modifying the website PNGs. */
export async function ensureBookDiagrams(articleRelativePath: string, renderMissing = true, minimumLabelPt = 0, edition: ContentEdition = 'reference', keepBrowserOpen = false): Promise<Record<string, number>> {
    const bundle = loadContentBundle(articleDirectory(articleRelativePath), 'book', edition)
    if (!bundle) throw new Error(`Content bundle missing for book diagrams: ${articleRelativePath}`)
    const entries = diagramsFor(bundle.body, bundle.sourceBody, edition)
    if (!entries.length) return {}
    const hash = createHash('sha256').update(JSON.stringify({ entries, minimumLabelPt }))
    for (const file of [
        fileURLToPath(import.meta.url),
        join(WEB_DIR, 'tools/diagrams/lib/render.ts'),
        join(WEB_DIR, 'tools/illustrations/lib/print-typography.ts'),
        join(WEB_DIR, 'node_modules/mermaid/package.json'),
        join(WEB_DIR, 'node_modules/katex/package.json'),
    ]) {
        hash.update(file).update(await readFile(file))
    }
    for (const font of bookFontPaths()) hash.update(font).update(await readFile(font))
    const fingerprint = hash.digest('hex')
    const outputDirectory = join(OUTPUT_DIR, articleRelativePath)
    const manifestPath = join(outputDirectory, 'manifest.json')
    if (existsSync(manifestPath)) {
        const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as { fingerprint: string; displayWidths: Record<string, number> }
        if (manifest.fingerprint === fingerprint && entries.every(entry => existsSync(join(outputDirectory, imageName(entry.index))))) return manifest.displayWidths
    }
    if (!renderMissing) throw new Error(`Missing or stale print diagrams for ${articleRelativePath}. Run --all to prepare them.`)
    await mkdir(outputDirectory, { recursive: true })
    try {
        const labels: Record<string, number> = {}
        const displayWidths: Record<string, number> = {}
        for (const entry of entries) {
            const outputPath = join(outputDirectory, imageName(entry.index))
            const result = await renderDiagram(entry.source, 'light', `${outputPath}.tmp.png`, { book: true })
            const png = await readFile(`${outputPath}.tmp.png`)
            const width = png.readUInt32BE(16) / BOOK_DIAGRAM_SCALE
            const height = png.readUInt32BE(20) / BOOK_DIAGRAM_SCALE
            const smallestLabel = Math.min(...(result.textLabels ?? []).map(label => label.pixels))
            // Print diagram labels at the same size as the labels of every other figure.
            const displayWidth = Number.isFinite(smallestLabel)
                ? Math.min(BOOK_FIGURE_WIDTH_PT, width * BOOK_BODY_LABEL_PT / smallestLabel)
                : Math.min(BOOK_FIGURE_WIDTH_PT, width * 0.75)
            const scale = Math.min(displayWidth / width, BOOK_FIGURE_HEIGHT_PT / height)
            const printedMinimum = smallestLabel * scale
            if (minimumLabelPt > 0 && (!Number.isFinite(printedMinimum) || printedMinimum < minimumLabelPt)) {
                throw new Error(`Book diagram ${articleRelativePath}/${entry.index}: labels would print at ${printedMinimum.toFixed(1)}pt. Reflow the book diagram to retain at least ${minimumLabelPt}pt.`)
            }
            if (Number.isFinite(printedMinimum)) labels[imageName(entry.index)] = printedMinimum
            displayWidths[imageName(entry.index)] = displayWidth
            await rename(`${outputPath}.tmp.png`, outputPath)
            const vectorPath = outputPath.replace(/\.png$/, '.svg')
            if (result.vector) await writeFile(vectorPath, result.vector)
            else await rm(vectorPath, { force: true })
        }
        await writeFile(`${manifestPath}.tmp`, JSON.stringify({ fingerprint, images: entries.map(entry => imageName(entry.index)), minimumLabelPt: labels, displayWidths }, null, 2) + '\n')
        await rename(`${manifestPath}.tmp`, manifestPath)
        return displayWidths
    } finally {
        if (!keepBrowserOpen) await closeBrowser()
    }
}
