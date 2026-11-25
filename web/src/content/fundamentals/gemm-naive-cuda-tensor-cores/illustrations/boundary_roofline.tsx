import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 420
export const alt =
    'A100 80GB SXM hardware roofline on calibrated log-log axes alongside nominal panel-load intensity ratios. Left log-log roofline draws the 2,039 GB/s HBM bandwidth slope meeting the FP32 ceiling at knee (9.56 FLOP/B, 19.5 TFLOP/s) and the dense FP16 Tensor Core ceiling at knee (153.0 FLOP/B, 312 TFLOP/s). Right horizontal bar chart compares nominal panel-load ratios across Scalar (0.25), Shared (4.0), Register 1x4 (6.4), and WMMA (8.0 FLOP/B).'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const warm = fig.tone('warm')
    const green = fig.tone('green')
    const red = fig.tone('critical')

    // --- Left: Calibrated log-log HBM Roofline ---
    fig.text(64, 22, 'A100 80GB SXM HBM Roofline', {
        size: 15,
        weight: 600,
        color: c.textPrimary,
    })

    const bw = 2.039 // TFLOP/s per (FLOP/B)
    const plot = fig.plot(
        { x: 64, y: 60, width: 388, height: 292 },
        { x: [0.2, 500], y: [0.3, 600], xScale: 'log', yScale: 'log' },
    )
    plot.logAxes({
        xTicks: [1, 10, 100],
        yTicks: [1, 10, 100],
        minorGrid: true,
        xLabel: 'HBM Intensity (FLOP/B, log)',
        yLabel: 'TFLOP/s (log)',
        labelSize: 13,
    })

    // Subtle shaded reachable region under FP16 ceiling
    plot.fillArea(
        [
            [0.2, bw * 0.2],
            [153.0, 312],
            [500, 312],
        ],
        { fill: green, fillOpacity: theme === 'light' ? 0.08 : 0.1, baseline: 0.3 },
    )

    // HBM slope + FP16 TC ceiling
    plot.curve(
        [
            [0.2, bw * 0.2],
            [153.0, 312],
            [500, 312],
        ],
        { color: green, width: 2.75 },
    )

    // FP32 scalar ceiling
    plot.curve(
        [
            [9.56, 19.5],
            [500, 19.5],
        ],
        { color: warm, width: 2.5 },
    )

    // Vertical knee guides
    fig.line(plot.px(9.56), plot.py(19.5), plot.px(9.56), plot.bottom, {
        color: warm,
        width: 1.25,
        dash: '4 4',
    })
    fig.line(plot.px(153.0), plot.py(312), plot.px(153.0), plot.bottom, {
        color: green,
        width: 1.25,
        dash: '4 4',
    })

    // Knee markers
    plot.point(9.56, 19.5, { color: warm, r: 5.5 })
    plot.point(153.0, 312, { color: green, r: 5.5 })

    // Direct labels (generous spacing, zero overlap)
    fig.text(plot.px(0.32), plot.py(26), '2,039 GB/s HBM', {
        size: 13,
        weight: 600,
        color: blue,
        align: 'left',
    })
    fig.callout([plot.px(1.6), plot.py(bw * 1.6)], [plot.px(0.85), plot.py(17)], '', {
        color: blue,
        bend: -0.18,
    })
    fig.text(plot.px(153.0) - 10, plot.py(312) - 16, 'FP16 TC: 312 TFLOP/s', {
        size: 13,
        weight: 600,
        color: green,
        align: 'right',
    })
    fig.text(plot.px(153.0) - 6, plot.py(0.52), '153.0', {
        size: 12,
        weight: 600,
        color: green,
        align: 'right',
        mono: true,
    })
    fig.text((plot.px(9.56) + plot.px(153.0)) / 2, plot.py(19.5) + 16, 'FP32: 19.5 TFLOP/s', {
        size: 12.5,
        weight: 600,
        color: warm,
        align: 'center',
    })
    fig.text(plot.px(9.56) + 6, plot.py(0.52), '9.56', {
        size: 12,
        weight: 600,
        color: warm,
        align: 'left',
        mono: true,
    })

    // Vertical hairline divider
    fig.line(480, 22, 480, 392, { color: c.borderSubtle, width: 1 })

    // --- Right: Nominal Panel-Load Intensity Bars ---
    fig.text(500, 22, 'Nominal Panel-Load Ratio', {
        size: 15,
        weight: 600,
        color: c.textPrimary,
    })
    fig.text(500, 44, 'FLOP / staged operand byte', {
        size: 12,
        color: c.textSecondary,
    })

    const barLeft = 568
    const barMaxW = 132
    const maxI = 9.0
    const axisTop = 74
    const axisBot = 352
    fig.line(barLeft, axisTop, barLeft, axisBot, { color: c.textMuted, width: 1 })
    for (const t of [0, 2, 4, 6, 8]) {
        const tx = barLeft + (t / maxI) * barMaxW
        if (t > 0) {
            fig.line(tx, axisTop, tx, axisBot, {
                color: c.borderSubtle,
                width: 1,
                dash: '3 3',
            })
        }
        fig.text(tx, axisBot + 16, String(t), {
            size: 12,
            color: c.textSecondary,
            align: 'center',
            mono: true,
        })
    }
    fig.text(barLeft + barMaxW / 2, axisBot + 36, 'FLOP/B (staged)', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
    })

    const bars = [
        { label: 'Scalar', value: 0.25, text: '0.25', color: red },
        { label: 'Shared', value: 4.0, text: '4.0', color: warm },
        { label: 'Reg 1×4', value: 6.4, text: '6.4', color: blue },
        { label: 'WMMA', value: 8.0, text: '8.0', color: green },
    ]
    bars.forEach((b, idx) => {
        const cy = 112 + idx * 66
        const w = Math.max(7, (b.value / maxI) * barMaxW)
        fig.text(barLeft - 10, cy, b.label, {
            size: 13,
            weight: 600,
            color: c.textPrimary,
            align: 'right',
        })
        fig.rect(barLeft, cy - 15, w, 30, {
            fill: tint(b.color, c.bg, theme === 'light' ? 0.78 : 0.85),
            stroke: b.color,
            strokeWidth: 1.25,
            radius: 4,
        })
        fig.text(barLeft + w + 8, cy, b.text, {
            size: 14,
            weight: 700,
            color: b.color,
            mono: true,
        })
    })

    return fig.render()
}

export default create
