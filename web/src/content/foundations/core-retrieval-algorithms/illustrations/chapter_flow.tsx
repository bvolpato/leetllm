import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 780
export const height = 435
export const alt =
    'Comparison of sparse BM25 and dense cosine search on four documentation passages. An inverted index leaves rotate empty and maps api and key to d1 and d4, scoring d1 1.61 and d4 1.39 while relevant paraphrase d2 scores 0.00. Dense vectors place d2 closest to query q with cosine similarity 0.994 ahead of d1 at 0.957, d4 at 0.625, and d3 at 0.123.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue') // d1
    const green = fig.tone('green') // d2 (paraphrase)
    const warm = fig.tone('warm') // d4 (lexical distractor)
    const muted = c.textMuted // d3 (unrelated)
    const critical = fig.tone('critical')
    const fillAmt = theme === 'dark' ? 0.14 : 0.09

    // ─── LEFT HALF: SPARSE BM25 (INVERTED INDEX + SCORES) ───
    fig.text(190, 20, 'Sparse · BM25 inverted index', {
        size: 15,
        weight: 700,
        color: blue,
        align: 'center',
    })
    fig.text(190, 42, 'Query terms: rotate · api · key', {
        size: 12.5,
        color: c.textSecondary,
        mono: true,
        align: 'center',
    })

    // Visual posting links (term pills -> posting doc badges)
    const terms = [
        { term: 'rotate', docs: [] as const, y: 76 },
        { term: 'api', docs: ['d1', 'd4'] as const, y: 118 },
        { term: 'key', docs: ['d1', 'd4'] as const, y: 160 },
    ]
    for (const row of terms) {
        const miss = row.docs.length === 0
        fig.rect(34, row.y - 14, 92, 28, {
            fill: tint(miss ? critical : blue, c.bg, fillAmt),
            stroke: miss ? critical : blue,
            strokeWidth: 1.3,
            radius: 6,
        })
        fig.text(80, row.y, row.term, {
            size: 13,
            weight: 700,
            color: miss ? critical : c.textPrimary,
            mono: true,
            align: 'center',
        })
        fig.arrow(130, row.y, 174, row.y, {
            color: miss ? critical : c.textMuted,
            width: 1.8,
            head: 6,
            dash: miss ? '3 3' : undefined,
        })
        if (miss) {
            fig.text(184, row.y, '∅  (paraphrase d2 missed)', {
                size: 12.5,
                weight: 600,
                color: critical,
            })
        } else {
            row.docs.forEach((doc, di) => {
                const dx = 184 + di * 64
                const col = doc === 'd1' ? blue : warm
                fig.rect(dx, row.y - 13, 48, 26, {
                    fill: tint(col, c.bg, fillAmt),
                    stroke: col,
                    strokeWidth: 1.3,
                    radius: 6,
                })
                fig.text(dx + 24, row.y, doc, {
                    size: 12.5,
                    weight: 700,
                    color: col,
                    mono: true,
                    align: 'center',
                })
            })
        }
    }

    // BM25 horizontal score bars (aligned below)
    fig.text(34, 212, 'BM25 lexical score', {
        size: 13.5,
        weight: 700,
        color: c.textPrimary,
    })
    const bm25 = [
        { doc: 'd1', val: 1.61, color: blue, note: 'api + key' },
        { doc: 'd4', val: 1.39, color: warm, note: 'api + key' },
        { doc: 'd2', val: 0.0, color: green, note: '0 overlap!' },
        { doc: 'd3', val: 0.0, color: muted, note: 'unrelated' },
    ]
    const barX1 = 70
    const barW1 = 200
    bm25.forEach((b, i) => {
        const cy = 246 + i * 42
        fig.text(barX1 - 12, cy, b.doc, {
            size: 13.5,
            weight: 700,
            color: b.color,
            mono: true,
            align: 'right',
        })
        fig.rect(barX1, cy - 10, barW1, 20, {
            fill: tint(b.color, c.bg, 0.08),
            radius: 4,
        })
        const w = (b.val / 1.8) * barW1
        if (w > 1) {
            fig.rect(barX1, cy - 10, w, 20, { fill: b.color, radius: 4 })
        }
        fig.text(barX1 + w + 8, cy, `${b.val.toFixed(2)}`, {
            size: 12.5,
            weight: 700,
            color: b.val === 0 && b.doc === 'd2' ? critical : b.color,
            mono: true,
        })
        fig.text(barX1 + w + 54, cy, b.note, {
            size: 11.5,
            color: b.val === 0 && b.doc === 'd2' ? critical : c.textMuted,
        })
    })

    // Vertical divider
    fig.line(390, 20, 390, 412, { color: c.borderSubtle, width: 1 })

    // ─── RIGHT HALF: DENSE COSINE SPACE + SCORES ───
    fig.text(585, 20, 'Dense · cosine similarity', {
        size: 15,
        weight: 700,
        color: green,
        align: 'center',
    })
    fig.text(585, 42, 'Unit-circle angles from query q', {
        size: 12.5,
        color: c.textSecondary,
        align: 'center',
    })

    // Crisp quarter-circle cosine geometry plot
    const cosPlot = fig.plot(
        { x: 462, y: 60, width: 224, height: 130 },
        { x: [0, 1.35], y: [0, 1.1] },
    )
    // Axes
    fig.line(cosPlot.px(0), cosPlot.py(0), cosPlot.px(1.25), cosPlot.py(0), {
        color: c.textMuted,
        width: 1.2,
    })
    fig.line(cosPlot.px(0), cosPlot.py(0), cosPlot.px(0), cosPlot.py(1.05), {
        color: c.textMuted,
        width: 1.2,
    })
    // Unit arc
    const arc: [number, number][] = Array.from({ length: 40 }, (_, i) => {
        const a = (i / 39) * (Math.PI / 2)
        return [Math.cos(a), Math.sin(a)]
    })
    cosPlot.curve(arc, { color: c.border, width: 1.2, dash: '3 3' })

    // Unit vectors: q at 40°, d2 at 46° (cos=0.994), d1 at 23° (cos=0.957), d4 at 91°? wait: angle arccos(0.625)=51° -> 40-51=-11 or put at +88° (near y-axis)
    const vecs = [
        { deg: 38, color: c.textPrimary, label: 'q', lx: 0.94, ly: 0.68 },
        { deg: 44, color: green, label: 'd2 (0.994)', lx: 0.78, ly: 0.94 },
        { deg: 21, color: blue, label: 'd1 (0.957)', lx: 1.04, ly: 0.36 },
        { deg: 85, color: warm, label: 'd4 (0.625)', lx: 0.16, ly: 1.02 },
    ]
    for (const v of vecs) {
        const rad = (v.deg * Math.PI) / 180
        fig.arrow(cosPlot.px(0), cosPlot.py(0), cosPlot.px(Math.cos(rad)), cosPlot.py(Math.sin(rad)), {
            color: v.color,
            width: v.label === 'q' || v.color === green ? 2.75 : 2.1,
            head: 7,
        })
        fig.text(cosPlot.px(v.lx), cosPlot.py(v.ly), v.label, {
            size: 12,
            weight: 700,
            color: v.color,
            mono: true,
        })
    }

    // Dense cosine horizontal bars (exact same per-doc colors & clean [0, 1] scale!)
    fig.text(422, 212, 'Dense cosine similarity (0 to 1)', {
        size: 13.5,
        weight: 700,
        color: c.textPrimary,
    })
    const dense = [
        { doc: 'd2', val: 0.994, color: green, note: 'paraphrase #1' },
        { doc: 'd1', val: 0.957, color: blue, note: 'exact + dense' },
        { doc: 'd4', val: 0.625, color: warm, note: 'keyword trap' },
        { doc: 'd3', val: 0.123, color: muted, note: 'unrelated' },
    ]
    const barX2 = 458
    const barW2 = 178
    dense.forEach((b, i) => {
        const cy = 246 + i * 42
        fig.text(barX2 - 12, cy, b.doc, {
            size: 13.5,
            weight: 700,
            color: b.color,
            mono: true,
            align: 'right',
        })
        fig.rect(barX2, cy - 10, barW2, 20, {
            fill: tint(b.color, c.bg, 0.08),
            radius: 4,
        })
        const w = b.val * barW2
        fig.rect(barX2, cy - 10, w, 20, { fill: b.color, radius: 4 })
        fig.text(barX2 + w + 8, cy, b.val.toFixed(3), {
            size: 12.5,
            weight: 700,
            color: b.color,
            mono: true,
        })
        if (i === 0) {
            fig.text(barX2 + w + 54, cy, '#1', {
                size: 12,
                weight: 700,
                color: green,
            })
        }
    })

    return fig.render()
}

export default create()
