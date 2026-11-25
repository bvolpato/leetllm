import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 740
export const height = 435
export const alt =
    'Log-log map of the fitted scaling surface L(N, D) = 1.10 + 2.80 N^(-0.070) + 7.80 D^(-0.098) with smooth hyperbolic iso-loss contours from 2.80 down to 2.10. Eight small proxy runs inside the 0.1B-1B parameters by 1B-20B tokens fit region determine the surface; a held-out run at 1B parameters and 100B tokens matches at 2.408 (residual +0.0002), and the extrapolated forecast at 70B parameters and 1.4T tokens is 2.091.'

// Exact Chinchilla parametric law fitted in the lesson code
const E = 1.1
const A = 2.8
const B = 7.8
const ALPHA = 0.07
const BETA = 0.098

const experiments = [
    { nB: 0.1, dB: 1, loss: 2.895 },
    { nB: 0.1, dB: 5, loss: 2.745 },
    { nB: 0.1, dB: 20, loss: 2.634 },
    { nB: 0.5, dB: 1, loss: 2.813 },
    { nB: 0.5, dB: 5, loss: 2.663 },
    { nB: 0.5, dB: 20, loss: 2.552 },
    { nB: 1, dB: 5, loss: 2.631 },
    { nB: 1, dB: 20, loss: 2.52 },
]
const heldOut = { nB: 1, dB: 100, pred: 2.408, obs: 2.408, residual: '+0.0002' }
const target = { nB: 70, dB: 1400, forecast: 2.091 }

