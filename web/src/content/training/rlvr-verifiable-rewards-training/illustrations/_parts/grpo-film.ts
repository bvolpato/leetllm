import {
    arrow,
    assertEqual,
    beside,
    boxOf,
    column,
    draw,
    dynamic,
    fadeIn,
    fadeOut,
    film,
    indicate,
    lagged,
    line,
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
} from 'vizmatic/stage'
import type { ThemeMode } from 'vizmatic'

interface Rollout {
    id: string
    answer: string
    reward: number
    advantage: number
}

const ROLLOUTS: readonly Rollout[] = [
    { id: 'o₁', answer: '168', reward: 1, advantage: 1.0 },
    { id: 'o₂', answer: '148', reward: 0, advantage: -1.0 },
    { id: 'o₃', answer: '168', reward: 1, advantage: 1.0 },
    { id: 'o₄', answer: '156', reward: 0, advantage: -1.0 },
]

function computeGroupStats(items: readonly Rollout[]) {
    const mean = items.reduce((acc, r) => acc + r.reward, 0) / items.length
    const variance = items.reduce((acc, r) => acc + (r.reward - mean) ** 2, 0) / items.length
    const std = Math.sqrt(variance)
    const advantages = items.map((r) => (r.reward - mean) / std)
    return { mean, std, advantages }
}

