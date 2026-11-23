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
    'Bias-free forward MLP with hidden dimension H=8, intermediate dimension I=16, and TP=4. Input X[1,8] is broadcast to all four TP ranks. Column parallel layer computes GeLU(X A_i) with A_i[8,4], then row parallel layer multiplies by B_i[4,8] yielding partial outputs Z_i[1,8]. All-reduce sums partial outputs into final replicated Z[1,8].'

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
    const stage1W = 160
    const stage2X = 225
    const stage2W = 270
    const stage3X = 525
    const stage3W = 300

    return renderBoard(c, [
        // Title & Subtitle
        label(
            c,
            'Tensor Parallel MLP Forward Pass (TP=4)',
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
            'Column-parallel linear layer (weights split by column) and row-parallel linear layer (weights split by row) with All-Reduce',
            35,
            46,
            790,
            20,
            15,
            muted,
            400,
        ),

        // Stage 1: Input Tensor X
        SvgFrame({
            c,
            x: leftX,
            y: 80,
            width: stage1W,
            height: 340,
            rx: 8,
            stroke: cyan,
            strokeWidth: 1.5,
            fill: theme === 'dark' ? 'rgba(57, 197, 207, 0.08)' : 'rgba(26, 127, 139, 0.05)',
        }),
        label(c, '1. Input Tensor', leftX + 12, 92, stage1W - 24, 20, 15, cyan, 700),
        label(
            c,
            'Shape: [1, H=8]',
            leftX + 12,
            116,
            stage1W - 24,
            18,
            13,
            c.textPrimary,
            600,
            'left',
            true,
        ),
        label(c, 'Replicated on all 4 ranks', leftX + 12, 140, stage1W - 24, 18, 12, muted),

        ...[0, 1, 2, 3].flatMap((i) => [
            SvgFrame({
                c,
                x: leftX + 14,
                y: 180 + i * 52,
                width: stage1W - 28,
                height: 42,
                rx: 5,
                stroke: cyan,
                strokeWidth: 1,
                fill: c.bgCard,
            }),
            label(
                c,
                `Rank ${i}: X [1, 8]`,
                leftX + 22,
                192 + i * 52,
                stage1W - 44,
                18,
                12,
                cyan,
                600,
                'center',
                true,
            ),
        ]),

        // Arrow Stage 1 -> Stage 2
        VectorArrow({
            x1: leftX + stage1W,
            y1: 250,
            x2: stage2X,
            y2: 250,
            color: blue,
            strokeWidth: 2,
            arrowSize: 4,
        }),

        // Stage 2: Column Parallel Linear
        SvgFrame({
            c,
            x: stage2X,
            y: 80,
            width: stage2W,
            height: 340,
            rx: 8,
            stroke: blue,
            strokeWidth: 1.5,
            fill: theme === 'dark' ? 'rgba(56, 139, 253, 0.08)' : 'rgba(9, 105, 218, 0.05)',
        }),
        label(c, '2. Column Parallel: A_i', stage2X + 14, 92, stage2W - 28, 20, 15, blue, 700),
        label(
            c,
            'Weights split by column: [8, 4]',
            stage2X + 14,
            116,
            stage2W - 28,
            18,
            13,
            c.textPrimary,
            600,
            'left',
            true,
        ),
        label(c, 'Compute: H_i = GeLU(X · A_i)', stage2X + 14, 140, stage2W - 28, 18, 12, muted),

        ...[0, 1, 2, 3].flatMap((i) => [
            SvgFrame({
                c,
                x: stage2X + 14,
                y: 180 + i * 52,
                width: stage2W - 28,
                height: 42,
                rx: 5,
                stroke: blue,
                strokeWidth: 1,
                fill: c.bgCard,
            }),
            label(
                c,
                `Rank ${i}: H_${i} = GeLU(X · A_${i})  [1, 4]`,
                stage2X + 22,
                192 + i * 52,
                stage2W - 44,
                18,
                12,
                blue,
                600,
                'center',
                true,
            ),
        ]),

        // Arrow Stage 2 -> Stage 3
        VectorArrow({
            x1: stage2X + stage2W,
            y1: 250,
            x2: stage3X,
            y2: 250,
            color: purple,
            strokeWidth: 2,
            arrowSize: 4,
        }),

        // Stage 3: Row Parallel Linear & All-Reduce
        SvgFrame({
            c,
            x: stage3X,
            y: 80,
            width: stage3W,
            height: 340,
            rx: 8,
            stroke: purple,
            strokeWidth: 1.5,
            fill: theme === 'dark' ? 'rgba(163, 113, 247, 0.08)' : 'rgba(130, 80, 223, 0.05)',
        }),
        label(
            c,
            '3. Row Parallel: B_i & All-Reduce',
            stage3X + 14,
            92,
            stage3W - 28,
            20,
            15,
            purple,
            700,
        ),
        label(
            c,
            'Weights split by row: B_i [4, 8]',
            stage3X + 14,
            116,
            stage3W - 28,
            18,
            13,
            c.textPrimary,
            600,
            'left',
            true,
        ),
        label(
            c,
            'Partial outputs: Z_i = H_i · B_i [1, 8]',
            stage3X + 14,
            140,
            stage3W - 28,
            18,
            12,
            muted,
        ),

        // Partial outputs
        ...[0, 1, 2, 3].flatMap((i) => [
            SvgFrame({
                c,
                x: stage3X + 14,
                y: 170 + i * 40,
                width: stage3W - 28,
                height: 32,
                rx: 4,
                stroke: purple,
                strokeWidth: 1,
                fill: c.bgCard,
            }),
            label(
                c,
                `Z_${i} = H_${i} · B_${i}  [1, 8]  (Rank ${i})`,
                stage3X + 22,
                178 + i * 40,
                stage3W - 44,
                16,
                11,
                purple,
                500,
                'center',
                true,
            ),
        ]),

        // All-Reduce Sum Box
        SvgFrame({
            c,
            x: stage3X + 14,
            y: 340,
            width: stage3W - 28,
            height: 65,
            rx: 6,
            stroke: green,
            strokeWidth: 2,
            fill: theme === 'dark' ? 'rgba(63, 185, 80, 0.15)' : 'rgba(26, 127, 55, 0.1)',
        }),
        label(
            c,
            'All-Reduce (Sum): Z = Σ Z_i',
            stage3X + 22,
            350,
            stage3W - 44,
            20,
            13,
            green,
            700,
            'center',
        ),
        label(
            c,
            'Final Output: Z [1, 8] on all ranks',
            stage3X + 22,
            374,
            stage3W - 44,
            18,
            12,
            green,
            600,
            'center',
            true,
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
        label(c, 'Forward: 1 All-Reduce (Sum)', leftX + 20, 447, 240, 20, 12, blue, 600),
        label(
            c,
            'Backward: 1 All-Reduce (Input Gradients)',
            leftX + 270,
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
            'Total TP Communication: 2 Collectives / Layer',
            leftX + 530,
            447,
            240,
            20,
            12,
            green,
            600,
            'right',
        ),
    ])
}

export default create()
