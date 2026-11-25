import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 840
export const height = 400
export const alt =
    'Retrieval evaluation comparing three top-2 rankings against gold set {policy@2, exception@1} on a 0.0 to 1.0 scale. Duplicate chunks [policy@2, policy@2] deduplicate to one hit and score 0.50 recall and 0.6131 nDCG, identical to [policy@2, faq]. Retrieving both unique required documents [policy@2, exception@1] scores 1.00 recall and 1.0000 nDCG.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const blue = fig.tone('blue')
    const red = fig.tone('critical')

    const fill = (color: string, amt = 0.2) => tint(color, c.bg, amt)

    // Top Gold Set reference strip
    fig.text(32, 26, 'Gold set (K = 2):', { size: 13.5, color: c.textSecondary, weight: 700 })
    fig.rect(162, 12, 108, 28, {
        fill: fill(green, 0.16),
        stroke: green,
        strokeWidth: 1.25,
        radius: 6,
    })
    fig.text(216, 26, 'policy@2', {
        size: 13,
        color: green,
        align: 'center',
        weight: 700,
        mono: true,
    })
    fig.rect(280, 12, 126, 28, {
        fill: fill(green, 0.16),
        stroke: green,
        strokeWidth: 1.25,
        radius: 6,
    })
    fig.text(343, 26, 'exception@1', {
        size: 13,
        color: green,
        align: 'center',
        weight: 700,
        mono: true,
    })

    // Compact legend on top right
    fig.rect(564, 19, 13, 13, { fill: fill(warm, 0.3), stroke: warm, strokeWidth: 1.2, radius: 2 })
    fig.text(583, 26, 'Recall@2', { size: 13, color: c.textPrimary, weight: 600 })
    fig.rect(680, 19, 13, 13, { fill: fill(blue, 0.3), stroke: blue, strokeWidth: 1.2, radius: 2 })
    fig.text(699, 26, 'nDCG@2', { size: 13, color: c.textPrimary, weight: 600 })

    // Right calibrated 0..1 metric plot
    const plot = fig.plot(
        { x: 430, y: 60, width: 376, height: 266 },
        { x: [0, 1.05], y: [0, 3.6] },
    )
    plot.axes({
        xTicks: [0, 0.25, 0.5, 0.75, 1.0],
        xFormat: (v) => v.toFixed(2),
        xLabel: 'Score (0.00 to 1.00)',
        grid: true,
        labelSize: 12,
    })

    const cases = [
        {
            y: 2.95,
            title: 'Duplicate chunks (deduped)',
            slot1: 'policy@2',
            slot2: 'policy@2 (dup)',
            slot2Tone: warm,
            recall: 0.5,
            ndcg: 0.6131,
            recallTone: warm,
        },
        {
            y: 1.8,
            title: 'Missing exception',
            slot1: 'policy@2',
            slot2: 'faq (miss)',
            slot2Tone: red,
            recall: 0.5,
            ndcg: 0.6131,
            recallTone: warm,
        },
        {
            y: 0.65,
            title: 'Complete coverage',
            slot1: 'policy@2',
            slot2: 'exception@1',
            slot2Tone: green,
            recall: 1.0,
            ndcg: 1.0,
            recallTone: green,
        },
    ]

    for (const item of cases) {
        const cy = plot.py(item.y)

        // Left: ranked output slots aligned directly to the plot row
        fig.text(32, cy - 24, item.title, { size: 13, color: c.textPrimary, weight: 700 })

        fig.rect(32, cy - 8, 138, 30, {
            fill: fill(green, 0.14),
            stroke: green,
            strokeWidth: 1.2,
            radius: 5,
        })
        fig.text(101, cy + 7, `#1 ${item.slot1}`, {
            size: 12,
            color: c.textPrimary,
            align: 'center',
            weight: 600,
            mono: true,
        })

        fig.rect(180, cy - 8, 168, 30, {
            fill: fill(item.slot2Tone, 0.13),
            stroke: item.slot2Tone,
            strokeWidth: 1.2,
            radius: 5,
        })
        fig.text(264, cy + 7, `#2 ${item.slot2}`, {
            size: 12,
            color: item.slot2Tone === green ? c.textPrimary : item.slot2Tone,
            align: 'center',
            weight: 600,
            mono: true,
        })

        // Subtle connecting tick from slots to bar pair
        fig.arrow(356, cy + 6, 412, cy + 6, { color: c.border, width: 1.3, head: 5 })

        // Right: paired horizontal bars (Recall top, nDCG bottom)
        const bh = 18
        const yRec = cy - 16
        const yNdcg = cy + 6

        fig.rect(plot.px(0), yRec, plot.px(item.recall) - plot.px(0), bh, {
            fill: fill(item.recallTone, 0.28),
            stroke: item.recallTone,
            strokeWidth: 1.3,
            radius: 3,
        })
        fig.text(
            item.recall >= 0.9 ? plot.px(item.recall) - 8 : plot.px(item.recall) + 8,
            yRec + bh / 2,
            item.recall.toFixed(2),
            {
                size: 12,
                color: item.recall >= 0.9 ? c.textPrimary : item.recallTone,
                align: item.recall >= 0.9 ? 'right' : 'left',
                weight: 700,
                mono: true,
            },
        )

        fig.rect(plot.px(0), yNdcg, plot.px(item.ndcg) - plot.px(0), bh, {
            fill: fill(blue, 0.25),
            stroke: blue,
            strokeWidth: 1.3,
            radius: 3,
        })
        fig.text(
            item.ndcg >= 0.9 ? plot.px(item.ndcg) - 8 : plot.px(item.ndcg) + 8,
            yNdcg + bh / 2,
            item.ndcg.toFixed(4),
            {
                size: 12,
                color: item.ndcg >= 0.9 ? c.textPrimary : blue,
                align: item.ndcg >= 0.9 ? 'right' : 'left',
                weight: 700,
                mono: true,
            },
        )
    }

    // Bottom formula readout for 0.6131 derivation
    fig.text(32, 376, 'IDCG@2 = 1/log2(2) + 1/log2(3) = 1.6309   |   1.0 / 1.6309 = 0.6131', {
        size: 12,
        color: c.textSecondary,
        mono: true,
    })

    return fig.render()
}

export default create()
