import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 740
export const height = 405
export const alt =
    'Left: log-compute plot of L(C) = 2 + C^(-0.05) across five equal 3.16x compute steps from 1x to 100x, with losses 3.000, 2.944, 2.891, 2.841, and 2.794 and step-drop markers between them. Right: horizontal bars on a shared 0.060 scale showing each successive loss drop shrinking from 0.056 to 0.053, 0.050, and 0.047.'

const compute = [1, 10 ** 0.5, 10, 10 ** 1.5, 100]
const lossFn = (cVal: number) => 2 + cVal ** -0.05
const losses = compute.map(lossFn)
const drops = losses.slice(0, -1).map((l, i) => l - losses[i + 1]!)
const stepLabels = ['1× → 3.16×', '3.16× → 10×', '10× → 31.6×', '31.6× → 100×']

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const warm = fig.tone('warm')

    // Left: log-compute power-law curve with staircase loss drops
    const left = fig.plot(
        { x: 64, y: 42, width: 392, height: 294 },
        { x: [0.8, 130], y: [2.75, 3.05], xScale: 'log', yScale: 'linear' },
    )

    left.logAxes({
        xTicks: compute,
        yTicks: [2.8, 2.9, 3.0],
        xFormat: (v) =>
            v === 1
                ? '1×'
                : v < 5
                  ? '3.16×'
                  : v === 10
                    ? '10×'
                    : v < 50
                      ? '31.6×'
                      : '100×',
        yFormat: (v) => v.toFixed(1),
        xLabel: 'Compute multiplier C (log scale)',
        yLabel: 'Cross-entropy loss L(C)',
        labelSize: 14,
        grid: true,
    })

    // Subtle shaded fill under the curve
    left.fillArea(lossFn, {
        range: [1, 100],
        baseline: 2.75,
        fill: blue,
        fillOpacity: 0.1,
        samples: 140,
    })

    // Equation in open upper-right corner
    fig.math(left.right - 8, left.area.y + 22, String.raw`L(C) = 2 + C^{-0.05}`, {
        size: 16,
        color: c.textPrimary,
        align: 'right',
    })

    // Staircase step drops between consecutive 3.16x compute steps
    for (let i = 0; i < drops.length; i++) {
        const x1 = left.px(compute[i]!)
        const x2 = left.px(compute[i + 1]!)
        const y1 = left.py(losses[i]!)
        const y2 = left.py(losses[i + 1]!)
        fig.line(x1, y1, x2, y1, { color: warm, width: 1.25, dash: '3 3', opacity: 0.75 })
        fig.line(x2, y1, x2, y2, { color: warm, width: 2.5 })
    }

    // Main smooth curve
    left.fn(lossFn, { color: blue, width: 2.75 }, 180, [1, 100])

    // Anchored points and loss values (placed cleanly below-left of curve, clear of staircase drops)
    compute.forEach((cv, i) => {
        const px = left.px(cv)
        const py = left.py(losses[i]!)
        fig.circle(px, py, 5.5, { fill: blue, stroke: c.bg, width: 2 })
        if (i === 0) {
            fig.text(px + 6, py - 15, losses[i]!.toFixed(3), {
                size: 13.5,
                color: blue,
                align: 'left',
                mono: true,
                weight: 700,
            })
        } else {
            fig.text(px - 4, py + 17, losses[i]!.toFixed(3), {
                size: 13.5,
                color: blue,
                align: 'center',
                mono: true,
                weight: 700,
            })
        }
    })

    // Right: horizontal bars for successive Delta L drops on shared 0..0.065 scale
    const rx = 492
    const rw = 228
    const right = fig.plot({ x: rx, y: 74, width: rw, height: 262 }, { x: [0, 0.065], y: [0, 4] })

    fig.text(rx, 32, 'Loss drop ΔL per ×3.16 step', {
        size: 15,
        color: c.textPrimary,
        weight: 700,
    })
    fig.text(rx, 52, 'Shrinking absolute gain on same scale', {
        size: 13,
        color: c.textSecondary,
    })

    for (const tick of [0, 0.02, 0.04, 0.06]) {
        const tx = right.px(tick)
        fig.line(tx, right.area.y, tx, right.bottom, { color: c.borderSubtle, width: 1 })
        fig.text(tx, right.bottom + 15, tick === 0 ? '0' : tick.toFixed(2), {
            size: 13.5,
            color: c.textSecondary,
            align: 'center',
            mono: true,
        })
    }
    fig.line(rx, right.bottom, rx + rw, right.bottom, { color: c.textMuted, width: 1 })
    fig.text(rx + rw / 2, right.bottom + 36, 'Absolute reduction ΔL (nats)', {
        size: 13.5,
        color: c.textSecondary,
        align: 'center',
    })

    const barH = 22
    drops.forEach((drop, idx) => {
        const rowY = right.py(3.4 - idx * 0.92)
        const barW = right.px(drop) - rx
        fig.text(rx, rowY - 20, stepLabels[idx]!, {
            size: 13.5,
            color: c.textPrimary,
            mono: true,
            weight: 600,
        })
        fig.rect(rx, rowY - barH / 2, barW, barH, {
            fill: tint(warm, c.bg, theme === 'dark' ? 0.38 : 0.26),
            stroke: warm,
            strokeWidth: 1.6,
            radius: 4,
        })
        fig.text(rx + barW - 7, rowY, `−${drop.toFixed(3)}`, {
            size: 13.5,
            color: c.textPrimary,
            align: 'right',
            mono: true,
            weight: 700,
        })
    })

    return fig.render()
}

export default create('dark')
