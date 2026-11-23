import React from 'react'
import { Column, LineChart, ParetoChart, Scene, defineIllustration } from 'vizmatic'
import { prepareArticleFigure } from '../../../../../tools/illustrations/lib/presentation'
import { preparePrintTypography } from '../../../../../tools/illustrations/lib/print-typography'

export const width = 620
export const height = 780
export const preset = 'engineering'
export const alt =
    'Cumulative prefix-cache break-even curve over six calls after a 1.25x write charge above a Pareto frontier of single-request cost versus task quality.'

const illustration = defineIllustration((c) => {
    const cacheCurve = preparePrintTypography(
        prepareArticleFigure(
            LineChart({
                c,
                width: 550,
                height: 290,
                title: 'Prefix Write vs Uncached Input (Relative Cost, 1x = Base)',
                min: 0,
                max: 6.5,
                showGrid: true,
                showPoints: true,
                directLabels: false,
                format: (v) => v.toFixed(1),
                labels: ['n=1', 'n=2', 'n=3', 'n=4', 'n=5', 'n=6'],
                series: [
                    {
                        name: 'Uncached (1.0x/call)',
                        points: [1.0, 2.0, 3.0, 4.0, 5.0, 6.0],
                        color: 'warning',
                    },
                    {
                        name: '1.25x Write + 0.1x Read',
                        points: [1.25, 1.35, 1.45, 1.55, 1.65, 1.75],
                        color: 'positive',
                        area: true,
                    },
                ],
            }),
            false,
            false,
        ),
        19,
    )

    const frontier = preparePrintTypography(
        prepareArticleFigure(
            ParetoChart({
                c,
                width: 550,
                height: 300,
                title: 'Cost ($ per 1k Calls) vs Answer Quality (%)',
                xMin: 0,
                xMax: 10,
                yMin: 68,
                yMax: 100,
                xObjective: 'minimize',
                yObjective: 'maximize',
                frontierColor: 'positive',
                showGrid: true,
                showGoal: false,
                formatX: (v) => String(Math.round(v)),
                formatY: (v) => String(Math.round(v)),
                points: [
                    { x: 1.5, y: 74, label: 'Truncated', color: 'critical' },
                    { x: 2.8, y: 86, label: 'Small-8B', color: 'info' },
                    { x: 4.6, y: 95, label: 'Concise', color: 'positive' },
                    { x: 7.2, y: 96, label: 'Verbose', color: 'violet' },
                    { x: 6.8, y: 84, label: 'Unbatched', color: 'neutral' },
                ],
            }),
            false,
            false,
        ),
        19,
    )

    return (
        <Scene
            c={c}
            title="Cache Amortization and Cost-Quality Frontier"
            subtitle="Cache writes lose money on one-off prompts; concise structured outputs sit on the Pareto knee"
            padding={16}
            gap={14}
        >
            <Column style={{ paddingLeft: 14 }}>{cacheCurve}</Column>
            <Column style={{ paddingLeft: 14 }}>{frontier}</Column>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
