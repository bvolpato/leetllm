import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 860
export const height = 400
export const alt =
    'Side-by-side ROC staircase and pairwise positive-versus-negative ranking matrix. Left: ROC curve with shaded area (AUC = 0.8125) and color-linked callouts at thresholds t = 0.80, 0.50, and 0.20. Right: 4x4 score-pair grid where positives outrank negatives in 13 of 16 pairs (13/16 = 0.8125).'

const ROC: readonly (readonly [number, number])[] = [
    [0, 0],
    [0, 0.25],
    [0, 0.5],
    [0.25, 0.5],
    [0.25, 0.75],
    [0.5, 0.75],
    [0.5, 1],
    [0.75, 1],
    [1, 1],
]

const POSITIVES = [0.244, 0.595, 0.971, 0.99]
const NEGATIVES = [0.061, 0.169, 0.325, 0.624]

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const warm = fig.tone('warm')
    const green = fig.tone('green')
    const red = fig.tone('critical')
    const isLight = theme === 'light'

    // Left: ROC staircase with shaded AUC and color-linked t = 0.80 / 0.50 / 0.20 callouts
    fig.text(64, 22, 'ROC staircase (AUC = 0.8125)', { size: 15, weight: 700 })

    const plot = fig.plot(
        { x: 64, y: 56, width: 320, height: 274 },
        { x: [-0.04, 1.05], y: [-0.04, 1.06] },
    )

    // Subtle shaded area under ROC curve
    plot.fillArea(ROC, {
        baseline: 0,
        fill: blue,
        fillOpacity: isLight ? 0.1 : 0.14,
    })

    plot.axes({
        xTicks: [0, 0.25, 0.5, 0.75, 1.0],
        yTicks: [0, 0.25, 0.5, 0.75, 1.0],
        xFormat: (v) => v.toFixed(2),
        yFormat: (v) => v.toFixed(2),
        xLabel: 'False Positive Rate (FPR)',
        yLabel: 'True Positive Rate (TPR)',
        grid: true,
        labelSize: 12,
    })

    // Random baseline diagonal
    fig.line(plot.px(0), plot.py(0), plot.px(1), plot.py(1), {
        color: c.textMuted,
        width: 1.5,
        dash: '5 4',
    })

    // ROC staircase line
    plot.curve(ROC, { color: blue, width: 2.8 })

    // Color-linked threshold checkpoints + crisp callouts cleanly clear of diagonal
    const checkpoints = [
        {
            t: 't = 0.80',
            fpr: 0,
            tpr: 0.5,
            tone: blue,
            to: [0.16, 0.43] as const,
            align: 'left' as const,
        },
        {
            t: 't = 0.50',
            fpr: 0.25,
            tpr: 0.75,
            tone: warm,
            to: [0.4, 0.67] as const,
            align: 'left' as const,
        },
        {
            t: 't = 0.20',
            fpr: 0.5,
            tpr: 1.0,
            tone: green,
            to: [0.64, 0.91] as const,
            align: 'left' as const,
        },
    ]
    for (const cp of checkpoints) {
        plot.point(cp.fpr, cp.tpr, { color: cp.tone, r: 6.5 })
        fig.callout(
            [plot.px(cp.fpr) + 6, plot.py(cp.tpr) + 4],
            [plot.px(cp.to[0]), plot.py(cp.to[1])],
            cp.t,
            {
                color: cp.tone,
                labelColor: cp.tone,
                align: cp.align,
                size: 13,
                weight: 700,
                mono: true,
                bend: 0.14,
            },
        )
    }

    // Divider
    fig.line(418, 28, 418, 368, { color: c.borderSubtle, width: 1 })

    // Right: 4x4 Pairwise Ranking Matrix (positives vs negatives)
    fig.text(460, 22, 'Pairwise ranking grid (13 / 16 wins)', { size: 15, weight: 700 })

    const matX = 524
    const matY = 92
    const cellW = 68
    const cellH = 50
    const gap = 6

    // Axis titles for matrix
    fig.text(matX + (4 * cellW + 3 * gap) / 2, 54, 'Negative response score (y = 0) ->', {
        size: 12,
        weight: 600,
        color: blue,
        align: 'center',
    })
    fig.text(matX - 10, 74, 'Pos (y=1)', {
        size: 11,
        weight: 700,
        color: green,
        align: 'right',
    })

    // Column headers (negatives)
    NEGATIVES.forEach((neg, j) => {
        fig.text(matX + j * (cellW + gap) + cellW / 2, 74, neg.toFixed(2), {
            size: 13,
            weight: 700,
            color: blue,
            align: 'center',
            mono: true,
        })
    })

    // Row headers + cells
    POSITIVES.forEach((pos, i) => {
        const y = matY + i * (cellH + gap)
        fig.text(matX - 10, y + cellH / 2, pos.toFixed(2), {
            size: 13,
            weight: 700,
            color: green,
            align: 'right',
            mono: true,
        })
        NEGATIVES.forEach((neg, j) => {
            const x = matX + j * (cellW + gap)
            const win = pos > neg
            const tone = win ? green : red
            fig.rect(x, y, cellW, cellH, {
                fill: tint(tone, c.bg, win ? (isLight ? 0.2 : 0.3) : isLight ? 0.16 : 0.24),
                stroke: tone,
                strokeWidth: win ? 1.4 : 1.5,
                radius: 6,
            })
            fig.text(x + cellW / 2, y + cellH / 2, win ? '✓' : '×', {
                size: 19,
                weight: 700,
                color: tone,
                align: 'center',
            })
        })
    })

    // Footer legend + exact equivalence equation
    const footY = matY + 4 * (cellH + gap) + 20
    fig.text(matX, footY, '✓ pos > neg (13)   ·   × neg > pos (3)', {
        size: 12,
        color: c.textSecondary,
    })
    fig.text(matX + 4 * cellW + 3 * gap, footY + 26, 'AUC = 13 / 16 = 0.8125', {
        size: 15,
        weight: 700,
        color: green,
        align: 'right',
        mono: true,
    })

    return fig.render()
}

export default create
