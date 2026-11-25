import type { ThemeMode } from 'vizmatic'
import { Figure } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 780
export const height = 435
export const alt =
    'Side-by-side operating curves sweep offered rate from 0.5 to 2.5 RPS with a shared vertical dashed 1.5 RPS passing frontier. Left: SLO attainment on a 50 to 100 percent scale holds at 100, 100, and 95 percent through 1.5 RPS before dropping to 80 percent at 2.0 RPS and 58 percent at 2.5 RPS. Right: goodput on a 0 to 3 RPS scale peaks at 1.60 qualified RPS at 2.0 RPS even though that rate fails the 95 percent floor.'

const RATES = [0.5, 1.0, 1.5, 2.0, 2.5]
const ATTAINMENT = [100, 100, 95, 80, 58]
const GOODPUT = [0.5, 1.0, 1.43, 1.6, 1.45]

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const green = fig.tone('green')
    const warm = fig.tone('warm')

    // Panel titles
    fig.text(64, 20, 'SLO attainment vs offered rate', {
        size: 16,
        weight: 700,
        color: c.textPrimary,
    })
    fig.text(448, 20, 'Goodput peaks while failing SLO', {
        size: 16,
        weight: 700,
        color: c.textPrimary,
    })

    // Left panel: SLO attainment (clean 50, 75, 100% y-ticks)
    const leftPlot = fig.plot(
        { x: 64, y: 58, width: 310, height: 312 },
        { x: [0.4, 2.6], y: [50, 106] },
    )
    leftPlot.axes({
        xTicks: [0.5, 1.0, 1.5, 2.0, 2.5],
        xFormat: (v) => v.toFixed(1),
        yTicks: [50, 75, 100],
        yFormat: (v) => `${v}%`,
        xLabel: 'Offered rate (RPS)',
        yLabel: 'SLO attainment (%)',
        grid: true,
        labelSize: 13,
    })

    // 95% SLO floor + vertical 1.5 RPS passing frontier
    leftPlot.hline(95, '95% floor', {
        color: purple,
        width: 1.5,
        dash: '5 4',
        labelPosition: 'left',
        labelOffset: 12,
        labelSize: 12.5,
        weight: 700,
    })
    leftPlot.vline(1.5, '1.5 RPS frontier', {
        color: green,
        width: 1.6,
        dash: '4 4',
        labelPosition: 'bottom',
        labelOffset: 16,
        labelSize: 12.5,
        weight: 700,
        align: 'right',
    })

    const attPts = RATES.map((r, i) => [r, ATTAINMENT[i]!] as const)
    leftPlot.fillArea(attPts, { fill: blue, fillOpacity: 0.1, baseline: 50 })
    leftPlot.curve(attPts, { color: blue, width: 2.5 })
    for (const [r, a] of attPts) leftPlot.point(r, a, { color: blue, r: 4.5 })
    leftPlot.point(1.5, 95, { color: green, r: 8, ring: true })

    // Direct point annotations
    fig.text(leftPlot.px(2.0) + 9, leftPlot.py(80) - 2, '80%', {
        size: 13,
        weight: 700,
        color: blue,
        mono: true,
    })
    fig.text(leftPlot.px(2.5) - 10, leftPlot.py(58) - 10, '58%', {
        size: 13,
        weight: 700,
        color: blue,
        align: 'right',
        mono: true,
    })

    // Right panel: Goodput vs Offered RPS (clean 0, 1, 2, 3 y-ticks)
    const rightPlot = fig.plot(
        { x: 448, y: 58, width: 310, height: 312 },
        { x: [0.4, 2.6], y: [0, 3] },
    )
    rightPlot.axes({
        xTicks: [0.5, 1.0, 1.5, 2.0, 2.5],
        xFormat: (v) => v.toFixed(1),
        yTicks: [0, 1, 2, 3],
        yFormat: (v) => String(v),
        xLabel: 'Offered rate (RPS)',
        yLabel: 'Rate (RPS)',
        grid: true,
        labelSize: 13,
    })

    rightPlot.vline(1.5, '1.5 RPS frontier', {
        color: green,
        width: 1.6,
        dash: '4 4',
        labelPosition: 'top',
        labelOffset: 12,
        labelSize: 12.5,
        weight: 700,
        align: 'right',
    })

    const offPts = RATES.map((r) => [r, r] as const)
    const gpPts = RATES.map((r, i) => [r, GOODPUT[i]!] as const)

    rightPlot.curve(offPts, { color: warm, width: 2, dash: '6 4' })
    rightPlot.fillArea(gpPts, { fill: green, fillOpacity: 0.12 })
    rightPlot.curve(gpPts, { color: green, width: 2.5 })

    for (const [r, v] of offPts) rightPlot.point(r, v, { color: warm, r: 3.5 })
    for (const [r, v] of gpPts) rightPlot.point(r, v, { color: green, r: 4.5 })
    rightPlot.point(2.0, 1.6, { color: warm, r: 8, ring: true })

    // Direct curve labels & peak callout
    fig.text(rightPlot.px(2.48), rightPlot.py(2.5) - 16, 'Offered RPS', {
        size: 13,
        weight: 700,
        color: warm,
        align: 'right',
    })
    fig.text(rightPlot.px(1.42), rightPlot.py(1.66), '1.43 pass', {
        size: 12.5,
        weight: 700,
        color: green,
        align: 'right',
        mono: true,
    })
    fig.callout(
        [rightPlot.px(2.0), rightPlot.py(1.6) + 8],
        [rightPlot.px(1.58), rightPlot.py(0.72)],
        'Peak 1.60 (fails SLO)',
        { color: warm, size: 12.5, weight: 700, bend: 0.1, align: 'left' },
    )

    return fig.render()
}

export default create('dark')
