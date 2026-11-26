import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 840
export const height = 420
export const alt =
    'Bias-free forward MLP with hidden dimension H=8, intermediate dimension I=16, and TP=4. Input X[1,8] is broadcast to all four TP ranks. Column parallel layer computes GeLU(X A_i) with A_i[8,4], then row parallel layer multiplies by B_i[4,8] yielding partial outputs Z_i[1,8]. All-reduce sums partial outputs into final replicated Z[1,8].'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const cyan = fig.tone('cyan')
    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const green = fig.tone('green')
    const muted = c.textSecondary

    // Column headers (top, aligned over the 4 stages)
    const col1X = 86
    const col1W = 104
    const col2X = 224
    const col2W = 192
    const col3X = 450
    const col3W = 178
    const col4X = 674
    const col4W = 144

    fig.text(col1X + col1W / 2, 22, 'Replicated Input', {
        size: 14,
        weight: 700,
        color: cyan,
        align: 'center',
        width: 130,
    })
    fig.text(col1X + col1W / 2, 42, 'X [1, 8]', {
        size: 13,
        color: muted,
        align: 'center',
        mono: true,
        width: 120,
    })

    fig.text(col2X + col2W / 2, 22, 'Column-Parallel + GeLU', {
        size: 14,
        weight: 700,
        color: blue,
        align: 'center',
        width: 200,
    })
    fig.text(col2X + col2W / 2, 42, 'A_i [8, 4] -> Y_i [1, 4]', {
        size: 13,
        color: muted,
        align: 'center',
        mono: true,
        width: 200,
    })

    fig.text(col3X + col3W / 2, 22, 'Row-Parallel Shard', {
        size: 14,
        weight: 700,
        color: purple,
        align: 'center',
        width: 184,
    })
    fig.text(col3X + col3W / 2, 42, 'B_i [4,8] -> Z_i [1,8]', {
        size: 13,
        color: muted,
        align: 'center',
        mono: true,
        width: 210,
    })

    fig.text(col4X + col4W / 2, 22, 'All-Reduce (Sum)', {
        size: 14,
        weight: 700,
        color: green,
        align: 'center',
        width: 150,
    })
    fig.text(col4X + col4W / 2, 42, 'Z [1, 8] all ranks', {
        size: 13,
        color: muted,
        align: 'center',
        mono: true,
        width: 150,
    })

    // 4 GPU rank swimlanes
    const startY = 66
    const laneH = 54
    const laneGap = 16

    for (let i = 0; i < 4; i++) {
        const y = startY + i * (laneH + laneGap)
        const midY = y + laneH / 2

        // Rank label on far left
        fig.text(20, midY, `Rank ${i}`, {
            size: 14,
            weight: 700,
            color: c.textPrimary,
        })

        // Stage 1: Replicated X
        fig.rect(col1X, y + 6, col1W, laneH - 12, {
            fill: tint(cyan, c.bg, 0.12),
            stroke: cyan,
            strokeWidth: 1.25,
            radius: 6,
        })
        fig.text(col1X + col1W / 2, midY, 'X [1, 8]', {
            size: 13,
            weight: 600,
            color: cyan,
            align: 'center',
            mono: true,
            width: col1W - 8,
        })

        // Arrow 1 -> 2
        fig.arrow(col1X + col1W, midY, col2X - 3, midY, {
            color: blue,
            width: 1.75,
            head: 5,
        })

        // Stage 2: Column-parallel + local GeLU
        fig.rect(col2X, y + 4, col2W, laneH - 8, {
            fill: tint(blue, c.bg, 0.11),
            stroke: blue,
            strokeWidth: 1.5,
            radius: 6,
        })
        fig.math(col2X + col2W / 2, midY, `Y_${i} = \\mathrm{GeLU}(X A_${i})`, {
            size: 14,
            color: c.textPrimary,
            align: 'center',
        })

        // Arrow 2 -> 3 (local, no comm)
        fig.arrow(col2X + col2W, midY, col3X - 3, midY, {
            color: purple,
            width: 1.75,
            head: 5,
        })

        // Stage 3: Row-parallel partial output
        fig.rect(col3X, y + 4, col3W, laneH - 8, {
            fill: tint(purple, c.bg, 0.11),
            stroke: purple,
            strokeWidth: 1.5,
            radius: 6,
        })
        fig.math(col3X + col3W / 2, midY, `Z_${i} = Y_${i} B_${i}`, {
            size: 14,
            color: c.textPrimary,
            align: 'center',
        })

        // Arrow 3 -> 4 (converging into All-Reduce)
        fig.arrow(col3X + col3W, midY, col4X - 4, midY, {
            color: green,
            width: 1.75,
            head: 5,
        })
    }

    // Stage 4: Single unified All-Reduce vertical collective block spanning all 4 lanes
    const allReduceH = 4 * laneH + 3 * laneGap - 8
    fig.rect(col4X, startY + 4, col4W, allReduceH, {
        fill: tint(green, c.bg, 0.13),
        stroke: green,
        strokeWidth: 2,
        radius: 10,
    })
    fig.text(col4X + col4W / 2, startY + 46, 'All-Reduce', {
        size: 15,
        weight: 700,
        color: green,
        align: 'center',
        width: col4W - 12,
    })
    fig.text(col4X + col4W / 2, startY + 70, 'Sum across TP=4', {
        size: 12,
        color: muted,
        align: 'center',
        width: col4W - 12,
    })
    fig.math(col4X + col4W / 2, startY + 132, 'Z = \\sum_{i=0}^{3} Z_i', {
        size: 16,
        color: c.textPrimary,
        align: 'center',
    })
    fig.rect(col4X + 16, startY + 186, col4W - 32, 48, {
        fill: tint(green, c.bg, 0.22),
        stroke: green,
        strokeWidth: 1.25,
        radius: 6,
    })
    fig.text(col4X + col4W / 2, startY + 202, 'Z [1, 8]', {
        size: 14,
        weight: 700,
        color: green,
        align: 'center',
        mono: true,
        width: col4W - 36,
    })
    fig.text(col4X + col4W / 2, startY + 221, 'Replicated', {
        size: 12,
        color: c.textPrimary,
        align: 'center',
        width: col4W - 36,
    })

    // Bottom frameless annotations
    fig.line(20, 358, 818, 358, { color: c.borderSubtle, width: 1 })
    fig.text(20, 386, 'H = 8, I = 16, TP = 4', {
        size: 13,
        weight: 700,
        color: c.textPrimary,
        mono: true,
    })
    fig.text(420, 386, 'Local GeLU needs 0 communication', {
        size: 13,
        weight: 600,
        color: blue,
        align: 'center',
        width: 280,
    })
    fig.text(818, 386, '1 All-Reduce forward (1 backward)', {
        size: 13,
        weight: 600,
        color: green,
        align: 'right',
    })

    return fig.render()
}

export default create()
