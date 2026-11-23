import { assertEqual, column, fadeIn, film, lanes, place, sceneKit, text } from 'vizmatic/stage'
import type { ThemeMode } from 'vizmatic'

export function createFilm(theme: ThemeMode = 'dark') {
    return film(
        {
            title: 'Independent checks share the clock',
            description:
                'Follow a parallel plan until every prerequisite of the report is complete.',
            look: theme === 'light' ? 'paper' : 'midnight',
            font: 'text-serif',
            fps: 30,
            aspect: '16:9',
        },
        (s) => {
            const planning = 40
            const durations = [90, 160, 70]
            const reporting = 30
            const reportStart = planning + Math.max(...durations)
            const parallel = reportStart + reporting
            const serial = planning + durations.reduce((sum, value) => sum + value, 0) + reporting
            assertEqual(parallel, 230)
            assertEqual(serial, 390)
            const kit = sceneKit({
                size: 42,
                heading: { size: 66, align: 'center' },
                area: { top: -340, bottom: 340 },
            })
            const title = kit.heading('Independent checks share the clock')
            const trace = lanes(
                ['Plan', 'Small scores', 'Large positive', 'Large negative', 'Report'],
                [
                    { lane: 'Plan', start: 0, end: planning, label: '40 ms', color: 'purple' },
                    {
                        lane: 'Small scores',
                        start: planning,
                        end: planning + durations[0],
                        label: '90 ms',
                        color: 'blue',
                    },
                    {
                        lane: 'Large positive',
                        start: planning,
                        end: planning + durations[1],
                        label: '160 ms',
                        color: 'orange',
                    },
                    {
                        lane: 'Large negative',
                        start: planning,
                        end: planning + durations[2],
                        label: '70 ms',
                        color: 'blue',
                    },
                    {
                        lane: 'Report',
                        start: reportStart,
                        end: parallel,
                        label: '30 ms',
                        color: 'green',
                    },
                ],
                {
                    width: 1280,
                    pitch: 90,
                    barHeight: 54,
                    size: 36,
                    domain: [0, 250],
                    ticks: [0, 40, 110, 130, 200, 230],
                    axisLabel: 'elapsed time (ms)',
                },
            )
            const result = text(`Parallel: ${parallel} ms     Sequential: ${serial} ms`, {
                size: 44,
                color: 'green',
            })
            place(column([trace, result], { gap: 44 }), kit.area, 'center')
            s.chapter('Make the plan')
            s.add(title, trace)
            s.caption(
                'Worked timings: planning takes 40 ms. Each check can begin after that plan is ready.',
                5,
            )
            s.play(trace.advance(planning), { duration: 3 })
            s.wait(2)
            s.chapter('Run independent checks together')
            s.caption(
                'All three checks start at 40 ms. Large negative inputs finish first, at 110 ms.',
                6,
            )
            s.play(trace.advance(110), { duration: 4 })
            s.wait(2)
            s.caption(
                'Small inputs finish at 130 ms. The report still needs the large-positive result.',
                5,
            )
            s.play(trace.advance(130), { duration: 1.6 })
            s.wait(3.4)
            s.chapter('Wait for the slowest prerequisite')
            s.caption(
                'The slowest check ends at 200 ms. Now all three results are available to the report.',
                6,
            )
            s.play(trace.advance(reportStart), { duration: 4 })
            s.wait(2)
            s.chapter('Complete the report')
            s.caption(
                'Reporting adds 30 ms. Overlap reduces the total from 390 to 230 ms for these durations.',
                7,
            )
            s.play(trace.advance(parallel), { duration: 2.4 })
            s.play(fadeIn(result), { duration: 0.6 })
            s.wait(5)
        },
    )
}

export default createFilm()
