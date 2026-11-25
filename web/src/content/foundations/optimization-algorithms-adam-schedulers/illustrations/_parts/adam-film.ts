import {
    assertEqual,
    axes,
    beside,
    column,
    dot,
    dynamic,
    fadeIn,
    fadeOut,
    film,
    indicate,
    linear,
    place,
    polyline,
    rect,
    row,
    sceneKit,
    seq,
    smoother,
    tex,
    text,
    type Node,
    type Vec,
} from 'vizmatic/stage'
import type { ThemeMode } from 'vizmatic'

const START: readonly [number, number] = [-3.2, 0.85]
const CURVATURE_W2 = 25
const TOTAL_STEPS = 22
const SGD_LR = 0.076
const ADAM_LR = 0.20
const BETA1 = 0.8
const BETA2 = 0.999
const EPS = 1e-8

const X_MIN = -3.8
const X_MAX = 1.4
const Y_MIN = -1.2
const Y_MAX = 1.2

interface StepState {
    w1: number
    w2: number
    loss: number
    g1: number
    g2: number
    scale1: number
    scale2: number
    step1: number
    step2: number
}

function lossAt(w1: number, w2: number): number {
    return 0.5 * w1 * w1 + 0.5 * CURVATURE_W2 * w2 * w2
}

function gradAt(w1: number, w2: number): [number, number] {
    return [w1, CURVATURE_W2 * w2]
}

function simulateSgd(steps: number): StepState[] {
    let w1 = START[0]
    let w2 = START[1]
    const [g10, g20] = gradAt(w1, w2)
    const out: StepState[] = [
        {
            w1,
            w2,
            loss: lossAt(w1, w2),
            g1: g10,
            g2: g20,
            scale1: 1,
            scale2: 1,
            step1: -SGD_LR * g10,
            step2: -SGD_LR * g20,
        },
    ]
    for (let t = 1; t <= steps; t++) {
        const [g1, g2] = gradAt(w1, w2)
        const dw1 = -SGD_LR * g1
        const dw2 = -SGD_LR * g2
        w1 += dw1
        w2 += dw2
        const [ng1, ng2] = gradAt(w1, w2)
        out.push({
            w1,
            w2,
            loss: lossAt(w1, w2),
            g1: ng1,
            g2: ng2,
            scale1: 1,
            scale2: 1,
            step1: dw1,
            step2: dw2,
        })
    }
    return out
}

function simulateAdam(steps: number): StepState[] {
    let w1 = START[0]
    let w2 = START[1]
    let m1 = 0
    let m2 = 0
    let v1 = 0
    let v2 = 0
    const [g10, g20] = gradAt(w1, w2)
    const out: StepState[] = [
        {
            w1,
            w2,
            loss: lossAt(w1, w2),
            g1: g10,
            g2: g20,
            scale1: 1 / (Math.abs(g10) + EPS),
            scale2: 1 / (Math.abs(g20) + EPS),
            step1: 0,
            step2: 0,
        },
    ]
    for (let t = 1; t <= steps; t++) {
        const [g1, g2] = gradAt(w1, w2)
        m1 = BETA1 * m1 + (1 - BETA1) * g1
        m2 = BETA1 * m2 + (1 - BETA1) * g2
        v1 = BETA2 * v1 + (1 - BETA2) * g1 * g1
        v2 = BETA2 * v2 + (1 - BETA2) * g2 * g2
        const m1Hat = m1 / (1 - BETA1 ** t)
        const m2Hat = m2 / (1 - BETA1 ** t)
        const v1Hat = v1 / (1 - BETA2 ** t)
        const v2Hat = v2 / (1 - BETA2 ** t)
        const scale1 = 1 / (Math.sqrt(v1Hat) + EPS)
        const scale2 = 1 / (Math.sqrt(v2Hat) + EPS)
        const dw1 = -ADAM_LR * m1Hat * scale1
        const dw2 = -ADAM_LR * m2Hat * scale2
        w1 += dw1
        w2 += dw2
        const [ng1, ng2] = gradAt(w1, w2)
        out.push({
            w1,
            w2,
            loss: lossAt(w1, w2),
            g1: ng1,
            g2: ng2,
            scale1,
            scale2,
            step1: dw1,
            step2: dw2,
        })
    }
    return out
}

function insideDomain(x: number, y: number): boolean {
    return x >= X_MIN && x <= X_MAX && y >= Y_MIN && y <= Y_MAX
}

