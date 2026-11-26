import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 780
export const height = 435
export const alt =
    'Retrieval and reranking cascade showing how shortlist cutoffs gate downstream scoring. BM25 and dense lanes fuse via RRF (k=60) into [d1, d4, d2]. A top-2 cutoff drops d2 so the cross-encoder leaves d1 (0.810) on top. A top-3 cutoff retains d2, whose cross-encoder score (0.952) promotes it to rank 1 ahead of d1 (0.810) and d4 (0.071).'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue') // d1
    const green = fig.tone('green') // d2
    const warm = fig.tone('warm') // d4
    const purple = fig.tone('purple')
    const critical = fig.tone('critical')
    const fillAmt = theme === 'dark' ? 0.15 : 0.09

    const box = (
        x: number,
        y: number,
        w: number,
        h: number,
        color: string,
        title: string,
        sub: string,
    ) => {
        fig.rect(x, y, w, h, {
            fill: tint(color, c.bg, fillAmt),
            stroke: color,
            strokeWidth: 1.6,
            radius: 9,
        })
        fig.text(x + w / 2, y + h / 2 - 10, title, {
            size: 13.5,
            weight: 700,
            color: c.textPrimary,
            align: 'center',
        })
        fig.text(x + w / 2, y + h / 2 + 11, sub, {
            size: 13,
            weight: 600,
            color,
            mono: true,
            align: 'center',
        })
    }

    // ─── TOP HALF: HORIZONTAL CASCADE FUNNEL (BM25 + DENSE -> RRF -> K=2 vs K=3 -> RERANKER) ───
    fig.text(20, 18, 'Stage-1 shortlist cutoff determines whether the reranker ever sees d2', {
        size: 14.5,
        weight: 700,
        color: c.textPrimary,
    })

    // Stage 1 lanes (far left)
    box(20, 46, 118, 56, blue, 'BM25', '[d1, d4]')
    box(20, 122, 118, 56, green, 'Dense', '[d2, d1, d4]')

    // Connectors into RRF
    fig.path('M138 74 C162 74, 162 102, 186 102', { color: blue, width: 2.1 })
    fig.arrow(178, 102, 190, 102, { color: blue, width: 2.1, head: 6 })
    fig.path('M138 150 C162 150, 162 122, 186 122', { color: green, width: 2.1 })
    fig.arrow(178, 122, 190, 122, { color: green, width: 2.1, head: 6 })

    // RRF k=60 node
    box(194, 80, 134, 64, purple, 'RRF (k = 60)', '[d1, d4, d2]')

    // Split into K=2 (drop d2) and K=3 (keep d2)
    fig.path('M328 100 C358 100, 362 74, 396 74', { color: critical, width: 2.2, dash: '5 3' })
    fig.arrow(388, 74, 400, 74, { color: critical, width: 2.2, head: 6 })
    fig.text(364, 58, 'drop d2', { size: 13, weight: 700, color: critical, align: 'center' })

    fig.path('M328 124 C358 124, 362 150, 396 150', { color: green, width: 2.4 })
    fig.arrow(388, 150, 400, 150, { color: green, width: 2.4, head: 6 })
    fig.text(364, 168, 'keep d2', { size: 13, weight: 700, color: green, align: 'center' })

    box(404, 46, 134, 56, critical, 'Cutoff K = 2', '[d1, d4]')
    box(404, 122, 134, 56, green, 'Cutoff K = 3', '[d1, d4, d2]')

    // Connectors to Reranker
    fig.path('M538 74 C568 74, 572 100, 602 100', { color: critical, width: 2.1, dash: '5 3' })
    fig.arrow(594, 100, 606, 100, { color: critical, width: 2.1, head: 6 })
    fig.path('M538 150 C568 150, 572 124, 602 124', { color: green, width: 2.4 })
    fig.arrow(594, 124, 606, 124, { color: green, width: 2.4, head: 6 })

    box(610, 80, 150, 64, warm, 'Cross-Encoder', 'joint (q, doc)')

    fig.line(20, 202, width - 20, 202, { color: c.borderSubtle, width: 1, dash: '4 4' })

    // ─── BOTTOM HALF: CROSS-ENCODER SCORES (LEFT) + SHORTLIST VERDICTS (RIGHT) ───
    fig.text(20, 226, 'Cross-encoder relevance score (0 to 1)', {
        size: 14,
        weight: 700,
        color: c.textPrimary,
    })

    const scores = [
        { doc: 'd2', val: 0.952, color: green, note: 'paraphrase · true #1' },
        { doc: 'd1', val: 0.81, color: blue, note: 'partial match' },
        { doc: 'd4', val: 0.071, color: warm, note: 'distractor rejected' },
    ]
    const bx = 56
    const bw = 240
    scores.forEach((s, i) => {
        const cy = 266 + i * 52
        fig.text(bx - 12, cy, s.doc, {
            size: 14,
            weight: 700,
            color: s.color,
            mono: true,
            align: 'right',
        })
        fig.rect(bx, cy - 11, bw, 22, {
            fill: tint(s.color, c.bg, 0.08),
            radius: 5,
        })
        const w = Math.max(8, s.val * bw)
        fig.rect(bx, cy - 11, w, 22, { fill: s.color, radius: 5 })
        fig.text(bx + bw + 10, cy, s.val.toFixed(3), {
            size: 13.5,
            weight: 700,
            color: s.color,
            mono: true,
        })
        fig.text(bx, cy + 21, s.note, { size: 13, color: c.textSecondary })
    })

    // Right side: crisp left-accent outcome comparison (no heavy KPI cards)
    const ox = 428
    const ow = 332
    fig.text(ox, 226, 'Final top-1 outcome', {
        size: 14,
        weight: 700,
        color: c.textPrimary,
    })

    // K=2 verdict
    fig.rect(ox, 250, 5, 68, { fill: critical, radius: 2.5 })
    fig.rect(ox + 5, 250, ow - 5, 68, {
        fill: tint(critical, c.bg, theme === 'dark' ? 0.1 : 0.06),
        radius: 6,
    })
    fig.text(ox + 18, 268, 'K = 2 shortlist  →  Top: d1 (0.810)', {
        size: 14,
        weight: 700,
        color: critical,
    })
    fig.text(ox + 18, 294, 'd2 was pruned before reranking · unrecoverable', {
        size: 12.5,
        color: c.textSecondary,
    })

    // K=3 verdict
    fig.rect(ox, 336, 5, 68, { fill: green, radius: 2.5 })
    fig.rect(ox + 5, 336, ow - 5, 68, {
        fill: tint(green, c.bg, theme === 'dark' ? 0.12 : 0.07),
        radius: 6,
    })
    fig.text(ox + 18, 354, 'K = 3 shortlist  →  Top: d2 (0.952)', {
        size: 14,
        weight: 700,
        color: green,
    })
    fig.text(ox + 18, 380, 'Widening to K = 3 lets reranker promote d2 to #1', {
        size: 12.5,
        color: c.textSecondary,
    })

    return fig.render()
}

export default create()
