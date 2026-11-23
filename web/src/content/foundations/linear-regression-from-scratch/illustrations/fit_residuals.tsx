import type { ThemeMode } from 'vizmatic'
import { Figure } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 560
export const height = 610
export const alt =
    'Five measured requests plotted as latency in milliseconds against retrieved context in hundreds of tokens, with the line 100 plus 20 x through them. Vertical gaps mark each residual. A dashed extension predicts 220 milliseconds at 600 tokens. The plot below enlarges the residuals: minus 2, plus 1, plus 2, plus 1, minus 2, an arch that a straight line cannot follow.'

const data: readonly (readonly [number, number])[] = [
    [1, 118],
    [2, 141],
    [3, 162],
    [4, 181],
    [5, 198],
]
const line = (x: number) => 100 + 20 * x

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue'),
        red = fig.tone('critical'),
        muted = c.textMuted
    const main = fig.plot({ x: 64, y: 60, width: 450, height: 230 }, { x: [0, 6.5], y: [90, 235] })
    main.axes({
        xTicks: [0, 1, 2, 3, 4, 5, 6],
        yTicks: [100, 140, 180, 220],
        grid: true,
        labelSize: 18,
    })
    fig.text(64, 25, 'Latency (ms)', { size: 22, weight: 600 })
    fig.text(514, 25, 'ŷ = 100 + 20x', { size: 22, color: blue, align: 'right' })
    main.fn(line, { color: blue, width: 2.25 }, 2, [0, 5])
    main.fn(line, { color: blue, width: 2, dash: '5 5' }, 2, [5, 6])
    for (const [x, y] of data) {
        fig.line(main.px(x), main.py(y), main.px(x), main.py(line(x)), { color: red, width: 2 })
        main.point(x, y, { color: c.textPrimary, r: 4.5 })
    }
    main.point(6, 220, { color: blue, ring: true, r: 5 })
    fig.text(main.px(6) - 10, main.py(220) - 20, '220 ms', {
        size: 20,
        color: blue,
        align: 'right',
        weight: 600,
    })

    const side = fig.plot({ x: 64, y: 420, width: 450, height: 120 }, { x: [0, 6.5], y: [-3, 3] })
    fig.text(64, 370, 'Residuals · actual − fitted (ms)', { weight: 600, size: 22 })
    side.axes({
        xTicks: [1, 2, 3, 4, 5],
        yTicks: [-2, 0, 2],
        yFormat: (v) => (v > 0 ? `+${v}` : String(v)),
        labelSize: 18,
    })
    fig.text(289, 585, 'Context (100-token units)', {
        color: c.textSecondary,
        align: 'center',
        size: 20,
    })
    fig.line(side.area.x, side.py(0), side.right, side.py(0), { color: muted, width: 1 })
    const residuals = data.map(([x, y]) => [x, y - line(x)] as const)
    side.curve(residuals, { color: red, width: 1.5, dash: '3 4' })
    for (const [x, y] of residuals) {
        fig.line(side.px(x), side.py(0), side.px(x), side.py(y), { color: red, width: 2 })
        side.point(x, y, { color: red, r: 4 })
    }
    return fig.render()
}
