import React from "react"
import { Resvg } from "@resvg/resvg-js"
import { isSafeContentImageFallbackUrl } from "./content-assets"
import {
    Badge,
    BadgePill,
    BarChart,
    Box,
    CalloutCard,
    Card,
    ChartFrame,
    CodeBlock,
    Column,
    Comparison,
    Connector,
    DataTable,
    DetailList,
    DonutChart,
    EquationCard,
    Flow,
    FlowArrow,
    GraphDiagram,
    Grid,
    Heatmap,
    Icon,
    IntervalPlot,
    KeyValueList,
    LayeredNetwork,
    LineChart,
    Matrix,
    MetricCard,
    MiniBarChart,
    Panel,
    Pipeline,
    ProgressList,
    QuadrantChart,
    Row,
    ScatterPlot,
    Scene,
    Stack,
    StackedBar,
    StatusList,
    StepCard,
    TextLabel,
    Tile,
    TileGrid,
    TiledMatrix,
    Timeline,
    ToneStrip,
    TreeDiagram,
    ValuePill,
    WindowFrame,
    detectBackgroundColor,
    detectContentBounds,
    detectOverflow,
    getThemeColors,
    renderToSvg,
    type ThemeColors,
    type ThemeMode,
} from "vizmatic"

export const VIZMATIC_SPEC_MAX_BYTES = 16 * 1024
export const VIZMATIC_MAX_DEPTH = 6
export const VIZMATIC_MAX_NODES = 50
const VIZMATIC_MAX_DATA_DEPTH = 6
const VIZMATIC_MAX_DATA_VALUES = 400
const VIZMATIC_MAX_SVG_BYTES = 1_000_000
const VIZMATIC_CROP_PADDING = 24
const VIZMATIC_CROP_THRESHOLD = 0.1

const TONES = new Set([
    "blue", "purple", "green", "warm", "cyan", "pink", "red", "critical",
    "neutral", "sunset", "ocean", "dark",
])
const THEMES = new Set<ThemeMode>(["dark", "light"])

type JsonRecord = Record<string, unknown>

export interface PersonalizedVizmaticNode {
    type: keyof typeof COMPONENTS
    props?: JsonRecord
    children?: PersonalizedVizmaticNode[]
}

export interface PersonalizedVizmaticSpec {
    width: number
    height: number
    alt?: string
    caption?: string
    fallbackDarkSrc?: string
    fallbackLightSrc?: string
    root: PersonalizedVizmaticNode
}

type VizmaticComponent = React.ComponentType<Record<string, unknown>>

const COMPONENTS = {
    Scene,
    Row,
    Column,
    Stack,
    Panel,
    Card,
    WindowFrame,
    TextLabel,
    Icon,
    ToneStrip,
    Box,
    Badge,
    StepCard,
    MetricCard,
    CalloutCard,
    ValuePill,
    BadgePill,
    EquationCard,
    DetailList,
    ProgressList,
    StatusList,
    Timeline,
    KeyValueList,
    Comparison,
    DataTable,
    Grid,
    CodeBlock,
    Tile,
    TileGrid,
    Flow,
    FlowArrow,
    Connector,
    Pipeline,
    LayeredNetwork,
    GraphDiagram,
    TreeDiagram,
    Matrix,
    Heatmap,
    TiledMatrix,
    ChartFrame,
    DonutChart,
    BarChart,
    LineChart,
    ScatterPlot,
    QuadrantChart,
    IntervalPlot,
    StackedBar,
    MiniBarChart,
} as unknown as Record<string, VizmaticComponent>

