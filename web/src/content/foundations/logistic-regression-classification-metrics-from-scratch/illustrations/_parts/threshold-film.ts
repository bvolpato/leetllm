import { assertEqual, dot, dynamic, film, line, text, type Node } from 'vizmatic/stage'
import type { ThemeMode } from 'vizmatic'

const responses = [
    { id: 'V1', p: 0.061, y: 0 },
    { id: 'V2', p: 0.169, y: 0 },
    { id: 'V3', p: 0.595, y: 1 },
    { id: 'V4', p: 0.624, y: 0 },
    { id: 'V5', p: 0.971, y: 1 },
    { id: 'V6', p: 0.325, y: 0 },
    { id: 'V7', p: 0.99, y: 1 },
    { id: 'V8', p: 0.244, y: 1 },
]
const counts = (cut: number) => {
    const tp = responses.filter((row) => row.p >= cut && row.y === 1).length
    const fp = responses.filter((row) => row.p >= cut && row.y === 0).length
    return { tp, fp, fn: 4 - tp, cost: 120 * (4 - tp) + 18 * fp }
}
const scoreX = (p: number) => -830 + 1050 * p
const laneY = (row: (typeof responses)[number]) =>
    row.id === 'V5' ? -116 : row.id === 'V7' ? -84 : row.y === 1 ? -100 : 120

export function createFilm(theme: ThemeMode = 'dark') {
    return film(
        {
            title: 'Move the threshold, keep the predictions',
            description:
                'The same eight scores show why a lower cutoff catches more positives and adds false positives.',
            look: theme === 'light' ? 'paper' : 'midnight',
            font: 'text-serif',
            fps: 30,
            aspect: '16:9',
        },
        (s) => {
            for (const [cut, cost] of [
                [0.8, 240],
                [0.5, 138],
                [0.2, 36],
            ]) {
                assertEqual(counts(cut).cost, cost)
            }
            const cut = s.value(0.8)
            const title = text('The scores stay fixed. The cutoff moves.', { size: 60 }).at(0, -430)
            const labels: Node[] = [
                text('Unsupported claims', { size: 46, color: 'green' }).at(-350, -230),
                text('Supported replies', { size: 46, color: 'blue' }).at(-350, 25),
                text('Predicted probability', { size: 42 }).at(-305, 345),
                text('At this cutoff', { size: 48 }).at(600, -240),
                text('Miss: $120 · Extra check: $18', { size: 36 }).at(0, 430),
            ]
            for (const row of responses) {
                const labelY = row.id === 'V7' ? -35 : row.y === 1 ? laneY(row) - 48 : 170
                const labelX = row.id === 'V5' ? scoreX(row.p) - 28 : scoreX(row.p)
                labels.push(
                    text(row.id, { size: 36, color: row.y === 1 ? 'green' : 'blue' }).at(
                        labelX,
                        labelY,
                    ),
                )
            }
            for (const p of [0, 0.2, 0.4, 0.6, 0.8, 1]) {
                labels.push(text(p.toFixed(1), { size: 36 }).at(scoreX(p), 290))
            }
            const geometry: Node[] = [
                ...[-100, 120, 250].map((y) =>
                    line([scoreX(0), y], [scoreX(1), y], {
                        stroke: theme === 'light' ? '#8a857b' : '#777b86',
                        width: 2,
                    }),
                ),
                ...[0, 0.2, 0.4, 0.6, 0.8, 1].map((p) =>
                    line([scoreX(p), 244], [scoreX(p), 260], {
                        stroke: theme === 'light' ? '#8a857b' : '#777b86',
                        width: 2,
                    }),
                ),
                line([330, -290], [330, 310], {
                    stroke: theme === 'light' ? '#8a857b' : '#777b86',
                    width: 1,
                }),
            ]
            const moving = dynamic(() => {
                const tally = counts(cut.value)
                return [
                    line([scoreX(cut.value), -190], [scoreX(cut.value), -10], {
                        stroke: 'orange',
                        width: 5,
                        dash: [12, 9],
                    }),
                    line([scoreX(cut.value), 65], [scoreX(cut.value), 220], {
                        stroke: 'orange',
                        width: 5,
                        dash: [12, 9],
                    }),
                    text('t = ' + cut.value.toFixed(2), { size: 44, color: 'orange' }).at(
                        scoreX(cut.value),
                        -300,
                    ),
                    ...responses.map((row) =>
                        dot(14, row.y === 1 ? 'green' : 'blue')
                            .at(scoreX(row.p), laneY(row))
                            .opacity(row.p >= cut.value ? 1 : 0.3)
                            .glow(row.p >= cut.value ? 10 : 0),
                    ),
                    text('Caught ' + tally.tp + ' of 4', { size: 48, color: 'green' }).at(
                        600,
                        -130,
                    ),
                    text('Missed ' + tally.fn, {
                        size: 48,
                        color: tally.fn ? 'orange' : 'green',
                    }).at(600, -35),
                    text('Extra checks ' + tally.fp, { size: 48, color: 'blue' }).at(600, 60),
                    text('Cost $' + tally.cost, { size: 58, color: 'orange' }).at(600, 210),
                ]
            })
            s.chapter('A high cutoff')
            s.add(title, ...geometry, ...labels, moving)
            s.caption(
                'At 0.80, only the two highest scores are selected. Both are positive, but two unsupported claims are missed.',
                5,
            )
            s.wait(5)
            s.chapter('The middle cutoff')
            s.caption(
                'Move the cutoff to 0.50. V3 is caught, and supported response V4 is selected too. Cost falls from $240 to $138.',
                9,
            )
            s.play(cut.to(0.5), { duration: 4 })
            s.wait(5)
            s.chapter('Catch the remaining positive')
            s.caption(
                'At 0.20, V8 is caught and V6 becomes an extra check. All four positives are selected. Two extra checks cost $36.',
                10,
            )
            s.play(cut.to(0.2), { duration: 4 })
            s.wait(6)
        },
    )
}
