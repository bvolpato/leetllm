import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 840
export const height = 435
export const alt =
    'Exact 40-task paired bootstrap lift distribution aligned directly above its 95 percent confidence interval on a shared percentage-point axis. The observed lift is +7.5 pp, the 95 percent CI spans -10.0 to +25.0 pp across zero, and 24 percent of resamples fall at or below zero, leaving the comparison inconclusive.'

function bootstrapDist(): Array<{ x: number; y: number }> {
    const pNeg = 5 / 40
    const pZero = 27 / 40
    const pPos = 8 / 40
    let probs = new Float64Array(81)
    probs[40] = 1
    for (let step = 0; step < 40; step += 1) {
        const next = new Float64Array(81)
        for (let idx = 1; idx < 80; idx += 1) {
            const p = probs[idx]!
            if (p === 0) continue
            next[idx - 1]! += p * pNeg
            next[idx]! += p * pZero
            next[idx + 1]! += p * pPos
        }
        probs = next
    }
    const pts: Array<{ x: number; y: number }> = []
    for (let s = -10; s <= 15; s += 1) {
        pts.push({ x: (s / 40) * 100, y: probs[40 + s]! })
    }
    return pts
}

const DIST = bootstrapDist()

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const warm = fig.tone('warm')
    const red = fig.tone('critical')
    const isLight = theme === 'light'

    // Top: Exact bootstrap distribution on shared x-axis [-27.5, +40]
    fig.text(72, 22, 'Exact 40-task paired bootstrap distribution (27 ties · 8 B wins · 5 A wins)', {
        size: 14,
        weight: 700,
    })

    const plot = fig.plot(
        { x: 74, y: 54, width: 734, height: 224 },
        { x: [-27.5, 40], y: [0, 0.14] },
    )

    // Shaded <= 0 region (24% of resamples)
    fig.rect(plot.area.x, plot.area.y, plot.px(0) - plot.area.x, plot.area.height, {
        fill: tint(warm, c.bg, isLight ? 0.08 : 0.12),
    })

    plot.axes({
        xTicks: [-20, -10, 0, 10, 20, 30],
        yTicks: [0.04, 0.08, 0.12],
        xFormat: (v) => (v > 0 ? `+${v}` : String(v)),
        yFormat: (v) => v.toFixed(2),
        yLabel: 'Probability mass',
        grid: true,
        labelSize: 12,
    })

    // Discrete PMF bars cleanly centered at each 2.5 pp step
    const stepW = plot.px(2.5) - plot.px(0)
    const barW = Math.max(8, stepW * 0.68)
    for (const pt of DIST) {
        const cx = plot.px(pt.x)
        const yTop = plot.py(pt.y)
        const yBot = plot.py(0)
        const outsideCI = pt.x < -10 || pt.x > 25
        const leZero = pt.x <= 0
        const tone = outsideCI ? c.textMuted : leZero ? warm : blue
        fig.rect(cx - barW / 2, yTop, barW, Math.max(1, yBot - yTop), {
            fill: tint(tone, c.bg, outsideCI ? (isLight ? 0.18 : 0.24) : isLight ? 0.28 : 0.4),
            stroke: tone,
            strokeWidth: outsideCI ? 1 : 1.3,
            radius: 3,
        })
    }

    // Smooth curve envelope over the discrete peaks
    plot.smoothCurve(
        DIST.map((pt) => [pt.x, pt.y] as const),
        { color: blue, width: 1.75, opacity: 0.7 },
    )

    // Continuous vertical reference lines spanning from distribution right down into the CI bar
    const ciY = 342
    const xZero = plot.px(0)
    const xObs = plot.px(7.5)
    const xLo = plot.px(-10)
    const xHi = plot.px(25)

    // Zero line (no-lift boundary) spanning both distribution and CI track
    fig.line(xZero, plot.area.y, xZero, ciY + 36, { color: red, width: 1.8, dash: '5 4' })
    // Observed mean line (+7.5 pp)
    fig.line(xObs, plot.area.y + 12, xObs, ciY, { color: blue, width: 1.6, dash: '3 3' })
    // 95% CI fence guides
    fig.line(xLo, plot.py(0.055), xLo, ciY, { color: warm, width: 1.3, dash: '3 3', opacity: 0.8 })
    fig.line(xHi, plot.py(0.055), xHi, ciY, { color: warm, width: 1.3, dash: '3 3', opacity: 0.8 })

    // Well-separated top callout labels (zero crowding between 0 and +7.5!)
    fig.text(xZero - 8, plot.area.y + 14, '0 pp (no lift)', {
        size: 12,
        weight: 700,
        color: red,
        align: 'right',
    })
    fig.text(xObs + 8, plot.area.y + 14, 'Observed mean +7.5 pp', {
        size: 12,
        weight: 700,
        color: blue,
        align: 'left',
    })
    fig.callout([plot.px(-5), plot.py(0.042)], [plot.px(-11), plot.py(0.095)], '24% of resamples <= 0', {
        color: warm,
        labelColor: warm,
        align: 'right',
        size: 12,
        weight: 700,
        bend: 0.16,
    })

    // Bottom: Aligned 95% Bootstrap CI Bar on the exact same x-axis
    fig.text(74, ciY - 22, '95% percentile CI (aligned)', {
        size: 12,
        weight: 700,
        color: c.textSecondary,
    })
    fig.rect(xLo, ciY - 9, xHi - xLo, 18, {
        fill: tint(blue, c.bg, isLight ? 0.16 : 0.25),
        radius: 5,
    })
    fig.line(xLo, ciY, xHi, ciY, { color: blue, width: 3.2 })
    fig.line(xLo, ciY - 10, xLo, ciY + 10, { color: warm, width: 2.4 })
    fig.line(xHi, ciY - 10, xHi, ciY + 10, { color: warm, width: 2.4 })
    fig.circle(xObs, ciY, 6.5, { fill: c.bg, stroke: blue, width: 3 })

    // Clean labels directly below the aligned CI endpoints
    fig.text(xLo, ciY + 22, '−10.0 pp', {
        size: 13,
        weight: 700,
        color: warm,
        align: 'center',
        mono: true,
    })
    fig.text(xObs, ciY + 22, '+7.5 pp', {
        size: 13,
        weight: 700,
        color: blue,
        align: 'center',
        mono: true,
    })
    fig.text(xHi, ciY + 22, '+25.0 pp', {
        size: 13,
        weight: 700,
        color: warm,
        align: 'center',
        mono: true,
    })

    fig.text(plot.area.x + plot.area.width / 2, 412, 'Paired B − A lift (percentage points)  ·  0 inside CI -> inconclusive', {
        size: 13,
        weight: 600,
        color: c.textSecondary,
        align: 'center',
    })

    return fig.render()
}

export default create
