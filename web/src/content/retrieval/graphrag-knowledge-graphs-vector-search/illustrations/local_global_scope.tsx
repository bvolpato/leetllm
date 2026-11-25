import type { ThemeMode } from 'vizmatic'
import { withColorAlpha } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 436
export const alt =
    'Left: Local search ranks mixed graph and text candidates for one entity question and packs a 30-token relationship (score 0.98) and a 55-token text unit (score 0.91) into an 85-of-90-token budget bar while skipping an 80-token community report that overflows the 90-token cap. Right: Global search fans out community reports into parallel batches A (cache, queue) and B (eval, config), maps each batch to rated points, and reduces them into corpus-wide findings.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const purple = fig.tone('purple')

    // ── Left: Local Search · Entity Neighborhood + Token-Budget Bar ──────────
    const lx = 20
    const lw = 342

    fig.text(lx, 20, 'Local Search', { size: 18, weight: 700, color: blue })
    fig.text(lx + lw, 21, 'Entity neighborhood', {
        size: 13,
        weight: 600,
        color: c.textSecondary,
        align: 'right',
    })
    fig.text(lx, 44, 'Query: inference-api latency · 90-token cap', {
        size: 13,
        color: c.textSecondary,
    })

    // Column header row
    const hdrY = 74
    fig.text(lx + 8, hdrY, 'Candidate', { size: 12, weight: 600, color: c.textMuted })
    fig.text(lx + 178, hdrY, 'Score', { size: 12, weight: 600, color: c.textMuted, align: 'center' })
    fig.text(lx + 234, hdrY, 'Size', { size: 12, weight: 600, color: c.textMuted, align: 'center' })
    fig.text(lx + lw - 8, hdrY, 'Status', {
        size: 12,
        weight: 600,
        color: c.textMuted,
        align: 'right',
    })
    fig.line(lx, hdrY + 13, lx + lw, hdrY + 13, { color: c.borderSubtle, width: 1 })

    const candidates = [
        { name: 'depends_on · 1842', score: '0.98', tokens: '30 tok', status: 'packed', packed: true },
        { name: 'maxmemory · 2031', score: '0.91', tokens: '55 tok', status: 'packed', packed: true },
        { name: 'report · comm-7', score: '0.62', tokens: '80 tok', status: 'overflow', packed: false },
    ] as const

    candidates.forEach((item, idx) => {
        const ry = 98 + idx * 52
        const color = item.packed ? green : warm
        fig.rect(lx, ry, lw, 42, {
            fill: withColorAlpha(color, item.packed ? 0.11 : 0.06),
            stroke: withColorAlpha(color, item.packed ? 0.65 : 0.55),
            strokeWidth: item.packed ? 1.4 : 1.25,
            radius: 7,
        })
        fig.text(lx + 10, ry + 21, item.name, {
            size: 13,
            weight: 600,
            color: c.textPrimary,
        })
        fig.text(lx + 178, ry + 21, item.score, {
            size: 13,
            mono: true,
            weight: 700,
            color,
            align: 'center',
        })
        fig.text(lx + 234, ry + 21, item.tokens, {
            size: 13,
            mono: true,
            color: c.textSecondary,
            align: 'center',
        })
        fig.text(lx + lw - 8, ry + 21, item.status, {
            size: 13,
            weight: 700,
            color,
            align: 'right',
        })
    })

    // Proportional Token-Budget Bar (0..100 visual scale, cap at 90)
    const budgetTitleY = 278
    fig.text(lx, budgetTitleY, 'Context Budget Allocation', {
        size: 14,
        weight: 700,
        color: c.textPrimary,
    })
    fig.text(lx + lw, budgetTitleY, '85 / 90 tokens', {
        size: 14,
        mono: true,
        weight: 700,
        color: green,
        align: 'right',
    })

    const barY = 304
    const barH = 38
    const capW = 292 // 90 tokens -> 292px
    const tokPx = (t: number) => (t / 90) * capW

    // Track (90 tokens)
    fig.rect(lx, barY, capW, barH, {
        fill: tint(c.border, c.bg, 0.3),
        stroke: c.borderSubtle,
        strokeWidth: 1,
        radius: 6,
    })

    // Segment 1: 30 tok (1842)
    const w1 = tokPx(30)
    fig.rect(lx, barY, w1 - 2, barH, {
        fill: withColorAlpha(blue, 0.25),
        stroke: blue,
        strokeWidth: 1.5,
        radius: 6,
    })
    fig.text(lx + (w1 - 2) / 2, barY + barH / 2, '30 tok', {
        size: 13,
        mono: true,
        weight: 700,
        color: blue,
        align: 'center',
    })

    // Segment 2: 55 tok (2031)
    const w2 = tokPx(55)
    fig.rect(lx + w1 + 1, barY, w2 - 2, barH, {
        fill: withColorAlpha(green, 0.24),
        stroke: green,
        strokeWidth: 1.5,
        radius: 6,
    })
    fig.text(lx + w1 + 1 + (w2 - 2) / 2, barY + barH / 2, '55 tok (2031)', {
        size: 13,
        mono: true,
        weight: 700,
        color: green,
        align: 'center',
    })

    // Overflow ghost indicator past 90-token cap
    const capX = lx + capW
    fig.rect(capX + 4, barY + 4, 46, barH - 8, {
        fill: withColorAlpha(warm, 0.1),
        stroke: warm,
        strokeWidth: 1.25,
        radius: 4,
    })
    fig.text(capX + 27, barY + barH / 2, '+80', {
        size: 12,
        mono: true,
        weight: 700,
        color: warm,
        align: 'center',
    })

    // Crisp 90-token ceiling rule
    fig.line(capX, barY - 10, capX, barY + barH + 14, {
        color: warm,
        width: 2,
        dash: '4 3',
    })

    // Axis ticks under budget bar
    fig.text(lx, barY + barH + 22, '0', { size: 12, mono: true, color: c.textMuted })
    fig.text(lx + w1, barY + barH + 22, '30', {
        size: 12,
        mono: true,
        color: c.textMuted,
        align: 'center',
    })
    fig.text(lx + w1 + w2 - 6, barY + barH + 22, '85', {
        size: 12,
        mono: true,
        weight: 700,
        color: green,
        align: 'right',
    })
    fig.text(capX + 2, barY + barH + 22, '90 cap', {
        size: 12,
        mono: true,
        weight: 700,
        color: warm,
    })

    fig.text(lx, 396, '5 tokens spare · comm-7 (80 tok) skipped', {
        size: 13,
        color: c.textSecondary,
    })

    // ── Center Vertical Divider ──────────────────────────────────────────────
    fig.line(382, 16, 382, 418, { color: c.borderSubtle, width: 1 })

    // ── Right: Global Search · Map-Reduce Fan-Out / Fan-In ───────────────────
    const rx = 402
    const rw = 338
    const rCx = rx + rw / 2

    fig.text(rx, 20, 'Global Search', { size: 18, weight: 700, color: purple })
    fig.text(rx + rw, 21, 'Corpus-wide synthesis', {
        size: 13,
        weight: 600,
        color: c.textSecondary,
        align: 'right',
    })
    fig.text(rx, 44, 'Query: recurring latency themes across services', {
        size: 13,
        color: c.textSecondary,
    })

    // Top: Community Report Batches (Fan-out)
    const batchW = 158
    const batchH = 68
    const batchY = 88
    const bAx = rx
    const bBx = rx + rw - batchW

    const drawBatch = (x: number, tag: string, line1: string, line2: string) => {
        fig.rect(x, batchY, batchW, batchH, {
            fill: withColorAlpha(purple, 0.07),
            stroke: withColorAlpha(purple, 0.6),
            strokeWidth: 1.4,
            radius: 8,
        })
        fig.text(x + batchW / 2, batchY + 18, tag, {
            size: 13,
            mono: true,
            weight: 700,
            color: purple,
            align: 'center',
        })
        fig.text(x + batchW / 2, batchY + 38, line1, {
            size: 13,
            weight: 600,
            color: c.textPrimary,
            align: 'center',
        })
        fig.text(x + batchW / 2, batchY + 55, line2, {
            size: 12,
            color: c.textSecondary,
            align: 'center',
        })
    }

    drawBatch(bAx, 'BATCH A', 'Cache · Queue', 'community reports')
    drawBatch(bBx, 'BATCH B', 'Eval · Config', 'community reports')

    // Parallel Map boxes
    const mapY = 202
    const mapH = 62
    const drawMap = (x: number, title: string, sub: string) => {
        fig.rect(x, mapY, batchW, mapH, {
            fill: withColorAlpha(purple, 0.14),
            stroke: purple,
            strokeWidth: 1.6,
            radius: 8,
        })
        fig.text(x + batchW / 2, mapY + 21, title, {
            size: 14,
            weight: 700,
            color: purple,
            align: 'center',
        })
        fig.text(x + batchW / 2, mapY + 43, sub, {
            size: 13,
            color: c.textSecondary,
            align: 'center',
        })
    }

    drawMap(bAx, 'Map A', 'rated points + scores')
    drawMap(bBx, 'Map B', 'rated points + scores')

    // Arrows: Batch -> Map
    fig.arrow(bAx + batchW / 2, batchY + batchH + 4, bAx + batchW / 2, mapY - 4, {
        color: purple,
        width: 1.8,
        head: 7,
    })
    fig.arrow(bBx + batchW / 2, batchY + batchH + 4, bBx + batchW / 2, mapY - 4, {
        color: purple,
        width: 1.8,
        head: 7,
    })

    // Reduce synthesis box (Fan-in)
    const redY = 312
    const redH = 74
    fig.rect(rx + 8, redY, rw - 16, redH, {
        fill: withColorAlpha(green, 0.13),
        stroke: green,
        strokeWidth: 1.8,
        radius: 9,
    })
    fig.text(rCx, redY + 22, 'REDUCE · Rank & Synthesize', {
        size: 14,
        weight: 700,
        color: green,
        align: 'center',
    })
    fig.text(rCx, redY + 46, 'Cache eviction · Queue wait · Pool config', {
        size: 14,
        weight: 600,
        color: c.textPrimary,
        align: 'center',
    })

    // Converging arrows: Map A & Map B -> Reduce
    fig.arrow(bAx + batchW / 2, mapY + mapH + 4, rCx - 32, redY - 4, {
        color: green,
        width: 1.8,
        head: 7,
    })
    fig.arrow(bBx + batchW / 2, mapY + mapH + 4, rCx + 32, redY - 4, {
        color: green,
        width: 1.8,
        head: 7,
    })

    fig.text(rCx, 404, 'Parallel map over batches · single reduce pass', {
        size: 13,
        color: c.textSecondary,
        align: 'center',
    })

    return fig.render()
}

export default create('dark')
