/**
 * Drawing kit shared by the figures in this chapter.
 *
 * A figure draws twice from one function. The website layout is 672 logical pixels wide
 * with labels at 20 and 24 pixels, so text stays readable on a phone. The print layout
 * is 700 wide with labels at 15 pixels, which fills the book's text block at about 8.7 pt.
 * Column positions scale with `W` and row heights scale with `T`, so the same code gives
 * both layouts.
 * Labels use Inter, with mono kept for code, IDs, and tensor values. Colors come from the
 * default Vizmatic theme. Marks live in one SVG layer and text sits above it, because Satori does not lay out
 * SVG text.
 */
import React from 'react'
import {
    Board, CanvasItem, TextLabel, getReadableToneColor, getThemeColors, renderMathSvg, withColorAlpha,
    type ThemeColors, type ThemeMode, type ToneName,
} from 'vizmatic'

export interface Layout {
    /** Canvas width. */
    W: number
    /** Primary label size. */
    T: number
    /** Secondary label size. */
    S: number
    /** True for the print layout, where panels may sit side by side. */
    print: boolean
}

export const WEB: Layout = { W: 672, T: 24, S: 20, print: false }
export const PRINT: Layout = { W: 700, T: 15, S: 15, print: true }

export interface TextOptions {
    size?: number
    color?: string
    align?: 'left' | 'center' | 'right'
    mono?: boolean
    weight?: number
    tone?: ToneName
}

export interface StrokeOptions {
    stroke?: string
    strokeWidth?: number
    dash?: string
    opacity?: number
}

export interface Kit {
    c: ThemeColors
    L: Layout
    ink: (tone: ToneName) => string
    tint: (tone: ToneName, alpha?: number) => string
    /** Text whose box starts at (x, y) and spans width w. */
    t: (x: number, y: number, w: number, text: string, options?: TextOptions) => void
    /** Text centered vertically in the band that starts at y with height h. */
    mid: (x: number, y: number, w: number, h: number, text: string, options?: TextOptions) => void
    tex: (x: number, y: number, source: string, options?: { size?: number; color?: string }) => void
    rect: (x: number, y: number, w: number, h: number, options?: StrokeOptions & { fill?: string; rx?: number }) => void
    line: (x1: number, y1: number, x2: number, y2: number, options?: StrokeOptions) => void
    path: (d: string, options?: StrokeOptions & { fill?: string }) => void
    /** A line that ends in a small filled head at (x2, y2). */
    arrow: (x1: number, y1: number, x2: number, y2: number, options?: StrokeOptions & { size?: number }) => void
    dot: (x: number, y: number, r: number, options?: { fill?: string; stroke?: string; strokeWidth?: number }) => void
    frame: (height: number) => React.ReactElement
}

export function makeKit(theme: ThemeMode, L: Layout): Kit {
    const c = getThemeColors(theme)
    const marks: React.ReactNode[] = []
    const labels: React.ReactNode[] = []
    const dashed = (dash?: string) => (dash ? { strokeDasharray: dash } : {})
    const faded = (opacity?: number): { opacity?: number } => (opacity === undefined ? {} : { opacity })
    const ink = (tone: ToneName) => getReadableToneColor(tone, c, c.bg)
    const tint = (tone: ToneName, alpha = 0.16) => withColorAlpha(ink(tone), alpha)
    const t: Kit['t'] = (x, y, w, text, options = {}) => {
        const size = options.size ?? L.T
        labels.push(React.createElement(CanvasItem, { x, y, width: w, height: Math.ceil(size * 1.4) + 2 },
            React.createElement(TextLabel, {
                c, text, fontSize: size, align: options.align ?? 'left', mono: options.mono ?? false, width: '100%',
                fontWeight: options.weight ?? 400,
                color: options.color ?? (options.tone ? ink(options.tone) : c.textPrimary),
            })))
    }
    return {
        c, L, ink, tint, t,
        mid: (x, y, w, h, text, options = {}) => t(x, y + (h - (options.size ?? L.T) * 1.35) / 2 - 0.5, w, text, options),
        tex: (x, y, source, options = {}) => {
            const math = renderMathSvg(source, { fontSize: options.size ?? L.T + 2, color: options.color ?? c.textPrimary })
            labels.push(React.createElement(CanvasItem, { x, y, width: math.width, height: math.height },
                React.createElement('img', { src: `data:image/svg+xml;utf8,${encodeURIComponent(math.svg)}`, width: math.width, height: math.height })))
        },
        rect: (x, y, w, h, o = {}) => {
            marks.push(React.createElement('rect', {
                x, y, width: w, height: h, rx: o.rx ?? 2, fill: o.fill ?? 'none', stroke: o.stroke ?? 'none',
                strokeWidth: o.strokeWidth ?? 1, ...dashed(o.dash), ...faded(o.opacity),
            }))
        },
        line: (x1, y1, x2, y2, o = {}) => {
            marks.push(React.createElement('line', {
                x1, y1, x2, y2, stroke: o.stroke ?? c.border, strokeWidth: o.strokeWidth ?? 1, ...dashed(o.dash), ...faded(o.opacity),
            }))
        },
        path: (d, o = {}) => {
            marks.push(React.createElement('path', {
                d, fill: o.fill ?? 'none', stroke: o.stroke ?? c.border, strokeWidth: o.strokeWidth ?? 1,
                strokeLinecap: 'round', strokeLinejoin: 'round', ...dashed(o.dash), ...faded(o.opacity),
            }))
        },
        arrow: (x1, y1, x2, y2, o = {}) => {
            const stroke = o.stroke ?? c.textSecondary
            const size = o.size ?? (L.print ? 6 : 7)
            const angle = Math.atan2(y2 - y1, x2 - x1)
            const back = (turn: number) => `${x2 + Math.cos(angle + turn) * size} ${y2 + Math.sin(angle + turn) * size}`
            const neck = size * 0.8
            marks.push(React.createElement('g', faded(o.opacity),
                React.createElement('line', {
                    x1, y1, x2: x2 - Math.cos(angle) * neck, y2: y2 - Math.sin(angle) * neck, stroke,
                    strokeWidth: o.strokeWidth ?? 1.25, ...dashed(o.dash),
                }),
                React.createElement('path', { d: `M${x2} ${y2}L${back(2.65)}L${back(-2.65)}Z`, fill: stroke })))
        },
        dot: (x, y, r, o = {}) => {
            marks.push(React.createElement('circle', {
                cx: x, cy: y, r, fill: o.fill ?? c.textPrimary, stroke: o.stroke ?? 'none', strokeWidth: o.strokeWidth ?? 1.5,
            }))
        },
        frame: height => React.createElement(Board, { c, width: L.W, height },
            React.createElement(CanvasItem, { x: 0, y: 0, width: L.W, height },
                React.createElement('svg', { width: L.W, height, viewBox: `0 0 ${L.W} ${height}` }, ...marks)),
            ...labels),
    }
}
