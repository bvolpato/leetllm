import React, { type CSSProperties, type ReactElement, type ReactNode } from 'react'
import {
    Board,
    CanvasItem,
    TextLabel,
    getReadableTextColor,
    getReadableToneColor,
    getThemeColors,
    renderMathSvg,
    type ThemeColors,
    type ThemeMode,
    type ToneName,
} from 'vizmatic'

/**
 * A small kit for figures whose geometry comes from data: plots, grids, and marks
 * placed by computed coordinates. Marks draw in one SVG layer, and labels sit above
 * it as text, so the print pipeline can still size them.
 */
export interface TextOptions {
    size?: number
    color?: string
    align?: 'left' | 'center' | 'right'
    weight?: number
    mono?: boolean
    width?: number
}

export interface StrokeOptions {
    color?: string
    width?: number
    dash?: string
    opacity?: number
    cap?: 'round' | 'butt' | 'square'
}

export type AxisScaleKind = 'linear' | 'log'

export interface Domain {
    x: readonly [number, number]
    y: readonly [number, number]
    xScale?: AxisScaleKind
    yScale?: AxisScaleKind
}

export interface Area {
    x: number
    y: number
    width: number
    height: number
}

export interface AxesOptions {
    xTicks?: readonly number[]
    yTicks?: readonly number[]
    xLabel?: string
    yLabel?: string
    grid?: boolean
    minorGrid?: boolean
    format?: (value: number) => string
    xFormat?: (value: number) => string
    yFormat?: (value: number) => string
    labelSize?: number
}

export interface AreaOptions {
    baseline?: number
    fill?: string
    fillOpacity?: number
    stroke?: StrokeOptions | false
    smooth?: boolean
    range?: readonly [number, number]
    samples?: number
}

export interface BandOptions {
    fill?: string
    fillOpacity?: number
    stroke?: StrokeOptions
    smooth?: boolean
    range?: readonly [number, number]
    samples?: number
}

export interface ReferenceLineOptions extends StrokeOptions {
    labelPosition?: 'top' | 'bottom' | 'left' | 'right'
    labelSize?: number
    labelColor?: string
    labelOffset?: number
    align?: 'left' | 'center' | 'right'
    weight?: number
}

export interface CalloutOptions extends StrokeOptions {
    bend?: number
    head?: number
    arrow?: 'target' | 'source' | 'none'
    align?: 'left' | 'center' | 'right'
    size?: number
    weight?: number
    labelColor?: string
    mono?: boolean
    tex?: boolean
    labelGap?: number
}

export interface HeatGridOptions {
    scale?: 'sequential' | 'diverging'
    domain?: readonly [number, number]
    center?: number
    rowLabels?: readonly string[]
    colLabels?: readonly string[]
    labelSize?: number
    showValues?: boolean
    format?: (value: number) => string
    valueSize?: number
    gap?: number
    radius?: number
    causal?: boolean
    mask?: readonly (readonly boolean[])[]
    highlightCell?: { row: number; col: number }
    highlightRow?: number
    highlightCol?: number
    highlightColor?: string
    rowLabelGap?: number
    colLabelGap?: number
}

export interface BraceOptions extends StrokeOptions {
    depth?: number
    side?: 1 | -1
    labelSize?: number
    labelColor?: string
    labelGap?: number
    weight?: number
    tex?: boolean
}

export interface MathSvgProps {
    tex: string
    c?: ThemeColors
    fontSize?: number
    color?: string
    display?: boolean
    style?: CSSProperties
}

/**
 * First-class Satori-safe LaTeX equation primitive usable in any TSX figure.
 * Renders crisp MathJax vector SVG sized to the exact TeX bounding box.
 */
export function MathSvg({
    tex,
    c,
    fontSize = 15,
    color,
    display = false,
    style,
}: MathSvgProps): ReactElement {
    const resolvedColor = color ?? c?.textPrimary ?? '#f2efe6'
    const rendered = renderMathSvg(tex, {
        fontSize,
        color: resolvedColor,
        display,
    })
    const width = Math.ceil(rendered.width)
    const height = Math.ceil(rendered.height)
    const src = `data:image/svg+xml;utf8,${encodeURIComponent(rendered.svg)}`
    return (
        // Satori embeds this math SVG cleanly into the generated figure.
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={src}
            alt={tex}
            width={width}
            height={height}
            style={{ display: 'flex', flexShrink: 0, ...style }}
        />
    )
}

function fmt(n: number): string {
    return Number.isFinite(n) ? n.toFixed(2) : '0.00'
}

function log10Safe(value: number): number {
    return Math.log10(Math.max(value, 1e-12))
}

function defaultLogFormat(value: number): string {
    if (!Number.isFinite(value) || value <= 0) return String(value)
    const exp = Math.log10(value)
    if (Math.abs(exp - Math.round(exp)) < 1e-6) {
        const k = Math.round(exp)
        if (k === 0) return '1'
        if (k === 1) return '10'
        if (k === 2) return '100'
        if (k === 3) return '1k'
        if (k === 4) return '10k'
        if (k === 5) return '100k'
        if (k === 6) return '1M'
        if (k === -1) return '0.1'
        if (k === -2) return '0.01'
        return `1e${k}`
    }
    return value >= 1000 ? `${(value / 1000).toFixed(0)}k` : String(Number(value.toPrecision(2)))
}

