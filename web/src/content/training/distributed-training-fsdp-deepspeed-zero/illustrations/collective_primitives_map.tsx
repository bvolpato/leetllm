import { createElement } from 'react'
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
export const height = 540
export const alt =
    'Three two-rank tensor transformations: All-Reduce adds [1, 2] and [10, 20] by coordinate, then gives both ranks [11, 22]; Reduce-Scatter assigns 11 at index 0 to rank 0 and 22 at index 1 to rank 1; All-Gather joins those shards and gives both ranks [11, 22]. Arrows show tensor semantics rather than NCCL wire routing.'

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

function frame(
    c: Colors,
    x: number,
    y: number,
    w: number,
    h: number,
    color: string,
    fill: string,
    rx = 8,
    strokeWidth = 1.5,
) {
    return SvgFrame({ c, x, y, width: w, height: h, rx, fill, stroke: color, strokeWidth })
}

function valueFrame(c: Colors, x: number, y: number, color: string, w = 44, h = 32) {
    return SvgFrame({
        c,
        x,
        y,
        width: w,
        height: h,
        rx: 6,
        fill: c.bgCard,
        stroke: color,
        strokeWidth: 1.5,
    })
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const blue = getReadableToneColor('blue', c)
    const purple = getReadableToneColor('purple', c)
    const green = getReadableToneColor('green', c)
    const muted = c.textSecondary

    const geometry = [
        // Column 1: All-Reduce
        frame(c, 24, 76, 258, 416, blue, `${blue}0a`, 10, 1.5),
        frame(c, 36, 126, 234, 100, c.borderSubtle, c.bgCard, 8, 1),
        frame(c, 36, 280, 234, 100, blue, `${blue}12`, 8, 1.2),

        // Column 1 Value Frames
        valueFrame(c, 130, 146, blue),
        valueFrame(c, 182, 146, blue),
        valueFrame(c, 130, 184, purple),
        valueFrame(c, 182, 184, purple),
        valueFrame(c, 130, 300, green),
        valueFrame(c, 182, 300, green),
        valueFrame(c, 130, 338, green),
        valueFrame(c, 182, 338, green),

        // Column 2: Reduce-Scatter
        frame(c, 301, 76, 258, 416, purple, `${purple}0a`, 10, 1.5),
        frame(c, 313, 126, 234, 100, c.borderSubtle, c.bgCard, 8, 1),
        frame(c, 313, 280, 234, 100, purple, `${purple}12`, 8, 1.2),

        // Column 2 Value Frames
        valueFrame(c, 407, 146, blue),
        valueFrame(c, 459, 146, blue),
        valueFrame(c, 407, 184, purple),
        valueFrame(c, 459, 184, purple),
        valueFrame(c, 407, 300, green, 54),
        valueFrame(c, 407, 338, green, 54),

        // Column 3: All-Gather
        frame(c, 578, 76, 258, 416, green, `${green}0a`, 10, 1.5),
        frame(c, 590, 126, 234, 100, c.borderSubtle, c.bgCard, 8, 1),
        frame(c, 590, 280, 234, 100, green, `${green}12`, 8, 1.2),

        // Column 3 Value Frames
        valueFrame(c, 684, 146, blue, 54),
        valueFrame(c, 684, 184, purple, 54),
        valueFrame(c, 684, 300, green),
        valueFrame(c, 736, 300, green),
        valueFrame(c, 684, 338, green),
        valueFrame(c, 736, 338, green),
    ]

    const arrows = [
        // Column 1 Down Arrow
        VectorArrow({
            x1: 153,
            y1: 236,
            x2: 153,
            y2: 270,
            color: blue,
            strokeWidth: 2,
            arrowSize: 6,
        }),
        // Column 2 Down Arrow
        VectorArrow({
            x1: 430,
            y1: 236,
            x2: 430,
            y2: 270,
            color: purple,
            strokeWidth: 2,
            arrowSize: 6,
        }),
        // Column 3 Down Arrow
        VectorArrow({
            x1: 707,
            y1: 236,
            x2: 707,
            y2: 270,
            color: green,
            strokeWidth: 2,
            arrowSize: 6,
        }),
    ]

    const labels = [
        // Header
        label(
            c,
            'Collective Communication Primitives Map',
            24,
            14,
            812,
            28,
            22,
            c.textPrimary,
            700,
        ),
        label(
            c,
            'Two-rank tensor transformations: All-Reduce, Reduce-Scatter, and All-Gather',
            24,
            44,
            812,
            20,
            13,
            muted,
            500,
        ),

        // Column 1: All-Reduce
        label(c, 'All-Reduce', 36, 88, 234, 20, 16, blue, 700),
        label(c, 'Sum across ranks, then replicate sum', 36, 106, 234, 16, 11, muted, 500),
        label(c, 'INPUT TENSORS', 48, 130, 210, 14, 10, muted, 700),
        label(c, 'R₀', 56, 153, 30, 18, 12, blue, 700, 'left', true),
        label(c, '1', 130, 153, 44, 18, 13, c.textPrimary, 700, 'center', true),
        label(c, '2', 182, 153, 44, 18, 13, c.textPrimary, 700, 'center', true),
        label(c, 'R₁', 56, 191, 30, 18, 12, purple, 700, 'left', true),
        label(c, '10', 130, 191, 44, 18, 13, c.textPrimary, 700, 'center', true),
        label(c, '20', 182, 191, 44, 18, 13, c.textPrimary, 700, 'center', true),

        label(c, 'Elementwise Sum', 36, 246, 234, 16, 11, blue, 600, 'center'),

        label(c, 'RESULT (FULL REPLICATED)', 48, 284, 210, 14, 10, blue, 700),
        label(c, 'R₀', 56, 307, 30, 18, 12, green, 700, 'left', true),
        label(c, '11', 130, 307, 44, 18, 13, c.textPrimary, 700, 'center', true),
        label(c, '22', 182, 307, 44, 18, 13, c.textPrimary, 700, 'center', true),
        label(c, 'R₁', 56, 345, 30, 18, 12, green, 700, 'left', true),
        label(c, '11', 130, 345, 44, 18, 13, c.textPrimary, 700, 'center', true),
        label(c, '22', 182, 345, 44, 18, 13, c.textPrimary, 700, 'center', true),

        label(
            c,
            'Volume: 2 · (N - 1) / N · S bytes\nClassic DDP gradient sync and\nMegatron TP RowParallel matmuls.',
            36,
            396,
            234,
            48,
            11,
            muted,
            400,
        ),

        // Column 2: Reduce-Scatter
        label(c, 'Reduce-Scatter', 313, 88, 234, 20, 16, purple, 700),
        label(c, 'Sum across ranks, then partition shards', 313, 106, 234, 16, 11, muted, 500),
        label(c, 'INPUT TENSORS', 325, 130, 210, 14, 10, muted, 700),
        label(c, 'R₀', 333, 153, 30, 18, 12, blue, 700, 'left', true),
        label(c, '1', 407, 153, 44, 18, 13, c.textPrimary, 700, 'center', true),
        label(c, '2', 459, 153, 44, 18, 13, c.textPrimary, 700, 'center', true),
        label(c, 'R₁', 333, 191, 30, 18, 12, purple, 700, 'left', true),
        label(c, '10', 407, 191, 44, 18, 13, c.textPrimary, 700, 'center', true),
        label(c, '20', 459, 191, 44, 18, 13, c.textPrimary, 700, 'center', true),

        label(c, 'Sum & Partition by Index', 313, 246, 234, 16, 11, purple, 600, 'center'),

        label(c, 'RESULT (SHARDED)', 325, 284, 210, 14, 10, purple, 700),
        label(c, 'R₀ (idx 0)', 333, 307, 70, 18, 11, green, 700, 'left', true),
        label(c, '11', 407, 307, 54, 18, 13, c.textPrimary, 700, 'center', true),
        label(c, 'R₁ (idx 1)', 333, 345, 70, 18, 11, green, 700, 'left', true),
        label(c, '22', 407, 345, 54, 18, 13, c.textPrimary, 700, 'center', true),

        label(
            c,
            'Volume: (N - 1) / N · S bytes\nZeRO-2/3 and FSDP gradient\nreduction across worker ranks.',
            313,
            396,
            234,
            48,
            11,
            muted,
            400,
        ),

        // Column 3: All-Gather
        label(c, 'All-Gather', 590, 88, 234, 20, 16, green, 700),
        label(c, 'Collect shards from ranks to rebuild tensor', 590, 106, 234, 16, 11, muted, 500),
        label(c, 'INPUT TENSORS (SHARDED)', 602, 130, 210, 14, 10, muted, 700),
        label(c, 'R₀ (idx 0)', 610, 153, 70, 18, 11, blue, 700, 'left', true),
        label(c, '11', 684, 153, 54, 18, 13, c.textPrimary, 700, 'center', true),
        label(c, 'R₁ (idx 1)', 610, 191, 70, 18, 11, purple, 700, 'left', true),
        label(c, '22', 684, 191, 54, 18, 13, c.textPrimary, 700, 'center', true),

        label(c, 'Concatenate Shards', 590, 246, 234, 16, 11, green, 600, 'center'),

        label(c, 'RESULT (RECONSTRUCTED)', 602, 284, 210, 14, 10, green, 700),
        label(c, 'R₀', 610, 307, 30, 18, 12, green, 700, 'left', true),
        label(c, '11', 684, 307, 44, 18, 13, c.textPrimary, 700, 'center', true),
        label(c, '22', 736, 307, 44, 18, 13, c.textPrimary, 700, 'center', true),
        label(c, 'R₁', 610, 345, 30, 18, 12, green, 700, 'left', true),
        label(c, '11', 684, 345, 44, 18, 13, c.textPrimary, 700, 'center', true),
        label(c, '22', 736, 345, 44, 18, 13, c.textPrimary, 700, 'center', true),

        label(
            c,
            'Volume: (N - 1) / N · S bytes\nZeRO-3 and FSDP parameter\nmaterialization before compute.',
            590,
            396,
            234,
            48,
            11,
            muted,
            400,
        ),

        // Footer
        label(
            c,
            'Identity: All-Reduce(X) ≡ Reduce-Scatter(X) followed by All-Gather(X) · Sizing models sent bytes per rank',
            24,
            506,
            812,
            18,
            12,
            muted,
            500,
            'center',
        ),
    ]

    const svg = createElement(
        'svg',
        {
            width,
            height,
            viewBox: `0 0 ${width} ${height}`,
            role: 'presentation',
            'aria-hidden': true,
        },
        ...geometry,
        ...arrows,
    )
    return Board({
        c,
        width,
        height,
        background: 'transparent',
        children: [CanvasItem({ x: 0, y: 0, width, height, children: svg }), ...labels],
    })
}

export default create('dark')
