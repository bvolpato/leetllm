import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 840
export const height = 430
export const alt =
    'Token routing and combine lifecycle in DeepEP: four tokens route across four experts partitioned between Rank 0 (E0, E1) and Rank 1 (E2, E3). Token a selects E0 with weight 0.70 (local on Rank 0) and E3 with weight 0.30 (remote RDMA). Combine sums weighted expert outputs back into source position a as 1.90.'

const GATE: readonly (readonly number[])[] = [
    [0.7, 0, 0, 0.3],
    [0, 0.6, 0.4, 0],
    [0, 0.55, 0, 0.45],
    [0.25, 0, 0.75, 0],
]

const TOKENS = [
    { name: 'a', rank: 'R0' },
    { name: 'b', rank: 'R0' },
    { name: 'c', rank: 'R1' },
    { name: 'd', rank: 'R1' },
] as const

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const cyan = fig.tone('cyan')
    const green = fig.tone('green')
    const purple = fig.tone('purple')
    const muted = c.textSecondary

    // --- Left Zone: Top-2 Routing Gate Matrix ---
    fig.text(24, 24, 'Top-2 Routing Gate Matrix', { size: 15, weight: 700, color: c.textPrimary })
    fig.text(24, 46, 'Tokens a, b on Rank 0; c, d on Rank 1', { size: 13, color: muted })

    const gridX = 96
    const gridY = 114
    const cellW = 64
    const cellH = 44
    const gapX = 8
    const gapY = 10

    // Rank group spans above expert columns
    const r0W = cellW * 2 + gapX
    const r1X = gridX + 2 * (cellW + gapX)
    fig.line(gridX, 74, gridX + r0W, 74, { color: blue, width: 2 })
    fig.text(gridX + r0W / 2, 62, 'Rank 0', {
        size: 13,
        weight: 600,
        color: blue,
        align: 'center',
    })
    fig.line(r1X, 74, r1X + r0W, 74, { color: green, width: 2 })
    fig.text(r1X + r0W / 2, 62, 'Rank 1', {
        size: 13,
        weight: 600,
        color: green,
        align: 'center',
    })

    // Expert column headers
    for (let col = 0; col < 4; col++) {
        const cx = gridX + col * (cellW + gapX) + cellW / 2
        fig.text(cx, 96, `E${col}`, {
            size: 14,
            weight: 700,
            color: col < 2 ? blue : green,
            align: 'center',
            mono: true,
        })
    }

    // Matrix rows & cells
    GATE.forEach((row, r) => {
        const tok = TOKENS[r]!
        const y = gridY + r * (cellH + gapY)
        const isRowA = r === 0

        if (isRowA) {
            fig.rect(20, y - 4, 360, cellH + 8, {
                fill: tint(cyan, c.bg, 0.09),
                stroke: cyan,
                strokeWidth: 1.25,
                radius: 7,
            })
        }

        fig.text(28, y + cellH / 2, `Tok ${tok.name}`, {
            size: 14,
            weight: isRowA ? 700 : 600,
            color: isRowA ? cyan : c.textPrimary,
        })
        fig.text(84, y + cellH / 2, tok.rank, {
            size: 12,
            weight: 500,
            color: r < 2 ? blue : green,
            align: 'right',
            mono: true,
        })

        row.forEach((w, col) => {
            const x = gridX + col * (cellW + gapX)
            const activeA = isRowA && w > 0
            const tone = col < 2 ? blue : green
            fig.rect(x, y, cellW, cellH, {
                fill: activeA
                    ? tint(tone, c.bg, 0.24)
                    : w > 0
                      ? tint(tone, c.bg, 0.09)
                      : tint(c.textMuted, c.bg, 0.04),
                stroke: activeA ? tone : w > 0 ? tint(tone, c.bg, 0.45) : c.borderSubtle,
                strokeWidth: activeA ? 1.75 : 1,
                radius: 5,
            })
            fig.text(x + cellW / 2, y + cellH / 2, w > 0 ? w.toFixed(2) : '0', {
                size: 14,
                weight: activeA ? 700 : w > 0 ? 600 : 400,
                color: w > 0 ? tone : c.textMuted,
                align: 'center',
                mono: true,
                width: cellW,
            })
        })
    })

    // Footnote below matrix
    fig.text(24, 356, 'Token a routes to:', { size: 13, weight: 600, color: cyan })
    fig.text(24, 378, 'E0 (Rank 0, w = 0.70, local)', { size: 13, color: blue, mono: true })
    fig.text(24, 400, 'E3 (Rank 1, w = 0.30, remote)', { size: 13, color: green, mono: true })

    // Subtle vertical divider
    fig.line(402, 20, 402, 410, { color: c.borderSubtle, width: 1 })

    // --- Right Zone: Dispatch, GEMM, Combine for Token a ---
    const rx = 424
    const rCenter = 620
    fig.text(rx, 24, 'Dispatch, Expert GEMM, and Combine (Token a)', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
    })

    // Source token pill
    fig.rect(rCenter - 86, 54, 172, 38, {
        fill: tint(cyan, c.bg, 0.14),
        stroke: cyan,
        strokeWidth: 1.75,
        radius: 19,
    })
    fig.text(rCenter, 73, 'Token a (Rank 0)', {
        size: 14,
        weight: 700,
        color: cyan,
        align: 'center',
        width: 164,
    })

    // Dispatch arrows
    const leftBoxX = 426
    const rightBoxX = 632
    const boxW = 184
    const boxY = 148
    const boxH = 114

    fig.arrow(rCenter - 44, 92, leftBoxX + boxW / 2, boxY - 3, {
        color: blue,
        width: 2,
        head: 6,
    })
    fig.text(468, 114, 'Local', {
        size: 13,
        weight: 600,
        color: blue,
        align: 'right',
    })

    fig.arrow(rCenter + 44, 92, rightBoxX + boxW / 2, boxY - 3, {
        color: green,
        width: 2,
        head: 6,
        dash: '5 4',
    })
    fig.text(772, 114, 'RDMA', {
        size: 13,
        weight: 600,
        color: green,
        align: 'left',
    })

    // Expert 0 (local)
    fig.rect(leftBoxX, boxY, boxW, boxH, {
        fill: tint(blue, c.bg, 0.1),
        stroke: blue,
        strokeWidth: 1.5,
        radius: 8,
    })
    fig.text(leftBoxX + 12, boxY + 20, 'E0 · Rank 0', { size: 14, weight: 700, color: blue })
    fig.text(leftBoxX + 12, boxY + 42, 'Local GPU (HBM)', { size: 13, color: muted })
    fig.math(leftBoxX + 12, boxY + 70, 'y_0 = 1.0', { size: 14, color: c.textPrimary })
    fig.math(leftBoxX + 12, boxY + 95, '0.70 \\times 1.0 = 0.70', { size: 14, color: blue })

    // Expert 3 (remote)
    fig.rect(rightBoxX, boxY, boxW, boxH, {
        fill: tint(green, c.bg, 0.1),
        stroke: green,
        strokeWidth: 1.5,
        radius: 8,
    })
    fig.text(rightBoxX + 12, boxY + 20, 'E3 · Rank 1', { size: 14, weight: 700, color: green })
    fig.text(rightBoxX + 12, boxY + 42, 'Remote RDMA', { size: 13, color: muted })
    fig.math(rightBoxX + 12, boxY + 70, 'y_3 = 4.0', { size: 14, color: c.textPrimary })
    fig.math(rightBoxX + 12, boxY + 95, '0.30 \\times 4.0 = 1.20', { size: 14, color: green })

    // Combine arrows (straight vertical drops into combine block, leaving a wide 206px corridor for the label)
    const combY = 318
    fig.arrow(leftBoxX + boxW / 2, boxY + boxH, leftBoxX + boxW / 2, combY - 3, {
        color: purple,
        width: 2,
        head: 6,
    })
    fig.arrow(rightBoxX + boxW / 2, boxY + boxH, rightBoxX + boxW / 2, combY - 3, {
        color: purple,
        width: 2,
        head: 6,
        dash: '5 4',
    })
    fig.text(rCenter, 290, 'combine (EPHandle)', {
        size: 13,
        weight: 600,
        color: purple,
        align: 'center',
        width: 170,
    })

    // Combine output block
    fig.rect(456, combY, 328, 86, {
        fill: tint(purple, c.bg, 0.12),
        stroke: purple,
        strokeWidth: 1.75,
        radius: 8,
    })
    fig.text(rCenter, combY + 22, 'Restored Source Row a (Rank 0)', {
        size: 14,
        weight: 700,
        color: purple,
        align: 'center',
        width: 310,
    })
    fig.math(rCenter, combY + 56, '0.70 + 1.20 = 1.90 \\;\\to\\; (1.90,\\, 0.0)', {
        size: 15,
        color: c.textPrimary,
        align: 'center',
    })

    return fig.render()
}

export default create()