function powersOfTenTicks(min: number, max: number): number[] {
    const low = Math.ceil(log10Safe(Math.min(min, max)) - 1e-9)
    const high = Math.floor(log10Safe(Math.max(min, max)) + 1e-9)
    const ticks: number[] = []
    for (let k = low; k <= high; k++) {
        ticks.push(10 ** k)
    }
    return ticks
}

function minorLogTicks(min: number, max: number): number[] {
    const lo = Math.min(min, max)
    const hi = Math.max(min, max)
    const lowExp = Math.floor(log10Safe(lo))
    const highExp = Math.ceil(log10Safe(hi))
    const ticks: number[] = []
    for (let k = lowExp; k <= highExp; k++) {
        const base = 10 ** k
        for (let m = 2; m <= 9; m++) {
            const v = m * base
            if (v > lo && v < hi) ticks.push(v)
        }
    }
    return ticks
}

/**
 * Convert pixel-space points into a smooth SVG cubic Bezier path.
 * Uses Fritsch-Carlson monotone cubic Hermite interpolation when x is strictly monotonic
 * (zero overshoot on loss/metric curves), and centripetal Catmull-Rom otherwise.
 */
export function buildSmoothPath(
    points: readonly (readonly [number, number])[],
    moveCommand: 'M' | 'L' = 'M',
): string {
    const n = points.length
    if (n === 0) return ''
    if (n === 1) return `${moveCommand}${fmt(points[0]![0])} ${fmt(points[0]![1])}`
    if (n === 2) {
        return `${moveCommand}${fmt(points[0]![0])} ${fmt(points[0]![1])}L${fmt(points[1]![0])} ${fmt(points[1]![1])}`
    }

    let strictlyInc = true
    let strictlyDec = true
    for (let i = 1; i < n; i++) {
        const dx = points[i]![0] - points[i - 1]![0]
        if (dx <= 1e-6) strictlyInc = false
        if (dx >= -1e-6) strictlyDec = false
    }

    if (strictlyInc || strictlyDec) {
        const xs = points.map((p) => p[0])
        const ys = points.map((p) => p[1])
        const h: number[] = []
        const delta: number[] = []
        for (let i = 0; i < n - 1; i++) {
            const dx = xs[i + 1]! - xs[i]!
            h.push(dx)
            delta.push((ys[i + 1]! - ys[i]!) / dx)
        }
        const m: number[] = new Array(n).fill(0)
        m[0] = delta[0]!
        m[n - 1] = delta[n - 2]!
        for (let i = 1; i < n - 1; i++) {
            const d0 = delta[i - 1]!
            const d1 = delta[i]!
            if (d0 * d1 <= 0) {
                m[i] = 0
            } else {
                const w1 = 2 * h[i]! + h[i - 1]!
                const w2 = h[i]! + 2 * h[i - 1]!
                m[i] = (w1 + w2) / (w1 / d0 + w2 / d1)
            }
        }
        for (let i = 0; i < n - 1; i++) {
            const d = delta[i]!
            if (Math.abs(d) < 1e-9) {
                m[i] = 0
                m[i + 1] = 0
            } else {
                const alpha = m[i]! / d
                const beta = m[i + 1]! / d
                const mag = Math.hypot(alpha, beta)
                if (mag > 3) {
                    const tau = 3 / mag
                    m[i] = tau * alpha * d
                    m[i + 1] = tau * beta * d
                }
            }
        }
        const segments: string[] = [`${moveCommand}${fmt(xs[0]!)} ${fmt(ys[0]!)}`]
        for (let i = 0; i < n - 1; i++) {
            const dx = h[i]! / 3
            const c1x = xs[i]! + dx
            const c1y = ys[i]! + m[i]! * dx
            const c2x = xs[i + 1]! - dx
            const c2y = ys[i + 1]! - m[i + 1]! * dx
            segments.push(
                `C${fmt(c1x)} ${fmt(c1y)},${fmt(c2x)} ${fmt(c2y)},${fmt(xs[i + 1]!)} ${fmt(ys[i + 1]!)}`,
            )
        }
        return segments.join('')
    }

    // General 2D parametric curve: Catmull-Rom to cubic Bezier
    const segments: string[] = [`${moveCommand}${fmt(points[0]![0])} ${fmt(points[0]![1])}`]
    for (let i = 0; i < n - 1; i++) {
        const p0 = points[Math.max(0, i - 1)]!
        const p1 = points[i]!
        const p2 = points[i + 1]!
        const p3 = points[Math.min(n - 1, i + 2)]!
        const c1x = p1[0] + (p2[0] - p0[0]) / 6
        const c1y = p1[1] + (p2[1] - p0[1]) / 6
        const c2x = p2[0] - (p3[0] - p1[0]) / 6
        const c2y = p2[1] - (p3[1] - p1[1]) / 6
        segments.push(`C${fmt(c1x)} ${fmt(c1y)},${fmt(c2x)} ${fmt(c2y)},${fmt(p2[0])} ${fmt(p2[1])}`)
    }
    return segments.join('')
}

