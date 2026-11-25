import type { ThemeMode } from 'vizmatic'
import { withColorAlpha } from 'vizmatic'
import { Figure } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 458
export const alt =
    'A proportional 3-clause specification spans the top: Clause 1 establishes auto-rotation for stale keys, Clause 2 sets the 14-day limit, and Clause 3 states the 48-hour risk-signal condition. Below on the same horizontal scale: fixed splitting cuts between Clause 2 and Clause 3 so Chunk A misses the 48-hour condition; sliding overlap creates Chunk B-prime covering Clauses 2 and 3 while leaving Chunk A incomplete; parent-child expansion matches a small child on Clause 2 and expands via parent_id to return all three clauses intact as parent E1.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const warm = fig.tone('warm')
    const purple = fig.tone('purple')
    const green = fig.tone('green')
    const red = fig.tone('critical')

    const leftX = 168
    const spanW = 572
    const c1W = Math.round(spanW * 0.42) // 240
    const c2W = Math.round(spanW * 0.25) // 143
    const c3W = spanW - c1W - c2W // 189

    const x1 = leftX
    const x2 = x1 + c1W
    const x3 = x2 + c2W

    // Vertical guide lines showing exact clause boundaries across all 3 strategies
    const guideTop = 94
    const guideBot = 434
    fig.line(x2, guideTop, x2, guideBot, { color: c.borderSubtle, width: 1, dash: '3 4' })
    fig.line(x3, guideTop, x3, guideBot, { color: c.borderSubtle, width: 1, dash: '3 4' })

    // ── Top: Proportional 3-Clause Source Specification ──────────────────────
    fig.text(20, 44, 'Source Spec', { size: 15, weight: 700, color: c.textPrimary })
    fig.text(20, 64, '3 linked clauses', { size: 13, color: c.textSecondary })

    const topY = 20
    const topH = 66
    const clauses = [
        { x: x1, w: c1W - 3, tag: 'Clause 1 · Setup', text: 'Stale keys qualify for rotation', color: blue },
        { x: x2 + 2, w: c2W - 4, tag: 'Clause 2 · Limit', text: 'up to 14 days,', color: warm },
        { x: x3 + 2, w: c3W - 2, tag: 'Clause 3 · Condition', text: 'if risk signal ≤ 48 h.', color: purple },
    ] as const

    for (const cl of clauses) {
        fig.rect(cl.x, topY, cl.w, topH, {
            fill: withColorAlpha(cl.color, 0.13),
            stroke: cl.color,
            strokeWidth: 1.5,
            radius: 7,
        })
        fig.text(cl.x + cl.w / 2, topY + 21, cl.tag, {
            size: 13,
            weight: 700,
            color: cl.color,
            align: 'center',
        })
        fig.text(cl.x + cl.w / 2, topY + 45, cl.text, {
            size: 13,
            color: c.textPrimary,
            align: 'center',
        })
    }

    fig.line(20, 102, width - 20, 102, { color: c.borderSubtle, width: 1 })

    // ── Strategy 1: Fixed Split (No Overlap) ─────────────────────────────────
    const r1Y = 122
    fig.text(20, r1Y + 14, '1. Fixed Split', { size: 15, weight: 700, color: red })
    fig.text(20, r1Y + 34, 'No overlap', { size: 13, color: c.textSecondary })
    fig.text(20, r1Y + 54, 'Condition severed', { size: 13.5, weight: 700, color: red })

    // Chunk A (Clauses 1 + 2)
    fig.rect(x1, r1Y + 4, c1W + c2W - 6, 38, {
        fill: withColorAlpha(blue, 0.14),
        stroke: blue,
        strokeWidth: 1.6,
        radius: 6,
    })
    fig.text(x1 + (c1W + c2W - 6) / 2, r1Y + 23, 'Chunk A · Clauses 1 + 2 (48 h check missing)', {
        size: 13,
        weight: 600,
        color: c.textPrimary,
        align: 'center',
    })

    // Chunk B (Clause 3 orphaned)
    fig.rect(x3 + 6, r1Y + 4, c3W - 6, 38, {
        fill: withColorAlpha(red, 0.08),
        stroke: red,
        strokeWidth: 1.4,
        radius: 6,
    })
    fig.text(x3 + 6 + (c3W - 6) / 2, r1Y + 23, 'Chunk B · Clause 3', {
        size: 13,
        weight: 600,
        color: red,
        align: 'center',
    })

    // Bold cut mark between Chunk A and Chunk B
    fig.line(x3, r1Y - 4, x3, r1Y + 50, { color: red, width: 2.4, dash: '4 3' })
    fig.text(x3, r1Y + 62, 'hard split drops 48 h condition', {
        size: 13.5,
        weight: 700,
        color: red,
        align: 'center',
    })

    fig.line(20, 204, width - 20, 204, { color: c.borderSubtle, width: 1 })

    // ── Strategy 2: Sliding Overlap ──────────────────────────────────────────
    const r2Y = 222
    fig.text(20, r2Y + 14, '2. Sliding Overlap', { size: 15, weight: 700, color: warm })
    fig.text(20, r2Y + 34, 'Shared Clause 2', { size: 13, color: c.textSecondary })
    fig.text(20, r2Y + 54, 'Chunk A still split', { size: 13.5, weight: 700, color: warm })

    // Chunk A (Clauses 1 + 2)
    fig.rect(x1, r2Y + 2, c1W + c2W - 4, 34, {
        fill: withColorAlpha(blue, 0.12),
        stroke: blue,
        strokeWidth: 1.4,
        radius: 6,
    })
    fig.text(x1 + (c1W + c2W - 4) / 2, r2Y + 19, 'Chunk A · Clauses 1 + 2 (still incomplete)', {
        size: 13,
        color: c.textPrimary,
        align: 'center',
    })

    // Chunk B' (Clauses 2 + 3, overlapping Clause 2)
    fig.rect(x2 + 2, r2Y + 42, c2W + c3W - 2, 34, {
        fill: withColorAlpha(warm, 0.14),
        stroke: warm,
        strokeWidth: 1.6,
        radius: 6,
    })
    fig.text(x2 + 2 + (c2W + c3W - 2) / 2, r2Y + 59, "Chunk B' · Clauses 2 + 3 (duplicates Clause 2)", {
        size: 13,
        weight: 600,
        color: warm,
        align: 'center',
    })

    // Subtle overlap bracket shading in Clause 2 region
    fig.rect(x2 + 2, r2Y + 36, c2W - 6, 6, { fill: withColorAlpha(warm, 0.35), radius: 2 })

    fig.line(20, 314, width - 20, 314, { color: c.borderSubtle, width: 1 })

    // ── Strategy 3: Parent-Child Expansion ───────────────────────────────────
    const r3Y = 330
    fig.text(20, r3Y + 18, '3. Parent-Child', { size: 15, weight: 700, color: green })
    fig.text(20, r3Y + 38, 'Index small child', { size: 13, color: c.textSecondary })
    fig.text(20, r3Y + 58, 'Serve full parent', { size: 13, weight: 700, color: green })

    // Child match on Clause 2
    fig.rect(x2 + 2, r3Y + 2, c2W - 4, 32, {
        fill: withColorAlpha(blue, 0.2),
        stroke: blue,
        strokeWidth: 1.75,
        radius: 6,
    })
    fig.text(x2 + c2W / 2, r3Y + 18, 'Child hit (match)', {
        size: 13,
        weight: 700,
        color: blue,
        align: 'center',
    })

    // Expansion trapezoid + arrow down to full parent span
    const parentY = r3Y + 62
    const parentH = 44
    fig.path(
        `M${x2 + 2} ${r3Y + 36}L${x3 - 2} ${r3Y + 36}L${x1 + spanW} ${parentY - 2}L${x1} ${parentY - 2}Z`,
        { fill: green, fillOpacity: 0.1 },
    )
    fig.arrow(x2 + c2W / 2, r3Y + 36, x2 + c2W / 2, parentY - 3, {
        color: green,
        width: 2,
        head: 7,
    })
    fig.text(x3 + 12, r3Y + 48, 'expand via parent_id', {
        size: 13.5,
        mono: true,
        weight: 700,
        color: green,
    })

    // Full Parent E1 spanning all 3 clauses
    fig.rect(x1, parentY, spanW, parentH, {
        fill: withColorAlpha(green, 0.15),
        stroke: green,
        strokeWidth: 2,
        radius: 7,
    })
    fig.text(
        x1 + spanW / 2,
        parentY + parentH / 2,
        'Parent [E1] · Clauses 1 + 2 + 3 intact (setup, 14-day limit, 48 h condition)',
        {
            size: 14,
            weight: 700,
            color: green,
            align: 'center',
        },
    )

    return fig.render()
}

export default create('dark')
