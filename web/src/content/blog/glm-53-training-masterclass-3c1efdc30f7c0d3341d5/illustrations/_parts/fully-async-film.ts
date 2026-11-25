import {
    assertEqual,
    column,
    dynamic,
    fadeIn,
    film,
    lanes,
    place,
    rect,
    sceneKit,
    text,
    type Node,
} from 'vizmatic/stage'
import type { ThemeMode } from 'vizmatic'

export function createFilm(theme: ThemeMode = 'dark') {
    const maxLag = 2
    assertEqual(130 - 130, 0, 'v130 at L130 lag')
    assertEqual(131 - 130, 1, 'v130 at L131 lag')
    assertEqual(132 - 130, maxLag, 'v130 at L132 lag')
    assertEqual(132 - 129, 3, 'v129 at L132 exceeds limit')

    return film(
        {
            title: 'Fully asynchronous RL overlap and staleness lag',
            description:
                'Watch 48 rollout workers overlap generation with 64 learner GPUs, track version lag against the two-step target, and pause for a weight refresh to v132.',
            look: theme === 'light' ? 'paper' : 'midnight',
            font: 'text-serif',
            fps: 30,
            aspect: '16:9',
        },
        (s) => {
            const kit = sceneKit({
                size: 40,
                heading: { size: 58, align: 'center' },
                area: { top: -350, bottom: 340 },
            })
            const title = kit.heading('Async RL overlap and staleness target S ≤ 2')

            const trace = lanes(
                ['48 Rollouts', 'Sample Queue', '64 Learners', 'Weight Sync'],
                [
                    {
                        lane: '48 Rollouts',
                        start: 0,
                        end: 60,
                        label: 'v130 trajectories',
                        color: 'green',
                    },
                    {
                        lane: '48 Rollouts',
                        start: 78,
                        end: 100,
                        label: 'v132',
                        color: 'green',
                    },
                    {
                        lane: 'Sample Queue',
                        start: 8,
                        end: 60,
                        label: 'Batches (B = 32)',
                        color: 'purple',
                    },
                    {
                        lane: '64 Learners',
                        start: 10,
                        end: 26,
                        label: 'L130',
                        color: 'blue',
                    },
                    {
                        lane: '64 Learners',
                        start: 28,
                        end: 44,
                        label: 'L131',
                        color: 'blue',
                    },
                    {
                        lane: '64 Learners',
                        start: 46,
                        end: 60,
                        label: 'L132',
                        color: 'orange',
                    },
                    {
                        lane: '64 Learners',
                        start: 78,
                        end: 100,
                        label: 'L133',
                        color: 'blue',
                    },
                    {
                        lane: 'Weight Sync',
                        start: 62,
                        end: 78,
                        label: 'Sync v132',
                        color: 'orange',
                    },
                ],
                {
                    width: 1320,
                    pitch: 94,
                    barHeight: 54,
                    size: 30,
                    domain: [0, 100],
                    ticks: [0, 20, 40, 60, 78, 100],
                    axisLabel: 'training wall-clock progress',
                },
            )

            const lagStep = s.value(0)

            const lagPanel = dynamic(() => {
                const v = lagStep.value
                if (v < 0.05) return []
                const items = [
                    { label: 'v130 @ L130', lag: 'lag 0', color: 'green', showAt: 1 },
                    { label: 'v130 @ L131', lag: 'lag 1', color: 'green', showAt: 2 },
                    { label: 'v130 @ L132', lag: 'lag 2 (limit)', color: 'orange', showAt: 3 },
                    { label: 'v129 @ L132', lag: 'lag 3 (over!)', color: 'red', showAt: 4 },
                ]
                const nodes: Node[] = []
                const y = 278
                items.forEach((it, i) => {
                    if (v < it.showAt - 0.45) return
                    const alpha = Math.min(1, (v - (it.showAt - 0.45)) / 0.35)
                    const x = -585 + i * 390
                    nodes.push(
                        rect(364, 74, {
                            fill: it.color,
                            stroke: it.color,
                            width: 2.5,
                            radius: 14,
                        })
                            .opacity(0.16 * alpha)
                            .moveTo([x, y]),
                    )
                    nodes.push(
                        text(`${it.label} · ${it.lag}`, {
                            size: 25,
                            color: it.color,
                        })
                            .opacity(alpha)
                            .moveTo([x, y]),
                    )
                })
                return nodes
            })

            const summary = text('Weight refresh resets staleness back to lag 0 on v132', {
                size: 36,
                color: 'green',
            })

            place(column([trace], { gap: 24 }), kit.area, 'center')
            summary.moveTo([0, 365])

            s.chapter('Workers stream v130 into the queue')
            s.add(title, trace, lagPanel)
            s.caption(
                '48 rollout workers generate trajectories tagged v130 while the learner starts step L130 with lag 0.',
                4.0,
            )
            s.play(trace.advance(26), lagStep.to(1), { duration: 2.4 })
            s.wait(1.4)

            s.chapter('Learner advances without waiting for a cohort')
            s.caption(
                'The learner updates to L131 and L132 while v130 trajectories keep arriving at lag 1 and lag 2.',
                4.5,
            )
            s.play(trace.advance(44), lagStep.to(2), { duration: 1.8 })
            s.wait(0.8)
            s.play(trace.advance(60), lagStep.to(3), { duration: 1.8 })
            s.wait(1.0)

            s.chapter('Version tags catch stale groups exceeding S = 2')
            s.caption(
                'An older v129 trajectory arriving at L132 has lag 3, exceeding the S ≤ 2 target and triggering rejection.',
                4.2,
            )
            s.play(lagStep.to(4), { duration: 1.0 })
            s.wait(2.8)

            s.chapter('Periodic weight refresh pauses generation')
            s.caption(
                'Generation pauses briefly to cast BF16 learner weights to FP8 and broadcast v132 to all rollout engines.',
                4.2,
            )
            s.play(trace.advance(78), { duration: 2.4 })
            s.wait(1.6)

            s.chapter('Workers resume at lag 0')
            s.caption(
                'Rollout workers resume on v132 and learner L133 consumes fresh trajectories.',
                4.0,
            )
            s.play(trace.advance(100), { duration: 2.0 })
            s.play(fadeIn(summary), { duration: 0.6 })
            s.wait(2.8)
        },
    )
}

export default createFilm()