export class Plot {
    constructor(
        readonly fig: Figure,
        readonly area: Area,
        readonly domain: Domain,
    ) {}

    px(x: number): number {
        const [a, b] = this.domain.x
        if (this.domain.xScale === 'log') {
            const la = log10Safe(a)
            const lb = log10Safe(b)
            return this.area.x + ((log10Safe(x) - la) / (lb - la || 1)) * this.area.width
        }
        return this.area.x + ((x - a) / (b - a || 1)) * this.area.width
    }

    py(y: number): number {
        const [a, b] = this.domain.y
        if (this.domain.yScale === 'log') {
            const la = log10Safe(a)
            const lb = log10Safe(b)
            return (
                this.area.y +
                this.area.height -
                ((log10Safe(y) - la) / (lb - la || 1)) * this.area.height
            )
        }
        return this.area.y + this.area.height - ((y - a) / (b - a || 1)) * this.area.height
    }

    get bottom(): number {
        return this.area.y + this.area.height
    }

    get right(): number {
        return this.area.x + this.area.width
    }

    /** Hairline axes and ticks, with values placed directly on them. */
    axes(options: AxesOptions = {}): this {
        const { fig } = this
        const c = fig.c
        const size = options.labelSize ?? 12
        const xFormat =
            options.xFormat ??
            options.format ??
            (this.domain.xScale === 'log' ? defaultLogFormat : String)
        const yFormat =
            options.yFormat ??
            options.format ??
            (this.domain.yScale === 'log' ? defaultLogFormat : String)
        const yTicks =
            options.yTicks ??
            (this.domain.yScale === 'log'
                ? powersOfTenTicks(this.domain.y[0], this.domain.y[1])
                : [])
        const xTicks =
            options.xTicks ??
            (this.domain.xScale === 'log'
                ? powersOfTenTicks(this.domain.x[0], this.domain.x[1])
                : [])

        if (options.minorGrid) {
            if (this.domain.yScale === 'log') {
                for (const y of minorLogTicks(this.domain.y[0], this.domain.y[1])) {
                    fig.line(this.area.x, this.py(y), this.right, this.py(y), {
                        color: c.borderSubtle,
                        width: 0.75,
                        opacity: 0.55,
                    })
                }
            }
            if (this.domain.xScale === 'log') {
                for (const x of minorLogTicks(this.domain.x[0], this.domain.x[1])) {
                    fig.line(this.px(x), this.area.y, this.px(x), this.bottom, {
                        color: c.borderSubtle,
                        width: 0.75,
                        opacity: 0.55,
                    })
                }
            }
        }

        for (const y of yTicks) {
            if (options.grid)
                fig.line(this.area.x, this.py(y), this.right, this.py(y), {
                    color: c.borderSubtle,
                    width: 1,
                })
            fig.line(this.area.x - 4, this.py(y), this.area.x, this.py(y), {
                color: c.textMuted,
                width: 1,
            })
            fig.text(this.area.x - 8, this.py(y), yFormat(y), {
                size,
                color: c.textSecondary,
                align: 'right',
                mono: true,
            })
        }
        for (const x of xTicks) {
            if (options.grid)
                fig.line(this.px(x), this.area.y, this.px(x), this.bottom, {
                    color: c.borderSubtle,
                    width: 1,
                })
            fig.line(this.px(x), this.bottom, this.px(x), this.bottom + 4, {
                color: c.textMuted,
                width: 1,
            })
            fig.text(this.px(x), this.bottom + 15, xFormat(x), {
                size,
                color: c.textSecondary,
                align: 'center',
                mono: true,
            })
        }
        fig.line(this.area.x, this.area.y, this.area.x, this.bottom, {
            color: c.textMuted,
            width: 1,
        })
        fig.line(this.area.x, this.bottom, this.right, this.bottom, {
            color: c.textMuted,
            width: 1,
        })
        if (options.xLabel)
            fig.text(this.area.x + this.area.width / 2, this.bottom + 33, options.xLabel, {
                size,
                color: c.textSecondary,
                align: 'center',
            })
        if (options.yLabel)
            fig.text(this.area.x, this.area.y - 14, options.yLabel, {
                size,
                color: c.textSecondary,
            })
        return this
    }

    /** Convenience wrapper for log-scaled axes with automatic powers-of-10 ticks and subtle grid. */
    logAxes(options: AxesOptions = {}): this {
        return this.axes({
            grid: true,
            ...options,
        })
    }

    curve(points: readonly (readonly [number, number])[], stroke: StrokeOptions = {}): this {
        this.fig.polyline(
            points.map(([x, y]) => [this.px(x), this.py(y)] as const),
            stroke,
        )
        return this
    }

    /** Draw a silky monotone cubic Bezier curve through data points without artificial overshoot. */
    smoothCurve(points: readonly (readonly [number, number])[], stroke: StrokeOptions = {}): this {
        if (points.length < 2) return this
        const pixelPoints = points.map(([x, y]) => [this.px(x), this.py(y)] as const)
        this.fig.path(buildSmoothPath(pixelPoints), {
            color: stroke.color ?? this.fig.c.textPrimary,
            ...stroke,
        })
        return this
    }

