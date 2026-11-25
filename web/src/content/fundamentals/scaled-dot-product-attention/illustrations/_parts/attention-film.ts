import {
    assertEqual,
    attentionMatrix,
    barChart,
    boxOf,
    column,
    fadeIn,
    fadeOut,
    film,
    morphMatching,
    place,
    rect,
    sceneKit,
    seq,
    tex,
    text,
} from 'vizmatic/stage'
import type { ThemeMode } from 'vizmatic'

function stableSoftmax(xs: readonly number[]): number[] {
    const m = Math.max(...xs)
    const exps = xs.map((x) => Math.exp(x - m))
    const sum = exps.reduce((a, b) => a + b, 0)
    return exps.map((e) => e / sum)
}

const TOKENS = ['The', 'cat', 'sat', 'on', 'mat'] as const
const DK = 16
const SQRT_DK = Math.sqrt(DK)

// Explicit 4-D semantic blocks tiled 4x to form exact d_k = 16 query/key vectors.
const Q_BLOCK = [
    [0.4, 0.2, 0.3, 0.1],
    [0.9, 0.6, 0.1, 0.2],
    [0.8, 0.9, 0.4, 0.2],
    [0.3, 0.5, 0.9, 0.4],
    [0.4, 0.7, 0.8, 0.9],
] as const

const K_BLOCK = [
    [0.5, 0.1, 0.2, 0.1],
    [1.0, 0.8, 0.1, 0.1],
    [0.7, 1.0, 0.3, 0.2],
    [0.2, 0.4, 0.9, 0.5],
    [0.3, 0.6, 0.9, 1.0],
] as const

const V: readonly (readonly [number, number])[] = [
    [0.2, 0.1],
    [1.8, 0.4],
    [1.2, 1.4],
    [0.4, 1.6],
    [0.8, 2.0],
]

const tile4 = (v: readonly number[]) => [...v, ...v, ...v, ...v]
const Q = Q_BLOCK.map(tile4)
const K = K_BLOCK.map(tile4)

const dot = (a: readonly number[], b: readonly number[]) =>
    a.reduce((sum, val, i) => sum + val * b[i]!, 0)

const RAW_SCORES = Q.map((q) => K.map((k) => dot(q, k)))
const SCALED_SCORES = RAW_SCORES.map((r) => r.map((v) => v / SQRT_DK))

const UNSCALED_MAT_PROBS = stableSoftmax(RAW_SCORES[4]!)
const SCALED_MAT_PROBS = stableSoftmax(SCALED_SCORES[4]!)

const CAUSAL_WEIGHTS = SCALED_SCORES.map((rowScores, i) => {
    const allowed = rowScores.slice(0, i + 1)
    const probs = stableSoftmax(allowed)
    return TOKENS.map((_, j) => (j <= i ? probs[j]! : 0))
})

const mixValues = (weights: readonly number[]): [number, number] => [
    weights.reduce((sum, w, j) => sum + w * V[j]![0], 0),
    weights.reduce((sum, w, j) => sum + w * V[j]![1], 0),
]

const SAT_OUT = mixValues(CAUSAL_WEIGHTS[2]!)
const MAT_OUT = mixValues(CAUSAL_WEIGHTS[4]!)

