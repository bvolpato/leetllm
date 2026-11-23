/**
 * Drawing kit for this chapter's figures. One layout serves the website and the book.
 *
 * The canvas is 640 wide with labels at 19 to 20 pixels. That stays near 10.5 CSS pixels on a
 * 343 pixel phone and prints near 8.75 pt in the book column. Inter carries labels, and mono is
 * only for code and identifiers. Every color comes from the default Vizmatic theme, with one
 * meaning per tone: go = allowed, stop = blocked or wrong, ask = waiting on a person or a
 * threshold, data = facts read from a source, model = what a model produced.
 */
import React, { type CSSProperties, type ReactNode } from 'react'
import { getReadableToneColor, getThemeColors, withColorAlpha, type ThemeMode } from 'vizmatic'

const h = React.createElement

export const W = 640
export const PAD = 12
export const INNER = W - PAD * 2
export const T = 20
export const S = 19

export function kit(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme)
    const tone = (name: Parameters<typeof getReadableToneColor>[0]) => getReadableToneColor(name, c, c.bg)
    return {
        c,
        ink: c.textPrimary,
        mid: c.textSecondary,
        line: c.border,
        go: tone('green'),
        stop: tone('critical'),
        ask: tone('warm'),
        data: tone('blue'),
        model: tone('purple'),
        sans: c.fontSans,
        mono: c.fontMono,
    }
}
export type Kit = ReturnType<typeof kit>

export const tint = (color: string, amount = 0.12): string => withColorAlpha(color, amount)

export function figure(k: Kit, children: ReactNode, gap = 12): React.ReactElement {
    return h('div', { style: { display: 'flex', flexDirection: 'column', width: W, gap, padding: PAD, boxSizing: 'border-box', fontFamily: k.sans, color: k.ink } }, children)
}

export const row = (children: ReactNode, style: CSSProperties = {}): React.ReactElement =>
    h('div', { style: { display: 'flex', alignItems: 'center', ...style } }, children)

export const col = (children: ReactNode, style: CSSProperties = {}): React.ReactElement =>
    h('div', { style: { display: 'flex', flexDirection: 'column', ...style } }, children)

export interface LabelOptions {
    size?: number
    color?: string
    weight?: number
    mono?: boolean
    width?: number
    align?: 'left' | 'center' | 'right'
    style?: CSSProperties
}

export function label(k: Kit, text: string, o: LabelOptions = {}): React.ReactElement {
    const size = o.size ?? (o.mono ? S : T)
    const fit = o.width === undefined ? { minWidth: Math.ceil(text.length * size * (o.mono ? 0.6 : 0.5)) + 2 } : { width: o.width }
    return h('div', {
        style: {
            display: 'flex', fontSize: size, lineHeight: 1.25, fontWeight: o.weight ?? 400, color: o.color ?? k.ink,
            fontFamily: o.mono ? k.mono : k.sans, justifyContent: o.align === 'center' ? 'center' : o.align === 'right' ? 'flex-end' : 'flex-start',
            textAlign: o.align ?? 'left', ...fit, ...o.style,
        },
    }, text)
}

export interface PhrasePart {
    text: string
    fill?: string
    weight?: number
    color?: string
}

/** Running text that wraps word by word, so a highlight can break across lines. */
export function phrase(k: Kit, parts: readonly PhrasePart[], size = T): React.ReactElement {
    const words = parts.flatMap((part) => part.text.split(' ').filter(Boolean).map((word) => ({ ...part, word })))
    return h('div', { style: { display: 'flex', flexWrap: 'wrap', rowGap: 3 } }, words.map((word, index) => h('div', {
        key: index,
        style: {
            display: 'flex', fontSize: size, lineHeight: 1.25, fontWeight: word.weight ?? 400, color: word.color ?? k.ink, fontFamily: k.sans,
            backgroundColor: word.fill ?? 'transparent', padding: '0 5px 0 0',
        },
    }, word.word)))
}

export interface BoxOptions {
    color?: string
    fill?: boolean
    dashed?: boolean
    width?: number
    height?: number
    style?: CSSProperties
}