    private sampleSeries(
        source: readonly (readonly [number, number])[] | ((x: number) => number),
        range?: readonly [number, number],
        samples = 120,
    ): [number, number][] {
        if (typeof source !== 'function') {
            return source.map(([x, y]) => [x, y])
        }
        const [a, b] = range ?? this.domain.x
        const [yLow, yHigh] = this.domain.y
        const isLogX = this.domain.xScale === 'log'
        const la = isLogX ? log10Safe(a) : a
        const lb = isLogX ? log10Safe(b) : b
        const out: [number, number][] = []
        for (let i = 0; i <= samples; i++) {
            const t = i / samples
            const x = isLogX ? 10 ** (la + (lb - la) * t) : a + (b - a) * t
            const y = source(x)
            if (Number.isFinite(y)) {
                const clampedY = Math.max(yLow, Math.min(yHigh, y))
                out.push([x, clampedY])
            }
        }
        return out
    }

    /** Sample a function, leaving out anything outside the plot's vertical range. */
    fn(
        f: (x: number) => number,
        stroke: StrokeOptions = {},
        samples = 160,
        range?: readonly [number, number],
    ): this {
        const [a, b] = range ?? this.domain.x
        const [low, high] = this.domain.y
        const isLogX = this.domain.xScale === 'log'
        const la = isLogX ? log10Safe(a) : a
        const lb = isLogX ? log10Safe(b) : b
        let run: [number, number][] = []
        for (let i = 0; i <= samples; i++) {
            const t = i / samples
            const x = isLogX ? 10 ** (la + (lb - la) * t) : a + (b - a) * t
            const y = f(x)
            if (Number.isFinite(y) && y >= low && y <= high) run.push([x, y])
            else {
                if (run.length > 1) this.curve(run, stroke)
                run = []
            }
        }
        if (run.length > 1) this.curve(run, stroke)
        return this
    }

    /** Shade the area between a curve and a horizontal baseline (defaults to 0 or domain bottom). */
    fillArea(
        source: readonly (readonly [number, number])[] | ((x: number) => number),
        options: AreaOptions = {},
    ): this {
        const pts = this.sampleSeries(source, options.range, options.samples)
        if (pts.length < 2) return this
        const defaultBase =
            this.domain.yScale === 'log'
                ? this.domain.y[0]
                : Math.max(this.domain.y[0], Math.min(this.domain.y[1], 0))
        const baseY = this.py(options.baseline ?? defaultBase)
        const pxPts = pts.map(([x, y]) => [this.px(x), this.py(y)] as const)
        const topPath = options.smooth
            ? buildSmoothPath(pxPts, 'M')
            : pxPts.map(([x, y], i) => `${i ? 'L' : 'M'}${fmt(x)} ${fmt(y)}`).join('')
        const last = pxPts[pxPts.length - 1]!
        const first = pxPts[0]!
        const closed = `${topPath}L${fmt(last[0])} ${fmt(baseY)}L${fmt(first[0])} ${fmt(baseY)}Z`
        const fill = options.fill ?? this.fig.tone('blue')
        this.fig.path(closed, {
            fill,
            fillOpacity: options.fillOpacity ?? 0.14,
            color: 'none',
        })
        if (options.stroke !== false && options.stroke !== undefined) {
            if (options.smooth) this.smoothCurve(pts, { color: fill, ...options.stroke })
            else this.curve(pts, { color: fill, ...options.stroke })
        }
        return this
    }

    /** Shade the band between two curves (confidence intervals, loss envelopes, KL regions). */
    band(
        low: readonly (readonly [number, number])[] | ((x: number) => number),
        high: readonly (readonly [number, number])[] | ((x: number) => number),
        options: BandOptions = {},
    ): this {
        const highPts = this.sampleSeries(high, options.range, options.samples)
        const lowPts = this.sampleSeries(low, options.range, options.samples)
        if (highPts.length < 2 || lowPts.length < 2) return this
        const topPx = highPts.map(([x, y]) => [this.px(x), this.py(y)] as const)
        const botPx = [...lowPts].reverse().map(([x, y]) => [this.px(x), this.py(y)] as const)
        const topPath = options.smooth
            ? buildSmoothPath(topPx, 'M')
            : topPx.map(([x, y], i) => `${i ? 'L' : 'M'}${fmt(x)} ${fmt(y)}`).join('')
        const botPath = options.smooth
            ? buildSmoothPath(botPx, 'L')
            : botPx.map(([x, y]) => `L${fmt(x)} ${fmt(y)}`).join('')
        const fill = options.fill ?? this.fig.tone('blue')
        this.fig.path(`${topPath}${botPath}Z`, {
            fill,
            fillOpacity: options.fillOpacity ?? 0.16,
            color: options.stroke?.color ?? 'none',
            width: options.stroke?.width,
            dash: options.stroke?.dash,
            opacity: options.stroke?.opacity,
        })
        return this
    }

