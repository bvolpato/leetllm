import { Buffer } from 'node:buffer'
import React, { type ReactNode } from 'react'
import {
    Board,
    CanvasItem,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
    renderMathSvg,
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

export interface Domain {
    x: readonly [number, number]
    y: readonly [number, number]
}

export interface Area {
    x: number
    y: number
    width: number
    height: number
}

export class Plot {
    constructor(
        readonly fig: Figure,
        readonly area: Area,
        readonly domain: Domain,
    ) {}

    px(x: number): number {
        const [a, b] = this.domain.x
        return this.area.x + ((x - a) / (b - a)) * this.area.width
    }

    py(y: number): number {
        const [a, b] = this.domain.y
        return this.area.y + this.area.height - ((y - a) / (b - a)) * this.area.height
    }

    get bottom(): number {
        return this.area.y + this.area.height
    }

    get right(): number {
        return this.area.x + this.area.width
    }

    /** Hairline axes and ticks, with values placed directly on them. */
    axes(
        options: {
            xTicks?: readonly number[]
            yTicks?: readonly number[]
            xLabel?: string
            yLabel?: string
            grid?: boolean
            format?: (value: number) => string
            xFormat?: (value: number) => string
            yFormat?: (value: number) => string
            labelSize?: number
        } = {},
    ): this {
        const { fig } = this
        const c = fig.c
        const size = options.labelSize ?? 12
        const xFormat = options.xFormat ?? options.format ?? String
        const yFormat = options.yFormat ?? options.format ?? String
        for (const y of options.yTicks ?? []) {
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
        for (const x of options.xTicks ?? []) {
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

    curve(points: readonly (readonly [number, number])[], stroke: StrokeOptions = {}): this {
        this.fig.polyline(
            points.map(([x, y]) => [this.px(x), this.py(y)] as const),
            stroke,
        )
        return this
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
        let run: [number, number][] = []
        for (let i = 0; i <= samples; i++) {
            const x = a + ((b - a) * i) / samples
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
    private readonly marks: ReactNode[] = []
    private readonly labels: ReactNode[] = []

    constructor(
        theme: ThemeMode,
        readonly width: number,
        readonly height: number,
    ) {
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
        const width = Math.min(wanted, room)
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
        const source = `data:image/svg+xml;base64,${Buffer.from(rendered.svg).toString('base64')}`
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
