import type { ThemeMode } from 'vizmatic'
import { withColorAlpha } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 450
export const alt =
    'For the query inference-api latency SLO, lexical top-2 retrieval scores 3 matching terms in Record 3155, 2 in Record 1842, and 0 in Record 2031, selecting 3155 and 1842 for 2/3 recall. On the right, following the directed graph path inference-api to Redis Cache (source 1842) to Old Maxmemory Policy (source 2031) recovers Record 2031 and lifts evidence recall from 2/3 to 3/3.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const purple = fig.tone('purple')
    const red = fig.tone('critical')
    const warm = fig.tone('warm')

    // ── Top Query Strip ──────────────────────────────────────────────────────
    fig.text(20, 20, 'Query:', { size: 14, weight: 700, color: c.textSecondary })
    fig.rect(74, 6, 246, 28, {
        fill: withColorAlpha(blue, 0.14),
        stroke: withColorAlpha(blue, 0.6),
        strokeWidth: 1.3,
        radius: 6,
    })
    fig.text(197, 20, 'inference-api latency SLO', {
        size: 14,
        mono: true,
        weight: 700,
        color: blue,
        align: 'center',
    })
    fig.text(width - 20, 20, 'Required evidence: {3155, 1842, 2031}', {
        size: 13,
        mono: true,
        weight: 600,
        color: c.textSecondary,
        align: 'right',
    })
    fig.line(20, 46, width - 20, 46, { color: c.borderSubtle, width: 1 })

    // ── Left: Lexical Top-2 Ranking ──────────────────────────────────────────
    const lx = 20
    const lw = 336

    fig.text(lx, 68, 'Lexical Top-2 Retrieval', { size: 16, weight: 700, color: blue })
    fig.text(lx, 90, 'Counts shared query terms per record', { size: 13, color: c.textSecondary })

    const lexRows = [
        { id: '3155', terms: 3, status: '#1 kept', kept: true },
        { id: '1842', terms: 2, status: '#2 kept', kept: true },
        { id: '2031', terms: 0, status: 'missed', kept: false },
    ] as const

    const barX = lx + 64
    const barW = 148
    lexRows.forEach((row, idx) => {
        const ry = 132 + idx * 54
        const col = row.kept ? green : red
        fig.text(lx, ry, row.id, {
            size: 15,
            mono: true,
            weight: 700,
            color: row.kept ? c.textPrimary : red,
        })

        // Bar track (0..3 terms)
        fig.rect(barX, ry - 9, barW, 18, {
            fill: tint(c.border, c.bg, 0.28),
            radius: 4,
        })
        if (row.terms > 0) {
            fig.rect(barX, ry - 9, (row.terms / 3) * barW, 18, {
                fill: blue,
                opacity: 0.88,
                radius: 4,
            })
        }

        fig.text(barX + barW + 10, ry, `${row.terms}/3`, {
            size: 13,
            mono: true,
            weight: 700,
            color: row.kept ? blue : c.textMuted,
        })
        fig.text(lx + lw, ry, row.status, {
            size: 13,
            weight: 700,
            color: col,
            align: 'right',
        })
    })

    fig.text(lx, 294, 'Record 2031 mentions neither "inference-api" nor "latency"', {
        size: 12,
        color: c.textMuted,
    })

    // Vertical hairline divider
    fig.line(376, 56, 376, 434, { color: c.borderSubtle, width: 1 })

    // ── Right: Directed Graph Expansion Walk ─────────────────────────────────
    const rx = 398
    const rw = 342
    fig.text(rx, 68, 'Graph Expansion Walk', { size: 16, weight: 700, color: purple })
    fig.text(rx, 90, 'Seed from Record 1842, follow 2 directed edges', {
        size: 13,
        color: c.textSecondary,
    })

    // Compact vertical-stepped graph inside right column
    const gx = rx + 12
    const gnW = 200
    const gnH = 44

    // Node 1: inference-api
    const g1Y = 114
    fig.rect(gx, g1Y, gnW, gnH, {
        fill: withColorAlpha(blue, 0.14),
        stroke: blue,
        strokeWidth: 1.7,
        radius: 8,
    })
    fig.text(gx + gnW / 2, g1Y + 22, 'inference-api', {
        size: 14,
        mono: true,
        weight: 700,
        color: blue,
        align: 'center',
    })
    fig.text(gx + gnW + 14, g1Y + 22, 'seed entity', { size: 12, color: c.textSecondary })

    // Edge 1: depends_on · 1842
    const g2Y = 186
    fig.arrow(gx + gnW / 2, g1Y + gnH + 3, gx + gnW / 2, g2Y - 3, {
        color: green,
        width: 2,
        head: 7,
    })
    fig.text(gx + gnW / 2 + 14, (g1Y + gnH + g2Y) / 2, 'depends_on · src 1842', {
        size: 12,
        mono: true,
        weight: 700,
        color: green,
    })

    // Node 2: Redis Cache
    fig.rect(gx, g2Y, gnW, gnH, {
        fill: withColorAlpha(green, 0.15),
        stroke: green,
        strokeWidth: 1.7,
        radius: 8,
    })
    fig.text(gx + gnW / 2, g2Y + 22, 'Redis Cache', {
        size: 14,
        weight: 700,
        color: green,
        align: 'center',
    })
    fig.text(gx + gnW + 14, g2Y + 22, 'bridge node', { size: 12, color: c.textSecondary })

    // Edge 2: uses_policy · 2031
    const g3Y = 258
    fig.arrow(gx + gnW / 2, g2Y + gnH + 3, gx + gnW / 2, g3Y - 3, {
        color: purple,
        width: 2,
        head: 7,
    })
    fig.text(gx + gnW / 2 + 14, (g2Y + gnH + g3Y) / 2, 'uses_policy · src 2031', {
        size: 12,
        mono: true,
        weight: 700,
        color: purple,
    })

    // Node 3: Old Maxmemory Policy -> pulls Rec 2031!
    fig.rect(gx, g3Y, gnW, gnH, {
        fill: withColorAlpha(purple, 0.16),
        stroke: purple,
        strokeWidth: 1.8,
        radius: 8,
    })
    fig.text(gx + gnW / 2, g3Y + 22, 'Old Maxmemory Policy', {
        size: 13,
        weight: 700,
        color: purple,
        align: 'center',
    })
    fig.rect(gx + gnW + 12, g3Y + 8, 108, 28, {
        fill: withColorAlpha(warm, 0.18),
        stroke: warm,
        strokeWidth: 1.4,
        radius: 14,
    })
    fig.text(gx + gnW + 66, g3Y + 22, '+ Rec 2031', {
        size: 13,
        mono: true,
        weight: 700,
        color: warm,
        align: 'center',
    })

    // ── Bottom Aligned Recall Comparison Strips ──────────────────────────────
    const recStripY = 344
    const drawRecallStrip = (
        sx: number,
        sw: number,
        heading: string,
        score: string,
        scoreColor: string,
        present: readonly boolean[],
    ) => {
        fig.line(sx, recStripY - 12, sx + sw, recStripY - 12, { color: c.borderSubtle, width: 1 })
        fig.text(sx, recStripY + 10, heading, { size: 14, weight: 700, color: c.textPrimary })
        fig.text(sx + sw, recStripY + 10, score, {
            size: 16,
            mono: true,
            weight: 800,
            color: scoreColor,
            align: 'right',
        })

        const ids = ['3155', '1842', '2031'] as const
        const pillW = 96
        const pillGap = 16
        ids.forEach((id, i) => {
            const px = sx + i * (pillW + pillGap)
            const ok = present[i]!
            const col = ok ? green : red
            fig.rect(px, recStripY + 34, pillW, 38, {
                fill: ok ? withColorAlpha(green, 0.18) : withColorAlpha(red, 0.08),
                stroke: col,
                strokeWidth: 1.6,
                radius: 8,
            })
            fig.text(px + pillW / 2, recStripY + 53, ok ? `${id} · hit` : `${id} · miss`, {
                size: 13,
                mono: true,
                weight: 700,
                color: col,
                align: 'center',
            })
        })
    }

    drawRecallStrip(lx, lw, 'Baseline Recall', '2 / 3', red, [true, true, false])
    drawRecallStrip(rx, rw, 'After Graph Expansion', '3 / 3', green, [true, true, true])

    return fig.render()
}

export default create('dark')
