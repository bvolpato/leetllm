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
    'DeepEP communication topology paths: Direct mode routes tokens directly from Rank 0 (Node A) to Rank 3 (Node B) across cross-node RDMA. Hybrid mode routes from Rank 0 to Rank 2 on Node B over an RDMA rail, then forwards to Rank 3 across high-bandwidth intranode NVLink.'

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
    const cardW = 380
    const rightX = 445
    const cardY = 75
    const cardH = 345

    return renderBoard(c, [
        // Title & Subtitle
        label(
            c,
            'DeepEP Communication Topologies: Direct vs Hybrid',
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
            'Direct mode connects ranks point-to-point via RDMA; Hybrid mode pairs RDMA rails with intranode NVLink forwarding',
            35,
            46,
            790,
            20,
            15,
            muted,
            400,
        ),

        // Left Card: Direct Path
        SvgFrame({
            c,
            x: leftX,
            y: cardY,
            width: cardW,
            height: cardH,
            rx: 8,
            stroke: c.border,
            strokeWidth: 1,
            fill: c.bgCard,
        }),
        label(c, '1. DIRECT RDMA TRANSPORT', leftX + 16, cardY + 16, cardW - 32, 20, 13, cyan, 700),
        label(
            c,
            'Single-hop cross-node communication',
            leftX + 16,
            cardY + 38,
            cardW - 32,
            16,
            11,
            muted,
        ),

        // Node A
        SvgFrame({
            c,
            x: leftX + 20,
            y: cardY + 70,
            width: 140,
            height: 170,
            rx: 6,
            stroke: blue,
            strokeWidth: 1.5,
            fill: theme === 'dark' ? 'rgba(88, 166, 255, 0.08)' : 'rgba(9, 105, 218, 0.05)',
        }),
        label(c, 'Node A', leftX + 20, cardY + 80, 140, 18, 12, blue, 700, 'center'),
        // Rank 0
        SvgFrame({
            c,
            x: leftX + 32,
            y: cardY + 110,
            width: 116,
            height: 42,
            rx: 4,
            stroke: cyan,
            strokeWidth: 1.5,
            fill: c.bgSubtle,
        }),
        label(c, 'Rank 0 (Source)', leftX + 32, cardY + 122, 116, 18, 11, cyan, 700, 'center'),
        // Rank 1
        SvgFrame({
            c,
            x: leftX + 32,
            y: cardY + 180,
            width: 116,
            height: 42,
            rx: 4,
            stroke: c.border,
            strokeWidth: 1,
            fill: c.bgSubtle,
        }),
        label(c, 'Rank 1', leftX + 32, cardY + 192, 116, 18, 11, muted, 500, 'center'),

        // Node B
        SvgFrame({
            c,
            x: leftX + 220,
            y: cardY + 70,
            width: 140,
            height: 170,
            rx: 6,
            stroke: green,
            strokeWidth: 1.5,
            fill: theme === 'dark' ? 'rgba(63, 185, 80, 0.08)' : 'rgba(26, 127, 55, 0.05)',
        }),
        label(c, 'Node B', leftX + 220, cardY + 80, 140, 18, 12, green, 700, 'center'),
        // Rank 2
        SvgFrame({
            c,
            x: leftX + 232,
            y: cardY + 110,
            width: 116,
            height: 42,
            rx: 4,
            stroke: c.border,
            strokeWidth: 1,
            fill: c.bgSubtle,
        }),
        label(c, 'Rank 2', leftX + 232, cardY + 122, 116, 18, 11, muted, 500, 'center'),
        // Rank 3
        SvgFrame({
            c,
            x: leftX + 232,
            y: cardY + 180,
            width: 116,
            height: 42,
            rx: 4,
            stroke: green,
            strokeWidth: 1.5,
            fill: c.bgSubtle,
        }),
        label(c, 'Rank 3 (Dest)', leftX + 232, cardY + 192, 116, 18, 11, green, 700, 'center'),

        // Direct Arrow R0 -> R3
        VectorArrow({
            x1: leftX + 148,
            y1: cardY + 131,
            x2: leftX + 232,
            y2: cardY + 201,
            color: getReadableToneColor('cyan', c),
            strokeWidth: 2,
            arrowSize: 4,
        }),

        label(
            c,
            'Full point-to-point network mesh',
            leftX + 16,
            cardY + 265,
            cardW - 32,
            18,
            12,
            c.textPrimary,
            600,
        ),
        label(
            c,
            'Direct transfers minimize latency when network bisection bandwidth is unconstrained.',
            leftX + 16,
            cardY + 288,
            cardW - 32,
            40,
            11,
            muted,
        ),

        // Right Card: Hybrid Path
        SvgFrame({
            c,
            x: rightX,
            y: cardY,
            width: cardW,
            height: cardH,
            rx: 8,
            stroke: c.border,
            strokeWidth: 1,
            fill: c.bgCard,
        }),
        label(
            c,
            '2. HYBRID RAIL + NVLINK TRANSPORT',
            rightX + 16,
            cardY + 16,
            cardW - 32,
            20,
            13,
            purple,
            700,
        ),
        label(
            c,
            'Two-stage transfer mitigating cross-rail congestion',
            rightX + 16,
            cardY + 38,
            cardW - 32,
            16,
            11,
            muted,
        ),

        // Node A
        SvgFrame({
            c,
            x: rightX + 20,
            y: cardY + 70,
            width: 140,
            height: 170,
            rx: 6,
            stroke: blue,
            strokeWidth: 1.5,
            fill: theme === 'dark' ? 'rgba(88, 166, 255, 0.08)' : 'rgba(9, 105, 218, 0.05)',
        }),
        label(c, 'Node A', rightX + 20, cardY + 80, 140, 18, 12, blue, 700, 'center'),
        // Rank 0
        SvgFrame({
            c,
            x: rightX + 32,
            y: cardY + 110,
            width: 116,
            height: 42,
            rx: 4,
            stroke: cyan,
            strokeWidth: 1.5,
            fill: c.bgSubtle,
        }),
        label(c, 'Rank 0 (Source)', rightX + 32, cardY + 122, 116, 18, 11, cyan, 700, 'center'),
        // Rank 1
        SvgFrame({
            c,
            x: rightX + 32,
            y: cardY + 180,
            width: 116,
            height: 42,
            rx: 4,
            stroke: c.border,
            strokeWidth: 1,
            fill: c.bgSubtle,
        }),
        label(c, 'Rank 1', rightX + 32, cardY + 192, 116, 18, 11, muted, 500, 'center'),

        // Node B
        SvgFrame({
            c,
            x: rightX + 220,
            y: cardY + 70,
            width: 140,
            height: 170,
            rx: 6,
            stroke: green,
            strokeWidth: 1.5,
            fill: theme === 'dark' ? 'rgba(63, 185, 80, 0.08)' : 'rgba(26, 127, 55, 0.05)',
        }),
        label(c, 'Node B', rightX + 220, cardY + 80, 140, 18, 12, green, 700, 'center'),
        // Rank 2 (Rail Peer)
        SvgFrame({
            c,
            x: rightX + 232,
            y: cardY + 110,
            width: 116,
            height: 42,
            rx: 4,
            stroke: warm,
            strokeWidth: 1.5,
            fill: c.bgSubtle,
        }),
        label(c, 'Rank 2 (Rail Peer)', rightX + 232, cardY + 122, 116, 18, 11, warm, 700, 'center'),
        // Rank 3 (Final Target)
        SvgFrame({
            c,
            x: rightX + 232,
            y: cardY + 180,
            width: 116,
            height: 42,
            rx: 4,
            stroke: green,
            strokeWidth: 1.5,
            fill: c.bgSubtle,
        }),
        label(c, 'Rank 3 (Dest)', rightX + 232, cardY + 192, 116, 18, 11, green, 700, 'center'),

        // Hop 1: RDMA Rail R0 -> R2
        VectorArrow({
            x1: rightX + 148,
            y1: cardY + 131,
            x2: rightX + 232,
            y2: cardY + 131,
            color: getReadableToneColor('warm', c),
            strokeWidth: 2,
            arrowSize: 4,
        }),

        // Hop 2: NVLink Forward R2 -> R3
        VectorArrow({
            x1: rightX + 290,
            y1: cardY + 152,
            x2: rightX + 290,
            y2: cardY + 180,
            color: getReadableToneColor('green', c),
            strokeWidth: 2,
            arrowSize: 4,
        }),

        label(
            c,
            'Rail-aligned cross-node transfer',
            rightX + 16,
            cardY + 265,
            cardW - 32,
            18,
            12,
            c.textPrimary,
            600,
        ),
        label(
            c,
            'Tokens traverse RDMA rail to node peer, then forward locally over high-bandwidth NVLink.',
            rightX + 16,
            cardY + 288,
            cardW - 32,
            40,
            11,
            muted,
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
        label(
            c,
            'Direct Mode: Low latency, 1-hop point-to-point',
            leftX + 20,
            447,
            260,
            20,
            12,
            cyan,
            600,
        ),
        label(
            c,
            'Hybrid Mode: Rail-aligned + NVLink forwarding',
            leftX + 290,
            447,
            260,
            20,
            12,
            warm,
            600,
            'center',
        ),
        label(
            c,
            'Optimized for Multi-Node MoE Clusters',
            leftX + 540,
            447,
            230,
            20,
            12,
            green,
            600,
            'right',
        ),
    ])
}

export default create()
