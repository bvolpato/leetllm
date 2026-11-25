import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 860
export const height = 435
export const alt =
    'Left: upload-permitted files enter a symbol-membership matrix for PolicyGraph, ScopeRule, TokenClaims, AccessEvent, Node, Counter, and Histogram. Active file A shares 2 of 4 union symbols with scope_rules.py (0.50), 1 of 4 with policy_graph.py (0.25), and 0 of 5 with metrics.py (0.00); a 0.25 threshold keeps scope_rules and policy_graph. Right: an 8,000-token prompt packs 100 framing and 1,200 reserved suffix tokens first, then 4,800 prefix and 1,900 retrieval tokens (trimming 1,100), keeping output reserve separate.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const purple = fig.tone('purple')
    const red = fig.tone('critical')
    const warm = fig.tone('warm')

    // --- LEFT: Symbol Membership Matrix + Jaccard Scores ---
    fig.text(24, 22, '1. Jaccard Symbol Overlap (permitted files)', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
    })

    const symbols = [
        { name: 'PolicyGraph', a: true, s: false, p: true, m: false },
        { name: 'ScopeRule', a: true, s: true, p: false, m: false },
        { name: 'TokenClaims', a: true, s: true, p: false, m: false },
        { name: 'AccessEvent', a: false, s: true, p: false, m: false },
        { name: 'Node', a: false, s: false, p: true, m: false },
        { name: 'Counter', a: false, s: false, p: false, m: true },
        { name: 'Histogram', a: false, s: false, p: false, m: true },
    ]

    const cols = [
        { key: 'a' as const, label: 'Active', x: 204, color: blue },
        { key: 's' as const, label: 'scope', x: 274, color: green },
        { key: 'p' as const, label: 'policy', x: 344, color: purple },
        { key: 'm' as const, label: 'metrics', x: 414, color: red },
    ]

    for (const col of cols) {
        fig.text(col.x, 54, col.label, {
            size: 13,
            weight: 700,
            color: col.color,
            align: 'center',
        })
    }
    fig.line(24, 68, 448, 68, { color: c.border, width: 1 })

    symbols.forEach((sym, i) => {
        const y = 84 + i * 24
        if (i % 2 === 1) {
            fig.rect(24, y - 11, 424, 22, { fill: tint(c.textMuted, c.bg, 0.05), radius: 3 })
        }
        fig.text(28, y, sym.name, { size: 13, color: c.textPrimary, mono: true })
        for (const col of cols) {
            if (sym[col.key]) {
                fig.circle(col.x, y, 5.5, { fill: col.color })
            } else {
                fig.circle(col.x, y, 2.5, { fill: c.borderSubtle })
            }
        }
    })

    // Jaccard horizontal bars below matrix
    fig.text(24, 272, 'Jaccard Score', { size: 13, weight: 700, color: c.textSecondary })
    fig.math(130, 272, '|A \\cap F| / |A \\cup F|', { size: 13, color: c.textSecondary })

    const barPlot = fig.plot({ x: 148, y: 292, width: 224, height: 108 }, { x: [0, 0.56], y: [0, 3] })
    const scores = [
        { name: 'scope_rules.py', val: 0.5, frac: '2/4 = 0.50', keep: true, color: green },
        { name: 'policy_graph.py', val: 0.25, frac: '1/4 = 0.25', keep: true, color: purple },
        { name: 'metrics.py', val: 0.0, frac: '0.00', keep: false, color: red },
    ]

    // Threshold cutoff at 0.25
    const cutX = barPlot.px(0.25)
    fig.line(cutX, 290, cutX, 404, { color: warm, width: 1.4, dash: '4 3' })
    fig.text(cutX, 418, 'cutoff 0.25', {
        size: 12,
        weight: 600,
        color: warm,
        align: 'center',
        mono: true,
    })

    scores.forEach((s, i) => {
        const y = 304 + i * 34
        fig.text(140, y + 10, s.name, {
            size: 12,
            weight: 600,
            color: c.textPrimary,
            align: 'right',
            mono: true,
        })
        const w = Math.max(4, barPlot.px(s.val) - barPlot.px(0))
        fig.rect(barPlot.px(0), y, w, 20, { fill: s.color, opacity: 0.88, radius: 3 })
        const labelX = s.val === 0 ? barPlot.px(0) + 12 : barPlot.px(s.val) + 8
        const text = s.val === 0 ? '0/5 drop' : `${s.frac} keep`
        fig.text(labelX, y + 10, text, {
            size: 12,
            weight: 700,
            color: s.color,
            mono: true,
        })
    })

    // Vertical divider
    fig.line(482, 18, 482, 418, { color: c.borderSubtle, width: 1.25 })

    // --- RIGHT: Proportional 8,000-Token Prompt Budget Stack ---
    fig.text(508, 22, '2. Prompt Budget Allocation (8,000 cap)', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
    })

    // Vertical proportional stacked bar: 8,000 tokens -> 288 px (0.036 px/token)
    const barX = 512
    const barW = 104
    const topY = 58
    const scaleY = 288 / 8000

    const allocs = [
        { label: '1. Framing', tok: 100, detail: 'FIM sentinels', color: c.textMuted, minH: 14 },
        { label: '2. Suffix (pinned)', tok: 1200, detail: 'Reserved first', color: purple, minH: 43 },
        { label: '3. Active prefix', tok: 4800, detail: 'Code before caret', color: blue, minH: 162 },
        {
            label: '4. Retrieval (S, P)',
            tok: 1900,
            detail: '3,000 avail (1,100 cut)',
            color: green,
            minH: 69,
        },
    ]

    let curY = topY
    for (const a of allocs) {
        const h = a.minH
        fig.rect(barX, curY, barW, h, {
            fill: tint(a.color, c.bg, 0.22),
            stroke: a.color,
            strokeWidth: 1.4,
            radius: 4,
        })
        if (h >= 28) {
            fig.text(barX + barW / 2, curY + h / 2, `${a.tok.toLocaleString()}`, {
                size: 13,
                weight: 700,
                color: a.color,
                align: 'center',
                mono: true,
            })
        }
        // Leader line to right-side label
        const midY = curY + h / 2
        fig.line(barX + barW + 4, midY, barX + barW + 22, midY, { color: a.color, width: 1.2 })
        fig.text(barX + barW + 28, midY - (h >= 36 ? 8 : 0), `${a.label} (${a.tok.toLocaleString()})`, {
            size: 13,
            weight: 700,
            color: a.color === c.textMuted ? c.textPrimary : a.color,
        })
        if (h >= 36) {
            fig.text(barX + barW + 28, midY + 10, a.detail, {
                size: 12,
                color: c.textSecondary,
            })
        }
        curY += h + 3
    }

    // 8,000 cap dashed rule
    const capY = curY + 4
    fig.line(508, capY, 836, capY, { color: warm, width: 1.5, dash: '5 4' })
    fig.text(836, capY - 12, '8,000-token prompt cap', {
        size: 12,
        weight: 700,
        color: warm,
        align: 'right',
    })

    // Separate Output Reserve below cap
    const outY = capY + 14
    fig.rect(barX, outY, barW, 44, {
        fill: tint(warm, c.bg, 0.14),
        stroke: warm,
        strokeWidth: 1.4,
        radius: 5,
    })
    fig.text(barX + barW / 2, outY + 22, 'Output', {
        size: 13,
        weight: 700,
        color: warm,
        align: 'center',
    })
    fig.text(barX + barW + 28, outY + 14, 'Output reserve (separate)', {
        size: 13,
        weight: 700,
        color: warm,
    })
    fig.text(barX + barW + 28, outY + 32, 'Outside prompt cap inside context', {
        size: 12,
        color: c.textSecondary,
    })

    // Ensure scaleY isn't unused
    void scaleY

    return fig.render()
}

export default create('dark')
