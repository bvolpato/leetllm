import { createElement } from 'react'
import type { ReactNode } from 'react'
import { Board, CanvasItem, Scene, TextLabel, renderMathSvg } from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

export function label(c: ThemeColors, id: string, text: string, x: number, y: number, width: number, options: { size?: number; color?: string; align?: 'left' | 'center' | 'right'; mono?: boolean; weight?: number; lines?: number } = {}) {
    const fontSize = options.size ?? 21
    const height = Math.ceil(fontSize * 1.4) * (options.lines ?? 1)
    return CanvasItem({ x, y, width, height, children: createElement('div', { id, style: { display: 'flex', width, height } }, TextLabel({ c, text, width, fontSize, color: options.color ?? c.textPrimary, align: options.align ?? 'left', mono: options.mono, fontWeight: options.weight ?? 650 })) })
}

export function math(c: ThemeColors, id: string, tex: string, x: number, y: number, size = 23, color = c.textPrimary, align: 'left' | 'center' | 'right' = 'left') {
    const rendered = renderMathSvg(tex, { fontSize: size, color })
    const left = align === 'center' ? x - rendered.width / 2 : align === 'right' ? x - rendered.width : x
    return CanvasItem({ x: left, y, width: rendered.width, height: rendered.height, children: createElement('div', { id, style: { display: 'flex', width: rendered.width, height: rendered.height } }, createElement('img', { src: `data:image/svg+xml;utf8,${encodeURIComponent(rendered.svg)}`, width: rendered.width, height: rendered.height, alt: tex })) })
}

export function figure(c: ThemeColors, width: number, height: number, geometry: ReactNode[], labels: ReactNode[]) {
    return Scene({ c, padding: 0, gap: 0, contentWidth: width, children: Board({ c, width, height, background: 'transparent', children: [CanvasItem({ x: 0, y: 0, width, height, children: createElement('svg', { width, height, viewBox: `0 0 ${width} ${height}` }, ...geometry) }), ...labels] }) })
}
