import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 840
export const height = 425
export const alt =
    'Side-by-side gradient descent geometry for linear regression. Left: equal-MSE contour ellipses over intercept b and slope w form a narrow diagonal valley (condition number 70); gradient descent starts at (0, 0), drops steeply across the valley wall, and crawls along the floor to the minimum at (100, 20). Right: log-scale MSE versus step drops sharply in early steps, then declines slowly to the 2.8 floor.'

const X = [1, 2, 3, 4, 5]
const Y = [118, 141, 162, 181, 198]
const n = X.length
const mse = (b: number, w: number) => X.reduce((sum, x, i) => sum + (w * x + b - Y[i]!) ** 2, 0) / n

function run(steps: number, rate: number) {
    let b = 0
    let w = 0
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

function contour(level: number): [number, number][] {
    const out: [number, number][] = []
    for (let i = 0; i <= 720; i++) {
        const angle = (i / 720) * Math.PI * 2
        const ub = Math.cos(angle)
        const uw = Math.sin(angle)
        const unit = mse(100 + ub, 20 + uw) - mse(100, 20)
        const r = Math.sqrt((level - mse(100, 20)) / unit)
        out.push([100 + ub * r, 20 + uw * r])
    }
    return out
}

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const red = fig.tone('critical')
    const isLight = theme === 'light'

    const path = run(600, 0.05)

    // Left: MSE contours + descent trajectory
    fig.text(68, 22, 'MSE contours & descent path (κ ≈ 70)', { size: 15, weight: 700 })

    const left = fig.plot(
        { x: 68, y: 58, width: 344, height: 294 },
        { x: [-10, 125], y: [-5, 55] },
    )
    left.axes({
        xTicks: [0, 50, 100],
        yTicks: [0, 20, 40],
        xLabel: 'Intercept b',
        yLabel: 'Slope w',
        labelSize: 13,
    })

    // Brighter, high-legibility contour ellipses in both light and dark modes
    const contourLevels = [12, 60, 300, 1500, 7000]
    contourLevels.forEach((level, idx) => {
        const weight = 0.25 + (idx / contourLevels.length) * 0.28
        const strokeColor = tint(c.textSecondary, c.bg, isLight ? weight + 0.12 : weight + 0.24)
        let runPts: (readonly [number, number])[] = []
        for (const [b, w] of contour(level)) {
            if (b >= -10 && b <= 125 && w >= -5 && w <= 55) {
                runPts.push([left.px(b), left.py(w)])
            } else {
                if (runPts.length > 1) fig.polyline(runPts, { color: strokeColor, width: 1.3 })
                runPts = []
            }
        }
        if (runPts.length > 1) fig.polyline(runPts, { color: strokeColor, width: 1.3 })
    })

    const steps = path.filter((_, i) => i < 8 || i % 10 === 0)
    left.curve(
        steps.map(([b, w]) => [b, w] as const),
        { color: blue, width: 2.2 },
    )
    for (const [b, w] of steps.slice(0, 7)) left.point(b, w, { color: blue, r: 3 })

    left.point(0, 0, { color: blue, r: 6 })
    fig.text(left.px(0) + 10, left.py(0) + 4, 'Start (0, 0)', {
        size: 13,
        color: blue,
        weight: 700,
    })

    left.point(100, 20, { color: red, r: 6 })
    fig.callout([left.px(100) - 5, left.py(20) + 5], [left.px(86), left.py(4)], 'Optimum (100, 20)', {
        color: red,
        labelColor: red,
        align: 'right',
        size: 13,
        weight: 700,
        bend: 0.14,
    })
    fig.callout([left.px(16), left.py(52)], [left.px(52), left.py(47)], 'Step 1: (16, 52)', {
        color: blue,
        labelColor: blue,
        align: 'left',
        size: 12,
        weight: 600,
        bend: -0.15,
    })

    // Vertical divider
    fig.line(438, 30, 438, 392, { color: c.borderSubtle, width: 1 })

    // Right: Log-scale MSE versus step using Plot.logAxes
    fig.text(508, 22, 'Loss per step (α = 0.05, log scale)', { size: 15, weight: 700 })

    const right = fig.plot(
        { x: 508, y: 58, width: 308, height: 294 },
        { x: [0, 600], y: [1, 50000], yScale: 'log' },
    )
    right.logAxes({
        xTicks: [0, 200, 400, 600],
        yTicks: [1, 10, 100, 1000, 10000],
        minorGrid: true,
        xLabel: 'Gradient-descent step',
        yLabel: 'MSE (log scale)',
        labelSize: 13,
    })

    right.curve(
        path.map(([, , loss], i) => [i, loss] as const),
        { color: blue, width: 2.5 },
    )

    // Minimum MSE floor at 2.8
    right.hline(2.8, 'Minimum MSE = 2.8', {
        color: red,
        dash: '5 4',
        width: 1.5,
        labelPosition: 'right',
        labelOffset: 11,
        labelSize: 12,
        weight: 700,
    })

    // Step 1 and Step 100 markers
    right.point(1, path[1]![2], { color: blue, r: 4.5 })
    fig.callout([right.px(1) + 5, right.py(path[1]![2])], [right.px(130), right.py(4200)], 'Step 1: 2,195', {
        color: blue,
        labelColor: blue,
        align: 'left',
        size: 12,
        weight: 600,
        bend: -0.15,
    })

    right.point(100, path[100]![2], { color: blue, r: 4.5 })
    fig.callout([right.px(100) + 5, right.py(path[100]![2]) - 4], [right.px(230), right.py(180)], 'Step 100: 49.1', {
        color: c.textSecondary,
        labelColor: c.textPrimary,
        align: 'left',
        size: 12,
        weight: 600,
        bend: -0.14,
    })

    return fig.render()
}

export default create
