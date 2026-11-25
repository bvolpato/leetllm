import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 720
export const height = 420
export const alt =
    'Side-by-side bar charts compare three candidate models against a dashed 0.98 specification pass-rate floor and a dashed 900 ms p95 latency cap, with per-request cost labels beneath each model. Fast-small scores 0.91 and fails quality despite 420 ms latency and $0.002 cost. Slow-specialist reaches 1.00 but takes 1800 ms at $0.031, exceeding both latency and $0.015 cost caps. Only balanced (0.99, 680 ms, $0.008) clears every online criterion.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const green = fig.tone('green')
    const red = fig.tone('critical')
    const warm = fig.tone('warm')

    // Panel titles
    fig.text(62, 20, 'Specification pass rate', {
        size: 16,
        weight: 700,
        color: c.textPrimary,
    })
    fig.text(422, 20, 'p95 latency (ms) & unit cost', {
        size: 16,
        weight: 700,
        color: c.textPrimary,
    })

    // Left panel: Pass rate on clean round ticks (0.85, 0.90, 0.95, 1.00)
    const passPlot = fig.plot(
        { x: 62, y: 58, width: 290, height: 284 },
        { x: [0, 3], y: [0.85, 1.02] },
    )
    passPlot.axes({
        yTicks: [0.85, 0.9, 0.95, 1.0],
        yFormat: (v) => v.toFixed(2),
        yLabel: 'Pass rate',
        grid: true,
        labelSize: 13.5,
    })

    const passBars = [
        { cx: 0.5, label: 'fast-small', sub: 'Misses floor', value: 0.91, text: '0.91', color: red },
        { cx: 1.5, label: 'balanced', sub: 'Meets all', value: 0.99, text: '0.99', color: green },
        {
            cx: 2.5,
            label: 'slow-spec',
            sub: 'High latency',
            value: 1.0,
            text: '1.00',
            color: green,
        },
    ]
    const barW = 52
    for (const bar of passBars) {
        const x = passPlot.px(bar.cx) - barW / 2
        const yTop = passPlot.py(bar.value)
        const h = passPlot.bottom - yTop
        fig.rect(x, yTop, barW, h, {
            fill: tint(bar.color, c.bg, 0.28),
            stroke: bar.color,
            strokeWidth: 1.6,
            radius: 4,
        })
        fig.text(passPlot.px(bar.cx), yTop - 13, bar.text, {
            size: 14,
            weight: 700,
            color: bar.color,
            align: 'center',
            mono: true,
        })
        fig.text(passPlot.px(bar.cx), passPlot.bottom + 18, bar.label, {
            size: 13.5,
            weight: 700,
            color: c.textPrimary,
            align: 'center',
            mono: true,
        })
        fig.text(passPlot.px(bar.cx), passPlot.bottom + 38, bar.sub, {
            size: 13.5,
            color: bar.color === red ? red : c.textSecondary,
            align: 'center',
        })
    }

    // Dashed 0.98 floor line drawn over grid so it stands out clearly
    passPlot.hline(0.98, '0.98 floor', {
        color: green,
        width: 1.6,
        dash: '5 4',
        labelPosition: 'left',
        labelOffset: 13,
        labelSize: 13.5,
        weight: 700,
    })

    // Right panel: p95 latency on clean round ticks (0, 500, 1000, 1500, 2000)
    const latPlot = fig.plot(
        { x: 422, y: 58, width: 282, height: 284 },
        { x: [0, 3], y: [0, 2000] },
    )
    latPlot.axes({
        yTicks: [0, 500, 1000, 1500, 2000],
        yFormat: (v) => String(v),
        yLabel: 'p95 latency (ms)',
        grid: true,
        labelSize: 13.5,
    })

    const latBars = [
        {
            cx: 0.5,
            label: 'fast-small',
            cost: '$0.002',
            costOver: false,
            value: 420,
            text: '420 ms',
            color: green,
        },
        {
            cx: 1.5,
            label: 'balanced',
            cost: '$0.008',
            costOver: false,
            value: 680,
            text: '680 ms',
            color: green,
        },
        {
            cx: 2.5,
            label: 'slow-spec',
            cost: '$0.031 > $0.015',
            costOver: true,
            value: 1800,
            text: '1800 ms',
            color: warm,
        },
    ]
    for (const bar of latBars) {
        const x = latPlot.px(bar.cx) - barW / 2
        const yTop = latPlot.py(bar.value)
        const h = latPlot.bottom - yTop
        fig.rect(x, yTop, barW, h, {
            fill: tint(bar.color, c.bg, 0.28),
            stroke: bar.color,
            strokeWidth: 1.6,
            radius: 4,
        })
        fig.text(latPlot.px(bar.cx), yTop - 13, bar.text, {
            size: 13.5,
            weight: 700,
            color: bar.color,
            align: 'center',
            mono: true,
        })
        fig.text(latPlot.px(bar.cx), latPlot.bottom + 18, bar.label, {
            size: 13.5,
            weight: 700,
            color: c.textPrimary,
            align: 'center',
            mono: true,
        })
        fig.text(latPlot.px(bar.cx), latPlot.bottom + 38, bar.cost, {
            size: 13.5,
            weight: bar.costOver ? 700 : 500,
            color: bar.costOver ? red : c.textSecondary,
            align: 'center',
        })
    }

    // Dashed 900 ms cap line
    latPlot.hline(900, '900 ms cap', {
        color: warm,
        width: 1.6,
        dash: '5 4',
        labelPosition: 'left',
        labelOffset: 13,
        labelSize: 13.5,
        weight: 700,
    })

    return fig.render()
}

export default create('dark')
