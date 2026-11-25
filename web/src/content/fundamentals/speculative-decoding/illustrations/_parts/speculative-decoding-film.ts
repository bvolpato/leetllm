import {
    arrow,
    assertEqual,
    barChart,
    beside,
    boxOf,
    column,
    connector,
    delay,
    draw,
    dynamic,
    fadeIn,
    fadeOut,
    film,
    indicate,
    namedBox,
    place,
    rect,
    row,
    sceneKit,
    seq,
    tex,
    text,
    tokens,
} from 'vizmatic/stage'
import type { ThemeMode } from 'vizmatic'

const VOCAB = ['fox', 'cat', 'dog', 'bear'] as const
const Q4 = [0.15, 0.6, 0.15, 0.1] as const
const P4 = [0.55, 0.15, 0.25, 0.05] as const

const POS_DIFF = P4.map((p, i) => Math.max(0, p - Q4[i]!))
const Z_RESIDUAL = POS_DIFF.reduce((sum, v) => sum + v, 0)
const RESIDUAL4 = POS_DIFF.map((v) => v / Z_RESIDUAL)

const DRAFTS = [
    {
        word: 'the',
        q: 0.72,
        p: 0.84,
        alpha: 1.0,
        u: null as number | null,
        accepted: true,
        rule: 'p (0.84) >= q (0.72)  ->  accept with prob 1.00',
    },
    {
        word: 'quick',
        q: 0.5,
        p: 0.65,
        alpha: 1.0,
        u: null as number | null,
        accepted: true,
        rule: 'p (0.65) >= q (0.50)  ->  accept with prob 1.00',
    },
    {
        word: 'brown',
        q: 0.6,
        p: 0.54,
        alpha: 0.9,
        u: 0.42,
        accepted: true,
        rule: 'p/q = 0.54 / 0.60 = 0.90,  draw u = 0.42 < 0.90  ->  accept',
    },
    {
        word: 'cat',
        q: 0.6,
        p: 0.15,
        alpha: 0.25,
        u: 0.78,
        accepted: false,
        rule: 'p/q = 0.15 / 0.60 = 0.25,  draw u = 0.78 > 0.25  ->  reject',
    },
] as const