    /** Vertical reference line with optional crisp label. */
    vline(x: number, label?: string, options: ReferenceLineOptions = {}): this {
        const px = this.px(x)
        const color = options.color ?? this.fig.c.textMuted
        this.fig.line(px, this.area.y, px, this.bottom, {
            color,
            width: options.width ?? 1.25,
            dash: options.dash ?? '4 4',
            opacity: options.opacity,
            cap: options.cap,
        })
        if (label) {
            const pos = options.labelPosition ?? 'top'
            const offset = options.labelOffset ?? 10
            const y = pos === 'bottom' ? this.bottom - offset : this.area.y + offset
            const align =
                options.align ?? (px > this.area.x + this.area.width * 0.65 ? 'right' : 'left')
            const dx = align === 'right' ? -6 : align === 'left' ? 6 : 0
            this.fig.text(px + dx, y, label, {
                size: options.labelSize ?? 13,
                color: options.labelColor ?? color,
                align,
                weight: options.weight ?? 500,
            })
        }
        return this
    }

    /** Horizontal reference line with optional crisp label. */
    hline(y: number, label?: string, options: ReferenceLineOptions = {}): this {
        const py = this.py(y)
        const color = options.color ?? this.fig.c.textMuted
        this.fig.line(this.area.x, py, this.right, py, {
            color,
            width: options.width ?? 1.25,
            dash: options.dash ?? '4 4',
            opacity: options.opacity,
            cap: options.cap,
        })
        if (label) {
            const pos = options.labelPosition ?? 'right'
            const offset = options.labelOffset ?? 11
            const x = pos === 'left' ? this.area.x + 6 : this.right - 2
            const align = options.align ?? (pos === 'left' ? 'left' : 'right')
            const ly = py - offset < this.area.y + 8 ? py + offset : py - offset
            this.fig.text(x, ly, label, {
                size: options.labelSize ?? 13,
                color: options.labelColor ?? color,
                align,
                weight: options.weight ?? 500,
            })
        }
        return this
    }

    point(
        x: number,
        y: number,
        options: { color?: string; r?: number; ring?: boolean } = {},
    ): this {
        const c = this.fig.c
        this.fig.circle(this.px(x), this.py(y), options.r ?? 4.5, {
            fill: options.ring ? c.bg : (options.color ?? c.textPrimary),
            stroke: options.color ?? c.textPrimary,
            width: options.ring ? 1.75 : 0,
        })
        return this
    }
}

export class Figure {
    readonly c: ReturnType<typeof getThemeColors>
    readonly theme: ThemeMode
    private readonly marks: ReactNode[] = []
    private readonly labels: ReactNode[] = []

    constructor(
        theme: ThemeMode,
        readonly width: number,
        readonly height: number,
    ) {
        this.theme = theme
        this.c = getThemeColors(theme)
    }

    /** A pigment dark or light enough to read as text on this theme's ground. */
    tone(name: ToneName): string {
        return getReadableToneColor(name, this.c, this.c.bg)
    }

    plot(area: Area, domain: Domain): Plot {
        return new Plot(this, area, domain)
    }

    private mark(node: ReactNode): this {
        this.marks.push(React.cloneElement(node as React.ReactElement, { key: this.marks.length }))
        return this
    }

    line(x1: number, y1: number, x2: number, y2: number, stroke: StrokeOptions = {}): this {
        return this.mark(
            <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={stroke.color ?? this.c.textPrimary}
                strokeWidth={stroke.width ?? 1.5}
                strokeDasharray={stroke.dash}
                strokeOpacity={stroke.opacity}
                strokeLinecap={stroke.cap ?? 'round'}
            />,
        )
    }

