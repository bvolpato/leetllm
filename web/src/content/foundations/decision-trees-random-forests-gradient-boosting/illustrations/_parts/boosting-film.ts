import {
    assertEqual,
    axes,
    beside,
    column,
    dot,
    draw,
    fadeIn,
    fadeOut,
    film,
    line,
    place,
    sceneArea,
    seq,
    text,
    to,
} from 'vizmatic/stage'
import data from '../../assets/figure_data.json'

export function boostingFilm(theme: string) {
    data.corrections.forEach((correction, round) =>
        correction.forEach((step, i) => {
            assertEqual(
                data.rounds[round + 1][i],
                data.rounds[round][i] + data.rate * step,
                'fitted boosting update',
            )
        }),
    )
    return film(
        {
            title: 'Boosting moves predictions one correction at a time',
            look: theme === 'light' ? 'paper' : 'midnight',
            fps: 30,
            aspect: '16:9',
            font: 'text-serif',
        },
        (s) => {
            const [plotArea, noteArea] = sceneArea({
                left: -850,
                right: 850,
                top: -295,
                bottom: 300,
            }).columns([2, 1], 85)
            const heading = place(
                text('Improve the prediction, then recompute the error', {
                    size: 55,
                }),
                sceneArea({ left: -850, right: 850, top: -485, bottom: -395 }),
            )
            const graph = place(
                axes({
                    x: [0, 6],
                    y: [0, 70],
                    width: plotArea.width - 95,
                    height: plotArea.height - 90,
                    xStep: 1,
                    yStep: 10,
                    labelSize: 27,
                    tips: false,
                }),
                plotArea,
                'center',
            )
            const xLabel = beside(
                text('Sunlight (hours per day)', { size: 29, color: 'dim' }),
                graph,
                'under',
                26,
            )
            const yLabel = beside(
                text('Growth (mm)', { size: 29, color: 'dim' }),
                graph,
                'above',
                20,
                'left',
            )
            const targets = data.sunlight.map((hours, i) =>
                dot(11, 'yellow').at(graph.world(hours, data.growth[i])),
            )
            const predictions = data.sunlight.map((hours, i) =>
                dot(11, 'blue').at(graph.world(hours, data.rounds[0][i])),
            )
            const initial = line(graph.world(0, 30), graph.world(6, 30), {
                stroke: 'blue',
                width: 2,
                dash: [8, 8],
            })
            let note = place(
                column(
                    [
                        text('Begin with the mean', {
                            size: 38,
                            color: 'blue',
                        }),
                        text('30, 30, 30 mm', { size: 43 }),
                        text('Yellow: measured growth', {
                            size: 29,
                            color: 'yellow',
                        }),
                        text('Blue: current predictions', {
                            size: 29,
                            color: 'blue',
                        }),
                    ],
                    { gap: 30 },
                ),
                noteArea,
            )
            s.add([heading, graph, xLabel, yLabel, initial, ...targets, ...predictions, note])
            s.chapter('One prediction for every plant')
            s.caption(
                'Start at the mean growth, thirty millimeters. The yellow measurements show where the current predictions miss.',
                5,
            )
            s.wait(5)
            for (let round = 0; round < 4; round++) {
                s.chapter(`Correction ${round + 1}`)
                const current = data.rounds[round],
                    next = data.rounds[round + 1],
                    correction = data.corrections[round]
                const residualLines = data.sunlight.map((hours, i) =>
                    line(graph.world(hours, current[i]), graph.world(hours, data.growth[i]), {
                        stroke: 'yellow',
                        width: 3,
                        dash: [7, 7],
                    }),
                )
                const nextNote = place(
                    column(
                        [
                            text(`Round ${round + 1}`, {
                                size: 42,
                                color: 'blue',
                            }),
                            text('Fit the remaining errors', { size: 32 }),
                            text(correction.map((v) => v.toFixed(1)).join(', '), {
                                size: 37,
                                color: 'yellow',
                            }),
                            text('Apply learning rate 0.10', { size: 30 }),
                            text(next.map((v) => v.toFixed(2)).join(', '), {
                                size: 37,
                                color: 'teal',
                            }),
                        ],
                        { gap: 27 },
                    ),
                    noteArea,
                )
                s.play(seq(fadeOut(note), fadeIn(nextNote)), { duration: 0.6 })
                note = nextNote
                s.play(...residualLines.map((stem) => draw(stem)), {
                    duration: 0.7,
                })
                s.caption(
                    round === 0
                        ? 'The fitted stump proposes corrections of minus fifteen, minus fifteen, and plus thirty. Apply one tenth of each correction.'
                        : `Round ${round + 1} fits the errors left by the current model. Each prediction moves by one tenth of its newly fitted correction.`,
                    4.5,
                )
                s.wait(1.3)
                s.play(
                    ...predictions.map((point, i) =>
                        to(point, (n) => n.at(graph.world(data.sunlight[i], next[i])).fill('teal')),
                    ),
                    { duration: 1.7 },
                )
                s.wait(1.2)
                s.play(fadeOut(residualLines), { duration: 0.3 })
            }
            s.caption(
                'The prediction starts at the mean and adds four fitted corrections. The next round would start here and measure the remaining errors again.',
                5,
            )
            s.wait(5)
        },
    )
}

export default boostingFilm('dark')
