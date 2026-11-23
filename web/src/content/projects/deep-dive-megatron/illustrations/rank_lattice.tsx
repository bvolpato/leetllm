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

// Visual primitive: Matrix lattice of multi-dimensional GPU ranks and process groups
export const width = 860
export const height = 500
export const opaqueBackground = true
export const alt =
    'Nested 64-GPU Megatron-LM rank lattice with default order tp-cp-ep-dp-pp (DP4 x CP2 x PP2 x TP4). Four DP replicas each contain two CP lanes; each lane stacks PP0 and PP1 as rows of four TP ranks labeled with global rank IDs. Rank 3 is highlighted at (dp, cp, pp, tp) = (0, 0, 0, 3).'

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

    const globalRank = (dp: number, cp: number, pp: number, tp: number) =>
        tp + 4 * cp + 8 * dp + 32 * pp

    const leftX = 35
    const cardW = 186
    const gapX = 15
    const cardY = 75
    const cardH = 345

    const dpColumns = [0, 1, 2, 3].map((dp) => ({
        dp,
        x: leftX + dp * (cardW + gapX),
    }))

    return renderBoard(c, [
        // Title & Subtitle
        label(
            c,
            '64-GPU Parallelism Rank Lattice: DP4 × CP2 × PP2 × TP4',
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
            'Global rank = tp + 4·cp + 8·dp + 32·pp under Megatron-LM dimension order',
            35,
            46,
            790,
            20,
            15,
            muted,
            400,
        ),

        // DP Columns
        ...dpColumns.flatMap((col) => {
            const dp = col.dp
            const gx = col.x
            return [
                // DP Outer Card
                SvgFrame({
                    c,
                    x: gx,
                    y: cardY,
                    width: cardW,
                    height: cardH,
                    rx: 8,
                    stroke: green,
                    strokeWidth: 1.5,
                    fill: theme === 'dark' ? 'rgba(63, 185, 80, 0.05)' : 'rgba(26, 127, 55, 0.03)',
                }),
                label(
                    c,
                    `DP${dp} Replica`,
                    gx + 12,
                    cardY + 8,
                    cardW - 24,
                    20,
                    14,
                    green,
                    700,
                    'center',
                ),

                // CP0 & CP1 inside this DP
                ...[0, 1].flatMap((cp) => {
                    const cpY = cardY + 34 + cp * 152
                    return [
                        SvgFrame({
                            c,
                            x: gx + 8,
                            y: cpY,
                            width: cardW - 16,
                            height: 144,
                            rx: 6,
                            stroke: cyan,
                            strokeWidth: 1,
                            fill:
                                theme === 'dark'
                                    ? 'rgba(57, 197, 207, 0.08)'
                                    : 'rgba(26, 127, 139, 0.05)',
                        }),
                        label(c, `CP${cp} Lane`, gx + 14, cpY + 6, cardW - 28, 16, 12, cyan, 600),

                        // PP0 and PP1 rows inside this CP
                        ...[0, 1].flatMap((pp) => {
                            const ppY = cpY + 28 + pp * 56
                            return [
                                label(c, `PP${pp}`, gx + 12, ppY + 12, 32, 16, 11, warm, 600),
                                // 4 TP boxes
                                ...[0, 1, 2, 3].flatMap((tp) => {
                                    const rank = globalRank(dp, cp, pp, tp)
                                    const isHighlight = rank === 3
                                    const bx = gx + 46 + tp * 30
                                    const by = ppY + 4
                                    const strokeColor = isHighlight ? purple : blue
                                    const fillColor = isHighlight
                                        ? theme === 'dark'
                                            ? 'rgba(163, 113, 247, 0.3)'
                                            : 'rgba(130, 80, 223, 0.25)'
                                        : c.bgCard
                                    return [
                                        SvgFrame({
                                            c,
                                            x: bx,
                                            y: by,
                                            width: 27,
                                            height: 38,
                                            rx: 4,
                                            stroke: strokeColor,
                                            strokeWidth: isHighlight ? 2 : 1,
                                            fill: fillColor,
                                        }),
                                        label(
                                            c,
                                            `${rank}`,
                                            bx,
                                            by + 8,
                                            27,
                                            20,
                                            12,
                                            isHighlight ? purple : c.textPrimary,
                                            isHighlight ? 700 : 500,
                                            'center',
                                            true,
                                        ),
                                    ]
                                }),
                            ]
                        }),
                    ]
                }),
            ]
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
        label(
            c,
            'Intra-node NVLink: TP4 (adjacent boxes)',
            leftX + 16,
            447,
            260,
            20,
            12,
            blue,
            600,
        ),
        label(
            c,
            'Target: Rank 3 = (dp=0, cp=0, pp=0, tp=3)',
            leftX + 275,
            447,
            270,
            20,
            12,
            purple,
            700,
            'center',
        ),
        label(
            c,
            'Cross-node InfiniBand: CP2, PP2, DP4',
            leftX + 540,
            447,
            235,
            20,
            12,
            green,
            600,
            'right',
        ),
    ])
}

export default create()