    polyline(points: readonly (readonly [number, number])[], stroke: StrokeOptions = {}): this {
        const d = points
            .map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`)
            .join('')
        return this.path(d, stroke)
    }

    path(d: string, stroke: StrokeOptions & { fill?: string; fillOpacity?: number } = {}): this {
        return this.mark(
            <path
                d={d}
                fill={stroke.fill ?? 'none'}
                fillOpacity={stroke.fillOpacity}
                stroke={stroke.color ?? 'none'}
                strokeWidth={stroke.width ?? 1.5}
                strokeDasharray={stroke.dash}
                strokeOpacity={stroke.opacity}
                strokeLinecap={stroke.cap ?? 'round'}
                strokeLinejoin="round"
            />,
        )
    }

    circle(
        cx: number,
        cy: number,
        r: number,
        options: { fill?: string; stroke?: string; width?: number; opacity?: number } = {},
    ): this {
        return this.mark(
            <circle
                cx={cx}
                cy={cy}
                r={r}
                fill={options.fill ?? 'none'}
                stroke={options.stroke ?? 'none'}
                strokeWidth={options.width ?? 0}
                opacity={options.opacity}
            />,
        )
    }

    rect(
        x: number,
        y: number,
        width: number,
        height: number,
        options: {
            fill?: string
            stroke?: string
            strokeWidth?: number
            opacity?: number
            radius?: number
        } = {},
    ): this {
        return this.mark(
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                rx={options.radius ?? 0}
                fill={options.fill ?? 'none'}
                stroke={options.stroke ?? 'none'}
                strokeWidth={options.strokeWidth ?? 0}
                opacity={options.opacity}
            />,
        )
    }

    /** A straight arrow whose shaft ends at the base of its head. */
    arrow(
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        options: StrokeOptions & { head?: number } = {},
    ): this {
        const color = options.color ?? this.c.textPrimary
        const width = options.width ?? 1.75
        const head = options.head ?? Math.max(7, width * 4)
        const length = Math.hypot(x2 - x1, y2 - y1) || 1
        const ux = (x2 - x1) / length,
            uy = (y2 - y1) / length
        const bx = x2 - ux * head,
            by = y2 - uy * head
        this.line(x1, y1, bx, by, { ...options, color, width })
        const half = head * 0.42
        return this.path(
            `M${x2} ${y2}L${bx - uy * half} ${by + ux * half}L${bx + uy * half} ${by - ux * half}Z`,
            { fill: color, opacity: options.opacity },
        )
    }

    /** Curved leader arrow from a label anchor (toPt) pointing to a feature (fromPt). */
    callout(
        fromPt: readonly [number, number],
        toPt: readonly [number, number],
        label: string,
        options: CalloutOptions = {},
    ): this {
        const [tx, ty] = fromPt
        const [lx, ly] = toPt
        const color = options.color ?? this.c.textSecondary
        const width = options.width ?? 1.4
        const head = options.head ?? 6
        const bend = options.bend ?? 0.2
        const arrowMode = options.arrow ?? 'target'

        const dx = tx - lx
        const dy = ty - ly
        const len = Math.hypot(dx, dy) || 1
        const mx = (lx + tx) / 2
        const my = (ly + ty) / 2
        // Perpendicular control point for gentle curved leader
        const nx = -dy / len
        const ny = dx / len
        const cx = mx + nx * len * bend
        const cy = my + ny * len * bend

        const drawTip = (tipX: number, tipY: number, refX: number, refY: number) => {
            const vx = tipX - refX
            const vy = tipY - refY
            const vLen = Math.hypot(vx, vy) || 1
            const ux = vx / vLen
            const uy = vy / vLen
            const bx = tipX - ux * head
            const by = tipY - uy * head
            const half = head * 0.44
            this.path(
                `M${fmt(tipX)} ${fmt(tipY)}L${fmt(bx - uy * half)} ${fmt(by + ux * half)}L${fmt(bx + uy * half)} ${fmt(by - ux * half)}Z`,
                { fill: color, opacity: options.opacity },
            )
            return [bx, by] as const
        }

        let startX = lx
        let startY = ly
        let endX = tx
        let endY = ty
        if (arrowMode === 'target') {
            const base = drawTip(tx, ty, cx, cy)
            endX = base[0]
            endY = base[1]
        } else if (arrowMode === 'source') {
            const base = drawTip(lx, ly, cx, cy)
            startX = base[0]
            startY = base[1]
        }

        this.path(`M${fmt(startX)} ${fmt(startY)}Q${fmt(cx)} ${fmt(cy)},${fmt(endX)} ${fmt(endY)}`, {
            color,
            width,
            dash: options.dash,
            opacity: options.opacity,
        })

        const align = options.align ?? (lx >= tx ? 'left' : 'right')
        const gap = options.labelGap ?? 6
        const labelX = align === 'left' ? lx + gap : align === 'right' ? lx - gap : lx
        const labelColor = options.labelColor ?? color
        if (options.tex) {
            this.math(labelX, ly, label, {
                size: options.size ?? 14,
                color: labelColor,
                align,
            })
        } else {
            this.text(labelX, ly, label, {
                size: options.size ?? 13,
                color: labelColor,
                align,
                weight: options.weight ?? 500,
                mono: options.mono,
            })
        }
        return this
    }

    /**
     * Transparent-ground heatmap or attention grid with theme-aware sequential or diverging ramps
     * and optional subtle diagonal hatching for masked entries.
     */
    heatGrid(
        data: readonly (readonly number[])[],
        area: Area,
        options: HeatGridOptions = {},
    ): this {
        const rows = data.length
        const cols = rows > 0 ? data[0]!.length : 0
        if (rows === 0 || cols === 0) return this

        const gap = options.gap ?? 3
        const radius = options.radius ?? 4
        const cellW = (area.width - gap * (cols - 1)) / cols
        const cellH = (area.height - gap * (rows - 1)) / rows
        const scale = options.scale ?? 'sequential'
        const isLight = this.theme === 'light'
        const flat = data.flat().filter(Number.isFinite)
        const minVal = options.domain?.[0] ?? Math.min(...flat, 0)
        const maxVal = options.domain?.[1] ?? Math.max(...flat, 1)
        const span = maxVal - minVal || 1
        const center = options.center ?? 0
        const maxAbs = Math.max(Math.abs(minVal - center), Math.abs(maxVal - center), 1e-9)

        const cellFill = (value: number): string => {
            if (scale === 'diverging') {
                const t = Math.max(-1, Math.min(1, (value - center) / maxAbs))
                const neutral = isLight ? '#f5f1e6' : '#1b2029'
                const neg = isLight ? '#1f6fb2' : '#4fb4e8'
                const pos = isLight ? '#c62f2f' : '#e85d5d'
                return t < 0 ? tint(neg, neutral, -t) : tint(pos, neutral, t)
            }
            const t = Math.max(0, Math.min(1, (value - minVal) / span))
            if (isLight) {
                if (t < 0.65) return tint('#0f4c5c', '#f6f2e8', t / 0.65)
                return tint('#b07d24', '#0f4c5c', (t - 0.65) / 0.35)
            }
            if (t < 0.6) return tint('#2f8fc4', '#141922', t / 0.6)
            return tint('#f2b84b', '#2f8fc4', (t - 0.6) / 0.4)
        }

        const labelSize = options.labelSize ?? 13
        const valueSize = options.valueSize ?? Math.max(11, Math.min(14, Math.floor(cellH * 0.36)))
        const format = options.format ?? ((v: number) => v.toFixed(2))
        const hlColor = options.highlightColor ?? this.tone('warm')

        if (options.colLabels) {
            const colGap = options.colLabelGap ?? 14
            for (let j = 0; j < cols; j++) {
                const label = options.colLabels[j]
                if (!label) continue
                this.text(area.x + j * (cellW + gap) + cellW / 2, area.y - colGap, label, {
                    size: labelSize,
                    color: options.highlightCol === j ? hlColor : this.c.textSecondary,
                    align: 'center',
                    weight: options.highlightCol === j ? 600 : 500,
                })
            }
        }

        if (options.rowLabels) {
            const rowGap = options.rowLabelGap ?? 10
            for (let i = 0; i < rows; i++) {
                const label = options.rowLabels[i]
                if (!label) continue
                this.text(area.x - rowGap, area.y + i * (cellH + gap) + cellH / 2, label, {
                    size: labelSize,
                    color: options.highlightRow === i ? hlColor : this.c.textSecondary,
                    align: 'right',
                    weight: options.highlightRow === i ? 600 : 500,
                })
            }
        }

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const x = area.x + j * (cellW + gap)
                const y = area.y + i * (cellH + gap)
                const masked = (options.causal && j > i) || options.mask?.[i]?.[j] === false
                const exactHl = options.highlightCell?.row === i && options.highlightCell?.col === j
                const lineHl = options.highlightRow === i || options.highlightCol === j

                if (masked) {
                    this.rect(x, y, cellW, cellH, {
                        fill: isLight ? '#f2eee4' : '#151820',
                        stroke: this.c.borderSubtle,
                        strokeWidth: 0.75,
                        radius,
                        opacity: 0.7,
                    })
                    // Subtle diagonal hatch across masked cell
                    const inset = Math.min(cellW, cellH) * 0.24
                    this.line(x + inset, y + cellH - inset, x + cellW - inset, y + inset, {
                        color: this.c.textMuted,
                        width: 1,
                        opacity: 0.45,
                    })
                    continue
                }

                const value = data[i]![j]!
                const fill = cellFill(value)
                this.rect(x, y, cellW, cellH, {
                    fill,
                    stroke: exactHl ? hlColor : lineHl ? hlColor : this.c.borderSubtle,
                    strokeWidth: exactHl ? 2.25 : lineHl ? 1.25 : 0.75,
                    radius,
                })

                if (options.showValues ?? (cellW >= 34 && cellH >= 24)) {
                    const ink = getReadableTextColor(fill, this.c, this.c.bg)
                    this.text(x + cellW / 2, y + cellH / 2, format(value), {
                        size: valueSize,
                        color: ink,
                        align: 'center',
                        mono: true,
                        weight: exactHl ? 600 : 500,
                        width: cellW,
                    })
                }
            }
        }
        return this
    }

    /** Smooth curly bracket spanning (x1, y1) -> (x2, y2) with an optional label at its tip. */
    brace(
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        label?: string,
        options: BraceOptions = {},
    ): this {
        const dx = x2 - x1
        const dy = y2 - y1
        const len = Math.hypot(dx, dy)
        if (len < 4) return this
        const ux = dx / len
        const uy = dy / len
        const side = options.side ?? 1
        // Normal pointing toward the brace apex
        const nx = -uy * side
        const ny = ux * side
        const depth = Math.min(options.depth ?? 10, len * 0.25)
        const halfDepth = depth * 0.5
        const q = Math.min(depth * 1.4, len * 0.22)

        const pt = (along: number, out: number): [number, number] => [
            x1 + ux * along + nx * out,
            y1 + uy * along + ny * out,
        ]
        const pStart = pt(0, 0)
        const pMid1 = pt(q, halfDepth)
        const pMid2 = pt(len / 2 - q, halfDepth)
        const pApex = pt(len / 2, depth)
        const pMid3 = pt(len / 2 + q, halfDepth)
        const pMid4 = pt(len - q, halfDepth)
        const pEnd = pt(len, 0)

        const c1 = pt(0, halfDepth)
        const c2 = pt(len / 2, halfDepth)
        const c3 = pt(len, halfDepth)

        const d = [
            `M${fmt(pStart[0])} ${fmt(pStart[1])}`,
            `Q${fmt(c1[0])} ${fmt(c1[1])},${fmt(pMid1[0])} ${fmt(pMid1[1])}`,
            `L${fmt(pMid2[0])} ${fmt(pMid2[1])}`,
            `Q${fmt(c2[0])} ${fmt(c2[1])},${fmt(pApex[0])} ${fmt(pApex[1])}`,
            `Q${fmt(c2[0])} ${fmt(c2[1])},${fmt(pMid3[0])} ${fmt(pMid3[1])}`,
            `L${fmt(pMid4[0])} ${fmt(pMid4[1])}`,
            `Q${fmt(c3[0])} ${fmt(c3[1])},${fmt(pEnd[0])} ${fmt(pEnd[1])}`,
        ].join('')

        const color = options.color ?? this.c.textMuted
        this.path(d, {
            color,
            width: options.width ?? 1.4,
            dash: options.dash,
            opacity: options.opacity,
        })

        if (label) {
            const gap = options.labelGap ?? 14
            const [lx, ly] = pt(len / 2, depth + gap)
            const horizontal = Math.abs(dx) >= Math.abs(dy)
            const align = horizontal ? 'center' : nx >= 0 ? 'left' : 'right'
            const labelColor = options.labelColor ?? this.c.textSecondary
            if (options.tex) {
                this.math(lx, ly, label, {
                    size: options.labelSize ?? 14,
                    color: labelColor,
                    align,
                })
            } else {
                this.text(lx, ly, label, {
                    size: options.labelSize ?? 13,
                    color: labelColor,
                    align,
                    weight: options.weight ?? 500,
                })
            }
        }
        return this
    }

    /** Text centered vertically on y. Align chooses which end of the text sits at x. */
    text(x: number, y: number, value: string, options: TextOptions = {}): this {
        const size = options.size ?? 12
        const height = Math.ceil(size * 1.6)
        const align = options.align ?? 'left'
        // Label boxes stay on the canvas, and the anchored end of the text stays where it was asked to be.
        const wanted = options.width ?? Math.max(60, value.length * size * 0.72)
        const room =
            align === 'left'
                ? this.width - x
                : align === 'right'
                  ? x
                  : 2 * Math.min(x, this.width - x)
        const width = Math.max(1, Math.min(wanted, room))
        const left = align === 'left' ? x : align === 'center' ? x - width / 2 : x - width
        const top = Math.max(0, Math.min(this.height - height, y - height / 2))
        this.labels.push(
            <CanvasItem
                key={`t${this.labels.length}`}
                x={Math.round(left)}
                y={Math.round(top)}
                width={Math.round(width)}
                height={height}
            >
                <TextLabel
                    c={this.c}
                    text={value}
                    fontSize={size}
                    color={options.color ?? this.c.textPrimary}
                    width="100%"
                    align={align}
                    fontWeight={options.weight ?? 400}
                    mono={options.mono}
                />
            </CanvasItem>,
        )
        return this
    }

    /** TeX placed like text, centered vertically on y. */
    math(
        x: number,
        y: number,
        tex: string,
        options: { size?: number; color?: string; align?: 'left' | 'center' | 'right' } = {},
    ): this {
        const rendered = renderMathSvg(tex, {
            fontSize: options.size ?? 15,
            color: options.color ?? this.c.textPrimary,
        })
        const align = options.align ?? 'left'
        const left =
            align === 'left' ? x : align === 'center' ? x - rendered.width / 2 : x - rendered.width
        const source = `data:image/svg+xml;utf8,${encodeURIComponent(rendered.svg)}`
        this.labels.push(
            <CanvasItem
                key={`m${this.labels.length}`}
                x={Math.round(left)}
                y={Math.round(y - rendered.height / 2)}
                width={Math.ceil(rendered.width)}
                height={Math.ceil(rendered.height)}
            >
                {/* Satori embeds this math SVG into the generated figure. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={source}
                    alt={tex}
                    width={Math.ceil(rendered.width)}
                    height={Math.ceil(rendered.height)}
                />
            </CanvasItem>,
        )
        return this
    }

    render(): ReactNode {
        return (
            <Board c={this.c} width={this.width} height={this.height}>
                <CanvasItem x={0} y={0} width={this.width} height={this.height}>
                    <svg
                        width={this.width}
                        height={this.height}
                        viewBox={`0 0 ${this.width} ${this.height}`}
                    >
                        {this.marks}
                    </svg>
                </CanvasItem>
                {this.labels}
            </Board>
        )
    }
}

/** Blend a theme color toward the ground, for heat cells and quiet fills. */
export function tint(hex: string, ground: string, amount: number): string {
    const parse = (value: string) => [1, 3, 5].map((i) => parseInt(value.slice(i, i + 2), 16))
    const a = parse(hex),
        b = parse(ground)
    const mixed = a.map((channel, i) =>
        Math.round(b[i]! + (channel - b[i]!) * Math.max(0, Math.min(1, amount))),
    )
    return `#${mixed.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`
}