export function createFilm(theme: ThemeMode = 'dark') {
    return film(
        {
            title: 'Speculative decoding: draft fast, verify in parallel',
            description:
                'Draft K tokens with a small model, score all positions in one large-model weight read, and preserve the exact target distribution via rejection sampling.',
            look: theme === 'light' ? 'paper' : 'midnight',
            font: 'text-serif',
            fps: 30,
            aspect: '16:9',
        },
        (s) => {
            // Verify mathematical invariants: normalization and exact marginal preservation.
            assertEqual(
                Number(Q4.reduce((a, b) => a + b, 0).toFixed(6)),
                1,
                'draft distribution sums to 1',
            )
            assertEqual(
                Number(P4.reduce((a, b) => a + b, 0).toFixed(6)),
                1,
                'target distribution sums to 1',
            )
            assertEqual(Number(Z_RESIDUAL.toFixed(6)), 0.5, 'residual mass equals rejection prob')
            assertEqual(Number(RESIDUAL4[0]!.toFixed(6)), 0.8, 'residual probability of fox')
            assertEqual(Number(RESIDUAL4[2]!.toFixed(6)), 0.2, 'residual probability of dog')

            const acceptMass = P4.reduce((sum, p, i) => sum + Math.min(p, Q4[i]!), 0)
            const rejectMass = 1 - acceptMass
            for (let i = 0; i < VOCAB.length; i++) {
                const marginal = Math.min(P4[i]!, Q4[i]!) + rejectMass * RESIDUAL4[i]!
                assertEqual(
                    Number(marginal.toFixed(6)),
                    P4[i]!,
                    `exact marginal match for ${VOCAB[i]}`,
                )
            }

            const kit = sceneKit({
                size: 36,
                heading: { size: 56, y: -468, align: 'center' },
                area: { left: -880, right: 880, top: -370, bottom: 420 },
            })

            // ── Chapter 1: Memory-Bandwidth Bottleneck ──────────────────────

            const h1 = kit.heading('Autoregressive decoding is memory-bandwidth bound')

            const hbmBox = namedBox('HBM Weights (70B)', {
                width: 390,
                height: 156,
                size: 38,
                color: 'orange',
                sub: '140 GB read / step',
            })
            const computeBox = namedBox('GPU Tensor Cores', {
                width: 390,
                height: 156,
                size: 38,
                color: 'blue',
                sub: 'waiting on HBM',
            })
            const outBox = namedBox('1 Output Token', {
                width: 330,
                height: 156,
                size: 38,
                color: 'teal',
                sub: '1 token / read',
            })

            const bottleneckRow = row([hbmBox, computeBox, outBox], { gap: 220 })
            place(bottleneckRow, kit.area, 'center')

            const link1 = connector(hbmBox, computeBox, {
                route: 'straight',
                color: 'orange',
                width: 4,
            })
            const link2 = connector(computeBox, outBox, {
                route: 'straight',
                color: 'teal',
                width: 4,
            })

            const bottleneckNote = text(
                '1 full weight read from HBM  ->  only 1 token emitted.',
                { size: 40, color: 'orange' },
            )
            beside(bottleneckNote, bottleneckRow, 'under', 74)

            const keyInsight = text(
                'Key question: can one batched weight read verify 4 tokens at once?',
                { size: 38, color: 'green' },
            )
            beside(keyInsight, bottleneckNote, 'under', 38)

            s.chapter('The memory-bandwidth bottleneck')
            s.add(h1, bottleneckRow, link1, link2)
            s.play(fadeIn([h1, bottleneckRow, link1, link2]), { duration: 0.9 })
            s.caption(
                'Standard decoding must stream every weight of a 70B target model from HBM just to produce a single token.',
                5.0,
            )
            s.play(
                link1.send(kit.chip('140 GB', { color: 'orange', anchor: 'center' }), {
                    duration: 1.5,
                }),
            )
            s.play(
                link2.send(kit.chip('"the"', { color: 'teal', anchor: 'center' }), {
                    duration: 1.0,
                }),
                fadeIn(bottleneckNote),
            )
            s.wait(1.0)
            s.play(fadeIn(keyInsight), { duration: 0.7 })
            s.caption(
                'Because GPU compute sits underutilized during that memory read, scoring several tokens in parallel costs nearly the same time.',
                5.0,
            )
            s.wait(3.0)

            // ── Main Stage for Chapters 2, 3, and 4 ─────────────────────────

            const h2 = kit.heading('Step 1: Tiny draft model proposes K = 4 tokens')
            const h3 = kit.heading('Step 2: One target forward pass scores all positions')
            const h4 = kit.heading('Step 3: Exact rejection sampling and residual rescue')

            const [stripBand, workBand] = kit.area.rows([0.95, 1.45], 36)

            const strip = tokens(
                [{ text: 'See', state: 'prefix', values: { 'q(x)': 'prefix', 'p(x)': 'prefix' } }],
                {
                    width: 1580,
                    size: 40,
                    rowSize: 30,
                    minWidth: 196,
                    even: true,
                    label: 'tokens',
                    rows: {
                        'q(x)': ['prefix'],
                        'p(x)': ['prefix'],
                    },
                    states: {
                        prefix: { color: 'dim', fill: 0.14 },
                        draft: { color: 'blue', fill: 0.2 },
                        accepted: { color: 'green', fill: 0.22, mark: 'check' },
                        rejected: { color: 'red', fill: 0.18, dash: true, mark: 'cross' },
                        corrected: { color: 'yellow', fill: 0.24, mark: 'bar' },
                    },
                },
            )
            place(strip, stripBand!, 'center')

            // Chapter 2 & 3 model boxes in workBand
            const draftModelBox = namedBox('Draft Model (1B)', {
                width: 470,
                height: 152,
                size: 38,
                color: 'blue',
                sub: 'fast guesses q(x)',
            })
            const targetModelBox = namedBox('Target Model (70B)', {
                width: 510,
                height: 152,
                size: 38,
                color: 'purple',
                sub: '1 weight read -> all p(x)',
            })
            const modelsRow = row([draftModelBox, targetModelBox], { gap: 130 })
            place(modelsRow, workBand!, 'top')

            const draftNote = text(
                'Draft runs K = 4 cheap steps and records each proposal probability q(x).',
                { size: 34, color: 'blue' },
            )
            beside(draftNote, modelsRow, 'under', 58)

            const verifyNote = text(
                'Target scores all 4 draft tokens + next position in ONE parallel pass.',
                { size: 34, color: 'purple' },
            )
            beside(verifyNote, modelsRow, 'under', 58)

            // Transition Ch1 -> Ch2
            s.chapter('Draft K = 4 candidate tokens')
            s.play(
                fadeOut([h1, bottleneckRow, link1, link2, bottleneckNote, keyInsight], {
                    duration: 0.2,
                }),
                delay(fadeIn([h2, draftModelBox, draftNote], { duration: 0.45 }), 0.22),
                delay(strip.enter({ duration: 0.6 }), 0.22),
            )
            s.caption(
                'A small draft model rapidly proposes K = 4 candidate tokens and stores its probability q(x) for each.',
                5.0,
            )

            const draftOrigin = boxOf(draftModelBox).point('top')
            for (const item of DRAFTS) {
                s.play(
                    indicate(draftModelBox, { color: 'blue', scale: 1.04 }),
                    strip.append(
                        {
                            text: item.word,
                            state: 'draft',
                            values: { 'q(x)': item.q.toFixed(2), 'p(x)': '' },
                        },
                        { from: draftOrigin },
                    ),
                    { duration: 0.95 },
                )
            }
            s.wait(1.4)

            // ── Chapter 3: Single Parallel Target Pass ──────────────────────

            s.chapter('One batched target forward pass')
            s.play(
                seq(fadeOut(h2), fadeIn(h3)),
                seq(fadeOut(draftNote), fadeIn(verifyNote)),
                fadeIn(targetModelBox),
                { duration: 0.9 },
            )
            s.caption(
                'Now the 70B target model reads its weights ONCE and computes p(x) for all four draft positions in parallel.',
                5.5,
            )

            // Arrows from target model up to the 4 draft token columns
            const targetTop = boxOf(targetModelBox).point('top')
            const parallelArrows = [1, 2, 3, 4].map((idx) => {
                const pt = strip.toWorld(...strip.p(idx, 'bottom'))
                return arrow(targetTop, [pt[0], pt[1] + 10], {
                    stroke: 'purple',
                    width: 3.5,
                    tip: 12,
                })
            })

            s.play(
                strip.span('batch', 0, 4, {
                    label: '1 parallel target pass (5 positions)',
                    color: 'purple',
                }),
                indicate(targetModelBox, { color: 'purple', scale: 1.05 }),
                ...parallelArrows.map((a) => draw(a)),
                { duration: 1.4 },
            )

            s.play(
                ...DRAFTS.map((item, idx) =>
                    strip.setValue('p(x)', idx + 1, item.p.toFixed(2)),
                ),
                { duration: 1.0 },
            )
            s.wait(2.4)

            // ── Chapter 4: Exact Rejection Sampling + Residual Rescue ───────

            s.chapter('Exact rejection sampling verification')
            s.play(
                seq(fadeOut(h3), fadeIn(h4)),
                fadeOut([draftModelBox, targetModelBox, verifyNote, ...parallelArrows]),
                strip.span('batch', null),
                { duration: 0.8 },
            )

            // Split workBand into left (distribution barChart) and right (math + decision readout)
            const [chartRegion, mathRegion] = workBand!.columns([1.2, 1], 64)

            // Live step-by-step verification card centered during positions 1..3, then replaced by residual panel
            const checkStep = s.value(0)
            const checkCardVis = s.value(0)

            const checkCard = dynamic(() => {
                const alpha = checkCardVis.value
                if (alpha <= 0.01) return []
                const idx = Math.max(0, Math.min(DRAFTS.length - 1, Math.round(checkStep.value)))
                const item = DRAFTS[idx]!
                const tone = item.accepted ? 'green' : 'red'
                const verdict = item.accepted ? 'ACCEPTED' : 'REJECTED'
                const cx = workBand!.cx
                const cy = workBand!.cy - 18

                return [
                    rect(1280, 224, { fill: 'surface', stroke: tone, width: 3, radius: 16 })
                        .at(cx, cy)
                        .opacity(alpha),
                    text(`Position ${idx + 1}: "${item.word}"   [${verdict}]`, {
                        size: 40,
                        color: tone,
                    })
                        .moveTo([cx, cy - 58])
                        .opacity(alpha),
                    text(item.rule, { size: 32, color: 'ink', font: 'mono' })
                        .moveTo([cx, cy + 8])
                        .opacity(alpha),
                    text(
                        item.accepted
                            ? 'Keep draft token and advance to the next position.'
                            : 'Discard "cat" and sample the replacement from the residual distribution.',
                        { size: 30, color: 'dim' },
                    )
                        .moveTo([cx, cy + 68])
                        .opacity(alpha),
                ]
            })

            s.add(checkCard)
            s.play(checkCardVis.to(1), strip.window(1, 1, { color: 'green' }), { duration: 0.5 })

            // Position 1: "the" (p >= q -> accept)
            s.caption(
                'Position 1 ("the"): target p = 0.84 exceeds draft q = 0.72, so acceptance probability is 1.00. Accepted.',
                4.2,
            )
            s.play(strip.mark(1, 'accepted'), { duration: 0.9 })
            s.wait(2.2)

            // Position 2: "quick" (p >= q -> accept)
            checkStep.set(1)
            s.play(strip.window(2, 2, { color: 'green' }), { duration: 0.6 })
            s.caption(
                'Position 2 ("quick"): target p = 0.65 exceeds draft q = 0.50. Accepted immediately.',
                3.6,
            )
            s.play(strip.mark(2, 'accepted'), { duration: 0.9 })
            s.wait(1.8)

            // Position 3: "brown" (p < q -> accept with prob p/q = 0.90)
            checkStep.set(2)
            s.play(strip.window(3, 3, { color: 'green' }), { duration: 0.6 })
            s.caption(
                'Position 3 ("brown"): p = 0.54 is below q = 0.60, so we accept with probability p/q = 0.90. Draw u = 0.42 passes.',
                4.8,
            )
            s.play(strip.mark(3, 'accepted'), { duration: 0.9 })
            s.wait(2.6)

            // Position 4: "cat" (p < q -> reject with u = 0.78 > 0.25)
            checkStep.set(3)
            s.play(strip.window(4, 4, { color: 'red' }), { duration: 0.6 })
            s.caption(
                'Position 4 ("cat"): p/q is only 0.25. Draw u = 0.78 exceeds 0.25, so "cat" is rejected.',
                4.5,
            )
            s.play(strip.mark(4, 'rejected'), { duration: 1.0 })
            s.wait(2.4)

            // ── Residual Rescue & Exact Distribution Payoff ─────────────────

            s.chapter('Residual rescue and exact distribution')
            s.play(checkCardVis.to(0), { duration: 0.5 })

            const distChart = barChart(
                VOCAB.map((label, i) => ({ label, value: P4[i]! })),
                {
                    width: 720,
                    height: 255,
                    max: 1,
                    ticks: [0, 0.5, 1],
                    labelSize: 30,
                    barColor: 'teal',
                    reference: Q4,
                    referenceColor: 'orange',
                    states: true,
                    format: (v) => v.toFixed(2),
                },
            )
            const chartTitle = text('Position 4: target p(x) bars vs draft q(x) outline', {
                size: 30,
                color: 'dim',
            })
            const chartTitleAfter = text('Residual p\'(x) = norm(max(0, p(x) - q(x)))', {
                size: 30,
                color: 'yellow',
            })
            const chartBlock = column([chartTitle, distChart], { gap: 18 })
            place(chartBlock, chartRegion!, 'center')
            chartTitleAfter.moveTo(boxOf(chartTitle).point('center'))

            const residualFormula = tex(
                "p'(x) = \\mathrm{norm}\\!\\left(\\max(0,\\, p(x) - q(x))\\right)",
                { size: 42, color: 'yellow' },
            )
            const rescueNote = text('Excess draft mass on "cat" clips to 0.', {
                size: 30,
                color: 'ink',
            })
            const sampleNote = text('Sample "fox" (0.80) from residual p\'(x).', {
                size: 32,
                color: 'yellow',
            })
            const payoffLine = text('4 verified tokens in ~1 target pass', {
                size: 38,
                color: 'green',
            })
            const exactFormula = tex('\\Pr(\\text{output} = x) = p(x)\\;\\text{exactly}', {
                size: 40,
                color: 'green',
            })

            const rightStack = column(
                [residualFormula, rescueNote, sampleNote, payoffLine, exactFormula],
                { gap: 26 },
            )
            place(rightStack, mathRegion!, 'center')

            s.add(chartTitle, distChart, residualFormula, rescueNote)
            s.play(
                fadeIn([chartTitle, residualFormula, rescueNote]),
                distChart.enter(),
                { duration: 1.2 },
            )
            s.caption(
                'Instead of wasting the target forward pass, we subtract draft q(x) from target p(x), clip negatives to zero, and renormalize.',
                5.5,
            )
            s.wait(1.6)

            s.play(
                seq(fadeOut(chartTitle), fadeIn(chartTitleAfter)),
                distChart.reference(null),
                distChart.update(RESIDUAL4),
                { duration: 1.6 },
            )
            s.play(
                distChart.mark('fox', 'chosen'),
                fadeIn(sampleNote),
                { duration: 1.0 },
            )

            const foxSource = distChart.toWorld(...distChart.p('fox'))
            s.play(
                strip.window(null),
                strip.append(
                    {
                        text: 'fox',
                        state: 'corrected',
                        values: { 'q(x)': 'res', 'p(x)': '0.80' },
                    },
                    { from: foxSource },
                ),
                { duration: 1.2 },
            )
            s.caption(
                'The target model samples "fox" from the residual distribution, yielding 4 verified tokens ("the quick brown fox") in one target pass.',
                5.5,
            )

            s.play(
                strip.span('committed', 1, 5, {
                    label: '3 accepted + 1 residual = 4 verified tokens',
                    color: 'green',
                }),
                fadeIn([payoffLine, exactFormula]),
                { duration: 1.2 },
            )
            s.caption(
                'Rejection sampling cancels every draft bias: the output distribution matches sampling from the 70B target model alone.',
                5.5,
            )
            s.wait(4.5)
        },
    )
}

export default createFilm()