function contourRuns(level: number, samples = 200): Vec[][] {
    const rx = Math.sqrt(2 * level)
    const ry = Math.sqrt((2 * level) / CURVATURE_W2)
    const runs: Vec[][] = []
    let current: Vec[] = []
    for (let i = 0; i <= samples; i++) {
        const theta = (i / samples) * Math.PI * 2
        const x = rx * Math.cos(theta)
        const y = ry * Math.sin(theta)
        if (insideDomain(x, y)) {
            current.push([x, y])
        } else if (current.length > 0) {
            if (current.length >= 2) runs.push(current)
            current = []
        }
    }
    if (current.length >= 2) runs.push(current)
    return runs
}

function sampleState(path: readonly StepState[], t: number): StepState {
    const clamped = Math.max(0, Math.min(path.length - 1, t))
    const i0 = Math.floor(clamped)
    const i1 = Math.min(path.length - 1, i0 + 1)
    const f = clamped - i0
    const a = path[i0]!
    const b = path[i1]!
    return {
        w1: a.w1 + (b.w1 - a.w1) * f,
        w2: a.w2 + (b.w2 - a.w2) * f,
        loss: a.loss + (b.loss - a.loss) * f,
        g1: a.g1 + (b.g1 - a.g1) * f,
        g2: a.g2 + (b.g2 - a.g2) * f,
        scale1: a.scale1 + (b.scale1 - a.scale1) * f,
        scale2: a.scale2 + (b.scale2 - a.scale2) * f,
        step1: a.step1 + (b.step1 - a.step1) * f,
        step2: a.step2 + (b.step2 - a.step2) * f,
    }
}

