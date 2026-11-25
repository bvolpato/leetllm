import { getReadableTextColor, type ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 390
export const alt =
    'Eight-pair calibration confusion matrix with human labels in rows and judge labels in columns, paired with an agreement summary bar chart. Six diagonal matches appear in calm teal-green cells (counts 3, 2, 1) and two off-diagonal disagreements appear in warm amber cells (counts 1, 1). Observed agreement is 0.750, expected chance agreement is 0.359, and Cohen kappa is 0.610.'

const LABELS = ['compact', 'stepwise', 'tie'] as const
const MATRIX = [
    [3, 0, 0],
    [1, 2, 0],
    [0, 1, 1],
] as const

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const muted = c.textMuted

    // Left panel: Confusion Matrix (custom semantic diagonal vs off-diagonal coloring)
    fig.text(20, 20, 'Human vs. judge counts (N = 8)', {
        size: 16,
        weight: 700,
        color: c.textPrimary,
    })

    const gridX = 112
    const gridY = 86
    const cellW = 76
    const cellH = 68
    const gap = 6

    fig.text(gridX + (cellW * 3 + gap * 2) / 2, 50, 'Judge label', {
        size: 13.5,
        weight: 600,
        color: c.textSecondary,
        align: 'center',
    })
    fig.text(20, 68, 'Human', {
        size: 13.5,
        weight: 600,
        color: c.textSecondary,
    })

    // Column headers
    for (let j = 0; j < 3; j++) {
        fig.text(gridX + j * (cellW + gap) + cellW / 2, gridY - 14, LABELS[j]!, {
            size: 13.5,
            weight: 600,
            color: c.textPrimary,
            align: 'center',
            mono: true,
        })
    }

    // Row headers + cells
    for (let i = 0; i < 3; i++) {
        const y = gridY + i * (cellH + gap)
        fig.text(gridX - 10, y + cellH / 2, LABELS[i]!, {
            size: 13.5,
            weight: 600,
            color: c.textPrimary,
            align: 'right',
            mono: true,
        })
        for (let j = 0; j < 3; j++) {
            const x = gridX + j * (cellW + gap)
            const count = MATRIX[i]![j]!
            const isDiag = i === j

            let fill: string
            let stroke: string
            let strokeWidth = 1
            if (count === 0) {
                fill = tint(c.textMuted, c.bg, 0.06)
                stroke = c.borderSubtle
            } else if (isDiag) {
                const strength = 0.2 + (count / 3) * 0.45
                fill = tint(green, c.bg, strength)
                stroke = green
                strokeWidth = 1.6
            } else {
                fill = tint(warm, c.bg, 0.26)
                stroke = warm
                strokeWidth = 1.6
            }

            fig.rect(x, y, cellW, cellH, {
                fill,
                stroke,
                strokeWidth,
                radius: 6,
            })

            const ink =
                count === 0 ? c.textMuted : getReadableTextColor(fill, c, c.bg)
            fig.text(x + cellW / 2, y + cellH / 2, String(count), {
                size: 20,
                weight: count === 0 ? 400 : 700,
                color: ink,
                align: 'center',
                mono: true,
            })
        }
    }

    // Compact legend under matrix
    const legY = gridY + 3 * cellH + 2 * gap + 24
    fig.rect(gridX, legY - 7, 14, 14, {
        fill: tint(green, c.bg, 0.45),
        stroke: green,
        strokeWidth: 1.4,
        radius: 3,
    })
    fig.text(gridX + 22, legY, 'Match (6)', { size: 13.5, weight: 600, color: c.textSecondary })

    fig.rect(gridX + 116, legY - 7, 14, 14, {
        fill: tint(warm, c.bg, 0.28),
        stroke: warm,
        strokeWidth: 1.4,
        radius: 3,
    })
    fig.text(gridX + 138, legY, 'Disagree (2)', {
        size: 13.5,
        weight: 600,
        color: c.textSecondary,
    })

    // Right panel: Agreement summary bar chart on clean 0..1 round ticks
    fig.text(448, 20, 'Observed, chance, and kappa', {
        size: 16,
        weight: 700,
        color: c.textPrimary,
    })

    const plot = fig.plot({ x: 448, y: 74, width: 292, height: 236 }, { x: [0, 3], y: [0, 1] })
    plot.axes({
        yTicks: [0, 0.25, 0.5, 0.75, 1],
        yFormat: (v) => (v === 0 ? '0' : v === 1 ? '1.0' : v.toFixed(2)),
        yLabel: 'Score',
        grid: true,
        labelSize: 13,
    })

    const metrics = [
        { cx: 0.5, label: 'Observed', tex: 'p_o = 6/8', value: 0.75, text: '0.750', color: blue },
        { cx: 1.5, label: 'Chance', tex: 'p_e = 23/64', value: 0.359, text: '0.359', color: muted },
        { cx: 2.5, label: 'Kappa', tex: '\\kappa = 25/41', value: 0.61, text: '0.610', color: green },
    ]
    const barW = 54
    for (const m of metrics) {
        const x = plot.px(m.cx) - barW / 2
        const yTop = plot.py(m.value)
        const h = plot.bottom - yTop
        fig.rect(x, yTop, barW, h, {
            fill: tint(m.color, c.bg, m.color === muted ? 0.24 : 0.3),
            stroke: m.color,
            strokeWidth: 1.6,
            radius: 5,
        })
        fig.text(plot.px(m.cx), yTop - 13, m.text, {
            size: 14.5,
            weight: 700,
            color: m.color === muted ? c.textSecondary : m.color,
            align: 'center',
            mono: true,
        })
        fig.text(plot.px(m.cx), plot.bottom + 18, m.label, {
            size: 13.5,
            weight: 700,
            color: c.textPrimary,
            align: 'center',
        })
        fig.math(plot.px(m.cx), plot.bottom + 39, m.tex, {
            size: 13.5,
            color: c.textSecondary,
            align: 'center',
        })
    }

    return fig.render()
}

export default create('dark')