const PROPS: Record<keyof typeof COMPONENTS, ReadonlySet<string>> = {
    Scene: set("title", "subtitle", "padding", "gap", "justify", "align", "contentWidth"),
    Row: set("gap", "align", "justify", "wrap", "width", "height"),
    Column: set("gap", "align", "justify", "wrap", "width", "height"),
    Stack: set("direction", "gap", "align", "wrap"),
    Panel: set("title", "subtitle", "tone", "width", "minWidth", "height", "minHeight", "padding", "radius", "gap", "align", "justify", "shadow", "titleFontSize", "accentWidth", "accentHeight"),
    Card: set("title", "subtitle", "tone", "width", "minWidth", "height", "minHeight", "padding", "radius", "gap", "align", "justify", "shadow"),
    WindowFrame: set("title", "variant", "tone", "dots", "width", "minWidth", "height", "minHeight", "padding", "radius", "shadow"),
    TextLabel: set("text", "variant", "fontSize", "fontWeight", "width", "align", "math", "mono"),
    Icon: set("name", "tone", "size", "strokeWidth", "label", "muted"),
    ToneStrip: set("tone", "width", "height"),
    Box: set("label", "width", "height", "fontSize", "sublabel", "icon", "radius", "outlined"),
    Badge: set("label"),
    StepCard: set("title", "subtitle", "eyebrow", "tone", "width", "minWidth", "minHeight", "padding", "radius", "shadow", "align", "math"),
    MetricCard: set("label", "value", "tone", "detail", "width", "minWidth", "minHeight", "padding", "radius", "shadow", "align", "math", "valueMono", "valueFontSize"),
    CalloutCard: set("title", "detail", "tone", "width", "minHeight", "padding", "titleFontSize", "detailFontSize", "filled", "align"),
    ValuePill: set("label", "value", "tone", "detail", "width", "math"),
    BadgePill: set("text", "tone", "width", "minWidth", "height", "padding", "radius", "fontSize", "mono", "filled", "math"),
    EquationCard: set("title", "formula", "tone", "result", "detail", "width", "height", "math", "align"),
    DetailList: set("items", "tone", "gap", "padding", "fontSize", "mono", "math"),
    ProgressList: set("rows", "gap", "labelWidth", "valueWidth", "barHeight", "fontSize"),
    StatusList: set("rows", "gap", "boxed", "fontSize", "width", "math"),
    Timeline: set("events", "title", "subtitle", "direction", "width", "eventWidth", "gap", "markerSize", "math"),
    KeyValueList: set("rows", "title", "width", "minWidth", "keyWidth", "gap", "fontSize", "divider", "keyMono", "math"),
    Comparison: set("sides", "divider", "gap", "sideWidth", "minHeight", "align", "math"),
    DataTable: set("rows", "cellWidth", "firstColWidth", "cellHeight", "gap", "headerRows", "headerCols", "fontSize", "math"),
    Grid: set("rows", "cellWidth", "cellHeight", "gap", "radius", "fontSize", "math", "headerRows", "headerCols"),
    CodeBlock: set("lines", "title", "tone", "width", "minWidth", "fontSize", "showLineNumbers", "padding", "radius", "shadow", "math"),
    Tile: set("title", "subtitle", "eyebrow", "icon", "tone", "lines", "width", "minHeight", "align", "padding", "radius", "shadow", "math"),
    TileGrid: set("tiles", "columns", "gap", "tileWidth", "minHeight", "align", "math"),
    Flow: set("stages", "direction", "gap", "connectorLength", "connectorTone", "align", "math"),
    FlowArrow: set("direction", "label", "length", "tone"),
    Connector: set("direction", "label", "length", "tone"),
    Pipeline: set("stages", "title"),
    LayeredNetwork: set("layers", "activePath", "annotations", "formula", "legend", "width", "height", "nodeSize", "showFormula"),
    GraphDiagram: set("nodes", "edges", "width", "height", "nodeWidth", "nodeHeight", "labelFontSize", "detailFontSize", "arrowSize", "padding"),
    TreeDiagram: set("root", "title", "subtitle", "width", "height", "nodeWidth", "nodeHeight", "levelGap", "siblingGap", "padding", "math"),
    Matrix: set("data", "rowLabels", "colLabels", "labels", "title", "cellSize", "cellWidth", "cellHeight", "rowLabelWidth", "format"),
    Heatmap: set("data", "xLabels", "yLabels", "labels", "title", "cellSize", "cellWidth", "cellHeight", "rowLabelWidth"),
    TiledMatrix: set("rows", "cols", "regions", "title", "subtitle", "cellSize", "gap", "tone", "muted", "crossedOut"),
    ChartFrame: set("title", "subtitle", "footer", "width", "height", "padding"),
    DonutChart: set("segments", "title", "subtitle", "width", "height", "size", "thickness", "format", "showLegend", "footer"),
    BarChart: set("data", "title", "subtitle", "width", "height", "min", "max", "format", "showGrid", "showValues", "yAxisLabel", "footer"),
    LineChart: set("series", "title", "subtitle", "width", "height", "labels", "min", "max", "format", "showGrid", "showPoints", "yAxisLabel", "footer"),
    ScatterPlot: set("points", "title", "subtitle", "width", "height", "xMin", "xMax", "yMin", "yMax", "xAxisLabel", "yAxisLabel", "formatX", "formatY", "showGrid", "footer"),
    QuadrantChart: set("points", "regions", "title", "subtitle", "width", "height", "xAxisLabel", "yAxisLabel", "footer"),
    IntervalPlot: set("data", "title", "subtitle", "width", "height", "min", "max", "format", "axisLabel", "footer"),
    StackedBar: set("segments", "width", "height", "title", "subtitle", "showLegend"),
    MiniBarChart: set("data", "max", "minBarHeight", "height", "barWidth", "gap", "radius", "fontSize", "showValues"),
}

