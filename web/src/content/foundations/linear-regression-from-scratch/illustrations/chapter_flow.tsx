import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 860
export const height = 395
export const alt =
    'Side-by-side view of five latency observations and their enlarged residuals. Left: observed latency from 118 to 198 ms sits tight against the fitted line y-hat = 100 + 20x (R-squared = 0.9965), with dashed extrapolation segments to x = 0 and x = 6. Right: enlarged signed residuals (-2, +1, +2, +1, -2 ms) reveal a clear curved arch that the straight line cannot capture.'

const ROWS = [
    { x: 1, y: 118, yHat: 120, res: -2 },
    { x: 2, y: 141, yHat: 140, res: 1 },
    { x: 3, y: 162, yHat: 160, res: 2 },
    { x: 4, y: 181, yHat: 180, res: 1 },
    { x: 5, y: 198, yHat: 200, res: -2 },
] as const

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const purple = fig.tone('purple')
    const cyan = fig.tone('cyan')
    const isLight = theme === 'light'

    // Left: Observed latency + fitted line + dashed extrapolation zones
    fig.text(64, 22, 'Fitted line looks nearly exact', { size: 15, weight: 700 })

    const left = fig.plot(
        { x: 64, y: 56, width: 356, height: 274 },
        { x: [0, 6], y: [95, 225] },
    )

    // Subtle shaded extrapolation bands outside observed support [1, 5]
    fig.rect(left.px(0), left.area.y, left.px(1) - left.px(0), left.area.height, {
        fill: tint(warm, c.bg, isLight ? 0.08 : 0.12),
    })
    fig.rect(left.px(5), left.area.y, left.px(6) - left.px(5), left.area.height, {
        fill: tint(warm, c.bg, isLight ? 0.08 : 0.12),
    })

    left.axes({
        xTicks: [0, 1, 2, 3, 4, 5, 6],
        yTicks: [100, 140, 180, 220],
        xLabel: 'Context x (100-token units)',
        yLabel: 'Latency y (ms)',
        grid: true,
        labelSize: 13,
    })

    // Extrapolation segments (dashed warm) + in-support line (solid green)
    left.fn((x) => 100 + 20 * x, { color: warm, width: 2, dash: '5 4' }, 2, [0, 1])
    left.fn((x) => 100 + 20 * x, { color: green, width: 2.8 }, 2, [1, 5])
    left.fn((x) => 100 + 20 * x, { color: warm, width: 2, dash: '5 4' }, 2, [5, 6])

    for (const r of ROWS) {
        left.point(r.x, r.y, { color: blue, r: 5.5 })
    }
    left.point(0, 100, { color: warm, r: 4, ring: true })
    left.point(6, 220, { color: warm, r: 4, ring: true })

    // Formula and R^2 cleanly in top-left open space
    fig.text(left.px(1.2), left.py(212), 'ŷ = 100 + 20x', {
        size: 15,
        weight: 700,
        color: green,
    })
    fig.text(left.px(1.2), left.py(196), 'R² = 0.9965 · MSE = 2.8', {
        size: 12,
        weight: 600,
        color: c.textSecondary,
        mono: true,
    })
    fig.text(left.px(5.5), left.py(110), 'extrap.', {
        size: 11,
        weight: 600,
        color: warm,
        align: 'center',
    })

    // Vertical divider
    fig.line(446, 30, 446, 366, { color: c.borderSubtle, width: 1 })

    // Right: Enlarged signed residuals exposing the curved arch
    fig.text(508, 22, 'Enlarged residuals expose a curved arch', { size: 15, weight: 700 })

    const right = fig.plot(
        { x: 508, y: 56, width: 326, height: 274 },
        { x: [0.5, 5.5], y: [-3.6, 3.2] },
    )
    right.axes({
        xTicks: [1, 2, 3, 4, 5],
        yTicks: [-2, -1, 0, 1, 2],
        yFormat: (v) => (v > 0 ? `+${v}` : String(v)),
        xLabel: 'Context x (100-token units)',
        yLabel: 'Residual y − ŷ (ms)',
        grid: true,
        labelSize: 13,
    })

    // Zero baseline (the straight line)
    fig.line(right.area.x, right.py(0), right.right, right.py(0), {
        color: green,
        width: 2,
    })

    // Smooth purple arch curve through the 5 residuals so the bend jumps out
    right.smoothCurve(
        ROWS.map((r) => [r.x, r.res] as const),
        { color: purple, width: 2.2, dash: '5 4' },
    )

    // Lollipop stems, points, and crisp signed labels
    for (const r of ROWS) {
        const tone = r.res > 0 ? cyan : warm
        const px = right.px(r.x)
        const py0 = right.py(0)
        const pyV = right.py(r.res)
        fig.line(px, py0, px, pyV, { color: tone, width: 3 })
        fig.circle(px, pyV, 6.5, { fill: tone, stroke: c.bg, width: 2 })
        fig.text(px, pyV + (r.res > 0 ? -18 : 19), r.res > 0 ? `+${r.res}` : `−${Math.abs(r.res)}`, {
            size: 14,
            weight: 700,
            color: tone,
            align: 'center',
            mono: true,
        })
    }

    fig.text(right.px(3), right.py(-3.2), 'Residuals sum to 0 yet form a quadratic bend', {
        size: 12,
        weight: 600,
        color: purple,
        align: 'center',
    })

    return fig.render()
}

export default create
