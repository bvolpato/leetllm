/**
 * LeetLLM Diagram Renderer — Core Engine
 *
 * Renders Mermaid diagram strings to PNG images using Puppeteer + system Chromium.
 * Produces both dark and light theme variants with proper fonts and colors.
 *
 * Pipeline:
 * 1. Launch headless Chromium (reused across renders)
 * 2. Serve the installed Mermaid and KaTeX bundles to a blank page
 * 3. Inject the diagram definition and render to SVG
 * 4. Screenshot the rendered SVG element at 2x for retina
 * 5. Write PNG to disk
 */

import puppeteer, { type Browser } from 'puppeteer-core'
import { mkdir, readFile, readdir } from 'fs/promises'
import { dirname, extname, join, resolve, sep } from 'path'
import { existsSync } from 'fs'
import { createRequire } from 'module'
import { bookFontCss } from '../../book/fonts'

// ─── Theme Config ────────────────────────────────────────────────────────────

export type ThemeMode = 'dark' | 'light'

interface ThemeConfig {
    mermaidTheme: string
    themeVariables: Record<string, string>
}

const FONT_DIR = join(dirname(new URL(import.meta.url).pathname), '..', '..', 'illustrations', 'fonts')
const require = createRequire(import.meta.url)

const mathDependencies = (async () => {
    const mermaidDist = dirname(require.resolve('mermaid'))
    const katexDist = dirname(require.resolve('katex'))
    const [mermaidPackage, katexPackage, chunks] = await Promise.all([
        readFile(join(mermaidDist, '..', 'package.json'), 'utf-8'),
        readFile(join(katexDist, '..', 'package.json'), 'utf-8'),
        readdir(join(mermaidDist, 'chunks', 'mermaid.esm.min')),
    ])
    const mermaidUrl = `https://cdn.jsdelivr.net/npm/mermaid@${JSON.parse(mermaidPackage).version}/dist/`
    const katexUrl = `https://cdn.jsdelivr.net/npm/katex@${JSON.parse(katexPackage).version}/dist/`
    const katexChunk = chunks.find((file) => /^katex-[\w-]+\.mjs$/.test(file))
    if (!katexChunk) throw new Error('Installed Mermaid bundle has no KaTeX module chunk')
    return {
        mermaidUrl,
        katexUrl,
        mermaidDist,
        katexDist,
        // Mermaid bundles its own KaTeX; use the patched installed version with matching CSS.
        importMap: JSON.stringify({ imports: {
            [`${mermaidUrl}chunks/mermaid.esm.min/${katexChunk}`]: `${katexUrl}katex.mjs`,
        } }),
    }
})()

const THEMES: Record<ThemeMode, ThemeConfig> = {
    dark: {
        mermaidTheme: 'base',
        themeVariables: {
            background: 'transparent',
            primaryColor: '#191c22',
            primaryTextColor: '#f2efe6',
            primaryBorderColor: '#626b79',
            lineColor: '#929ba7',
            secondaryColor: '#20252c',
            tertiaryColor: '#171b21',
            mainBkg: '#191c22',
            nodeBorder: '#626b79',
            clusterBkg: '#101318',
            clusterBorder: '#464e5b',
            titleColor: '#f2efe6',
            edgeLabelBackground: '#101318',
            nodeTextColor: '#f2efe6',
            actorBkg: '#191c22',
            actorBorder: '#626b79',
            actorTextColor: '#f2efe6',
            actorLineColor: '#707a88',
            signalColor: '#b7bec8',
            signalTextColor: '#e6e8ed',
            labelBoxBkgColor: '#20252c',
            labelBoxBorderColor: '#626b79',
            labelTextColor: '#f2efe6',
            loopTextColor: '#e6e8ed',
            noteBkgColor: '#302b20',
            noteBorderColor: '#a29470',
            noteTextColor: '#f2ead5',
            activationBkgColor: '#263647',
            activationBorderColor: '#809aaf',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '16px',
        },
    },
    light: {
        mermaidTheme: 'base',
        themeVariables: {
            background: 'transparent',
            primaryColor: '#f4f5f7',
            primaryTextColor: '#242a33',
            primaryBorderColor: '#9ca6b4',
            lineColor: '#717d8d',
            secondaryColor: '#eef1f5',
            tertiaryColor: '#f5f6f8',
            mainBkg: '#f4f5f7',
            nodeBorder: '#9ca6b4',
            clusterBkg: '#f8f9fb',
            clusterBorder: '#bec5ce',
            titleColor: '#242a33',
            edgeLabelBackground: '#ffffff',
            nodeTextColor: '#242a33',
            actorBkg: '#f4f5f7',
            actorBorder: '#9ca6b4',
            actorTextColor: '#242a33',
            actorLineColor: '#919ba9',
            signalColor: '#586575',
            signalTextColor: '#374151',
            labelBoxBkgColor: '#eef1f5',
            labelBoxBorderColor: '#9ca6b4',
            labelTextColor: '#242a33',
            loopTextColor: '#374151',
            noteBkgColor: '#f7f2e6',
            noteBorderColor: '#b5a478',
            noteTextColor: '#51452d',
            activationBkgColor: '#e7eef5',
            activationBorderColor: '#8c9fb3',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '16px',
        },
    },
}

