import type { ThemeMode } from 'vizmatic'
import { Figure } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 395
export const alt =
    'Dual smooth curves over temperature tau from 0.02 to 1.20 for a fixed similarity gap of 0.70. Left plot shows positive softmax probability P(pos) = 1/(1 + exp(-0.70/tau)) on a full 0 to 1 axis, marking exact values 0.999999 at tau=0.05, 0.999089 at tau=0.10, 0.802184 at tau=0.50, and 0.668188 at tau=1.00. Right plot shows the companion score gradient magnitude (1 - P(pos))/tau, which collapses to near zero at low tau where P(pos) saturates.'

const posProb = (tau: number) => 1 / (1 + Math.exp(-0.7 / tau))
const gradMag = (tau: number) => (1 - posProb(tau)) / tau

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const purple = fig.tone('purple')
    const warm = fig.tone('warm')
    const blue = fig.tone('blue')
    const red = fig.tone('critical')

    const samples = Array.from({ length: 100 }, (_, i) => 0.02 + (i / 99) * 1.18)
    const probPts = samples.map((t) => [t, posProb(t)] as const)
    const gradPts = samples.map((t) => [t, gradMag(t)] as const)

    // --- Left Plot: Positive Softmax Probability P(pos) ---
    fig.text(56, 20, 'Positive probability (Δs = 0.70)', {
        size: 15,
        weight: 600,
        color: c.textPrimary,
    })
    fig.math(56, 46, 'P(\\text{pos}) = \\frac{1}{1 + e^{-0.70/\\tau}}', {
        size: 14,
        color: purple,
    })

    const leftPlot = fig.plot(
        { x: 56, y: 82, width: 300, height: 248 },
        { x: [0, 1.2], y: [0, 1.05] },
    )
    leftPlot.axes({
        xTicks: [0, 0.3, 0.6, 0.9, 1.2],
        yTicks: [0, 0.25, 0.5, 0.75, 1.0],
        yFormat: (v) => v.toFixed(2),
        xLabel: 'Temperature τ',
        grid: true,
        labelSize: 12,
    })

    leftPlot.fillArea(probPts, { fill: purple, fillOpacity: theme === 'light' ? 0.1 : 0.14, smooth: true })
    leftPlot.smoothCurve(probPts, { color: purple, width: 2.5 })

    // Exact 4 reference points with crisp direct labels (no table!)
    const refs = [
        { tau: 0.05, label: 'τ=0.05: 0.999999', color: warm, lx: 0.44, ly: 0.98, align: 'left' as const },
        { tau: 0.1, label: 'τ=0.10: 0.999089', color: warm, lx: 0.44, ly: 0.85, align: 'left' as const },
        { tau: 0.5, label: 'τ=0.50: 0.8022', color: blue, lx: 0.45, ly: 0.56, align: 'right' as const },
        { tau: 1.0, label: 'τ=1.00: 0.6682', color: blue, lx: 0.92, ly: 0.4, align: 'right' as const },
    ]
    for (const r of refs) {
        const y = posProb(r.tau)
        leftPlot.point(r.tau, y, { color: r.color, r: 4.5 })
        fig.callout(
            [leftPlot.px(r.tau), leftPlot.py(y)],
            [leftPlot.px(r.lx), leftPlot.py(r.ly)],
            r.label,
            {
                color: r.color,
                size: 12,
                weight: 700,
                align: r.align,
                mono: true,
                bend: 0.14,
            },
        )
    }

    // Vertical divider
    fig.line(384, 22, 384, 372, { color: c.borderSubtle, width: 1 })

    // --- Right Plot: Companion Gradient Magnitude (1 - P(pos)) / tau ---
    fig.text(436, 20, 'Easy-pair gradient magnitude', {
        size: 15,
        weight: 600,
        color: c.textPrimary,
    })
    fig.math(436, 46, '\\left|\\frac{\\partial \\mathcal{L}}{\\partial s_+}\\right| = \\frac{1 - P(\\text{pos})}{\\tau}', {
        size: 14,
        color: red,
    })

    const rightPlot = fig.plot(
        { x: 436, y: 82, width: 300, height: 248 },
        { x: [0, 1.2], y: [0, 0.5] },
    )
    rightPlot.axes({
        xTicks: [0, 0.3, 0.6, 0.9, 1.2],
        yTicks: [0, 0.1, 0.2, 0.3, 0.4, 0.5],
        yFormat: (v) => v.toFixed(1),
        xLabel: 'Temperature τ',
        grid: true,
        labelSize: 12,
    })

    rightPlot.fillArea(gradPts, { fill: red, fillOpacity: theme === 'light' ? 0.11 : 0.15, smooth: true })
    rightPlot.smoothCurve(gradPts, { color: red, width: 2.5 })

    // Highlight saturation shutoff at low tau vs active gradient peak
    const peakTau = 0.55
    const peakG = gradMag(peakTau)
    rightPlot.point(0.05, gradMag(0.05), { color: warm, r: 4.5 })
    rightPlot.point(0.1, gradMag(0.1), { color: warm, r: 4.5 })
    rightPlot.point(peakTau, peakG, { color: red, r: 5 })
    rightPlot.point(1.0, gradMag(1.0), { color: blue, r: 4.5 })

    fig.callout(
        [rightPlot.px(0.08), rightPlot.py(0.01)],
        [rightPlot.px(0.38), rightPlot.py(0.11)],
        'Gradient ≈ 0 (saturated)',
        {
            color: warm,
            size: 12,
            weight: 700,
            align: 'left',
            bend: -0.18,
        },
    )
    fig.callout(
        [rightPlot.px(peakTau), rightPlot.py(peakG)],
        [rightPlot.px(0.58), rightPlot.py(0.46)],
        'Peak grad ≈ 0.40',
        {
            color: red,
            size: 12,
            weight: 700,
            align: 'left',
            bend: 0.14,
        },
    )

    return fig.render()
}

export default create
