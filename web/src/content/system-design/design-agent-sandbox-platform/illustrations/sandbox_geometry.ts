import React from 'react'
import { Arrow, CanvasItem, TextLabel, type ThemeColors } from 'vizmatic'

export function text(c: ThemeColors, value: string, x: number, y: number, width: number, size = 32, color = c.textPrimary, weight = 500, align: 'left' | 'center' | 'right' = 'left') {
    return CanvasItem({ x, y, width, height: size * 1.6, children: React.createElement(TextLabel, { c, text: value, width, fontSize: size, fontWeight: weight, color, align }) })
}
export function panel(c: ThemeColors, x: number, y: number, width: number, height: number, dashed = false) {
    return React.createElement('rect', { x, y, width, height, rx: 8, fill: c.bgCard, stroke: c.textPrimary, strokeWidth: 3, ...(dashed ? { strokeDasharray: '10 8' } : {}) })
}
export function route(c: ThemeColors, x1: number, y1: number, x2: number, y2: number) {
    if (x1 !== x2 && y1 !== y2) throw new Error('Use explicit orthogonal segments')
    const vertical = x1 === x2, length = Math.abs(vertical ? y2 - y1 : x2 - x1)
    if (length < 14) throw new Error('Arrow route too short for a complete triangular head')
    return CanvasItem({ x: vertical ? x1 - 7 : Math.min(x1, x2), y: vertical ? Math.min(y1, y2) : y1 - 7, width: vertical ? 14 : length, height: vertical ? length : 14, children: Arrow({ c, color: c.textPrimary, length, direction: vertical ? (y2 > y1 ? 'down' : 'up') : (x2 > x1 ? 'right' : 'left') }) })
}
export function file(c: ThemeColors, x: number, y: number, width: number, height: number) {
    return React.createElement('path', { d: `M ${x + 1.5} ${y + 1.5} H ${x + width - 24} L ${x + width - 1.5} ${y + 24} V ${y + height - 1.5} H ${x + 1.5} Z M ${x + width - 24} ${y + 1.5} V ${y + 24} H ${x + width - 1.5}`, fill: c.bgCard, stroke: c.textPrimary, strokeWidth: 3, strokeLinejoin: 'round' })
}
export const arrowGeometry = { primitive: 'Vizmatic Arrow', shaftWidth: 2, triangularHeadWidth: 14, triangularHeadLength: 10 }
