import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const alt =
    'Scatter geometry of six two-dimensional corpus embeddings. Euclidean links pair finance vectors fin_A and fin_B at distance 0.82, vision vectors vis_A and vis_B at 1.08, and systems vectors sys_A and sys_B at 1.28, alongside each document excerpt.'

export const width = 780
export const height = 430

interface GroupSpec {
    topic: string
    excerpt: string
    tone: 'blue' | 'purple' | 'green'
    p1: readonly [number, number]
    p2: readonly [number, number]
    n1: string
    n2: string
    dist: string
    labelPos: readonly [number, number]
    dPos: readonly [number, number]
}

const GROUPS: readonly GroupSpec[] = [
    {
        topic: 'Finance',
        excerpt: 'Orders & hedging',
        tone: 'blue',
        p1: [1.0, 1.0],
        p2: [1.2, 1.8],
        n1: 'fin_A',
        n2: 'fin_B',
        dist: 'd = 0.82',
        labelPos: [1.7, 2.65],
        dPos: [1.85, 1.4],
    },
    {
        topic: 'Vision',
        excerpt: 'ViTs & convs',
        tone: 'purple',
        p1: [4.0, 4.2],
        p2: [5.0, 3.8],
        n1: 'vis_A',
        n2: 'vis_B',
        dist: 'd = 1.08',
        labelPos: [4.5, 5.18],
        dPos: [4.5, 3.45],
    },
    {
        topic: 'Systems',
        excerpt: 'Tiling & warps',
        tone: 'green',
        p1: [8.0, 1.0],
        p2: [9.0, 1.8],
        n1: 'sys_A',
        n2: 'sys_B',
        dist: 'd = 1.28',
        labelPos: [8.3, 2.65],
        dPos: [8.85, 1.15],
    },
]

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig

    const plot = fig.plot(
        { x: 64, y: 36, width: 676, height: 336 },
        { x: [0, 10], y: [0, 5.4] },
    )
    plot.axes({
        xTicks: [0, 2, 4, 6, 8, 10],
        yTicks: [0, 1, 2, 3, 4, 5],
        xLabel: 'Embedding dimension 1',
        yLabel: 'Embedding dimension 2',
        grid: true,
        labelSize: 12,
    })

    for (const g of GROUPS) {
        const col = fig.tone(g.tone)
        const cx = (plot.px(g.p1[0]) + plot.px(g.p2[0])) / 2
        const cy = (plot.py(g.p1[1]) + plot.py(g.p2[1])) / 2
        const rx = Math.abs(plot.px(g.p2[0]) - plot.px(g.p1[0])) / 2 + 48
        const ry = Math.abs(plot.py(g.p2[1]) - plot.py(g.p1[1])) / 2 + 38

        // Soft cluster halo (path ellipse)
        const haloPts: string[] = []
        for (let i = 0; i <= 48; i++) {
            const a = (i / 48) * Math.PI * 2
            const ex = cx + Math.cos(a) * rx
            const ey = cy + Math.sin(a) * ry
            haloPts.push(`${i === 0 ? 'M' : 'L'}${ex.toFixed(1)} ${ey.toFixed(1)}`)
        }
        fig.path(`${haloPts.join('')}Z`, {
            fill: col,
            fillOpacity: theme === 'dark' ? 0.12 : 0.08,
            color: col,
            width: 1.25,
            dash: '4 4',
            opacity: 0.55,
        })

        // Euclidean distance link
        fig.line(plot.px(g.p1[0]), plot.py(g.p1[1]), plot.px(g.p2[0]), plot.py(g.p2[1]), {
            color: col,
            width: 3,
        })

        // Points
        plot.point(g.p1[0], g.p1[1], { color: col, r: 7 })
        plot.point(g.p2[0], g.p2[1], { color: col, r: 7 })

        // Point labels
        if (g.topic === 'Finance') {
            fig.text(plot.px(g.p1[0]) - 10, plot.py(g.p1[1]) + 2, g.n1, {
                size: 13,
                weight: 600,
                color: c.textPrimary,
                mono: true,
                align: 'right',
            })
            fig.text(plot.px(g.p2[0]) - 10, plot.py(g.p2[1]) - 2, g.n2, {
                size: 13,
                weight: 600,
                color: c.textPrimary,
                mono: true,
                align: 'right',
            })
        } else if (g.topic === 'Vision') {
            fig.text(plot.px(g.p1[0]) - 12, plot.py(g.p1[1]), g.n1, {
                size: 13,
                weight: 600,
                color: c.textPrimary,
                mono: true,
                align: 'right',
            })
            fig.text(plot.px(g.p2[0]) + 12, plot.py(g.p2[1]), g.n2, {
                size: 13,
                weight: 600,
                color: c.textPrimary,
                mono: true,
                align: 'left',
            })
        } else {
            fig.text(plot.px(g.p1[0]) - 12, plot.py(g.p1[1]), g.n1, {
                size: 13,
                weight: 600,
                color: c.textPrimary,
                mono: true,
                align: 'right',
            })
            fig.text(plot.px(g.p2[0]) + 12, plot.py(g.p2[1]), g.n2, {
                size: 13,
                weight: 600,
                color: c.textPrimary,
                mono: true,
                align: 'left',
            })
        }

        // Distance pill label
        const dx = plot.px(g.dPos[0])
        const dy = plot.py(g.dPos[1])
        fig.rect(dx - 34, dy - 11, 68, 22, {
            fill: tint(col, c.bg, theme === 'dark' ? 0.22 : 0.14),
            stroke: col,
            strokeWidth: 1,
            radius: 11,
        })
        fig.text(dx, dy, g.dist, {
            size: 12,
            weight: 700,
            color: col,
            mono: true,
            align: 'center',
        })

        // Topic + excerpt header above cluster
        const lx = plot.px(g.labelPos[0])
        const ly = plot.py(g.labelPos[1])
        fig.text(lx, ly - 9, g.topic, {
            size: 15,
            weight: 700,
            color: col,
            align: 'center',
        })
        fig.text(lx, ly + 10, g.excerpt, {
            size: 12.5,
            color: c.textSecondary,
            align: 'center',
        })
    }

    return fig.render()
}

export default create()
