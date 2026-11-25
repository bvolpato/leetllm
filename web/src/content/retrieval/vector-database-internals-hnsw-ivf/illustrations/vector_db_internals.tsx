import type { ThemeMode } from 'vizmatic'
import { withColorAlpha } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 450
export const alt =
    'Two index mechanisms narrow the candidate pool handed to exact distance scoring. On the left, HNSW walks proximity-graph links from entry v7 through v4 and v6 to expand base-layer neighbors v8 and v3. On the right, IVF places query q at x=4.9 on the List 0 side of Voronoi boundary x=5, selecting List 0 (v0, v1, v2) and skipping List 1 (v3, v4). Both feed their narrowed candidate pool into exact metric scoring and top-k selection.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const purple = fig.tone('purple')
    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const cyan = fig.tone('cyan')
    const red = fig.tone('critical')
    const warm = fig.tone('warm')

    // ── Left: HNSW Proximity Graph Traversal ─────────────────────────────────
    const lx = 20
    fig.text(lx, 20, 'HNSW · Walk Proximity Graph', {
        size: 16,
        weight: 700,
        color: purple,
    })
    fig.text(lx, 42, 'Greedy upper hops into Layer-0 neighborhood', {
        size: 13,
        color: c.textSecondary,
    })

    // Graph nodes
    const nodes = [
        { id: 'v7', label: 'entry v₇', x: 64, y: 168, w: 80, h: 42, color: c.textSecondary, fill: tint(c.border, c.bg, 0.3) },
        { id: 'v4', label: 'v₄', x: 170, y: 168, w: 54, h: 42, color: purple, fill: withColorAlpha(purple, 0.16) },
        { id: 'v6', label: 'v₆', x: 252, y: 168, w: 54, h: 42, color: purple, fill: withColorAlpha(purple, 0.16) },
        { id: 'v8', label: 'v₈', x: 336, y: 118, w: 52, h: 40, color: green, fill: withColorAlpha(green, 0.2) },
        { id: 'v3', label: 'v₃', x: 336, y: 218, w: 52, h: 40, color: green, fill: withColorAlpha(green, 0.2) },
    ] as const

    // Directed graph edges
    fig.arrow(106, 168, 141, 168, { color: purple, width: 2, head: 7 })
    fig.arrow(199, 168, 223, 168, { color: purple, width: 2, head: 7 })
    fig.arrow(280, 156, 308, 128, { color: green, width: 2, head: 7 })
    fig.arrow(280, 180, 308, 208, { color: green, width: 2, head: 7 })

    for (const n of nodes) {
        fig.rect(n.x - n.w / 2, n.y - n.h / 2, n.w, n.h, {
            fill: n.fill,
            stroke: n.color,
            strokeWidth: 1.75,
            radius: 8,
        })
        fig.text(n.x, n.y, n.label, {
            size: 14,
            mono: true,
            weight: 700,
            color: n.id === 'v7' ? c.textPrimary : n.color,
            align: 'center',
        })
    }

    // Subtle Layer-0 neighborhood callout
    fig.text(336, 82, 'Layer 0', { size: 14, weight: 700, color: green, align: 'center' })
    fig.text(196, 268, 'Candidates: visited local beam (ef_search)', {
        size: 13,
        color: c.textSecondary,
        align: 'center',
    })

    // Vertical divider
    fig.line(386, 16, 386, 294, { color: c.borderSubtle, width: 1 })

    // ── Right: IVF Voronoi Partition & List Selection ────────────────────────
    const rx = 408
    const rw = 332
    fig.text(rx, 20, 'IVF · Scan Selected Voronoi List', {
        size: 16,
        weight: 700,
        color: blue,
    })
    fig.text(rx, 42, '1D partition view · dividing boundary x = 5', {
        size: 13,
        color: c.textSecondary,
    })

    const axisY = 128
    const ax1 = rx + 18
    const ax2 = rx + rw - 18
    const mapX = (v: number) => ax1 + (v / 10) * (ax2 - ax1)

    // Shaded halves
    fig.rect(ax1 - 6, axisY - 32, mapX(5) - ax1 + 6, 64, {
        fill: withColorAlpha(blue, 0.08),
        radius: 6,
    })
    fig.rect(mapX(5), axisY - 32, ax2 - mapX(5) + 6, 64, {
        fill: withColorAlpha(warm, 0.05),
        radius: 6,
    })

    fig.line(ax1, axisY, ax2, axisY, { color: c.border, width: 2.2 })
    fig.line(mapX(5), axisY - 36, mapX(5), axisY + 36, {
        color: red,
        width: 2.2,
        dash: '5 4',
    })

    // Centroids C0, C1 & query q = 4.9
    fig.circle(mapX(0), axisY, 7, { fill: purple, stroke: c.bg, width: 1.5 })
    fig.circle(mapX(10), axisY, 7, { fill: warm, stroke: c.bg, width: 1.5 })
    const qx = mapX(4.9)
    fig.path(`M${qx} ${axisY - 8}L${qx + 8} ${axisY}L${qx} ${axisY + 8}L${qx - 8} ${axisY}Z`, {
        fill: cyan,
        color: c.bg,
        width: 1.5,
    })

    fig.text(mapX(0), axisY + 24, 'C₀ = 0', { size: 14, mono: true, weight: 700, color: purple, align: 'center' })
    fig.text(mapX(10), axisY + 24, 'C₁ = 10', { size: 14, mono: true, weight: 700, color: warm, align: 'center' })
    fig.text(qx - 8, axisY - 24, 'q = 4.9', { size: 14, mono: true, weight: 700, color: cyan, align: 'right' })
    fig.text(mapX(5) + 8, axisY - 24, 'x = 5', { size: 14, mono: true, weight: 700, color: red })

    // List 0 (selected) & List 1 (skipped at nprobe=1)
    const listY = 198
    const listW = 158
    fig.rect(rx, listY, listW, 54, {
        fill: withColorAlpha(blue, 0.14),
        stroke: blue,
        strokeWidth: 1.75,
        radius: 7,
    })
    fig.text(rx + listW / 2, listY + 17, 'List 0 · probed', {
        size: 13,
        weight: 700,
        color: blue,
        align: 'center',
    })
    fig.text(rx + listW / 2, listY + 38, 'v₀   v₁   v₂', {
        size: 14,
        mono: true,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
    })

    const rListX = rx + rw - listW
    fig.rect(rListX, listY, listW, 54, {
        fill: tint(c.border, c.bg, 0.2),
        stroke: c.borderSubtle,
        strokeWidth: 1.2,
        radius: 7,
    })
    fig.text(rListX + listW / 2, listY + 17, 'List 1 · skipped', {
        size: 13,
        weight: 600,
        color: c.textMuted,
        align: 'center',
    })
    fig.text(rListX + listW / 2, listY + 38, 'v₃   v₄', {
        size: 14,
        mono: true,
        color: c.textMuted,
        align: 'center',
    })

    fig.text(rx + rw / 2, 268, 'Candidates: inverted lists opened (nprobe)', {
        size: 13,
        color: c.textSecondary,
        align: 'center',
    })

    // ── Bottom: Shared Converging Scoring Stage ──────────────────────────────
    fig.line(20, 304, width - 20, 304, { color: c.borderSubtle, width: 1 })

    const barY = 362
    const barH = 58
    // Converging arrows from HNSW and IVF down into Candidate Pool
    fig.arrow(196, 286, 240, barY - 4, { color: purple, width: 2, head: 7 })
    fig.arrow(574, 286, 336, barY - 4, { color: blue, width: 2, head: 7 })

    fig.rect(120, barY, 240, barH, {
        fill: tint(c.border, c.bg, 0.28),
        stroke: c.border,
        strokeWidth: 1.6,
        radius: 8,
    })
    fig.text(240, barY + 20, 'Narrowed Candidate Pool', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
    })
    fig.text(240, barY + 41, 'Small subset of corpus vectors', {
        size: 13,
        color: c.textSecondary,
        align: 'center',
    })

    fig.arrow(366, barY + barH / 2, 424, barY + barH / 2, { color: green, width: 2.4, head: 8 })

    fig.rect(432, barY, 248, barH, {
        fill: withColorAlpha(green, 0.14),
        stroke: green,
        strokeWidth: 1.8,
        radius: 8,
    })
    fig.text(556, barY + 20, 'Exact Metric Score & Top-k', {
        size: 15,
        weight: 700,
        color: green,
        align: 'center',
    })
    fig.text(556, barY + 41, 'L2 / cosine distance ranking', {
        size: 13,
        color: c.textSecondary,
        align: 'center',
    })

    return fig.render()
}

export default create('dark')