export function createFilm(theme: ThemeMode = 'dark') {
    const stats = computeGroupStats(ROLLOUTS)
    assertEqual(stats.mean, 0.5, 'group mean reward')
    assertEqual(stats.std, 0.5, 'group std deviation')
    stats.advantages.forEach((adv, i) =>
        assertEqual(adv, ROLLOUTS[i]!.advantage, `advantage for rollout ${i + 1}`),
    )

    return film(
        {
            title: 'GRPO: group-relative advantages without a critic',
            description:
                'Sample a group of rollouts for one prompt, verify answers deterministically, center rewards by group mean and std, and update the policy with a KL anchor.',
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

            const [mainArea, footerArea] = kit.area.rows([2.95, 0.9], 24)
            const [promptCol, rolloutCol, chartCol] = mainArea!.columns([0.84, 1.32, 1.56], 36)

            const title = kit.heading('GRPO: group-relative advantages without a critic')

            // ── Column 1: Prompt q ────────────────────────────────────────────
            const promptCard = rect(promptCol!.width - 12, 236, {
                fill: 'surface',
                stroke: 'blue',
                width: 3.5,
                radius: 16,
            }).at(promptCol!.cx, mainArea!.cy - 20)

            const promptContent = place(
                column(
                    [
                        text('Prompt q', { size: 28, color: 'blue' }),
                        text('14 × 12 = ?', { size: 42, color: 'ink' }),
                        text('Ground truth: 168', { size: 26, color: 'teal' }),
                    ],
                    { gap: 22, align: 'center' },
                ),
                boxOf(promptCard),
                'center',
            )

            const sampleChip = beside(
                kit.chip('Sample G = 4 rollouts', { color: 'blue', stroke: 'blue', size: 26 }),
                promptCard,
                'under',
                22,
            )

            // Helper to align a node horizontally while keeping exact y center.
            const alignAt = (node: Node, x: number, y: number, side: 'left' | 'right'): Node =>
                node.moveTo([0, y]).alignTo([x, 0], side)

            // ── Column 2: 4 Parallel Rollouts & Deterministic Verifier ────────
            const rolloutHeader = text('Rollouts & Verifier', { size: 30, color: 'dim' }).moveTo([
                rolloutCol!.cx,
                mainArea!.top + 24,
            ])

            const rowTop = mainArea!.top + 76
            const rowStep = 128
            const rowYs = ROLLOUTS.map((_, i) => rowTop + 46 + i * rowStep)

            const rolloutCardW = rolloutCol!.width - 12
            const rolloutCardH = 96

            const fanArrows = rowYs.map((y) =>
                arrow(
                    [promptCol!.right - 4, mainArea!.cy - 20],
                    [rolloutCol!.left + 4, y],
                    { stroke: 'dim', width: 2.5, tip: 14 },
                ),
            )

            const rolloutCards = ROLLOUTS.map((r, i) => {
                const y = rowYs[i]!
                const card = rect(rolloutCardW, rolloutCardH, {
                    fill: 'surface',
                    stroke: 'grid',
                    width: 2.5,
                    radius: 12,
                }).at(rolloutCol!.cx, y)
                const answerTxt = alignAt(
                    text(`${r.id}:  ans = ${r.answer}`, {
                        font: 'mono',
                        size: 30,
                        color: 'ink',
                    }),
                    rolloutCol!.left + 28,
                    y,
                    'left',
                )

                const pass = r.reward === 1
                const badgeColor = pass ? 'green' : 'red'
                const badgeCx = rolloutCol!.right - 108
                const badge = rect(170, 52, {
                    fill: badgeColor,
                    stroke: badgeColor,
                    width: 2,
                    radius: 10,
                    opacity: 0.18,
                }).at(badgeCx, y)
                const badgeEdge = rect(170, 52, {
                    fill: null,
                    stroke: badgeColor,
                    width: 2.5,
                    radius: 10,
                }).at(badgeCx, y)

                // Crisp vector check or cross icon inside left side of badge.
                const ix = badgeCx - 54
                const iconNodes: Node[] = pass
                    ? [
                          polyline(
                              [
                                  [ix - 10, y + 1],
                                  [ix - 2, y + 9],
                                  [ix + 11, y - 9],
                              ],
                              { stroke: 'green', width: 3.5 },
                          ),
                      ]
                    : [
                          line([ix - 8, y - 8], [ix + 8, y + 8], { stroke: 'red', width: 3.5 }),
                          line([ix - 8, y + 8], [ix + 8, y - 8], { stroke: 'red', width: 3.5 }),
                      ]

                const badgeTxt = text(pass ? 'r = 1' : 'r = 0', {
                    font: 'mono',
                    size: 26,
                    color: badgeColor,
                }).moveTo([badgeCx + 18, y])

                return { card, answerTxt, badge, badgeEdge, iconNodes, badgeTxt, pass }
            })

            // ── Column 3: Dynamic Reward -> Advantage -> Policy Update Chart ──
            const chartHeader1 = text('Verifiable rewards', {
                size: 30,
                color: 'ink',
            }).moveTo([chartCol!.cx, mainArea!.top + 24])
            const chartHeader2 = tex('A_i = (r_i - \\mu) / \\sigma', {
                size: 32,
                color: 'teal',
            }).moveTo([chartCol!.cx, mainArea!.top + 24])
            const chartHeader3 = text('Policy log-prob pushes', {
                size: 30,
                color: 'green',
            }).moveTo([chartCol!.cx, mainArea!.top + 24])

            const chartAlpha = s.value(0)
            const meanLineAlpha = s.value(0)
            const normT = s.value(0)
            const pushAlpha = s.value(0)

            const chartLeft = chartCol!.left + 96
            const chartRight = chartCol!.right - 130
            const chartMid = (chartLeft + chartRight) / 2
            const chartHalf = (chartRight - chartLeft) / 2
            const axisTop = rowYs[0]! - 54
            const axisBot = rowYs[rowYs.length - 1]! + 54

            const dynamicChart = dynamic(() => {
                const a = chartAlpha.value
                if (a <= 0.01) return []
                const t = normT.value
                const nodes: Node[] = []

                // Zero reference axis smoothly slides from chartLeft (raw reward 0) to chartMid (centered 0.0).
                const zeroX = chartLeft + (chartMid - chartLeft) * t
                nodes.push(
                    line([zeroX, axisTop], [zeroX, axisBot], {
                        stroke: 'ink',
                        width: 2.5,
                        opacity: a * 0.75,
                    }),
                )

                // Axis scale tick labels at bottom of chart.
                if (t < 0.5) {
                    const fade = a * (1 - t * 2)
                    nodes.push(
                        text('0.0', { font: 'mono', size: 26, color: 'dim' })
                            .moveTo([chartLeft, axisBot + 26])
                            .opacity(fade),
                        text('0.5', { font: 'mono', size: 26, color: 'dim' })
                            .moveTo([chartMid, axisBot + 26])
                            .opacity(fade),
                        text('1.0', { font: 'mono', size: 26, color: 'dim' })
                            .moveTo([chartRight, axisBot + 26])
                            .opacity(fade),
                    )
                } else {
                    const fade = a * ((t - 0.5) * 2)
                    nodes.push(
                        text('−1.0', { font: 'mono', size: 26, color: 'red' })
                            .moveTo([chartMid - chartHalf, axisBot + 26])
                            .opacity(fade),
                        text('0.0', { font: 'mono', size: 26, color: 'dim' })
                            .moveTo([chartMid, axisBot + 26])
                            .opacity(fade),
                        text('+1.0', { font: 'mono', size: 26, color: 'green' })
                            .moveTo([chartMid + chartHalf, axisBot + 26])
                            .opacity(fade),
                    )
                }

                // Dashed group-mean line μ = 0.50 during Chapter 2 transition.
                const ma = meanLineAlpha.value
                if (ma > 0.01) {
                    nodes.push(
                        line([chartMid, axisTop], [chartMid, axisBot], {
                            stroke: 'yellow',
                            width: 3,
                            dash: [10, 8],
                            opacity: ma,
                        }),
                        text('μ = 0.50', { font: 'mono', size: 26, color: 'yellow' })
                            .moveTo([chartMid, axisTop - 20])
                            .opacity(ma),
                    )
                }

                // Bars for each rollout.
                const barH = 44
                ROLLOUTS.forEach((r, i) => {
                    const y = rowYs[i]!
                    const pass = r.reward === 1
                    const color = pass ? 'green' : 'red'

                    // At t = 0: r=1 spans [chartLeft, chartRight]; r=0 is tiny stub [chartLeft, chartLeft + 10].
                    // At t = 1: A=+1 spans [chartMid, chartRight]; A=-1 spans [chartLeft, chartMid].
                    const startX0 = chartLeft
                    const endX0 = pass ? chartRight : chartLeft + 12
                    const startX1 = pass ? chartMid : chartMid - chartHalf
                    const endX1 = pass ? chartMid + chartHalf : chartMid

                    const x0 = startX0 + (startX1 - startX0) * t
                    const x1 = endX0 + (endX1 - endX0) * t
                    const w = Math.max(10, x1 - x0)

                    nodes.push(
                        rect(w, barH, {
                            fill: color,
                            stroke: null,
                            radius: 8,
                            opacity: a * (pass ? 0.85 : 0.35 + 0.5 * t),
                        }).at((x0 + x1) / 2, y),
                    )

                    // Numeric readout beside bar.
                    const curVal = r.reward + (r.advantage - r.reward) * t
                    const labelStr =
                        t < 0.35
                            ? r.reward.toFixed(1)
                            : curVal >= 0
                              ? `+${curVal.toFixed(1)}`
                              : `−${Math.abs(curVal).toFixed(1)}`

                    if (pass) {
                        nodes.push(
                            alignAt(
                                text(labelStr, { font: 'mono', size: 28, color }),
                                x1 + 16,
                                y,
                                'left',
                            ).opacity(a),
                        )
                    } else {
                        const lx = t < 0.35 ? x1 + 16 : x0 - 16
                        const alignSide = t < 0.35 ? 'left' : 'right'
                        nodes.push(
                            alignAt(
                                text(labelStr, { font: 'mono', size: 28, color }),
                                lx,
                                y,
                                alignSide,
                            ).opacity(a),
                        )
                    }

                    // Chapter 3 directional policy update arrow + log-prob indicator.
                    const pa = pushAlpha.value
                    if (pa > 0.01) {
                        const arrowX = chartRight + 108
                        if (pass) {
                            nodes.push(
                                arrow([arrowX, y + 22], [arrowX, y - 24], {
                                    stroke: 'green',
                                    width: 4.5,
                                    tip: 14,
                                    opacity: pa,
                                }),
                            )
                        } else {
                            nodes.push(
                                arrow([arrowX, y - 22], [arrowX, y + 24], {
                                    stroke: 'red',
                                    width: 4.5,
                                    tip: 14,
                                    opacity: pa,
                                }),
                            )
                        }
                    }
                })

                return nodes
            })

            // ── Footer Strip (transitions across chapters) ────────────────────
            const footerBg = rect(footerArea!.width, footerArea!.height, {
                fill: 'surface',
                stroke: 'grid',
                width: 2,
                radius: 16,
            }).at(footerArea!.cx, footerArea!.cy)

            const footer1 = place(
                column(
                    [
                        text('Step 1: Deterministic verifier scores each rollout', {
                            size: 32,
                            color: 'blue',
                        }),
                        text('Exact match against 168 assigns binary rewards r = [1, 0, 1, 0].', {
                            size: 28,
                            color: 'dim',
                        }),
                    ],
                    { gap: 16, align: 'center' },
                ),
                footerArea!,
                'center',
            )

            const footer2 = place(
                column(
                    [
                        row(
                            [
                                text('μ = 0.50', { font: 'mono', size: 32, color: 'yellow' }),
                                text('σ = 0.50', { font: 'mono', size: 32, color: 'teal' }),
                                kit.chip('NO VALUE CRITIC NEEDED', {
                                    color: 'teal',
                                    stroke: 'teal',
                                    size: 26,
                                }),
                            ],
                            { gap: 40 },
                        ),
                        text('Group normalization centers rewards into [+1.0, −1.0, +1.0, −1.0].', {
                            size: 28,
                            color: 'ink',
                        }),
                    ],
                    { gap: 18, align: 'center' },
                ),
                footerArea!,
                'center',
            )

            const [objLeft, objRight] = footerArea!.inset(12).columns([1.65, 1], 32)
            const grpoEq = place(
                tex(
                    '\\nabla J_{\\text{GRPO}} \\propto \\frac{1}{G}\\sum_{i=1}^{G} A_i \\nabla \\log \\pi_\\theta(o_i \\mid q) - \\beta\\,\\nabla D_{\\text{KL}}(\\pi_\\theta \\|\\, \\pi_{\\text{ref}})',
                    { size: 34, color: 'ink' },
                ),
                objLeft!,
                'center',
            )
            const klCard = place(
                column(
                    [
                        kit.chip('KL ANCHOR TO REFERENCE', {
                            color: 'blue',
                            stroke: 'blue',
                            size: 26,
                        }),
                        text('Reinforce A > 0, suppress A < 0,', { size: 26, color: 'ink' }),
                        text('and anchor the policy near reference.', { size: 26, color: 'dim' }),
                    ],
                    { gap: 8, align: 'center' },
                ),
                objRight!,
                'center',
            )

            // ── Chapter 1: Verifiable rewards ─────────────────────────────────
            s.chapter('Verifiable rewards on a group of rollouts')
            s.add(
                title,
                promptCard,
                promptContent,
                sampleChip,
                rolloutHeader,
                chartHeader1,
                footerBg,
                footer1,
                dynamicChart,
            )
            s.play(
                lagged(
                    fanArrows.map((a) => draw(a)),
                    { lag: 0.12 },
                ),
                lagged(
                    rolloutCards.map((rc) => fadeIn([rc.card, rc.answerTxt])),
                    { lag: 0.12 },
                ),
                { duration: 1.5 },
            )
            s.caption(
                'For one math prompt, GRPO samples a group of four rollouts in parallel from the current policy.',
                4.2,
            )
            s.wait(1.6)

            // Verify each rollout deterministically and show raw reward bars.
            s.play(
                lagged(
                    rolloutCards.map((rc) =>
                        seq(
                            fadeIn([rc.badge, rc.badgeEdge, ...rc.iconNodes, rc.badgeTxt], {
                                duration: 0.3,
                            }),
                            indicate([rc.badgeEdge, rc.badgeTxt], {
                                color: rc.pass ? 'green' : 'red',
                                scale: 1.1,
                                duration: 0.35,
                            }),
                        ),
                    ),
                    { lag: 0.3 },
                ),
                chartAlpha.to(1, { duration: 1.0 }),
            )
            s.caption(
                'A deterministic verifier checks each answer against 168, producing binary rewards [1, 0, 1, 0].',
                4.4,
            )
            s.wait(2.4)

            // ── Chapter 2: Group-relative normalization ───────────────────────
            s.chapter('Group-relative normalization')
            s.play(
                meanLineAlpha.to(1),
                seq(fadeOut([chartHeader1, footer1]), fadeIn([chartHeader2, footer2])),
                { duration: 0.9 },
            )
            s.caption(
                'GRPO computes the group mean mu = 0.50 and standard deviation sigma = 0.50 with no separate value critic model.',
                4.8,
            )
            s.wait(1.8)

            // Smoothly morph raw [0, 1] bars into centered bipolar [-1, +1] advantages!
            s.play(normT.to(1, { ease: smoother }), meanLineAlpha.to(0), { duration: 2.2 })
            s.caption(
                'Subtracting the group mean and dividing by sigma centers the rewards into bipolar advantages: +1.0 for passes and -1.0 for fails.',
                5.2,
            )
            s.wait(2.8)

            // ── Chapter 3: Policy update with KL anchor ───────────────────────
            s.chapter('Policy update with KL anchor')
            s.play(
                seq(fadeOut([chartHeader2, footer2]), fadeIn([chartHeader3, grpoEq, klCard])),
                pushAlpha.to(1),
                { duration: 1.1 },
            )
            s.caption(
                'Positive advantages push up token log-probabilities, negative advantages push them down, and the KL term keeps the policy anchored near pi_ref.',
                6.0,
            )
            s.play(
                indicate(
                    [rolloutCards[0]!.card, rolloutCards[2]!.card],
                    { color: 'green', scale: 1.03 },
                ),
                { duration: 0.9 },
            )
            s.play(
                indicate(
                    [rolloutCards[1]!.card, rolloutCards[3]!.card],
                    { color: 'red', scale: 1.03 },
                ),
                { duration: 0.9 },
            )
            s.wait(3.8)
        },
    )
}