const REQUIRED: Partial<Record<keyof typeof COMPONENTS, readonly string[]>> = {
    Panel: ["title"], TextLabel: ["text"], Icon: ["name"], ToneStrip: ["tone"],
    Box: ["label"], Badge: ["label"], StepCard: ["title"], MetricCard: ["label", "value"],
    ValuePill: ["label", "value"], BadgePill: ["text"], EquationCard: ["title", "formula"],
    DetailList: ["items"], ProgressList: ["rows"], StatusList: ["rows"], Timeline: ["events"],
    KeyValueList: ["rows"], Comparison: ["sides"], DataTable: ["rows"], Grid: ["rows"],
    CodeBlock: ["lines"], Tile: ["title"], TileGrid: ["tiles"], Flow: ["stages"],
    Pipeline: ["stages"], LayeredNetwork: ["layers"], GraphDiagram: ["nodes", "edges"],
    TreeDiagram: ["root"], Matrix: ["data"], Heatmap: ["data", "xLabels", "yLabels"],
    TiledMatrix: ["rows", "cols"], DonutChart: ["segments"], BarChart: ["data"],
    LineChart: ["series"], ScatterPlot: ["points"], QuadrantChart: ["points", "regions"],
    IntervalPlot: ["data"], StackedBar: ["segments"], MiniBarChart: ["data"],
}

const CHILDREN_ALLOWED = new Set<keyof typeof COMPONENTS>([
    "Scene", "Row", "Column", "Stack", "Panel", "Card", "WindowFrame", "CalloutCard", "ChartFrame",
])
const WITHOUT_THEME = new Set<keyof typeof COMPONENTS>(["Row", "Column", "Stack"])
const FORBIDDEN_DATA_KEY = /^(?:__proto__|prototype|constructor|children|c|style|contentStyle|bodyStyle|background|backgroundColor|borderColor|color|valueColor|gradient|fill|stroke|src|href|url|image|watermark|brand|dangerouslySetInnerHTML)$/i
const URL_VALUE = /(?:https?:|data:|javascript:|blob:|file:|\/\/)/i
const HTML_VALUE = /<\/?[a-z][^>]*>/i

function set(...items: string[]) {
    return new Set(items)
}

function isRecord(value: unknown): value is JsonRecord {
    if (value === null || typeof value !== "object" || Array.isArray(value)) return false
    const prototype = Object.getPrototypeOf(value)
    return prototype === Object.prototype || prototype === null
}

function isSafeString(value: string) {
    return value.length <= 1_000 && !URL_VALUE.test(value) && !HTML_VALUE.test(value)
}

function inspectJsonValue(
    value: unknown,
    seen: WeakSet<object>,
    state: { values: number },
    depth = 0,
): boolean {
    state.values += 1
    if (state.values > VIZMATIC_MAX_DATA_VALUES || depth > VIZMATIC_MAX_DATA_DEPTH) return false
    if (typeof value === "string") return isSafeString(value)
    if (typeof value === "number") return Number.isFinite(value) && Math.abs(value) <= 10_000
    if (typeof value === "boolean" || value === null) return true
    if (typeof value !== "object") return false
    if (seen.has(value)) return false
    seen.add(value)
    if (Array.isArray(value)) {
        if (value.length > VIZMATIC_MAX_NODES) return false
        return value.every((item) => inspectJsonValue(item, seen, state, depth + 1))
    }
    if (!isRecord(value) || Object.keys(value).length > 24) return false
    return Object.entries(value).every(([key, item]) => (
        /^[A-Za-z][A-Za-z0-9]*$/.test(key)
        && !FORBIDDEN_DATA_KEY.test(key)
        && inspectJsonValue(item, seen, state, depth + 1)
    ))
}

