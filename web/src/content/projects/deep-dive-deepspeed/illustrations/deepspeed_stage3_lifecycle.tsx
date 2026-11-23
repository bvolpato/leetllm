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
    'ZeRO-3 execution lifecycle across forward and backward passes. Forward gathers module weights from peer shards, computes layer activations, and immediately releases the full view. Backward gathers weights again, computes layer gradients, and reduce-scatters them to owner ranks. Local Adam optimizer updates execute at the accumulation boundary on owned shards.'

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
    const purple = getReadableToneColor('purple', c)
    const green = getReadableToneColor('green', c)
    const warm = getReadableToneColor('warm', c)
    const muted = c.textSecondary

    const panelW = 385
    const leftX = 35
    const rightX = 440

    return renderBoard(c, [
        label(c, 'ZeRO-3 Layer Execution Lifecycle', 35, 18, 790, 28, 22, c.textPrimary, 700),
        label(
            c,
            'Dynamic parameter gather, compute, release, and reduce-scatter per module',
            35,
            46,
            790,
            20,
            15,
            muted,
            400,
        ),

        // Left panel: Forward Pass
        SvgFrame({
            c,
            x: leftX,
            y: 75,
            width: panelW,
            height: 305,
            rx: 8,
            stroke: blue,
            strokeWidth: 1.5,
            fill: theme === 'dark' ? 'rgba(56, 139, 253, 0.06)' : 'rgba(9, 105, 218, 0.04)',
        }),
        label(c, 'Forward Pass (Module Layer l)', leftX + 16, 88, panelW - 32, 22, 17, blue, 700),

        // Step 1: Forward Gather
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
            '1. All-Gather Weights (W_l)',
            leftX + 26,
            126,
            panelW - 52,
            18,
            15,
            c.textPrimary,
            700,
        ),
        label(
            c,
            'Reconstruct full layer parameters across ranks',
            leftX + 26,
            146,
            panelW - 52,
            16,
            13,
            muted,
        ),

        VectorArrow({
            x1: leftX + panelW / 2,
            y1: 172,
            x2: leftX + panelW / 2,
            y2: 196,
            color: blue,
            strokeWidth: 1.5,
            arrowSize: 4,
        }),

        // Step 2: Forward Compute
        SvgFrame({
            c,
            x: leftX + 16,
            y: 198,
            width: panelW - 32,
            height: 52,
            rx: 6,
            stroke: green,
            strokeWidth: 1,
            fill: theme === 'dark' ? 'rgba(63, 185, 80, 0.12)' : 'rgba(26, 127, 55, 0.08)',
        }),
        label(
            c,
            '2. Forward Compute: X_{l+1} = f(X_l, W_l)',
            leftX + 26,
            206,
            panelW - 52,
            18,
            15,
            c.textPrimary,
            700,
        ),
        label(
            c,
            'Calculate activations; stash input for backward',
            leftX + 26,
            226,
            panelW - 52,
            16,
            13,
            muted,
        ),

        VectorArrow({
            x1: leftX + panelW / 2,
            y1: 252,
            x2: leftX + panelW / 2,
            y2: 276,
            color: warm,
            strokeWidth: 1.5,
            arrowSize: 4,
        }),

        // Step 3: Release Full View
        SvgFrame({
            c,
            x: leftX + 16,
            y: 278,
            width: panelW - 32,
            height: 52,
            rx: 6,
            stroke: warm,
            strokeWidth: 1,
            fill: theme === 'dark' ? 'rgba(210, 153, 34, 0.12)' : 'rgba(154, 103, 0, 0.08)',
        }),
        label(
            c,
            '3. Release Gathered Weights (W_l)',
            leftX + 26,
            286,
            panelW - 52,
            18,
            15,
            c.textPrimary,
            700,
        ),
        label(
            c,
            'Free full buffer; retain only local shard W_l / N',
            leftX + 26,
            306,
            panelW - 52,
            16,
            13,
            muted,
        ),

        // Right panel: Backward Pass
        SvgFrame({
            c,
            x: rightX,
            y: 75,
            width: panelW,
            height: 305,
            rx: 8,
            stroke: purple,
            strokeWidth: 1.5,
            fill: theme === 'dark' ? 'rgba(163, 113, 247, 0.06)' : 'rgba(130, 80, 223, 0.04)',
        }),
        label(
            c,
            'Backward Pass (Module Layer l)',
            rightX + 16,
            88,
            panelW - 32,
            22,
            17,
            purple,
            700,
        ),

        // Step 4: Backward Gather
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
            '4. All-Gather Weights Again (W_l)',
            rightX + 26,
            126,
            panelW - 52,
            18,
            15,
            c.textPrimary,
            700,
        ),
        label(
            c,
            'Re-fetch parameters needed to compute gradients',
            rightX + 26,
            146,
            panelW - 52,
            16,
            13,
            muted,
        ),

        VectorArrow({
            x1: rightX + panelW / 2,
            y1: 172,
            x2: rightX + panelW / 2,
            y2: 196,
            color: purple,
            strokeWidth: 1.5,
            arrowSize: 4,
        }),

        // Step 5: Backward Compute
        SvgFrame({
            c,
            x: rightX + 16,
            y: 198,
            width: panelW - 32,
            height: 52,
            rx: 6,
            stroke: green,
            strokeWidth: 1,
            fill: theme === 'dark' ? 'rgba(63, 185, 80, 0.12)' : 'rgba(26, 127, 55, 0.08)',
        }),
        label(
            c,
            '5. Backward Compute: dX_l, dW_l',
            rightX + 26,
            206,
            panelW - 52,
            18,
            15,
            c.textPrimary,
            700,
        ),
        label(
            c,
            'Compute activation grad dX_l and weight grad dW_l',
            rightX + 26,
            226,
            panelW - 52,
            16,
            13,
            muted,
        ),

        VectorArrow({
            x1: rightX + panelW / 2,
            y1: 252,
            x2: rightX + panelW / 2,
            y2: 276,
            color: purple,
            strokeWidth: 1.5,
            arrowSize: 4,
        }),

        // Step 6: Reduce-Scatter
        SvgFrame({
            c,
            x: rightX + 16,
            y: 278,
            width: panelW - 32,
            height: 52,
            rx: 6,
            stroke: purple,
            strokeWidth: 1,
            fill: theme === 'dark' ? 'rgba(163, 113, 247, 0.12)' : 'rgba(130, 80, 223, 0.08)',
        }),
        label(
            c,
            '6. Reduce-Scatter dW_l & Release W_l',
            rightX + 26,
            286,
            panelW - 52,
            18,
            15,
            c.textPrimary,
            700,
        ),
        label(
            c,
            'Send reduced gradient slice to owners; free W_l',
            rightX + 26,
            306,
            panelW - 52,
            16,
            13,
            muted,
        ),

        // Bottom panel: Accumulation boundary update
        SvgFrame({
            c,
            x: 35,
            y: 395,
            width: 790,
            height: 75,
            rx: 8,
            stroke: green,
            strokeWidth: 1.5,
            fill: theme === 'dark' ? 'rgba(63, 185, 80, 0.08)' : 'rgba(26, 127, 55, 0.05)',
        }),
        label(
            c,
            'Accumulation Boundary (microstep == gradient_accumulation_steps)',
            52,
            406,
            750,
            20,
            16,
            green,
            700,
        ),
        label(
            c,
            'Each rank updates only its locally owned FP32 master parameters using local FP32 Adam moment slices (m, v).',
            52,
            430,
            750,
            18,
            14,
            c.textPrimary,
            500,
        ),
    ])
}
