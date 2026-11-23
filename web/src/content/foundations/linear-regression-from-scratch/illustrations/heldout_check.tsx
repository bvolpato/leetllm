import type { ThemeMode } from 'vizmatic'
import { Figure } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 560
export const height = 520
export const alt =
    'A line fit to the first four requests, 98 plus 21 x, extends to the held-out fifth request at x equals 5. It predicts 203 milliseconds against an actual 198, a miss of 5 milliseconds. A flat baseline at the training mean of 150.5 milliseconds misses the same request by 47.5 milliseconds.'

const train: readonly (readonly [number, number])[] = [
    [1, 118],
    [2, 141],
    [3, 162],
    [4, 181],
]

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue'),
        warm = fig.tone('warm'),
        red = fig.tone('critical')
    const plot = fig.plot(
        { x: 64, y: 60, width: 448, height: 260 },
        { x: [0.5, 5.6], y: [100, 215] },
    )
    plot.axes({ xTicks: [1, 2, 3, 4, 5], yTicks: [120, 160, 200], grid: true, labelSize: 18 })
    fig.text(64, 25, 'Latency (ms)', { size: 22, weight: 600 })
    fig.text(288, 365, 'Context (100-token units)', {
        size: 20,
        color: c.textSecondary,
        align: 'center',
    })
    fig.rect(plot.px(4.5), plot.area.y, plot.right - plot.px(4.5), plot.area.height, {
        fill: c.bgCardAlt ?? c.borderSubtle,
        opacity: 0.7,
    })
    plot.fn((x) => 98 + 21 * x, { color: blue, width: 2.25 }, 2, [0.5, 4.5])
    plot.fn((x) => 98 + 21 * x, { color: blue, width: 2, dash: '5 5' }, 2, [4.5, 5.4])
    plot.fn(() => 150.5, { color: warm, width: 1.75 }, 2, [0.5, 4.5])
    plot.fn(() => 150.5, { color: warm, width: 1.5, dash: '5 5' }, 2, [4.5, 5.4])
    for (const [x, y] of train) plot.point(x, y, { color: c.textPrimary })
    fig.line(plot.px(5) + 5, plot.py(198), plot.px(5) + 5, plot.py(203), { color: blue, width: 3 })
    fig.line(plot.px(5) - 5, plot.py(150.5), plot.px(5) - 5, plot.py(198), {
        color: warm,
        width: 3,
    })
    plot.point(5, 198, { color: red, r: 5.5 })
    fig.text(plot.px(1), plot.py(198), 'ŷ = 98 + 21x', { size: 22, color: blue, weight: 600 })
    fig.text(plot.px(5), plot.bottom - 18, 'Held out', {
        size: 18,
        color: c.textSecondary,
        weight: 600,
        align: 'center',
    })

    fig.text(64, 410, 'Held-out actual: 198 ms', { weight: 600, size: 22 })
    fig.text(64, 450, 'Line · 203 ms', { color: blue, size: 20 })
    fig.text(64, 490, '5 ms miss', { color: blue, size: 26, weight: 650 })
    fig.text(314, 450, 'Mean · 150.5 ms', { color: warm, size: 20 })
    fig.text(314, 490, '47.5 ms miss', { color: warm, size: 26, weight: 650 })
    return fig.render()
}