function isDimension(value: unknown) {
    if (typeof value === "number") return Number.isFinite(value) && value >= 1 && value <= 1_200
    if (typeof value !== "string") return false
    const percent = value.match(/^(\d{1,3})%$/)
    if (percent) return Number(percent[1]) >= 1 && Number(percent[1]) <= 100
    const lengths = value.match(/^\d{1,4}(?:px)?(?:\s+\d{1,4}px){0,3}$/)?.[0].match(/\d+/g)
    return Boolean(lengths?.every((length) => Number(length) <= 1_200))
}

function isPadding(value: unknown) {
    if (typeof value === "number") return Number.isFinite(value) && value >= 0 && value <= 64
    if (typeof value !== "string" || !/^\d{1,3}px(?:\s+\d{1,3}px){0,3}$/.test(value)) return false
    return value.match(/\d+/g)!.every((length) => Number(length) <= 64)
}

function boundedNumber(value: unknown, minimum: number, maximum: number) {
    return typeof value === "number" && Number.isFinite(value) && value >= minimum && value <= maximum
}

function validateKnownProp(component: keyof typeof COMPONENTS, key: string, value: unknown) {
    if (key === "tone" || key === "connectorTone") return typeof value === "string" && TONES.has(value)
    if (["width", "minWidth", "height", "minHeight", "contentWidth", "eventWidth", "sideWidth", "keyWidth", "tileWidth"].includes(key)) {
        return isDimension(value)
    }
    if (key === "padding") return isPadding(value)
    if (["fontSize", "titleFontSize", "detailFontSize", "valueFontSize", "labelFontSize"].includes(key)) {
        return boundedNumber(value, 6, 48)
    }
    if (["gap", "radius", "accentWidth", "accentHeight", "strokeWidth", "arrowSize", "thickness"].includes(key)) {
        return boundedNumber(value, 0, 64)
    }
    if (["cellWidth", "firstColWidth", "cellHeight", "cellSize", "rowLabelWidth", "barWidth", "barHeight", "minBarHeight", "markerSize", "connectorLength", "length", "nodeSize", "nodeWidth", "nodeHeight", "levelGap", "siblingGap", "size"].includes(key)) {
        return boundedNumber(value, 1, 400)
    }
    if (["columns", "headerRows", "headerCols", "gridCount"].includes(key)) {
        return Number.isInteger(value) && boundedNumber(value, 0, 20)
    }
    if (["title", "subtitle", "eyebrow", "label", "detail", "text", "formula", "result", "footer", "legend", "xAxisLabel", "yAxisLabel", "axisLabel", "centerLabel", "centerValue", "icon", "sublabel"].includes(key)) {
        return (typeof value === "string" && isSafeString(value)) || (typeof value === "number" && Number.isFinite(value))
    }
    if (key === "name") {
        return typeof value === "string" && new Set(["agent", "chart", "check", "code", "database", "file", "git", "globe", "image", "layers", "lock", "play", "spark", "terminal", "tool", "warning"]).has(value)
    }
    if (key === "direction") {
        if (component === "Stack") return value === "vertical" || value === "horizontal"
        return ["vertical", "horizontal", "down", "right", "up", "left"].includes(String(value))
    }
    if (key === "align") return ["start", "center", "end", "stretch", "left", "right"].includes(String(value))
    if (key === "justify") return ["center", "flex-start", "space-between", "space-around", "start", "end"].includes(String(value))
    if (key === "variant") return ["window", "browser", "terminal"].includes(String(value))
    if (key === "format" || key === "formatX" || key === "formatY") return ["decimal", "percent", "integer", "compact"].includes(String(value))
    return true
}

interface VizmaticValidationState {
    nodes: number
    values: number
}