/** A hairline box. Fill is reserved for the marks that carry the point. */
export function box(k: Kit, children: ReactNode, o: BoxOptions = {}): React.ReactElement {
    const color = o.color ?? k.line
    return h('div', {
        style: {
            display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 3, padding: '7px 10px', boxSizing: 'border-box', borderRadius: 3,
            border: `1.25px ${o.dashed ? 'dashed' : 'solid'} ${color}`, backgroundColor: o.fill ? tint(color) : 'transparent',
            ...(o.width === undefined ? {} : { width: o.width }), ...(o.height === undefined ? {} : { height: o.height }), ...o.style,
        },
    }, children)
}

export function arrow(color: string, length = 30, direction: 'right' | 'down' = 'right', dashed = false): React.ReactElement {
    const across = 12
    const dash = dashed ? { strokeDasharray: '5 4' } : {}
    return direction === 'right'
        ? h('svg', { width: length, height: across, viewBox: `0 0 ${length} ${across}`, style: { flexShrink: 0 } },
            h('path', { d: `M0 6 H${length - 7}`, stroke: color, strokeWidth: 1.5, fill: 'none', ...dash }),
            h('path', { d: `M${length} 6 L${length - 8} 1.5 L${length - 8} 10.5 Z`, fill: color }))
        : h('svg', { width: across, height: length, viewBox: `0 0 ${across} ${length}`, style: { flexShrink: 0 } },
            h('path', { d: `M6 0 V${length - 7}`, stroke: color, strokeWidth: 1.5, fill: 'none', ...dash }),
            h('path', { d: `M6 ${length} L1.5 ${length - 8} L10.5 ${length - 8} Z`, fill: color }))
}

export function mark(kind: 'yes' | 'no', color: string, size = 16): React.ReactElement {
    const d = kind === 'yes' ? 'M3 8.8 L6.6 12.4 L13.2 4.2' : 'M4 4 L12 12 M12 4 L4 12'
    return h('svg', { width: size, height: size, viewBox: '0 0 16 16', style: { flexShrink: 0 } },
        h('path', { d, stroke: color, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' }))
}

/** A child placed at exact coordinates inside a plane. */
export const at = (x: number, y: number, children: ReactNode, style: CSSProperties = {}): React.ReactElement =>
    h('div', { style: { display: 'flex', position: 'absolute', left: x, top: y, ...style } }, children)

/** A positioned container for matrices and plots. */
export const plane = (width: number, height: number, children: ReactNode): React.ReactElement =>
    h('div', { style: { display: 'flex', position: 'relative', width, height, flexShrink: 0 } }, children)

/** An SVG mark layer that fills a plane. Text sits above it, because Satori does not lay out SVG text. */
export const marks = (width: number, height: number, children: ReactNode): React.ReactElement =>
    h('svg', { width, height, viewBox: `0 0 ${width} ${height}`, style: { position: 'absolute', left: 0, top: 0 } }, children)

/** Path data for a horizontal arrow shaft and head, drawn in a mark layer. */
export function hArrow(color: string, x1: number, x2: number, y: number): React.ReactElement {
    const back = x2 > x1 ? -8 : 8
    return h(React.Fragment, null,
        h('path', { d: `M${x1} ${y} H${x2 + back * 0.85}`, stroke: color, strokeWidth: 1.5, fill: 'none' }),
        h('path', { d: `M${x2} ${y} L${x2 + back} ${y - 4.5} L${x2 + back} ${y + 4.5} Z`, fill: color }))
}

export function vArrow(color: string, x: number, y1: number, y2: number): React.ReactElement {
    return h(React.Fragment, null,
        h('path', { d: `M${x} ${y1} V${y2 - 7}`, stroke: color, strokeWidth: 1.5, fill: 'none' }),
        h('path', { d: `M${x} ${y2} L${x - 4.5} ${y2 - 8} L${x + 4.5} ${y2 - 8} Z`, fill: color }))
}

/** A soft curve for joining rows, drawn in a mark layer. */
export const curve = (color: string, x1: number, y1: number, x2: number, y2: number, dash?: string): React.ReactElement => {
    const mid = (x1 + x2) / 2
    return h('path', { d: `M${x1} ${y1} C${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`, stroke: color, strokeWidth: 1.5, fill: 'none', ...(dash ? { strokeDasharray: dash } : {}) })
}
