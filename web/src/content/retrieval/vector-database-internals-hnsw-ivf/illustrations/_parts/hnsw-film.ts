import {
    arrow,
    assertEqual,
    boxOf,
    circle,
    column,
    decimal,
    delay,
    dot,
    draw,
    dynamic,
    ellipse,
    fade,
    fadeIn,
    fadeOut,
    film,
    line,
    place,
    polygon,
    rect,
    ripple,
    sceneArea,
    sceneKit,
    seq,
    tex,
    text,
    to,
    type Node,
    type Vec,
} from 'vizmatic/stage'
import type { ThemeMode } from 'vizmatic'

interface GraphNode {
    id: number
    u: number
    v: number
    maxLayer: 0 | 1 | 2
    tag?: string
}

const QUERY: readonly [number, number] = [8.3, 5.6]

// 16 database vectors in a 2D metric space [0, 10] x [0, 10].
// Layer 2 has 3 express nodes, Layer 1 has 7 nodes, Layer 0 has all 16 nodes.
const NODES: readonly GraphNode[] = [
    { id: 0, u: 1.0, v: 5.4, maxLayer: 2, tag: 'e' },
    { id: 1, u: 3.1, v: 1.9, maxLayer: 2 },
    { id: 2, u: 5.1, v: 3.6, maxLayer: 2, tag: 'v2' },
    { id: 3, u: 2.1, v: 8.2, maxLayer: 1 },
    { id: 4, u: 4.4, v: 7.8, maxLayer: 1 },
    { id: 5, u: 6.3, v: 5.5, maxLayer: 1, tag: 'v5' },
    { id: 6, u: 7.4, v: 6.6, maxLayer: 1, tag: 'v6' },
    { id: 7, u: 0.9, v: 2.3, maxLayer: 0 },
    { id: 8, u: 2.4, v: 4.4, maxLayer: 0 },
    { id: 9, u: 3.8, v: 5.4, maxLayer: 0 },
    { id: 10, u: 5.4, v: 1.5, maxLayer: 0 },
    { id: 11, u: 6.0, v: 8.6, maxLayer: 0 },
    { id: 12, u: 7.6, v: 2.2, maxLayer: 0 },
    { id: 13, u: 9.3, v: 2.9, maxLayer: 0 },
    { id: 14, u: 8.9, v: 8.2, maxLayer: 0 },
    { id: 15, u: 8.75, v: 5.15, maxLayer: 0, tag: 'x*' },
]

const LAYER_EDGES: Record<0 | 1 | 2, readonly (readonly [number, number])[]> = {
    2: [
        [0, 2],
        [1, 2],
    ],
    1: [
        [0, 1],
        [0, 3],
        [1, 2],
        [2, 4],
        [2, 5],
        [3, 4],
        [4, 5],
        [5, 6],
        [1, 5],
    ],
    0: [
        [0, 7],
        [0, 8],
        [0, 3],
        [7, 1],
        [7, 8],
        [1, 8],
        [1, 10],
        [1, 2],
        [8, 9],
        [8, 3],
        [3, 4],
        [9, 4],
        [9, 2],
        [9, 5],
        [10, 2],
        [10, 12],
        [2, 5],
        [2, 12],
        [4, 11],
        [4, 5],
        [11, 6],
        [11, 14],
        [5, 6],
        [5, 12],
        [5, 15],
        [12, 13],
        [12, 15],
        [13, 15],
        [6, 15],
        [6, 14],
        [15, 14],
    ],
}

function distToQuery(u: number, v: number): number {
    return Math.hypot(u - QUERY[0], v - QUERY[1])
}

