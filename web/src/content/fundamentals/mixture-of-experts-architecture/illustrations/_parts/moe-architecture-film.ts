import {
    arrow,
    assertEqual,
    circle,
    dynamic,
    fadeIn,
    film,
    line,
    place,
    rect,
    sceneArea,
    smoother,
    text,
    type Node,
} from 'vizmatic/stage'
import type { ThemeMode } from 'vizmatic'

const LOGITS = [-0.65, -1.77, -1.35, -3.0] as const
const EXP_L = LOGITS.map((z) => Math.exp(z))
const EXP_SUM = EXP_L.reduce((a, b) => a + b, 0)
const PROBS = EXP_L.map((e) => e / EXP_SUM)
const EXACT_W1 = EXP_L[0]! / (EXP_L[0]! + EXP_L[2]!)
const EXACT_W3 = EXP_L[2]! / (EXP_L[0]! + EXP_L[2]!)
const W1 = Number(EXACT_W1.toFixed(3)) // 0.668
const W3 = Number(EXACT_W3.toFixed(3)) // 0.332

export function createFilm(theme: ThemeMode = 'dark') {
    assertEqual(Number(EXACT_W1.toFixed(3)), 0.668, 'E1 renormalized weight')
    assertEqual(Number(EXACT_W3.toFixed(3)), 0.332, 'E3 renormalized weight')
    assertEqual(Number((EXACT_W1 * 2).toFixed(3)), 1.336, 'E1 weighted output')
    assertEqual(Number((EXACT_W3 * 3).toFixed(3)), 0.995, 'E3 weighted output')
    void PROBS

    return film(
        {
            title: 'Sparse Top-2 MoE Routing and Weighted Blend',
            description:
                'Token x enters a 4-expert router, softmax probabilities select Top-2 experts E1 and E3 while E2 and E4 stay idle in VRAM, renormalized weights 0.668 and 0.332 scale their outputs into y = [1.336, 0.995, 0, 0].',
            look: theme === 'light' ? 'paper' : 'midnight',
            font: 'text-serif',
            fps: 30,
            aspect: '16:9',
        },
        (s) => {
            const titleArea = sceneArea({ left: -860, right: 860, top: -480, bottom: -395 })
            const subArea = sceneArea({ left: -860, right: 860, top: -392, bottom: -332 })
            const heading = place(
                text('Sparse Top-2 MoE Routing', { size: 52, color: 'ink' }),
                titleArea,
                'center',
            )
            const subtitle = place(
                text('All 4 experts live in VRAM; only Top-2 execute per token', {
                    size: 28,
                    color: 'dim',
                }),
                subArea,
                'center',
            )

            // Animation state values
            const barGrow = s.value(0)
            const gateSelect = s.value(0)
            const dispatchPulse = s.value(0)
            const combinePulse = s.value(0)
            const showOutput = s.value(0)

            // Column X centers (1920x1080 centered coordinate system: -960..960, -540..540)
            const tokX = -730
            const barLeft = -505
            const barMaxW = 220
            const expX = 200
            const outX = 700

            const rowYs = [-180, -45, 90, 225] as const
            const experts = [
                {
                    name: 'E1',
                    prob: Number(PROBS[0]!.toFixed(3)),
                    weight: 'w = 0.668',
                    out: '[2, 0, 0, 0]',
                    contrib: '[1.336, 0, 0, 0]',
                    active: true,
                    color: 'blue',
                },
                {
                    name: 'E2',
                    prob: 0.17,
                    weight: 'idle',
                    out: 'skipped',
                    contrib: '',
                    active: false,
                    color: 'dim',
                },
                {
                    name: 'E3',
                    prob: 0.259,
                    weight: 'w = 0.332',
                    out: '[0, 3, 0, 0]',
                    contrib: '[0, 0.995, 0, 0]',
                    active: true,
                    color: 'teal',
                },
                {
                    name: 'E4',
                    prob: 0.05,
                    weight: 'idle',
                    out: 'skipped',
                    contrib: '',
                    active: false,
                    color: 'dim',
                },
            ] as const

            // Static column headers
            const colHeaders = [
                text('Token x', { size: 28, color: 'dim' }).moveTo([tokX, -278]),
                text('Router softmax', { size: 28, color: 'dim' }).moveTo([barLeft + 140, -278]),
                text('4 resident experts', { size: 28, color: 'dim' }).moveTo([expX, -278]),
                text('Output y', { size: 28, color: 'dim' }).moveTo([outX, -278]),
            ]

            // Input token card
            const tokenBox = rect(210, 126, {
                fill: 'surface',
                stroke: 'purple',
                width: 4,
                radius: 14,
            }).at(tokX, 22)
            const tokenTitle = text('x', { size: 38, color: 'purple' }).moveTo([tokX, -8])
            const tokenVec = text('[1, 0, 0, 0]', { size: 26, color: 'ink' }).moveTo([tokX, 46])

            // Dynamic layer for router bars, experts, pulses, and output blend
            const stageLayer = dynamic(() => {
                const nodes: Node[] = []
                const g = barGrow.value
                const sel = gateSelect.value
                const disp = dispatchPulse.value
                const comb = combinePulse.value
                const outOp = showOutput.value

                // Router arrow from token to bar block
                nodes.push(
                    arrow([tokX + 114, 22], [barLeft - 74, 22], {
                        stroke: 'purple',
                        width: 4,
                        tip: 14,
                    }),
                )

                experts.forEach((e, i) => {
                    const y = rowYs[i]!
                    const dimFactor = e.active ? 1 : 1 - 0.68 * sel
                    const tone = e.active ? e.color : 'dim'

                    // Expert row label left of bar
                    nodes.push(
                        text(e.name, { size: 28, color: tone })
                            .moveTo([barLeft - 36, y])
                            .opacity(dimFactor),
                    )

                    // Bar track
                    nodes.push(
                        rect(barMaxW, 44, {
                            fill: 'surface',
                            stroke: 'dim',
                            width: 1.5,
                            radius: 8,
                        })
                            .at(barLeft + barMaxW / 2, y)
                            .opacity(0.45 * dimFactor),
                    )

                    // Animated bar fill
                    const bw = Math.max(8, barMaxW * (e.prob / 0.6) * g)
                    if (g > 0.02) {
                        nodes.push(
                            rect(bw, 44, {
                                fill: tone,
                                stroke: tone,
                                width: 2,
                                radius: 8,
                            })
                                .at(barLeft + bw / 2, y)
                                .opacity((e.active ? 0.82 : 0.45) * dimFactor),
                        )
                    }

                    // Probability / renormalized weight readout
                    if (g > 0.25) {
                        const labelTxt =
                            sel > 0.55 && e.active
                                ? `${e.prob.toFixed(3)} → ${e.weight}`
                                : e.prob.toFixed(3)
                        nodes.push(
                            text(labelTxt, { size: 24, color: e.active ? tone : 'dim' })
                                .moveTo([barLeft + barMaxW + 120, y])
                                .opacity(Math.min(1, (g - 0.25) * 2) * dimFactor),
                        )
                    }

                    // Expert box on right
                    const boxW = 244
                    const boxH = 88
                    nodes.push(
                        rect(boxW, boxH, {
                            fill: 'surface',
                            stroke: e.active && sel > 0.2 ? tone : 'dim',
                            width: e.active && sel > 0.2 ? 4 : 2,
                            radius: 12,
                        })
                            .at(expX, y)
                            .opacity(dimFactor),
                    )
                    nodes.push(
                        text(e.active ? `${e.name} (active)` : `${e.name} (stored)`, {
                            size: 26,
                            color: e.active && sel > 0.2 ? tone : 'dim',
                        })
                            .moveTo([expX, y - 16])
                            .opacity(dimFactor),
                    )
                    nodes.push(
                        text(e.out, { size: 24, color: e.active ? 'ink' : 'dim' })
                            .moveTo([expX, y + 20])
                            .opacity(dimFactor),
                    )

                    // Active dispatch & combine paths for E1 and E3
                    if (e.active && disp > 0.01) {
                        const startPt: [number, number] = [barLeft + barMaxW + 250, y]
                        const endPt: [number, number] = [expX - boxW / 2 - 12, y]
                        nodes.push(
                            arrow(startPt, endPt, {
                                stroke: tone,
                                width: 4.5,
                                tip: 14,
                            }).opacity(Math.min(1, disp * 1.6)),
                        )
                        if (disp < 0.98) {
                            const px = startPt[0] + (endPt[0] - startPt[0]) * disp
                            nodes.push(circle(11, { fill: tone, stroke: null }).at(px, y).glow(10))
                        }
                    }

                    if (e.active && comb > 0.01) {
                        const cStart: [number, number] = [expX + boxW / 2 + 12, y]
                        const cEnd: [number, number] = [outX - 155, 22]
                        nodes.push(
                            line(cStart, cEnd, {
                                stroke: tone,
                                width: 4.5,
                            }).opacity(Math.min(1, comb * 1.4)),
                        )
                        const midX = (cStart[0] + cEnd[0]) / 2 + 18
                        const midY = (cStart[1] + cEnd[1]) / 2 + (i === 0 ? -42 : 38)
                        nodes.push(
                            text(`× ${e.name === 'E1' ? W1.toFixed(3) : W3.toFixed(3)}`, {
                                size: 26,
                                color: tone,
                            })
                                .moveTo([midX, midY])
                                .opacity(Math.min(1, comb * 1.5)),
                        )
                        if (comb < 0.98) {
                            const px = cStart[0] + (cEnd[0] - cStart[0]) * comb
                            const py = cStart[1] + (cEnd[1] - cStart[1]) * comb
                            nodes.push(circle(11, { fill: tone, stroke: null }).at(px, py).glow(10))
                        }
                    }
                })

                // Weighted output node y
                if (outOp > 0.01) {
                    nodes.push(
                        rect(290, 152, {
                            fill: 'surface',
                            stroke: 'orange',
                            width: 4.5,
                            radius: 14,
                        })
                            .at(outX, 22)
                            .opacity(outOp),
                        text('y = 0.668·E1 + 0.332·E3', { size: 24, color: 'orange' })
                            .moveTo([outX, -20])
                            .opacity(outOp),
                        text('[1.336, 0.995, 0, 0]', { size: 28, color: 'ink' })
                            .moveTo([outX, 34])
                            .opacity(outOp),
                    )
                }

                return nodes
            })

            const footer = text(
                'Top-2 sparse blend runs 2 of 4 experts (50% FFN compute) while all 4 remain in VRAM',
                { size: 26, color: 'dim' },
            ).moveTo([0, 390])

            s.add(heading, subtitle, ...colHeaders, tokenBox, tokenTitle, tokenVec, stageLayer, footer)

            s.caption('Token x enters the 4-expert router and scores every expert via softmax.')
            s.play(fadeIn(heading, { duration: 0.5 }), fadeIn(subtitle, { duration: 0.5 }))
            s.play(barGrow.to(1, { duration: 1.5, ease: smoother }))
            s.wait(0.6)

            s.caption('Top-2 selects E1 (0.521) and E3 (0.259), renormalizing weights to 0.668 and 0.332.')
            s.play(gateSelect.to(1, { duration: 1.2, ease: smoother }))
            s.wait(0.7)

            s.caption('Only E1 and E3 execute; E2 and E4 remain resident in memory without running.')
            s.play(dispatchPulse.to(1, { duration: 1.4, ease: smoother }))
            s.wait(0.5)

            s.caption('Outputs blend by gate weight: 0.668·[2,0,0,0] + 0.332·[0,3,0,0] = [1.336, 0.995, 0, 0].')
            s.play(
                combinePulse.to(1, { duration: 1.4, ease: smoother }),
                showOutput.to(1, { duration: 1.0, ease: smoother }),
            )
            s.wait(1.6)
        },
    )
}


export default createFilm()
