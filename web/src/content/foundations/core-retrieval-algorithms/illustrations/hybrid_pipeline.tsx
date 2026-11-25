import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 780
export const height = 395
export const alt =
    'Reciprocal rank fusion pipeline and score comparison across two constants. BM25 returns [d1, d4] and dense cosine returns [d2, d1, d4], feeding 1 / (k + rank). At k=60, consensus keeps d4 (0.0320) ahead of single-lane d2 (0.0164), so a top-2 cutoff drops d2. At k=0, d2 (1.000) overtakes d4 (0.833).'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue') // d1
    const green = fig.tone('green') // d2
    const warm = fig.tone('warm') // d4
    const purple = fig.tone('purple')
    const critical = fig.tone('critical')
    const fillAmt = theme === 'dark' ? 0.14 : 0.09

    // ─── TOP COMPACT FORMULA & LANE STRIP ───
    fig.rect(24, 16, 198, 46, {
        fill: tint(blue, c.bg, fillAmt),
        stroke: blue,
        strokeWidth: 1.4,
        radius: 8,
    })
    fig.text(123, 29, 'BM25 lane', { size: 14.5, weight: 700, color: blue, align: 'center' })
    fig.text(123, 49, '1: d1 · 2: d4', {
        size: 14.5,
        color: c.textPrimary,
        mono: true,
        align: 'center',
    })

    fig.rect(244, 16, 232, 46, {
        fill: tint(green, c.bg, fillAmt),
        stroke: green,
        strokeWidth: 1.4,
        radius: 8,
    })
    fig.text(360, 29, 'Dense lane', { size: 14.5, weight: 700, color: green, align: 'center' })
    fig.text(360, 49, '1: d2 · 2: d1 · 3: d4', {
        size: 14.5,
        color: c.textPrimary,
        mono: true,
        align: 'center',
    })

    fig.arrow(480, 39, 514, 39, { color: purple, width: 2.2, head: 7 })
    fig.math(638, 39, String.raw`\text{RRF}(d) = \sum_{\ell} \frac{1}{k + \text{rank}_\ell(d)}`, {
        size: 15,
        color: c.textPrimary,
        align: 'center',
    })

    fig.line(24, 80, width - 24, 80, { color: c.borderSubtle, width: 1, dash: '4 4' })

    // Consistent per-doc helper
    const drawPanel = (
        originX: number,
        title: string,
        subtitle: string,
        maxVal: number,
        decimals: number,
        rows: readonly { doc: string; val: number; color: string; detail: string; dropped?: boolean }[],
    ) => {
        fig.text(originX + 162, 102, title, {
            size: 15,
            weight: 700,
            color: c.textPrimary,
            align: 'center',
        })
        fig.text(originX + 162, 124, subtitle, {
            size: 14.5,
            color: c.textSecondary,
            align: 'center',
        })

        const bx = originX + 52
        const bw = 186
        rows.forEach((r, idx) => {
            const cy = 166 + idx * 66
            // Top-2 cutoff dashed line between row 1 and row 2
            if (idx === 2) {
                fig.line(originX + 12, cy - 32, originX + 318, cy - 32, {
                    color: critical,
                    width: 1.4,
                    dash: '5 4',
                })
                fig.text(originX + 318, cy - 44, 'top-2 cutoff', {
                    size: 14.5,
                    weight: 600,
                    color: critical,
                    align: 'right',
                })
            }

            fig.text(bx - 10, cy - 4, `#${idx + 1} ${r.doc}`, {
                size: 14.5,
                weight: 700,
                color: r.color,
                mono: true,
                align: 'right',
            })
            fig.rect(bx, cy - 14, bw, 20, {
                fill: tint(r.color, c.bg, 0.08),
                radius: 4,
            })
            const w = Math.max(6, (r.val / maxVal) * bw)
            fig.rect(bx, cy - 14, w, 20, {
                fill: r.color,
                opacity: r.dropped ? 0.55 : 1,
                radius: 4,
            })
            fig.text(bx + w + 8, cy - 4, r.val.toFixed(decimals), {
                size: 14.5,
                weight: 700,
                color: r.color,
                mono: true,
            })
            fig.text(bx, cy + 19, r.detail, {
                size: 14.5,
                color: r.dropped ? critical : c.textSecondary,
            })
        })
    }

    // Left: k = 60 (consensus beats single-lane #1)
    drawPanel(24, 'k = 60 · consensus beats #1', 'Flat curve rewards both lanes', 0.036, 4, [
        { doc: 'd1', val: 0.0325, color: blue, detail: '1/61 + 1/62 (both)' },
        { doc: 'd4', val: 0.032, color: warm, detail: '1/62 + 1/63 (both)' },
        { doc: 'd2', val: 0.0164, color: green, detail: '1/61 only · dropped!', dropped: true },
    ])

    // Vertical divider + rank swap visual cue
    fig.line(390, 96, 390, 356, { color: c.borderSubtle, width: 1 })
    fig.rect(346, 238, 88, 28, {
        fill: tint(purple, c.bg, theme === 'dark' ? 0.24 : 0.14),
        stroke: purple,
        strokeWidth: 1.2,
        radius: 14,
    })
    fig.text(390, 252, 'd2 ↔ d4', {
        size: 14.5,
        weight: 700,
        color: purple,
        mono: true,
        align: 'center',
    })

    // Right: k = 0 (top rank lifts d2)
    drawPanel(428, 'k = 0 · top rank lifts d2', 'Steep 1/rank lifts dense #1', 1.65, 3, [
        { doc: 'd1', val: 1.5, color: blue, detail: '1/1 + 1/2 (both)' },
        { doc: 'd2', val: 1.0, color: green, detail: '1/1 dense #1 · kept' },
        { doc: 'd4', val: 0.833, color: warm, detail: '1/2 + 1/3 · below K=2', dropped: true },
    ])

    // Legend strip at bottom confirming consistent doc identity
    fig.circle(138, 376, 5, { fill: blue })
    fig.text(150, 376, 'd1 (exact + dense)', { size: 14.5, color: c.textSecondary })
    fig.circle(340, 376, 5, { fill: green })
    fig.text(352, 376, 'd2 (paraphrase)', { size: 14.5, color: green, weight: 600 })
    fig.circle(512, 376, 5, { fill: warm })
    fig.text(524, 376, 'd4 (lexical distractor)', { size: 14.5, color: warm })

    return fig.render()
}

export default create()
