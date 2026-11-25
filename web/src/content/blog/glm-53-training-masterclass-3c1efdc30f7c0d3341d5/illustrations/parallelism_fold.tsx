import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 800
export const height = 435
export const alt =
    'The same 64 learner ranks remain physically fixed while process-group overlays switch between attention layers and MoE layers. Attention uses an eight-by-eight TP8 by CP8 grid with optimizer shard size 8; MoE regroups all 64 ranks into one EP64 group holding 4 routed experts per rank with optimizer group size 1.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig

    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const purple = fig.tone('purple')
    const warm = fig.tone('warm')

    const cell = 24
    const gap = 4
    const gridPx = 8 * cell + 7 * gap // 220px
    const leftX = 94
    const rightX = 504
    const gridY = 104

    // Section titles
    fig.text(leftX + gridPx / 2, 24, 'Attention & Dense layers', {
        size: 16,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
    })
    fig.text(leftX + gridPx / 2, 46, 'TP8 (row) × CP8 (col) · opt group 8', {
        size: 13,
        color: c.textSecondary,
        align: 'center',
    })

    fig.text(rightX + gridPx / 2, 24, 'MoE Feed-Forward layers', {
        size: 16,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
    })
    fig.text(rightX + gridPx / 2, 46, 'EP64 · ETP1 · 4 experts/rank · opt group 1', {
        size: 13,
        color: c.textSecondary,
        align: 'center',
    })

    // Left 8x8 Grid: TP8 row (r=1) in blue, CP8 col (c=2) in green, intersection highlighted
    for (let r = 0; r < 8; r++) {
        for (let col = 0; col < 8; col++) {
            const x = leftX + col * (cell + gap)
            const y = gridY + r * (cell + gap)
            const isRow = r === 1
            const isCol = col === 2
            const isBoth = isRow && isCol

            let fill = tint(c.textMuted, c.bg, theme === 'light' ? 0.14 : 0.18)
            let stroke = c.border
            let sw = 1
            if (isBoth) {
                fill = warm
                stroke = warm
                sw = 1.75
            } else if (isRow) {
                fill = tint(blue, c.bg, theme === 'light' ? 0.58 : 0.65)
                stroke = blue
                sw = 1.4
            } else if (isCol) {
                fill = tint(green, c.bg, theme === 'light' ? 0.55 : 0.62)
                stroke = green
                sw = 1.4
            }

            fig.rect(x, y, cell, cell, { fill, stroke, strokeWidth: sw, radius: 4 })
        }
    }

    // Braces for TP8 row and CP8 column
    fig.brace(leftX, gridY - 6, leftX + gridPx, gridY - 6, 'TP8 matrix shard (8 ranks)', {
        side: -1,
        depth: 8,
        color: blue,
        labelColor: blue,
        labelSize: 12.5,
        labelGap: 13,
        weight: 600,
    })
    fig.brace(leftX - 10, gridY, leftX - 10, gridY + gridPx, '', {
        side: 1,
        depth: 8,
        color: green,
    })
    fig.text(leftX - 28, gridY + gridPx / 2 - 9, 'CP8', {
        size: 12.5,
        weight: 700,
        color: green,
        align: 'right',
    })
    fig.text(leftX - 28, gridY + gridPx / 2 + 10, 'ring', {
        size: 12,
        color: green,
        align: 'right',
    })

    // Center equivalence bridge ("Same 64 physical GPUs")
    const midX = (leftX + gridPx + rightX) / 2
    const midY = gridY + gridPx / 2
    fig.arrow(leftX + gridPx + 18, midY - 12, rightX - 18, midY - 12, {
        color: purple,
        width: 2,
        head: 7,
    })
    fig.arrow(rightX - 18, midY + 12, leftX + gridPx + 18, midY + 12, {
        color: blue,
        width: 2,
        head: 7,
    })
    fig.text(midX, midY - 34, 'Same 64', {
        size: 13.5,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
    })
    fig.text(midX, midY + 34, 'physical GPUs', {
        size: 12.5,
        color: c.textSecondary,
        align: 'center',
    })

    // Right 8x8 Grid: all 64 ranks in one EP64 expert-parallel group
    for (let r = 0; r < 8; r++) {
        for (let col = 0; col < 8; col++) {
            const x = rightX + col * (cell + gap)
            const y = gridY + r * (cell + gap)
            const isSameRank = r === 1 && col === 2
            fig.rect(x, y, cell, cell, {
                fill: isSameRank
                    ? warm
                    : tint(purple, c.bg, theme === 'light' ? 0.36 : 0.45),
                stroke: isSameRank ? warm : purple,
                strokeWidth: isSameRank ? 1.8 : 1.1,
                radius: 4,
            })
        }
    }

    fig.brace(rightX, gridY - 6, rightX + gridPx, gridY - 6, '1 EP64 group (256 routed experts)', {
        side: -1,
        depth: 8,
        color: purple,
        labelColor: purple,
        labelSize: 12.5,
        labelGap: 13,
        weight: 600,
    })

    // Bottom crisp takeaways under each view
    const footY = gridY + gridPx + 26
    fig.text(leftX + gridPx / 2, footY, 'Row = TP8 all-reduce · Col = CP8 ring', {
        size: 13,
        weight: 600,
        color: c.textPrimary,
        align: 'center',
    })
    fig.text(rightX + gridPx / 2, footY, 'All 64 ranks exchange tokens via all-to-all', {
        size: 13,
        weight: 600,
        color: c.textPrimary,
        align: 'center',
    })

    // Highlighted anchor dot explanation
    fig.rect(220, footY + 26, 14, 14, { fill: warm, radius: 3 })
    fig.text(242, footY + 33, 'Same physical GPU (rank 10) stays fixed; only collectives regroup', {
        size: 13,
        color: c.textSecondary,
    })

    return fig.render()
}

export default create('dark')
