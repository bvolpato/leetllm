import {
    arrow,
    assertEqual,
    beside,
    circle,
    column,
    commas,
    dot,
    fadeIn,
    fadeOut,
    film,
    indicate,
    line,
    place,
    polygon,
    rect,
    sceneKit,
    seq,
    shift,
    smoother,
    tex,
    text,
    to,
} from 'vizmatic/stage'
import type { ThemeMode } from 'vizmatic'

const DIM = 4096
const RANK = 8
const BASE_PARAMS = DIM * DIM
const ADAPTER_PARAMS = 2 * DIM * RANK
const PCT = (ADAPTER_PARAMS / BASE_PARAMS) * 100

export function createFilm(theme: ThemeMode = 'dark') {
    assertEqual(BASE_PARAMS, 16_777_216, 'W0 parameter count')
    assertEqual(ADAPTER_PARAMS, 65_536, 'rank-8 LoRA parameter count')
    assertEqual(Number(PCT.toFixed(2)), 0.39, 'trainable percentage of W0')

    return film(
        {
            title: 'LoRA: low-rank adapters with zero serving latency',
            description:
                'Freeze the base weight matrix W0, train a parallel rank-8 bottleneck BA, then fold it back into W0 for zero deployment overhead.',
            look: theme === 'light' ? 'paper' : 'midnight',
            font: 'text-serif',
            fps: 30,
            aspect: '16:9',
        },
        (s) => {
            const kit = sceneKit({
                size: 30,
                heading: { size: 50, align: 'center' },
                area: { left: -880, right: 880, top: -375, bottom: 420 },
            })

            const [, footerArea] = kit.area.rows([2.7, 1], 26)
            const [eqBox, statsBox] = footerArea!.columns([1.22, 1], 36)

            const title = kit.heading('LoRA: low-rank adapters with zero serving latency')

            // Vertical anchor lanes inside diagramArea (y in [-375, 195]).
            const yTop = -215
            const yBot = 65
            const yMid = (yTop + yBot) / 2 // -75

            // Horizontal stations.
            const xIn = -770
            const xFork = -645
            const xBase = -115
            const xA0 = -475
            const xA1 = -245
            const xB0 = -55
            const xB1 = 175
            const xScale = 345
            const xPlus = 550
            const xOut = 770

            const fullH = 196
            const neckH = 26

            // ── Input vector x ────────────────────────────────────────────────
            const xBar = rect(56, fullH + 24, {
                fill: 'surface',
                stroke: 'blue',
                width: 3.5,
                radius: 10,
            }).at(xIn, yMid)
            const xName = text('x', { size: 42, color: 'blue' }).moveTo([xIn, yMid])
            const xDim = beside(text('d = 4096', { size: 26, color: 'dim' }), xBar, 'under', 16)

            // ── Output vector h ───────────────────────────────────────────────
            const hBar = rect(56, fullH + 24, {
                fill: 'surface',
                stroke: 'ink',
                width: 3.5,
                radius: 10,
            }).at(xOut, yMid)
            const hName = text('h', { size: 42, color: 'ink' }).moveTo([xOut, yMid])
            const hDim = beside(text('d = 4096', { size: 26, color: 'dim' }), hBar, 'under', 16)

            // ── Frozen Base Weight W0 (Top path) ──────────────────────────────
            const w0W = 280
            const w0H = 200
            const w0Box = rect(w0W, w0H, {
                fill: 'surface',
                stroke: 'blue',
                width: 3.5,
                radius: 14,
            }).at(xBase, yTop)
            const w0Label = text('W₀', { size: 54, color: 'ink' }).moveTo([xBase, yTop - 36])
            const w0Shape = text('4096 × 4096', { font: 'mono', size: 26, color: 'dim' }).moveTo([
                xBase,
                yTop + 22,
            ])
            const w0Count = text('16.8M params', { size: 26, color: 'blue' }).moveTo([
                xBase,
                yTop + 62,
            ])
            const frozenChip = beside(
                kit.chip('FROZEN', { color: 'blue', stroke: 'blue', size: 26 }),
                w0Box,
                'above',
                14,
            )

            // Top branch wires (initial direct x -> W0 -> h in Chapter 1, plus fork wires).
            const inToFork = line([xIn + 28, yMid], [xFork, yMid], { stroke: 'blue', width: 3.5 })
            const forkToTop = line([xFork, yMid], [xFork, yTop], { stroke: 'blue', width: 3.5 })
            const topInArrow = arrow([xFork, yTop], [xBase - w0W / 2 - 4, yTop], {
                stroke: 'blue',
                width: 3.5,
                tip: 16,
            })

            // Direct Chapter 1 wire from W0 to h (replaced by W0 -> + -> h in Chapter 2, restored in Ch 3).
            const topDirectOut1 = line([xBase + w0W / 2, yTop], [xPlus, yTop], {
                stroke: 'blue',
                width: 3.5,
            })
            const topDirectOut2 = line([xPlus, yTop], [xPlus, yMid], {
                stroke: 'blue',
                width: 3.5,
            })
            const directToH = arrow([xPlus, yMid], [xOut - 32, yMid], {
                stroke: 'blue',
                width: 3.5,
                tip: 16,
            })
            const topOutLabel = text('W₀ x', { size: 30, color: 'blue' }).moveTo([
                (xBase + w0W / 2 + xPlus) / 2,
                yTop - 32,
            ])

            // ── Parallel Low-Rank Adapter Branch (Bottom path) ────────────────
            const forkToBot = line([xFork, yMid], [xFork, yBot], { stroke: 'teal', width: 3.5 })
            const botInArrow = arrow([xFork, yBot], [xA0 - 4, yBot], {
                stroke: 'teal',
                width: 3.5,
                tip: 16,
            })

            const trapA = polygon(
                [
                    [xA0, yBot - fullH / 2],
                    [xA1, yBot - neckH / 2],
                    [xA1, yBot + neckH / 2],
                    [xA0, yBot + fullH / 2],
                ],
                { fill: 'teal', stroke: 'teal', width: 3, opacity: 0.25 },
            )
            const trapAEdge = polygon(
                [
                    [xA0, yBot - fullH / 2],
                    [xA1, yBot - neckH / 2],
                    [xA1, yBot + neckH / 2],
                    [xA0, yBot + fullH / 2],
                ],
                { fill: null, stroke: 'teal', width: 3.5 },
            )
            const aLabel = text('A', { size: 42, color: 'teal' }).moveTo([xA0 + 58, yBot])
            const aDim = text('8 × 4096', { font: 'mono', size: 26, color: 'dim' }).moveTo([
                (xA0 + xA1) / 2,
                yBot + fullH / 2 + 30,
            ])

            // Narrow rank-8 bottleneck bridge.
            const neckBridge = rect(xB0 - xA1, neckH, {
                fill: 'teal',
                stroke: 'teal',
                width: 2,
                radius: 4,
            }).at((xA1 + xB0) / 2, yBot)
            const rankLabel = text('rank r = 8', { size: 28, color: 'teal' }).moveTo([
                (xA1 + xB0) / 2,
                yBot - 44,
            ])

            const trapB = polygon(
                [
                    [xB0, yBot - neckH / 2],
                    [xB1, yBot - fullH / 2],
                    [xB1, yBot + fullH / 2],
                    [xB0, yBot + neckH / 2],
                ],
                { fill: 'teal', stroke: 'teal', width: 3, opacity: 0.25 },
            )
            const trapBEdge = polygon(
                [
                    [xB0, yBot - neckH / 2],
                    [xB1, yBot - fullH / 2],
                    [xB1, yBot + fullH / 2],
                    [xB0, yBot + neckH / 2],
                ],
                { fill: null, stroke: 'teal', width: 3.5 },
            )
            const bLabel = text('B', { size: 42, color: 'teal' }).moveTo([xB1 - 58, yBot])
            const bDim = text('4096 × 8', { font: 'mono', size: 26, color: 'dim' }).moveTo([
                (xB0 + xB1) / 2,
                yBot + fullH / 2 + 30,
            ])
            const bInitNote = text('init B = 0  (ΔW = 0)', { size: 26, color: 'yellow' }).moveTo([
                (xB0 + xB1) / 2,
                yBot - fullH / 2 - 22,
            ])

            // Scaling chip × α/r and output wire up to +.
            const bToScale = arrow([xB1 + 4, yBot], [xScale - 76, yBot], {
                stroke: 'teal',
                width: 3.5,
                tip: 15,
            })
            const scaleBox = rect(144, 86, {
                fill: 'surface',
                stroke: 'teal',
                width: 3,
                radius: 14,
            }).at(xScale, yBot)
            const scaleText = tex('\\times \\frac{\\alpha}{r}', {
                size: 30,
                color: 'teal',
            }).moveTo([xScale, yBot])

            const scaleToPlus1 = line([xScale + 72, yBot], [xPlus, yBot], {
                stroke: 'teal',
                width: 3.5,
            })
            const scaleToPlus2 = arrow([xPlus, yBot], [xPlus, yMid + 40], {
                stroke: 'teal',
                width: 3.5,
                tip: 16,
            })

            // Summing node +.
            const plusCircle = circle(34, {
                fill: 'surface',
                stroke: 'ink',
                width: 3.5,
            }).at(xPlus, yMid)
            const plusSign = text('+', { size: 44, color: 'ink' }).moveTo([xPlus, yMid - 2])
            const topToPlusArrow = arrow([xPlus, yTop], [xPlus, yMid - 40], {
                stroke: 'blue',
                width: 3.5,
                tip: 16,
            })

            const adapterNodes = [
                forkToBot,
                botInArrow,
                trapA,
                trapAEdge,
                aLabel,
                aDim,
                neckBridge,
                rankLabel,
                trapB,
                trapBEdge,
                bLabel,
                bDim,
                bInitNote,
                bToScale,
                scaleBox,
                scaleText,
                scaleToPlus1,
                scaleToPlus2,
            ]

            // Merged W0 replacement text + chip (Chapter 3).
            const mergedChip = beside(
                kit.chip('MERGED  ·  0 ms OVERHEAD', { color: 'green', stroke: 'green', size: 26 }),
                w0Box,
                'above',
                14,
            )
            const wMergedLabel = tex('W_{\\text{merged}}', { size: 42, color: 'green' }).moveTo([
                xBase,
                yTop - 52,
            ])
            const wMergedFormula = tex('W_0 + (\\alpha / r)\\,B A', {
                size: 30,
                color: 'ink',
            }).moveTo([xBase, yTop + 6])
            const wMergedCount = text('Same 16.8M shape', { size: 26, color: 'green' }).moveTo([
                xBase,
                yTop + 62,
            ])
            const mergedOutLabel = tex('W_{\\text{merged}} x', { size: 32, color: 'green' }).moveTo([
                (xBase + w0W / 2 + xPlus) / 2,
                yTop - 34,
            ])

            // ── Footer Panels (Equations + Parameter Budget) ──────────────────
            const eqBg = rect(eqBox!.width, eqBox!.height, {
                fill: 'surface',
                stroke: 'grid',
                width: 2,
                radius: 16,
            }).at(eqBox!.cx, eqBox!.cy)
            const statsBg = rect(statsBox!.width, statsBox!.height, {
                fill: 'surface',
                stroke: 'grid',
                width: 2,
                radius: 16,
            }).at(statsBox!.cx, statsBox!.cy)

            const eq1 = place(
                column(
                    [
                        text('Frozen base forward pass', { size: 26, color: 'dim' }),
                        tex('h = W_0 x', { size: 46, color: 'blue' }),
                    ],
                    { gap: 16, align: 'center' },
                ),
                eqBox!,
                'center',
            )
            const eq2 = place(
                column(
                    [
                        text('Parallel low-rank adapter update', { size: 26, color: 'dim' }),
                        tex('h = W_0 x + \\frac{\\alpha}{r} B A x', { size: 44, color: 'ink' }),
                    ],
                    { gap: 14, align: 'center' },
                ),
                eqBox!,
                'center',
            )
            const eq3 = place(
                column(
                    [
                        text('Linearity folds the adapter into W₀', { size: 26, color: 'green' }),
                        tex('h = \\left(W_0 + \\frac{\\alpha}{r} B A\\right) x = W_{\\text{merged}} x', {
                            size: 38,
                            color: 'green',
                        }),
                    ],
                    { gap: 14, align: 'center' },
                ),
                eqBox!,
                'center',
            )

            const stats1 = place(
                column(
                    [
                        text('Frozen weights (W₀)', { size: 28, color: 'blue' }),
                        text(`${commas(BASE_PARAMS)} parameters`, {
                            font: 'mono',
                            size: 34,
                            color: 'ink',
                        }),
                        text('Gradients off: zero optimizer state', { size: 26, color: 'dim' }),
                    ],
                    { gap: 14, align: 'center' },
                ),
                statsBox!,
                'center',
            )
            const stats2 = place(
                column(
                    [
                        text('Trainable weights (A + B, r = 8)', { size: 28, color: 'teal' }),
                        text(`${commas(ADAPTER_PARAMS)} params  (${PCT.toFixed(2)}% of W₀)`, {
                            font: 'mono',
                            size: 30,
                            color: 'teal',
                        }),
                        text('256× fewer trainable weights', { size: 26, color: 'dim' }),
                    ],
                    { gap: 14, align: 'center' },
                ),
                statsBox!,
                'center',
            )
            const stats3 = place(
                column(
                    [
                        text('Deployed inference cost', { size: 28, color: 'green' }),
                        text('Adapter overhead: 0 ms', {
                            font: 'mono',
                            size: 34,
                            color: 'green',
                        }),
                        text('One standard matrix multiply', { size: 26, color: 'dim' }),
                    ],
                    { gap: 14, align: 'center' },
                ),
                statsBox!,
                'center',
            )

            // ── Chapter 1: Frozen base weight ─────────────────────────────────
            s.chapter('Frozen base weight W0')
            s.add(
                title,
                xBar,
                xName,
                xDim,
                hBar,
                hName,
                hDim,
                w0Box,
                w0Label,
                w0Shape,
                w0Count,
                frozenChip,
                inToFork,
                forkToTop,
                topInArrow,
                topDirectOut1,
                topDirectOut2,
                directToH,
                topOutLabel,
                eqBg,
                statsBg,
                eq1,
                stats1,
            )
            s.caption(
                'Full fine-tuning would update all 16.8 million weights in W0. LoRA locks W0 completely frozen.',
                4.5,
            )

            // Pulse traveling through frozen W0.
            const pBase = dot(12, 'blue').at(xIn + 28, yMid).glow(10)
            s.add(pBase)
            s.play(
                seq(
                    to(pBase, (n) => n.at(xFork, yMid), { duration: 0.35 }),
                    to(pBase, (n) => n.at(xFork, yTop), { duration: 0.35 }),
                    to(pBase, (n) => n.at(xBase, yTop), { duration: 0.7 }),
                    to(pBase, (n) => n.at(xPlus, yTop), { duration: 0.7 }),
                    to(pBase, (n) => n.at(xPlus, yMid), { duration: 0.35 }),
                    to(pBase, (n) => n.at(xOut - 28, yMid), { duration: 0.45 }),
                ),
            )
            s.play(fadeOut(pBase), { duration: 0.3 })
            s.wait(1.0)

            // ── Chapter 2: Low-rank adapter bypass ────────────────────────────
            s.chapter('Low-rank adapter bypass')
            s.play(
                fadeOut([topDirectOut2, eq1, stats1]),
                fadeIn([
                    ...adapterNodes,
                    plusCircle,
                    plusSign,
                    topToPlusArrow,
                    eq2,
                    stats2,
                ]),
                { duration: 1.0 },
            )
            s.caption(
                'A trainable rank-8 bypass compresses 4096 dimensions down to 8 via A, then expands back via B using just 0.39% of the weights.',
                5.5,
            )
            s.wait(1.0)

            // Animate synchronized forward pass splitting down both paths.
            const pTop = dot(11, 'blue').at(xFork, yMid).glow(10)
            const pBot = dot(11, 'teal').at(xFork, yMid).glow(12)
            s.add(pTop, pBot)
            s.play(
                seq(
                    to(pTop, (n) => n.at(xFork, yTop), { duration: 0.4 }),
                    to(pTop, (n) => n.at(xBase, yTop), { duration: 1.1 }),
                    to(pTop, (n) => n.at(xPlus, yTop), { duration: 1.1 }),
                    to(pTop, (n) => n.at(xPlus, yMid), { duration: 0.5 }),
                ),
                seq(
                    to(pBot, (n) => n.at(xFork, yBot), { duration: 0.4 }),
                    to(pBot, (n) => n.at(xA0, yBot), { duration: 0.35 }),
                    to(pBot, (n) => n.at(xA1, yBot).scale(0.55), { duration: 0.55 }),
                    to(pBot, (n) => n.at(xB0, yBot).scale(0.55), { duration: 0.45 }),
                    to(pBot, (n) => n.at(xB1, yBot).scale(1.0), { duration: 0.55 }),
                    to(pBot, (n) => n.at(xScale, yBot), { duration: 0.3 }),
                    to(pBot, (n) => n.at(xPlus, yBot), { duration: 0.25 }),
                    to(pBot, (n) => n.at(xPlus, yMid), { duration: 0.25 }),
                ),
            )
            s.play(
                indicate([plusCircle, plusSign], { color: 'teal', scale: 1.18 }),
                to(pBot, (n) => n.at(xOut - 28, yMid)),
                fadeOut(pTop),
                { duration: 0.8 },
            )
            s.play(fadeOut(pBot), { duration: 0.3 })
            s.caption(
                'B starts at zero so the adapter begins as a clean no-op, then learns the task update BA.',
                4.0,
            )
            s.wait(2.4)

            // ── Chapter 3: Zero-latency merge ─────────────────────────────────
            s.chapter('Zero-latency merge for deployment')
            s.play(
                fadeOut([
                    forkToBot,
                    botInArrow,
                    aDim,
                    bDim,
                    bInitNote,
                    rankLabel,
                    bToScale,
                    scaleToPlus1,
                    scaleToPlus2,
                    plusCircle,
                    plusSign,
                    topToPlusArrow,
                    w0Label,
                    w0Shape,
                    w0Count,
                    frozenChip,
                    topOutLabel,
                    eq2,
                    stats2,
                ]),
                ...[
                    trapA,
                    trapAEdge,
                    aLabel,
                    neckBridge,
                    trapB,
                    trapBEdge,
                    bLabel,
                    scaleBox,
                    scaleText,
                ].map((n) => shift(n, 0, yTop - yBot, { ease: smoother })),
                { duration: 1.3 },
            )
            s.play(
                fadeOut([
                    trapA,
                    trapAEdge,
                    aLabel,
                    neckBridge,
                    trapB,
                    trapBEdge,
                    bLabel,
                    scaleBox,
                    scaleText,
                ]),
                to(w0Box, (n) => n.stroke('green', 4)),
                fadeIn([
                    wMergedLabel,
                    wMergedFormula,
                    wMergedCount,
                    mergedChip,
                    mergedOutLabel,
                    topDirectOut2,
                    eq3,
                    stats3,
                ]),
                { duration: 0.9 },
            )
            s.caption(
                'At deployment, fold (alpha/r)BA directly into W0. Serving executes a single matrix multiply with 0 ms overhead.',
                5.5,
            )

            // Fast single-path merged inference pulse.
            const pMerged = dot(13, 'green').at(xIn + 28, yMid).glow(12)
            s.add(pMerged)
            s.play(
                seq(
                    to(pMerged, (n) => n.at(xFork, yMid), { duration: 0.25 }),
                    to(pMerged, (n) => n.at(xFork, yTop), { duration: 0.25 }),
                    to(pMerged, (n) => n.at(xBase, yTop), { duration: 0.55 }),
                    to(pMerged, (n) => n.at(xPlus, yTop), { duration: 0.55 }),
                    to(pMerged, (n) => n.at(xPlus, yMid), { duration: 0.25 }),
                    to(pMerged, (n) => n.at(xOut - 28, yMid), { duration: 0.35 }),
                ),
            )
            s.play(
                fadeOut(pMerged),
                indicate([w0Box, wMergedLabel], { color: 'green', scale: 1.05 }),
                { duration: 0.7 },
            )
            s.wait(3.2)
        },
    )
}
