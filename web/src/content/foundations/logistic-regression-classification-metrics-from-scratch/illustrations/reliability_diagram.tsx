import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 860
export const height = 390
export const alt =
    'Side-by-side reliability diagram and weighted Expected Calibration Error (ECE) bars for four validation probability bins. Left: bin points B1 through B4 compare mean predicted probability against observed positive fraction relative to the diagonal, with vertical gap stems. Right: bin-size weighted gaps (0.066, 0.041, 0.027, 0.005) sum to validation ECE = 0.139.'

const BINS = [
    {
        id: 'B1',
        range: '[0.00, 0.25)',
        n: 3,
        score: (0.061 + 0.169 + 0.244) / 3,
        observed: 1 / 3,
        contrib: (1 - 0.061 - 0.169 - 0.244) / 8,
        tone: 'cyan' as const,
    },
    {
        id: 'B2',
        range: '[0.25, 0.50)',
        n: 1,
        score: 0.325,
        observed: 0,
        contrib: 0.325 / 8,
        tone: 'warm' as const,
    },
    {
        id: 'B3',
        range: '[0.50, 0.75)',
        n: 2,
        score: (0.595 + 0.624) / 2,
        observed: 0.5,
        contrib: (0.595 + 0.624 - 1) / 8,
        tone: 'blue' as const,
    },
    {
        id: 'B4',
        range: '[0.75, 1.00]',
        n: 2,
        score: (0.971 + 0.99) / 2,
        observed: 1,
        contrib: (2 - 0.971 - 0.99) / 8,
        tone: 'green' as const,
    },
] as const

const ECE = BINS.reduce((s, b) => s + b.contrib, 0)

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'

    // Left: Reliability diagram (frameless, side-by-side)
    fig.text(64, 22, 'Reliability diagram (4 equal-width bins)', { size: 15, weight: 700 })

    const plot = fig.plot(
        { x: 66, y: 56, width: 334, height: 274 },
        { x: [-0.04, 1.06], y: [-0.05, 1.06] },
    )
    plot.axes({
        xTicks: [0, 0.25, 0.5, 0.75, 1.0],
        yTicks: [0, 0.25, 0.5, 0.75, 1.0],
        xFormat: (v) => v.toFixed(2),
        yFormat: (v) => v.toFixed(2),
        xLabel: 'Mean predicted probability',
        yLabel: 'Observed positive rate',
        grid: true,
        labelSize: 12,
    })

    // Perfect-calibration diagonal y = x
    fig.line(plot.px(0), plot.py(0), plot.px(1), plot.py(1), {
        color: c.textMuted,
        width: 1.75,
        dash: '5 4',
    })
    fig.text(plot.px(0.56), plot.py(0.76), 'perfect calibration', {
        size: 11,
        color: c.textMuted,
        align: 'center',
    })

    // Label offsets keeping B1, B2, B3, B4 completely clear of dots and stems!
    const offsets = [
        { dx: -14, dy: -22, align: 'left' as const }, // B1 well above-left of dot
        { dx: 12, dy: -16, align: 'left' as const }, // B2 clean right-above
        { dx: 12, dy: 14, align: 'left' as const }, // B3 clean right-below
        { dx: -14, dy: 4, align: 'right' as const }, // B4 clean left
    ]

    BINS.forEach((bin, i) => {
        const tone = fig.tone(bin.tone)
        const px = plot.px(bin.score)
        const pyObs = plot.py(bin.observed)
        const pyDiag = plot.py(bin.score)

        // Vertical calibration-gap stem from diagonal to observed rate
        fig.line(px, pyDiag, px, pyObs, { color: tone, width: 2.6 })
        fig.circle(px, pyDiag, 3.5, { fill: c.bg, stroke: tone, width: 1.5 })
        const radius = bin.n === 3 ? 8.5 : bin.n === 2 ? 7 : 5.5
        fig.circle(px, pyObs, radius, { fill: tone, stroke: c.bg, width: 2 })

        const off = offsets[i]!
        fig.text(px + off.dx, pyObs + off.dy, `${bin.id} (n=${bin.n})`, {
            size: 12,
            weight: 700,
            color: tone,
            align: off.align,
            mono: true,
        })
    })

    // Vertical divider
    fig.line(432, 28, 432, 366, { color: c.borderSubtle, width: 1 })

    // Right: Weighted ECE contribution bars (side-by-side)
    const rx = 462
    fig.text(rx, 22, 'Weighted ECE contributions (n = 8)', { size: 15, weight: 700 })
    fig.math(rx, 54, '\\text{ECE} = \\sum_b \\frac{|B_b|}{8}\\,|\\bar{p}_b - \\bar{y}_b|', {
        size: 14,
        color: c.textSecondary,
    })

    const barX = 562
    const barW = 216
    const maxContrib = 0.075
    const xOf = (v: number) => barX + (v / maxContrib) * barW

    // Axis baseline and subtle vertical guides
    for (const tick of [0, 0.03, 0.06]) {
        const tx = xOf(tick)
        fig.line(tx, 86, tx, 286, {
            color: c.borderSubtle,
            width: 1,
            dash: tick === 0 ? undefined : '3 3',
        })
        fig.text(tx, 300, tick === 0 ? '0' : tick.toFixed(2), {
            size: 11,
            color: c.textMuted,
            align: 'center',
            mono: true,
        })
    }

    BINS.forEach((bin, idx) => {
        const tone = fig.tone(bin.tone)
        const y = 104 + idx * 48
        const bw = Math.max(4, (bin.contrib / maxContrib) * barW)
        const gap = Math.abs(bin.score - bin.observed)

        fig.text(barX - 10, y - 6, `${bin.id} · n=${bin.n}`, {
            size: 13,
            weight: 700,
            color: tone,
            align: 'right',
            mono: true,
        })
        fig.text(barX - 10, y + 11, `gap ${gap.toFixed(3)}`, {
            size: 11,
            color: c.textSecondary,
            align: 'right',
            mono: true,
        })

        fig.rect(barX, y - 10, bw, 22, {
            fill: tint(tone, c.bg, isLight ? 0.28 : 0.4),
            stroke: tone,
            strokeWidth: 1.5,
            radius: 4,
        })
        fig.text(barX + bw + 8, y + 1, bin.contrib.toFixed(3), {
            size: 13,
            weight: 700,
            color: tone,
            mono: true,
        })
    })

    // Total ECE readout cleanly at bottom right
    fig.line(rx, 326, 834, 326, { color: c.borderSubtle, width: 1 })
    fig.text(rx, 352, '0.066 + 0.041 + 0.027 + 0.005 =', {
        size: 13,
        color: c.textSecondary,
        mono: true,
    })
    fig.text(834, 352, `ECE ${ECE.toFixed(3)}`, {
        size: 16,
        weight: 700,
        color: fig.tone('green'),
        align: 'right',
        mono: true,
    })

    return fig.render()
}

export default create
