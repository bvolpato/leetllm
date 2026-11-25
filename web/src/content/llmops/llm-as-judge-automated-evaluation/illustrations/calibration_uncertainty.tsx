import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 430
export const alt =
    'A smooth decaying curve and companion zoomed bar chart show the one-sided 95 percent upper bound on false acceptance after zero errors across N independent known-bad cases. The bound drops from 5.82 percent at 50 cases to 1.98 percent at 150 cases and 0.997 percent at 299 cases, crossing below the dashed 1 percent target line.'

const upperPct = (n: number) => 100 * (1 - Math.pow(0.05, 1 / n))

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const warm = fig.tone('warm')
    const green = fig.tone('green')

    // Panel titles
    fig.text(64, 20, '95% upper bound after 0 errors', {
        size: 16,
        weight: 700,
        color: c.textPrimary,
    })
    fig.text(538, 20, 'Key sample sizes (zoom)', {
        size: 16,
        weight: 700,
        color: c.textPrimary,
    })

    // Left panel: continuous curve N = 10..350
    const curvePlot = fig.plot(
        { x: 64, y: 58, width: 416, height: 314 },
        { x: [0, 350], y: [0, 30] },
    )
    curvePlot.axes({
        xTicks: [0, 50, 100, 150, 200, 250, 300, 350],
        yTicks: [0, 5, 10, 15, 20, 25, 30],
        yFormat: (v) => `${v}%`,
        xLabel: 'Independent known-bad cases (N)',
        yLabel: 'Upper bound (%)',
        grid: true,
        labelSize: 13,
    })

    // Smooth curve from N=10 to N=350
    const pts: [number, number][] = []
    for (let n = 10; n <= 350; n += 5) {
        pts.push([n, upperPct(n)])
    }
    curvePlot.fillArea(pts, { fill: blue, fillOpacity: 0.13, smooth: true })
    curvePlot.smoothCurve(pts, { color: blue, width: 2.4 })

    // Dashed 1% target threshold (label cleanly in open lower-left under curve)
    curvePlot.hline(1, '1% target', {
        color: green,
        width: 1.5,
        dash: '5 4',
        labelPosition: 'left',
        labelOffset: 12,
        labelSize: 13.5,
        weight: 600,
    })

    // Formula in open upper-right region
    fig.math(curvePlot.px(218), curvePlot.py(23.5), 'p_{\\text{upper}} = 1 - 0.05^{1/N}', {
        size: 17,
        color: c.textPrimary,
        align: 'center',
    })

    // Key points on curve with clean callouts
    const p50: [number, number] = [50, upperPct(50)]
    const p150: [number, number] = [150, upperPct(150)]
    const p299: [number, number] = [299, upperPct(299)]

    curvePlot.point(p50[0], p50[1], { color: warm, r: 5 })
    curvePlot.point(p150[0], p150[1], { color: blue, r: 5 })
    curvePlot.point(p299[0], p299[1], { color: green, r: 5 })

    fig.callout(
        [curvePlot.px(p50[0]) + 5, curvePlot.py(p50[1]) - 3],
        [curvePlot.px(118), curvePlot.py(15.2)],
        'N = 50: 5.82%',
        { color: warm, size: 13.5, weight: 600, bend: -0.18, align: 'left' },
    )
    fig.callout(
        [curvePlot.px(p150[0]) + 4, curvePlot.py(p150[1]) - 5],
        [curvePlot.px(176), curvePlot.py(11.4)],
        'N = 150: 1.98%',
        { color: blue, size: 13.5, weight: 600, bend: -0.16, align: 'left' },
    )
    fig.callout(
        [curvePlot.px(p299[0]), curvePlot.py(p299[1]) - 6],
        [curvePlot.px(322), curvePlot.py(6.2)],
        'N = 299: 0.997%',
        { color: green, size: 13.5, weight: 700, bend: -0.14, align: 'right' },
    )

    // Right panel: zoomed bar chart on clean 0..7% integer scale
    const barPlot = fig.plot(
        { x: 538, y: 58, width: 204, height: 314 },
        { x: [0, 3], y: [0, 7] },
    )
    barPlot.axes({
        yTicks: [0, 1, 2, 3, 4, 5, 6, 7],
        yFormat: (v) => `${v}%`,
        yLabel: 'Bound (%)',
        grid: true,
        labelSize: 13,
    })

    // 1% dashed reference line across zoomed bars
    barPlot.hline(1, '', { color: green, width: 1.5, dash: '5 4' })

    const bars = [
        { cx: 0.52, value: 5.82, valueLabel: '5.82%', name: 'N = 50', color: warm },
        { cx: 1.5, value: 1.98, valueLabel: '1.98%', name: 'N = 150', color: blue },
        { cx: 2.48, value: 0.997, valueLabel: '0.997%', name: 'N = 299', color: green },
    ]
    const barW = 42
    for (const bar of bars) {
        const x = barPlot.px(bar.cx) - barW / 2
        const yTop = barPlot.py(bar.value)
        const h = barPlot.bottom - yTop
        fig.rect(x, yTop, barW, h, {
            fill: tint(bar.color, c.bg, 0.28),
            stroke: bar.color,
            strokeWidth: 1.6,
            radius: 4,
        })
        fig.text(barPlot.px(bar.cx), yTop - 13, bar.valueLabel, {
            size: 13.5,
            weight: 700,
            color: bar.color,
            align: 'center',
            mono: true,
        })
        fig.text(barPlot.px(bar.cx), barPlot.bottom + 18, bar.name, {
            size: 13.5,
            weight: 600,
            color: c.textPrimary,
            align: 'center',
            mono: true,
        })
    }

    return fig.render()
}

export default create('dark')