function validateCollectionLimits(type: keyof typeof COMPONENTS, key: string, value: unknown) {
    if (!Array.isArray(value)) return true
    if (["Matrix", "Heatmap"].includes(type) && key === "data") {
        return value.length <= 12
            && value.every((row) => Array.isArray(row) && row.length <= 12)
    }
    if (["DataTable", "Grid"].includes(type) && key === "rows") {
        return value.length <= 20
            && value.every((row) => Array.isArray(row) && row.length <= 12)
    }
    if (type === "LineChart" && key === "series") {
        return value.length <= 8
            && value.every((series) => isRecord(series) && Array.isArray(series.points) && series.points.length <= 30)
    }
    if (["ScatterPlot", "QuadrantChart"].includes(type) && key === "points") return value.length <= 50
    if (type === "GraphDiagram" && key === "nodes") return value.length <= 30
    if (type === "GraphDiagram" && key === "edges") return value.length <= 60
    return value.length <= 50
}

function validateProps(
    type: keyof typeof COMPONENTS,
    value: unknown,
    state: VizmaticValidationState,
): value is JsonRecord {
    if (value === undefined) return (REQUIRED[type]?.length ?? 0) === 0
    if (!isRecord(value)) return false
    const allowed = PROPS[type]
    if (!Object.keys(value).every((key) => allowed.has(key) && !FORBIDDEN_DATA_KEY.test(key))) return false
    if (REQUIRED[type] && !REQUIRED[type].every((key) => Object.hasOwn(value, key))) return false
    if (!inspectJsonValue(value, new WeakSet(), state)) return false
    return Object.entries(value).every(([key, item]) => (
        validateCollectionLimits(type, key, item) && validateKnownProp(type, key, item)
    ))
}

function validateNode(
    value: unknown,
    depth: number,
    state: VizmaticValidationState,
): value is PersonalizedVizmaticNode {
    if (depth > VIZMATIC_MAX_DEPTH || !isRecord(value)) return false
    if (!Object.keys(value).every((key) => key === "type" || key === "props" || key === "children")) return false
    if (typeof value.type !== "string" || !Object.hasOwn(COMPONENTS, value.type)) return false
    const type = value.type as keyof typeof COMPONENTS
    state.nodes += 1
    if (state.nodes > VIZMATIC_MAX_NODES || !validateProps(type, value.props, state)) return false

    if (value.children === undefined) return type !== "Scene"
    if (!CHILDREN_ALLOWED.has(type) || !Array.isArray(value.children) || value.children.length === 0) return false
    return value.children.every((child) => validateNode(child, depth + 1, state))
}

export function validatePersonalizedVizmaticSpec(value: unknown): value is PersonalizedVizmaticSpec {
    if (!isRecord(value)) return false
    if (!Object.keys(value).every((key) => ["width", "height", "alt", "caption", "fallbackDarkSrc", "fallbackLightSrc", "root"].includes(key))) return false
    if (!Number.isInteger(value.width) || (value.width as number) < 640 || (value.width as number) > 1_200) return false
    if (!Number.isInteger(value.height) || (value.height as number) < 360 || (value.height as number) > 720) return false
    if (value.alt !== undefined && (typeof value.alt !== "string" || value.alt.length > 1_000 || !isSafeString(value.alt))) return false
    if (value.caption !== undefined && (typeof value.caption !== "string" || value.caption.length > 500 || !isSafeString(value.caption))) return false
    if (value.fallbackDarkSrc !== undefined && !isSafeFallbackPath(value.fallbackDarkSrc)) return false
    if (value.fallbackLightSrc !== undefined && !isSafeFallbackPath(value.fallbackLightSrc)) return false
    if (!isRecord(value.root) || value.root.type !== "Scene") return false

    try {
        if (new TextEncoder().encode(JSON.stringify(value)).byteLength > VIZMATIC_SPEC_MAX_BYTES) return false
    } catch {
        return false
    }
    return validateNode(value.root, 1, { nodes: 0, values: 0 })
}

function isSafeFallbackPath(value: unknown): value is string {
    return isSafeContentImageFallbackUrl(value)
}

export function validatePersonalizedVizmaticTheme(value: unknown): value is ThemeMode {
    return typeof value === "string" && THEMES.has(value as ThemeMode)
}

export const validateVizmaticSceneSpec = validatePersonalizedVizmaticSpec