// ─── Shared Diagram Color Palette ────────────────────────────────────────────
//
// Authors can apply semantic colors to nodes using Mermaid's triple-colon syntax:
//   A["My Node"]:::primary
//
// Available classes:
//   primary   – Purple, for key/central nodes
//   secondary – Blue, for supporting nodes
//   success   – Green, for positive outcomes or results
//   warning   – Amber, for caution, decisions, or conditional logic
//   danger    – Red, for errors, failures, or critical items
//   muted     – Slate gray, for background or neutral nodes
//
// The renderer auto-injects theme-appropriate classDef lines before rendering.
// This eliminates the need for per-node `style` directives in content.md files.

interface PaletteEntry {
    dark: { fill: string; color: string; stroke: string }
    light: { fill: string; color: string; stroke: string }
}

const PALETTE: Record<string, PaletteEntry> = {
    primary: {
        dark: { fill: '#252136', color: '#e7def9', stroke: '#9c88c7' },
        light: { fill: '#f1edf8', color: '#4d3d70', stroke: '#a395be' },
    },
    secondary: {
        dark: { fill: '#1a2a37', color: '#dcecf8', stroke: '#7da4c1' },
        light: { fill: '#edf3f8', color: '#365675', stroke: '#91a9c0' },
    },
    success: {
        dark: { fill: '#1a2c23', color: '#dcefe2', stroke: '#7ba78b' },
        light: { fill: '#edf5ef', color: '#365c43', stroke: '#90ad99' },
    },
    warning: {
        dark: { fill: '#332b1b', color: '#f2e5c7', stroke: '#b69b61' },
        light: { fill: '#f8f3e7', color: '#6b5527', stroke: '#b5a16f' },
    },
    danger: {
        dark: { fill: '#332127', color: '#f4dde3', stroke: '#bd8792' },
        light: { fill: '#f8edef', color: '#78434d', stroke: '#bd939b' },
    },
    accent: {
        dark: { fill: '#192d2d', color: '#dbefed', stroke: '#7ca9a4' },
        light: { fill: '#edf5f4', color: '#365f5b', stroke: '#91afab' },
    },
    muted: {
        dark: { fill: '#1c2129', color: '#dce0e7', stroke: '#697381' },
        light: { fill: '#f1f3f6', color: '#454e5d', stroke: '#a9b1be' },
    },
}

/**
 * Inject classDef lines into a Mermaid diagram for the given theme.
 *
 * Inserts definitions after the diagram declaration, following any init directive.
 * Only injects classes that are actually referenced (:::className) in the diagram.
 */
