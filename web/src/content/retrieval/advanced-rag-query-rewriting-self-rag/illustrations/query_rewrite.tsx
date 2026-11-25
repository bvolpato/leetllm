import type { ThemeMode } from 'vizmatic'
import { withColorAlpha } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 432
export const alt =
    'Top lane: when endpoint names are known, three independent sub-queries (Latency, Limits, Retries) fan out in parallel from the embedding API comparison request and merge while flagging any missing evidence. Bottom lane: when the target endpoint is unknown, Hop 1 finds the highest-error endpoint (embeddings/sync) before Hop 2 searches its circuit-breaker settings, or halts to surface the missing endpoint if Hop 1 returns nothing.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const purple = fig.tone('purple')
    const red = fig.tone('critical')

    // ── Top Lane: PARALLEL · Known Entities ──────────────────────────────────
    fig.text(20, 20, 'PARALLEL · All Entities Known', {
        size: 15,
        weight: 700,
        color: blue,
    })
    fig.text(width - 20, 20, '1× retrieval round-trip', {
        size: 13,
        mono: true,
        weight: 600,
        color: c.textSecondary,
        align: 'right',
    })

    // Start box
    const pStartX = 20
    const pStartY = 66
    const pStartW = 196
    const pStartH = 114
    fig.rect(pStartX, pStartY, pStartW, pStartH, {
        fill: withColorAlpha(blue, 0.1),
        stroke: blue,
        strokeWidth: 1.6,
        radius: 8,
    })
    fig.text(pStartX + pStartW / 2, pStartY + 28, 'Decompose Query', {
        size: 14,
        weight: 700,
        color: blue,
        align: 'center',
    })
    fig.text(pStartX + pStartW / 2, pStartY + 58, 'Compare sync + batch', {
        size: 13,
        color: c.textPrimary,
        align: 'center',
    })
    fig.text(pStartX + pStartW / 2, pStartY + 82, 'embedding endpoints', {
        size: 13,
        color: c.textSecondary,
        align: 'center',
    })

    // 3 Parallel Sub-Query Tracks
    const midX = 278
    const midW = 192
    const subH = 32
    const subs = [
        { y: 66, tag: '01', name: 'Latency specs' },
        { y: 107, tag: '02', name: 'Rate limits' },
        { y: 148, tag: '03', name: 'Retry behavior' },
    ] as const

    const gatherX = 532
    const gatherW = 208

    for (const sub of subs) {
        const cy = sub.y + subH / 2
        fig.rect(midX, sub.y, midW, subH, {
            fill: tint(c.border, c.bg, 0.28),
            stroke: withColorAlpha(blue, 0.65),
            strokeWidth: 1.35,
            radius: 7,
        })
        fig.text(midX + 14, cy, sub.tag, {
            size: 13,
            mono: true,
            weight: 700,
            color: blue,
        })
        fig.text(midX + 44, cy, sub.name, {
            size: 14,
            weight: 600,
            color: c.textPrimary,
        })

        // Fan-out and fan-in arrows
        fig.arrow(pStartX + pStartW + 4, cy, midX - 4, cy, { color: blue, width: 1.8, head: 7 })
        fig.arrow(midX + midW + 4, cy, gatherX - 4, cy, { color: green, width: 1.8, head: 7 })
    }

    // Gather & Merge box
    fig.rect(gatherX, pStartY, gatherW, pStartH, {
        fill: withColorAlpha(green, 0.11),
        stroke: green,
        strokeWidth: 1.6,
        radius: 8,
    })
    fig.text(gatherX + gatherW / 2, pStartY + 28, 'Merge & Compare', {
        size: 14,
        weight: 700,
        color: green,
        align: 'center',
    })
    fig.text(gatherX + gatherW / 2, pStartY + 58, 'Combine matched spans;', {
        size: 13,
        color: c.textPrimary,
        align: 'center',
    })
    fig.text(gatherX + gatherW / 2, pStartY + 82, 'flag missing fields', {
        size: 13,
        color: c.textSecondary,
        align: 'center',
    })

    // ── Horizontal Lane Divider ──────────────────────────────────────────────
    fig.line(20, 206, width - 20, 206, { color: c.border, width: 1 })

    // ── Bottom Lane: SEQUENTIAL · Dependent Multi-Hop ────────────────────────
    fig.text(20, 230, 'SEQUENTIAL · Unresolved Entity Dependency', {
        size: 15,
        weight: 700,
        color: purple,
    })
    fig.text(width - 20, 230, '2× dependent hops', {
        size: 13,
        mono: true,
        weight: 600,
        color: c.textSecondary,
        align: 'right',
    })

    const hopY = 264
    const hopH = 88

    // Hop 1: Find endpoint
    const h1X = 20
    const h1W = 248
    fig.rect(h1X, hopY, h1W, hopH, {
        fill: withColorAlpha(purple, 0.11),
        stroke: purple,
        strokeWidth: 1.6,
        radius: 8,
    })
    fig.text(h1X + 14, hopY + 24, 'Hop 1 · Find Endpoint', {
        size: 14,
        weight: 700,
        color: purple,
    })
    fig.text(h1X + 14, hopY + 50, 'Which endpoint had the most', {
        size: 13,
        color: c.textPrimary,
    })
    fig.text(h1X + 14, hopY + 70, 'errors in the last window?', {
        size: 13,
        color: c.textSecondary,
    })

    // Edge carrying resolved entity pill "embeddings/sync"
    const h2X = 436
    const h2W = 304
    const edgeMidX = (h1X + h1W + h2X) / 2
    const edgeY = hopY + hopH / 2
    fig.arrow(h1X + h1W + 4, edgeY, h2X - 4, edgeY, {
        color: blue,
        width: 2.2,
        head: 8,
    })
    fig.rect(edgeMidX - 68, edgeY - 36, 136, 26, {
        fill: withColorAlpha(blue, 0.18),
        stroke: blue,
        strokeWidth: 1.3,
        radius: 13,
    })
    fig.text(edgeMidX, edgeY - 23, 'embeddings/sync', {
        size: 12,
        mono: true,
        weight: 700,
        color: blue,
        align: 'center',
    })
    fig.text(edgeMidX, edgeY + 18, 'resolved entity', {
        size: 12,
        color: c.textMuted,
        align: 'center',
    })

    // Hop 2: Search resolved endpoint
    fig.rect(h2X, hopY, h2W, hopH, {
        fill: withColorAlpha(green, 0.11),
        stroke: green,
        strokeWidth: 1.6,
        radius: 8,
    })
    fig.text(h2X + 14, hopY + 24, 'Hop 2 · Search That Endpoint', {
        size: 14,
        weight: 700,
        color: green,
    })
    fig.text(h2X + 14, hopY + 50, 'Retrieve circuit-breaker settings for', {
        size: 13,
        color: c.textPrimary,
    })
    fig.text(h2X + 14, hopY + 70, 'embeddings/sync', {
        size: 13,
        mono: true,
        weight: 700,
        color: blue,
    })

    // Missing-evidence stop branch underneath Hop 1
    const missY = 382
    fig.path(`M${h1X + 124} ${hopY + hopH + 2}L${h1X + 124} ${missY}L${256} ${missY}`, {
        color: red,
        width: 1.75,
        dash: '4 3',
    })
    fig.arrow(248, missY, 264, missY, { color: red, width: 1.75, head: 7 })

    fig.rect(272, missY - 17, 468, 34, {
        fill: withColorAlpha(red, 0.08),
        stroke: withColorAlpha(red, 0.55),
        strokeWidth: 1.3,
        radius: 7,
    })
    fig.text(286, missY, 'No hit in Hop 1:', {
        size: 13,
        weight: 700,
        color: red,
    })
    fig.text(398, missY, 'Stop and report missing endpoint (never guess)', {
        size: 13,
        color: c.textSecondary,
    })

    return fig.render()
}

export default create('dark')
