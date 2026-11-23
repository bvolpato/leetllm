import type { ThemeMode } from 'vizmatic'
import { Figure } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 560
export const height = 750
export const alt =
    'Above: contour lines of mean squared error over intercept and slope form a long diagonal valley. A gradient descent path starts at intercept 0 and slope 0, jumps across the valley in a few steps, then crawls along it toward the minimum at intercept 100 and slope 20. Below: the loss of the same run against step number on a log scale. It falls by a large factor in the first few steps and then declines slowly, reaching 2.8 by about 500 steps.'

const X = [1, 2, 3, 4, 5],
    Y = [118, 141, 162, 181, 198]
const n = X.length
const mse = (b: number, w: number) => X.reduce((sum, x, i) => sum + (w * x + b - Y[i]!) ** 2, 0) / n
function run(steps: number, rate: number) {
    let b = 0,
        w = 0
    const path: [number, number, number][] = [[b, w, mse(b, w)]]
    for (let step = 0; step < steps; step++) {
        const gb = X.reduce((sum, x, i) => sum + 2 * (w * x + b - Y[i]!), 0) / n
        const gw = X.reduce((sum, x, i) => sum + 2 * (w * x + b - Y[i]!) * x, 0) / n
        b -= rate * gb
        w -= rate * gw
        path.push([b, w, mse(b, w)])
    }
    return path
}

/** A level set of this quadratic loss, traced by walking around the minimum. */
function contour(level: number): [number, number][] {
    const out: [number, number][] = []
    for (let i = 0; i <= 720; i++) {
        const angle = (i / 720) * Math.PI * 2
        const ub = Math.cos(angle),
            uw = Math.sin(angle)
        // Excess loss grows with the square of the distance along any direction from the minimum.
        const unit = mse(100 + ub, 20 + uw) - mse(100, 20)
        const r = Math.sqrt((level - mse(100, 20)) / unit)
        out.push([100 + ub * r, 20 + uw * r])
    }
    return out
}

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue'),
        red = fig.tone('critical')
    const path = run(600, 0.05)
    const left = fig.plot({ x: 70, y: 70, width: 450, height: 235 }, { x: [-10, 125], y: [-5, 55] })
    left.axes({
        xTicks: [0, 50, 100],
        yTicks: [0, 20, 40],
        xLabel: 'Intercept b',
        yLabel: 'Slope w',
        labelSize: 18,
    })
    fig.text(70, 22, 'MSE contours and descent path', { size: 22, weight: 600 })
    for (const level of [12, 60, 300, 1500, 7000]) {
        // Each contour leaves the plot and comes back, so it draws as separate runs.
        let run_: (readonly [number, number])[] = []
        for (const [b, w] of contour(level)) {
            if (b >= -10 && b <= 125 && w >= -5 && w <= 55) run_.push([left.px(b), left.py(w)])
            else {
                if (run_.length > 1) fig.polyline(run_, { color: c.borderLight, width: 1 })
                run_ = []
            }
        }
        if (run_.length > 1) fig.polyline(run_, { color: c.borderLight, width: 1 })
    }
    const steps = path.filter((_, i) => i < 8 || i % 10 === 0)
    left.curve(
        steps.map(([b, w]) => [b, w] as const),
        { color: blue, width: 1.75 },
    )
    for (const [b, w] of steps.slice(0, 8)) left.point(b, w, { color: blue, r: 2.75 })
    left.point(0, 0, { color: blue, r: 5 })
    fig.text(left.px(0) + 10, left.py(0) + 11, 'Start', { size: 20, color: blue, weight: 600 })
    left.point(100, 20, { color: red, r: 5 })
    fig.text(left.px(100) + 4, left.py(20) + 23, 'Best line', {
        size: 20,
        color: red,
        weight: 600,
        align: 'center',
    })

    const right = fig.plot({ x: 70, y: 440, width: 450, height: 230 }, { x: [0, 600], y: [0, 5] })
    fig.text(70, 385, 'The same run, step by step', { size: 22, weight: 600 })
    const logTicks = [1, 10, 100, 1000, 10000]
    right.axes({
        xTicks: [0, 200, 400, 600],
        xLabel: 'Step',
        yLabel: 'Loss (MSE, log scale)',
        labelSize: 18,
    })
    for (const tick of logTicks) {
        const y = Math.log10(tick)
        fig.line(right.area.x, right.py(y), right.right, right.py(y), {
            color: c.borderSubtle,
            width: 1,
        })
        fig.text(right.area.x - 8, right.py(y), tick >= 1000 ? `${tick / 1000}k` : String(tick), {
            size: 18,
            color: c.textSecondary,
            align: 'right',
            mono: true,
        })
    }
    right.curve(
        path.map(([, , loss], i) => [i, Math.log10(loss)] as const),
        { color: blue, width: 2 },
    )
    const floor = Math.log10(2.8)
    fig.line(right.area.x, right.py(floor), right.right, right.py(floor), {
        color: red,
        width: 1.25,
        dash: '4 4',
    })
    fig.text(right.right, right.py(floor) - 22, 'Minimum: 2.8', {
        size: 20,
        color: red,
        align: 'right',
    })
    return fig.render()
}
