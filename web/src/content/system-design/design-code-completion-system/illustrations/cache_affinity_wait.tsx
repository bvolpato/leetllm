import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 420
export const alt =
    'Break-even plot comparing cold worker completion time (flat at q + 96 ms) against warm cached worker time (rising as q + delta + 35 ms) over extra warm queue wait delta from 0 to 100 ms. The lines intersect at delta = 61 ms (96 ms total). Green shading below 61 ms marks where routing warm wins; blue shading above 61 ms marks where routing to a cold worker finishes faster.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const green = fig.tone('green')
    const blue = fig.tone('blue')
    const warm = fig.tone('warm')

    const plot = fig.plot({ x: 96, y: 48, width: 616, height: 306 }, { x: [0, 100], y: [0, 150] })

    // Shaded winning bands between Warm (35 + delta) and Cold (96)
    plot.band(
        [
            [0, 35],
            [61, 96],
        ],
        [
            [0, 96],
            [61, 96],
        ],
        { fill: green, fillOpacity: 0.14 },
    )
    plot.band(
        [
            [61, 96],
            [100, 96],
        ],
        [
            [61, 96],
            [100, 135],
        ],
        { fill: blue, fillOpacity: 0.14 },
    )

    // Axes and grid with crisp round ticks
    plot.axes({
        xTicks: [0, 20, 40, 60, 80, 100],
        yTicks: [0, 30, 60, 90, 120, 150],
        xLabel: 'Extra warm-worker queue wait Δ (ms)',
        yLabel: 'Service + extra wait above base queue q (ms)',
        grid: true,
        labelSize: 13,
    })

    // Cold flat line: 96 ms
    plot.curve(
        [
            [0, 96],
            [100, 96],
        ],
        { color: blue, width: 2.5 },
    )
    // Warm rising line: 35 + delta
    plot.curve(
        [
            [0, 35],
            [100, 135],
        ],
        { color: green, width: 2.5 },
    )

    // Break-even vertical dashed line at delta = 61 ms
    plot.vline(61, 'Break-even Δ = 61 ms', {
        color: warm,
        width: 1.5,
        dash: '5 4',
        labelPosition: 'bottom',
        labelOffset: 16,
        align: 'left',
        labelSize: 13,
        weight: 700,
    })

    // Key points: (0, 35), (0, 96), (61, 96), (100, 135)
    plot.point(0, 35, { color: green, r: 4.5 })
    plot.point(0, 96, { color: blue, r: 4.5 })
    fig.circle(plot.px(61), plot.py(96), 11, { stroke: warm, width: 1.8, opacity: 0.55 })
    plot.point(61, 96, { color: warm, r: 5.5 })

    // Direct curve labels (spaced cleanly away from intersection)
    fig.text(plot.px(4), plot.py(104), 'Cold worker: q + 96 ms', {
        size: 14,
        weight: 700,
        color: blue,
    })
    fig.text(plot.px(4), plot.py(23), 'Warm worker: q + Δ + 35 ms', {
        size: 14,
        weight: 700,
        color: green,
    })

    // Region labels inside shaded triangles
    fig.text(plot.px(18), plot.py(82), 'Route WARM', {
        size: 14,
        weight: 700,
        color: green,
        align: 'center',
    })
    fig.text(plot.px(18), plot.py(71), 'saves up to 61 ms', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
    })

    fig.text(plot.px(86), plot.py(109), 'Route COLD', {
        size: 14,
        weight: 700,
        color: blue,
        align: 'center',
    })
    fig.text(plot.px(86), plot.py(84), 'queue > 61 ms savings', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
    })

    // Callout on crossover point (61, 96)
    fig.callout([plot.px(61) - 4, plot.py(96) - 10], [plot.px(46), plot.py(132)], 'Equal at (61 ms, 96 ms)', {
        color: warm,
        labelColor: warm,
        size: 13,
        weight: 700,
        align: 'right',
        bend: 0.18,
    })

    // Ensure unused helper import isn't flagged
    void tint

    return fig.render()
}

export default create('dark')
