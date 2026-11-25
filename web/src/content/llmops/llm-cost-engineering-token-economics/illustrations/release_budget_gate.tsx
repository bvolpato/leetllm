import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 780
export const height = 430
export const alt =
    'Left: monthly spend scenarios contrasted directly against a horizontal dashed $750 cap show Base ($717) staying under budget while +10% traffic ($780), ColdEval ($804), and ColdAll ($916) breach the cap. Right: the Rule of Three zero-defect 95 percent upper bound (3/n) drops smoothly from 3.0 percent at n=100 across the dashed 0.5 percent target at n=600 down to 0.15 percent at n=2000.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const green = fig.tone('green')
    const blue = fig.tone('blue')
    const warm = fig.tone('warm')
    const red = fig.tone('critical')

    // Panel headers
    fig.text(68, 20, 'Monthly spend vs $750 cap', {
        size: 16,
        weight: 700,
        color: c.textPrimary,
    })
    fig.text(448, 20, 'Zero-defect 95% bound (3/n)', {
        size: 16,
        weight: 700,
        color: c.textPrimary,
    })

    // Left panel: Monthly spend scenarios against horizontal dashed $750 cap
    const barPlot = fig.plot(
        { x: 68, y: 58, width: 312, height: 314 },
        { x: [0, 4], y: [0, 1000] },
    )
    barPlot.axes({
        yTicks: [0, 250, 500, 750, 1000],
        yFormat: (v) => `$${v}`,
        yLabel: 'Monthly spend ($)',
        grid: true,
        labelSize: 13,
    })

    const scenarios = [
        { cx: 0.5, label: 'Base', value: 717, text: '$717', color: green },
        { cx: 1.5, label: '+10%', value: 780, text: '$780', color: warm },
        { cx: 2.5, label: 'ColdEval', value: 804, text: '$804', color: warm },
        { cx: 3.5, label: 'ColdAll', value: 916, text: '$916', color: red },
    ]
    const barW = 48
    for (const s of scenarios) {
        const x = barPlot.px(s.cx) - barW / 2
        const yTop = barPlot.py(s.value)
        const h = barPlot.bottom - yTop
        fig.rect(x, yTop, barW, h, {
            fill: tint(s.color, c.bg, 0.28),
            stroke: s.color,
            strokeWidth: 1.6,
            radius: 4,
        })
        // Place Base ($717) cleanly inside bar top so it never collides with the $750 cap label
        const valY = s.label === 'Base' ? yTop + 18 : yTop - 13
        fig.text(barPlot.px(s.cx), valY, s.text, {
            size: 13.5,
            weight: 700,
            color: s.color,
            align: 'center',
            mono: true,
        })
        fig.text(barPlot.px(s.cx), barPlot.bottom + 18, s.label, {
            size: 13,
            weight: 600,
            color: c.textPrimary,
            align: 'center',
        })
    }

    // Horizontal dashed $750 cap line
    barPlot.hline(750, '$750 cap', {
        color: blue,
        width: 1.8,
        dash: '5 4',
        labelPosition: 'left',
        labelOffset: 13,
        labelSize: 13.5,
        weight: 700,
    })

    // Right panel: Smooth 3/n curve with clean round ticks (0, 500, 1k, 1.5k, 2k & 0, 1, 2, 3%)
    const curvePlot = fig.plot(
        { x: 448, y: 58, width: 312, height: 314 },
        { x: [0, 2000], y: [0, 3.5] },
    )
    curvePlot.axes({
        xTicks: [0, 500, 1000, 1500, 2000],
        xFormat: (v) => (v === 0 ? '0' : v >= 1000 ? `${v / 1000}k` : String(v)),
        yTicks: [0, 1, 2, 3],
        yFormat: (v) => `${v}%`,
        xLabel: 'Zero-defect sample size (n)',
        yLabel: 'Upper defect bound (%)',
        grid: true,
        labelSize: 13,
    })

    const curvePts: [number, number][] = []
    for (let n = 100; n <= 2000; n += 25) {
        curvePts.push([n, 300 / n])
    }
    curvePlot.fillArea(curvePts, { fill: blue, fillOpacity: 0.13, smooth: true })
    curvePlot.smoothCurve(curvePts, { color: blue, width: 2.4 })

    // Dashed 0.5% target reference line
    curvePlot.hline(0.5, '0.5% target', {
        color: warm,
        width: 1.6,
        dash: '5 4',
        labelPosition: 'right',
        labelOffset: 13,
        labelSize: 13,
        weight: 700,
    })

    // Key points & clean callouts
    for (const n of [100, 250, 600, 1000, 2000]) {
        curvePlot.point(n, 300 / n, { color: n === 600 ? warm : blue, r: n === 600 ? 5.5 : 4 })
    }
    fig.callout(
        [curvePlot.px(100) + 6, curvePlot.py(3.0)],
        [curvePlot.px(440), curvePlot.py(3.05)],
        'n = 100: 3.0%',
        { color: blue, size: 13, weight: 700, bend: -0.1, align: 'left' },
    )
    fig.callout(
        [curvePlot.px(600) + 4, curvePlot.py(0.5) - 6],
        [curvePlot.px(880), curvePlot.py(1.75)],
        'n = 600 clears 0.5%',
        { color: warm, size: 13, weight: 700, bend: -0.18, align: 'left' },
    )
    fig.text(curvePlot.px(2000) - 4, curvePlot.py(0.15) - 18, '0.15%', {
        size: 12.5,
        weight: 600,
        color: blue,
        align: 'right',
        mono: true,
    })

    return fig.render()
}

export default create('dark')