export function injectClassDefs(diagram: string, theme: ThemeMode): string {
    const lines = diagram.split('\n')

    // Only inject classDefs that are actually used in this diagram
    const classDefs: string[] = []
    for (const [name, entry] of Object.entries(PALETTE)) {
        if (diagram.includes(`:::${name}`)) {
            const c = entry[theme]
            classDefs.push(`    classDef ${name} fill:${c.fill},color:${c.color},stroke:${c.stroke}`)
        }
    }

    if (classDefs.length === 0) return diagram

    const declaration = lines.findIndex(line => /^\s*(?:graph|flowchart|stateDiagram(?:-v2)?|classDiagram)\b/.test(line))
    if (declaration < 0) return diagram
    lines.splice(declaration + 1, 0, ...classDefs)
    return lines.join('\n')
}

// ─── Browser Management ──────────────────────────────────────────────────────

let browserInstance: Browser | null = null
let renderCount = 0
let activeRenders = 0
let onBrowserIdle: (() => void) | undefined

// Recycle the browser after this many renders to prevent Chromium memory bloat.
// Each page render leaks a small amount of memory; after ~50 renders the
// Chromium process can exceed 1 GB and crash with ConnectionClosedError.
const RECYCLE_AFTER = 50

function findChromium(): string {
    const candidates = [
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium',
        '/usr/bin/google-chrome-stable',
        '/usr/bin/google-chrome',
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    ]
    for (const path of candidates) {
        if (existsSync(path)) return path
    }
    throw new Error(
        'Chromium not found. Install chromium-browser or set CHROMIUM_PATH env var.\n' +
        'Tried: ' + candidates.join(', ')
    )
}

async function launchBrowser(): Promise<Browser> {
    const executablePath = process.env.CHROMIUM_PATH || findChromium()
    return puppeteer.launch({
        executablePath,
        headless: true,
        protocolTimeout: 120_000,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
        ],
    })
}

let browserLock: Promise<void> = Promise.resolve()

async function getBrowser(): Promise<Browser> {
    // Serialize browser lifecycle operations so concurrent workers don't
    // race on recycling/reconnection. Each caller waits for any in-flight
    // lifecycle op before checking browser state.
    let releaseLock: () => void
    const prevLock = browserLock
    browserLock = new Promise<void>(resolve => { releaseLock = resolve })
    await prevLock

    try {
        // Recycle browser if render count exceeded — prevents memory bloat
        if (browserInstance && renderCount >= RECYCLE_AFTER) {
            if (activeRenders > 0) {
                await new Promise<void>(resolve => { onBrowserIdle = resolve })
            }
            await closeBrowser()
        }

        // Check if existing browser is still connected
        if (browserInstance && !browserInstance.connected) {
            // Browser crashed — clean up and relaunch
            const proc = browserInstance.process()
            if (proc && !proc.killed) {
                try { proc.kill('SIGKILL') } catch { /* already dead */ }
            }
            browserInstance = null
        }

        if (!browserInstance) {
            browserInstance = await launchBrowser()
            renderCount = 0
        }
        activeRenders++
        return browserInstance
    } finally {
        releaseLock!()
    }
}

function finishRender(): void {
    renderCount++
    activeRenders--
    if (activeRenders === 0) {
        const notifyIdle = onBrowserIdle
        onBrowserIdle = undefined
        notifyIdle?.()
    }
}

export async function closeBrowser(): Promise<void> {
    if (browserInstance) {
        const browser = browserInstance
        browserInstance = null
        const proc = browser.process()
        try {
            // Race close() against a 5s timeout to prevent deploy hangs
            await Promise.race([
                browser.close(),
                new Promise<void>((_, reject) =>
                    setTimeout(() => reject(new Error('Browser close timed out')), 5_000)
                ),
            ])
        } catch {
            // close() hung or failed — expected with Puppeteer pipe handles
        }
        // Always force-kill the Chromium process. Puppeteer v24 leaves dangling
        // pipe/socket handles after browser.close() that prevent Node from exiting.
        // Without this, the build script hangs indefinitely after rendering.
        if (proc && !proc.killed) {
            try { proc.kill('SIGKILL') } catch { /* already dead */ }
        }
    }
}

// ─── Font Loading ────────────────────────────────────────────────────────────

let fontCssCache: string | null = null

