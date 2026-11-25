import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 840
export const height = 390
export const alt =
    'Non-crossing query routing graph under authenticated workspace-a scope. On the left, a latest parser-v2 policy question routes to authorized_hybrid_search with requires_current_revision True. In the center, a combined build-1042 status and current migration policy question fans out cleanly to both authorized_hybrid_search and authorized_live_api. On the right, a live build-1042 status question routes only to authorized_live_api. Both backends converge into versioned evidence merge and live access recheck.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const warm = fig.tone('warm')
    const green = fig.tone('green')

    const fill = (color: string, amt = 0.11) => tint(color, c.bg, amt)

    // Top scope hairline bracket
    fig.brace(28, 34, 812, 34, 'Server-derived tenant scope: workspace-a', {
        side: -1,
        depth: 8,
        color: c.border,
        labelColor: c.textSecondary,
        labelSize: 13,
        labelGap: 12,
        weight: 600,
    })

    // Row 1: Three query nodes ordered so mixed fan-out sits in the center (ZERO edge crossings)
    const queries = [
        {
            x: 28,
            w: 244,
            tone: blue,
            kind: 'Policy Document',
            prompt: '"Latest parser-v2 policy"',
            flag: 'requires_current_revision = True',
        },
        {
            x: 298,
            w: 244,
            tone: purple,
            kind: 'Combined Query (Fan-out)',
            prompt: '"build-1042 + current policy"',
            flag: 'requires_current_revision = True',
        },
        {
            x: 568,
            w: 244,
            tone: warm,
            kind: 'Live Mutable State',
            prompt: '"Is build-1042 running?"',
            flag: 'requires_current_revision = True',
        },
    ]

    for (const q of queries) {
        fig.rect(q.x, 48, q.w, 84, {
            fill: fill(q.tone, 0.1),
            stroke: q.tone,
            strokeWidth: 1.35,
            radius: 8,
        })
        fig.text(q.x + q.w / 2, 68, q.kind, {
            size: 13,
            color: q.tone,
            align: 'center',
            weight: 700,
        })
        fig.text(q.x + q.w / 2, 92, q.prompt, {
            size: 13,
            color: c.textPrimary,
            align: 'center',
            weight: 600,
        })
        fig.text(q.x + q.w / 2, 114, q.flag, {
            size: 11.5,
            color: c.textSecondary,
            align: 'center',
            mono: true,
        })
    }

    // Row 2: Two execution backends
    fig.rect(48, 198, 344, 72, {
        fill: fill(blue, 0.12),
        stroke: blue,
        strokeWidth: 1.5,
        radius: 8,
    })
    fig.text(220, 221, 'authorized_hybrid_search', {
        size: 14,
        color: blue,
        align: 'center',
        weight: 700,
        mono: true,
    })
    fig.text(220, 247, 'Pre-filtered BM25 + HNSW · current revision', {
        size: 13,
        color: c.textSecondary,
        align: 'center',
    })

    fig.rect(448, 198, 344, 72, {
        fill: fill(warm, 0.12),
        stroke: warm,
        strokeWidth: 1.5,
        radius: 8,
    })
    fig.text(620, 221, 'authorized_live_api', {
        size: 14,
        color: warm,
        align: 'center',
        weight: 700,
        mono: true,
    })
    fig.text(620, 247, 'Direct build status · source-time fresh', {
        size: 13,
        color: c.textSecondary,
        align: 'center',
    })

    // Non-crossing connectors from Row 1 to Row 2
    // Left query -> Left backend
    fig.arrow(150, 132, 150, 196, { color: blue, width: 1.75, head: 6 })

    // Center mixed query -> Left backend (smooth curve, never crosses)
    fig.path('M378 132 C378 166, 302 162, 302 190', {
        color: purple,
        width: 1.75,
        dash: '5 4',
    })
    fig.arrow(302, 184, 302, 196, { color: purple, width: 1.75, head: 6 })

    // Center mixed query -> Right backend (smooth curve, never crosses)
    fig.path('M462 132 C462 166, 538 162, 538 190', {
        color: purple,
        width: 1.75,
        dash: '5 4',
    })
    fig.arrow(538, 184, 538, 196, { color: purple, width: 1.75, head: 6 })

    // Right query -> Right backend
    fig.arrow(690, 132, 690, 196, { color: warm, width: 1.75, head: 6 })

    // Clean edge labels in open corridor
    fig.text(420, 166, 'concurrent fan-out', {
        size: 12,
        color: purple,
        align: 'center',
        weight: 600,
    })

    // Row 3: Unified Evidence Merge & Live Access Recheck
    fig.rect(120, 314, 600, 56, {
        fill: fill(green, 0.12),
        stroke: green,
        strokeWidth: 1.5,
        radius: 8,
    })
    fig.text(420, 333, 'Versioned Evidence Merge & Live Access Recheck', {
        size: 14,
        color: green,
        align: 'center',
        weight: 700,
    })
    fig.text(420, 354, 'Join policy@2 [0-80] + build-1042 state · re-verify workspace-a grants', {
        size: 13,
        color: c.textSecondary,
        align: 'center',
    })

    // Connectors from Row 2 to Row 3
    fig.arrow(220, 270, 270, 312, { color: green, width: 1.75, head: 6 })
    fig.arrow(620, 270, 570, 312, { color: green, width: 1.75, head: 6 })

    return fig.render()
}

export default create()
