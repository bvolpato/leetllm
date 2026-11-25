import { createElement } from 'react'
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
export const height = 500

export const alt =
    'Top panel compares peak in-flight activation sets for p=4 stages and m=8 microbatches: GPipe stores 8 sets per stage, while plain 1F1B caps live sets at [4, 3, 2, 1]. Bottom panel plots the ideal bubble fraction (p-1)/(m+p-1) for p=8 stages as microbatches m increase: 87.5% at m=1, 63.6% at m=4, 46.7% at m=8, 17.95% at m=32, and 9.9% at m=64.'

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

export const create = (theme: ThemeMode = 'dark') => {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const warm = getReadableToneColor('warm', c)
    const blue = getReadableToneColor('blue', c)
    const green = getReadableToneColor('green', c)
    const muted = c.textSecondary

    const oneFOneB = [4, 3, 2, 1]
    const stageYs = [82, 118, 154, 190]

    const bubbles = [
        { m: 'm = 1', pct: 87.5, text: '87.5%', tone: warm },
        { m: 'm = 4', pct: 63.64, text: '63.6%', tone: warm },
        { m: 'm = 8', pct: 46.67, text: '46.7%', tone: blue },
        { m: 'm = 32', pct: 17.95, text: '17.95%', tone: green },
        { m: 'm = 64', pct: 9.86, text: '9.9%', tone: green },
    ]

    const barX = 136
    const barW = 470

    const geometry = [
        // Top panel
        SvgFrame({
            c,
            key: 'top',
            x: 14,
            y: 12,
            width: 732,
            height: 222,
            rx: 10,
            fill: c.bgCard,
            stroke: c.borderSubtle,
            strokeWidth: 1.2,
        }),
        // Bottom panel
        SvgFrame({
            c,
            key: 'bot',
            x: 14,
            y: 250,
            width: 732,
            height: 236,
            rx: 10,
            fill: c.bgCard,
            stroke: c.borderSubtle,
            strokeWidth: 1.2,
        }),

        // Activation blocks for GPipe & 1F1B
        ...stageYs.flatMap((y, s) => [
            ...Array.from({ length: 8 }, (_, i) =>
                SvgFrame({
                    c,
                    key: `gp-${s}-${i}`,
                    x: 136 + i * 24,
                    y,
                    width: 20,
                    height: 24,
                    rx: 4,
                    fill: withColorAlpha(warm, 0.35),
                    stroke: warm,
                    strokeWidth: 1.4,
                }),
            ),
            ...Array.from({ length: 8 }, (_, i) => {
                const active = i < oneFOneB[s]
                return createElement('rect', {
                    key: `fb-${s}-${i}`,
                    x: 436 + i * 24,
                    y,
                    width: 20,
                    height: 24,
                    rx: 4,
                    fill: active ? withColorAlpha(blue, 0.35) : 'none',
                    stroke: active ? blue : c.borderSubtle,
                    strokeWidth: active ? 1.5 : 1.2,
                    strokeDasharray: active ? undefined : '3 3',
                })
            }),
        ]),

        // Bubble bars
        ...bubbles.flatMap((row, i) => {
            const y = 304 + i * 34
            const w = (row.pct / 100) * barW
            return [
                SvgFrame({
                    c,
                    key: `b-bg-${i}`,
                    x: barX,
                    y,
                    width: barW,
                    height: 24,
                    rx: 4,
                    fill: c.bgSubtle,
                    stroke: c.borderSubtle,
                    strokeWidth: 1,
                }),
                SvgFrame({
                    c,
                    key: `b-fg-${i}`,
                    x: barX,
                    y,
                    width: w,
                    height: 24,
                    rx: 4,
                    fill: withColorAlpha(row.tone, 0.35),
                    stroke: row.tone,
                    strokeWidth: 1.6,
                }),
            ]
        }),
    ]

    const labels = [
        // Top header
        lbl(c, '1 · Peak Live Activation Sets (p = 4, m = 8)', 30, 22, 690, 24, 17, c.textPrimary, 800),
        lbl(c, 'GPipe (all m = 8)', 136, 54, 210, 22, 16, warm, 700),
        lbl(c, 'Plain 1F1B (min(m, p−i))', 436, 54, 240, 22, 16, blue, 700),

        ...stageYs.flatMap((y, s) => [
            lbl(c, `Stage ${s}`, 30, y + 1, 96, 22, 16, c.textPrimary, 700),
            lbl(c, '8 sets', 336, y + 1, 82, 22, 16, warm, 700, 'left', true),
            lbl(c, `${oneFOneB[s]} ${oneFOneB[s] === 1 ? 'set' : 'sets'}`, 636, y + 1, 90, 22, 16, blue, 700, 'left', true),
        ]),

        // Bottom header
        lbl(c, '2 · Ideal Fill/Drain Bubble (p = 8):', 30, 262, 340, 24, 17, c.textPrimary, 800),
        lbl(c, 'F = (p−1) / (m+p−1)', 374, 262, 340, 24, 16, green, 700, 'left', true),

        ...bubbles.flatMap((row, i) => {
            const y = 305 + i * 34
            return [
                lbl(c, row.m, 30, y, 96, 22, 16, c.textPrimary, 700, 'left', true),
                lbl(c, row.text, barX + barW + 14, y, 110, 22, 16, row.tone, 800, 'left', true),
            ]
        }),
    ]

    return Board({
        c,
        width,
        height,
        background: 'transparent',
        children: [
            CanvasItem({
                x: 0,
                y: 0,
                width,
                height,
                children: createElement(
                    'svg',
                    { width, height, viewBox: `0 0 ${width} ${height}`, role: 'presentation', 'aria-hidden': true },
                    ...geometry,
                ),
            }),
            ...labels,
        ],
    })
}

export default create('dark')
