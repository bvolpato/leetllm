import { createElement, type ReactElement } from 'react'
import {
    Board,
    CanvasItem,
    SvgFrame,
    TextLabel,
    VectorArrow,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 860
export const height = 500
export const opaqueBackground = true
export const alt =
    'Radix tree prefix matching and chunked-prefill scheduling: two requests share cached token prefix A B C D at KV slots 12 to 15. A six-token step budget admits one R0 decode token and five R1 prompt tokens, deferring four remaining prompt tokens to the next step.'

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
    const panelW = 370
    const rightX = 455

    const sharedTokens = [
        { tok: 'A', slot: 'KV12' },
        { tok: 'B', slot: 'KV13' },
        { tok: 'C', slot: 'KV14' },
        { tok: 'D', slot: 'KV15' },
    ]

    const admittedBatch = [
        { tok: 'D0', type: 'Decode (R0)', tone: blue },
        { tok: 'P1', type: 'Prefill (R1)', tone: warm },
        { tok: 'P2', type: 'Prefill (R1)', tone: warm },
        { tok: 'P3', type: 'Prefill (R1)', tone: warm },
        { tok: 'P4', type: 'Prefill (R1)', tone: warm },
        { tok: 'P5', type: 'Prefill (R1)', tone: warm },
    ]

    const waitingTokens = ['P6', 'P7', 'P8', 'P9']

    return renderBoard(c, [
        // Title & Subtitle
        label(
            c,
            'Radix Tree Prefix Matching & Token Budget Scheduling',
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
            'Reusing cached KV tokens across requests while admitting mixed prefill and decode batches',
            35,
            46,
            790,
            20,
            15,
            muted,
            400,
        ),

        // Left panel: Radix Tree KV Cache State
        SvgFrame({
            c,
            x: leftX,
            y: 75,
            width: panelW,
            height: 345,
            rx: 8,
            stroke: purple,
            strokeWidth: 1.5,
            fill: theme === 'dark' ? 'rgba(163, 113, 247, 0.05)' : 'rgba(130, 80, 223, 0.03)',
        }),
        label(c, 'Radix Tree KV Cache State', leftX + 16, 88, panelW - 32, 22, 16, purple, 700),
        label(
            c,
            'Shared prefix node: 4 tokens (Ref count = 2)',
            leftX + 16,
            112,
            panelW - 32,
            18,
            13,
            muted,
        ),

        // Shared prefix container
        SvgFrame({
            c,
            x: leftX + 16,
            y: 135,
            width: panelW - 32,
            height: 75,
            rx: 6,
            stroke: purple,
            strokeWidth: 1.5,
            fill: theme === 'dark' ? 'rgba(163, 113, 247, 0.12)' : 'rgba(130, 80, 223, 0.08)',
        }),

        // 4 shared token boxes
        ...sharedTokens.flatMap((st, i) => [
            SvgFrame({
                c,
                x: leftX + 26 + i * 80,
                y: 145,
                width: 70,
                height: 55,
                rx: 5,
                stroke: purple,
                strokeWidth: 1,
                fill: c.bgCard,
            }),
            label(c, st.tok, leftX + 26 + i * 80, 150, 70, 24, 20, purple, 700, 'center'),
            label(c, st.slot, leftX + 26 + i * 80, 178, 70, 16, 12, muted, 500, 'center'),
        ]),

        // Branch arrows to child requests
        VectorArrow({
            x1: leftX + 95,
            y1: 210,
            x2: leftX + 95,
            y2: 245,
            color: blue,
            strokeWidth: 2,
            arrowSize: 4,
        }),
        VectorArrow({
            x1: leftX + 275,
            y1: 210,
            x2: leftX + 275,
            y2: 245,
            color: warm,
            strokeWidth: 2,
            arrowSize: 4,
        }),

        // Child box R0
        SvgFrame({
            c,
            x: leftX + 16,
            y: 245,
            width: 160,
            height: 155,
            rx: 6,
            stroke: blue,
            strokeWidth: 1.5,
            fill: theme === 'dark' ? 'rgba(56, 139, 253, 0.08)' : 'rgba(9, 105, 218, 0.05)',
        }),
        label(c, 'Request R0 Branch', leftX + 26, 255, 140, 20, 14, blue, 700),
        label(c, 'Active decode phase', leftX + 26, 280, 140, 18, 13, c.textPrimary, 600),
        label(c, 'Needs: 1 decode token', leftX + 26, 305, 140, 18, 12, muted),
        label(c, 'Reuses: A, B, C, D', leftX + 26, 330, 140, 18, 12, cyan, 600),
        label(c, 'Assigned: KV16', leftX + 26, 355, 140, 18, 12, muted),

        // Child box R1
        SvgFrame({
            c,
            x: leftX + 194,
            y: 245,
            width: 160,
            height: 155,
            rx: 6,
            stroke: warm,
            strokeWidth: 1.5,
            fill: theme === 'dark' ? 'rgba(210, 153, 34, 0.08)' : 'rgba(154, 103, 0, 0.05)',
        }),
        label(c, 'Request R1 Branch', leftX + 204, 255, 140, 20, 14, warm, 700),
        label(c, 'New prompt arrival', leftX + 204, 280, 140, 18, 13, c.textPrimary, 600),
        label(c, 'Needs: 9 prompt tokens', leftX + 204, 305, 140, 18, 12, muted),
        label(c, 'Reuses: A, B, C, D', leftX + 204, 330, 140, 18, 12, cyan, 600),
        label(c, 'Prefill chunking active', leftX + 204, 355, 140, 18, 12, muted),

        // Arrow connecting left panel to right panel
        VectorArrow({
            x1: leftX + panelW,
            y1: 247,
            x2: rightX,
            y2: 247,
            color: purple,
            strokeWidth: 2,
            arrowSize: 4,
        }),

        // Right panel: Step Batch Admission
        SvgFrame({
            c,
            x: rightX,
            y: 75,
            width: panelW,
            height: 345,
            rx: 8,
            stroke: green,
            strokeWidth: 1.5,
            fill: theme === 'dark' ? 'rgba(63, 185, 80, 0.05)' : 'rgba(26, 127, 55, 0.03)',
        }),
        label(
            c,
            'Step Batch Admission (Budget = 6)',
            rightX + 16,
            88,
            panelW - 32,
            22,
            16,
            green,
            700,
        ),
        label(
            c,
            'Admitted batch: 1 decode + 5 prompt tokens',
            rightX + 16,
            112,
            panelW - 32,
            18,
            13,
            muted,
        ),

        // Admitted tokens grid: 6 items in 2 rows of 3
        ...admittedBatch.flatMap((ab, i) => {
            const col = i % 3
            const row = Math.floor(i / 3)
            const bx = rightX + 16 + col * 115
            const by = 140 + row * 82
            return [
                SvgFrame({
                    c,
                    x: bx,
                    y: by,
                    width: 105,
                    height: 72,
                    rx: 6,
                    stroke: ab.tone,
                    strokeWidth: 1.5,
                    fill: theme === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                }),
                label(c, ab.tok, bx, by + 12, 105, 24, 20, ab.tone, 700, 'center'),
                label(c, ab.type, bx, by + 42, 105, 18, 12, muted, 500, 'center'),
            ]
        }),

        // Waiting prompt tokens container
        SvgFrame({
            c,
            x: rightX + 16,
            y: 315,
            width: panelW - 32,
            height: 85,
            rx: 6,
            stroke: cyan,
            strokeWidth: 1,
            fill: theme === 'dark' ? 'rgba(57, 197, 207, 0.05)' : 'rgba(26, 127, 139, 0.03)',
        }),
        label(
            c,
            'Waiting prompt tokens (deferred to next step):',
            rightX + 26,
            325,
            panelW - 52,
            18,
            12,
            cyan,
            600,
        ),

        ...waitingTokens.flatMap((wt, i) => [
            SvgFrame({
                c,
                x: rightX + 26 + i * 80,
                y: 348,
                width: 70,
                height: 42,
                rx: 5,
                stroke: c.border,
                strokeWidth: 1,
                fill: c.bgCard,
            }),
            label(c, wt, rightX + 26 + i * 80, 358, 70, 20, 15, muted, 600, 'center'),
        ]),

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
            'Step Load: 1 Decode + 5 Prefill = 6 Tokens | 4 Cached Tokens (A, B, C, D) Reused with 0 Recomputation',
            leftX + 20,
            447,
            750,
            20,
            13,
            green,
            600,
            'center',
        ),
    ])
}

export default create()
