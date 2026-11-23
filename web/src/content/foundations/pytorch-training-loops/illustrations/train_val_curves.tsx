import type { ThemeMode } from 'vizmatic'
import { Figure } from '../../../../../tools/illustrations/lib/plot-kit'
import { train } from './next_char_run'

export const width = 560
export const height = 430
export const alt =
    'Training and validation loss for a small next-character model over 1,000 steps. Training loss falls steadily from 3.04 to 1.03. Validation loss falls with it at first, reaches its lowest value of 2.11 near step 111, and then rises to about 2.39 as the model keeps memorizing its training text. The best checkpoint is marked at the validation minimum.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue'),
        warm = fig.tone('warm'),
        red = fig.tone('critical')
    const { history, best } = train()
    const plot = fig.plot(
        { x: 64, y: 100, width: 462, height: 260 },
        { x: [0, 1000], y: [0.8, 3.2] },
    )
    plot.axes({
        xTicks: [0, 250, 500, 750, 1000],
        yTicks: [1, 2, 3],
        grid: true,
        format: String,
        labelSize: 18,
    })
    fig.text(64, 24, `Best validation: step ${best.step}`, { size: 24, color: red, weight: 600 })
    fig.text(64, 60, `Loss ${best.val.toFixed(2)} nats per character`, {
        size: 20,
        color: c.textSecondary,
    })
    fig.text(295, 408, 'Training step', { size: 20, color: c.textSecondary, align: 'center' })
    fig.rect(plot.px(best.step), plot.area.y, plot.right - plot.px(best.step), plot.area.height, {
        fill: red,
        opacity: 0.05,
    })
    plot.curve(
        history.map(({ step, val }) => [step, val] as const),
        { color: warm, width: 2.5 },
    )
    plot.curve(
        history.map(({ step, train: loss }) => [step, loss] as const),
        { color: blue, width: 2.5 },
    )
    fig.line(plot.px(best.step), plot.area.y, plot.px(best.step), plot.bottom, {
        color: red,
        width: 1.25,
        dash: '4 4',
    })
    plot.point(best.step, best.val, { color: red, r: 5.5 })
    fig.text(plot.px(1000), plot.py(2.63), 'Validation', {
        size: 22,
        color: warm,
        weight: 600,
        align: 'right',
    })
    fig.text(plot.px(1000), plot.py(1.27), 'Training', {
        size: 22,
        color: blue,
        weight: 600,
        align: 'right',
    })
    return fig.render()
}
