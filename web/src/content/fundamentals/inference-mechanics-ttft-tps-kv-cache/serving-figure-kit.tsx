import React, { type ReactNode } from 'react'
import { Board, CanvasItem, getReadableToneColor, getThemeColors, type ThemeMode } from 'vizmatic'

/**
 * Shared drawing kit for the figures in the serving chapters.
 *
 * One meaning per color, from the default Vizmatic theme in both modes:
 * prefill = prompt work, decode = output work, state = KV and other held memory,
 * wait = queued or idle, fail = failed or rejected, pass = healthy or qualified.
 *
 * Inter carries labels. Mono is only for code, IDs, and tensor values. The caption
 * carries the title, so a figure has no heading of its own. Strokes are hairlines
 * unless the stroke is the data.
 *
 * Canvases are 510 wide with 15px labels. That gives 10 CSS px on a 343px phone and
 * 8.75 pt in the book column. Book fingerprints do not include this file, so a change
 * here needs `build/book/illustrations` cleared for the affected chapters.
 */
export function pk(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme)
    const tone = (name: Parameters<typeof getReadableToneColor>[0]) => getReadableToneColor(name, c, c.bg)
    return {
        c,
        ink: c.textPrimary,
        mid: c.textSecondary,
        faint: c.textMuted,
        line: c.borderLight,
        onFill: c.bg,
        prefill: tone('blue'),
        decode: tone('cyan'),
        state: tone('purple'),
        wait: tone('warm'),
        fail: tone('critical'),
        pass: tone('green'),
        sans: c.fontSans,
        mono: c.fontMono,
    }
}
export type Kit = ReturnType<typeof pk>

export function tint(color: string, amount = 0.14): string {
    return `${color}${Math.round(amount * 255).toString(16).padStart(2, '0')}`
}

export interface TextOptions {
    size?: number
    color?: string
    weight?: number
    mono?: boolean
    align?: 'left' | 'center' | 'right'
    w?: number
}

export interface MarkOptions {
    width?: number
    dash?: string
    fill?: string
    stroke?: string
    r?: number
}

/** One figure: marks in a single SVG layer, labels positioned over it. Text y is the vertical center. */
export function canvas(k: Kit, width: number, height: number) {
    const marks: ReactNode[] = []
    const labels: React.ReactElement[] = []
    const add = (node: React.ReactElement) => marks.push(React.cloneElement(node, { key: `m${marks.length}` }))
    const api = {
        k,
        width,
        height,
        text(x: number, y: number, value: string | number, o: TextOptions = {}) {
            const text = String(value)
            const size = Math.max(o.size ?? 15, 15)
            const align = o.align ?? 'left'
            // The estimate runs wide, so keep the box on the canvas. Labels do not wrap.
            const estimate = o.w ?? Math.ceil(text.length * size * (o.mono ? 0.62 : 0.56)) + 6
            const room = align === 'left' ? width - 2 - x : align === 'right' ? x - 2 : 2 * Math.min(x - 2, width - 2 - x)
            const w = Math.min(estimate, room)
            const left = align === 'left' ? x : align === 'center' ? x - w / 2 : x - w
            const lineHeight = Math.round(size * 1.3)
            labels.push(CanvasItem({
                x: left,
                y: y - lineHeight / 2,
                width: w,
                height: lineHeight,
                children: <div key={`t${labels.length}`} style={{
                    display: 'flex', width: w, height: lineHeight,
                    justifyContent: align === 'left' ? 'flex-start' : align === 'center' ? 'center' : 'flex-end',
                    fontFamily: o.mono ? k.mono : k.sans, fontSize: size, lineHeight: `${lineHeight}px`,
                    fontWeight: o.weight ?? 500, color: o.color ?? k.ink, whiteSpace: 'nowrap',
                }}>{text}</div>,
            }))
        },
        line(x1: number, y1: number, x2: number, y2: number, color: string, o: MarkOptions = {}) {
            add(<line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={o.width ?? 1} strokeDasharray={o.dash} />)
        },
        rect(x: number, y: number, w: number, h: number, o: MarkOptions = {}) {
            add(<rect x={x} y={y} width={w} height={h} rx={o.r ?? 2} fill={o.fill ?? 'none'} stroke={o.stroke ?? 'none'} strokeWidth={o.stroke ? o.width ?? 1 : 0} strokeDasharray={o.dash} />)
        },
        dot(x: number, y: number, r: number, fill: string, o: MarkOptions = {}) {
            add(<circle cx={x} cy={y} r={r} fill={fill} stroke={o.stroke ?? 'none'} strokeWidth={o.stroke ? o.width ?? 1.25 : 0} />)
        },
        path(d: string, color: string, o: MarkOptions = {}) {
            add(<path d={d} fill={o.fill ?? 'none'} stroke={color} strokeWidth={o.width ?? 1} strokeDasharray={o.dash} strokeLinejoin="round" />)
        },
        arrow(x1: number, y1: number, x2: number, y2: number, color: string, o: MarkOptions = {}) {
            const stroke = o.width ?? 1.25
            const head = 4.5 + stroke * 1.6
            const angle = Math.atan2(y2 - y1, x2 - x1)
            const bx = x2 - head * Math.cos(angle)
            const by = y2 - head * Math.sin(angle)
            const spread = 0.45 * head
            const px = spread * Math.sin(angle)
            const py = spread * Math.cos(angle)
            add(<line x1={x1} y1={y1} x2={bx} y2={by} stroke={color} strokeWidth={stroke} strokeDasharray={o.dash} />)
            add(<path d={`M${x2} ${y2} L${bx + px} ${by - py} L${bx - px} ${by + py} Z`} fill={color} />)
        },
        /** A dimension line with end caps, for marking an interval. */
        span(x1: number, x2: number, y: number, color: string, o: MarkOptions = {}) {
            add(<path d={`M${x1} ${y - 4} V${y + 4} M${x1} ${y} H${x2} M${x2} ${y - 4} V${y + 4}`} fill="none" stroke={color} strokeWidth={o.width ?? 1} />)
        },
        /** A box with centered text. */
        cell(x: number, y: number, w: number, h: number, value: string | number, o: MarkOptions & TextOptions = {}) {
            api.rect(x, y, w, h, { fill: o.fill, stroke: o.stroke ?? k.line, r: o.r, dash: o.dash, width: o.width })
            if (value !== '') api.text(x + w / 2, y + h / 2, value, { color: o.color, weight: o.weight, mono: o.mono, align: 'center', w })
        },
        render(): React.ReactElement {
            const art = CanvasItem({
                x: 0,
                y: 0,
                width,
                height,
                children: <svg key="marks" width={width} height={height} viewBox={`0 0 ${width} ${height}`}>{marks}</svg>,
            })
            const items = [art, ...labels].map((item, index) => React.cloneElement(item, { key: `i${index}` }))
            return <div style={{ display: 'flex', width, height, padding: 0 }}>
                {Board({ c: k.c, width, height, background: 'transparent', children: items })}
            </div>
        },
    }
    return api
}
export type Canvas = ReturnType<typeof canvas>