export function createFilm(theme: ThemeMode = 'dark') {
    // Verify graph layer counts and exact nearest neighbor before animating.
    const l2Count = NODES.filter((n) => n.maxLayer >= 2).length
    const l1Count = NODES.filter((n) => n.maxLayer >= 1).length
    assertEqual(l2Count, 3, 'Layer 2 express node count')
    assertEqual(l1Count, 7, 'Layer 1 mid-scale node count')
    assertEqual(NODES.length, 16, 'Layer 0 base graph node count')

    const dEntry = distToQuery(NODES[0]!.u, NODES[0]!.v)
    const dV2 = distToQuery(NODES[2]!.u, NODES[2]!.v)
    const dV5 = distToQuery(NODES[5]!.u, NODES[5]!.v)
    const dV6 = distToQuery(NODES[6]!.u, NODES[6]!.v)
    const dBest = distToQuery(NODES[15]!.u, NODES[15]!.v)
    const minAll = Math.min(...NODES.map((n) => distToQuery(n.u, n.v)))
    assertEqual(Number(dBest.toFixed(4)), Number(minAll.toFixed(4)), 'x* is the true nearest node')

    return film(
        {
            title: 'HNSW multi-layer greedy search',
            description:
                'Search enters on a sparse express layer, drops down with the same vector ID, and locks onto the nearest neighbor in 5 distance evaluations.',
            look: theme === 'light' ? 'paper' : 'midnight',
            font: 'text-serif',
            fps: 30,
            aspect: '16:9',
        },
        (s) => {
            const kit = sceneKit({
                size: 48,
                heading: { size: 56, align: 'center' },
                area: { top: -375, bottom: 430 },
            })
            const [stackArea, panelArea] = kit.area.columns([1.92, 1], 52)
            const heading = kit.heading('HNSW: Coarse-to-Fine Graph Descent')

            // Isometric projection for 3 stacked horizontal planes inside stackArea.
            const planeOriginX = stackArea!.left + 178
            const widthU = 720
            const skewX = 165
            const depthY = 172
            const layerCenterY: Record<0 | 1 | 2, number> = {
                2: -260,
                1: 22,
                0: 304,
            }
            const layerColor: Record<0 | 1 | 2, 'purple' | 'blue' | 'teal'> = {
                2: 'purple',
                1: 'blue',
                0: 'teal',
            }

            const project = (layer: 0 | 1 | 2, u: number, v: number): Vec => {
                const un = u / 10
                const vn = v / 10
                const x = planeOriginX + un * widthU + (1 - vn) * skewX
                const y = layerCenterY[layer] + (vn - 0.5) * depthY
                return [x, y]
            }

            const planeCorners = (layer: 0 | 1 | 2): Vec[] => [
                project(layer, 0, 0),
                project(layer, 10, 0),
                project(layer, 10, 10),
                project(layer, 0, 10),
            ]

            // Build the 3 stacked planes, faint internal grid, edges, and base nodes.
            const layerGroups: Record<0 | 1 | 2, Node[]> = { 0: [], 1: [], 2: [] }
            const nodeDots: Record<0 | 1 | 2, Map<number, Node>> = {
                0: new Map(),
                1: new Map(),
                2: new Map(),
            }

            const layerSpecs: readonly { layer: 0 | 1 | 2; name: string; count: string }[] = [
                { layer: 2, name: 'Layer 2', count: '3 nodes' },
                { layer: 1, name: 'Layer 1', count: '7 nodes' },
                { layer: 0, name: 'Layer 0', count: '16 nodes' },
            ]

            for (const spec of layerSpecs) {
                const { layer, name, count } = spec
                const accent = layerColor[layer]
                const deck = polygon(planeCorners(layer), {
                    fill: 'surface',
                    stroke: accent,
                    width: 2.5,
                    opacity: 0.9,
                }).set('fillOpacity', theme === 'light' ? 0.72 : 0.62)
                layerGroups[layer].push(deck)

                // Subtle internal perspective grid (2x2 interior lines).
                for (const g of [3.33, 6.67]) {
                    layerGroups[layer].push(
                        line(project(layer, g, 0), project(layer, g, 10), {
                            stroke: 'grid',
                            width: 1.2,
                            opacity: 0.32,
                        }),
                        line(project(layer, 0, g), project(layer, 10, g), {
                            stroke: 'grid',
                            width: 1.2,
                            opacity: 0.32,
                        }),
                    )
                }

                // Layer name + node count cleanly on the left margin.
                const tagCol = place(
                    column(
                        [
                            text(name, { size: 32, color: accent }),
                            text(count, { size: 26, color: 'dim' }),
                        ],
                        { gap: 8, align: 'center' },
                    ),
                    sceneArea({
                        left: stackArea!.left,
                        right: stackArea!.left + 156,
                        top: layerCenterY[layer] - 64,
                        bottom: layerCenterY[layer] + 64,
                    }),
                    'center',
                )
                layerGroups[layer].push(...tagCol.nodes)

                // Graph edges for this layer.
                const edgeOpacity = layer === 2 ? 0.55 : layer === 1 ? 0.44 : 0.32
                const edgeWidth = layer === 2 ? 2.8 : layer === 1 ? 2.2 : 1.7
                for (const [a, b] of LAYER_EDGES[layer]) {
                    const na = NODES[a]!
                    const nb = NODES[b]!
                    layerGroups[layer].push(
                        line(project(layer, na.u, na.v), project(layer, nb.u, nb.v), {
                            stroke: 'dim',
                            width: edgeWidth,
                            opacity: edgeOpacity,
                        }),
                    )
                }

                // Graph vertices on this layer.
                for (const node of NODES) {
                    if (node.maxLayer < layer) continue
                    const p = project(layer, node.u, node.v)
                    const radius = layer === 2 ? 11 : layer === 1 ? 9.5 : 8.5
                    const mark = dot(radius, 'dim', { stroke: 'surface', width: 2 }).at(p)
                    nodeDots[layer].set(node.id, mark)
                    layerGroups[layer].push(mark)
                }
            }

            // Query projections on all 3 planes + faint vertical alignment guide.
            const q2 = project(2, QUERY[0], QUERY[1])
            const q1 = project(1, QUERY[0], QUERY[1])
            const q0 = project(0, QUERY[0], QUERY[1])
            const qPlumb = line(q2, q0, {
                stroke: 'gold',
                width: 2.2,
                dash: [8, 8],
                opacity: 0.45,
            })
            const qRings = ([q2, q1, q0] as const).map((pt) =>
                circle(16, { stroke: 'gold', width: 3.2, fill: null }).at(pt),
            )
            const qCores = ([q2, q1, q0] as const).map((pt) => dot(7, 'gold').at(pt).glow(10))
            const qLabel = text('q', { size: 36, color: 'gold' }).moveTo([q2[0] + 34, q2[1] - 26])

            // Right-hand telemetry panel card.
            const panelCard = rect(panelArea!.width, panelArea!.height, {
                fill: 'surface',
                stroke: 'gridStrong',
                width: 2,
                radius: 18,
            })
                .at(panelArea!.cx, panelArea!.cy)
                .set('fillOpacity', theme === 'light' ? 0.65 : 0.45)

            const innerPanel = panelArea!.inset(32)
            const [phaseBox, distBox, evalBox, scaleBox] = innerPanel.rows(
                [0.95, 1.15, 1.35, 1.25],
                18,
            )

            // Phase headers (swapped cleanly without overlap).
            const makePhase = (titleText: string, subText: string, color: 'purple' | 'blue' | 'teal' | 'green') =>
                place(
                    column(
                        [
                            text(titleText, { size: 34, color }),
                            text(subText, { size: 26, color: 'dim' }),
                        ],
                        { gap: 10, align: 'center' },
                    ),
                    phaseBox!,
                    'center',
                )

            const phaseIntro = makePhase('3 Stacked Layers', 'Same vector ID across layers', 'purple')
            const phaseL2 = makePhase('Layer 2: Express Hops', 'Long-range landmark leap', 'purple')
            const phaseL1 = makePhase('Layer 1: Mid-Scale', '2 greedy neighborhood hops', 'blue')
            const phaseL0 = makePhase('Layer 0: Local Beam', 'efSearch locks onto x*', 'teal')

            // Live distance readout.
            const distVal = s.value(dEntry)
            const distTitle = text('dist(curr, q)', { size: 28, color: 'dim' })
            const distReadout = decimal(() => distVal.value, {
                digits: 2,
                size: 62,
                color: 'gold',
            })
            const distCol = place(
                column([distTitle, distReadout], { gap: 12, align: 'center' }),
                distBox!,
                'center',
            )

            // Live distance evaluations counter + comparison bar.
            const evalVal = s.value(0)
            const evalTitle = text('Distance evals', { size: 28, color: 'dim' })
            const evalReadout = decimal(() => Math.round(evalVal.value), {
                digits: 0,
                suffix: ' vs 16',
                size: 48,
                color: 'teal',
            })
            const evalCol = place(
                column([evalTitle, evalReadout], { gap: 12, align: 'center' }),
                evalBox!,
                'top',
            )
            const barWidth = innerPanel.width - 28
            const barY = boxOf(evalCol).bottom + 34
            const barTrack = rect(barWidth, 20, {
                fill: 'gridStrong',
                stroke: 'gridStrong',
                width: 1.5,
                radius: 10,
                opacity: 0.45,
            }).at(innerPanel.cx, barY)
            const barFill = dynamic(() => {
                const frac = Math.max(0, Math.min(1, evalVal.value / 16))
                if (frac < 0.01) return []
                const w = Math.max(20, barWidth * frac)
                return [
                    rect(w, 20, { fill: 'teal', stroke: null, radius: 10 }).at(
                        innerPanel.cx - barWidth / 2 + w / 2,
                        barY,
                    ),
                ]
            })
            const barNote = text('Evaluated fraction of 16 nodes', { size: 24, color: 'dim' }).moveTo([
                innerPanel.cx,
                barY + 34,
            ])

            // Bottom complexity callout (revealed when search locks onto x*).
            const scaleFormula = tex('O(\\log N)\\;\\text{vs}\\;O(N)', {
                size: 42,
                color: 'green',
            })
            const scaleCaption = text('5 evals instead of 16', { size: 28, color: 'ink' })
            const scaleBlock = place(
                column([scaleFormula, scaleCaption], { gap: 16, align: 'center' }),
                scaleBox!,
                'center',
            )

            // Active cursor ring that tracks hops and drops.
            const p0L2 = project(2, NODES[0]!.u, NODES[0]!.v)
            const p2L2 = project(2, NODES[2]!.u, NODES[2]!.v)
            const p2L1 = project(1, NODES[2]!.u, NODES[2]!.v)
            const p5L1 = project(1, NODES[5]!.u, NODES[5]!.v)
            const p6L1 = project(1, NODES[6]!.u, NODES[6]!.v)
            const p6L0 = project(0, NODES[6]!.u, NODES[6]!.v)
            const p15L0 = project(0, NODES[15]!.u, NODES[15]!.v)

            const cursor = circle(18, { stroke: 'yellow', width: 4, fill: null })
                .at(p0L2)
                .glow(8)

            // Node tags placed in open space clear of strokes, ripples, and plane borders.
            const eTag = text('e', { size: 32, color: 'purple' }).moveTo([p0L2[0] + 6, p0L2[1] + 52])
            const v2Tag = text('v2', { size: 30, color: 'purple' }).moveTo([
                p2L2[0] + 56,
                p2L2[1] - 4,
            ])
            const v6Tag = text('v6', { size: 30, color: 'blue' }).moveTo([
                p6L1[0] - 58,
                p6L1[1] + 30,
            ])
            const xStarTagPos: Vec = [stackArea!.right - 44, p15L0[1]]
            const xStarLeader = line([p15L0[0] + 24, p15L0[1]], [xStarTagPos[0] - 32, p15L0[1]], {
                stroke: 'green',
                width: 2.5,
                dash: [6, 5],
            })
            const xStarTag = text('x*', { size: 36, color: 'green' }).moveTo(xStarTagPos)

            // ─── Scene Intro & Chapter 1: Top Layer Express Hops ──────────────────
            s.chapter('Top Layer Express Hops')
            s.add(
                heading,
                ...layerGroups[0],
                ...layerGroups[1],
                ...layerGroups[2],
                panelCard,
                phaseIntro,
                evalCol,
                barTrack,
                barFill,
                barNote,
            )
            s.play(
                draw(qPlumb),
                ...qRings.map((r) => fadeIn(r)),
                ...qCores.map((c) => fadeIn(c)),
                fadeIn(qLabel),
                { duration: 1.0 },
            )
            s.caption(
                'HNSW stacks sparse express layers over a dense base graph so search zooms in toward query q.',
                3.6,
            )
            s.wait(1.8)

            // Enter at Layer 2 node e (eval 1).
            const dot0L2 = dot(12, 'purple').at(p0L2).glow(8)
            s.play(
                seq(fadeOut(phaseIntro), fadeIn(phaseL2)),
                fadeIn(distCol),
                fadeIn(dot0L2),
                fadeIn(cursor),
                fadeIn(eTag),
                evalVal.to(1),
                { duration: 0.9 },
            )
            s.play(ripple(p0L2, { color: 'purple', radius: 44 }), { duration: 0.7 })

            // Leap across Layer 2 from e to v2 in 1 long-range hop (eval 2).
            const hopL2 = arrow(p0L2, p2L2, { stroke: 'purple', width: 5.5, tip: 16, pad: 14 })
            const dot2L2 = dot(12, 'purple').at(p2L2).glow(8)
            s.caption(
                'On Layer 2, search enters at node e and leaps across the space in one express hop, cutting distance nearly in half.',
                4.2,
            )
            s.play(
                draw(hopL2),
                to(cursor, (n) => n.at(p2L2)),
                fadeIn(dot2L2),
                fadeIn(v2Tag),
                distVal.to(dV2),
                evalVal.to(2),
                { duration: 1.5 },
            )
            s.play(ripple(p2L2, { color: 'purple', radius: 42 }), { duration: 0.6 })
            s.wait(1.2)

            // ─── Chapter 2: Drop to Layer 1 ───────────────────────────────────────
            s.chapter('Drop to Layer 1')
            const drop21 = arrow(p2L2, p2L1, {
                stroke: 'blue',
                width: 4.5,
                tip: 15,
                dash: [10, 8],
                pad: 14,
            })
            const dot2L1 = dot(11, 'blue').at(p2L1).glow(8)
            s.caption(
                'A vertical drop moves to the same vector ID on Layer 1, where two medium-range hops refine the neighborhood.',
                4.4,
            )
            s.play(
                seq(fadeOut(phaseL2), fadeIn(phaseL1)),
                draw(drop21),
                to(cursor, (n) => n.at(p2L1)),
                fadeIn(dot2L1),
                { duration: 1.2 },
            )

            // Layer 1 hop 1: v2 -> v5 (eval 3).
            const hopL1a = arrow(p2L1, p5L1, { stroke: 'blue', width: 5, tip: 15, pad: 13 })
            const dot5L1 = dot(11, 'blue').at(p5L1).glow(8)
            s.play(
                draw(hopL1a),
                to(cursor, (n) => n.at(p5L1)),
                fadeIn(dot5L1),
                distVal.to(dV5),
                evalVal.to(3),
                { duration: 1.2 },
            )

            // Layer 1 hop 2: v5 -> v6 (eval 4).
            const hopL1b = arrow(p5L1, p6L1, { stroke: 'blue', width: 5, tip: 15, pad: 13 })
            const dot6L1 = dot(11, 'blue').at(p6L1).glow(8)
            s.play(
                draw(hopL1b),
                to(cursor, (n) => n.at(p6L1)),
                fadeIn(dot6L1),
                fadeIn(v6Tag),
                distVal.to(dV6),
                evalVal.to(4),
                { duration: 1.2 },
            )
            s.wait(1.0)

            // ─── Chapter 3: Drop to Layer 0 Fine Search ───────────────────────────
            s.chapter('Drop to Layer 0 Fine Search')
            const drop10 = arrow(p6L1, p6L0, {
                stroke: 'teal',
                width: 4.5,
                tip: 15,
                dash: [10, 8],
                pad: 14,
            })
            const dot6L0 = dot(11, 'teal').at(p6L0).glow(8)
            s.play(
                seq(fadeOut(phaseL1), fadeIn(phaseL0)),
                draw(drop10),
                to(cursor, (n) => n.at(p6L0)),
                fadeIn(dot6L0),
                { duration: 1.1 },
            )

            // Local efSearch beam region around v6, q, and x*.
            const beamCenter: Vec = [(p6L0[0] + p15L0[0]) / 2 + 12, (p6L0[1] + p15L0[1]) / 2]
            const beamArea = ellipse(118, 48, {
                fill: 'teal',
                stroke: 'teal',
                width: 2.5,
                dash: [8, 6],
            })
                .at(beamCenter)
                .set('fillOpacity', 0.14)

            const hopL0 = arrow(p6L0, p15L0, { stroke: 'green', width: 5.5, tip: 16, pad: 13 })
            const dotBest = dot(13, 'green').at(p15L0).glow(12)
            const bestHalo = circle(22, { stroke: 'green', width: 3.5, fill: null }).at(p15L0)

            s.caption(
                'On Layer 0, the local efSearch beam inspects tight neighbors and locks onto x* in just 5 distance evaluations instead of 16.',
                5.0,
            )
            s.play(fadeIn(beamArea), { duration: 0.7 })
            s.play(
                draw(hopL0),
                to(cursor, (n) => n.at(p15L0)),
                fadeIn(dotBest),
                fadeIn(bestHalo),
                draw(xStarLeader),
                fadeIn(xStarTag),
                distVal.to(dBest),
                evalVal.to(5),
                { duration: 1.4 },
            )
            s.play(
                ripple(p15L0, { color: 'green', radius: 54 }),
                fade(cursor, 0.0),
                fadeIn(scaleBlock),
                delay(
                    fadeIn(
                        text('efSearch beam', { size: 26, color: 'teal' }).moveTo([
                            beamCenter[0],
                            416,
                        ]),
                    ),
                    0.15,
                ),
                { duration: 1.0 },
            )
            s.wait(3.8)
        },
    )
}
