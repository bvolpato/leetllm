import { createElement, type ReactElement } from 'react'
import {
    Board,
    CanvasItem,
    SvgFrame,
    TextLabel,
    VectorSegment,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 860
export const height = 500
export const opaqueBackground = true
export const alt =
    'Comparison of memory consumption per parameter per rank across standard Data Parallelism, ZeRO-1, ZeRO-2, and ZeRO-3 on four data-parallel ranks. Total bytes fall from 16 bytes per parameter in DP to 7 bytes in ZeRO-1, 5.5 bytes in ZeRO-2, and 4 bytes in ZeRO-3 across compute weights, gradients, and FP32 optimizer states.'

type Colors = ReturnType<typeof getThemeColors>

function label(
    c: Colors,
    text: string,
    x: number,
    y: number,
    w: number,
    h: number,
    fontSize: number,
    color = c.textPrimary,
    fontWeight = 600,
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

function renderBoard(c: Colors, items: (ReactElement | ReactElement[])[]) {
    const flat = items.flat() as ReactElement[]
    const svg = flat.filter((el) => el?.type !== 'div')
    const html = flat.filter((el) => el?.type === 'div')
    return Board({
        c,
        width,
        height,
        background: c.bg,
        children: [
            CanvasItem({
                x: 0,
                y: 0,
                width,
                height,
                children: createElement(
                    'svg',
                    { width, height, viewBox: `0 0 ${width} ${height}` },
                    ...svg,
                ),
            }),
            ...html,
        ],
    })
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const blue = getReadableToneColor('blue', c)
    const warm = getReadableToneColor('warm', c)
    const purple = getReadableToneColor('purple', c)
    const muted = c.textSecondary

    const scaleX = 32 // 32 px per byte, 16 bytes = 512 px
    const startX = 200

    const rows = [
        {
            name: 'Data Parallel',
            sub: 'Fully replicated',
            params: 2,
            grad: 2,
            opt: 12,
            total: 16,
            y: 110,
        },
        {
            name: 'ZeRO-1',
            sub: 'Sharded optimizer',
            params: 2,
            grad: 2,
            opt: 3,
            total: 7,
            y: 175,
        },
        {
            name: 'ZeRO-2',
            sub: 'Sharded gradients',
            params: 2,
            grad: 0.5,
            opt: 3,
            total: 5.5,
            y: 240,
        },
        {
            name: 'ZeRO-3',
            sub: 'Sharded parameters',
            params: 0.5,
            grad: 0.5,
            opt: 3,
            total: 4,
            y: 305,
        },
    ]

    return renderBoard(c, [
        label(
            c,
            'ZeRO Partitioning Stages: Per-Rank Memory Breakdown',
            35,
            18,
            790,
            28,
            22,
            c.textPrimary,
            700,
        ),
        label(
            c,
            'Bytes per model parameter across 4 data-parallel ranks (16-bit compute, 32-bit Adam moments & master weights)',
            35,
            46,
            790,
            20,
            15,
            muted,
            400,
        ),

        // Legend
        SvgFrame({
            c,
            x: 200,
            y: 75,
            width: 14,
            height: 14,
            rx: 3,
            stroke: blue,
            strokeWidth: 1,
            fill: theme === 'dark' ? 'rgba(56, 139, 253, 0.4)' : 'rgba(9, 105, 218, 0.3)',
        }),
        label(c, 'Weights (2 B / 16-bit)', 222, 72, 160, 20, 13, c.textPrimary, 500),

        SvgFrame({
            c,
            x: 400,
            y: 75,
            width: 14,
            height: 14,
            rx: 3,
            stroke: warm,
            strokeWidth: 1,
            fill: theme === 'dark' ? 'rgba(210, 153, 34, 0.4)' : 'rgba(154, 103, 0, 0.3)',
        }),
        label(c, 'Gradients (2 B / 16-bit)', 422, 72, 160, 20, 13, c.textPrimary, 500),

        SvgFrame({
            c,
            x: 600,
            y: 75,
            width: 14,
            height: 14,
            rx: 3,
            stroke: purple,
            strokeWidth: 1,
            fill: theme === 'dark' ? 'rgba(163, 113, 247, 0.4)' : 'rgba(130, 80, 223, 0.3)',
        }),
        label(c, 'Optimizer + Master (12 B / 32-bit)', 622, 72, 200, 20, 13, c.textPrimary, 500),

        // Rows
        ...rows.flatMap((r) => {
            const pW = r.params * scaleX
            const gW = r.grad * scaleX
            const oW = r.opt * scaleX
            return [
                label(c, r.name, 35, r.y, 150, 22, 16, c.textPrimary, 700),
                label(c, r.sub, 35, r.y + 20, 150, 18, 13, muted),

                // Stacked bars
                SvgFrame({
                    c,
                    x: startX,
                    y: r.y + 4,
                    width: pW,
                    height: 32,
                    rx: 3,
                    stroke: blue,
                    strokeWidth: 1.5,
                    fill: theme === 'dark' ? 'rgba(56, 139, 253, 0.3)' : 'rgba(9, 105, 218, 0.25)',
                }),
                SvgFrame({
                    c,
                    x: startX + pW,
                    y: r.y + 4,
                    width: gW,
                    height: 32,
                    rx: 3,
                    stroke: warm,
                    strokeWidth: 1.5,
                    fill: theme === 'dark' ? 'rgba(210, 153, 34, 0.3)' : 'rgba(154, 103, 0, 0.25)',
                }),
                SvgFrame({
                    c,
                    x: startX + pW + gW,
                    y: r.y + 4,
                    width: oW,
                    height: 32,
                    rx: 3,
                    stroke: purple,
                    strokeWidth: 1.5,
                    fill:
                        theme === 'dark' ? 'rgba(163, 113, 247, 0.3)' : 'rgba(130, 80, 223, 0.25)',
                }),

                // Total text
                label(
                    c,
                    `${r.total} B / param`,
                    startX + pW + gW + oW + 12,
                    r.y + 8,
                    110,
                    22,
                    14,
                    c.textPrimary,
                    700,
                    'left',
                    true,
                ),
            ]
        }),

        // Axis scale line
        VectorSegment({
            x1: startX,
            y1: 360,
            x2: startX + 16 * scaleX,
            y2: 360,
            color: muted,
            strokeWidth: 1,
            showStartDot: false,
            showEndDot: false,
        }),
        label(c, '0', startX - 8, 366, 16, 16, 12, muted, 500, 'center', true),
        label(c, '4', startX + 4 * scaleX - 8, 366, 16, 16, 12, muted, 500, 'center', true),
        label(c, '8', startX + 8 * scaleX - 8, 366, 16, 16, 12, muted, 500, 'center', true),
        label(c, '12', startX + 12 * scaleX - 8, 366, 16, 16, 12, muted, 500, 'center', true),
        label(
            c,
            '16 bytes',
            startX + 16 * scaleX - 25,
            366,
            60,
            16,
            12,
            muted,
            500,
            'center',
            true,
        ),

        // Bottom takeaway
        SvgFrame({
            c,
            x: 35,
            y: 405,
            width: 790,
            height: 70,
            rx: 8,
            stroke: muted,
            strokeWidth: 1,
            fill: theme === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
        }),
        label(c, 'Dominant Optimizer Overhead', 52, 414, 750, 20, 16, c.textPrimary, 700),
        label(
            c,
            'The 12-byte FP32 optimizer state (first/second moments and master copy) accounts for 75% of model state. ZeRO-1 captures the largest relative memory saving without adding communication to forward or backward passes.',
            52,
            438,
            750,
            32,
            14,
            muted,
            400,
        ),
    ])
}
