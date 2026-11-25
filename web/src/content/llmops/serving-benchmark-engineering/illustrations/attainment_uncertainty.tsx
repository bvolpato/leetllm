import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 740
export const height = 350
export const alt =
    'Zoomed 85 to 100 percent plot of one-sided 95 percent Wilson lower confidence bounds against a dashed 95 percent floor. Only 200 of 200 passes (98.7 percent lower bound). Both 190 of 200 (95 percent observed, 91.8 percent lower bound) and 20 of 20 (100 percent observed, 88.1 percent lower bound) fall below the 95 percent threshold.'

const Z = 1.6448536269514715
function wilsonLowerPct(good: number, n: number): number {
    const p = good / n
    const lo =
        (p + (Z * Z) / (2 * n) - Z * Math.sqrt((p * (1 - p)) / n + (Z * Z) / (4 * n * n))) /
        (1 + (Z * Z) / n)
    return lo * 100
}

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const red = fig.tone('critical')

    fig.text(24, 20, 'One-sided 95% Wilson lower bounds vs 95% floor', {
        size: 16,
        weight: 700,
        color: c.textPrimary,
    })

    const plot = fig.plot(
        { x: 122, y: 58, width: 586, height: 222 },
        { x: [85, 100], y: [0, 3] },
    )

    // Subtle shaded PASS region [95%, 100%]
    fig.rect(plot.px(95), plot.area.y, plot.px(100) - plot.px(95), plot.area.height, {
        fill: green,
        opacity: 0.1,
    })

    plot.axes({
        xTicks: [85, 90, 95, 100],
        xFormat: (v) => `${v}%`,
        xLabel: 'Attainment rate (%, zoomed 85% to 100%)',
        grid: true,
        labelSize: 13.5,
    })

    // Vertical dashed 95% threshold line
    plot.vline(95, '95% floor', {
        color: blue,
        width: 1.8,
        dash: '5 4',
        labelPosition: 'top',
        labelOffset: 13,
        labelSize: 13.5,
        weight: 700,
    })

    const rows = [
        {
            y: 2.35,
            label: '200 / 200',
            status: 'PASS',
            obs: 100,
            low: wilsonLowerPct(200, 200),
            color: green,
        },
        {
            y: 1.45,
            label: '190 / 200',
            status: 'FAIL',
            obs: 95,
            low: wilsonLowerPct(190, 200),
            color: warm,
        },
        {
            y: 0.55,
            label: '20 / 20',
            status: 'FAIL',
            obs: 100,
            low: wilsonLowerPct(20, 20),
            color: red,
        },
    ]

    for (const r of rows) {
        const py = plot.py(r.y)
        const xLow = plot.px(r.low)
        const xObs = plot.px(r.obs)
        const xHigh = plot.px(100)

        // Row label on left
        fig.text(110, py - 8, r.label, {
            size: 14.5,
            weight: 700,
            color: c.textPrimary,
            align: 'right',
            mono: true,
        })
        fig.text(110, py + 11, r.status, {
            size: 12,
            weight: 700,
            color: r.color,
            align: 'right',
        })

        // Confidence interval bar from lower bound to 100%
        fig.rect(xLow, py - 5, xHigh - xLow, 10, {
            fill: tint(r.color, c.bg, 0.28),
            stroke: r.color,
            strokeWidth: 1.5,
            radius: 5,
        })

        // Vertical lower-bound cap tick
        fig.line(xLow, py - 12, xLow, py + 12, { color: r.color, width: 2.4 })
        // Observed rate marker dot
        fig.circle(xObs, py, 6, { fill: r.color, stroke: c.bg, width: 1.5 })

        // Crisp lower-bound value label to the left of the lower cap
        fig.text(xLow - 10, py, `${r.low.toFixed(1)}% lower`, {
            size: 13.5,
            weight: 700,
            color: r.color,
            align: 'right',
            mono: true,
        })

        // Observed value label cleanly above dot (avoid overlap with 95% line)
        if (r.obs === 95) {
            fig.text(xObs + 8, py - 18, '95% obs', {
                size: 12.5,
                weight: 600,
                color: c.textSecondary,
                mono: true,
            })
        } else {
            fig.text(xObs - 4, py - 18, '100% obs', {
                size: 12.5,
                weight: 600,
                color: c.textSecondary,
                align: 'right',
                mono: true,
            })
        }
    }

    return fig.render()
}

export default create('dark')
