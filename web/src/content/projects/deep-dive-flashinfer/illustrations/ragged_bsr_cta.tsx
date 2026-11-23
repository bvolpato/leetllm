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
    'Mapping between ragged logical token sequences and paged Block Compressed Sparse Row (BSR) physical layout for three requests. Logical tokens 0–3, 4–7, and 8 of request 2 map to non-contiguous physical pages 3, 14, and 6. Page 6 allocates only slot zero, and logical token 5 resides in physical page 14 slot 1.'

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
    const warm = getReadableToneColor('warm', c)
    const purple = getReadableToneColor('purple', c)
    const green = getReadableToneColor('green', c)
    const muted = c.textSecondary

    const panelW = 360
    const leftX = 35
    const rightX = 465

    return renderBoard(c, [
        label(
            c,
            'FlashInfer Paged KV Cache: Ragged Logical Sequences to Physical Pages',
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
            'Mapping non-contiguous physical memory pages through BSR block pointers (page_size = 4)',
            35,
            46,
            790,
            20,
            15,
            muted,
            400,
        ),

        // Left panel: Logical Tokens (Request 2)
        SvgFrame({
            c,
            x: leftX,
            y: 75,
            width: panelW,
            height: 310,
            rx: 8,
            stroke: blue,
            strokeWidth: 1.5,
            fill: theme === 'dark' ? 'rgba(56, 139, 253, 0.05)' : 'rgba(9, 105, 218, 0.03)',
        }),
        label(
            c,
            'Request 2 Logical Sequence (9 tokens)',
            leftX + 16,
            88,
            panelW - 32,
            22,
            16,
            blue,
            700,
        ),

        // Chunk 0: tokens 0..3
        SvgFrame({
            c,
            x: leftX + 16,
            y: 118,
            width: panelW - 32,
            height: 52,
            rx: 6,
            stroke: blue,
            strokeWidth: 1,
            fill: theme === 'dark' ? 'rgba(56, 139, 253, 0.12)' : 'rgba(9, 105, 218, 0.08)',
        }),
        label(
            c,
            'Tokens 0 .. 3 (Chunk 0)',
            leftX + 26,
            126,
            panelW - 52,
            18,
            14,
            c.textPrimary,
            600,
        ),
        label(c, '4 tokens · logical range [0:4]', leftX + 26, 146, panelW - 52, 16, 13, muted),

        // Chunk 1: tokens 4..7 (Token 5 highlighted)
        SvgFrame({
            c,
            x: leftX + 16,
            y: 185,
            width: panelW - 32,
            height: 58,
            rx: 6,
            stroke: cyan,
            strokeWidth: 1.5,
            fill: theme === 'dark' ? 'rgba(57, 197, 207, 0.12)' : 'rgba(27, 143, 153, 0.08)',
        }),
        label(
            c,
            'Tokens 4 .. 7 (Chunk 1)',
            leftX + 26,
            193,
            panelW - 52,
            18,
            14,
            c.textPrimary,
            600,
        ),
        label(
            c,
            'Logical token 5 located at offset 1',
            leftX + 26,
            215,
            panelW - 52,
            18,
            13,
            purple,
            700,
        ),

        // Chunk 2: token 8
        SvgFrame({
            c,
            x: leftX + 16,
            y: 258,
            width: panelW - 32,
            height: 52,
            rx: 6,
            stroke: warm,
            strokeWidth: 1,
            fill: theme === 'dark' ? 'rgba(210, 153, 34, 0.12)' : 'rgba(154, 103, 0, 0.08)',
        }),
        label(
            c,
            'Token 8 (Chunk 2, Tail)',
            leftX + 26,
            266,
            panelW - 52,
            18,
            14,
            c.textPrimary,
            600,
        ),
        label(c, '1 active token · last_page_len = 1', leftX + 26, 286, panelW - 52, 16, 13, muted),

        // Arrows from Left to Right
        VectorArrow({
            x1: leftX + panelW - 10,
            y1: 144,
            x2: rightX + 10,
            y2: 144,
            color: blue,
            strokeWidth: 1.5,
            arrowSize: 4,
        }),
        VectorArrow({
            x1: leftX + panelW - 10,
            y1: 214,
            x2: rightX + 10,
            y2: 214,
            color: cyan,
            strokeWidth: 1.5,
            arrowSize: 4,
        }),
        VectorArrow({
            x1: leftX + panelW - 10,
            y1: 284,
            x2: rightX + 10,
            y2: 284,
            color: warm,
            strokeWidth: 1.5,
            arrowSize: 4,
        }),

        // Right panel: Physical Paged Cache Pool
        SvgFrame({
            c,
            x: rightX,
            y: 75,
            width: panelW,
            height: 310,
            rx: 8,
            stroke: purple,
            strokeWidth: 1.5,
            fill: theme === 'dark' ? 'rgba(163, 113, 247, 0.05)' : 'rgba(130, 80, 223, 0.03)',
        }),
        label(
            c,
            'Physical Page Table [3, 14, 6]',
            rightX + 16,
            88,
            panelW - 32,
            22,
            16,
            purple,
            700,
        ),

        // Page 3
        SvgFrame({
            c,
            x: rightX + 16,
            y: 118,
            width: panelW - 32,
            height: 52,
            rx: 6,
            stroke: blue,
            strokeWidth: 1,
            fill: theme === 'dark' ? 'rgba(56, 139, 253, 0.12)' : 'rgba(9, 105, 218, 0.08)',
        }),
        label(
            c,
            'Physical Page 3 (Slots 0..3 full)',
            rightX + 26,
            126,
            panelW - 52,
            18,
            14,
            c.textPrimary,
            600,
        ),
        label(c, 'Holds tokens 0, 1, 2, 3', rightX + 26, 146, panelW - 52, 16, 13, muted),

        // Page 14
        SvgFrame({
            c,
            x: rightX + 16,
            y: 185,
            width: panelW - 32,
            height: 58,
            rx: 6,
            stroke: cyan,
            strokeWidth: 1.5,
            fill: theme === 'dark' ? 'rgba(57, 197, 207, 0.12)' : 'rgba(27, 143, 153, 0.08)',
        }),
        label(
            c,
            'Physical Page 14 (Slots 0..3 full)',
            rightX + 26,
            193,
            panelW - 52,
            18,
            14,
            c.textPrimary,
            600,
        ),
        label(
            c,
            'Slot 1 holds token 5 (address: page 14, slot 1)',
            rightX + 26,
            215,
            panelW - 52,
            18,
            13,
            purple,
            700,
        ),

        // Page 6
        SvgFrame({
            c,
            x: rightX + 16,
            y: 258,
            width: panelW - 32,
            height: 52,
            rx: 6,
            stroke: warm,
            strokeWidth: 1,
            fill: theme === 'dark' ? 'rgba(210, 153, 34, 0.12)' : 'rgba(154, 103, 0, 0.08)',
        }),
        label(
            c,
            'Physical Page 6 (Slot 0 active, 1..3 free)',
            rightX + 26,
            266,
            panelW - 52,
            18,
            14,
            c.textPrimary,
            600,
        ),
        label(
            c,
            'Holds token 8; remaining slots reserved for decode',
            rightX + 26,
            286,
            panelW - 52,
            16,
            13,
            muted,
        ),

        // Bottom panel: Takeaway
        SvgFrame({
            c,
            x: 35,
            y: 400,
            width: 790,
            height: 75,
            rx: 8,
            stroke: green,
            strokeWidth: 1.5,
            fill: theme === 'dark' ? 'rgba(63, 185, 80, 0.08)' : 'rgba(26, 127, 55, 0.04)',
        }),
        label(c, 'BSR Indirection Invariant', 52, 410, 750, 20, 16, green, 700),
        label(
            c,
            'Non-contiguous physical pages eliminate memory fragmentation. GPU kernels resolve token j at (page_ids[j // page_size], j % page_size) without moving tensors.',
            52,
            434,
            750,
            32,
            14,
            c.textPrimary,
            400,
        ),
    ])
}
