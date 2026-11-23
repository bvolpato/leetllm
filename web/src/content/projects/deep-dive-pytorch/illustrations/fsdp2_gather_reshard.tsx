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
    'PyTorch FSDP2 parameter lifecycle on four ranks with reshard_after_forward=True. Rank 0 stores a 1-row parameter shard (P/4) at rest, performs an All-Gather to construct the full 4-row parameter (P) during forward execution, and immediately reshards back to P/4 to minimize peak memory.'

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
    const cardW = 236
    const midX = 312
    const rightX = 589
    const cardY = 75
    const cardH = 345

    return renderBoard(c, [
        // Title & Subtitle
        label(
            c,
            'PyTorch FSDP2: All-Gather & Reshard Lifecycle',
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
            'Per-parameter all-gather for forward computation followed by immediate resharding to minimize peak VRAM',
            35,
            46,
            790,
            20,
            15,
            muted,
            400,
        ),

        // Card 1: At Rest (Sharded)
        SvgFrame({
            c,
            x: leftX,
            y: cardY,
            width: cardW,
            height: cardH,
            rx: 8,
            stroke: purple,
            strokeWidth: 1.5,
            fill: theme === 'dark' ? 'rgba(163, 113, 247, 0.05)' : 'rgba(130, 80, 223, 0.03)',
        }),
        label(c, '1. At Rest (Sharded)', leftX + 16, cardY + 14, cardW - 32, 22, 16, purple, 700),
        label(
            c,
            'Rank 0 of 4 · Shard(0)',
            leftX + 16,
            cardY + 40,
            cardW - 32,
            18,
            13,
            c.textPrimary,
            600,
        ),
        label(
            c,
            'Storage: P / 4 elements (1 row)',
            leftX + 16,
            cardY + 64,
            cardW - 32,
            18,
            12,
            muted,
        ),

        // 1 row of 8 elements in Card 1
        ...[0, 1, 2, 3, 4, 5, 6, 7].flatMap((col) => [
            SvgFrame({
                c,
                x: leftX + 16 + col * 25,
                y: cardY + 120,
                width: 22,
                height: 28,
                rx: 3,
                stroke: purple,
                strokeWidth: 1.5,
                fill: theme === 'dark' ? 'rgba(163, 113, 247, 0.25)' : 'rgba(130, 80, 223, 0.2)',
            }),
            label(
                c,
                `${col}`,
                leftX + 16 + col * 25,
                cardY + 126,
                22,
                16,
                11,
                purple,
                700,
                'center',
                true,
            ),
        ]),
        label(
            c,
            'Local Shard: 8 parameters',
            leftX + 16,
            cardY + 165,
            cardW - 32,
            18,
            12,
            purple,
            600,
        ),
        label(
            c,
            'Ranks 1, 2, 3 store shards in their own local VRAM',
            leftX + 16,
            cardY + 220,
            cardW - 32,
            36,
            12,
            muted,
        ),
        label(
            c,
            'Zero parameter duplication at rest',
            leftX + 16,
            cardY + 270,
            cardW - 32,
            18,
            12,
            green,
            600,
        ),

        // Arrow 1 -> 2: All-Gather
        VectorArrow({
            x1: leftX + cardW,
            y1: 247,
            x2: midX,
            y2: 247,
            color: cyan,
            strokeWidth: 2,
            arrowSize: 4,
        }),
        label(
            c,
            'All-Gather',
            leftX + cardW + 4,
            218,
            midX - (leftX + cardW) - 8,
            18,
            12,
            cyan,
            700,
            'center',
        ),

        // Card 2: During Forward (Unsharded)
        SvgFrame({
            c,
            x: midX,
            y: cardY,
            width: cardW,
            height: cardH,
            rx: 8,
            stroke: green,
            strokeWidth: 1.5,
            fill: theme === 'dark' ? 'rgba(63, 185, 80, 0.05)' : 'rgba(26, 127, 55, 0.03)',
        }),
        label(c, '2. Forward Computation', midX + 16, cardY + 14, cardW - 32, 22, 16, green, 700),
        label(
            c,
            'Full Parameter Reconstructed',
            midX + 16,
            cardY + 40,
            cardW - 32,
            18,
            13,
            c.textPrimary,
            600,
        ),
        label(c, 'Storage: P elements (4 rows)', midX + 16, cardY + 64, cardW - 32, 18, 12, muted),

        // 4 rows of 8 elements in Card 2
        ...[0, 1, 2, 3].flatMap((row) =>
            [0, 1, 2, 3, 4, 5, 6, 7].flatMap((col) => {
                const isRank0 = row === 0
                const strokeColor = isRank0 ? purple : green
                const fillColor = isRank0
                    ? theme === 'dark'
                        ? 'rgba(163, 113, 247, 0.25)'
                        : 'rgba(130, 80, 223, 0.2)'
                    : theme === 'dark'
                      ? 'rgba(63, 185, 80, 0.2)'
                      : 'rgba(26, 127, 55, 0.15)'
                return [
                    SvgFrame({
                        c,
                        x: midX + 16 + col * 25,
                        y: cardY + 105 + row * 34,
                        width: 22,
                        height: 28,
                        rx: 3,
                        stroke: strokeColor,
                        strokeWidth: 1.5,
                        fill: fillColor,
                    }),
                    label(
                        c,
                        `${row * 8 + col}`,
                        midX + 16 + col * 25,
                        cardY + 111 + row * 34,
                        22,
                        16,
                        10,
                        strokeColor,
                        600,
                        'center',
                        true,
                    ),
                ]
            }),
        ),
        label(
            c,
            'Full Tensor: 32 parameters',
            midX + 16,
            cardY + 255,
            cardW - 32,
            18,
            12,
            green,
            700,
        ),
        label(
            c,
            'Local forward GEMM runs at full hardware throughput',
            midX + 16,
            cardY + 280,
            cardW - 32,
            36,
            12,
            muted,
        ),

        // Arrow 2 -> 3: Reshard
        VectorArrow({
            x1: midX + cardW,
            y1: 247,
            x2: rightX,
            y2: 247,
            color: warm,
            strokeWidth: 2,
            arrowSize: 4,
        }),
        label(
            c,
            'Reshard',
            midX + cardW + 4,
            218,
            rightX - (midX + cardW) - 8,
            18,
            12,
            warm,
            700,
            'center',
        ),

        // Card 3: After Forward (Resharded)
        SvgFrame({
            c,
            x: rightX,
            y: cardY,
            width: cardW,
            height: cardH,
            rx: 8,
            stroke: purple,
            strokeWidth: 1.5,
            fill: theme === 'dark' ? 'rgba(163, 113, 247, 0.05)' : 'rgba(130, 80, 223, 0.03)',
        }),
        label(
            c,
            '3. After Forward (Resharded)',
            rightX + 16,
            cardY + 14,
            cardW - 32,
            22,
            16,
            purple,
            700,
        ),
        label(
            c,
            'Full Weights Freed Immediately',
            rightX + 16,
            cardY + 40,
            cardW - 32,
            18,
            13,
            c.textPrimary,
            600,
        ),
        label(
            c,
            'Storage: P / 4 elements (1 row)',
            rightX + 16,
            cardY + 64,
            cardW - 32,
            18,
            12,
            muted,
        ),

        // 1 row of 8 elements in Card 3
        ...[0, 1, 2, 3, 4, 5, 6, 7].flatMap((col) => [
            SvgFrame({
                c,
                x: rightX + 16 + col * 25,
                y: cardY + 120,
                width: 22,
                height: 28,
                rx: 3,
                stroke: purple,
                strokeWidth: 1.5,
                fill: theme === 'dark' ? 'rgba(163, 113, 247, 0.25)' : 'rgba(130, 80, 223, 0.2)',
            }),
            label(
                c,
                `${col}`,
                rightX + 16 + col * 25,
                cardY + 126,
                22,
                16,
                11,
                purple,
                700,
                'center',
                true,
            ),
        ]),
        label(
            c,
            'Local Shard: 8 parameters',
            rightX + 16,
            cardY + 165,
            cardW - 32,
            18,
            12,
            purple,
            600,
        ),
        label(
            c,
            'Unsharded rows 1-3 freed from memory immediately',
            rightX + 16,
            cardY + 220,
            cardW - 32,
            36,
            12,
            muted,
        ),
        label(
            c,
            'Gathers again during backward',
            rightX + 16,
            cardY + 270,
            cardW - 32,
            18,
            12,
            warm,
            600,
        ),

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
        VectorSegment({
            x1: 312,
            y1: 440,
            x2: 312,
            y2: 472,
            color: c.border,
            strokeWidth: 1,
            showStartDot: false,
            showEndDot: false,
        }),
        VectorSegment({
            x1: 589,
            y1: 440,
            x2: 589,
            y2: 472,
            color: c.border,
            strokeWidth: 1,
            showStartDot: false,
            showEndDot: false,
        }),
        label(c, 'Rest: P/4 Sharded Memory', leftX + 16, 447, 240, 20, 12, purple, 600),
        label(c, 'Forward: Full P (All-Gathered)', midX + 16, 447, 240, 20, 12, green, 600),
        label(
            c,
            'Reshard: P/4 (reshard_after_forward=True)',
            rightX + 16,
            447,
            220,
            20,
            12,
            warm,
            600,
        ),
    ])
}

export default create()