function buildNode(node: PersonalizedVizmaticNode, c: ThemeColors, key: string): React.ReactElement {
    const Component = COMPONENTS[node.type]
    const props = WITHOUT_THEME.has(node.type) ? node.props : { ...node.props, c }
    const children = node.children?.map((child, index) => buildNode(child, c, `${key}-${index}`))
    return React.createElement(Component, { ...props, key }, children)
}

const SVG_CACHE_LIMIT = 32
const SVG_CACHE_MAX_BYTES = 8 * 1024 * 1024
const MAX_CONCURRENT_RENDERS = 2
const MAX_QUEUED_RENDERS = 32
const RENDER_TIMEOUT_MS = 10_000
const svgCache = new Map<string, string>()
const pendingRenders = new Map<string, Promise<string>>()
interface RenderOptions {
    deadlineAt?: number
    signal?: AbortSignal
}
interface RenderWaiter {
    resolve: () => void
    reject: (error: Error) => void
    cleanup: () => void
}
const renderWaiters: RenderWaiter[] = []
let activeRenders = 0
let svgCacheBytes = 0

function normalizedJson(value: unknown): string {
    if (Array.isArray(value)) return `[${value.map(normalizedJson).join(",")}]`
    if (isRecord(value)) {
        return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${normalizedJson(value[key])}`).join(",")}}`
    }
    return JSON.stringify(value)
}

function cacheSvg(key: string, svg: string) {
    const existing = svgCache.get(key)
    if (existing) svgCacheBytes -= Buffer.byteLength(existing)
    svgCache.delete(key)
    svgCache.set(key, svg)
    svgCacheBytes += Buffer.byteLength(svg)
    while (svgCache.size > SVG_CACHE_LIMIT || svgCacheBytes > SVG_CACHE_MAX_BYTES) {
        const oldest = svgCache.keys().next().value
        if (typeof oldest !== "string") break
        svgCacheBytes -= Buffer.byteLength(svgCache.get(oldest) ?? "")
        svgCache.delete(oldest)
    }
}

export class PersonalizedVizmaticBusyError extends Error {
    constructor() {
        super("Vizmatic renderer is busy")
        this.name = "PersonalizedVizmaticBusyError"
    }
}

function renderCancelledError(options: RenderOptions) {
    if (options.signal?.aborted) return new DOMException("Vizmatic render aborted", "AbortError")
    return new Error(options.deadlineAt === undefined
        ? "Vizmatic renderer timed out"
        : "Vizmatic renderer deadline exceeded")
}

function assertRenderActive(options: RenderOptions) {
    if (options.signal?.aborted || (options.deadlineAt !== undefined && Date.now() >= options.deadlineAt)) {
        throw renderCancelledError(options)
    }
}

async function acquireRenderSlot(options: RenderOptions) {
    assertRenderActive(options)
    if (activeRenders < MAX_CONCURRENT_RENDERS) {
        activeRenders += 1
        return
    }
    if (renderWaiters.length >= MAX_QUEUED_RENDERS) throw new PersonalizedVizmaticBusyError()
    await new Promise<void>((resolve, reject) => {
        let timeout: ReturnType<typeof setTimeout> | undefined
        const onAbort = () => cancel(renderCancelledError(options))
        const waiter: RenderWaiter = {
            resolve: () => {
                waiter.cleanup()
                resolve()
            },
            reject,
            cleanup: () => {
                if (timeout) clearTimeout(timeout)
                options.signal?.removeEventListener("abort", onAbort)
            },
        }
        const cancel = (error: Error) => {
            const index = renderWaiters.indexOf(waiter)
            if (index === -1) return
            renderWaiters.splice(index, 1)
            waiter.cleanup()
            waiter.reject(error)
        }
        if (options.deadlineAt !== undefined) {
            timeout = setTimeout(
                () => cancel(renderCancelledError(options)),
                Math.max(0, options.deadlineAt - Date.now()),
            )
        }
        options.signal?.addEventListener("abort", onAbort, { once: true })
        renderWaiters.push(waiter)
        if (options.signal?.aborted) cancel(renderCancelledError(options))
    })
}

function releaseRenderSlot() {
    const waiter = renderWaiters.shift()
    if (waiter) {
        waiter.resolve()
        return
    }
    activeRenders -= 1
}

