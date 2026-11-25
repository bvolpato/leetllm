import {
    assertEqual,
    column,
    dot,
    dynamic,
    fadeIn,
    fadeOut,
    film,
    indicate,
    line,
    place,
    polyline,
    rect,
    sceneKit,
    seq,
    smoother,
    tex,
    text,
    type Node,
} from 'vizmatic/stage'
import type { ThemeMode } from 'vizmatic'

const CHOSEN = [0, 0.3, -0.15, -0.6] as const
const REJECTED = [0, -0.4, -1.2, -2.1] as const
const MARGINS = CHOSEN.map((v, i) => Number((v - REJECTED[i]!).toFixed(2)))

function lerpSeries(vals: readonly number[], t: number): number {
    const clamped = Math.max(0, Math.min(vals.length - 1, t))
    const idx = Math.floor(clamped)
    const frac = clamped - idx
    const a = vals[idx]!
    const b = vals[Math.min(vals.length - 1, idx + 1)]!
    return a + (b - a) * frac
}

export function createFilm(theme: ThemeMode = 'dark') {
    assertEqual(MARGINS[0], 0, 'state 0 margin')
    assertEqual(MARGINS[1], 0.7, 'state 1 margin')
    assertEqual(MARGINS[2], 1.05, 'state 2 margin')
    assertEqual(MARGINS[3], 1.5, 'state 3 margin')

    return film(
        {
            title: 'DPO likelihood displacement: margin rises while chosen falls',
            description:
                'Across four training states, DPO widens the pairwise margin from 0.00 to 1.50 even as the chosen response log-ratio drops below its SFT reference.',
            look: theme === 'light' ? 'paper' : 'midnight',
            font: 'text-serif',
            fps: 30,
            aspect: '16:9',
        },
        (s) => {
            const kit = sceneKit({
                size: 30,
                heading: { size: 46, align: 'center' },
                area: { left: -880, right: 880, top: -375, bottom: 420 },
            })

            const [mainArea, footerArea] = kit.area.rows([3.0, 0.9], 24)
            const [leftCol, rightCol] = mainArea!.columns([1.45, 1.0], 48)
            const title = kit.heading('DPO likelihood displacement: margin climbs while chosen falls')

            // Left plot: log-ratio trajectories across states 0..3
            const pLeft = leftCol!.left + 96
            const pRight = leftCol!.right - 36
            const pTop = mainArea!.top + 102
            const pBot = mainArea!.bottom - 56
            const xAt = (st: number) => pLeft + (st / 3) * (pRight - pLeft)
            const yAt = (v: number) => pTop + ((0.5 - v) / 3.0) * (pBot - pTop)

            const leftHdr = text('Log-ratio to SFT reference  log(π_θ / π_ref)', {
                size: 28,
                color: 'ink',
            }).moveTo([(pLeft + pRight) / 2, mainArea!.top + 18])

            const refY = yAt(0)
            const axesNodes: Node[] = [
                line([pLeft, pTop], [pLeft, pBot], { stroke: 'dim', width: 2 }),
                line([pLeft, pBot], [pRight, pBot], { stroke: 'dim', width: 2 }),
                line([pLeft, refY], [pRight, refY], { stroke: 'dim', width: 2.5, dash: [10, 7] }),
                text('Ref = 0', { font: 'mono', size: 24, color: 'dim' }).moveTo([
                    pRight - 56,
                    refY - 24,
                ]),
            ]
            ;[0.5, 0, -0.5, -1.0, -1.5, -2.0].forEach((yv) => {
                const py = yAt(yv)
                axesNodes.push(
                    line([pLeft - 8, py], [pLeft, py], { stroke: 'dim', width: 2 }),
                    text(yv > 0 ? `+${yv.toFixed(1)}` : yv.toFixed(1), {
                        font: 'mono',
                        size: 24,
                        color: 'dim',
                    }).moveTo([pLeft - 48, py]),
                )
            })
            ;[0, 1, 2, 3].forEach((st) => {
                const px = xAt(st)
                axesNodes.push(
                    text(`State ${st}`, { size: 24, color: 'dim' }).moveTo([px, pBot + 32]),
                )
            })

            // Right plot: Growing pairwise margin bars (0..1.5)
            const bLeft = rightCol!.left + 44
            const bRight = rightCol!.right - 20
            const bBase = pBot
            const bTop = pTop + 28
            const barW = 86
            const barCenter = (i: number) => bLeft + 46 + i * ((bRight - bLeft - 92) / 3)
            const barH = (m: number) => (m / 1.6) * (bBase - bTop)

            const rightHdr = text('Pairwise margin  Δ = chosen − rejected', {
                size: 28,
                color: 'purple',
            }).moveTo([(bLeft + bRight) / 2, mainArea!.top + 18])

            const barBaseLine = line([bLeft, bBase], [bRight, bBase], { stroke: 'dim', width: 2 })
            const barTicks = [0, 1, 2, 3].map((st) =>
                text(`S${st}`, { font: 'mono', size: 24, color: 'dim' }).moveTo([
                    barCenter(st),
                    bBase + 32,
                ]),
            )

            // Reactive training progress stateT in [0, 3]
            const stateT = s.value(0)

            const liveViz = dynamic(() => {
                const t = stateT.value
                const nodes: Node[] = []

                // Sample partial trajectories from 0..t
                const samples = 36
                const chosenPts: [number, number][] = []
                const rejPts: [number, number][] = []
                for (let k = 0; k <= samples; k++) {
                    const u = (k / samples) * t
                    chosenPts.push([xAt(u), yAt(lerpSeries(CHOSEN, u))])
                    rejPts.push([xAt(u), yAt(lerpSeries(REJECTED, u))])
                }

                const curC = lerpSeries(CHOSEN, t)
                const curR = lerpSeries(REJECTED, t)
                const curM = curC - curR
                const cx = xAt(t)
                const cyC = yAt(curC)
                const cyR = yAt(curR)

                // Shaded gap vertical bracket at current state t
                if (curM > 0.05) {
                    nodes.push(
                        line([cx, cyC], [cx, cyR], {
                            stroke: 'purple',
                            width: 5,
                            opacity: 0.55,
                        }),
                    )
                }

                if (chosenPts.length > 1) {
                    nodes.push(
                        polyline(chosenPts, { stroke: 'green', width: 5 }),
                        polyline(rejPts, { stroke: 'red', width: 5 }),
                    )
                }

                // Landmarks reached so far
                for (let i = 0; i <= Math.floor(t + 1e-4); i++) {
                    nodes.push(
                        dot(9, 'green').at(xAt(i), yAt(CHOSEN[i]!)),
                        dot(9, 'red').at(xAt(i), yAt(REJECTED[i]!)),
                    )
                }

                // Current live heads + clean header readouts (never cross curves or axes)
                nodes.push(
                    dot(13, 'green').at(cx, cyC),
                    dot(13, 'red').at(cx, cyR),
                    text(
                        `Chosen: ${curC >= 0 ? '+' : '−'}${Math.abs(curC).toFixed(2)}`,
                        { font: 'mono', size: 24, color: 'green' },
                    ).moveTo([pLeft + 170, mainArea!.top + 60]),
                    text(
                        `Rejected: −${Math.abs(curR).toFixed(2)}`,
                        { font: 'mono', size: 24, color: 'red' },
                    ).moveTo([pLeft + 470, mainArea!.top + 60]),
                )

                // Right margin bars growing as each state is reached
                for (let i = 0; i <= 3; i++) {
                    const reach = Math.max(0, Math.min(1, t - (i - 1)))
                    const targetM = MARGINS[i]!
                    const h = i === 0 ? 4 : barH(targetM) * (i <= t ? 1 : reach)
                    if (i === 0 || t > i - 1) {
                        const bx = barCenter(i)
                        nodes.push(
                            rect(barW, Math.max(4, h), {
                                fill: 'purple',
                                stroke: 'purple',
                                width: 2,
                                radius: 6,
                                opacity: i <= Math.floor(t + 0.05) ? 0.78 : 0.45,
                            }).at(bx, bBase - Math.max(4, h) / 2),
                        )
                        if (i <= t + 0.05) {
                            nodes.push(
                                text(targetM.toFixed(2), {
                                    font: 'mono',
                                    size: 24,
                                    color: 'purple',
                                }).moveTo([bx, bBase - Math.max(4, h) - 24]),
                            )
                        }
                    }
                }

                return nodes
            })

            // Footer panel
            const footerBg = rect(footerArea!.width, footerArea!.height, {
                fill: 'surface',
                stroke: 'grid',
                width: 2,
                radius: 16,
            }).at(footerArea!.cx, footerArea!.cy)

            const foot1 = place(
                column(
                    [
                        text('State 0 → 1: Healthy early DPO step', { size: 30, color: 'green' }),
                        text('Chosen rises above reference (+0.30) while rejected drops (−0.40), margin = 0.70.', {
                            size: 25,
                            color: 'dim',
                        }),
                    ],
                    { gap: 10, align: 'center' },
                ),
                footerArea!,
                'center',
            )

            const foot2 = place(
                column(
                    [
                        text('State 1 → 3: Likelihood displacement sets in', {
                            size: 30,
                            color: 'red',
                        }),
                        text('Chosen falls below reference (−0.60), yet DPO loss keeps improving because rejected falls faster (−2.10).', {
                            size: 25,
                            color: 'ink',
                        }),
                    ],
                    { gap: 10, align: 'center' },
                ),
                footerArea!,
                'center',
            )

            const foot3 = place(
                column(
                    [
                        tex(
                            '\\Delta = \\log\\frac{\\pi_\\theta(y_w)}{\\pi_{\\text{ref}}(y_w)} - \\log\\frac{\\pi_\\theta(y_l)}{\\pi_{\\text{ref}}(y_l)} = (-0.60) - (-2.10) = +1.50',
                            { size: 28, color: 'purple' },
                        ),
                        text('Monitor log π_θ(y_w) directly alongside margin so chosen likelihood does not silently decay.', {
                            size: 24,
                            color: 'dim',
                        }),
                    ],
                    { gap: 10, align: 'center' },
                ),
                footerArea!,
                'center',
            )

            // Chapter 1: Initial healthy split (0 -> 1)
            s.chapter('Early DPO step raises chosen')
            s.add(
                title,
                leftHdr,
                rightHdr,
                ...axesNodes,
                barBaseLine,
                ...barTicks,
                liveViz,
                footerBg,
                foot1,
            )
            s.wait(0.7)
            s.play(stateT.to(1, { ease: smoother }), { duration: 1.8 })
            s.caption(
                'At state 1, chosen likelihood rises to +0.30 above the SFT reference while rejected falls to -0.40.',
                4.2,
            )
            s.wait(1.4)

            // Chapter 2: Displacement (1 -> 3)
            s.chapter('Margin climbs while chosen drops')
            s.play(seq(fadeOut(foot1), fadeIn(foot2)), { duration: 0.6 })
            s.play(stateT.to(3, { ease: smoother }), { duration: 2.8 })
            s.caption(
                'By state 3, chosen falls to -0.60 below reference, yet the pairwise margin climbs to 1.50 because rejected drops to -2.10.',
                5.4,
            )
            s.wait(1.6)

            // Chapter 3: Diagnosis takeaway
            s.chapter('Track chosen log-prob beside margin')
            s.play(
                seq(fadeOut(foot2), fadeIn(foot3)),
                indicate(rightHdr, { color: 'purple', scale: 1.06 }),
                { duration: 0.9 },
            )
            s.caption(
                'DPO optimizes only the difference. Watch chosen log-likelihood directly to catch likelihood displacement.',
                4.8,
            )
            s.wait(3.0)
        },
    )
}

export default createFilm()
