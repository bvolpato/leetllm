import React from 'react'
import {
    AxisPlot,
    BarChart,
    Card,
    Column,
    KeyValueList,
    Panel,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
    withDensity,
} from 'vizmatic'

export const width = 620
export const height = 800
export const alt =
    'For six latency observations, an E-step with means 70 and 90 ms, equal weights, and variances 400 ms squared gives six fractional component memberships. The component-1 weighted mean is 184.894 divided by 3.907, or 47.33 ms. On the likelihood plot, the old bound rises from -32.028 to -29.517 during the M-step, then a fresh E-step closes the 1.052 gap to the log likelihood at -28.465.'

const data = [28, 30, 32, 86, 90, 94]
const joint = (mean: number) =>
    data.map((x) =>
        [mean, 90].map(
            (mu) => Math.log(0.5) - 0.5 * (Math.log(2 * Math.PI * 400) + (x - mu) ** 2 / 400),
        ),
    )
const lse = (row: number[]) => Math.log(row.reduce((a, s) => a + Math.exp(s), 0))
const likelihood = (mean: number) => joint(mean).reduce((a, row) => a + lse(row), 0)
const posterior = (mean: number) => joint(mean).map((row) => row.map((s) => Math.exp(s - lse(row))))
const elbo = (q: number[][], mean: number) =>
    joint(mean).reduce(
        (a, row, i) => a + row.reduce((b, s, k) => b + q[i][k] * (s - Math.log(q[i][k])), 0),
        0,
    )

const qOld = posterior(70)
const newMean = qOld.reduce((a, r, i) => a + r[0] * data[i], 0) / qOld.reduce((a, r) => a + r[0], 0)
const qNew = posterior(newMean)
const grid = Array.from({ length: 61 }, (_, i) => 20 + i)
const curve = (f: (m: number) => number) => grid.map((x) => ({ x, y: f(x) }))
const low = Math.floor(Math.min(...grid.map((m) => elbo(qNew, m))) / 5) * 5

const illustration = defineIllustration((baseC) => {
    const c = withDensity(baseC, 1.9)
    return Scene({
        c,
        background: c.bg,
        padding: 18,
        children: Column({
            gap: 10,
            align: 'stretch',
            children: [
                Column({
                    gap: 4,
                    children: [
                        TextLabel({
                            c,
                            text: 'EM Climbs a Lower Bound',
                            fontSize: 23,
                            fontWeight: 700,
                            color: c.textPrimary,
                        }),
                        TextLabel({
                            c,
                            text: 'First mean m moves from 70 ms to 47.33 ms.',
                            fontSize: 19,
                            color: c.textSecondary,
                        }),
                    ],
                }),
                Panel({
                    c,
                    title: 'Log Likelihood and Bounds Over m (ms)',
                    padding: 10,
                    children: Column({
                        gap: 4,
                        align: 'stretch',
                        children: [
                            AxisPlot({
                                c,
                                width: 562,
                                height: 150,
                                xMin: 20,
                                xMax: 80,
                                yMin: low,
                                yMax: -25,
                                padding: 12,
                                showFrame: false,
                                showAxes: false,
                                showGrid: true,
                                gridCount: 4,
                                paths: [
                                    {
                                        points: curve(likelihood),
                                        color: c.textPrimary,
                                        strokeWidth: 3.5,
                                    },
                                    {
                                        points: curve((m) => elbo(qOld, m)),
                                        color: c.primaryLight,
                                        strokeWidth: 3,
                                    },
                                    {
                                        points: curve((m) => elbo(qNew, m)),
                                        color: c.warning,
                                        strokeWidth: 3,
                                    },
                                ],
                                points: [
                                    { x: 70, y: likelihood(70), tone: 'blue' as const, r: 8 },
                                    {
                                        x: newMean,
                                        y: elbo(qOld, newMean),
                                        tone: 'purple' as const,
                                        r: 8,
                                    },
                                    {
                                        x: newMean,
                                        y: likelihood(newMean),
                                        tone: 'green' as const,
                                        r: 8,
                                    },
                                ],
                                ariaLabel: 'Log likelihood with the old and new lower bounds',
                            }),
                            Row({
                                justify: 'space-between',
                                children: [
                                    TextLabel({
                                        c,
                                        text: 'Blue: old bound',
                                        fontSize: 19,
                                        color: c.primaryLight,
                                    }),
                                    TextLabel({
                                        c,
                                        text: 'Orange: new bound',
                                        fontSize: 19,
                                        color: c.warning,
                                    }),
                                ],
                            }),
                        ],
                    }),
                }),
                BarChart({
                    c,
                    width: 584,
                    height: 150,
                    min: 0,
                    title: 'Component 1 Share at m = 70 (%)',
                    data: qOld.map((row, i) => ({
                        label: `${data[i]}`,
                        value: Math.round(row[0] * 1000) / 10,
                        color: i < 3 ? ('primary' as const) : ('warning' as const),
                    })),
                    format: 'decimal',
                    showGrid: false,
                    showValues: true,
                }),
                Card({
                    c,
                    padding: 10,
                    children: KeyValueList({
                        c,
                        rows: [
                            {
                                key: 'Old likelihood',
                                value: '-32.028',
                                tone: 'blue',
                            },
                            {
                                key: 'After M-step',
                                value: 'bound -29.517',
                                tone: 'purple',
                            },
                            {
                                key: 'Next E-step',
                                value: '-28.465 · gap 1.052',
                                tone: 'green',
                            },
                        ],
                    }),
                }),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
