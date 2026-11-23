import React from 'react'
import { CanvasItem, TextLabel, VectorArrow, getReadableToneColor, getThemeColors } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'
export function kit(theme: ThemeMode, width: number, height: number) {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const tones = { blue: getReadableToneColor('blue', c), purple: getReadableToneColor('purple', c), green: getReadableToneColor('green', c), warm: getReadableToneColor('warm', c), critical: getReadableToneColor('critical', c) }
    const tint = (color: string) => '#' + [1, 3, 5].map(i => Math.round(parseInt(c.bgCard.slice(i, i + 2), 16) * .84 + parseInt(color.slice(i, i + 2), 16) * .16).toString(16).padStart(2, '0')).join('')
    const text = (value: string, x: number, y: number, w: number, size = 24, weight = 600, color = c.textPrimary, align: 'left' | 'center' | 'right' = 'left') => <CanvasItem x={x} y={y} width={w} height={42}><div style={{ display: 'flex', width: w }}>{TextLabel({ c, text: value, width: w, fontSize: size, fontWeight: weight, color, align })}</div></CanvasItem>
    const box = (x: number, y: number, w: number, h: number, color: string, content?: React.ReactNode) => <CanvasItem x={x} y={y} width={w} height={h}><div style={{ display: 'flex', width: w, height: h, border: `3px solid ${color}`, borderRadius: 10, backgroundColor: tint(color) }}>{content}</div></CanvasItem>
    const cell = (value: string, x: number, y: number, w: number, h: number, color: string) => <CanvasItem x={x} y={y} width={w} height={h}><div style={{ display: 'flex', width: w, height: h, alignItems: 'center', justifyContent: 'center', border: `3px solid ${color}`, backgroundColor: tint(color) }}>{TextLabel({ c, text: value, fontSize: 28, fontWeight: 750, color: c.textPrimary })}</div></CanvasItem>
    const arrow = (x1: number, y1: number, x2: number, y2: number, color = c.textSecondary) => VectorArrow({ x1, y1, x2, y2, color, strokeWidth: 3.5, arrowSize: 4 })
    const svg = (children: React.ReactNode) => <CanvasItem x={0} y={0} width={width} height={height}><svg aria-hidden="true" width={width} height={height} viewBox={`0 0 ${width} ${height}`}>{children}</svg></CanvasItem>
    const frame = (children: React.ReactNode) => <div style={{ display: 'flex', position: 'relative', width, height, fontFamily: c.fontSans, background: 'transparent' }}>{children}</div>
    return { c, ...tones, tint, text, box, cell, arrow, svg, frame }
}