async function getFontCss(): Promise<string> {
    if (fontCssCache) return fontCssCache

    const fontFiles: { name: string; weight: number; file: string; family?: string }[] = [
        { name: 'Inter', weight: 400, file: 'Inter-Regular.ttf' },
        { name: 'Inter', weight: 600, file: 'Inter-SemiBold.ttf' },
        { name: 'Inter', weight: 700, file: 'Inter-Bold.ttf' },
        { name: 'JetBrains Mono', weight: 400, file: 'JetBrainsMono-Regular.ttf' },
        { name: 'Noto Sans Math', weight: 400, file: 'NotoSansMath-Regular.ttf' },
    ]

    const fontFaces: string[] = []
    for (const font of fontFiles) {
        const fontPath = join(FONT_DIR, font.file)
        if (existsSync(fontPath)) {
            const buffer = await readFile(fontPath)
            const base64 = buffer.toString('base64')
            fontFaces.push(`
                @font-face {
                    font-family: '${font.name}';
                    src: url('data:font/ttf;base64,${base64}') format('truetype');
                    font-weight: ${font.weight};
                    font-style: normal;
                }
            `)
        }
    }

    fontCssCache = fontFaces.join('\n')
    return fontCssCache
}

// ─── Core Render ─────────────────────────────────────────────────────────────

/** Pixels per CSS pixel in book captures: 300 ppi or better at the size the book prints them. */
export const BOOK_DIAGRAM_SCALE = 4

export interface RenderResult {
    width: number
    height: number
    /** Text sizes in capture CSS pixels, before the PNG's device-pixel scaling. */
    textLabels?: Array<{ text: string; pixels: number }>
    /** A self-contained print SVG. Null when the diagram must stay raster, because it contains math. */
    vector?: string | null
}

export interface RenderDiagramOptions {
    /** Omit website presentation chrome and crop to the SVG for print. */
    book?: boolean
    /** Measure actual label sizes for inline readability audits without changing the image. */
    measureLabels?: boolean
}

/** HTML labels embed in an SVG image only as a bitmap, so print uses SVG text unless the labels hold math. */
function diagramNeedsHtmlLabels(diagram: string, book: boolean): boolean {
    return !book || /\$\$/.test(diagram)
}

/**
 * Render a Mermaid diagram string to a PNG file.
 *
 * @param diagram - Raw Mermaid definition (e.g., "graph LR\n  A --> B")
 * @param theme - 'dark' or 'light'
 * @param outputPath - Where to write the PNG
 * @returns Dimensions of the rendered image
 */
