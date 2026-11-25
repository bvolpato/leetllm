import type { ThemeMode, ToneName } from 'vizmatic'
import { layoutAllocation } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 740
export const height = 435
export const alt =
    'Five sources totaling 1,000 tokens (Proof 120 at 0.98, API-Doc 160 at 0.92, Forum 200 at 0.79, News 240 at 0.63, Scrape 280 at 0.31) are filtered across thresholds 0.00, 0.50, 0.70, 0.90, and 0.95. Left stacked bars show surviving token composition falling from 1,000 to 120 tokens; right trade-off curve plots surviving yield against rising mean classifier score from 0.661 to 0.980, highlighting cutoff 0.90 (280 tokens, 28% yield, mean 0.946).'

export const documents = [
    { id: 'proof', label: 'Proof', tokens: 120, score: 0.98, tone: 'purple' as ToneName },
    { id: 'api-doc', label: 'API-Doc', tokens: 160, score: 0.92, tone: 'cyan' as ToneName },
    { id: 'forum', label: 'Forum', tokens: 200, score: 0.79, tone: 'blue' as ToneName },
    { id: 'news', label: 'News', tokens: 240, score: 0.63, tone: 'warm' as ToneName },
    { id: 'scrape', label: 'Scrape', tokens: 280, score: 0.31, tone: 'neutral' as ToneName },
]
export const totalTokens = documents.reduce((sum, doc) => sum + doc.tokens, 0)
export const thresholds = [0, 0.5, 0.7, 0.9, 0.95]

export const selections = thresholds.map((threshold, i) => {
    const kept = documents.filter((doc) => doc.score >= threshold)
    const tokens = kept.reduce((sum, doc) => sum + doc.tokens, 0)
    return {
        threshold,
        kept,
        tokens,
        yield: tokens / totalTokens,
        mean: kept.reduce((sum, doc) => sum + doc.tokens * doc.score, 0) / tokens,
        allocation: layoutAllocation({
            x: 90,
            y: 96 + i * 50,
            width: 240,
            height: 24,
            capacity: totalTokens,
            parts: kept.map((doc) => ({ id: doc.id, label: doc.id, value: doc.tokens })),
        }),
    }
})

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const muted = c.textSecondary
    const colors: Record<string, string> = {
        proof: fig.tone('purple'),
        'api-doc': fig.tone('cyan'),
        forum: fig.tone('blue'),
        news: fig.tone('warm'),
        scrape: c.textMuted,
    }

    // Top source legend strip (compact, zero overlap)
    let lx = 18
    documents.forEach((d) => {
        const col = colors[d.id]!
        fig.rect(lx, 15, 12, 12, { fill: col, radius: 3 })
        const lbl = `${d.label} ${d.score.toFixed(2)}`
        fig.text(lx + 16, 21, lbl, { size: 14, weight: 600, color: d.id === 'scrape' ? muted : col })
        lx += lbl.length * 8.1 + 30
    })

    // Stacked token-survival bars by threshold
    fig.text(18, 56, 'Surviving tokens by cutoff (of 1,000)', { size: 15, weight: 700 })
    const barX = 78
    const barW = 196
    const startY = 94
    const rowStep = 58

    selections.forEach((row, i) => {
        const y = startY + i * rowStep
        const isSel = row.threshold === 0.9
        if (isSel) {
            fig.rect(10, y - 10, 396, 48, {
                fill: tint(colors['api-doc']!, c.bg, 0.08),
                stroke: tint(colors['api-doc']!, c.bg, 0.4),
                strokeWidth: 1.2,
                radius: 7,
            })
        }
        fig.text(barX - 8, y + 13, `≥${row.threshold.toFixed(2)}`, {
            size: 14,
            mono: true,
            weight: isSel ? 700 : 600,
            color: isSel ? colors['api-doc']! : c.textPrimary,
            align: 'right',
        })
        fig.rect(barX, y, barW, 26, {
            fill: tint(c.textMuted, c.bg, 0.07),
            radius: 4,
        })
        let cx = barX
        row.kept.forEach((doc) => {
            const pw = (doc.tokens / totalTokens) * barW
            fig.rect(cx, y, Math.max(2, pw - 1), 26, {
                fill: colors[doc.id]!,
                radius: 3,
            })
            cx += pw
        })
        // Clean readout with generous room
        fig.text(barX + barW + 8, y + 5, `${row.tokens} (${Math.round(row.yield * 100)}%)`, {
            size: 14,
            mono: true,
            weight: 700,
            color: isSel ? colors['api-doc']! : c.textPrimary,
        })
        fig.text(barX + barW + 8, y + 23, `μ ${row.mean.toFixed(3)}`, {
            size: 14,
            mono: true,
            color: muted,
        })
    })

    // Bottom axis on stacked bars
    const axY = startY + 5 * rowStep - 12
    fig.line(barX, axY, barX + barW, axY, { color: c.textMuted, width: 1 })
    ;[0, 500, 1000].forEach((v) => {
        const tx = barX + (v / 1000) * barW
        fig.line(tx, axY, tx, axY + 4, { color: c.textMuted, width: 1 })
        fig.text(tx, axY + 18, String(v), { size: 14, mono: true, color: muted, align: 'center' })
    })

    // Divider
    fig.line(416, 48, 416, 408, { color: c.borderSubtle, width: 1 })

    // Yield vs Mean Classifier Score Pareto Curve
    const plotArea = { x: 482, y: 92, width: 238, height: 264 }
    const plot = fig.plot(plotArea, { x: [0, 105], y: [0.6, 1.02] })

    plot.axes({
        xTicks: [0, 50, 100],
        yTicks: [0.6, 0.7, 0.8, 0.9, 1.0],
        xLabel: 'Surviving yield (%)',
        yLabel: 'Mean proxy score',
        grid: true,
        labelSize: 14,
        xFormat: (v) => `${v}%`,
        yFormat: (v) => v.toFixed(2),
    })

    const pts = selections.map((s) => [s.yield * 100, s.mean] as const)
    plot.smoothCurve(pts, { color: colors['api-doc']!, width: 2.6 })

    selections.forEach((s) => {
        const x = s.yield * 100
        const y = s.mean
        const isSel = s.threshold === 0.9
        plot.point(x, y, {
            color: isSel ? colors['api-doc']! : colors.purple!,
            r: isSel ? 6 : 4.2,
        })
        const dx =
            s.threshold === 0
                ? -8
                : s.threshold === 0.7
                  ? -10
                  : isSel
                    ? 10
                    : 10
        const dy =
            s.threshold === 0
                ? 18
                : s.threshold === 0.7
                  ? 18
                  : isSel
                    ? -12
                    : s.threshold === 0.95
                      ? -10
                      : -12
        const align = s.threshold === 0 || s.threshold === 0.7 ? 'right' : 'left'
        fig.text(
            plot.px(x) + dx,
            plot.py(y) + dy,
            isSel ? '≥0.90 (28%)' : `≥${s.threshold.toFixed(2)}`,
            {
                size: 14,
                mono: true,
                weight: isSel ? 700 : 500,
                color: isSel ? colors['api-doc']! : muted,
                align,
            },
        )
    })

    return fig.render()
}

export default create('dark')
