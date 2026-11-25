import {
    arc,
    arrow,
    assertEqual,
    axes,
    boxOf,
    circle,
    column,
    decimal,
    dot,
    dynamic,
    fadeIn,
    fadeOut,
    film,
    indicate,
    line,
    place,
    rect,
    row,
    sceneArea,
    seq,
    smoother,
    tex,
    text,
    type Node,
    type Vec,
} from 'vizmatic/stage'
import type { ThemeMode } from 'vizmatic'

const THETA = 0.4
const M0 = 2
const N0 = 5
const SHIFT = 4
const DELTA_TOKENS = N0 - M0

const FAST_FREQ = 1.0
const SLOW_FREQ = 0.08
const MAX_OFFSET = 8

function rotate2D(v: Vec, angle: number): Vec {
    const c = Math.cos(angle)
    const s = Math.sin(angle)
    return [v[0] * c - v[1] * s, v[0] * s + v[1] * c]
}

function dot2D(a: Vec, b: Vec): number {
    return a[0] * b[0] + a[1] * b[1]
}

export function createFilm(theme: ThemeMode = 'dark') {
    const q0: Vec = [1, 0]
    const k0: Vec = [1, 0]
    const expectedDot = Math.cos(DELTA_TOKENS * THETA)

    // Verify rotational invariance of the dot product across all shifts
    for (const shift of [0, 1, 2, 3, SHIFT]) {
        const qRot = rotate2D(q0, (M0 + shift) * THETA)
        const kRot = rotate2D(k0, (N0 + shift) * THETA)
        assertEqual(
            Number(dot2D(qRot, kRot).toFixed(6)),
            Number(expectedDot.toFixed(6)),
            `RoPE shift invariance at +${shift}`,
        )
    }
    assertEqual(Number(Math.cos(1 * FAST_FREQ).toFixed(3)), 0.54, 'fast pair at delta=1')
    assertEqual(Number(Math.cos(2 * FAST_FREQ).toFixed(3)), -0.416, 'fast pair at delta=2')
    assertEqual(Number(Math.cos(MAX_OFFSET * SLOW_FREQ).toFixed(3)), 0.802, 'slow pair at delta=8')

    return film(
        {
            title: 'Why RoPE turns position into relative angle',
            description:
                'Rotate query q and key k by position multiples m*theta and n*theta, watch their dot product stay locked constant under a shared +4 shift, and compare fast vs slow frequency pairs.',
            look: theme === 'light' ? 'paper' : 'midnight',
            font: 'text-serif',
            fps: 30,
            aspect: '16:9',
        },
        (s) => {
            const headingRegion = sceneArea({ left: -880, right: 880, top: -485, bottom: -395 })
            const subtitleRegion = sceneArea({ left: -880, right: 880, top: -392, bottom: -332 })
            const mainArea = sceneArea({ left: -880, right: 880, top: -320, bottom: 390 })
            const [leftArea, rightArea] = mainArea.columns([1.08, 1], 72)

            const makeHeading = (label: string) =>
                place(text(label, { size: 54, color: 'ink' }), headingRegion, 'center')
            const makeSub = (label: string, color = 'dim') =>
                place(text(label, { size: 30, color }), subtitleRegion, 'center')

            // ================================================================
            // CHAPTER 1 & 2: Single 2D Pair Unit Circle + Live Readouts
            // ================================================================
            const graph = place(
                axes({
                    x: [-1.32, 1.32],
                    y: [-1.32, 1.32],
                    width: 660,
                    height: 660,
                    xStep: 1,
                    yStep: 1,
                    labels: false,
                    grid: false,
                    tips: false,
                }),
                leftArea!,
                'center',
            )
            const origin = graph.world(0, 0)
            const unitPx = Math.abs(graph.world(1, 0)[0] - origin[0])
            const unitRing = circle(unitPx, { stroke: 'dim', width: 2.6 }).at(...origin)
            const xAxisTag = text('x (even)', { size: 26, color: 'dim' }).moveTo([
                origin[0] + unitPx + 64,
                origin[1] + 28,
            ])
            const yAxisTag = text('y (odd)', { size: 26, color: 'dim' }).moveTo([
                origin[0] + 64,
                origin[1] - unitPx - 36,
            ])

            // Timeline values for Chapters 1 & 2
            const showMain = s.value(1)
            const mPos = s.value(0)
            const nPos = s.value(0)
            const showDeltaArc = s.value(0)
            const showShiftArc = s.value(0)

            const qAngle = () => mPos.value * THETA
            const kAngle = () => nPos.value * THETA
            const qVec = (): Vec => rotate2D(q0, qAngle())
            const kVec = (): Vec => rotate2D(k0, kAngle())
            const currentDot = () => dot2D(qVec(), kVec())

            const formatCoord = (v: Vec) =>
                `[${(Math.abs(v[0]) < 0.0005 ? 0 : v[0]).toFixed(2).padStart(5, ' ')}, ${(Math.abs(v[1]) < 0.0005 ? 0 : v[1]).toFixed(2).padStart(5, ' ')}]`

            // Dynamic rotating vectors, arcs, and vector tip labels
            const vectorsLayer = dynamic(() => {
                if (showMain.value < 0.01) return []
                const aq = qAngle()
                const ak = kAngle()
                const q = qVec()
                const k = kVec()
                const qTip = graph.world(q[0], q[1])
                const kTip = graph.world(k[0], k[1])

                const nodes: Node[] = []

                // Angle arc for q (inner blue) during Chapter 1
                if (aq > 0.03 && showShiftArc.value < 0.5) {
                    nodes.push(
                        arc(unitPx * 0.28, 0, -aq, { stroke: 'blue', width: 4.5 }).at(...origin),
                    )
                }
                // Angle arc for k (outer orange) during Chapter 1
                if (ak > 0.03 && showShiftArc.value < 0.5) {
                    nodes.push(
                        arc(unitPx * 0.42, 0, -ak, { stroke: 'orange', width: 4.5 }).at(...origin),
                    )
                }

                // Highlighted relative gap arc Delta = (n - m) * theta between q and k
                if (showDeltaArc.value > 0.05 && ak - aq > 0.05) {
                    const gapR = unitPx * 0.58
                    nodes.push(
                        arc(gapR, -aq, -ak, { stroke: 'teal', width: 7 })
                            .at(...origin)
                            .opacity(showDeltaArc.value)
                            .glow(8),
                    )
                    const mid = (aq + ak) / 2
                    const labelPos = graph.world(
                        Math.cos(mid) * 0.74,
                        Math.sin(mid) * 0.74,
                    )
                    const deltaLabel = text('3θ', { size: 30, color: 'teal' }).moveTo(labelPos)
                    const b = deltaLabel.bounds()
                    nodes.push(
                        rect(b.width + 12, b.height + 8, {
                            fill: 'bg',
                            stroke: null,
                            radius: 6,
                        })
                            .at(b.x + b.width / 2, b.y + b.height / 2)
                            .opacity(showDeltaArc.value * 0.85),
                        deltaLabel.opacity(showDeltaArc.value),
                    )
                }

                // Ghost reference lines at initial (m=2, n=5) positions during Chapter 2 shift
                if (showShiftArc.value > 0.05) {
                    const qRef = rotate2D(q0, M0 * THETA)
                    const kRef = rotate2D(k0, N0 * THETA)
                    nodes.push(
                        line(origin, graph.world(qRef[0], qRef[1]), {
                            stroke: 'blue',
                            width: 2.5,
                            dash: [8, 8],
                        }).opacity(0.32 * showShiftArc.value),
                        line(origin, graph.world(kRef[0], kRef[1]), {
                            stroke: 'orange',
                            width: 2.5,
                            dash: [8, 8],
                        }).opacity(0.32 * showShiftArc.value),
                    )
                    if (aq - M0 * THETA > 0.04) {
                        nodes.push(
                            arc(unitPx * 0.34, -(M0 * THETA), -aq, {
                                stroke: 'yellow',
                                width: 4,
                                dash: [8, 6],
                            })
                                .at(...origin)
                                .opacity(0.85 * showShiftArc.value),
                        )
                    }
                }

                // Draw k arrow slightly under q if overlapping at t=0, else full crisp arrows
                nodes.push(
                    arrow(origin, kTip, { stroke: 'orange', width: 6, tip: 18 }),
                    dot(10, 'orange').at(...kTip).glow(8),
                    arrow(origin, qTip, { stroke: 'blue', width: 6, tip: 18 }),
                    dot(10, 'blue').at(...qTip).glow(8),
                )

                // Vector tip labels placed radially outside the unit circle
                const sep = Math.abs(ak - aq)
                if (sep < 0.12) {
                    nodes.push(
                        text('q, k', { size: 32, color: 'ink' }).moveTo(
                            graph.world(1.16, 0.14),
                        ),
                    )
                } else {
                    const qTagPos = graph.world(Math.cos(aq) * 1.18, Math.sin(aq) * 1.18)
                    const kTagPos = graph.world(Math.cos(ak) * 1.18, Math.sin(ak) * 1.18)
                    nodes.push(
                        tex('R_m q', { size: 34, color: 'blue', display: false }).moveTo(qTagPos),
                        tex('R_n k', { size: 34, color: 'orange', display: false }).moveTo(kTagPos),
                    )
                }

                return nodes
            })

            // Right side: Formula card + Live Readout panel
            const [eqSlot, readoutSlot, dotSlot] = rightArea!.rows([1, 1.35, 1.05], 24)

            const eqBox = rect(eqSlot!.width, eqSlot!.height, {
                fill: 'surface',
                stroke: 'dim',
                width: 2,
                radius: 14,
            })
                .at(eqSlot!.cx, eqSlot!.cy)
                .set('fillOpacity', 0.55)
            const eqMain = place(
                tex('\\langle R_m q,\\, R_n k \\rangle = q^T R_{n-m} k', { size: 42 }),
                sceneArea({
                    left: eqSlot!.left + 16,
                    right: eqSlot!.right - 16,
                    top: eqSlot!.top + 14,
                    bottom: eqSlot!.bottom - 52,
                }),
                'center',
            )
            const eqSubNote = place(
                text('Base step: θ = 0.40 rad per token', { size: 27, color: 'dim' }),
                sceneArea({
                    left: eqSlot!.left,
                    right: eqSlot!.right,
                    top: eqSlot!.bottom - 50,
                    bottom: eqSlot!.bottom - 10,
                }),
                'center',
            )

            const readoutBox = rect(readoutSlot!.width, readoutSlot!.height, {
                fill: 'surface',
                stroke: 'dim',
                width: 2,
                radius: 14,
            })
                .at(readoutSlot!.cx, readoutSlot!.cy)
                .set('fillOpacity', 0.55)

            const liveCoords = dynamic(() => {
                if (showMain.value < 0.01) return []
                const qLine = text(
                    `m = ${mPos.value.toFixed(1).padStart(3, ' ')}   q'(m) = ${formatCoord(qVec())}`,
                    { font: 'mono', size: 28, color: 'blue' },
                )
                const kLine = text(
                    `n = ${nPos.value.toFixed(1).padStart(3, ' ')}   k'(n) = ${formatCoord(kVec())}`,
                    { font: 'mono', size: 28, color: 'orange' },
                )
                const diffLine = text(
                    `Δ = (n − m)θ = ${((nPos.value - mPos.value) * THETA).toFixed(2)} rad`,
                    { font: 'mono', size: 28, color: 'teal' },
                )
                const blk = place(
                    column([qLine, kLine, diffLine], { gap: 24 }),
                    readoutSlot!.inset(24),
                    'center',
                )
                return blk.nodes
            })

            const dotBox = rect(dotSlot!.width, dotSlot!.height, {
                fill: 'teal',
                stroke: 'teal',
                width: 3,
                radius: 14,
            })
                .at(dotSlot!.cx, dotSlot!.cy)
                .set('fillOpacity', 0.14)

            const dotTitle = text("Live inner product  q'(m) · k'(n)", {
                size: 28,
                color: 'dim',
            }).moveTo([dotSlot!.cx, dotSlot!.cy - 36])

            const dotReadout = decimal(currentDot, {
                digits: 3,
                size: 62,
                color: 'teal',
            }).moveTo([dotSlot!.cx, dotSlot!.cy + 26])

            const lockedBadge = rect(310, 44, {
                fill: 'teal',
                stroke: 'teal',
                width: 2.5,
                radius: 22,
            })
                .at(dotSlot!.cx, dotSlot!.bottom + 34)
                .set('fillOpacity', 0.2)
            const lockedLabel = text('LOCKED CONSTANT', {
                size: 26,
                color: 'teal',
            }).moveTo([dotSlot!.cx, dotSlot!.bottom + 34])

            // ----------------------------------------------------------------
            // CHAPTER 1 TIMELINE
            // ----------------------------------------------------------------
            s.chapter('Rotate q by mθ and k by nθ')
            let heading = makeHeading('RoPE encodes position as a 2D rotation')
            let sub = makeSub('Start with identical content vectors q = k = [1, 0], dot product = 1.000')

            s.add(
                heading,
                sub,
                graph,
                unitRing,
                xAxisTag,
                yAxisTag,
                vectorsLayer,
                eqBox,
                eqMain,
                eqSubNote,
                readoutBox,
                liveCoords,
                dotBox,
                dotTitle,
                dotReadout,
            )

            s.caption(
                'Start with identical unit vectors q and k at [1, 0]. Before adding position, their inner product is 1.000.',
                3.6,
            )
            s.wait(1.6)

            s.caption(
                'Rotate query q counterclockwise by m*theta (position m = 2) and key k by n*theta (position n = 5).',
                4.4,
            )
            s.play(mPos.to(M0, { ease: smoother }), { duration: 1.8 })
            s.play(nPos.to(N0, { ease: smoother }), { duration: 2.2 })

            s.caption(
                'Their angular separation is Delta = (n - m)*theta = 3*theta = 1.20 rad, giving inner product cos(1.20) = 0.362.',
                4.4,
            )
            s.play(showDeltaArc.to(1), { duration: 1.0 })
            s.play(indicate([dotBox, dotReadout], { color: 'teal', scale: 1.06 }), {
                duration: 0.9,
            })
            s.wait(1.6)

            // ----------------------------------------------------------------
            // CHAPTER 2 TIMELINE: Co-rotate both by +4 steps!
            // ----------------------------------------------------------------
            s.chapter('Shift both tokens by +4 steps')
            const heading2 = makeHeading('Shift both tokens by +4: the dot product never moves')
            const sub2 = makeSub(
                'm moves 2 -> 6 and n moves 5 -> 9 (+4θ sweep), while Δ = 3θ stays rigid',
            )
            s.play(seq(fadeOut([heading, sub]), fadeIn([heading2, sub2])), { duration: 0.7 })
            heading = heading2
            sub = sub2

            s.caption(
                'Now shift both tokens forward together by +4 positions. Both arrows co-rotate by +4*theta around the circle.',
                4.8,
            )
            s.play(showShiftArc.to(1), fadeIn([lockedBadge, lockedLabel]), { duration: 0.6 })
            s.play(
                mPos.to(M0 + SHIFT, { ease: smoother }),
                nPos.to(N0 + SHIFT, { ease: smoother }),
                { duration: 4.0 },
            )
            s.caption(
                'Every coordinate changes, yet the inner product stays locked at 0.362 to three decimal places: RoPE depends only on n - m.',
                4.6,
            )
            s.play(indicate([dotBox, dotReadout], { color: 'yellow', scale: 1.08 }), {
                duration: 1.0,
            })
            s.wait(2.2)

            // ================================================================
            // CHAPTER 3: Multi-Frequency Intuition (Fast vs Slow Pair)
            // ================================================================
            s.chapter('Fast vs slow frequency pairs')

            const ch12StaticNodes: Node[] = [
                graph,
                unitRing,
                xAxisTag,
                yAxisTag,
                eqBox,
                eqMain,
                eqSubNote,
                readoutBox,
                dotBox,
                dotTitle,
                dotReadout,
                lockedBadge,
                lockedLabel,
            ]

            const heading3 = makeHeading('Multiple frequencies separate local and long-range order')
            const sub3 = makeSub(
                'Every head pairs fast dials (high θ) with slow dials (low θ) across the same offset Δ = n − m',
            )

            s.play(
                showMain.to(0),
                fadeOut(ch12StaticNodes),
                seq(fadeOut([heading, sub]), fadeIn([heading3, sub3])),
                { duration: 0.9 },
            )
            heading = heading3
            sub = sub3

            // Layout for Chapter 3: top shared offset pill, two equal circle cards side by side
            const offsetBannerRegion = sceneArea({
                left: -860,
                right: 860,
                top: -318,
                bottom: -246,
            })
            const pairsArea = sceneArea({ left: -860, right: 860, top: -232, bottom: 378 })
            const [fastCol, slowCol] = pairsArea.columns([1, 1], 72)

            const showMulti = s.value(0)
            const deltaVal = s.value(0)

            const offsetPrefix = text('Relative token offset   Δ =', {
                size: 30,
                color: 'ink',
            })
            const offsetNum = decimal(() => deltaVal.value, {
                digits: 1,
                size: 34,
                color: 'teal',
            })
            const offsetSuffix = text('tokens', { size: 30, color: 'dim' })
            const offsetRow = place(
                row([offsetPrefix, offsetNum, offsetSuffix], { gap: 16 }),
                offsetBannerRegion,
                'center',
            )
            const offsetRowBox = boxOf(offsetRow)
            const offsetPillBg = rect(Math.max(620, offsetRowBox.width + 76), 60, {
                fill: 'surface',
                stroke: 'teal',
                width: 2.5,
                radius: 30,
            })
                .at(offsetBannerRegion.cx, offsetBannerRegion.cy)
                .set('fillOpacity', 0.7)

            const buildPairPanel = (
                col: NonNullable<typeof fastCol>,
                titleLabel: string,
                freqLabel: string,
                roleLabel: string,
                accentColor: string,
            ) => {
                const frame = rect(col.width, col.height, {
                    fill: 'surface',
                    stroke: accentColor,
                    width: 2.5,
                    radius: 16,
                })
                    .at(col.cx, col.cy)
                    .set('fillOpacity', 0.5)
                const titleNode = text(titleLabel, {
                    size: 34,
                    color: accentColor,
                }).moveTo([col.cx, col.top + 38])
                const freqNode = text(freqLabel, {
                    font: 'mono',
                    size: 26,
                    color: 'dim',
                }).moveTo([col.cx, col.top + 78])

                const plotArea = sceneArea({
                    left: col.left + 30,
                    right: col.right - 30,
                    top: col.top + 104,
                    bottom: col.bottom - 142,
                })
                const g = place(
                    axes({
                        x: [-1.28, 1.28],
                        y: [-1.28, 1.28],
                        width: 340,
                        height: 340,
                        xStep: 1,
                        yStep: 1,
                        labels: false,
                        grid: false,
                        tips: false,
                    }),
                    plotArea,
                    'center',
                )
                const o = g.world(0, 0)
                const rPx = Math.abs(g.world(1, 0)[0] - o[0])
                const ring = circle(rPx, { stroke: 'dim', width: 2.2 }).at(...o)
                const qFixed = arrow(o, g.world(1, 0), {
                    stroke: 'blue',
                    width: 5,
                    tip: 15,
                })
                const qTag = text('q', { size: 28, color: 'blue' }).moveTo(g.world(1.16, 0.14))
                const roleNode = text(roleLabel, {
                    size: 27,
                    color: 'dim',
                }).moveTo([col.cx, col.bottom - 34])

                return {
                    staticNodes: [frame, titleNode, freqNode, g, ring, qFixed, qTag, roleNode],
                    g,
                    o,
                    rPx,
                    readoutY: col.bottom - 88,
                    cx: col.cx,
                }
            }

            const fastPanel = buildPairPanel(
                fastCol!,
                'High-Frequency Pair (Fast Dial)',
                'θ₀ = 1.00 rad / token',
                'Crisp local spacing, wraps after 6 tokens',
                'orange',
            )
            const slowPanel = buildPairPanel(
                slowCol!,
                'Low-Frequency Pair (Slow Dial)',
                'θ₃ = 0.08 rad / token',
                'Smooth, monotonic long-range order',
                'teal',
            )

            const multiLayer = dynamic(() => {
                if (showMulti.value < 0.01) return []
                const d = deltaVal.value
                const nodes: Node[] = []

                const drawMovingKey = (
                    panel: typeof fastPanel,
                    freq: number,
                    color: string,
                ) => {
                    const ang = d * freq
                    const kv = rotate2D([1, 0], ang)
                    const kTip = panel.g.world(kv[0], kv[1])
                    const score = Math.cos(ang)

                    if (ang > 0.04) {
                        // Draw wrapped arc clamped to 2*pi so the dial sweep looks crisp
                        const shownArc = Math.min(ang, Math.PI * 2 - 0.02)
                        nodes.push(
                            arc(panel.rPx * 0.45, 0, -shownArc, {
                                stroke: color,
                                width: 5,
                            })
                                .at(...panel.o)
                                .opacity(0.75),
                        )
                    }
                    nodes.push(
                        arrow(panel.o, kTip, { stroke: color, width: 5.5, tip: 16 }),
                        dot(9, color).at(...kTip).glow(8),
                        text(
                            `angle = ${ang.toFixed(2)} rad   |   cos(Δθ) = ${(Math.abs(score) < 0.0005 ? 0 : score).toFixed(3)}`,
                            { font: 'mono', size: 26, color },
                        ).moveTo([panel.cx, panel.readoutY]),
                    )
                }

                drawMovingKey(fastPanel, FAST_FREQ, 'orange')
                drawMovingKey(slowPanel, SLOW_FREQ, 'teal')
                return nodes
            })

            s.add(multiLayer)
            s.caption(
                'Across the head dimensions, RoPE pairs fast high-frequency dials with slow low-frequency dials.',
                4.2,
            )
            s.play(
                fadeIn([
                    offsetPillBg,
                    offsetRow,
                    ...fastPanel.staticNodes,
                    ...slowPanel.staticNodes,
                ]),
                showMulti.to(1),
                { duration: 0.9 },
            )

            s.caption(
                'As offset Delta grows from 0 to 8, the fast pair whips past a full turn to resolve neighbors, while the slow pair glides smoothly for long-range order.',
                5.6,
            )
            s.play(deltaVal.to(MAX_OFFSET, { ease: smoother }), { duration: 5.0 })
            s.wait(2.4)
        },
    )
}