export async function renderDiagram(
    diagram: string,
    theme: ThemeMode,
    outputPath: string,
    options: RenderDiagramOptions = {},
): Promise<RenderResult> {
    const browser = await getBrowser()
    const page = await browser.newPage().catch(error => {
        finishRender()
        throw error
    })

    try {
        const themeConfig = THEMES[theme]
        const book = options.book === true
        const fontCss = book ? bookFontCss() : await getFontCss()
        const math = await mathDependencies

        // Keep module URLs stable while rendering from the pinned local packages.
        // A book build must not depend on hundreds of successful CDN requests.
        await page.setRequestInterception(true)
        page.on('request', request => {
            const source = request.url().startsWith(math.mermaidUrl)
                ? { url: math.mermaidUrl, directory: math.mermaidDist }
                : request.url().startsWith(math.katexUrl)
                    ? { url: math.katexUrl, directory: math.katexDist }
                    : null
            if (!source) {
                void request.continue().catch(() => {})
                return
            }
            const name = decodeURIComponent(request.url().slice(source.url.length).split(/[?#]/)[0])
            const path = resolve(source.directory, name)
            if (!path.startsWith(source.directory + sep)) {
                void request.abort().catch(() => {})
                return
            }
            const contentType = extname(path) === '.css' ? 'text/css'
                : /\.(?:m?js)$/.test(path) ? 'text/javascript'
                    : 'application/octet-stream'
            void readFile(path).then(body => request.respond({
                status: 200, contentType, body,
                headers: { 'Access-Control-Allow-Origin': '*' },
            })).catch(() => request.abort()).catch(() => {})
        })

        // Set viewport large enough to avoid wrapping
        await page.setViewport({ width: 1600, height: 1200, deviceScaleFactor: book ? BOOK_DIAGRAM_SCALE : 2 })

        const html = `<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="${math.katexUrl}katex.min.css" crossorigin="anonymous" />
    <script type="importmap">${math.importMap}</script>
    <style>
        ${fontCss}
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            background: transparent;
            font-family: Inter, system-ui, sans-serif;
            display: flex;
            justify-content: center;
            align-items: flex-start;
            min-height: 100vh;
            padding: ${book ? '16px' : '32px'};
        }
        #container {
            display: inline-block;
            padding: ${book ? 0 : 8}px;
            border: 0;
            background: transparent;
        }
        .node rect {
            rx: 4 !important;
            ry: 4 !important;
        }
        #container svg * { filter: none !important; }
        .edgePath path.path, .flowchart-link {
            stroke-width: 1.25;
        }
        .edgeLabel {
            font-size: ${book ? 16 : 14}px !important;
        }
        .cluster rect {
            rx: 6 !important;
            ry: 6 !important;
            stroke-dasharray: 4 4;
        }
        .cluster .nodeLabel {
            font-weight: 600 !important;
        }
        .nodeLabel {
            font-weight: 500 !important;
            letter-spacing: -0.01em;
        }
        ${Object.entries(PALETTE).map(([name, entry]) => {
            const color = entry[theme].color
            return `.node.${name} .nodeLabel, .node.${name} .nodeLabel p { color: ${color} !important; } .node.${name} text { fill: ${color} !important; }`
        }).join('\n')}
        /* KaTeX math styling — blend with diagram font */
        .katex {
            font-size: 1em !important;
        }
        .katex .mathnormal,
        .katex .mathit,
        .katex .mathdefault {
            font-family: 'Noto Sans Math', 'KaTeX_Math', serif !important;
        }
        /* Prevent Mermaid nodes from clipping KaTeX-rendered text */
        .node foreignObject,
        .edgeLabel foreignObject,
        .cluster foreignObject {
            overflow: visible !important;
        }
        .node foreignObject div,
        .edgeLabel foreignObject div,
        .cluster foreignObject div {
            overflow: visible !important;
        }
    </style>
</head>
<body>
    <div id="container"></div>
    <script type="module">
        import mermaid from '${math.mermaidUrl}mermaid.esm.min.mjs';

        mermaid.initialize({
            startOnLoad: false,
            ${book ? '' : "layout: 'dagre',"}
            htmlLabels: ${diagramNeedsHtmlLabels(diagram, book)},
            theme: '${themeConfig.mermaidTheme}',
            themeVariables: ${JSON.stringify({ ...themeConfig.themeVariables, ...(book ? { fontSize: '16px' } : {}) })},
            flowchart: {
                curve: 'basis',
                padding: ${book ? 12 : 14},
                nodeSpacing: ${book ? 24 : diagram.includes('$$') ? 48 : 28},
                rankSpacing: ${book ? 28 : 36},
                ${book ? '' : 'minNodeWidth: 0,'}
                ${book ? '' : 'inheritDir: true,'}
                ${book ? 'subGraphTitleMargin: { top: 6, bottom: 12 }, wrappingWidth: 280,' : ''}
                htmlLabels: ${diagramNeedsHtmlLabels(diagram, book)},
                useMaxWidth: false,
            },
            sequence: {
                useMaxWidth: false,
                ${book ? `actorFontSize: 16,
                messageFontSize: 16,
                noteFontSize: 16,
                actorMargin: 24,
                diagramMarginX: 8,
                diagramMarginY: 8,
                messageMargin: 24,` : `width: 80,
                actorMargin: 16,
                diagramMarginX: 8,
                diagramMarginY: 8,
                messageMargin: 24,
                actorFontSize: 16,
                messageFontSize: 16,
                noteFontSize: 16,
                wrap: true,
                wrapPadding: 4,
                mirrorActors: false,`}
            },
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: 16,
            forceLegacyMathML: true,
        });

        try {
            const diagram = ${JSON.stringify(injectClassDefs(diagram.trim(), theme))};
            const id = 'diagram-' + Date.now();
            const { svg } = await mermaid.render(id, diagram);
            document.getElementById('container').innerHTML = svg;

            // Size the SVG properly — allow overflow for math glyphs
            const svgEl = document.querySelector('#container svg');
            if (svgEl) {
                svgEl.style.maxWidth = '100%';
                svgEl.style.height = 'auto';
                svgEl.style.overflow = 'visible';
                svgEl.style.background = 'transparent';
            }

            // Post-render: expand node rects to fit KaTeX-rendered text
            document.querySelectorAll('.node').forEach(node => {
                const fo = node.querySelector('foreignObject');
                const rect = node.querySelector('rect') || node.querySelector('polygon');
                if (!fo || !rect) return;
                const textEl = fo.querySelector('.nodeLabel');
                if (!textEl) return;

                // Check if this node contains KaTeX math
                const hasMath = textEl.querySelector('.katex') !== null;
                if (!hasMath) return;

                const foWidth = parseFloat(fo.getAttribute('width'));
                const foHeight = parseFloat(fo.getAttribute('height'));

                // Always add generous padding for math nodes — italic glyphs
                // and subscripts extend beyond what scrollWidth reports
                const extraW = 32;
                const extraH = 8;
                const newW = foWidth + extraW;
                const newH = foHeight + extraH;

                fo.setAttribute('width', String(newW));
                fo.setAttribute('height', String(newH));
                fo.setAttribute('x', String(parseFloat(fo.getAttribute('x')) - extraW / 2));
                fo.setAttribute('y', String(parseFloat(fo.getAttribute('y')) - extraH / 2));
                if (rect.tagName === 'rect') {
                    rect.setAttribute('width', String(parseFloat(rect.getAttribute('width')) + extraW));
                    rect.setAttribute('height', String(parseFloat(rect.getAttribute('height')) + extraH));
                    rect.setAttribute('x', String(parseFloat(rect.getAttribute('x')) - extraW / 2));
                    rect.setAttribute('y', String(parseFloat(rect.getAttribute('y')) - extraH / 2));
                }
            });

            // Also expand edge label foreignObjects for math content
            document.querySelectorAll('.edgeLabel').forEach(label => {
                const fo = label.querySelector('foreignObject');
                if (!fo) return;
                const hasMath = fo.querySelector('.katex') !== null;
                if (!hasMath) return;
                const foWidth = parseFloat(fo.getAttribute('width'));
                const foHeight = parseFloat(fo.getAttribute('height'));
                const extraW = 24;
                const extraH = 4;
                fo.setAttribute('width', String(foWidth + extraW));
                fo.setAttribute('height', String(foHeight + extraH));
                fo.setAttribute('x', String(parseFloat(fo.getAttribute('x')) - extraW / 2));
                fo.setAttribute('y', String(parseFloat(fo.getAttribute('y')) - extraH / 2));
            });

            window.__RENDER_DONE__ = true;
        } catch (err) {
            window.__RENDER_ERROR__ = err.message || String(err);
            window.__RENDER_DONE__ = true;
        }
    </script>
</body>
</html>`

        await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 30000 })

        // Wait for render completion
        await page.waitForFunction('window.__RENDER_DONE__ === true', { timeout: 30000 })

        // Check for errors
        const renderError = await page.evaluate(() => (window as unknown as { __RENDER_ERROR__?: string }).__RENDER_ERROR__)
        if (renderError) {
            throw new Error(`Mermaid render error: ${renderError}`)
        }

        await page.evaluate(() => document.fonts.ready)

        // Print captures the SVG; website captures include its transparent gutter.
        const container = await page.$(book ? '#container svg' : '#container')
        if (!container) {
            throw new Error('Container element not found after render')
        }

        const captureBounds = async () => book ? container.evaluate(element => {
            const svg = element as SVGSVGElement
            const bounds = svg.getBBox()
            const matrix = svg.getScreenCTM()
            if (!matrix) return null
            // Include post-render node expansion for KaTeX, beyond the original viewBox.
            const corners = [
                new DOMPoint(bounds.x, bounds.y),
                new DOMPoint(bounds.x + bounds.width, bounds.y),
                new DOMPoint(bounds.x, bounds.y + bounds.height),
                new DOMPoint(bounds.x + bounds.width, bounds.y + bounds.height),
            ].map(point => point.matrixTransform(matrix))
            const x = Math.min(...corners.map(point => point.x))
            const y = Math.min(...corners.map(point => point.y))
            return { x, y, width: Math.max(...corners.map(point => point.x)) - x, height: Math.max(...corners.map(point => point.y)) - y }
        }) : container.boundingBox()
        let boundingBox = await captureBounds()
        if (!boundingBox) {
            throw new Error('Could not determine container dimensions')
        }

        // Ensure output directory exists
        await mkdir(dirname(outputPath), { recursive: true })

        // Screenshot with a small buffer to avoid clipping KaTeX glyphs
        const pad = book ? 4 : 8
        const viewport = page.viewport()
        if (viewport) {
            const width = Math.max(viewport.width, Math.ceil(boundingBox.x + boundingBox.width + pad))
            const height = Math.max(viewport.height, Math.ceil(boundingBox.y + boundingBox.height + pad))
            if (width !== viewport.width || height !== viewport.height) {
                await page.setViewport({ ...viewport, width, height })
                boundingBox = await captureBounds()
                if (!boundingBox) throw new Error('Could not determine resized container dimensions')
            }
        }
        await page.screenshot({
            path: outputPath,
            type: 'png',
            omitBackground: true,
            clip: {
                x: Math.max(0, boundingBox.x - pad),
                y: Math.max(0, boundingBox.y - pad),
                width: boundingBox.width + pad * 2,
                height: boundingBox.height + pad * 2,
            },
        })

        const textLabels = book || options.measureLabels ? await container.evaluate(element => Array.from(element.querySelectorAll('text, .nodeLabel, .edgeLabel')).flatMap(label => {
            const text = label.textContent?.replace(/\s+/g, ' ').trim()
            if (!text) return []
            const style = getComputedStyle(label)
            if (style.display === 'none' || style.visibility === 'hidden') return []
            const graphics = label.closest('foreignObject') ?? (label instanceof SVGGraphicsElement ? label : null)
            const matrix = graphics?.getScreenCTM()
            const scale = matrix ? Math.hypot(matrix.a, matrix.b) : 1
            return [{ text, pixels: Number.parseFloat(style.fontSize) * scale }]
        })) : undefined

        // Print keeps diagrams as vectors. The page's stylesheet goes inside the SVG, because an
        // image cannot see the document that holds it. KaTeX would also need its own fonts, so
        // diagrams with math stay raster.
        const vector = book ? await container.evaluate((element, padding) => {
            const svg = element as SVGSVGElement
            if (svg.querySelector('.katex, foreignObject')) return null
            const bounds = svg.getBBox()
            const clone = svg.cloneNode(true) as SVGSVGElement
            const width = bounds.width + padding * 2
            const height = bounds.height + padding * 2
            clone.removeAttribute('style')
            clone.setAttribute('viewBox', `${bounds.x - padding} ${bounds.y - padding} ${width} ${height}`)
            clone.setAttribute('width', String(width))
            clone.setAttribute('height', String(height))
            const style = document.createElementNS('http://www.w3.org/2000/svg', 'style')
            // Only the sans and monospace faces can appear in a diagram, and each face adds about 1 MB.
            style.textContent = (document.head.querySelector('style')?.textContent ?? '').replace(/@font-face\s*\{\s*font-family:\s*"Source Serif[^}]*\}/g, '')
            clone.insertBefore(style, clone.firstChild)
            return new XMLSerializer().serializeToString(clone)
        }, pad) : undefined

        return {
            width: Math.round(boundingBox.width),
            height: Math.round(boundingBox.height),
            ...(textLabels ? { textLabels } : {}),
            ...(book ? { vector } : {}),
        }
    } finally {
        try { await page.close() } catch { /* browser may have crashed */ }
        finishRender()
    }
}
