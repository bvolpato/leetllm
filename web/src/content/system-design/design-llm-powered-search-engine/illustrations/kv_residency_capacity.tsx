import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 840
export const height = 430
export const alt =
    'Two-panel quantitative capacity diagram for 600 synthesis requests per second. Top: calibrated 2.50-second request lifecycle showing 0.37 s pre-model, 1.93 s active KV residency, and 0.20 s post-release; Little’s Law gives 1,500 total in-flight requests but only 1,158 KV-resident requests consuming 220.52 GiB. Bottom: horizontal GPU lower-bound chart comparing KV memory (19 GPUs at 12 GiB/GPU) against decode throughput (12 GPUs at 6,000 tok/s/GPU), with a dashed envelope line at max(19, 12) = 19 GPUs on one shared pool.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const green = fig.tone('green')
    const blue = fig.tone('blue')
    const warm = fig.tone('warm')
    const purple = fig.tone('purple')

    const fill = (color: string, amt = 0.2) => tint(color, c.bg, amt)

    // ==================== TOP: 2.50s LIFECYCLE AXIS ====================
    const topPlot = fig.plot(
        { x: 48, y: 66, width: 756, height: 96 },
        { x: [0, 2.5], y: [0, 2] },
    )

    // Full-lifecycle brace above bar
    fig.brace(
        topPlot.px(0),
        52,
        topPlot.px(2.5),
        52,
        'Total lifecycle: 2.50 s  ->  600 QPS × 2.50 s = 1,500 in flight',
        {
            side: -1,
            depth: 8,
            color: c.border,
            labelColor: c.textPrimary,
            labelSize: 13,
            labelGap: 13,
            weight: 700,
        },
    )

    const barY = 72
    const barH = 42

    // Pre-model: 0 -> 0.37 s
    fig.rect(topPlot.px(0), barY, topPlot.px(0.37) - topPlot.px(0), barH, {
        fill: tint(c.textMuted, c.bg, 0.14),
        stroke: c.border,
        strokeWidth: 1.2,
        radius: 5,
    })
    fig.text((topPlot.px(0) + topPlot.px(0.37)) / 2, barY + barH / 2, 'Pre 0.37 s', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
        weight: 600,
    })

    // KV-resident: 0.37 -> 2.30 s
    fig.rect(topPlot.px(0.37) + 2, barY, topPlot.px(2.3) - topPlot.px(0.37) - 4, barH, {
        fill: fill(green, 0.24),
        stroke: green,
        strokeWidth: 1.6,
        radius: 5,
    })
    fig.text(
        (topPlot.px(0.37) + topPlot.px(2.3)) / 2,
        barY + barH / 2,
        'KV-resident: 1.93 s   (1,158 active · 1,560 tok × 128 KiB = 220.52 GiB)',
        {
            size: 13,
            color: c.textPrimary,
            align: 'center',
            weight: 700,
        },
    )

    // Post-release: 2.30 -> 2.50 s
    fig.rect(topPlot.px(2.3) + 2, barY, topPlot.px(2.5) - topPlot.px(2.3) - 2, barH, {
        fill: fill(warm, 0.2),
        stroke: warm,
        strokeWidth: 1.2,
        radius: 5,
    })
    fig.text((topPlot.px(2.3) + topPlot.px(2.5)) / 2, barY + barH / 2, '0.20 s', {
        size: 12,
        color: warm,
        align: 'center',
        weight: 600,
    })

    // Time ticks under lifecycle bar
    const axisY = barY + barH + 10
    fig.line(topPlot.px(0), axisY, topPlot.px(2.5), axisY, { color: c.textMuted, width: 1 })
    for (const t of [0, 0.37, 1.0, 1.5, 2.3, 2.5]) {
        const tx = topPlot.px(t)
        fig.line(tx, axisY, tx, axisY + 4, { color: c.textMuted, width: 1 })
        fig.text(tx, axisY + 15, `${t.toFixed(t % 0.5 === 0 ? 1 : 2)} s`, {
            size: 11.5,
            color: t === 0.37 || t === 2.3 ? green : c.textSecondary,
            align: 'center',
            weight: t === 0.37 || t === 2.3 ? 700 : 500,
            mono: true,
        })
    }

    // ==================== BOTTOM: GPU POOL LOWER-BOUND CHART ====================
    fig.text(48, 198, 'Shared GPU Pool Lower Bounds (never summed)', {
        size: 14,
        color: c.textPrimary,
        weight: 700,
    })

    const gpuPlot = fig.plot(
        { x: 184, y: 224, width: 616, height: 142 },
        { x: [0, 24], y: [0, 3] },
    )
    gpuPlot.axes({
        xTicks: [0, 5, 10, 15, 20],
        xLabel: 'Minimum GPUs required on the shared pool',
        grid: true,
        labelSize: 12.5,
    })

    const gBarH = 38

    // Bar 1: KV memory bound = 19 GPUs
    const yMem = gpuPlot.py(2.15) - gBarH / 2
    fig.text(172, yMem + gBarH / 2, 'KV memory', {
        size: 13.5,
        color: green,
        align: 'right',
        weight: 700,
    })
    fig.rect(gpuPlot.px(0), yMem, gpuPlot.px(19) - gpuPlot.px(0), gBarH, {
        fill: fill(green, 0.25),
        stroke: green,
        strokeWidth: 1.5,
        radius: 5,
    })
    fig.text(gpuPlot.px(9.5), yMem + gBarH / 2, '220.52 GiB / 12 GiB per GPU  =  19 GPUs', {
        size: 13,
        color: c.textPrimary,
        align: 'center',
        weight: 700,
    })

    // Bar 2: Decode throughput bound = 12 GPUs
    const yDec = gpuPlot.py(0.9) - gBarH / 2
    fig.text(172, yDec + gBarH / 2, 'Decode compute', {
        size: 13.5,
        color: blue,
        align: 'right',
        weight: 700,
    })
    fig.rect(gpuPlot.px(0), yDec, gpuPlot.px(12) - gpuPlot.px(0), gBarH, {
        fill: fill(blue, 0.24),
        stroke: blue,
        strokeWidth: 1.5,
        radius: 5,
    })
    fig.text(gpuPlot.px(6), yDec + gBarH / 2, '72k / 6k tok/s  =  12 GPUs', {
        size: 12.5,
        color: c.textPrimary,
        align: 'center',
        weight: 700,
    })

    // Governing envelope line at x = 19
    gpuPlot.vline(19, 'max(19, 12) = 19 GPUs', {
        color: purple,
        width: 1.75,
        dash: '5 4',
        labelPosition: 'bottom',
        labelOffset: 24,
        labelSize: 13,
        align: 'right',
        weight: 700,
    })

    return fig.render()
}

export default create()