export function createFilm(theme: ThemeMode = 'dark') {
    const sgdPath = simulateSgd(TOTAL_STEPS)
    const adamPath = simulateAdam(TOTAL_STEPS)

    assertEqual(Number(lossAt(START[0], START[1]).toFixed(2)), 14.15, 'initial ravine loss')
    assertEqual(sgdPath.length, TOTAL_STEPS + 1, 'SGD trajectory length')
    assertEqual(adamPath.length, TOTAL_STEPS + 1, 'Adam trajectory length')
    assertEqual(
        adamPath[TOTAL_STEPS]!.loss < sgdPath[TOTAL_STEPS]!.loss,
        true,
        'Adam reaches lower loss than plain SGD',
    )

    return film(
        {
            title: 'Why Adam glides down steep ravines',
            description:
                'Compare plain SGD and Adam on an ill-conditioned 25:1 quadratic ravine with live per-coordinate scaling.',
            look: theme === 'light' ? 'paper' : 'midnight',
            font: 'text-serif',
            fps: 30,
            aspect: '16:9',
        },
        (s) => {
            const kit = sceneKit({
                size: 30,
                heading: { size: 52, align: 'center' },
                area: { left: -890, right: 890, top: -380, bottom: 420 },
            })

            const [plotArea, panelArea] = kit.area.columns([1.46, 1], 48)
            const [topCardBox, midCardBox, botCardBox] = panelArea!.rows([0.88, 2.25, 0.87], 22)

            const title = kit.heading('Why Adam glides down steep ravines')

            // Coordinate axes for the 25:1 ravine.
            const graph = place(
                axes({
                    x: [X_MIN, X_MAX],
                    y: [Y_MIN, Y_MAX],
                    width: 900,
                    height: 610,
                    xStep: 1,
                    yStep: 0.5,
                    labels: true,
                    labelSize: 26,
                    grid: true,
                    tips: false,
                }),
                plotArea!,
                'center',
            )

            const w1AxisLabel = beside(
                text('w₁  (flat valley, curvature 1)', { size: 28, color: 'dim' }),
                graph,
                'under',
                16,
            )
            const w2AxisLabel = beside(
                text('w₂  (steep walls, curvature 25)', { size: 28, color: 'dim' }),
                graph,
                'above',
                14,
            )

            // Elliptical level contours of L(w1, w2) = 0.5 w1^2 + 12.5 w2^2.
            const levels = [0.3, 1.0, 2.4, 4.6, 7.6, 11.4, 16.0]
            const contourNodes: Node[] = []
            levels.forEach((level, idx) => {
                const runs = contourRuns(level, 220)
                const op = 0.52 - idx * 0.045
                for (const pts of runs) {
                    const worldPts = pts.map(([x, y]) => graph.world(x, y))
                    contourNodes.push(
                        polyline(worldPts, {
                            stroke: idx <= 1 ? 'teal' : 'blue',
                            width: idx <= 1 ? 2.4 : 1.8,
                            opacity: op,
                        }),
                    )
                }
            })

            // Minimum and start markers.
            const originPt = graph.world(0, 0)
            const startPt = graph.world(START[0], START[1])
            const minDot = dot(11, 'yellow').at(originPt).glow(10)
            const minTag = text('min (0, 0)', { size: 26, color: 'yellow' }).moveTo([
                originPt[0] + 102,
                originPt[1] - 46,
            ])
            const startDot = dot(10, 'ink').at(startPt)
            const startTag = text('start (−3.2, 0.85)', { size: 26, color: 'ink' }).moveTo([
                startPt[0] + 125,
                startPt[1] - 48,
            ])

            // Timeline values controlling trajectories and telemetry cards.
            const sgdStep = s.value(0)
            const sgdAlpha = s.value(0)
            const adamStep = s.value(0)
            const adamAlpha = s.value(0)
            const sgdPanelAlpha = s.value(0)
            const adamPanelAlpha = s.value(0)

            const buildTrail = (
                path: readonly StepState[],
                stepVal: number,
                alpha: number,
                color: string,
            ): Node[] => {
                if (alpha <= 0.01) return []
                const clamped = Math.max(0, Math.min(path.length - 1, stepVal))
                const whole = Math.floor(clamped)
                const pts: Vec[] = []
                for (let i = 0; i <= whole; i++) {
                    pts.push(graph.world(path[i]!.w1, path[i]!.w2))
                }
                const cur = sampleState(path, clamped)
                const curWorld = graph.world(cur.w1, cur.w2)
                pts.push(curWorld)
                const nodes: Node[] = []
                if (pts.length >= 2) {
                    nodes.push(
                        polyline(pts, {
                            stroke: color,
                            width: 4.5,
                            opacity: alpha * 0.92,
                        }),
                    )
                }
                nodes.push(dot(12, color).at(curWorld).glow(12).opacity(alpha))
                return nodes
            }

            const sgdLayer = dynamic(() => buildTrail(sgdPath, sgdStep.value, sgdAlpha.value, 'red'))
            const adamLayer = dynamic(() =>
                buildTrail(adamPath, adamStep.value, adamAlpha.value, 'teal'),
            )

            // Right-hand cards.
            const cardBg = (box: { cx: number; cy: number; width: number; height: number }) =>
                rect(box.width, box.height, {
                    fill: 'surface',
                    stroke: 'grid',
                    width: 2,
                    radius: 16,
                }).at(box.cx, box.cy)

            const topBg = cardBg(topCardBox!)
            const midBg = cardBg(midCardBox!)
            const botBg = cardBg(botCardBox!)

            const lossEq = tex('L(w_1, w_2) = 0.5\\,w_1^2 + 12.5\\,w_2^2', { size: 36 })
            const gradEq = text('Gradient:  g₁ = w₁,   g₂ = 25 w₂   (25 : 1 ratio)', {
                size: 26,
                color: 'dim',
            })
            const topContent = place(
                column([lossEq, gradEq], { gap: 18, align: 'center' }),
                topCardBox!,
                'center',
            )

            // Intro middle content (Chapter 1).
            const introContent = place(
                column(
                    [
                        text('Why one learning rate struggles', { size: 34, color: 'blue' }),
                        text('Steep w₂ walls demand a tiny step size.', { size: 28 }),
                        text('Flat w₁ valley needs a much larger step.', { size: 28 }),
                        text(`Start loss:  L = ${lossAt(START[0], START[1]).toFixed(2)}`, {
                            size: 30,
                            color: 'yellow',
                        }),
                    ],
                    { gap: 26, align: 'left' },
                ),
                midCardBox!.inset(28),
                'center',
            )

            // Helper to left-align a text node at exact (x, y) center-y.
            const leftAt = (node: Node, x: number, y: number): Node =>
                node.moveTo([0, y]).alignTo([x, 0], 'left')

            // Live SGD telemetry (Chapter 2).
            const midInner = midCardBox!.inset(28)
            const barMaxW = midInner.width - 20
            const sgdPanel = dynamic(() => {
                const a = sgdPanelAlpha.value
                if (a <= 0.01) return []
                const st = sampleState(sgdPath, sgdStep.value)
                const stepIdx = Math.round(sgdStep.value)
                const dw1Frac = Math.min(1, Math.abs(st.step1) / 1.65)
                const dw2Frac = Math.min(1, Math.abs(st.step2) / 1.65)
                const leftX = midInner.left + 8
                const y0 = midInner.top + 26
                const nodes: Node[] = [
                    leftAt(
                        text(`Plain SGD   (lr = ${SGD_LR})`, { size: 34, color: 'red' }),
                        leftX,
                        y0,
                    ).opacity(a),
                    leftAt(
                        text(
                            `Step ${String(stepIdx).padStart(2, ' ')} / ${TOTAL_STEPS}     Loss: ${st.loss.toFixed(2)}`,
                            { font: 'mono', size: 28, color: 'ink' },
                        ),
                        leftX,
                        y0 + 58,
                    ).opacity(a),
                    leftAt(
                        text(`Flat w₁ step   |Δw₁| = ${Math.abs(st.step1).toFixed(2)}`, {
                            size: 26,
                            color: 'blue',
                        }),
                        leftX,
                        y0 + 124,
                    ).opacity(a),
                    rect(Math.max(12, barMaxW * dw1Frac), 22, {
                        fill: 'blue',
                        stroke: null,
                        radius: 6,
                    })
                        .at(leftX + Math.max(12, barMaxW * dw1Frac) / 2, y0 + 162)
                        .opacity(a),
                    leftAt(
                        text(`Steep w₂ bounce  |Δw₂| = ${Math.abs(st.step2).toFixed(2)}`, {
                            size: 26,
                            color: 'red',
                        }),
                        leftX,
                        y0 + 218,
                    ).opacity(a),
                    rect(Math.max(12, barMaxW * dw2Frac), 22, {
                        fill: 'red',
                        stroke: null,
                        radius: 6,
                    })
                        .at(leftX + Math.max(12, barMaxW * dw2Frac) / 2, y0 + 256)
                        .opacity(a),
                    leftAt(
                        text('Violent zigzags on w₂, tiny crawl on w₁.', {
                            size: 27,
                            color: 'dim',
                        }),
                        leftX,
                        y0 + 320,
                    ).opacity(a),
                ]
                return nodes
            })

            // Live Adam telemetry (Chapter 3).
            const adamPanel = dynamic(() => {
                const a = adamPanelAlpha.value
                if (a <= 0.01) return []
                const st = sampleState(adamPath, adamStep.value)
                const stepIdx = Math.round(adamStep.value)
                const maxScale = 0.65
                const s1Frac = Math.min(1, st.scale1 / maxScale)
                const s2Frac = Math.min(1, st.scale2 / maxScale)
                const ratio = st.scale1 / Math.max(st.scale2, 1e-6)
                const leftX = midInner.left + 8
                const y0 = midInner.top + 26
                const nodes: Node[] = [
                    leftAt(
                        text('Adam   (per-coordinate scaling)', { size: 34, color: 'teal' }),
                        leftX,
                        y0,
                    ).opacity(a),
                    leftAt(
                        text(
                            `Step ${String(stepIdx).padStart(2, ' ')} / ${TOTAL_STEPS}     Loss: ${st.loss.toFixed(3)}`,
                            { font: 'mono', size: 28, color: 'ink' },
                        ),
                        leftX,
                        y0 + 58,
                    ).opacity(a),
                    leftAt(
                        text(`Flat w₁ boost    1/√v̂₁ = ${st.scale1.toFixed(3)}`, {
                            font: 'mono',
                            size: 26,
                            color: 'teal',
                        }),
                        leftX,
                        y0 + 124,
                    ).opacity(a),
                    rect(Math.max(14, barMaxW * s1Frac), 22, {
                        fill: 'teal',
                        stroke: null,
                        radius: 6,
                    })
                        .at(leftX + Math.max(14, barMaxW * s1Frac) / 2, y0 + 162)
                        .opacity(a),
                    leftAt(
                        text(`Steep w₂ damp    1/√v̂₂ = ${st.scale2.toFixed(3)}`, {
                            font: 'mono',
                            size: 26,
                            color: 'orange',
                        }),
                        leftX,
                        y0 + 218,
                    ).opacity(a),
                    rect(Math.max(14, barMaxW * s2Frac), 22, {
                        fill: 'orange',
                        stroke: null,
                        radius: 6,
                    })
                        .at(leftX + Math.max(14, barMaxW * s2Frac) / 2, y0 + 256)
                        .opacity(a),
                    leftAt(
                        text(`Effective scale ratio: ${ratio.toFixed(1)}× boost on flat w₁`, {
                            size: 27,
                            color: 'teal',
                        }),
                        leftX,
                        y0 + 320,
                    ).opacity(a),
                ]
                return nodes
            })

            // Final comparison summary (Chapter 4).
            const finalSgd = sgdPath[TOTAL_STEPS]!
            const finalAdam = adamPath[TOTAL_STEPS]!
            const summaryContent = place(
                column(
                    [
                        text(`After ${TOTAL_STEPS} steps`, { size: 34, color: 'yellow' }),
                        text(
                            `Plain SGD:  L = ${finalSgd.loss.toFixed(2)}  (w₁ = ${finalSgd.w1.toFixed(2)})`,
                            { font: 'mono', size: 27, color: 'red' },
                        ),
                        text(
                            `Adam:       L = ${finalAdam.loss.toFixed(3)}  (w₁ = ${finalAdam.w1.toFixed(2)})`,
                            { font: 'mono', size: 27, color: 'teal' },
                        ),
                        text('Dividing by √v̂ equalizes step size', { size: 27, color: 'ink' }),
                        text('across steep and flat directions.', { size: 27, color: 'ink' }),
                    ],
                    { gap: 22, align: 'left' },
                ),
                midInner,
                'center',
            )

            // Bottom equation + legend card.
            const adamRule = tex(
                'w_{t+1} = w_t - \\eta \\, \\frac{\\hat{m}_t}{\\sqrt{\\hat{v}_t} + \\epsilon}',
                { size: 32, color: 'teal' },
            )
            const legendRow = row(
                [
                    row([dot(9, 'red'), text('Plain SGD', { size: 26, color: 'red' })], {
                        gap: 12,
                    }),
                    row([dot(9, 'teal'), text('Adam', { size: 26, color: 'teal' })], { gap: 12 }),
                    row([dot(9, 'yellow'), text('Min (0,0)', { size: 26, color: 'yellow' })], {
                        gap: 12,
                    }),
                ],
                { gap: 36 },
            )
            const botContent = place(
                column([adamRule, legendRow], { gap: 22, align: 'center' }),
                botCardBox!,
                'center',
            )

            // ── Chapter 1: The ill-conditioned ravine ──────────────────────────
            s.chapter('A 25:1 quadratic ravine')
            s.add(
                title,
                graph,
                w1AxisLabel,
                w2AxisLabel,
                ...contourNodes,
                minDot,
                minTag,
                startDot,
                startTag,
                topBg,
                midBg,
                botBg,
                topContent,
                introContent,
                botContent,
                sgdLayer,
                adamLayer,
                sgdPanel,
                adamPanel,
            )
            s.caption(
                'On L(w1, w2) = 0.5 w1^2 + 12.5 w2^2, curvature is 25 times steeper across w2 than along the w1 valley.',
                4.5,
            )
            s.wait(3.8)

            // ── Chapter 2: Plain SGD zigzags across steep walls ────────────────
            s.chapter('Plain SGD bounces across steep walls')
            s.play(fadeOut(introContent), sgdAlpha.to(1), sgdPanelAlpha.to(1), { duration: 0.7 })
            s.caption(
                'Plain SGD uses one learning rate for every coordinate. It bounces across the steep w2 walls while creeping along w1.',
                5.5,
            )
            s.play(sgdStep.to(TOTAL_STEPS, { ease: linear }), { duration: 6.0 })
            s.wait(1.2)

            // ── Chapter 3: Adam rescales each coordinate ───────────────────────
            s.chapter('Adam rescales each coordinate')
            s.play(
                sgdPanelAlpha.to(0),
                adamPanelAlpha.to(1),
                adamAlpha.to(1),
                sgdAlpha.to(0.32),
                { duration: 0.8 },
            )
            s.caption(
                'Adam tracks the squared gradient v_t per coordinate. Dividing by sqrt(v_hat) damps steep w2 and boosts flat w1.',
                6.0,
            )
            s.play(adamStep.to(TOTAL_STEPS, { ease: smoother }), { duration: 6.2 })
            s.play(indicate(minDot, { color: 'yellow', scale: 1.6 }), { duration: 0.7 })
            s.wait(1.0)

            // ── Chapter 4: Side-by-side comparison ─────────────────────────────
            s.chapter('Equalized steps reach the minimum')
            s.play(
                adamPanelAlpha.to(0),
                sgdAlpha.to(0.9),
                seq(fadeOut([]), fadeIn(summaryContent)),
                { duration: 0.8 },
            )
            s.caption(
                'In the same 22 steps, plain SGD is still far from the minimum while Adam glides straight down the ravine to (0, 0).',
                5.0,
            )
            s.wait(4.5)
        },
    )
}
