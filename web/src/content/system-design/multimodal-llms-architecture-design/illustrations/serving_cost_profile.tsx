import { createElement, type ReactNode } from 'react'
import {
    Board,
    CanvasItem,
    SvgFrame,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
    withColorAlpha,
    type ThemeMode,
} from 'vizmatic'

type Colors = ReturnType<typeof getThemeColors>

export const width = 760
export const height = 370
export const alt =
    'Execution matrix of five multimodal serving stages across four cache tiers. Cold requests run all five stages. Feature cache reuses vision/audio encoding. Projected-token cache reuses encoding and projection. Prefix-KV cache reuses encoding, projection, and shared-prefix prefill, running only new-query prefill and autoregressive decode.'

function lbl(
    c: Colors,
    text: string,
    x: number,
    y: number,
    w: number,
    h: number,
    fontSize: number,
    color = c.textPrimary,
    fontWeight = 650,
    align: 'left' | 'center' | 'right' = 'left',
    mono = false,
) {
    return CanvasItem({
        x,
        y,
        width: w,
        height: h,
        children: TextLabel({ c, text, width: w, fontSize, color, fontWeight, align, mono }),
    })
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const red = getReadableToneColor('critical', c)
    const warm = getReadableToneColor('warm', c)
    const blue = getReadableToneColor('blue', c)
    const green = getReadableToneColor('green', c)

    const cols = [
        { name: 'Cold', sub: 'No cache', x: 254, tone: red },
        { name: 'Feature', sub: 'ViT out', x: 376, tone: warm },
        { name: 'Projected', sub: 'Tokens', x: 498, tone: blue },
        { name: 'Prefix KV', sub: 'Paged KV', x: 620, tone: green },
    ]
    const colW = 112

    const stages = [
        { name: '1 · Vision Encode', flags: [true, false, false, false] },
        { name: '2 · Projection', flags: [true, true, false, false] },
        { name: '3 · Prefix Prefill', flags: [true, true, true, false] },
        { name: '4 · Query Prefill', flags: [true, true, true, true] },
        { name: '5 · Token Decode', flags: [true, true, true, true] },
    ]

    const rowStart = 96
    const rowStep = 50

    const geometry = [
        // Column header boxes (frameless on transparent canvas)
        ...cols.map((col, idx) =>
            SvgFrame({
                c,
                key: `ch-${idx}`,
                x: col.x,
                y: 26,
                width: colW,
                height: 54,
                rx: 7,
                fill: withColorAlpha(col.tone, 0.14),
                stroke: col.tone,
                strokeWidth: 1.5,
            }),
        ),
        createElement('line', {
            key: 'hdr-rule',
            x1: 28,
            y1: 88,
            x2: 732,
            y2: 88,
            stroke: c.borderSubtle,
            strokeWidth: 1.2,
        }),
        // Row dividers & status pills
        ...stages.flatMap((st, rIdx) => {
            const y = rowStart + rIdx * rowStep
            const rowItems: ReactNode[] =
                rIdx < stages.length - 1
                    ? [
                          createElement('line', {
                              key: `rl-${rIdx}`,
                              x1: 28,
                              y1: y + 44,
                              x2: 732,
                              y2: y + 44,
                              stroke: c.borderSubtle,
                              strokeWidth: 1,
                          }),
                      ]
                    : []
            st.flags.forEach((runs, cIdx) => {
                const col = cols[cIdx]
                rowItems.push(
                    SvgFrame({
                        c,
                        key: `cell-${rIdx}-${cIdx}`,
                        x: col.x + 12,
                        y: y + 5,
                        width: colW - 24,
                        height: 32,
                        rx: 6,
                        fill: withColorAlpha(runs ? red : green, runs ? 0.16 : 0.2),
                        stroke: runs ? red : green,
                        strokeWidth: 1.5,
                    }),
                )
            })
            return rowItems
        }),
    ]

    const labels = [
        lbl(c, 'Pipeline Stage', 30, 44, 210, 24, 17, c.textPrimary, 800),
        ...cols.flatMap((col) => [
            lbl(c, col.name, col.x, 32, colW, 22, 16, col.tone, 800, 'center'),
            lbl(c, col.sub, col.x, 54, colW, 22, 16, c.textSecondary, 600, 'center'),
        ]),
        ...stages.flatMap((st, rIdx) => {
            const y = rowStart + rIdx * rowStep
            return [
                lbl(c, st.name, 30, y + 10, 214, 22, 16, c.textPrimary, 700),
                ...st.flags.map((runs, cIdx) => {
                    const col = cols[cIdx]
                    return lbl(
                        c,
                        runs ? 'RUN' : 'REUSE',
                        col.x + 12,
                        y + 10,
                        colW - 24,
                        22,
                        16,
                        runs ? red : green,
                        800,
                        'center',
                        true,
                    )
                }),
            ]
        }),
    ]

    const svg = createElement(
        'svg',
        { width, height, viewBox: `0 0 ${width} ${height}`, role: 'presentation', 'aria-hidden': true },
        ...geometry,
    )
    return Board({
        c,
        width,
        height,
        background: 'transparent',
        children: [CanvasItem({ x: 0, y: 0, width, height, children: svg }), ...labels],
    })
}

export default create('dark')
