import {
    axes,
    column,
    dot,
    dynamic,
    fadeIn,
    fadeOut,
    film,
    line,
    place,
    rect,
    sceneKit,
    seq,
    text,
    type Node,
} from 'vizmatic/stage'
import type { ThemeMode } from 'vizmatic'

interface ClusterDef {
    name: string
    color: 'blue' | 'purple' | 'green'
    seed: readonly [number, number]
    mean: readonly [number, number]
    pts: readonly [readonly [number, number], readonly [number, number]]
}

const CLUSTERS: readonly ClusterDef[] = [
    {
        name: 'C0 Finance',
        color: 'blue',
        seed: [1.0, 1.0],
        mean: [1.1, 1.4],
        pts: [
            [1.0, 1.0],
            [1.2, 1.8],
        ],
    },
    {
        name: 'C1 Vision',
        color: 'purple',
        seed: [4.0, 4.2],
        mean: [4.5, 4.0],
        pts: [
            [4.0, 4.2],
            [5.0, 3.8],
        ],
    },
    {
        name: 'C2 Systems',
        color: 'green',
        seed: [8.0, 1.0],
        mean: [8.5, 1.4],
        pts: [
            [8.0, 1.0],
            [9.0, 1.8],
        ],
    },
]

export function createFilm(theme: ThemeMode = 'dark') {
    return film(
        {
            title: "Lloyd's k-means update halves inertia",
            description:
                'Watch one assignment and mean-recentering iteration move centroids to cluster midpoints while squared inertia drops from 3.48 to 1.74.',
            look: theme === 'light' ? 'paper' : 'midnight',
            font: 'text-serif',
            fps: 30,
            aspect: '16:9',
        },
        (s) => {
            const kit = sceneKit({
                size: 54,
                heading: { size: 60, align: 'center' },
                area: { top: -350, bottom: 360 },
            })
            const [plotArea, metricArea] = kit.area.columns([1.85, 1], 56)

            const title = kit.heading("Lloyd's iteration: assign, then recenter")
            const graph = place(
                axes({
                    x: [0, 10],
                    y: [0, 5.2],
                    width: 1020,
                    height: 540,
                    xStep: 2,
                    yStep: 1,
                    labels: false,
                    grid: false,
                    tips: false,
                }),
                plotArea,
                'bottom',
            )

            const tMove = s.value(0)
            const showLinks = s.value(0)

            // Dynamic cluster links + moving centroids + live inertia meter
            const sceneMarks = dynamic(() => {
                const t = tMove.value
                const linkOp = showLinks.value
                const nodes: Node[] = []

                for (const cl of CLUSTERS) {
                    const cx = cl.seed[0] + t * (cl.mean[0] - cl.seed[0])
                    const cy = cl.seed[1] + t * (cl.mean[1] - cl.seed[1])
                    const cWorld = graph.world(cx, cy)

                    // Assignment links from data points to current centroid
                    if (linkOp > 0.01) {
                        for (const [px, py] of cl.pts) {
                            nodes.push(
                                line(graph.world(px, py), cWorld, {
                                    stroke: cl.color,
                                    width: 4,
                                    dash: [10, 8],
                                }).opacity(linkOp * 0.75),
                            )
                        }
                    }

                    // Trail from initial seed to moving centroid
                    if (t > 0.02) {
                        nodes.push(
                            line(graph.world(cl.seed[0], cl.seed[1]), cWorld, {
                                stroke: 'orange',
                                width: 5,
                            }),
                        )
                    }

                    // Data points
                    for (const [px, py] of cl.pts) {
                        nodes.push(dot(15, cl.color).at(graph.world(px, py)))
                    }

                    // Moving centroid ring
                    nodes.push(
                        dot(22, cl.color)
                            .at(cWorld)
                            .glow(10),
                    )
                    nodes.push(dot(10, 'white').at(cWorld))
                }

                // Live inertia bar in right panel
                let inertia = 0
                for (const cl of CLUSTERS) {
                    const cx = cl.seed[0] + t * (cl.mean[0] - cl.seed[0])
                    const cy = cl.seed[1] + t * (cl.mean[1] - cl.seed[1])
                    for (const [px, py] of cl.pts) {
                        inertia += (px - cx) ** 2 + (py - cy) ** 2
                    }
                }
                const barMaxH = 340
                const barH = Math.max(12, (inertia / 4.0) * barMaxH)
                const barX = metricArea.point('center')[0]
                const barBottom = 200
                const barColor = t > 0.5 ? 'green' : 'orange'
                nodes.push(
                    rect(130, barH, {
                        fill: barColor,
                        radius: 12,
                    })
                        .opacity(0.85)
                        .at([barX, barBottom - barH / 2]),
                )
                nodes.push(
                    text(`J = ${inertia.toFixed(2)}`, { size: 46, color: barColor }).at([
                        barX,
                        barBottom - barH - 42,
                    ]),
                )

                return nodes
            })

            const meterHeading = text('Within-cluster\ninertia J', {
                size: 40,
                color: 'dim',
            })
            const phaseAssign = text('1. Assign to nearest seed', { size: 38, color: 'blue' })
            const phaseUpdate = text('2. Move each seed to mean', { size: 38, color: 'green' })
            const sideText = column([meterHeading], { gap: 20 })
            place(sideText, metricArea, 'top')

            phaseAssign.moveTo([plotArea.point('center')[0], -275])
            phaseUpdate.moveTo([plotArea.point('center')[0], -275])

            s.chapter('Initial seeds')
            s.add(title, graph, sceneMarks, sideText)
            s.caption(
                'Three seeds start at fin_A, vis_A, and sys_A with total squared distance J = 3.48.',
                3.6,
            )
            s.wait(2.2)

            s.chapter('Assign step')
            s.play(showLinks.to(1), fadeIn(phaseAssign), { duration: 1.4 })
            s.caption(
                'Every embedding links to its closest centroid, forming three pairs: Finance, Vision, and Systems.',
                3.8,
            )
            s.wait(1.8)

            s.chapter('Mean update')
            s.play(seq(fadeOut(phaseAssign), fadeIn(phaseUpdate)), tMove.to(1), { duration: 3.4 })
            s.caption(
                'Moving each centroid to its group mean shifts all three seeds to pair midpoints and halves inertia to 1.74.',
                4.8,
            )
            s.wait(3.2)
        },
    )
}

export default createFilm()