function assertSafeRenderedSvg(svg: string) {
    if (!svg.startsWith("<svg") || Buffer.byteLength(svg) > VIZMATIC_MAX_SVG_BYTES) {
        throw new Error("Vizmatic output exceeds safe size")
    }
    if (/<(?:script|foreignObject|iframe|object|embed)\b|\bon[a-z]+\s*=|\b(?:src|action)\s*=|(?:javascript:|blob:|file:)/i.test(svg)) {
        throw new Error("Vizmatic output contains unsafe SVG content")
    }
    for (const match of svg.matchAll(/\b(?:href|xlink:href)=(?:"([^"]*)"|'([^']*)')/gi)) {
        const value = match[1] ?? match[2] ?? ""
        let safeEmbeddedSvg = false
        if (/^data:image\/svg\+xml;utf8,[A-Za-z0-9%._~!$&'()*+,;=:@/? -]+$/.test(value)) {
            try {
                const decoded = decodeURIComponent(value.slice("data:image/svg+xml;utf8,".length))
                safeEmbeddedSvg = decoded.startsWith("<svg")
                    && !/<(?:script|foreignObject|iframe|object|embed)\b|\bon[a-z]+\s*=|(?:javascript:|blob:|file:)/i.test(decoded)
            } catch {
                safeEmbeddedSvg = false
            }
        }
        if (!/^#[-A-Za-z0-9_:.]+$/.test(value) && !/^data:image\/(?:png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(value) && !safeEmbeddedSvg) {
            throw new Error("Vizmatic output contains unsafe SVG reference")
        }
    }
    for (const match of svg.matchAll(/url\(([^)]*)\)/gi)) {
        if (!/^#[-A-Za-z0-9_:.]+$/.test(match[1])) {
            throw new Error("Vizmatic output contains unsafe SVG URL")
        }
    }
}

function replaceSvgAttribute(attributes: string, name: string, value: string) {
    const pattern = new RegExp(`\\s${name}="[^"]*"`)
    return pattern.test(attributes)
        ? attributes.replace(pattern, ` ${name}="${value}"`)
        : `${attributes} ${name}="${value}"`
}

class VizmaticOutputClippedError extends Error {
    constructor(readonly overflow: ReturnType<typeof detectOverflow>) {
        super(`Vizmatic output is clipped: ${overflow.message}`)
        this.name = "VizmaticOutputClippedError"
    }
}

function cropRenderedSvg(svg: string, width: number, height: number) {
    const rendered = new Resvg(svg, {
        fitTo: { mode: "width", value: width },
        background: "rgba(0, 0, 0, 0)",
    }).render()
    const pixels = new Uint8Array(rendered.pixels.buffer)
    const background = detectBackgroundColor(pixels)
    const overflow = detectOverflow(pixels, width, rendered.height, background)
    if (overflow.overflows) throw new VizmaticOutputClippedError(overflow)
    const bounds = detectContentBounds(pixels, width, rendered.height, background, VIZMATIC_CROP_PADDING)
    const savesWidth = (width - bounds.width) / width >= VIZMATIC_CROP_THRESHOLD
    const savesHeight = (height - bounds.height) / height >= VIZMATIC_CROP_THRESHOLD
    if (!savesWidth && !savesHeight) return svg

    const x = Math.max(0, Math.floor(bounds.x))
    const y = Math.max(0, Math.floor(bounds.y))
    const croppedWidth = Math.max(1, Math.ceil(bounds.width))
    const croppedHeight = Math.max(1, Math.ceil(bounds.height))
    return svg.replace(/^<svg\b([^>]*)>/, (_match, attributes: string) => {
        let next = replaceSvgAttribute(attributes, "width", String(croppedWidth))
        next = replaceSvgAttribute(next, "height", String(croppedHeight))
        next = replaceSvgAttribute(next, "viewBox", `${x} ${y} ${croppedWidth} ${croppedHeight}`)
        return `<svg${next}>`
    })
}

