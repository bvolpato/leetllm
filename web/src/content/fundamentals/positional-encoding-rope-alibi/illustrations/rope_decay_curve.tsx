import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 720
export const height = 395
export const alt =
    'A coordinate plot compares a single RoPE pair score S(Delta) = cos(0.5 Delta) against the ALiBi linear penalty B(Delta) = -0.1 Delta over relative offsets Delta from 0 to 12. Highlighted between Delta = 6 and Delta = 8, the RoPE pair rebounds upward from -0.990 to -0.654 as its cosine phase turns, while ALiBi drops monotonically from -0.600 to -0.800 and reaches -1.200 at Delta = 12.'

const ropeAt = (delta: number) => Math.cos(0.5 * delta)
const alibiAt = (delta: number) => -0.1 * delta

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const red = fig.tone('critical')
    const warm = fig.tone('warm')

    const plot = fig.plot({ x: 68, y: 36, width: 454, height: 294 }, { x: [0, 12], y: [-1.35, 1.15] })

    // Highlight the Δ = 6..8 rebound window before drawing axes/curves
    const x6 = plot.px(6)
    const x8 = plot.px(8)
    fig.rect(x6, plot.area.y, x8 - x6, plot.area.height, {
        fill: tint(warm, c.bg, theme === 'dark' ? 0.14 : 0.12),
    })

    plot.axes({
        xTicks: [0, 2, 4, 6, 8, 10, 12],
        yTicks: [-1.0, -0.5, 0, 0.5, 1.0],
        yFormat: (v) => (v === 0 ? '0' : v > 0 ? `+${v.toFixed(1)}` : `−${Math.abs(v).toFixed(1)}`),
        xLabel: 'Relative distance Δ = i − j',
        yLabel: 'Position score / bias',
        labelSize: 14,
        grid: true,
    })

    // Stronger zero baseline
    fig.line(plot.area.x, plot.py(0), plot.right, plot.py(0), {
        color: c.textMuted,
        width: 1.15,
        opacity: 0.75,
    })

    // Dashed vertical markers at Δ = 6 and Δ = 8
    plot.vline(6, undefined, { color: warm, width: 1.35, dash: '4 4' })
    plot.vline(8, undefined, { color: warm, width: 1.35, dash: '4 4' })
    fig.text((x6 + x8) / 2, plot.area.y + 14, 'Δ = 6 → 8', {
        size: 13,
        color: warm,
        align: 'center',
        mono: true,
        weight: 700,
    })

    // Smooth 240-point curves
    plot.fn(ropeAt, { color: blue, width: 2.75 }, 240)
    plot.fn(alibiAt, { color: red, width: 2.75 }, 240)

    // Key points at Δ = 6 and Δ = 8
    for (const d of [6, 8]) {
        fig.circle(plot.px(d), plot.py(ropeAt(d)), 5.8, { fill: blue, stroke: c.bg, width: 2 })
        fig.circle(plot.px(d), plot.py(alibiAt(d)), 5.8, { fill: red, stroke: c.bg, width: 2 })
    }

    // Direct curve labels inside clear regions of the plot
    fig.text(plot.px(2.1), plot.py(ropeAt(2.1)) - 18, 'RoPE pair', {
        size: 14,
        color: blue,
        weight: 700,
    })
    fig.text(plot.px(1.5), plot.py(alibiAt(1.5)) + 24, 'ALiBi bias', {
        size: 14,
        color: red,
        weight: 700,
    })

    // Direct numeric callouts at Δ=6 and Δ=8 (placed cleanly clear of both curves)
    fig.text(plot.px(6) - 8, plot.py(ropeAt(6)) + 16, '−0.990', {
        size: 13,
        color: blue,
        align: 'right',
        mono: true,
        weight: 700,
    })
    fig.text(plot.px(8) + 12, plot.py(-0.62), '−0.654 ↑', {
        size: 13,
        color: blue,
        align: 'left',
        mono: true,
        weight: 700,
    })
    fig.text(plot.px(6) + 8, plot.py(alibiAt(6)) - 16, '−0.600', {
        size: 13,
        color: red,
        align: 'left',
        mono: true,
        weight: 700,
    })
    fig.callout(
        [plot.px(8), plot.py(alibiAt(8)) + 7],
        [plot.px(8.4), plot.py(-1.22)],
        '−0.800 ↓',
        {
            size: 13,
            color: red,
            labelColor: red,
            align: 'left',
            weight: 700,
            bend: 0.14,
        },
    )

    // Right margin: clean formula & Δ=6->8 comparison summary
    const rx = 540
    fig.line(rx, 78, rx + 20, 78, { color: blue, width: 3 })
    fig.text(rx + 28, 78, 'RoPE pair', { size: 14.5, color: blue, weight: 700 })
    fig.math(rx, 108, String.raw`S(\Delta) = \cos(0.5\Delta)`, {
        size: 14.5,
        color: c.textPrimary,
        align: 'left',
    })
    fig.text(rx, 134, '−0.990 → −0.654', {
        size: 13.5,
        color: blue,
        mono: true,
        weight: 700,
    })
    fig.text(rx, 154, 'oscillates & rebounds', {
        size: 13,
        color: c.textSecondary,
    })

    fig.line(rx, 192, width - 16, 192, { color: c.borderSubtle, width: 1 })

    fig.line(rx, 224, rx + 20, 224, { color: red, width: 3 })
    fig.text(rx + 28, 224, 'ALiBi penalty', { size: 14.5, color: red, weight: 700 })
    fig.math(rx, 254, String.raw`B(\Delta) = -0.1\Delta`, {
        size: 14.5,
        color: c.textPrimary,
        align: 'left',
    })
    fig.text(rx, 280, '−0.600 → −0.800', {
        size: 13.5,
        color: red,
        mono: true,
        weight: 700,
    })
    fig.text(rx, 300, 'monotonic decay', {
        size: 13,
        color: c.textSecondary,
    })

    return fig.render()
}

export default create('dark')
