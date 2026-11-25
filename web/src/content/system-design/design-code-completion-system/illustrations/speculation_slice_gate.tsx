import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 430
export const alt =
    'Dual-axis scatter qualification gate for speculative decoding slices. The green qualified region requires at least 2.0 mean accepted draft tokens and at least 10 ms p95 latency reduction. Python imports pass at (3.8 tokens, +42 ms, p95 178 to 136 ms), while SQL queries fail at (1.1 tokens, -7 ms, p95 169 to 176 ms).'

export const numericAnchors = {
    xDomain: [0, 5],
    yDomain: [-10, 50],
    thresholdTokens: 2.0,
    thresholdLatencyMs: 10,
    pythonSlice: { tokens: 3.8, latencyGainMs: 42, p95Baseline: 178, p95Speculative: 136 },
    sqlSlice: { tokens: 1.1, latencyGainMs: -7, p95Baseline: 169, p95Speculative: 176 },
}

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const green = fig.tone('green')
    const red = fig.tone('critical')

    const plot = fig.plot({ x: 94, y: 48, width: 616, height: 316 }, { x: [0, 5], y: [-15, 55] })

    // Qualified region: x >= 2.0 and y >= 10 ms
    fig.rect(
        plot.px(2.0),
        plot.py(55),
        plot.px(5) - plot.px(2.0),
        plot.py(10) - plot.py(55),
        { fill: tint(green, c.bg, 0.14), radius: 4 },
    )
    // Regression region: y < 0
    fig.rect(
        plot.px(0),
        plot.py(0),
        plot.px(5) - plot.px(0),
        plot.py(-15) - plot.py(0),
        { fill: tint(red, c.bg, 0.09) },
    )

    // Axes and subtle grid
    plot.axes({
        xTicks: [0, 1, 2, 3, 4, 5],
        yTicks: [-10, 0, 10, 20, 30, 40, 50],
        xLabel: 'Mean accepted draft tokens per verification step',
        yLabel: 'Net p95 latency reduction (ms)',
        yFormat: (v) => (v > 0 ? `+${v}` : String(v)),
        grid: true,
        labelSize: 13,
    })

    // Zero baseline (solid)
    fig.line(plot.px(0), plot.py(0), plot.px(5), plot.py(0), {
        color: c.textMuted,
        width: 1.3,
    })

    // Gate thresholds
    plot.vline(2.0, 'Min 2.0 accepted tokens', {
        color: green,
        width: 1.5,
        dash: '5 4',
        labelPosition: 'bottom',
        labelOffset: 14,
        align: 'left',
        labelSize: 13,
    })
    plot.hline(10, 'Min +10 ms p95 gain', {
        color: green,
        width: 1.5,
        dash: '5 4',
        labelPosition: 'right',
        labelOffset: 12,
        labelSize: 13,
    })

    // Region badge top-right inside green quadrant
    fig.text(plot.px(4.85), plot.py(50.5), 'QUALIFIED REGION (enable)', {
        size: 13,
        weight: 700,
        color: green,
        align: 'right',
    })
    fig.text(plot.px(4.85), plot.py(-9), 'Latency regression (disable)', {
        size: 12,
        weight: 600,
        color: red,
        align: 'right',
    })

    // Python imports point (3.8, +42): label stays 100% inside qualified quadrant (x > 2.0)
    const pyX = plot.px(3.8)
    const pyY = plot.py(42)
    fig.circle(pyX, pyY, 12, { stroke: green, width: 1.8, opacity: 0.45 })
    plot.point(3.8, 42, { color: green, r: 6.5 })
    fig.callout([pyX, pyY + 11], [plot.px(3.55), plot.py(28)], 'Python imports: ENABLE', {
        color: green,
        labelColor: green,
        size: 14,
        weight: 700,
        align: 'center',
        bend: 0.15,
    })
    fig.text(plot.px(3.55), plot.py(28) + 20, '3.8 tok · +42 ms (178 -> 136 ms)', {
        size: 13,
        color: c.textPrimary,
        align: 'center',
        mono: true,
    })

    // SQL queries point (1.1, -7): label stays 100% on left of x = 2.0 gate line, arrow leaves from bottom line
    const sqlX = plot.px(1.1)
    const sqlY = plot.py(-7)
    fig.circle(sqlX, sqlY, 12, { stroke: red, width: 1.8, opacity: 0.45 })
    plot.point(1.1, -7, { color: red, r: 6.5 })
    fig.text(plot.px(1.0), plot.py(31), 'SQL queries: DISABLE', {
        size: 14,
        weight: 700,
        color: red,
        align: 'center',
    })
    fig.text(plot.px(1.0), plot.py(25), '1.1 tok · -7 ms (169 -> 176 ms)', {
        size: 12,
        color: c.textPrimary,
        align: 'center',
        mono: true,
    })
    fig.callout([sqlX - 2, sqlY - 12], [plot.px(1.0), plot.py(21)], '', {
        color: red,
        bend: -0.14,
    })

    return fig.render()
}

export default create('dark')
