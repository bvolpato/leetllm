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
    'Comparative KV cache memory budget: for a 16-layer model with 4 KV heads and head dimension 64 in bfloat16, DynamicCache scales linearly from 8 MiB at 512 tokens to 64 MiB at 4096 tokens. StaticCache preallocates the full 64 MiB buffer upfront at capacity 4096 regardless of live token count.'

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
    const chartW = 515
    const rightX = 575
    const rightW = 250
    const cardY = 75
    const cardH = 345

    const barStartX = leftX + 175
    const maxBarW = 260

    return renderBoard(c, [
        // Title & Subtitle
        label(
            c,
            'KV Cache Memory Allocation: DynamicCache vs StaticCache',
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
            'DynamicCache scales with decoded tokens; StaticCache fixes buffers upfront for CUDA Graph execution',
            35,
            46,
            790,
            20,
            15,
            muted,
            400,
        ),

        // Left Chart Card
        SvgFrame({
            c,
            x: leftX,
            y: cardY,
            width: chartW,
            height: cardH,
            rx: 8,
            stroke: c.border,
            strokeWidth: 1,
            fill: c.bgCard,
        }),

        label(c, 'CACHE ALLOCATION COMPARISON', leftX + 18, cardY + 16, 300, 20, 13, cyan, 700),

        // Grid markers
        ...[0, 16, 32, 48, 64].flatMap((val) => {
            const tickX = barStartX + (val / 64) * maxBarW
            return [
                VectorSegment({
                    x1: tickX,
                    y1: cardY + 45,
                    x2: tickX,
                    y2: cardY + 285,
                    color: c.border,
                    strokeWidth: 1,
                    showStartDot: false,
                    showEndDot: false,
                }),
                label(
                    c,
                    `${val}M`,
                    tickX - 16,
                    cardY + 292,
                    32,
                    16,
                    11,
                    muted,
                    500,
                    'center',
                    true,
                ),
            ]
        }),

        // Row 1: Dynamic 512
        label(c, 'DynamicCache · S=512', leftX + 18, cardY + 60, 150, 18, 12, blue, 700),
        label(c, 'grows dynamically', leftX + 18, cardY + 78, 150, 16, 10, muted),
        SvgFrame({
            c,
            x: barStartX,
            y: cardY + 62,
            width: (8 / 64) * maxBarW,
            height: 26,
            rx: 4,
            stroke: blue,
            strokeWidth: 1.5,
            fill: theme === 'dark' ? 'rgba(88, 166, 255, 0.35)' : 'rgba(9, 105, 218, 0.25)',
        }),
        label(
            c,
            '8 MiB',
            barStartX + (8 / 64) * maxBarW + 8,
            cardY + 67,
            70,
            18,
            12,
            blue,
            700,
            'left',
            true,
        ),

        // Row 2: Dynamic 4096
        label(c, 'DynamicCache · S=4096', leftX + 18, cardY + 115, 150, 18, 12, blue, 700),
        label(c, 'full sequence length', leftX + 18, cardY + 133, 150, 16, 10, muted),
        SvgFrame({
            c,
            x: barStartX,
            y: cardY + 117,
            width: maxBarW,
            height: 26,
            rx: 4,
            stroke: blue,
            strokeWidth: 1.5,
            fill: theme === 'dark' ? 'rgba(88, 166, 255, 0.35)' : 'rgba(9, 105, 218, 0.25)',
        }),
        label(
            c,
            '64 MiB',
            barStartX + maxBarW + 8,
            cardY + 122,
            70,
            18,
            12,
            blue,
            700,
            'left',
            true,
        ),

        // Row 3: Static 512 (cap=4096)
        label(c, 'StaticCache · S=512', leftX + 18, cardY + 175, 150, 18, 12, warm, 700),
        label(c, 'cap=4096 (CUDA Graphs)', leftX + 18, cardY + 193, 150, 16, 10, muted),
        // Reserved total
        SvgFrame({
            c,
            x: barStartX,
            y: cardY + 177,
            width: maxBarW,
            height: 26,
            rx: 4,
            stroke: warm,
            strokeWidth: 1,
            fill: theme === 'dark' ? 'rgba(210, 153, 34, 0.12)' : 'rgba(154, 103, 0, 0.08)',
        }),
        // Active portion
        SvgFrame({
            c,
            x: barStartX,
            y: cardY + 177,
            width: (8 / 64) * maxBarW,
            height: 26,
            rx: 4,
            stroke: warm,
            strokeWidth: 1.5,
            fill: theme === 'dark' ? 'rgba(210, 153, 34, 0.5)' : 'rgba(154, 103, 0, 0.4)',
        }),
        label(
            c,
            '8M active + 56M reserved',
            barStartX + (8 / 64) * maxBarW + 8,
            cardY + 182,
            190,
            18,
            11,
            warm,
            600,
            'left',
            true,
        ),

        // Row 4: Static 4096 (cap=4096)
        label(c, 'StaticCache · S=4096', leftX + 18, cardY + 235, 150, 18, 12, warm, 700),
        label(c, 'cap=4096 (full buffer)', leftX + 18, cardY + 253, 150, 16, 10, muted),
        SvgFrame({
            c,
            x: barStartX,
            y: cardY + 237,
            width: maxBarW,
            height: 26,
            rx: 4,
            stroke: warm,
            strokeWidth: 1.5,
            fill: theme === 'dark' ? 'rgba(210, 153, 34, 0.5)' : 'rgba(154, 103, 0, 0.4)',
        }),
        label(
            c,
            '64 MiB',
            barStartX + maxBarW + 8,
            cardY + 242,
            70,
            18,
            12,
            warm,
            700,
            'left',
            true,
        ),

        // Right Card: Formula & Invariants
        SvgFrame({
            c,
            x: rightX,
            y: cardY,
            width: rightW,
            height: cardH,
            rx: 8,
            stroke: purple,
            strokeWidth: 1.5,
            fill: theme === 'dark' ? 'rgba(187, 128, 255, 0.08)' : 'rgba(130, 80, 223, 0.05)',
        }),
        label(c, 'MEMORY FORMULATION', rightX + 16, cardY + 16, rightW - 32, 20, 13, purple, 700),

        SvgFrame({
            c,
            x: rightX + 14,
            y: cardY + 45,
            width: rightW - 28,
            height: 145,
            rx: 6,
            stroke: c.border,
            strokeWidth: 1,
            fill: c.bgCard,
        }),
        label(
            c,
            '2 × L × B × S × Hkv × D × 2B',
            rightX + 22,
            cardY + 56,
            rightW - 44,
            18,
            11,
            green,
            700,
            'left',
            true,
        ),
        label(
            c,
            '• L = 16 transformer layers',
            rightX + 22,
            cardY + 78,
            rightW - 44,
            16,
            10,
            muted,
            500,
        ),
        label(
            c,
            '• B = 1 batch sequence',
            rightX + 22,
            cardY + 96,
            rightW - 44,
            16,
            10,
            muted,
            500,
        ),
        label(
            c,
            '• Hkv = 4 key-value heads',
            rightX + 22,
            cardY + 114,
            rightW - 44,
            16,
            10,
            muted,
            500,
        ),
        label(
            c,
            '• D = 64 head dimension',
            rightX + 22,
            cardY + 132,
            rightW - 44,
            16,
            10,
            muted,
            500,
        ),
        label(
            c,
            '• Dtype = bfloat16 (2 bytes)',
            rightX + 22,
            cardY + 150,
            rightW - 44,
            16,
            10,
            muted,
            500,
        ),
        label(
            c,
            '→ 16 KiB per token position',
            rightX + 22,
            cardY + 168,
            rightW - 44,
            16,
            11,
            cyan,
            700,
            'left',
            true,
        ),

        label(
            c,
            'CUDA Graph Invariant',
            rightX + 16,
            cardY + 205,
            rightW - 32,
            18,
            12,
            c.textPrimary,
            600,
        ),
        label(
            c,
            'StaticCache pre-allocates maximum capacity so memory addresses remain constant, enabling CUDA Graph capture without dynamic reallocation overhead.',
            rightX + 16,
            cardY + 228,
            rightW - 32,
            60,
            11,
            muted,
        ),

        // Callout arrow from Right Card to Reserved buffer
        VectorArrow({
            x1: rightX,
            y1: cardY + 190,
            x2: barStartX + maxBarW - 20,
            y2: cardY + 190,
            color: getReadableToneColor('warm', c),
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
        label(
            c,
            'DynamicCache: Linear memory scaling per step',
            leftX + 20,
            447,
            260,
            20,
            12,
            blue,
            600,
        ),
        label(
            c,
            'StaticCache: Fixed footprint, zero reallocations',
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
            'Paged Attention: Production multi-tenant pooling',
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
