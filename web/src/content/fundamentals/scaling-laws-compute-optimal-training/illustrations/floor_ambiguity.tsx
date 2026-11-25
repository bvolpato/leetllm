import type { ThemeMode } from 'vizmatic'
import { Figure } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 720
export const height = 415
export const alt =
    'Two power-law curves L(C) = E + K C^(-alpha) both pass identically through L(1)=3.000 and L(100)=2.500. With alpha=0.1, the fitted floor is E=1.645 and L(10^6)=1.985; with alpha=0.2, the floor is E=2.169 and L(10^6)=2.222, a 0.237-nat divergence at 10^6 compute.'

function fit(alpha: number) {
    const k = 0.5 / (1 - 100 ** -alpha)
    const floor = 3 - k
    return {
        alpha,
        k,
        floor,
        loss: (cVal: number) => floor + k * cVal ** -alpha,
    }
}

const fLow = fit(0.1)
const fHigh = fit(0.2)

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const purple = fig.tone('purple')
    const cyan = fig.tone('cyan')
    const warm = fig.tone('warm')

    const plot = fig.plot(
        { x: 68, y: 40, width: 424, height: 310 },
        { x: [0.65, 1.5e6], y: [1.5, 3.15], xScale: 'log', yScale: 'linear' },
    )

    plot.logAxes({
        xTicks: [1, 100, 1e4, 1e6],
        yTicks: [1.5, 2.0, 2.5, 3.0],
        xFormat: (v) =>
            v === 1 ? '1' : v === 100 ? '10²' : v === 1e4 ? '10⁴' : v === 1e6 ? '10⁶' : String(v),
        yFormat: (v) => v.toFixed(1),
        xLabel: 'Compute C (log scale)',
        yLabel: 'Cross-entropy loss L(C)',
        labelSize: 14,
        grid: true,
    })

    // Shade extrapolation divergence band between the two curves for C in [100, 1e6]
    plot.band(fLow.loss, fHigh.loss, {
        range: [100, 1e6],
        samples: 140,
        fill: warm,
        fillOpacity: 0.14,
    })

    // Horizontal asymptotes for both fitted floors E
    fig.line(plot.px(1), plot.py(fLow.floor), plot.px(1.25e6), plot.py(fLow.floor), {
        color: purple,
        width: 1.4,
        dash: '5 4',
        opacity: 0.75,
    })
    fig.line(plot.px(1), plot.py(fHigh.floor), plot.px(1.25e6), plot.py(fHigh.floor), {
        color: cyan,
        width: 1.4,
        dash: '5 4',
        opacity: 0.75,
    })

    // Floor labels cleanly inside left side near asymptotes
    fig.text(plot.px(1.5), plot.py(fHigh.floor) - 11, 'E = 2.169', {
        size: 13.5,
        color: cyan,
        mono: true,
        weight: 600,
    })
    fig.text(plot.px(1.5), plot.py(fLow.floor) - 11, 'E = 1.645', {
        size: 13.5,
        color: purple,
        mono: true,
        weight: 600,
    })

    // Smooth power-law curves over C in [1, 1e6]
    plot.fn(fHigh.loss, { color: cyan, width: 2.75 }, 200, [1, 1e6])
    plot.fn(fLow.loss, { color: purple, width: 2.75 }, 200, [1, 1e6])

    // Shared anchors at C=1 and C=100
    const anchors: readonly [number, number, string][] = [
        [1, 3.0, 'L(1) = 3.00'],
        [100, 2.5, 'L(100) = 2.50'],
    ]
    for (const [cx, cy, lbl] of anchors) {
        fig.circle(plot.px(cx), plot.py(cy), 6, {
            fill: c.textPrimary,
            stroke: c.bg,
            width: 2.2,
        })
        fig.text(plot.px(cx) + 12, plot.py(cy) - 12, lbl, {
            size: 13.5,
            color: c.textPrimary,
            weight: 700,
            mono: true,
        })
    }

    // Forecast markers at C = 1e6
    const yHi = fHigh.loss(1e6)
    const yLo = fLow.loss(1e6)
    const xEnd = plot.px(1e6)
    fig.circle(xEnd, plot.py(yHi), 6, { fill: cyan, stroke: c.bg, width: 2 })
    fig.circle(xEnd, plot.py(yLo), 6, { fill: purple, stroke: c.bg, width: 2 })

    // Vertical divergence indicator between forecasts at C = 10^6
    const gapX = xEnd + 16
    fig.line(gapX, plot.py(yHi), gapX, plot.py(yLo), { color: warm, width: 2 })
    fig.line(gapX - 4, plot.py(yHi), gapX + 4, plot.py(yHi), { color: warm, width: 1.5 })
    fig.line(gapX - 4, plot.py(yLo), gapX + 4, plot.py(yLo), { color: warm, width: 1.5 })

    // Right-hand frameless legend & divergence readout
    const rx = 516
    fig.math(rx, 56, String.raw`L(C) = E + K C^{-\alpha}`, {
        size: 15,
        color: c.textPrimary,
        align: 'left',
    })
    fig.line(rx, 76, 706, 76, { color: c.borderSubtle, width: 1 })

    // Cyan curve block (alpha = 0.2)
    fig.line(rx, 108, rx + 22, 108, { color: cyan, width: 3 })
    fig.text(rx + 30, 108, 'α = 0.2', { size: 15, color: cyan, weight: 700, mono: true })
    fig.text(rx, 130, `L(10⁶) = ${yHi.toFixed(3)}`, {
        size: 14,
        color: c.textPrimary,
        mono: true,
        weight: 600,
    })
    fig.text(rx, 151, `floor E = ${fHigh.floor.toFixed(3)}`, {
        size: 13.5,
        color: c.textSecondary,
        mono: true,
    })

    // Gap callout
    const midY = (plot.py(yHi) + plot.py(yLo)) / 2
    fig.text(rx, midY, 'Δ = 0.237 nats', {
        size: 14.5,
        color: warm,
        weight: 700,
        mono: true,
    })
    fig.text(rx, midY + 20, 'gap at C = 10⁶', {
        size: 13,
        color: c.textSecondary,
    })

    // Purple curve block (alpha = 0.1)
    fig.line(rx, 294, rx + 22, 294, { color: purple, width: 3 })
    fig.text(rx + 30, 294, 'α = 0.1', { size: 15, color: purple, weight: 700, mono: true })
    fig.text(rx, 316, `L(10⁶) = ${yLo.toFixed(3)}`, {
        size: 14,
        color: c.textPrimary,
        mono: true,
        weight: 600,
    })
    fig.text(rx, 337, `floor E = ${fLow.floor.toFixed(3)}`, {
        size: 13.5,
        color: c.textSecondary,
        mono: true,
    })

    return fig.render()
}

export default create('dark')
