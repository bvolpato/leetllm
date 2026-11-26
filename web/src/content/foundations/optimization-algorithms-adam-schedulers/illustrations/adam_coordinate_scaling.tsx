import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'
export { createFilm } from './_parts/adam-film'

export const width = 780
export const height = 415
export const alt =
    'Adam replays four gradients from zero moments with learning rate 0.01, beta1 0.9, and beta2 0.999. Left: magnitude plot shows coordinate a updates 0.01, 0.00058, 0.00346, 0.00041 while b stays near 0.01. Right: at step 4, corrected direction 3.228 divided by scale 78.882 times 0.01 gives a step near 0.00041, while direction 0.967 divided by scale 0.970 gives b a step near 0.00997, about 24.4 times a.'

const GRADIENTS = [
    [100, 1],
    [-80, 0.98],
    [70, 0.96],
    [-60, 0.94],
] as const

function replay() {
    const m = [0, 0]
    const v = [0, 0]
    return GRADIENTS.map((g, i) => {
        const t = i + 1
        for (let j = 0; j < 2; j++) {
            m[j] = 0.9 * m[j]! + 0.1 * g[j]!
            v[j] = 0.999 * v[j]! + 0.001 * g[j]! ** 2
        }
        const direction = m.map((n) => n / (1 - 0.9 ** t))
        const scale = v.map((n) => Math.sqrt(n / (1 - 0.999 ** t)))
        return {
            direction,
            scale,
            step: direction.map((n, j) => (0.01 * n) / (scale[j]! + 1e-8)),
        }
    })
}

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const purple = fig.tone('purple')
    const cyan = fig.tone('cyan')
    const history = replay()
    const final = history[3]!

    // ─── LEFT PANEL: STEP MAGNITUDE ACROSS 4 STEPS ───
    fig.text(24, 20, 'Subtracted step magnitude across 4 steps', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
    })
    fig.text(24, 42, 'lr = 0.01 · β₁ = 0.9 · β₂ = 0.999', {
        size: 12.5,
        color: c.textSecondary,
        mono: true,
    })

    // Compact aligned gradient strip above the plot
    const plot = fig.plot(
        { x: 74, y: 126, width: 326, height: 214 },
        { x: [0.85, 4.35], y: [0, 0.0112] },
    )
    fig.text(56, 74, 'g(a)', { size: 12.5, weight: 700, color: purple, mono: true, align: 'right' })
    fig.text(56, 98, 'g(b)', { size: 12.5, weight: 700, color: cyan, mono: true, align: 'right' })
    GRADIENTS.forEach((g, i) => {
        const gx = plot.px(i + 1)
        fig.text(gx, 74, g[0] > 0 ? `+${g[0]}` : String(g[0]), {
            size: 12.5,
            weight: 700,
            color: purple,
            mono: true,
            align: 'center',
        })
        fig.text(gx, 98, String(g[1]), {
            size: 12.5,
            weight: 700,
            color: cyan,
            mono: true,
            align: 'center',
        })
    })

    plot.axes({
        xTicks: [1, 2, 3, 4],
        yTicks: [0, 0.005, 0.01],
        yFormat: (v) => v.toFixed(3),
        xLabel: 'Optimizer step t',
        grid: true,
        labelSize: 12,
    })

    // Series curves
    const ptsA = history.map((row, i) => [i + 1, Math.abs(row.step[0]!)] as const)
    const ptsB = history.map((row, i) => [i + 1, Math.abs(row.step[1]!)] as const)
    plot.curve(ptsB, { color: cyan, width: 2.75 })
    plot.curve(ptsA, { color: purple, width: 2.75 })
    ptsB.forEach(([x, y]) => plot.point(x, y, { color: cyan, r: 5 }))
    ptsA.forEach(([x, y]) => plot.point(x, y, { color: purple, r: 5 }))

    // Direct endpoint annotations at step 4
    fig.text(plot.px(4) + 8, plot.py(Math.abs(final.step[1]!)) - 2, '0.00997', {
        size: 12,
        weight: 700,
        color: cyan,
        mono: true,
    })
    fig.text(plot.px(4) + 8, plot.py(Math.abs(final.step[0]!)) - 8, '0.00041', {
        size: 12,
        weight: 700,
        color: purple,
        mono: true,
    })

    // Legend cleanly tucked below axis
    fig.circle(86, 396, 5, { fill: purple })
    fig.text(98, 396, 'a · alternating signs', { size: 12.5, weight: 600, color: purple })
    fig.circle(254, 396, 5, { fill: cyan })
    fig.text(266, 396, 'b · steady sign', { size: 12.5, weight: 600, color: cyan })

    // Subtle vertical divider
    fig.line(446, 20, 446, 396, { color: c.borderSubtle, width: 1 })

    // ─── RIGHT PANEL: STEP 4 BIAS-CORRECTED RATIO (REAL TeX) ───
    const rx = 472
    fig.text(rx, 20, 'Step 4 · direction / RMS scale', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
    })
    fig.text(rx, 42, 'Bias-corrected moments × lr (0.01)', {
        size: 12.5,
        color: c.textSecondary,
    })

    // Coordinate a breakdown
    fig.rect(rx, 76, 4, 88, { fill: purple, radius: 2 })
    fig.text(rx + 14, 88, 'Coordinate a (oscillating)', {
        size: 13.5,
        weight: 700,
        color: purple,
    })
    fig.math(
        rx + 14,
        126,
        String.raw`0.01 \times \frac{${final.direction[0]!.toFixed(3)}}{${final.scale[0]!.toFixed(3)}} = ${final.step[0]!.toFixed(5)}`,
        { size: 16, color: c.textPrimary },
    )
    fig.text(rx + 14, 156, 'Numerator cancels · denominator stays huge', {
        size: 11.5,
        color: c.textSecondary,
    })

    // Coordinate b breakdown
    fig.rect(rx, 194, 4, 88, { fill: cyan, radius: 2 })
    fig.text(rx + 14, 206, 'Coordinate b (consistent sign)', {
        size: 13.5,
        weight: 700,
        color: cyan,
    })
    fig.math(
        rx + 14,
        244,
        String.raw`0.01 \times \frac{${final.direction[1]!.toFixed(3)}}{${final.scale[1]!.toFixed(3)}} = ${final.step[1]!.toFixed(5)}`,
        { size: 16, color: c.textPrimary },
    )
    fig.text(rx + 14, 274, 'Direction ≈ scale · step stays near lr', {
        size: 11.5,
        color: c.textSecondary,
    })

    // Ratio highlight badge
    const ratio = (final.step[1]! / final.step[0]!).toFixed(1)
    fig.rect(rx, 314, 286, 66, {
        fill: tint(cyan, c.bg, theme === 'dark' ? 0.14 : 0.08),
        stroke: c.borderSubtle,
        strokeWidth: 1,
        radius: 9,
    })
    fig.text(rx + 143, 336, `b step / a step ≈ ${ratio}×`, {
        size: 16,
        weight: 700,
        color: cyan,
        mono: true,
        align: 'center',
    })
    fig.text(rx + 143, 360, 'Adam damps noisy coordinates automatically', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
    })

    return fig.render()
}

export default create('dark')
