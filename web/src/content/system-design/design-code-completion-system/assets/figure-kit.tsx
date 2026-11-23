import React, { type ReactNode } from 'react'
import { CanvasItem, TextLabel, VectorArrow, VectorSegment, getReadableToneColor, getThemeColors, type ThemeMode, type ToneName } from 'vizmatic'
export function kit(theme: ThemeMode) {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const ink = (tone: ToneName = 'neutral') => tone === 'neutral' ? c.textPrimary : getReadableToneColor(tone, c, c.bgCard)
    const text = (id: string, x: number, y: number, value: string, w: number, tone: ToneName = 'neutral', size = 26, mono = false, bold = false) =>
        <CanvasItem key={id} x={x} y={y} width={w} height={Math.ceil(size * 1.35)}><TextLabel c={c} text={value} color={ink(tone)} fontSize={size} fontWeight={bold ? 600 : 400} mono={mono} width={w} /></CanvasItem>
    const box = (id: string, x: number, y: number, w: number, h: number, children: ReactNode, tone: ToneName = 'neutral', plain = false) =>
        <CanvasItem key={id} x={x} y={y} width={w} height={h}><div data-owner={id} style={{ display: 'flex', position: 'relative', width: w, height: h, background: plain ? 'transparent' : c.bgCard, border: `2px solid ${plain ? 'transparent' : ink(tone)}`, borderRadius: 10 }}>{children}</div></CanvasItem>
    const svg = (id: string, x1: number, y1: number, x2: number, y2: number, child: ReactNode) => {
        const x = Math.max(0,Math.min(x1,x2)-16), y = Math.max(0,Math.min(y1,y2)-16), w = Math.min(700,Math.max(x1,x2)+16)-x, h = Math.max(y1,y2)+16-y
        return <CanvasItem key={id} x={x} y={y} width={w} height={h}><svg width={w} height={h} viewBox={`${x} ${y} ${w} ${h}`}>{child}</svg></CanvasItem>
    }
    const arrow = (id: string, x1: number, y1: number, x2: number, y2: number, tone: ToneName = 'neutral') => svg(id,x1,y1,x2,y2,VectorArrow({x1,y1,x2,y2,color:ink(tone),strokeWidth:3,arrowSize:4}))
    const line = (id: string, x1: number, y1: number, x2: number, y2: number, tone: ToneName = 'neutral') => svg(id,x1,y1,x2,y2,VectorSegment({x1,y1,x2,y2,color:ink(tone),strokeWidth:3,showEndDot:false}))
    const root = (w: number, h: number, children: ReactNode) => <div style={{ display: 'flex', position: 'relative', width: w, height: h, background: 'transparent', fontFamily: 'Inter', color: c.textPrimary }}>{children}</div>
    return { c, ink, text, box, arrow, line, root }
}
