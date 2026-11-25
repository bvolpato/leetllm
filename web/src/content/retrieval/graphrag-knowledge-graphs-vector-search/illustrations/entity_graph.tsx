import type { ThemeMode } from 'vizmatic'
import { withColorAlpha } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 434
export const alt =
    'Top: two source records extract separate triples, with Record 1842 linking inference-api to Redis Cache and Record 2031 linking Redis Cache to Old Maxmemory Policy. Middle: entity resolution merges both Redis Cache mentions under one typed node (Redis Cache, Datastore) and unions their source IDs (1842, 2031). Bottom: the resolved directed property graph connects inference-api (Service) via depends_on (source 1842) through Redis Cache (Datastore) via uses_policy (source 2031) to Old Maxmemory Policy (ConfigPolicy).'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const purple = fig.tone('purple')

    // ── Top Row: Raw Per-Record Extractions ──────────────────────────────────
    fig.text(20, 18, '1. Per-Record Extraction', { size: 15, weight: 700, color: c.textPrimary })
    fig.text(width - 20, 18, 'Two separate source records mention Redis Cache', {
        size: 13,
        color: c.textSecondary,
        align: 'right',
    })

    const recY = 42
    const recH = 66
    const recW = 344

    // Record 1842
    fig.rect(20, recY, recW, recH, {
        fill: withColorAlpha(blue, 0.07),
        stroke: withColorAlpha(blue, 0.55),
        strokeWidth: 1.35,
        radius: 8,
    })
    fig.text(32, recY + 17, 'Record 1842', { size: 13, mono: true, weight: 700, color: blue })
    fig.text(32, recY + 44, 'inference-api', { size: 13, mono: true, color: c.textPrimary })
    fig.arrow(144, recY + 44, 232, recY + 44, { color: blue, width: 1.6, head: 6 })
    fig.text(186, recY + 32, 'depends_on', {
        size: 11,
        mono: true,
        color: blue,
        align: 'center',
    })
    fig.rect(240, recY + 31, 112, 24, {
        fill: withColorAlpha(green, 0.2),
        stroke: green,
        strokeWidth: 1.3,
        radius: 5,
    })
    fig.text(296, recY + 43, 'Redis Cache', {
        size: 13,
        weight: 700,
        color: green,
        align: 'center',
    })

    // Record 2031
    const r2X = 396
    fig.rect(r2X, recY, recW, recH, {
        fill: withColorAlpha(purple, 0.07),
        stroke: withColorAlpha(purple, 0.55),
        strokeWidth: 1.35,
        radius: 8,
    })
    fig.text(r2X + 12, recY + 17, 'Record 2031', { size: 13, mono: true, weight: 700, color: purple })
    fig.rect(r2X + 12, recY + 31, 112, 24, {
        fill: withColorAlpha(green, 0.2),
        stroke: green,
        strokeWidth: 1.3,
        radius: 5,
    })
    fig.text(r2X + 68, recY + 43, 'Redis Cache', {
        size: 13,
        weight: 700,
        color: green,
        align: 'center',
    })
    fig.arrow(r2X + 130, recY + 44, r2X + 220, recY + 44, { color: purple, width: 1.6, head: 6 })
    fig.text(r2X + 174, recY + 32, 'uses_policy', {
        size: 11,
        mono: true,
        color: purple,
        align: 'center',
    })
    fig.text(r2X + 228, recY + 44, 'Maxmemory', {
        size: 13,
        weight: 600,
        color: c.textPrimary,
    })

    // ── Middle: Converging Entity-Resolution Merge ───────────────────────────
    const mergeY = 198
    const centerNodeX = 380
    fig.arrow(296, recY + recH + 4, centerNodeX - 24, mergeY - 6, {
        color: green,
        width: 2.2,
        head: 8,
    })
    fig.arrow(r2X + 68, recY + recH + 4, centerNodeX + 24, mergeY - 6, {
        color: green,
        width: 2.2,
        head: 8,
    })

    // Solid tinted pill drawn AFTER arrows so arrows cleanly pass behind it
    fig.rect(248, 134, 264, 30, {
        fill: tint(green, c.bg, 0.14),
        stroke: withColorAlpha(green, 0.7),
        strokeWidth: 1.4,
        radius: 15,
    })
    fig.text(centerNodeX, 149, 'Entity Resolution · union source IDs', {
        size: 13,
        weight: 700,
        color: green,
        align: 'center',
    })

    // ── Bottom Row: Resolved Typed Property Graph ────────────────────────────
    fig.text(20, 180, '2. Canonical Typed Graph', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
    })

    const nodeY = 204
    const nodeH = 88

    // Node 1: inference-api (Service)
    const n1X = 20
    const n1W = 192
    fig.rect(n1X, nodeY, n1W, nodeH, {
        fill: withColorAlpha(blue, 0.12),
        stroke: blue,
        strokeWidth: 1.8,
        radius: 9,
    })
    fig.text(n1X + n1W / 2, nodeY + 28, 'inference-api', {
        size: 16,
        mono: true,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
    })
    fig.text(n1X + n1W / 2, nodeY + 52, 'Service', {
        size: 13,
        weight: 700,
        color: blue,
        align: 'center',
    })
    fig.text(n1X + n1W / 2, nodeY + 72, 'src: 1842', {
        size: 12,
        mono: true,
        color: c.textSecondary,
        align: 'center',
    })

    // Node 2: Redis Cache (Merged Datastore)
    const n2X = 282
    const n2W = 196
    fig.rect(n2X, nodeY, n2W, nodeH, {
        fill: withColorAlpha(green, 0.16),
        stroke: green,
        strokeWidth: 2.2,
        radius: 9,
    })
    fig.text(n2X + n2W / 2, nodeY + 28, 'Redis Cache', {
        size: 16,
        weight: 800,
        color: c.textPrimary,
        align: 'center',
    })
    fig.text(n2X + n2W / 2, nodeY + 52, 'Datastore (merged)', {
        size: 13,
        weight: 700,
        color: green,
        align: 'center',
    })
    fig.text(n2X + n2W / 2, nodeY + 72, 'src: 1842, 2031', {
        size: 12,
        mono: true,
        weight: 700,
        color: green,
        align: 'center',
    })

    // Node 3: Old Maxmemory Policy (ConfigPolicy)
    const n3X = 548
    const n3W = 192
    fig.rect(n3X, nodeY, n3W, nodeH, {
        fill: withColorAlpha(warm, 0.12),
        stroke: warm,
        strokeWidth: 1.8,
        radius: 9,
    })
    fig.text(n3X + n3W / 2, nodeY + 22, 'Old Maxmemory', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
    })
    fig.text(n3X + n3W / 2, nodeY + 42, 'Policy', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
    })
    fig.text(n3X + n3W / 2, nodeY + 62, 'ConfigPolicy', {
        size: 13,
        weight: 700,
        color: warm,
        align: 'center',
    })
    fig.text(n3X + n3W / 2, nodeY + 78, 'src: 2031', {
        size: 12,
        mono: true,
        color: c.textSecondary,
        align: 'center',
    })

    // Directed source-cited edges between canonical nodes
    const edgeY = nodeY + nodeH / 2
    fig.arrow(n1X + n1W + 4, edgeY, n2X - 4, edgeY, { color: blue, width: 2.2, head: 8 })
    fig.arrow(n2X + n2W + 4, edgeY, n3X - 4, edgeY, { color: purple, width: 2.2, head: 8 })

    // Edge labels cleanly BELOW the edges
    const e1Cx = (n1X + n1W + n2X) / 2
    const e2Cx = (n2X + n2W + n3X) / 2
    fig.text(e1Cx, nodeY + nodeH + 18, 'depends_on', {
        size: 13,
        mono: true,
        weight: 700,
        color: blue,
        align: 'center',
    })
    fig.text(e1Cx, nodeY + nodeH + 36, 'cites 1842', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
    })

    fig.text(e2Cx, nodeY + nodeH + 18, 'uses_policy', {
        size: 13,
        mono: true,
        weight: 700,
        color: purple,
        align: 'center',
    })
    fig.text(e2Cx, nodeY + nodeH + 36, 'cites 2031', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
    })

    // ── Bottom: Typed-Key Invariant Strip ────────────────────────────────────
    fig.line(20, 356, width - 20, 356, { color: c.borderSubtle, width: 1 })
    fig.rect(20, 372, width - 40, 44, {
        fill: tint(c.border, c.bg, 0.24),
        stroke: c.borderSubtle,
        strokeWidth: 1,
        radius: 7,
    })
    fig.text(36, 394, 'Identity key:', { size: 13, weight: 700, color: c.textPrimary })
    fig.text(124, 394, '(canonical_title, canonical_type)', {
        size: 13,
        mono: true,
        weight: 700,
        color: blue,
    })
    fig.text(width - 36, 394, 'Prevents merging Compiler:Triton with Server:Triton', {
        size: 13,
        color: c.textSecondary,
        align: 'right',
    })

    return fig.render()
}

export default create('dark')
