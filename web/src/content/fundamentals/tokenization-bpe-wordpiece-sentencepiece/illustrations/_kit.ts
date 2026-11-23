/**
 * Small drawing kit for the figures in this chapter. Every figure is created at
 * WIDE logical pixels, the book column at print scale, so LABEL pixels print near
 * 8.5 pt on every figure, whatever its crop. Marks live in one SVG layer and text sits above it,
 * because Satori does not lay out SVG text.
 */
import React from 'react'
import {
    Board, CanvasItem, TextLabel, getReadableToneColor, getThemeColors, renderMathSvg, withColorAlpha,
    type ThemeColors, type ThemeMode, type ToneName,
} from 'vizmatic'

export const WIDE = 716
export const LABEL = 15
export const SMALL = 15
export const HEAD = 17

export interface TextOptions {
    size?: number
    color?: string
    align?: 'left' | 'center' | 'right'
    mono?: boolean
    weight?: number
    tone?: ToneName
}

export interface Kit {
    c: ThemeColors
    ink: (tone: ToneName) => string
    tint: (tone: ToneName, alpha?: number) => string
    /** Text whose box starts at (x, y) and spans width w. */
    t: (x: number, y: number, w: number, text: string, options?: TextOptions) => React.ReactNode
    /** Text centered vertically in the band starting at y with height h. */
    mid: (x: number, y: number, w: number, h: number, text: string, options?: TextOptions) => React.ReactNode
    tex: (x: number, y: number, source: string, options?: { size?: number; color?: string }) => React.ReactNode
    rect: (x: number, y: number, w: number, h: number, options?: { fill?: string; stroke?: string; strokeWidth?: number; rx?: number; dash?: string; opacity?: number }) => React.ReactNode
    line: (x1: number, y1: number, x2: number, y2: number, options?: { stroke?: string; strokeWidth?: number; dash?: string; opacity?: number }) => React.ReactNode
    path: (d: string, options?: { stroke?: string; strokeWidth?: number; fill?: string; dash?: string; opacity?: number }) => React.ReactNode
    arrow: (d: string, tipX: number, tipY: number, angle: number, options?: { stroke?: string; strokeWidth?: number; size?: number; dash?: string; opacity?: number }) => React.ReactNode
    dot: (x: number, y: number, r: number, options?: { fill?: string; stroke?: string; strokeWidth?: number }) => React.ReactNode
    frame: (width: number, height: number, marks: React.ReactNode[], labels: React.ReactNode[]) => React.ReactElement
}

let nextKey = 0
const key = () => `k${nextKey++}`

export function makeKit(theme: ThemeMode): Kit {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const ink = (tone: ToneName) => getReadableToneColor(tone, c, c.bg)
    const tint = (tone: ToneName, alpha = 0.14) => withColorAlpha(ink(tone), alpha)
    const t: Kit['t'] = (x, y, w, text, options = {}) => {
        const size = options.size ?? LABEL
        // A label's box must stay on the canvas, or the layout check reads it as overflow.
        return React.createElement(CanvasItem, { key: key(), x, y, width: Math.min(w, WIDE - 4 - x), height: Math.ceil(size * 1.4) + 2 },
            React.createElement(TextLabel, {
                c, text, fontSize: size, align: options.align ?? 'left', mono: options.mono ?? false,
                fontWeight: options.weight ?? 400,
                color: options.color ?? (options.tone ? ink(options.tone) : c.textPrimary),
            }))
    }
    const mid: Kit['mid'] = (x, y, w, h, text, options = {}) => t(x, y + (h - (options.size ?? LABEL) * 1.35) / 2 - 0.5, w, text, options)
    const tex: Kit['tex'] = (x, y, source, options = {}) => {
        const math = renderMathSvg(source, { fontSize: options.size ?? 17, color: options.color ?? c.textPrimary })
        return React.createElement(CanvasItem, { key: key(), x, y, width: math.width, height: math.height },
            React.createElement('img', { src: `data:image/svg+xml;utf8,${encodeURIComponent(math.svg)}`, width: math.width, height: math.height }))
    }
    const rect: Kit['rect'] = (x, y, w, h, options = {}) => React.createElement('rect', {
        key: key(), x, y, width: w, height: h, rx: options.rx ?? 3,
        fill: options.fill ?? 'none', stroke: options.stroke ?? 'none', strokeWidth: options.strokeWidth ?? 1.25,
        ...(options.dash ? { strokeDasharray: options.dash } : {}), ...(options.opacity !== undefined ? { opacity: options.opacity } : {}),
    })
    const line: Kit['line'] = (x1, y1, x2, y2, options = {}) => React.createElement('line', {
        key: key(), x1, y1, x2, y2, stroke: options.stroke ?? c.borderLight, strokeWidth: options.strokeWidth ?? 1.25,
        ...(options.dash ? { strokeDasharray: options.dash } : {}), ...(options.opacity !== undefined ? { opacity: options.opacity } : {}),
    })
    const path: Kit['path'] = (d, options = {}) => React.createElement('path', {
        key: key(), d, fill: options.fill ?? 'none', stroke: options.stroke ?? c.borderLight, strokeWidth: options.strokeWidth ?? 1.25,
        strokeLinecap: 'round', strokeLinejoin: 'round',
        ...(options.dash ? { strokeDasharray: options.dash } : {}), ...(options.opacity !== undefined ? { opacity: options.opacity } : {}),
    })
    const arrow: Kit['arrow'] = (d, tipX, tipY, angle, options = {}) => {
        const stroke = options.stroke ?? c.textSecondary
        const size = options.size ?? 7
        const a = (angle + 152) * Math.PI / 180, b = (angle - 152) * Math.PI / 180
        const head = `M${tipX} ${tipY}L${tipX + Math.cos(a) * size} ${tipY + Math.sin(a) * size}L${tipX + Math.cos(b) * size} ${tipY + Math.sin(b) * size}Z`
        return React.createElement('g', { key: key(), ...(options.opacity !== undefined ? { opacity: options.opacity } : {}) },
            React.createElement('path', { d, fill: 'none', stroke, strokeWidth: options.strokeWidth ?? 1.5, strokeLinecap: 'round', strokeLinejoin: 'round', ...(options.dash ? { strokeDasharray: options.dash } : {}) }),
            React.createElement('path', { d: head, fill: stroke }))
    }
    const dot: Kit['dot'] = (x, y, r, options = {}) => React.createElement('circle', {
        key: key(), cx: x, cy: y, r, fill: options.fill ?? c.textPrimary, stroke: options.stroke ?? 'none', strokeWidth: options.strokeWidth ?? 1.5,
    })
    const frame: Kit['frame'] = (width, height, marks, labels) => React.createElement(Board, { c, width, height, background: 'transparent' },
        React.createElement(CanvasItem, { x: 0, y: 0, width, height },
            React.createElement('svg', { width, height, viewBox: `0 0 ${width} ${height}` }, ...marks)),
        ...labels)
    return { c, ink, tint, t, mid, tex, rect, line, path, arrow, dot, frame }
}
