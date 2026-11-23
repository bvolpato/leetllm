import { createElement, type ReactElement } from 'react'
import {
    Board,
    CanvasItem,
    SvgFrame,
    TextLabel,
    VectorArrow,
    VectorSegment,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 860
export const height = 500
export const opaqueBackground = true
export const alt =
    'Token routing and combine lifecycle in DeepEP: four tokens route across four experts partitioned between Rank 0 (E0, E1) and Rank 1 (E2, E3). Token a selects E0 with weight 0.70 (local NVLink) and E3 with weight 0.30 (remote RDMA). Combine sums weighted expert outputs back into source position a as 1.90.'

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
    const cyan = getReadableToneColor('cyan', c)
    const purple = getReadableToneColor('purple', c)
    const green = getReadableToneColor('green', c)
    const warm = getReadableToneColor('warm', c)
    const muted = c.textSecondary

    const leftX = 35
    const matrixW = 360
    const rightX = 425
    const flowW = 400
    const cardY = 75
    const cardH = 345

    const gate = [
        [0.7, 0, 0, 0.3],
        [0, 0.6, 0.4, 0],
        [0, 0.55, 0, 0.45],
        [0.25, 0, 0.75, 0],
    ]

    return renderBoard(c, [
        // Title & Subtitle
        label(
            c,
            'DeepEP Token Routing and Combine Lifecycle',
            35,
            18,
            790,
            26,
            22,
            c.textPrimary,
            700,
        ),
        label(
            c,
            'Tokens route across distributed expert ranks via NVLink and RDMA; combine sums weighted outputs',
            35,
            46,
            790,
            20,
            15,
            muted,
            400,
        ),

        // Left Card: Routing Matrix
        SvgFrame({
            c,
            x: leftX,
            y: cardY,
            width: matrixW,
            height: cardH,
            rx: 8,
            stroke: c.border,
            strokeWidth: 1,
            fill: c.bgCard,
        }),
        label(
            c,
            'TOP-2 ROUTING GATE MATRIX',
            leftX + 16,
            cardY + 16,
            matrixW - 32,
            20,
            13,
            cyan,
            700,
        ),
        label(
            c,
            'Tokens a,b on Rank 0; c,d on Rank 1',
            leftX + 16,
            cardY + 38,
            matrixW - 32,
            16,
            11,
            muted,
        ),

        // Expert headers
        label(c, 'E0 (R0)', leftX + 65, cardY + 68, 65, 18, 11, blue, 700, 'center', true),
        label(c, 'E1 (R0)', leftX + 135, cardY + 68, 65, 18, 11, blue, 700, 'center', true),
        label(c, 'E2 (R1)', leftX + 205, cardY + 68, 65, 18, 11, green, 700, 'center', true),
        label(c, 'E3 (R1)', leftX + 275, cardY + 68, 65, 18, 11, green, 700, 'center', true),

        // Matrix cells
        ...gate.flatMap((row, r) => {
            const rowLabel = 'abcd'[r]!
            const yPos = cardY + 95 + r * 46
            const isSelected = r === 0
            return [
                label(
                    c,
                    `Token ${rowLabel}`,
                    leftX + 12,
                    yPos + 8,
                    48,
                    18,
                    12,
                    isSelected ? cyan : c.textPrimary,
                    700,
                ),
                ...row.flatMap((weight, col) => {
                    const xPos = leftX + 65 + col * 70
                    const isColSelected = isSelected && (col === 0 || col === 3)
                    return [
                        SvgFrame({
                            c,
                            x: xPos,
                            y: yPos,
                            width: 62,
                            height: 38,
                            rx: 4,
                            stroke: isColSelected ? cyan : c.border,
                            strokeWidth: isColSelected ? 1.5 : 1,
                            fill: isColSelected
                                ? theme === 'dark'
                                    ? 'rgba(57, 197, 207, 0.15)'
                                    : 'rgba(26, 127, 139, 0.1)'
                                : c.bgSubtle,
                        }),
                        label(
                            c,
                            weight > 0 ? weight.toFixed(2) : '—',
                            xPos,
                            yPos + 10,
                            62,
                            18,
                            12,
                            weight > 0 ? (col < 2 ? blue : green) : muted,
                            weight > 0 ? 700 : 400,
                            'center',
                            true,
                        ),
                    ]
                }),
            ]
        }),

        label(
            c,
            'Token a routes to E0 (weight 0.70) and E3 (weight 0.30)',
            leftX + 16,
            cardY + 300,
            matrixW - 32,
            20,
            11,
            cyan,
            600,
        ),

        // Right Card: Execution Flow
        SvgFrame({
            c,
            x: rightX,
            y: cardY,
            width: flowW,
            height: cardH,
            rx: 8,
            stroke: c.border,
            strokeWidth: 1,
            fill: c.bgCard,
        }),
        label(
            c,
            'DISPATCH, GEMM & COMBINE (TOKEN a)',
            rightX + 16,
            cardY + 16,
            flowW - 32,
            20,
            13,
            purple,
            700,
        ),

        // Source Token a
        SvgFrame({
            c,
            x: rightX + 140,
            y: cardY + 45,
            width: 120,
            height: 34,
            rx: 6,
            stroke: cyan,
            strokeWidth: 1.5,
            fill: theme === 'dark' ? 'rgba(57, 197, 207, 0.12)' : 'rgba(26, 127, 139, 0.08)',
        }),
        label(c, 'Token a (Rank 0)', rightX + 140, cardY + 53, 120, 18, 12, cyan, 700, 'center'),

        // Branch left: E0
        SvgFrame({
            c,
            x: rightX + 20,
            y: cardY + 120,
            width: 165,
            height: 95,
            rx: 6,
            stroke: blue,
            strokeWidth: 1.5,
            fill: theme === 'dark' ? 'rgba(88, 166, 255, 0.08)' : 'rgba(9, 105, 218, 0.05)',
        }),
        label(c, 'Expert 0 · Rank 0', rightX + 28, cardY + 130, 150, 18, 12, blue, 700),
        label(c, 'Local NVLink transport', rightX + 28, cardY + 150, 150, 16, 10, muted),
        label(
            c,
            'Raw output: 1.0',
            rightX + 28,
            cardY + 168,
            150,
            16,
            11,
            c.textPrimary,
            600,
            'left',
            true,
        ),
        label(
            c,
            'Weighted: 1.0 × 0.70 = 0.70',
            rightX + 28,
            cardY + 186,
            150,
            18,
            11,
            blue,
            700,
            'left',
            true,
        ),

        // Branch right: E3
        SvgFrame({
            c,
            x: rightX + 215,
            y: cardY + 120,
            width: 165,
            height: 95,
            rx: 6,
            stroke: green,
            strokeWidth: 1.5,
            fill: theme === 'dark' ? 'rgba(63, 185, 80, 0.08)' : 'rgba(26, 127, 55, 0.05)',
        }),
        label(c, 'Expert 3 · Rank 1', rightX + 223, cardY + 130, 150, 18, 12, green, 700),
        label(c, 'Remote RDMA transport', rightX + 223, cardY + 150, 150, 16, 10, muted),
        label(
            c,
            'Raw output: 4.0',
            rightX + 223,
            cardY + 168,
            150,
            16,
            11,
            c.textPrimary,
            600,
            'left',
            true,
        ),
        label(
            c,
            'Weighted: 4.0 × 0.30 = 1.20',
            rightX + 223,
            cardY + 186,
            150,
            18,
            11,
            green,
            700,
            'left',
            true,
        ),

        // Combine destination
        SvgFrame({
            c,
            x: rightX + 90,
            y: cardY + 255,
            width: 220,
            height: 65,
            rx: 6,
            stroke: purple,
            strokeWidth: 1.5,
            fill: theme === 'dark' ? 'rgba(187, 128, 255, 0.12)' : 'rgba(130, 80, 223, 0.08)',
        }),
        label(c, 'Combine Epilogue', rightX + 90, cardY + 265, 220, 18, 12, purple, 700, 'center'),
        label(
            c,
            'Output a = 0.70 + 1.20 = 1.90',
            rightX + 90,
            cardY + 288,
            220,
            20,
            13,
            green,
            700,
            'center',
            true,
        ),

        // Arrows from Token a to Experts
        VectorArrow({
            x1: rightX + 170,
            y1: cardY + 80,
            x2: rightX + 105,
            y2: cardY + 120,
            color: getReadableToneColor('blue', c),
            strokeWidth: 2,
            arrowSize: 4,
        }),
        VectorArrow({
            x1: rightX + 230,
            y1: cardY + 80,
            x2: rightX + 295,
            y2: cardY + 120,
            color: getReadableToneColor('green', c),
            strokeWidth: 2,
            arrowSize: 4,
        }),

        // Arrows from Experts to Combine
        VectorArrow({
            x1: rightX + 105,
            y1: cardY + 215,
            x2: rightX + 160,
            y2: cardY + 255,
            color: getReadableToneColor('purple', c),
            strokeWidth: 2,
            arrowSize: 4,
        }),
        VectorArrow({
            x1: rightX + 295,
            y1: cardY + 215,
            x2: rightX + 240,
            y2: cardY + 255,
            color: getReadableToneColor('purple', c),
            strokeWidth: 2,
            arrowSize: 4,
        }),

        // Bottom summary frame
        SvgFrame({
            c,
            x: leftX,
            y: 435,
            width: 790,
            height: 42,
            rx: 6,
            stroke: c.border,
            strokeWidth: 1,
            fill: c.bgCard,
        }),
        label(c, 'Top-K Router: Local & Remote Ranks', leftX + 20, 447, 240, 20, 12, cyan, 600),
        label(
            c,
            'Low-Latency MoE Transport (DeepEP)',
            leftX + 270,
            447,
            260,
            20,
            12,
            purple,
            600,
            'center',
        ),
        label(
            c,
            'Combine: Invert Routing & Accumulate',
            leftX + 530,
            447,
            240,
            20,
            12,
            green,
            600,
            'right',
        ),
    ])
}

export default create()
