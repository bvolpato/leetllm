import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'
export { createFilm } from './_parts/kmeans-film'

export const alt =
    'One Lloyd k-means iteration on the six corpus vectors. Initial seeds at (1.0, 1.0), (4.0, 4.2), and (8.0, 1.0) attract pairs fin_A/fin_B, vis_A/vis_B, and sys_A/sys_B, then update to centroids (1.1, 1.4), (4.5, 4.0), and (8.5, 1.4), dropping inertia from 3.48 to 1.74.'

export const width = 780
export const height = 430

interface ClusterStep {
    label: string
    tone: 'blue' | 'purple' | 'green'
    seed: readonly [number, number]
    center: readonly [number, number]
    members: readonly [readonly [number, number], readonly [number, number]]
    names: readonly [string, string]
}

const CLUSTERS: readonly ClusterStep[] = [
    {
        label: 'C0 Finance',
        tone: 'blue',
        seed: [1.0, 1.0],
        center: [1.1, 1.4],
        members: [
            [1.0, 1.0],
            [1.2, 1.8],
        ],
        names: ['fin_A', 'fin_B'],
    },
    {
        label: 'C1 Vision',
        tone: 'purple',
        seed: [4.0, 4.2],
        center: [4.5, 4.0],
        members: [
            [4.0, 4.2],
            [5.0, 3.8],
        ],
        names: ['vis_A', 'vis_B'],
    },
    {
        label: 'C2 Systems',
        tone: 'green',
        seed: [8.0, 1.0],
        center: [8.5, 1.4],
        members: [
            [8.0, 1.0],
            [9.0, 1.8],
        ],
        names: ['sys_A', 'sys_B'],
    },
]

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const warm = fig.tone('warm')
    const green = fig.tone('green')

    // Left: Spacious 2D centroid-movement geometry
    fig.text(266, 20, "Lloyd's update: seeds shift to cluster midpoints", {
        size: 15,
        weight: 600,
        color: c.textPrimary,
        align: 'center',
    })

    const plot = fig.plot(
        { x: 52, y: 46, width: 440, height: 320 },
        { x: [0, 10], y: [0, 5.2] },
    )
    plot.axes({
        xTicks: [0, 2, 4, 6, 8, 10],
        yTicks: [0, 1, 2, 3, 4, 5],
        xLabel: 'Embedding dim 1',
        yLabel: 'dim 2',
        grid: true,
        labelSize: 12,
    })

    for (const cl of CLUSTERS) {
        const col = fig.tone(cl.tone)

        // Assignment segments from both members to updated mean
        for (const [mx, my] of cl.members) {
            fig.line(plot.px(mx), plot.py(my), plot.px(cl.center[0]), plot.py(cl.center[1]), {
                color: col,
                width: 1.75,
                dash: '3 3',
                opacity: 0.7,
            })
        }

        // Data points
        plot.point(cl.members[0][0], cl.members[0][1], { color: col, r: 5.5 })
        plot.point(cl.members[1][0], cl.members[1][1], { color: col, r: 5.5 })

        // Hollow initial seed ring
        fig.circle(plot.px(cl.seed[0]), plot.py(cl.seed[1]), 9, {
            stroke: warm,
            width: 2,
        })

        // Seed -> updated mean arrow
        fig.arrow(
            plot.px(cl.seed[0]),
            plot.py(cl.seed[1]),
            plot.px(cl.center[0]),
            plot.py(cl.center[1]),
            { color: warm, width: 2.5, head: 7 },
        )

        // Updated mean ringed dot
        plot.point(cl.center[0], cl.center[1], { color: col, r: 7.5 })
        fig.circle(plot.px(cl.center[0]), plot.py(cl.center[1]), 11, {
            stroke: c.textPrimary,
            width: 1.5,
        })

        // Cluster label + coordinates cleanly placed in open space away from dots
        const lx =
            cl.tone === 'blue'
                ? plot.px(cl.center[0]) + 42
                : cl.tone === 'green'
                  ? plot.px(cl.center[0]) - 22
                  : plot.px(cl.center[0])
        const ly =
            cl.tone === 'purple'
                ? plot.py(cl.center[1]) - 46
                : plot.py(cl.center[1]) - 56
        fig.text(lx, ly, cl.label, {
            size: 13,
            weight: 700,
            color: col,
            align: 'center',
        })
        fig.text(lx, ly + 16, `[${cl.center[0].toFixed(1)}, ${cl.center[1].toFixed(1)}]`, {
            size: 11.5,
            color: c.textSecondary,
            mono: true,
            align: 'center',
        })
    }

    // Compact bottom-left legend inside plot footer
    fig.circle(68, 412, 5.5, { stroke: warm, width: 1.8 })
    fig.text(80, 412, 'Initial seed', { size: 12, color: warm })
    fig.arrow(174, 412, 206, 412, { color: warm, width: 2.2, head: 6 })
    fig.text(214, 412, 'Shift to mean', { size: 12, color: c.textSecondary })
    fig.circle(328, 412, 5.5, { fill: c.textPrimary })
    fig.circle(328, 412, 8.5, { stroke: c.textPrimary, width: 1.2 })
    fig.text(342, 412, 'Updated centroid', { size: 12, color: c.textSecondary })

    // Right column: Within-cluster inertia J bar comparison
    const rx = 532
    const rw = 224
    fig.text(rx + rw / 2, 20, 'Within-cluster inertia J', {
        size: 15,
        weight: 600,
        color: c.textPrimary,
        align: 'center',
    })
    fig.text(rx + rw / 2, 40, 'Sum of squared distances', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
    })

    const barPlot = fig.plot(
        { x: rx + 26, y: 78, width: rw - 38, height: 220 },
        { x: [0, 2], y: [0, 4] },
    )
    barPlot.axes({
        yTicks: [0, 1, 2, 3, 4],
        grid: true,
        labelSize: 11.5,
    })

    const b1x = barPlot.px(0.48)
    const b2x = barPlot.px(1.52)
    const bw = 56
    fig.rect(b1x - bw / 2, barPlot.py(3.48), bw, barPlot.bottom - barPlot.py(3.48), {
        fill: warm,
        radius: 6,
    })
    fig.rect(b2x - bw / 2, barPlot.py(1.74), bw, barPlot.bottom - barPlot.py(1.74), {
        fill: green,
        radius: 6,
    })

    fig.text(b1x, barPlot.py(3.48) - 12, '3.48', {
        size: 14,
        weight: 700,
        color: warm,
        mono: true,
        align: 'center',
    })
    fig.text(b2x, barPlot.py(1.74) - 12, '1.74', {
        size: 14,
        weight: 700,
        color: green,
        mono: true,
        align: 'center',
    })
    fig.text(b1x, barPlot.bottom + 16, 'Seeds', {
        size: 12.5,
        weight: 600,
        color: c.textSecondary,
        align: 'center',
    })
    fig.text(b2x, barPlot.bottom + 16, 'Means', {
        size: 12.5,
        weight: 600,
        color: c.textSecondary,
        align: 'center',
    })

    // Curved -50% drop arrow between bars (lands clearly above 1.74 label)
    fig.callout(
        [b2x, barPlot.py(2.12)],
        [b1x + 36, barPlot.py(3.35)],
        '−50% inertia',
        {
            color: green,
            size: 12.5,
            weight: 700,
            bend: -0.22,
            align: 'left',
            labelGap: 4,
        },
    )

    // Compact summary callout below bars
    fig.rect(rx + 6, 344, rw - 12, 54, {
        fill: tint(green, c.bg, 0.09),
        stroke: c.borderSubtle,
        strokeWidth: 1,
        radius: 8,
    })
    fig.text(rx + rw / 2, 362, '1st Lloyd step halves J', {
        size: 13,
        weight: 700,
        color: green,
        align: 'center',
    })
    fig.text(rx + rw / 2, 382, 'Each mean minimizes ∑‖x − μ‖²', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
    })

    return fig.render()
}

export default create()
