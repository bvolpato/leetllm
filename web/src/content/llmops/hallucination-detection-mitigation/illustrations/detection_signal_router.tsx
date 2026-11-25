import type { ThemeMode } from 'vizmatic'
import { Figure } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 740
export const height = 425
export const alt =
    'Smooth risk-coverage curves on a 0 to 30 percent unsupported-claim risk scale compare three verification signals from 40 to 92 percent answer coverage. At 70 percent coverage, calibrated NLI holds risk at 5 percent compared to 12 percent for SelfCheck and 19 percent for token probability alone.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const warm = fig.tone('warm')
    const muted = c.textSecondary

    fig.text(64, 20, 'Risk-coverage curves across verification signals', {
        size: 16.5,
        weight: 700,
        color: c.textPrimary,
    })

    const plot = fig.plot(
        { x: 64, y: 58, width: 518, height: 304 },
        { x: [36, 94], y: [0, 30] },
    )
    plot.axes({
        xTicks: [40, 50, 60, 70, 80, 90],
        xFormat: (v) => `${v}%`,
        yTicks: [0, 10, 20, 30],
        yFormat: (v) => `${v}%`,
        xLabel: 'Answer coverage (%)',
        yLabel: 'Unsupported-claim risk (%)',
        grid: true,
        labelSize: 13.5,
    })

    const tokenProb: [number, number][] = [
        [40, 11],
        [55, 14],
        [70, 19],
        [85, 23],
        [92, 26],
    ]
    const selfCheck: [number, number][] = [
        [40, 6],
        [55, 8],
        [70, 12],
        [85, 17],
        [92, 21],
    ]
    const nli: [number, number][] = [
        [40, 2],
        [55, 3],
        [70, 5],
        [85, 10],
        [92, 15],
    ]

    // Vertical reference at 70% coverage
    plot.vline(70, '70% coverage', {
        color: c.textMuted,
        width: 1.25,
        dash: '4 4',
        labelPosition: 'top',
        labelOffset: 12,
        labelSize: 12.5,
    })

    plot.fillArea(nli, { fill: blue, fillOpacity: 0.13, smooth: true })
    plot.smoothCurve(tokenProb, { color: muted, width: 2, dash: '6 4' })
    plot.smoothCurve(selfCheck, { color: warm, width: 2.2 })
    plot.smoothCurve(nli, { color: blue, width: 2.6 })

    for (const [x, y] of tokenProb) plot.point(x, y, { color: muted, r: 4 })
    for (const [x, y] of selfCheck) plot.point(x, y, { color: warm, r: 4 })
    for (const [x, y] of nli) plot.point(x, y, { color: blue, r: 4.5 })

    // Highlight key 70% coverage operating point on NLI curve
    plot.point(70, 5, { color: blue, r: 8.5, ring: true })
    fig.callout(
        [plot.px(70) + 6, plot.py(5) + 4],
        [plot.px(76), plot.py(2.2)],
        '5% risk at 70% cov',
        { color: blue, size: 13, weight: 700, bend: 0.16, align: 'left' },
    )

    // Direct right-margin series labels aligned cleanly to curve endpoints (x=92)
    const labelX = plot.px(92) + 12
    fig.text(labelX, plot.py(26), 'Token prob (26%)', {
        size: 13.5,
        weight: 600,
        color: muted,
    })
    fig.text(labelX, plot.py(21), 'SelfCheck (21%)', {
        size: 13.5,
        weight: 700,
        color: warm,
    })
    fig.text(labelX, plot.py(15), 'Calibrated NLI (15%)', {
        size: 13.5,
        weight: 700,
        color: blue,
    })

    return fig.render()
}

export default create('dark')