/** Solve D (in billions) for a given N (in billions) along iso-loss contour L(N, D) = level. */
function contourD(nB: number, level: number): number | null {
    const nTerm = A * (nB * 1e9) ** -ALPHA
    const rem = level - E - nTerm
    if (rem <= 1e-6) return null
    const dRaw = (B / rem) ** (1 / BETA)
    return dRaw / 1e9
}

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const cyan = fig.tone('cyan')

    const xRange: readonly [number, number] = [0.055, 190]
    const yRange: readonly [number, number] = [0.55, 3400]

    const plot = fig.plot(
        { x: 68, y: 38, width: 422, height: 334 },
        { x: xRange, y: yRange, xScale: 'log', yScale: 'log' },
    )

    plot.logAxes({
        xTicks: [0.1, 1, 10, 100],
        yTicks: [1, 10, 100, 1000],
        xFormat: (v) => (v === 0.1 ? '0.1B' : `${v}B`),
        yFormat: (v) => (v === 1000 ? '1T' : `${v}B`),
        xLabel: 'Parameters N (log scale)',
        yLabel: 'Training tokens D (log scale)',
        labelSize: 14,
        grid: true,
    })

    // Analytical iso-loss contours of the fitted surface
    const contourLevels = [
        { level: 2.8, label: '2.80', emphasized: false },
        { level: 2.65, label: '2.65', emphasized: false },
        { level: 2.5, label: '2.50', emphasized: false },
        { level: 2.408, label: '2.41', emphasized: true, tone: green },
        { level: 2.25, label: '2.25', emphasized: false },
        { level: 2.091, label: '2.09', emphasized: true, tone: warm },
    ]

    const logXMin = Math.log10(xRange[0])
    const logXMax = Math.log10(xRange[1])
    for (const item of contourLevels) {
        const pts: [number, number][] = []
        for (let i = 0; i <= 220; i++) {
            const nB = 10 ** (logXMin + ((logXMax - logXMin) * i) / 220)
            const dB = contourD(nB, item.level)
            if (dB !== null && dB >= yRange[0] && dB <= yRange[1]) {
                pts.push([nB, dB])
            }
        }
        if (pts.length > 2) {
            plot.curve(pts, {
                color: item.emphasized ? item.tone! : cyan,
                width: item.emphasized ? 1.8 : 1.15,
                opacity: item.emphasized ? 0.8 : 0.45,
                dash: item.emphasized ? undefined : '4 3',
            })
            // Label cleanly near the right end of each contour inside the plot
            const last = pts[pts.length - 1]!
            const lx = plot.px(last[0]) - 6
            const ly = plot.py(last[1]) + (item.label === '2.09' ? 14 : -13)
            if (ly > plot.area.y + 12 && ly < plot.bottom - 10) {
                fig.text(lx, ly, item.label, {
                    size: 13,
                    color: item.emphasized ? item.tone! : c.textSecondary,
                    align: 'right',
                    mono: true,
                    weight: item.emphasized ? 700 : 500,
                })
            }
        }
    }

    // Shaded proxy fit region (0.1B..1B x 1B..20B)
    const fx1 = plot.px(0.1)
    const fx2 = plot.px(1)
    const fyTop = plot.py(20)
    const fyBot = plot.py(1)
    fig.rect(fx1 - 6, fyTop - 6, fx2 - fx1 + 12, fyBot - fyTop + 12, {
        fill: tint(blue, c.bg, theme === 'dark' ? 0.16 : 0.12),
        stroke: blue,
        strokeWidth: 1.5,
        radius: 6,
    })
    fig.text(fx1 - 2, fyTop - 18, 'Fit grid (8 runs)', {
        size: 13.5,
        color: blue,
        weight: 700,
    })

    // Subtle dashed extrapolation arrow from holdout to target
    fig.arrow(
        plot.px(heldOut.nB) + 8,
        plot.py(heldOut.dB) - 6,
        plot.px(target.nB) - 9,
        plot.py(target.dB) + 6,
        { color: c.textMuted, width: 1.5, dash: '4 4', head: 6 },
    )

    // Plot the 8 proxy fit points
    for (const run of experiments) {
        fig.circle(plot.px(run.nB), plot.py(run.dB), 4.8, {
            fill: blue,
            stroke: c.bg,
            width: 1.6,
        })
    }

    // Held-out verification point
    const hx = plot.px(heldOut.nB)
    const hy = plot.py(heldOut.dB)
    fig.circle(hx, hy, 7, { fill: green, stroke: c.bg, width: 2.2 })
    fig.text(hx + 12, hy + 4, 'Holdout 1B / 100B', {
        size: 13.5,
        color: green,
        weight: 700,
    })

    // Target forecast point
    const tx = plot.px(target.nB)
    const ty = plot.py(target.dB)
    fig.circle(tx, ty, 7.5, { fill: warm, stroke: c.bg, width: 2.2 })
    fig.text(tx - 12, ty + 16, 'Target 70B / 1.4T', {
        size: 13.5,
        color: warm,
        align: 'right',
        weight: 700,
    })

    // Right column: frameless fitted model + verification readouts
    const rx = 514
    const rw = 212

    fig.text(rx, 46, 'Fitted loss surface', {
        size: 15,
        color: c.textPrimary,
        weight: 700,
    })
    fig.math(rx, 76, String.raw`L = E + A N^{-\alpha} + B D^{-\beta}`, {
        size: 13.5,
        color: c.textPrimary,
        align: 'left',
    })
    fig.text(rx, 102, 'α = 0.070 · β = 0.098', {
        size: 13.5,
        color: cyan,
        mono: true,
        weight: 600,
    })
    fig.line(rx, 120, rx + rw, 120, { color: c.borderSubtle, width: 1 })

    // Fit grid block
    fig.circle(rx + 6, 148, 5, { fill: blue })
    fig.text(rx + 18, 148, 'Proxy fit (8 runs)', { size: 14, color: blue, weight: 700 })
    fig.text(rx + 18, 170, 'N: 0.1B–1B · D: 1B–20B', {
        size: 13,
        color: c.textSecondary,
        mono: true,
    })
    fig.text(rx + 18, 190, 'L: 2.895 → 2.520', {
        size: 13,
        color: c.textSecondary,
        mono: true,
    })

    // Holdout block
    fig.circle(rx + 6, 232, 5.5, { fill: green })
    fig.text(rx + 18, 232, 'Holdout check', { size: 14, color: green, weight: 700 })
    fig.text(rx + 18, 254, '1B params · 100B tok', {
        size: 13,
        color: c.textSecondary,
        mono: true,
    })
    fig.text(rx + 18, 274, `pred ${heldOut.pred.toFixed(3)} · obs ${heldOut.obs.toFixed(3)}`, {
        size: 13,
        color: c.textPrimary,
        mono: true,
        weight: 600,
    })
    fig.text(rx + 18, 294, `residual ${heldOut.residual}`, {
        size: 13,
        color: green,
        mono: true,
        weight: 600,
    })

    // Target forecast block
    fig.circle(rx + 6, 336, 6, { fill: warm })
    fig.text(rx + 18, 336, 'Target forecast', { size: 14, color: warm, weight: 700 })
    fig.text(rx + 18, 358, '70B params · 1.4T tok', {
        size: 13,
        color: c.textSecondary,
        mono: true,
    })
    fig.text(rx + 18, 378, `L = ${target.forecast.toFixed(3)}`, {
        size: 14.5,
        color: warm,
        mono: true,
        weight: 700,
    })

    return fig.render()
}

export default create('dark')
