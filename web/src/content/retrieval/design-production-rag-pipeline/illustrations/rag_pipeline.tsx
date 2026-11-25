import type { ThemeMode } from 'vizmatic'
import { withColorAlpha } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export { createFilm } from './_parts/rag-narrowing-film'

export const width = 760
export const height = 472
export const alt =
    'A log-scaled RAG candidate narrowing funnel reduces 100,000 indexed chunks to 18,000 ACL- and version-permitted chunks (2 ms, privacy boundary), 50 hybrid BM25+dense RRF candidates (18 ms, recall), 5 cross-encoder reranked parent sections (35 ms, precision), and 1,800 packed prompt tokens driving a cited answer or abstention (320 ms model TTFT).'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const purple = fig.tone('purple')
    const cyan = fig.tone('cyan')
    const warm = fig.tone('warm')
    const green = fig.tone('green')

    const funnelLeft = 206
    const funnelMaxW = 310 // log10(100,000) = 5.0
    const logW = (count: number) => Math.max(30, (Math.log10(count) / 5) * funnelMaxW)
    const barH = 48

    const stages = [
        {
            name: '0 · Corpus Index',
            sub: 'All indexed chunks',
            countLabel: '100,000 chunks',
            w: logW(100_000),
            y: 74,
            color: c.textSecondary,
            fill: tint(c.border, c.bg, 0.35),
            latency: 'Offline',
            latencyW: 0,
            invariant: 'Versioned bundle',
        },
        {
            name: '1 · ACL Pre-Filter',
            sub: 'Tenant, group, rev',
            countLabel: '18,000 eligible',
            w: logW(18_000),
            y: 148,
            color: purple,
            fill: withColorAlpha(purple, 0.22),
            latency: '2 ms',
            latencyW: 12,
            invariant: 'Privacy boundary',
        },
        {
            name: '2 · Hybrid RRF',
            sub: 'BM25 + dense search',
            countLabel: '50 candidates',
            w: logW(50),
            y: 222,
            color: cyan,
            fill: withColorAlpha(cyan, 0.22),
            latency: '18 ms',
            latencyW: 26,
            invariant: 'High recall',
        },
        {
            name: '3 · Rerank + Parent',
            sub: 'Cross-encoder top-5',
            countLabel: '5 parents',
            w: logW(5),
            y: 296,
            color: warm,
            fill: withColorAlpha(warm, 0.22),
            latency: '35 ms',
            latencyW: 40,
            invariant: 'High precision',
        },
        {
            name: '4 · Context Packing',
            sub: 'Pack [E1]..[E5] for LLM',
            countLabel: '1,800 prompt tok',
            w: 220,
            y: 374,
            color: green,
            fill: withColorAlpha(green, 0.2),
            latency: '320 ms',
            latencyW: 86,
            invariant: 'Cited or abstain',
        },
    ] as const

    // ── Column Headings (frameless) ──────────────────────────────────────────
    fig.text(20, 18, 'Candidate Narrowing Funnel (log₁₀ scale)', {
        size: 16,
        weight: 700,
        color: c.textPrimary,
    })

    const rightX = 548
    fig.text(rightX, 18, 'Latency & Invariant', {
        size: 16,
        weight: 700,
        color: c.textPrimary,
    })
    fig.text(rightX, 42, '375 ms e2e TTFT', {
        size: 14,
        mono: true,
        weight: 700,
        color: warm,
    })

    // Subtle vertical divider between funnel and latency column
    fig.line(532, 16, 532, 446, { color: c.borderSubtle, width: 1 })

    // ── Log10 Axis Ticks & Hairline Grid ─────────────────────────────────────
    const ticks = [
        { exp: 0, label: '1' },
        { exp: 1, label: '10' },
        { exp: 2, label: '10²' },
        { exp: 3, label: '10³' },
        { exp: 4, label: '10⁴' },
        { exp: 5, label: '10⁵' },
    ] as const

    for (const t of ticks) {
        const gx = funnelLeft + (t.exp / 5) * funnelMaxW
        fig.line(gx, 66, gx, 350, {
            color: c.borderSubtle,
            width: 1,
            dash: '3 4',
        })
        fig.text(gx, 48, t.label, {
            size: 13,
            mono: true,
            color: c.textMuted,
            align: t.exp === 5 ? 'right' : 'center',
        })
    }

    // ── Narrowing Trapezoids between stages 0 -> 1 -> 2 -> 3 ────────────────
    for (let i = 0; i < 3; i++) {
        const a = stages[i]!
        const b = stages[i + 1]!
        fig.path(
            `M${funnelLeft} ${a.y + barH}L${funnelLeft + a.w} ${a.y + barH}L${funnelLeft + b.w} ${b.y}L${funnelLeft} ${b.y}Z`,
            { fill: b.color, fillOpacity: 0.12 },
        )
    }

    // Expansion arrow from 5 parents -> 1,800 packed prompt tokens
    const s3 = stages[3]!
    const s4 = stages[4]!
    fig.arrow(funnelLeft + s3.w / 2, s3.y + barH + 2, funnelLeft + s3.w / 2, s4.y - 3, {
        color: green,
        width: 2.2,
        head: 7,
    })

    // ── Stage Bars, Stage Titles, and Latency/Invariant Rows ─────────────────
    stages.forEach((s, i) => {
        fig.rect(funnelLeft, s.y, s.w, barH, {
            fill: s.fill,
            stroke: s.color,
            strokeWidth: 1.8,
            radius: 7,
        })

        // Left stage title + subtitle
        fig.text(20, s.y + 15, s.name, {
            size: 14,
            weight: 700,
            color: i === 0 ? c.textPrimary : s.color,
        })
        fig.text(20, s.y + 35, s.sub, {
            size: 13,
            color: c.textSecondary,
        })

        // Count inside wide bars, or cleanly to the right of narrow bars
        const inside = s.w >= 175
        fig.text(inside ? funnelLeft + 12 : funnelLeft + s.w + 10, s.y + barH / 2, s.countLabel, {
            size: 14,
            mono: true,
            weight: 700,
            color: i === 0 ? c.textPrimary : s.color,
        })

        // Right column row separator
        if (i > 0) {
            fig.line(rightX, s.y - 12, width - 20, s.y - 12, {
                color: c.borderSubtle,
                width: 1,
            })
        }

        // Latency bar + label
        if (s.latencyW > 0) {
            fig.rect(rightX, s.y + 7, s.latencyW, 14, {
                fill: s.color,
                radius: 4,
            })
        }
        fig.text(s.latencyW > 0 ? rightX + s.latencyW + 8 : rightX, s.y + 14, s.latency, {
            size: 14,
            mono: true,
            weight: 700,
            color: i === 0 ? c.textMuted : s.color,
        })
        fig.text(rightX, s.y + 36, s.invariant, {
            size: 13,
            weight: 600,
            color: c.textSecondary,
        })
    })

    // Bottom crisp reduction summary
    fig.text(20, 448, '20,000× candidate reduction · zero unauthorized chunks scored', {
        size: 13,
        weight: 600,
        color: c.textSecondary,
    })

    return fig.render()
}

export default create('dark')
