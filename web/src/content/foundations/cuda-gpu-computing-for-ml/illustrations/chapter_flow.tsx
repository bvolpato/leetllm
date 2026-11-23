import React from 'react'
import {
    Board,
    CanvasItem,
    Scene,
    SvgFrame,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
    getToneFill,
} from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

export const preset = 'engineering'
export const width = 820
export const height = 504
export const alt =
    'Eight token positions are divided between two four-thread blocks. The formula global id equals block id times four plus thread id maps block 1, thread 2 to T6. Each block occupies its own 32-lane warp: lanes 0 through 3 are active and lanes 4 through 31 are idle, so four of 32 lanes do useful work in this teaching kernel.'

const lbl = (
    c: ThemeColors,
    text: string,
    x: number,
    y: number,
    w: number,
    fontSize = 25,
    color = c.textSecondary,
    align: 'left' | 'center' | 'right' = 'left',
    mono = false,
    fontWeight = 550,
) =>
    CanvasItem({
        x,
        y,
        width: w,
        height: fontSize + 10,
        children: TextLabel({ c, text, width: w, fontSize, color, align, mono, fontWeight }),
    })

const illustration = defineIllustration((c: ThemeColors) => {
    const blue = getReadableToneColor('blue', c)
    const green = getReadableToneColor('green', c)
    const warm = getReadableToneColor('warm', c)
    const blockRows = [
        {
            name: 'Block 0',
            y: 152,
            tokens: ['T0', 'T1', 'T2', 'T3'],
            base: 0,
            tone: green,
            key: 'green' as const,
        },
        {
            name: 'Block 1',
            y: 256,
            tokens: ['T4', 'T5', 'T6', 'T7'],
            base: 4,
            tone: blue,
            key: 'blue' as const,
        },
    ]
    const warpX = 432
    const warpW = 368
    const activeW = (warpW * 4) / 32

    const shapes: React.ReactNode[] = [
        SvgFrame({
            x: 16,
            y: 100,
            width: 392,
            height: 384,
            c,
            rx: 14,
            fill: c.bgCard,
            stroke: c.borderLight,
            strokeWidth: 1.5,
        }),
        SvgFrame({
            x: 420,
            y: 100,
            width: 384,
            height: 384,
            c,
            rx: 14,
            fill: c.bgCard,
            stroke: c.borderLight,
            strokeWidth: 1.5,
        }),
        ...blockRows.map((row) =>
            SvgFrame({
                key: `${row.name}-band`,
                x: 28,
                y: row.y + 34,
                width: 368,
                height: 58,
                c,
                rx: 10,
                fill: c.bgSubtle,
                stroke: c.borderLight,
                strokeWidth: 1.2,
            }),
        ),
        SvgFrame({
            x: 28,
            y: 372,
            width: 368,
            height: 94,
            c,
            rx: 12,
            fill: c.bgSubtle,
            stroke: c.borderLight,
            strokeWidth: 1.2,
        }),
        ...blockRows.flatMap((row, idx) => {
            const wy = idx === 0 ? 202 : 306
            return [
                SvgFrame({
                    key: `wt-${idx}`,
                    x: warpX,
                    y: wy,
                    width: warpW - 12,
                    height: 42,
                    c,
                    rx: 9,
                    fill: c.bgSubtle,
                    stroke: c.borderLight,
                    strokeWidth: 1.4,
                }),
                SvgFrame({
                    key: `wa-${idx}`,
                    x: warpX,
                    y: wy,
                    width: activeW,
                    height: 42,
                    c,
                    rx: 8,
                    fill: getToneFill(row.key, c),
                    stroke: row.tone,
                    strokeWidth: 1.6,
                }),
            ]
        }),
    ]

    return Scene({
        c,
        padding: 0,
        gap: 0,
        contentWidth: width,
        children: Board({
            background: 'transparent',
            c,
            width,
            height,
            children: [
                CanvasItem({
                    x: 0,
                    y: 0,
                    width,
                    height,
                    children: React.createElement(
                        'svg',
                        { width, height, viewBox: `0 0 ${width} ${height}` },
                        ...shapes,
                    ),
                }),
                lbl(
                    c,
                    'One block occupies one warp',
                    20,
                    14,
                    780,
                    29,
                    c.textPrimary,
                    'left',
                    false,
                    760,
                ),
                lbl(c, 'Eight token positions across two 4-thread blocks.', 20, 52, 780, 24),
                lbl(c, 'Global index mapping', 28, 114, 368, 25, c.textPrimary, 'left', false, 700),
                ...blockRows.flatMap((row) => [
                    lbl(c, row.name, 28, row.y, 140, 24, row.tone, 'left', false, 700),
                    ...row.tokens.map((tok, t) => {
                        const tx = 34 + t * 90
                        const id = row.base + t
                        const hot = id === 6
                        return lbl(
                            c,
                            `t${t}:${tok}`,
                            tx,
                            row.y + 46,
                            86,
                            24,
                            hot ? warm : row.tone,
                            'center',
                            true,
                            hot ? 760 : 620,
                        )
                    }),
                ]),
                lbl(
                    c,
                    'i = block × 4 + thread',
                    36,
                    384,
                    352,
                    24,
                    c.textSecondary,
                    'center',
                    true,
                    650,
                ),
                lbl(c, '1 × 4 + 2 = 6 → T6', 36, 422, 352, 25, warm, 'center', true, 760),
                lbl(
                    c,
                    '32-lane warp allocation',
                    432,
                    114,
                    360,
                    25,
                    c.textPrimary,
                    'left',
                    false,
                    700,
                ),
                lbl(
                    c,
                    'Block 0 · 0–3 active, 4–31 idle',
                    432,
                    162,
                    360,
                    24,
                    green,
                    'left',
                    false,
                    650,
                ),
                lbl(
                    c,
                    'Block 1 · 0–3 active, 4–31 idle',
                    432,
                    266,
                    360,
                    24,
                    blue,
                    'left',
                    false,
                    650,
                ),
                lbl(
                    c,
                    '4 / 32 lanes active (12.5%)',
                    432,
                    382,
                    360,
                    25,
                    c.textPrimary,
                    'center',
                    false,
                    720,
                ),
                lbl(
                    c,
                    'Lane fraction, not throughput.',
                    432,
                    422,
                    360,
                    24,
                    c.textSecondary,
                    'center',
                ),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
