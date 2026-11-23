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
    'SGLang runtime architecture: HTTP ingress tokenizes requests into the Radix Scheduler for prefix tree lookup, followed by model runner forward execution, grammar-constrained sampling, streaming output, and iterative decode feedback.'

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
    const colW = 240
    const gapX = 35
    const col2X = leftX + colW + gapX // 310
    const col3X = col2X + colW + gapX // 585

    const row1Y = 80
    const row2Y = 270
    const boxH = 140

    return renderBoard(c, [
        // Title & Subtitle
        label(
            c,
            'SGLang Runtime: Request Lifecycle & Decode Loop',
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
            'Prefix cache matching, chunked prefill, and compressed grammar-guided decode',
            35,
            46,
            790,
            20,
            15,
            muted,
            400,
        ),

        // Box 1: Frontend / HTTP Ingress
        SvgFrame({
            c,
            x: leftX,
            y: row1Y,
            width: colW,
            height: boxH,
            rx: 8,
            stroke: blue,
            strokeWidth: 1.5,
            fill: theme === 'dark' ? 'rgba(56, 139, 253, 0.08)' : 'rgba(9, 105, 218, 0.05)',
        }),
        label(c, '1. Frontend / Ingress', leftX + 16, row1Y + 16, colW - 32, 22, 16, blue, 700),
        label(
            c,
            'OpenAI API & FastRoute',
            leftX + 16,
            row1Y + 44,
            colW - 32,
            20,
            14,
            c.textPrimary,
            600,
        ),
        label(c, 'Admission queue & validation', leftX + 16, row1Y + 68, colW - 32, 18, 13, muted),
        label(c, 'HTTP streaming connection', leftX + 16, row1Y + 92, colW - 32, 18, 13, muted),

        // Arrow 1 -> 2
        VectorArrow({
            x1: leftX + colW,
            y1: row1Y + 70,
            x2: col2X,
            y2: row1Y + 70,
            color: cyan,
            strokeWidth: 2,
            arrowSize: 4,
        }),

        // Box 2: Tokenization & BPE
        SvgFrame({
            c,
            x: col2X,
            y: row1Y,
            width: colW,
            height: boxH,
            rx: 8,
            stroke: cyan,
            strokeWidth: 1.5,
            fill: theme === 'dark' ? 'rgba(57, 197, 207, 0.08)' : 'rgba(26, 127, 139, 0.05)',
        }),
        label(c, '2. Tokenization', col2X + 16, row1Y + 16, colW - 32, 22, 16, cyan, 700),
        label(
            c,
            'BPE Token Segmentation',
            col2X + 16,
            row1Y + 44,
            colW - 32,
            20,
            14,
            c.textPrimary,
            600,
        ),
        label(c, 'Extract prompt token IDs', col2X + 16, row1Y + 68, colW - 32, 18, 13, muted),
        label(c, 'Fast regex pre-tokenization', col2X + 16, row1Y + 92, colW - 32, 18, 13, muted),

        // Arrow 2 -> 3
        VectorArrow({
            x1: col2X + colW,
            y1: row1Y + 70,
            x2: col3X,
            y2: row1Y + 70,
            color: purple,
            strokeWidth: 2,
            arrowSize: 4,
        }),

        // Box 3: Radix Cache Scheduler
        SvgFrame({
            c,
            x: col3X,
            y: row1Y,
            width: colW,
            height: boxH,
            rx: 8,
            stroke: purple,
            strokeWidth: 1.5,
            fill: theme === 'dark' ? 'rgba(163, 113, 247, 0.08)' : 'rgba(130, 80, 223, 0.05)',
        }),
        label(c, '3. Radix Scheduler', col3X + 16, row1Y + 16, colW - 32, 22, 16, purple, 700),
        label(
            c,
            'Radix Prefix Tree Cache',
            col3X + 16,
            row1Y + 44,
            colW - 32,
            20,
            14,
            c.textPrimary,
            600,
        ),
        label(c, 'Match longest cached prefix', col3X + 16, row1Y + 68, colW - 32, 18, 13, muted),
        label(c, 'Allocate token budget & batch', col3X + 16, row1Y + 92, colW - 32, 18, 13, muted),

        // Vertical Arrow 3 -> 4
        VectorArrow({
            x1: col3X + 120,
            y1: row1Y + boxH,
            x2: col3X + 120,
            y2: row2Y,
            color: green,
            strokeWidth: 2,
            arrowSize: 4,
        }),

        // Box 4: Model Runner
        SvgFrame({
            c,
            x: col3X,
            y: row2Y,
            width: colW,
            height: boxH,
            rx: 8,
            stroke: green,
            strokeWidth: 1.5,
            fill: theme === 'dark' ? 'rgba(63, 185, 80, 0.08)' : 'rgba(26, 127, 55, 0.05)',
        }),
        label(c, '4. Model Runner', col3X + 16, row2Y + 16, colW - 32, 22, 16, green, 700),
        label(
            c,
            'Forward Execution Pass',
            col3X + 16,
            row2Y + 44,
            colW - 32,
            20,
            14,
            c.textPrimary,
            600,
        ),
        label(c, 'FlashInfer attention kernels', col3X + 16, row2Y + 68, colW - 32, 18, 13, muted),
        label(c, 'Batched decode CUDA graph', col3X + 16, row2Y + 92, colW - 32, 18, 13, muted),

        // Arrow 4 -> 5
        VectorArrow({
            x1: col3X,
            y1: row2Y + 70,
            x2: col2X + colW,
            y2: row2Y + 70,
            color: warm,
            strokeWidth: 2,
            arrowSize: 4,
        }),

        // Box 5: Grammar Sampler
        SvgFrame({
            c,
            x: col2X,
            y: row2Y,
            width: colW,
            height: boxH,
            rx: 8,
            stroke: warm,
            strokeWidth: 1.5,
            fill: theme === 'dark' ? 'rgba(210, 153, 34, 0.08)' : 'rgba(154, 103, 0, 0.05)',
        }),
        label(c, '5. Grammar Sampler', col2X + 16, row2Y + 16, colW - 32, 22, 16, warm, 700),
        label(
            c,
            'Compressed FSM Sampling',
            col2X + 16,
            row2Y + 44,
            colW - 32,
            20,
            14,
            c.textPrimary,
            600,
        ),
        label(c, 'Constrained token mask', col2X + 16, row2Y + 68, colW - 32, 18, 13, muted),
        label(c, 'Sample verified next token', col2X + 16, row2Y + 92, colW - 32, 18, 13, muted),

        // Feedback Arrow: Sampler to Scheduler
        VectorArrow({
            x1: col2X + 160,
            y1: row2Y,
            x2: col3X + 60,
            y2: row1Y + boxH,
            color: warm,
            strokeWidth: 1.5,
            arrowSize: 4,
        }),
        label(c, 'Next decode step (append KV)', col2X + 90, 235, 200, 18, 12, warm, 600),

        // Arrow 5 -> 6
        VectorArrow({
            x1: col2X,
            y1: row2Y + 70,
            x2: leftX + colW,
            y2: row2Y + 70,
            color: blue,
            strokeWidth: 2,
            arrowSize: 4,
        }),

        // Box 6: Detokenize & Stream
        SvgFrame({
            c,
            x: leftX,
            y: row2Y,
            width: colW,
            height: boxH,
            rx: 8,
            stroke: blue,
            strokeWidth: 1.5,
            fill: theme === 'dark' ? 'rgba(56, 139, 253, 0.08)' : 'rgba(9, 105, 218, 0.05)',
        }),
        label(c, '6. Detokenize & Stream', leftX + 16, row2Y + 16, colW - 32, 22, 16, blue, 700),
        label(
            c,
            'Incremental UTF-8 Stream',
            leftX + 16,
            row2Y + 44,
            colW - 32,
            20,
            14,
            c.textPrimary,
            600,
        ),
        label(c, 'Server-Sent Events (SSE)', leftX + 16, row2Y + 68, colW - 32, 18, 13, muted),
        label(c, 'Deliver tokens to client', leftX + 16, row2Y + 92, colW - 32, 18, 13, muted),

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
            'TTFT: Ingress → Tokenize → Radix Match → First Prefill',
            leftX + 16,
            447,
            370,
            20,
            12,
            cyan,
            600,
        ),
        label(
            c,
            'ITL: Forward Step → FSM Mask → Sample → Stream Token',
            435,
            447,
            374,
            20,
            12,
            green,
            600,
            'right',
        ),
    ])
}

export default create()
