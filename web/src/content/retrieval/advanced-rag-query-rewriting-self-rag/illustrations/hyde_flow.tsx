import type { ThemeMode } from 'vizmatic'
import { withColorAlpha } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 450
export const alt =
    'Left: 2D embedding neighborhood map with three corpus chunks (Quota and Batch as required targets, Overview as a generic distractor) and three query embeddings. The raw question lands between Quota and Overview; a useful HyDE proxy shifts into the Quota-Batch neighborhood so its top-2 capture ring encloses both required chunks; a drifting proxy moves toward Overview and drops Quota. Right: aligned 0-to-9 overlap score bars compare top-2 ranks across the three queries, lifting Recall@2 from 1/2 to 2/2 with a useful proxy and dropping back to 1/2 with drift.'

interface RouteRow {
    readonly name: string
    readonly score: number
    readonly rank: string
    readonly required: boolean
}

interface RouteSpec {
    readonly title: string
    readonly recall: string
    readonly hitAll: boolean
    readonly tone: 'blue' | 'green' | 'critical'
    readonly rows: readonly RouteRow[]
}

const ROUTES: readonly RouteSpec[] = [
    {
        title: 'Raw question',
        recall: 'R@2 = 1/2',
        hitAll: false,
        tone: 'blue',
        rows: [
            { name: 'Quota', score: 2, rank: '#1', required: true },
            { name: 'Overview', score: 1, rank: '#2', required: false },
            { name: 'Batch', score: 1, rank: '--', required: true },
        ],
    },
    {
        title: 'Useful HyDE proxy',
        recall: 'R@2 = 2/2',
        hitAll: true,
        tone: 'green',
        rows: [
            { name: 'Quota', score: 6, rank: '#1', required: true },
            { name: 'Batch', score: 4, rank: '#2', required: true },
            { name: 'Overview', score: 2, rank: '--', required: false },
        ],
    },
    {
        title: 'Drifting proxy',
        recall: 'R@2 = 1/2',
        hitAll: false,
        tone: 'critical',
        rows: [
            { name: 'Overview', score: 9, rank: '#1', required: false },
            { name: 'Batch', score: 1, rank: '#2', required: true },
            { name: 'Quota', score: 0, rank: '--', required: true },
        ],
    },
]

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const red = fig.tone('critical')

    // ── Left: 2D Embedding-Space Neighborhood ────────────────────────────────
    fig.text(20, 20, 'Document Embedding Space', { size: 17, weight: 700, color: c.textPrimary })
    fig.text(20, 42, 'Top-2 nearest neighbors shift with the proxy vector', {
        size: 13,
        color: c.textSecondary,
    })

    const mapArea = { x: 20, y: 66, width: 344, height: 320 }
    // Subtle plot plane hairline (not a heavy card)
    fig.rect(mapArea.x, mapArea.y, mapArea.width, mapArea.height, {
        fill: withColorAlpha(c.bgSubtle, theme === 'light' ? 0.55 : 0.4),
        stroke: c.borderSubtle,
        strokeWidth: 1,
        radius: 10,
    })

    const plot = fig.plot(mapArea, { x: [0, 10], y: [0, 10] })

    // Subtle interior coordinate crosshairs
    for (const v of [2.5, 5, 7.5]) {
        fig.line(plot.px(v), mapArea.y + 8, plot.px(v), mapArea.y + mapArea.height - 8, {
            color: c.borderSubtle,
            width: 0.75,
            dash: '3 5',
            opacity: 0.6,
        })
        fig.line(mapArea.x + 8, plot.py(v), mapArea.x + mapArea.width - 8, plot.py(v), {
            color: c.borderSubtle,
            width: 0.75,
            dash: '3 5',
            opacity: 0.6,
        })
    }

    // Coordinates in [0,10]x[0,10]
    const quota = [2.4, 7.6] as const
    const batch = [2.6, 2.5] as const
    const overview = [7.9, 5.2] as const

    const rawQ = [5.1, 6.2] as const
    const goodHyde = [2.5, 5.0] as const
    const driftHyde = [7.0, 4.7] as const

    // Useful HyDE Top-2 capture neighborhood enclosing BOTH Quota & Batch
    const gCx = plot.px(goodHyde[0])
    const gCy = plot.py(goodHyde[1])
    fig.circle(gCx, gCy, 96, {
        fill: withColorAlpha(green, 0.1),
        stroke: green,
        width: 1.75,
        opacity: 0.85,
    })

    // Drifting proxy capture neighborhood enclosing Overview (far from Quota)
    const dCx = plot.px(driftHyde[0])
    const dCy = plot.py(driftHyde[1])
    fig.circle(dCx, dCy, 56, {
        fill: withColorAlpha(red, 0.09),
        stroke: red,
        width: 1.5,
        opacity: 0.8,
    })

    // Shift arrows from Raw question -> Useful HyDE and -> Drifting proxy
    const rCx = plot.px(rawQ[0])
    const rCy = plot.py(rawQ[1])

    // Curved shift: Raw -> Useful HyDE
    fig.path(
        `M${(rCx - 8).toFixed(1)} ${(rCy + 2).toFixed(1)}Q${((rCx + gCx) / 2 - 4).toFixed(1)} ${(rCy + 14).toFixed(1)},${(gCx + 12).toFixed(1)} ${(gCy - 1).toFixed(1)}`,
        { color: green, width: 2, dash: '5 4' },
    )
    fig.arrow(gCx + 22, gCy + 2, gCx + 10, gCy, { color: green, width: 2, head: 7 })

    // Curved shift: Raw -> Drifting proxy
    fig.path(
        `M${(rCx + 8).toFixed(1)} ${(rCy + 4).toFixed(1)}Q${((rCx + dCx) / 2 + 8).toFixed(1)} ${(rCy + 10).toFixed(1)},${(dCx - 10).toFixed(1)} ${(dCy - 4).toFixed(1)}`,
        { color: red, width: 2, dash: '5 4' },
    )
    fig.arrow(dCx - 18, dCy - 9, dCx - 9, dCy - 3, { color: red, width: 2, head: 7 })

    // Corpus chunk anchors (squares for documents)
    const drawChunk = (pt: readonly [number, number], color: string, name: string, dy: number) => {
        const cx = plot.px(pt[0])
        const cy = plot.py(pt[1])
        fig.rect(cx - 7, cy - 7, 14, 14, {
            fill: color,
            stroke: c.bg,
            strokeWidth: 2,
            radius: 3,
        })
        fig.text(cx, cy + dy, name, {
            size: 13,
            weight: 700,
            color,
            align: 'center',
        })
    }

    drawChunk(quota, green, 'Quota (req)', -20)
    drawChunk(batch, green, 'Batch (req)', 21)
    drawChunk(overview, warm, 'Overview', -20)

    // Query vectors (circles)
    const drawQuery = (
        pt: readonly [number, number],
        color: string,
        name: string,
        dx: number,
        dy: number,
        align: 'left' | 'center' | 'right' = 'center',
    ) => {
        const cx = plot.px(pt[0])
        const cy = plot.py(pt[1])
        fig.circle(cx, cy, 7.5, { fill: color, stroke: c.bg, width: 2 })
        fig.text(cx + dx, cy + dy, name, { size: 13, weight: 700, color, align })
    }

    drawQuery(rawQ, blue, 'Raw q', 0, -19, 'center')
    drawQuery(goodHyde, green, 'HyDE', 0, -18, 'center')
    drawQuery(driftHyde, red, 'Drift', -2, 22, 'center')

    // Compact legend beneath embedding map
    const legY = 412
    fig.rect(24, legY - 5, 10, 10, { fill: green, radius: 2 })
    fig.text(40, legY, 'Required chunk', { size: 12, color: c.textSecondary })
    fig.rect(148, legY - 5, 10, 10, { fill: warm, radius: 2 })
    fig.text(164, legY, 'Distractor', { size: 12, color: c.textSecondary })
    fig.circle(244, legY, 5, { fill: blue })
    fig.text(255, legY, 'Query vector', { size: 12, color: c.textSecondary })

    // Vertical hairline separator
    fig.line(384, 16, 384, 434, { color: c.borderSubtle, width: 1 })

    // ── Right: Aligned Overlap & Top-2 Rank Comparison ───────────────────────
    const rightX = 404
    fig.text(rightX, 20, 'Chunk Overlap & Top-2 Rank', {
        size: 17,
        weight: 700,
        color: c.textPrimary,
    })
    fig.text(rightX, 42, 'Shared 0–9 scale · top-2 selected', {
        size: 13,
        color: c.textSecondary,
    })

    const nameX = rightX
    const barX = rightX + 86
    const barMaxW = 162
    const scoreX = barX + barMaxW + 10
    const rankX = width - 20

    ROUTES.forEach((route, idx) => {
        const blockY = 74 + idx * 124
        const accent = fig.tone(route.tone)

        // Subtle tinted strip behind Useful HyDE to highlight the winner
        if (route.hitAll) {
            fig.rect(rightX - 10, blockY - 12, width - rightX + 2, 114, {
                fill: withColorAlpha(green, 0.08),
                stroke: withColorAlpha(green, 0.35),
                strokeWidth: 1,
                radius: 8,
            })
        } else if (idx > 0) {
            fig.line(rightX, blockY - 14, width - 20, blockY - 14, {
                color: c.borderSubtle,
                width: 1,
            })
        }

        fig.text(nameX, blockY + 4, route.title, {
            size: 15,
            weight: 700,
            color: accent,
        })
        fig.text(rankX, blockY + 4, route.recall, {
            size: 14,
            weight: 700,
            mono: true,
            color: route.hitAll ? green : warm,
            align: 'right',
        })

        route.rows.forEach((row, rIdx) => {
            const ry = blockY + 34 + rIdx * 26
            const rowColor = row.required ? green : warm
            const selected = row.rank !== '--'

            fig.text(nameX, ry, row.name, {
                size: 13,
                weight: selected ? 700 : 500,
                color: selected ? c.textPrimary : c.textMuted,
            })

            // Bar track
            fig.rect(barX, ry - 6, barMaxW, 12, {
                fill: tint(c.border, c.bg, 0.35),
                radius: 3,
            })
            if (row.score > 0) {
                fig.rect(barX, ry - 6, (barMaxW * row.score) / 9, 12, {
                    fill: rowColor,
                    opacity: selected ? 0.92 : 0.45,
                    radius: 3,
                })
            }

            fig.text(scoreX, ry, `${row.score}/9`, {
                size: 13,
                mono: true,
                weight: selected ? 700 : 500,
                color: selected ? rowColor : c.textMuted,
            })

            fig.text(rankX, ry, row.rank, {
                size: 13,
                mono: true,
                weight: 700,
                color: selected ? rowColor : c.textMuted,
                align: 'right',
            })
        })
    })

    return fig.render()
}

export default create('dark')
