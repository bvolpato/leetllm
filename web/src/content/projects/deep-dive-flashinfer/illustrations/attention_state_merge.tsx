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
    'Split-KV attention state merge across two thread blocks (CTAs) for one query row and head. Worker A processes key chunk 1 with base-2 LSE 2 and output [1, 0] (mass 4). Worker B processes key chunk 2 with base-2 LSE 1 and output [0, 1] (mass 2). Cascaded merging calculates relative weights 4/6 and 2/6, producing merged output [2/3, 1/3] and updated base-2 LSE log2(6) approximately 2.585 without materializing full attention logits.'

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
    const muted = c.textSecondary

    const workerW = 370
    const leftX = 35
    const rightX = 455

    return renderBoard(c, [
        label(c, 'Split-KV Attention State Merge', 35, 18, 790, 28, 22, c.textPrimary, 700),
        label(
            c,
            'Hierarchical accumulation of partial attention outputs and base-2 Log-Sum-Exp statistics',
            35,
            46,
            790,
            20,
            15,
            muted,
            400,
        ),

        // Worker A
        SvgFrame({
            c,
            x: leftX,
            y: 75,
            width: workerW,
            height: 190,
            rx: 8,
            stroke: blue,
            strokeWidth: 1.5,
            fill: theme === 'dark' ? 'rgba(56, 139, 253, 0.06)' : 'rgba(9, 105, 218, 0.04)',
        }),
        label(c, 'Worker CTA A (Key Chunk A)', leftX + 16, 88, workerW - 32, 22, 16, blue, 700),
        label(
            c,
            'Partial output: o_A = [1.0, 0.0]',
            leftX + 16,
            116,
            workerW - 32,
            20,
            14,
            c.textPrimary,
            600,
            'left',
            true,
        ),
        label(
            c,
            'Base-2 LSE: b_A = 2.0',
            leftX + 16,
            142,
            workerW - 32,
            20,
            14,
            blue,
            700,
            'left',
            true,
        ),
        label(
            c,
            'Normalization mass: 2^(b_A) = 2^2 = 4.0',
            leftX + 16,
            168,
            workerW - 32,
            20,
            13,
            muted,
            500,
            'left',
            true,
        ),

        // Worker B
        SvgFrame({
            c,
            x: rightX,
            y: 75,
            width: workerW,
            height: 190,
            rx: 8,
            stroke: cyan,
            strokeWidth: 1.5,
            fill: theme === 'dark' ? 'rgba(57, 197, 207, 0.06)' : 'rgba(27, 143, 153, 0.04)',
        }),
        label(c, 'Worker CTA B (Key Chunk B)', rightX + 16, 88, workerW - 32, 22, 16, cyan, 700),
        label(
            c,
            'Partial output: o_B = [0.0, 1.0]',
            rightX + 16,
            116,
            workerW - 32,
            20,
            14,
            c.textPrimary,
            600,
            'left',
            true,
        ),
        label(
            c,
            'Base-2 LSE: b_B = 1.0',
            rightX + 16,
            142,
            workerW - 32,
            20,
            14,
            cyan,
            700,
            'left',
            true,
        ),
        label(
            c,
            'Normalization mass: 2^(b_B) = 2^1 = 2.0',
            rightX + 16,
            168,
            workerW - 32,
            20,
            13,
            muted,
            500,
            'left',
            true,
        ),

        // Arrows converging to merge
        VectorArrow({
            x1: leftX + workerW / 2,
            y1: 268,
            x2: 340,
            y2: 300,
            color: purple,
            strokeWidth: 2,
            arrowSize: 4,
        }),
        VectorArrow({
            x1: rightX + workerW / 2,
            y1: 268,
            x2: 520,
            y2: 300,
            color: purple,
            strokeWidth: 2,
            arrowSize: 4,
        }),

        // Merged Parent Box
        SvgFrame({
            c,
            x: 160,
            y: 295,
            width: 540,
            height: 180,
            rx: 8,
            stroke: purple,
            strokeWidth: 1.5,
            fill: theme === 'dark' ? 'rgba(163, 113, 247, 0.08)' : 'rgba(130, 80, 223, 0.05)',
        }),
        label(c, 'Cascaded Merge: Total Mass = 4 + 2 = 6', 180, 308, 500, 22, 16, purple, 700),
        label(
            c,
            'Weights: w_A = 4/6 (66.7%)   |   w_B = 2/6 (33.3%)',
            180,
            336,
            500,
            20,
            14,
            c.textPrimary,
            600,
            'left',
            true,
        ),
        label(
            c,
            'Merged Output: o = (4·o_A + 2·o_B) / 6 = [2/3, 1/3] ≈ [0.6667, 0.3333]',
            180,
            366,
            500,
            22,
            14,
            green,
            700,
            'left',
            true,
        ),
        label(
            c,
            'Merged Base-2 LSE: b = log2(6) = 2 + log2(1.5) ≈ 2.5850',
            180,
            398,
            500,
            20,
            14,
            purple,
            700,
            'left',
            true,
        ),
        label(
            c,
            'State tuple (o, b) can be merged recursively across arbitrary key splits',
            180,
            434,
            500,
            18,
            13,
            muted,
            400,
        ),
    ])
}
