import { createElement, type ReactNode } from 'react'
import { Board, CanvasItem, Scene, TextLabel, type ThemeColors } from 'vizmatic'

export function label(
    c: ThemeColors,
    x: number,
    y: number,
    width: number,
    text: string,
    color = c.textPrimary,
    size = 24,
) {
    return CanvasItem({
        x,
        y,
        width,
        height: size + 12,
        children: TextLabel({
            c,
            text,
            color,
            width,
            fontSize: size,
            align: 'center',
            fontWeight: 650,
        }),
    })
}

export function svg(width: number, height: number, ...children: ReactNode[]) {
    return createElement('svg', { width, height, viewBox: `0 0 ${width} ${height}` }, ...children)
}

export function board(
    c: ThemeColors,
    width: number,
    height: number,
    shapes: ReactNode,
    labels: ReactNode[],
) {
    return Scene({
        c,
        padding: 16,
        gap: 0,
        contentWidth: width,
        background: 'transparent',
        children: Board({
            c,
            width,
            height,
            background: 'transparent',
            children: [CanvasItem({ x: 0, y: 0, width, height, children: shapes }), ...labels],
        }),
    })
}
