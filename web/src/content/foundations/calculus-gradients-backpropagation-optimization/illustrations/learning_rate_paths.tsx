import type { ThemeMode } from 'vizmatic'
import { Figure } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 840
export const height = 430
export const alt =
    'Three panels show gradient descent on the same loss curve, L of w equals 2 w minus 5, squared, starting from w equals 3. With learning rate 0.05 the steps creep steadily toward the minimum at w equals 2.5. With 0.2 they zigzag across the minimum and still converge. With 0.26 each step overshoots further than the last, and the loss grows.'

const loss = (w: number) => (2 * w - 5) ** 2
const gradient = (w: number) => 4 * (2 * w - 5)

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const panels: [number, string, string, string][] = [
        [0.05, 'Rate 0.05', 'Slow and steady', fig.tone('blue')],
        [0.2, 'Rate 0.2', 'Zigzags, settles', fig.tone('green')],
        [0.26, 'Rate 0.26', 'Overshoots', fig.tone('critical')],
    ]
    panels.forEach(([rate, title, note, color], i) => {
        const left = 64 + i * 268
        fig.text(left - 34, 28, title, { weight: 650, size: 28, color })
        fig.text(left - 34, 68, note, { size: 25, color: c.textSecondary })
        const plot = fig.plot(
            { x: left, y: 122, width: 204, height: 220 },
            { x: [1.6, 3.4], y: [0, 3.6] },
        )
        plot.axes({ xTicks: [2, 2.5, 3], yTicks: [0, 1, 2, 3], format: String, labelSize: 25 })
        plot.fn(loss, { color: c.textMuted, width: 2 }, 120)
        let w = 3
        const points: [number, number][] = [[w, loss(w)]]
        for (let step = 0; step < 7; step++) {
            w -= rate * gradient(w)
            points.push([w, loss(w)])
        }
        plot.curve(points, { color, width: 2.5 })
        points.forEach(([x, y], k) => plot.point(x, y, { color, r: k === 0 ? 7 : 5 }))
        fig.text(left - 34, 102, 'Loss', { size: 25, color: c.textSecondary })
        fig.text(left + 102, 396, 'Weight w', { size: 25, color: c.textSecondary, align: 'center' })
    })
    return fig.render()
}
