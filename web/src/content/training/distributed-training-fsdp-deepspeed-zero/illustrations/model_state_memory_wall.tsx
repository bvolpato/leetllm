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
export const height = 490

export const alt =
    '70B dense model state breakdown (16 bytes/param = 1,120 GB total): BF16 weights 140 GB, BF16 gradients 140 GB, FP32 master weights 280 GB, and FP32 Adam moments 560 GB on a shared 0 to 560 GB scale. Below, equal sharding across 16, 32, 64, or 256 ranks uses 70, 35, 17.5, or 4.375 GB of an 80 GB GPU, leaving 10, 45, 62.5, or 75.625 GB for activations and buffers.'

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
    const blue = getReadableToneColor('blue', c)
    const purple = getReadableToneColor('purple', c)
    const cyan = getReadableToneColor('cyan', c)
    const warm = getReadableToneColor('warm', c)
    const green = getReadableToneColor('green', c)

    const components = [
        { name: 'Weights (BF16)', amount: 140, bytes: '2 B', tone: blue },
        { name: 'Gradients (BF16)', amount: 140, bytes: '2 B', tone: purple },
        { name: 'FP32 Master', amount: 280, bytes: '4 B', tone: cyan },
        { name: 'Adam (m, v)', amount: 560, bytes: '8 B', tone: warm },
    ]
    const sharded = [
        { ranks: '16 ranks', state: 70, readout: '70.0 GB · 10 free' },
        { ranks: '32 ranks', state: 35, readout: '35.0 GB · 45 free' },
        { ranks: '64 ranks', state: 17.5, readout: '17.5 GB · 62.5 free' },
        { ranks: '256 ranks', state: 4.375, readout: '4.4 GB · 75.6 free' },
    ]

    const barX = 196
    const barW = 268

    const geometry = [
        // Top panel
        SvgFrame({
            c,
            key: 'top-panel',
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
            key: 'bot-panel',
            x: 14,
            y: 250,
            width: 732,
            height: 226,
            rx: 10,
            fill: c.bgCard,
            stroke: c.borderSubtle,
            strokeWidth: 1.2,
        }),

        // Top bars (0 -> 560 GB)
        ...components.flatMap((item, i) => {
            const y = 62 + i * 40
            const w = (item.amount / 560) * barW
            return [
                SvgFrame({
                    c,
                    key: `c-bg-${i}`,
                    x: barX,
                    y,
                    width: barW,
                    height: 26,
                    rx: 5,
                    fill: c.bgSubtle,
                    stroke: c.borderSubtle,
                    strokeWidth: 1,
                }),
                SvgFrame({
                    c,
                    key: `c-fg-${i}`,
                    x: barX,
                    y,
                    width: w,
                    height: 26,
                    rx: 5,
                    fill: withColorAlpha(item.tone, 0.35),
                    stroke: item.tone,
                    strokeWidth: 1.8,
                }),
            ]
        }),

        // Bottom bars (0 -> 80 GB)
        ...sharded.flatMap((row, i) => {
            const y = 300 + i * 40
            const w = Math.max(14, (row.state / 80) * barW)
            return [
                SvgFrame({
                    c,
                    key: `s-bg-${i}`,
                    x: barX,
                    y,
                    width: barW,
                    height: 26,
                    rx: 5,
                    fill: c.bgSubtle,
                    stroke: c.borderSubtle,
                    strokeWidth: 1,
                }),
                SvgFrame({
                    c,
                    key: `s-fg-${i}`,
                    x: barX,
                    y,
                    width: w,
                    height: 26,
                    rx: 5,
                    fill: withColorAlpha(green, 0.35),
                    stroke: green,
                    strokeWidth: 1.8,
                }),
            ]
        }),

        // 80 GB vertical limit line
        createElement('line', {
            key: 'limit-80',
            x1: barX + barW,
            y1: 292,
            x2: barX + barW,
            y2: 454,
            stroke: warm,
            strokeWidth: 2,
            strokeDasharray: '5 4',
        }),
    ]

    const cleanLabels = [
        lbl(c, '1 · Unsharded 70B State: 1,120 GB (16 B/param)', 30, 24, 690, 24, 17, c.textPrimary, 800),
        ...components.flatMap((item, i) => {
            const y = 64 + i * 40
            return [
                lbl(c, item.name, 30, y, 160, 22, 16, item.tone, 700),
                lbl(c, `${item.amount} GB (${item.bytes})`, 480, y, 250, 22, 16, item.tone, 700, 'left', true),
            ]
        }),
        lbl(c, '2 · Sharded State per Rank (80 GB GPU)', 30, 262, 386, 24, 17, c.textPrimary, 800),
        lbl(c, '80 GB cap', 416, 262, 112, 24, 16, warm, 700, 'center', true),
        ...sharded.flatMap((row, i) => {
            const y = 302 + i * 40
            return [
                lbl(c, row.ranks, 30, y, 160, 22, 16, c.textPrimary, 700, 'left', true),
                lbl(c, row.readout, 480, y, 254, 22, 16, green, 700, 'left', true),
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
            ...cleanLabels,
        ],
    })
}

export default create('dark')
