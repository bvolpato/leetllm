import type { ThemeMode } from 'vizmatic'
import { Figure } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 820
export const height = 516
export const preset = 'engineering'
export const alt =
    'Two scales of the loss curve L(w)=(2w−5)² make the update visible. A close view at w=3 shows the tangent slope 4 and the short steps: rate 0.1 lands at w=2.6, loss 0.04; rate 0.125 reaches w=2.5, loss 0. A full view shows rate 1 taking the same gradient far past the minimum to w=−1, loss 49.'

const loss = (w: number) => (2 * w - 5) ** 2

function arrowStep(
    fig: Figure,
    plot: ReturnType<Figure['plot']>,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: string,
    widthPx: number,
) {
    const sx1 = plot.px(x1),
        sy1 = plot.py(y1),
        sx2 = plot.px(x2),
        sy2 = plot.py(y2)
    const dist = Math.hypot(sx2 - sx1, sy2 - sy1) || 1
    const shrink = Math.max(0, (dist - 12) / dist)
    fig.arrow(sx1, sy1, sx1 + (sx2 - sx1) * shrink, sy1 + (sy2 - sy1) * shrink, {
        color,
        width: widthPx,
        head: 9,
    })
}

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const purple = fig.tone('purple'),
        warm = fig.tone('warm'),
        green = fig.tone('green'),
        blue = fig.tone('blue'),
        red = fig.tone('critical')

    fig.text(28, 26, 'Slope sets direction; rate sets stride', { weight: 650, size: 28 })
    fig.text(28, 66, 'L(w) = (2w − 5)² · at w = 3: L = 1, slope = 4', {
        size: 25,
        color: c.textSecondary,
    })

    fig.text(28, 114, 'Near minimum · short steps', { weight: 650, size: 25 })
    const left = fig.plot(
        { x: 84, y: 160, width: 298, height: 200 },
        { x: [2.35, 3.4], y: [0, 2.7] },
    )
    left.axes({ xTicks: [2.5, 3], yTicks: [0, 1, 2], labelSize: 25, grid: true })
    left.fn(loss, { color: purple, width: 3 }, 72)
    left.curve(
        [
            [2.75, 0],
            [3.25, 2],
        ],
        { color: warm, width: 2.5, dash: '6 5' },
    )
    arrowStep(fig, left, 3, 1, 2.6, loss(2.6), green, 3)
    arrowStep(fig, left, 3, 1, 2.5, loss(2.5), blue, 2.5)
    left.point(3, 1, { color: warm, r: 6.5 })
    left.point(2.6, loss(2.6), { color: green, r: 6 })
    left.point(2.5, loss(2.5), { color: blue, r: 6 })
    fig.text(28, 148, 'Loss', { size: 24, color: c.textSecondary })
    fig.text(233, 408, 'Weight w', { size: 25, color: c.textSecondary, align: 'center' })
    fig.text(28, 444, 'η = 0.1 → w = 2.6, L = 0.04', { size: 25, color: green })
    fig.text(28, 476, 'η = 0.125 → w = 2.5, L = 0', { size: 25, color: blue })

    fig.text(440, 114, 'Full curve · rate 1 overshoots', { weight: 650, size: 25 })
    const right = fig.plot(
        { x: 496, y: 160, width: 298, height: 200 },
        { x: [-1.25, 3.35], y: [0, 54] },
    )
    right.axes({ xTicks: [-1, 0, 1, 2, 3], yTicks: [0, 25, 50], labelSize: 25, grid: true })
    right.fn(loss, { color: purple, width: 3 }, 96)
    arrowStep(fig, right, 3, 1, -1, loss(-1), red, 3)
    right.point(3, 1, { color: warm, r: 6.5 })
    right.point(-1, loss(-1), { color: red, r: 6.5 })
    fig.text(440, 148, 'Loss', { size: 24, color: c.textSecondary })
    fig.text(645, 408, 'Weight w', { size: 25, color: c.textSecondary, align: 'center' })
    fig.text(440, 444, 'η = 1 → w = −1, L = 49', { size: 25, color: red })

    return fig.render()
}

export default create()
