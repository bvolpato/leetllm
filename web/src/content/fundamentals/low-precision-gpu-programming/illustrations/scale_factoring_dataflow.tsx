import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 450
export const alt =
    'FP8 scale factoring dataflow. Top five-stage pipeline moves X and W through quantization (Q, S), packed storage, FP8 MMA with FP32 accumulation, and epilogue rescaling plus BF16 cast. Bottom left shows row/column scales factoring cleanly outside the K-sum: Y_ij = S_{X,i} * S_{W,j} * sum_k q_{X,ik} q_{W,kj}. Bottom right shows K-varying block scales staying inside the contraction: block 0 (5 * 2 = 10) plus block 1 (8 * 3 = 24) equals 34, whereas factoring 5 outside gives the wrong value 25.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const warm = fig.tone('warm')
    const green = fig.tone('green')
    const purple = fig.tone('purple')
    const red = fig.tone('critical')

    // --- Top: Clean 5-stage device pipeline ---
    fig.text(28, 20, 'FP8 scaled GEMM device pipeline', {
        size: 15,
        weight: 600,
        color: c.textPrimary,
    })

    const stages = [
        { x: 28, w: 108, head: 'Inputs', sub: 'X, W', tone: blue },
        { x: 162, w: 118, head: 'Quantize', sub: 'Q, S', tone: warm },
        { x: 306, w: 112, head: 'Pack', sub: 'Q + S', tone: green },
        { x: 444, w: 132, head: 'FP8 MMA', sub: 'FP32 acc', tone: purple },
        { x: 602, w: 130, head: 'Epilogue', sub: 'S_X·S_W → BF16', tone: blue },
    ]
    const sy = 42
    const sh = 48
    stages.forEach((s, i) => {
        fig.rect(s.x, sy, s.w, sh, {
            fill: tint(s.tone, c.bg, theme === 'light' ? 0.14 : 0.24),
            stroke: s.tone,
            strokeWidth: 1.5,
            radius: 7,
        })
        fig.text(s.x + s.w / 2, sy + 15, s.head, {
            size: 13,
            weight: 700,
            color: s.tone,
            align: 'center',
        })
        fig.text(s.x + s.w / 2, sy + 34, s.sub, {
            size: 12,
            color: c.textPrimary,
            align: 'center',
            mono: true,
        })
        if (i < stages.length - 1) {
            const next = stages[i + 1]!
            fig.arrow(s.x + s.w + 2, sy + sh / 2, next.x - 2, sy + sh / 2, {
                color: c.textMuted,
                width: 1.5,
                head: 5.5,
            })
        }
    })

    // Horizontal hairline divider
    fig.line(28, 114, 732, 114, { color: c.borderSubtle, width: 1 })

    // --- Lower left panel (Row / Col scales factor outside K) ---
    fig.text(28, 138, 'Row & col scales exit the K-sum', {
        size: 15,
        weight: 600,
        color: blue,
    })

    // Mini matrix X (2x3) with row i highlighted
    const xMatX = 48
    const xMatY = 186
    const cell = 26
    const gap = 4
    fig.text(xMatX + 43, xMatY - 14, 'X (row i)', {
        size: 12,
        weight: 600,
        color: blue,
        align: 'center',
    })
    for (let r = 0; r < 2; r++) {
        for (let k = 0; k < 3; k++) {
            const hl = r === 0
            fig.rect(xMatX + k * (cell + gap), xMatY + r * (cell + gap), cell, cell, {
                fill: hl
                    ? tint(blue, c.bg, theme === 'light' ? 0.28 : 0.4)
                    : tint(c.textMuted, c.bg, 0.14),
                stroke: hl ? blue : c.borderSubtle,
                strokeWidth: hl ? 1.5 : 0.75,
                radius: 4,
            })
        }
    }
    fig.math(xMatX + 43, xMatY + 72, 'S_{X,i}', { size: 14, color: blue, align: 'center' })

    fig.text(154, xMatY + 26, '×', {
        size: 18,
        weight: 700,
        color: c.textMuted,
        align: 'center',
    })

    // Mini matrix W (3x2) with col j highlighted
    const wMatX = 176
    const wMatY = 172
    fig.text(wMatX + 28, wMatY - 14, 'W (col j)', {
        size: 12,
        weight: 600,
        color: warm,
        align: 'center',
    })
    for (let k = 0; k < 3; k++) {
        for (let j = 0; j < 2; j++) {
            const hl = j === 1
            fig.rect(wMatX + j * (cell + gap), wMatY + k * (cell + gap), cell, cell, {
                fill: hl
                    ? tint(warm, c.bg, theme === 'light' ? 0.28 : 0.4)
                    : tint(c.textMuted, c.bg, 0.14),
                stroke: hl ? warm : c.borderSubtle,
                strokeWidth: hl ? 1.5 : 0.75,
                radius: 4,
            })
        }
    }
    fig.math(wMatX + 28, wMatY + 102, 'S_{W,j}', { size: 14, color: warm, align: 'center' })

    // Arrow to Y_ij
    fig.arrow(248, 214, 286, 214, { color: purple, width: 1.75, head: 6 })
    fig.rect(290, 192, 62, 44, {
        fill: tint(purple, c.bg, theme === 'light' ? 0.16 : 0.26),
        stroke: purple,
        strokeWidth: 1.75,
        radius: 7,
    })
    fig.math(321, 214, 'Y_{ij}', { size: 15, color: purple, align: 'center' })

    // Equation
    fig.math(194, 336, 'Y_{ij} = S_{X,i} S_{W,j} \\sum_{k} q_{X,ik}\\, q_{W,kj}', {
        size: 14,
        color: c.textPrimary,
        align: 'center',
    })
    fig.text(194, 386, 'Constant across k → multiply once in epilogue', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
    })

    // Vertical hairline divider
    fig.line(384, 130, 384, 428, { color: c.borderSubtle, width: 1 })

    // --- Lower right panel (K-Block scales stay inside K) ---
    fig.text(406, 138, 'K-block scales stay inside contraction', {
        size: 15,
        weight: 600,
        color: warm,
    })

    // Two K-block cards converging into exact sum 34
    const b0X = 408
    const b1X = 408
    const b0Y = 174
    const b1Y = 248
    const blkW = 166
    const blkH = 52

    fig.rect(b0X, b0Y, blkW, blkH, {
        fill: tint(blue, c.bg, theme === 'light' ? 0.14 : 0.24),
        stroke: blue,
        strokeWidth: 1.5,
        radius: 7,
    })
    fig.text(b0X + 12, b0Y + 16, 'Block 0 (scale 5)', { size: 12, weight: 600, color: blue })
    fig.text(b0X + 12, b0Y + 36, '5 × 2 = 10', {
        size: 14,
        weight: 700,
        color: c.textPrimary,
        mono: true,
    })

    fig.rect(b1X, b1Y, blkW, blkH, {
        fill: tint(warm, c.bg, theme === 'light' ? 0.14 : 0.24),
        stroke: warm,
        strokeWidth: 1.5,
        radius: 7,
    })
    fig.text(b1X + 12, b1Y + 16, 'Block 1 (scale 8)', { size: 12, weight: 600, color: warm })
    fig.text(b1X + 12, b1Y + 36, '8 × 3 = 24', {
        size: 14,
        weight: 700,
        color: c.textPrimary,
        mono: true,
    })

    // Converging arrows to exact sum box
    const sumX = 616
    const sumY = 208
    fig.arrow(b0X + blkW + 2, b0Y + blkH / 2, sumX - 4, sumY + 18, {
        color: blue,
        width: 1.75,
        head: 6,
    })
    fig.arrow(b1X + blkW + 2, b1Y + blkH / 2, sumX - 4, sumY + 38, {
        color: warm,
        width: 1.75,
        head: 6,
    })

    fig.rect(sumX, sumY, 114, 58, {
        fill: tint(green, c.bg, theme === 'light' ? 0.18 : 0.28),
        stroke: green,
        strokeWidth: 2,
        radius: 8,
    })
    fig.text(sumX + 57, sumY + 18, '10 + 24', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
        mono: true,
    })
    fig.text(sumX + 57, sumY + 39, '= 34 ✓', {
        size: 16,
        weight: 700,
        color: green,
        align: 'center',
        mono: true,
    })

    // Contrast strip showing wrong factored result
    fig.rect(408, 336, 322, 46, {
        fill: tint(red, c.bg, theme === 'light' ? 0.12 : 0.2),
        stroke: red,
        strokeWidth: 1.5,
        radius: 7,
    })
    fig.text(422, 359, 'Factoring 5 outside:', { size: 13, color: c.textPrimary })
    fig.text(716, 359, '5 × (2 + 3) = 25 ✗', {
        size: 14,
        weight: 700,
        color: red,
        align: 'right',
        mono: true,
    })

    fig.text(569, 404, 'Each block partial must be scaled before summing', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
    })

    return fig.render()
}

export default create
