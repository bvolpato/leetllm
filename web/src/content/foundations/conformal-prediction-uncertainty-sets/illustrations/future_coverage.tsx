import { Column, IntervalPlot, Scene, defineIllustration, withDensity } from 'vizmatic'

export const width = 720
export const height = 780
export const preset = 'engineering'
export const alt =
    'Four held-out latency examples compare intervals centered on predictions. With the calibrated fixed radius of 8 ms, A, B, and C are covered and D at 55 ms misses the upper bound 52 ms, for 3 of 4. A separately calibrated normalized rule uses q=2 and fixed scales 3, 3.5, 2, and 6 ms; its intervals are [34,46], [35,49], [34,42], and [32,56], covering all four requests. A four-row evaluation illustrates interval geometry; comparing population coverage requires a larger held-out sample.'

const illustration = defineIllustration((baseC) => {
    const c = withDensity(baseC, 2.2)
    return Scene({
        c,
        padding: 12,
        gap: 10,
        contentWidth: 696,
        children: Column({
            gap: 10,
            children: [
                IntervalPlot({
                    c,
                    width: 696,
                    height: 245,
                    min: 20,
                    max: 60,
                    title: 'Fixed Radius (q = 8 ms): 3 / 4 Covered',
                    subtitle: 'Intervals [32,48], [34,50], [30,46], [36,52]; D=55 misses',
                    format: (v) => String(v),
                    data: [
                        {
                            label: 'Req A',
                            low: 32,
                            mid: 44,
                            high: 48,
                            color: 'positive',
                            lowLabel: '',
                            midLabel: '44',
                            highLabel: '',
                        },
                        {
                            label: 'Req B',
                            low: 34,
                            mid: 48,
                            high: 50,
                            color: 'positive',
                            lowLabel: '',
                            midLabel: '48',
                            highLabel: '',
                        },
                        {
                            label: 'Req C',
                            low: 30,
                            mid: 35,
                            high: 46,
                            color: 'positive',
                            lowLabel: '',
                            midLabel: '35',
                            highLabel: '',
                        },
                        {
                            label: 'Req D',
                            low: 36,
                            mid: 55,
                            high: 52,
                            color: 'critical',
                            lowLabel: '',
                            midLabel: '55!',
                            highLabel: '',
                        },
                    ],
                }),
                IntervalPlot({
                    c,
                    width: 696,
                    height: 245,
                    min: 20,
                    max: 60,
                    title: 'Normalized (q = 2.0): 4 / 4 Covered',
                    subtitle: 'Intervals [34,46], [35,49], [34,42], [32,56] (scales 3, 3.5, 2, 6)',
                    format: (v) => String(v),
                    data: [
                        {
                            label: 'Req A',
                            low: 34,
                            mid: 44,
                            high: 46,
                            color: 'positive',
                            lowLabel: '',
                            midLabel: '44',
                            highLabel: '',
                        },
                        {
                            label: 'Req B',
                            low: 35,
                            mid: 48,
                            high: 49,
                            color: 'positive',
                            lowLabel: '',
                            midLabel: '48',
                            highLabel: '',
                        },
                        {
                            label: 'Req C',
                            low: 34,
                            mid: 35,
                            high: 42,
                            color: 'positive',
                            lowLabel: '',
                            midLabel: '35',
                            highLabel: '',
                        },
                        {
                            label: 'Req D',
                            low: 32,
                            mid: 55,
                            high: 56,
                            color: 'positive',
                            lowLabel: '',
                            midLabel: '55',
                            highLabel: '',
                        },
                    ],
                }),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.create('dark')