function withRenderTimeout<T>(promise: Promise<T>, options: RenderOptions) {
    assertRenderActive(options)
    let timeout: ReturnType<typeof setTimeout> | undefined
    const onAbort = () => rejectAbort?.(renderCancelledError(options))
    let rejectAbort: ((error: Error) => void) | undefined
    const remaining = options.deadlineAt === undefined
        ? RENDER_TIMEOUT_MS
        : Math.min(RENDER_TIMEOUT_MS, options.deadlineAt - Date.now())
    return Promise.race<T>([
        promise,
        new Promise<never>((_resolve, reject) => {
            timeout = setTimeout(() => reject(renderCancelledError(options)), remaining)
        }),
        new Promise<never>((_resolve, reject) => {
            rejectAbort = reject
            options.signal?.addEventListener("abort", onAbort, { once: true })
            if (options.signal?.aborted) reject(renderCancelledError(options))
        }),
    ]).finally(() => {
        if (timeout) clearTimeout(timeout)
        options.signal?.removeEventListener("abort", onAbort)
    })
}

function waitForRender<T>(promise: Promise<T>, options: RenderOptions) {
    assertRenderActive(options)
    if (options.deadlineAt === undefined && !options.signal) return promise
    let timeout: ReturnType<typeof setTimeout> | undefined
    let rejectAbort: ((error: Error) => void) | undefined
    const onAbort = () => rejectAbort?.(renderCancelledError(options))
    return Promise.race<T>([
        promise,
        new Promise<never>((_resolve, reject) => {
            if (options.deadlineAt !== undefined) {
                timeout = setTimeout(
                    () => reject(renderCancelledError(options)),
                    Math.max(0, options.deadlineAt - Date.now()),
                )
            }
        }),
        new Promise<never>((_resolve, reject) => {
            rejectAbort = reject
            options.signal?.addEventListener("abort", onAbort, { once: true })
            if (options.signal?.aborted) reject(renderCancelledError(options))
        }),
    ]).finally(() => {
        if (timeout) clearTimeout(timeout)
        options.signal?.removeEventListener("abort", onAbort)
    })
}

export function vizmaticSceneFingerprint(value: unknown) {
    if (!validatePersonalizedVizmaticSpec(value)) throw new Error("Invalid Vizmatic scene")
    return normalizedJson(value)
}

export async function renderVizmaticSceneSvg(
    spec: unknown,
    theme: unknown,
    options: RenderOptions = {},
) {
    assertRenderActive(options)
    if (!validatePersonalizedVizmaticSpec(spec) || !validatePersonalizedVizmaticTheme(theme)) {
        throw new Error("Invalid Vizmatic render request")
    }
    const cacheKey = `${theme}:${normalizedJson(spec)}`
    const cached = svgCache.get(cacheKey)
    if (cached) {
        svgCache.delete(cacheKey)
        svgCache.set(cacheKey, cached)
        return cached
    }
    const pending = pendingRenders.get(cacheKey)
    if (pending) return waitForRender(pending, options)

    const render = Promise.resolve().then(async () => {
        let acquired = false
        try {
            await acquireRenderSlot(options)
            acquired = true
            const colors = getThemeColors(theme)
            const element = buildNode(spec.root, colors, "root")
            let renderWidth = spec.width
            let renderHeight = spec.height
            for (;;) {
                assertRenderActive(options)
                const fullSvg = await withRenderTimeout(renderToSvg(element, renderWidth, renderHeight, {
                    background: "transparent",
                    theme,
                }), options)
                assertRenderActive(options)
                assertSafeRenderedSvg(fullSvg)
                try {
                    const svg = cropRenderedSvg(fullSvg, renderWidth, renderHeight)
                    assertSafeRenderedSvg(svg)
                    cacheSvg(cacheKey, svg)
                    return svg
                } catch (error) {
                    if (!(error instanceof VizmaticOutputClippedError)) throw error
                    const growWidth = (error.overflow.edges.left || error.overflow.edges.right) && renderWidth < 1_200
                    const growHeight = (error.overflow.edges.top || error.overflow.edges.bottom) && renderHeight < 720
                    if (!growWidth && !growHeight) throw error
                    if (growWidth) renderWidth = Math.min(1_200, renderWidth + 120)
                    if (growHeight) renderHeight = Math.min(720, renderHeight + 120)
                }
            }
        } finally {
            if (acquired) releaseRenderSlot()
            pendingRenders.delete(cacheKey)
        }
    })
    pendingRenders.set(cacheKey, render)
    return render
}

export const renderPersonalizedVizmatic = renderVizmaticSceneSvg