export function createFilm(theme: ThemeMode = 'dark') {
    assertEqual(Q[0]!.length, DK, 'query dimension d_k')
    assertEqual(Number(RAW_SCORES[4]![4]!.toFixed(2)), 8.64, 'raw mat-mat dot product')
    assertEqual(Number(SCALED_SCORES[4]![4]!.toFixed(2)), 2.16, 'scaled mat-mat logit')
    assertEqual(
        Number(CAUSAL_WEIGHTS[2]!.reduce((a, b) => a + b, 0).toFixed(4)),
        1,
        'sat causal weights sum to 1',
    )
    assertEqual(
        Number(CAUSAL_WEIGHTS[4]!.reduce((a, b) => a + b, 0).toFixed(4)),
        1,
        'mat causal weights sum to 1',
    )
    assertEqual(CAUSAL_WEIGHTS[2]![3]!, 0, 'sat future token masked')

    return film(
        {
            title: 'Scaled dot-product attention',
            description:
                'Watch raw QK dot products scale by 1/sqrt(d_k), apply the causal mask, normalize row by row, and mix value vectors.',
            look: theme === 'light' ? 'paper' : 'midnight',
            font: 'text-serif',
            fps: 30,
            aspect: '16:9',
        },
        (s) => {
            const kit = sceneKit({
                size: 34,
                heading: { size: 50, align: 'center', y: -474 },
                area: { left: -880, right: 880, top: -375, bottom: 425 },
            })
            const [leftArea, rightArea] = kit.area.columns([1.06, 1], 72)
            const [eqRegion, chartRegion, detailRegion] = rightArea!.rows([1, 2.35, 1.35], 28)

            const title = kit.heading('Scaled dot-product attention')
            s.add(title)

            // ── Left: score matrix (Chapters 1-2) and probability matrix (Chapter 3) ──
            const scoreLabel = text('Raw dot products QK^T  (d_k = 16)', {
                size: 30,
                color: 'blue',
            })
            const scoreGrid = attentionMatrix(TOKENS, TOKENS, RAW_SCORES, {
                size: 28,
                cell: 108,
                values: true,
                format: (v) => v.toFixed(1),
                domain: [0, 9],
                axes: ['queries', 'keys'],
            })
            const leftScoreBlock = column([scoreLabel, scoreGrid], { gap: 22 })
            place(leftScoreBlock, leftArea!, 'center')

            const scaledLabel = text('Scaled logits QK^T / sqrt(16)', {
                size: 30,
                color: 'teal',
            }).moveTo(boxOf(scoreLabel).point('center'))

            const maskedLabel = text('Causal mask blocks future keys', {
                size: 30,
                color: 'orange',
            }).moveTo(boxOf(scoreLabel).point('center'))

            const probLabel = text('Causal softmax weights (each row sums to 1)', {
                size: 29,
                color: 'yellow',
            }).moveTo(boxOf(scoreLabel).point('center'))

            const probGrid = attentionMatrix(TOKENS, TOKENS, CAUSAL_WEIGHTS, {
                size: 28,
                cell: 108,
                values: true,
                format: (v) => v.toFixed(2),
                domain: [0, 1],
                mask: 'causal',
                axes: ['queries', 'keys'],
            })
            probGrid.moveTo(boxOf(scoreGrid).point('center'))

            // ── Right Top: morphing equation ──
            const eq0 = place(tex('Q K^{T}', { size: 52 }), eqRegion!, 'center')
            const eq1 = place(
                tex('\\frac{Q K^{T}}{\\sqrt{d_k}}', { size: 50 }),
                eqRegion!,
                'center',
            )
            const eq2 = place(
                tex('\\mathrm{softmax}\\!\\left(\\frac{Q K^{T}}{\\sqrt{d_k}} + M\\right)', {
                    size: 42,
                }),
                eqRegion!,
                'center',
            )
            const eq3 = place(
                tex('\\mathrm{softmax}\\!\\left(\\frac{Q K^{T}}{\\sqrt{d_k}} + M\\right) V', {
                    size: 42,
                }),
                eqRegion!,
                'center',
            )
            for (const eq of [eq0, eq1, eq2, eq3]) {
                for (const g of eq.part('Q')) g.fill('blue')
                for (const g of eq.part('K')) g.fill('teal')
            }
            for (const g of eq2.part('M')) g.fill('orange')
            for (const g of eq3.part('M')) g.fill('orange')
            for (const g of eq3.part('V')) g.fill('purple')

            // ── Right Middle: live probability bar chart ──
            const barTitle0 = text('Softmax of row "mat" before scaling', {
                size: 28,
                color: 'orange',
            })
            const distChart = barChart(
                TOKENS.map((label, j) => ({ label, value: UNSCALED_MAT_PROBS[j]! })),
                {
                    width: 680,
                    height: 230,
                    max: 1,
                    ticks: [0, 0.5, 1],
                    labelSize: 26,
                    barColor: 'orange',
                    states: true,
                    format: (v) => v.toFixed(2),
                },
            )
            const chartBlock = column([barTitle0, distChart], { gap: 18 })
            place(chartBlock, chartRegion!, 'center')

            const barTitleScaled = text('Row "mat" after dividing by sqrt(16) = 4', {
                size: 28,
                color: 'teal',
            }).moveTo(boxOf(barTitle0).point('center'))

            const barTitleSat = text('Query "sat" causal attention weights', {
                size: 28,
                color: 'yellow',
            }).moveTo(boxOf(barTitle0).point('center'))

            const barTitleMat = text('Query "mat" causal attention weights', {
                size: 28,
                color: 'yellow',
            }).moveTo(boxOf(barTitle0).point('center'))

            // ── Right Bottom: explanation & exact value mixing card ──
            const cardFrame = rect(detailRegion!.width - 16, detailRegion!.height - 10, {
                fill: 'surface',
                stroke: 'dim',
                width: 2,
                radius: 14,
            }).at(detailRegion!.cx, detailRegion!.cy)

            const noteRaw = column(
                [
                    text('Large dot products push softmax near 1.0', {
                        size: 28,
                        color: 'orange',
                    }),
                    text(
                        `max logit = ${RAW_SCORES[4]![4]!.toFixed(2)},  p("mat") = ${UNSCALED_MAT_PROBS[4]!.toFixed(2)}`,
                        { font: 'mono', size: 26, color: 'ink' },
                    ),
                ],
                { gap: 16 },
            )
            place(noteRaw, detailRegion!, 'center')

            const noteScaled = column(
                [
                    text('Dividing by sqrt(16) = 4 restores smooth weights', {
                        size: 28,
                        color: 'teal',
                    }),
                    text(
                        `max logit = ${SCALED_SCORES[4]![4]!.toFixed(2)},  p("mat") = ${SCALED_MAT_PROBS[4]!.toFixed(2)}`,
                        { font: 'mono', size: 26, color: 'ink' },
                    ),
                ],
                { gap: 16 },
            )
            place(noteScaled, detailRegion!, 'center')

            const noteMask = column(
                [
                    text('Upper triangle receives -infinity before softmax', {
                        size: 28,
                        color: 'orange',
                    }),
                    text('Every token attends only to keys at or before its index', {
                        size: 26,
                        color: 'dim',
                    }),
                ],
                { gap: 16 },
            )
            place(noteMask, detailRegion!, 'center')

            const makeMixNote = (
                word: string,
                weights: readonly number[],
                out: readonly [number, number],
                activeCount: number,
            ) => {
                const terms = TOKENS.slice(0, activeCount)
                    .map((tok, j) => `${weights[j]!.toFixed(2)}(${tok})`)
                    .join(' + ')
                const block = column(
                    [
                        text(`Value mix for "${word}"  (sum of w_j * v_j)`, {
                            size: 27,
                            color: 'purple',
                        }),
                        text(terms, {
                            font: 'mono',
                            size: 22,
                            color: 'dim',
                        }),
                        text(`z("${word}") = [${out[0].toFixed(2)}, ${out[1].toFixed(2)}]`, {
                            font: 'mono',
                            size: 30,
                            color: 'yellow',
                        }),
                    ],
                    { gap: 12 },
                )
                place(block, detailRegion!, 'center')
                return block
            }

            const mixSatNodes = makeMixNote('sat', CAUSAL_WEIGHTS[2]!, SAT_OUT, 3)
            const mixMatNodes = makeMixNote('mat', CAUSAL_WEIGHTS[4]!, MAT_OUT, 5)

            // ── Chapter 1: Raw dot products & 1/sqrt(d_k) scaling ──
            s.chapter('Raw scores and 1/sqrt(d_k) scaling')
            s.add(cardFrame)
            s.play(
                fadeIn(scoreLabel),
                scoreGrid.enter(),
                fadeIn(eq0),
                fadeIn(barTitle0),
                distChart.enter(),
                fadeIn(noteRaw),
                { duration: 1.4 },
            )
            s.play(scoreGrid.light({ row: 4 }), { duration: 0.6 })
            s.caption(
                `Raw QK dot products grow with dimension d_k = 16. Row "mat" hits ${RAW_SCORES[4]![4]!.toFixed(2)}, driving its unscaled softmax to ${UNSCALED_MAT_PROBS[4]!.toFixed(2)}.`,
                4.2,
            )
            s.wait(3.2)

            // Hold unscaled outline as reference, then divide by sqrt(16) = 4
            s.play(distChart.reference(), { duration: 0.5 })
            s.play(
                morphMatching(eq0, eq1),
                seq(fadeOut(scoreLabel), fadeIn(scaledLabel)),
                seq(fadeOut(barTitle0), fadeIn(barTitleScaled)),
                seq(fadeOut(noteRaw), fadeIn(noteScaled)),
                scoreGrid.setValue({}, SCALED_SCORES, { lag: 0.02 }),
                distChart.update(SCALED_MAT_PROBS),
                { duration: 1.8 },
            )
            s.caption(
                'Dividing every score by sqrt(16) = 4 brings logits into a healthy range so softmax distributes weight smoothly.',
                4.2,
            )
            s.wait(3.2)

            // ── Chapter 2: Causal mask blocks future keys ──
            s.chapter('Causal mask')
            s.play(distChart.reference(null), { duration: 0.35 })
            s.play(
                scoreGrid.light(null),
                morphMatching(eq1, eq2),
                seq(fadeOut(scaledLabel), fadeIn(maskedLabel)),
                seq(fadeOut(noteScaled), fadeIn(noteMask)),
                scoreGrid.mark((r, c) => c > r, 'future', { lag: 0.05 }),
                { duration: 1.5 },
            )
            s.caption(
                'A causal mask hatches every future key above the diagonal, setting those logits to negative infinity before softmax.',
                4.2,
            )
            s.wait(3.0)

            // ── Chapter 3: Row-by-row softmax & value mixing ──
            s.chapter('Row softmax and value mixing')
            s.play(
                seq(fadeOut(scoreGrid), fadeIn(probGrid)),
                seq(fadeOut(maskedLabel), fadeIn(probLabel)),
                morphMatching(eq2, eq3),
                seq(fadeOut(barTitleScaled), fadeIn(barTitleSat)),
                seq(fadeOut(noteMask), fadeIn(mixSatNodes)),
                { duration: 1.2 },
            )
            s.play(
                probGrid.light({ row: 2 }),
                distChart.update(CAUSAL_WEIGHTS[2]!),
                distChart.mark([3, 4], 'masked'),
                { duration: 1.1 },
            )
            s.caption(
                'For query "sat", future keys "on" and "mat" have zero weight. Softmax splits 1.0 across The, cat, and sat to mix their values.',
                4.8,
            )
            s.wait(3.8)

            // Sweep to final query row "mat"
            s.play(
                probGrid.light({ row: 4 }),
                seq(fadeOut(barTitleSat), fadeIn(barTitleMat)),
                seq(fadeOut(mixSatNodes), fadeIn(mixMatNodes)),
                distChart.clearStates(),
                distChart.update(CAUSAL_WEIGHTS[4]!),
                { duration: 1.2 },
            )
            s.caption(
                `At the final token "mat", all five keys are visible. Its softmax weights blend all five value vectors into [${MAT_OUT[0].toFixed(2)}, ${MAT_OUT[1].toFixed(2)}].`,
                5.0,
            )
            s.wait(4.2)
        },
    )
}
