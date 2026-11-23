import React from 'react'
import { BarChart, Column, LineChart, Scene, defineIllustration } from 'vizmatic'
import { prepareArticleFigure } from '../../../../../tools/illustrations/lib/presentation'
import { preparePrintTypography } from '../../../../../tools/illustrations/lib/print-typography'

export const width = 620
export const height = 760
export const preset = 'engineering'
export const alt =
    'Monthly spend sensitivity scenarios against a $750 budget above a confidence-bound curve (3/n) showing how quality sample size narrows upper defect risk.'

const illustration = defineIllustration((c) => {
    const budgetBars = preparePrintTypography(
        prepareArticleFigure(
            BarChart({
                c,
                width: 550,
                height: 290,
                title: 'Monthly Spend Scenarios vs $750 Budget Cap ($)',
                min: 0,
                max: 1000,
                showGrid: true,
                showValues: false,
                format: (v) => String(Math.round(v)),
                data: [
                    { label: 'Base', value: 717, color: 'positive' },
                    { label: 'Cap', value: 750, color: 'info' },
                    { label: '+10%', value: 780, color: 'warning' },
                    { label: 'ColdEval', value: 804, color: 'warning' },
                    { label: 'ColdAll', value: 916, color: 'critical' },
                ],
            }),
            false,
            false,
        ),
        19,
    )

    const riskCurve = preparePrintTypography(
        prepareArticleFigure(
            LineChart({
                c,
                width: 550,
                height: 290,
                title: 'Zero-Defect 95% Upper Bound (3/n) vs Sample Size',
                min: 0,
                max: 3.5,
                showGrid: true,
                showPoints: true,
                directLabels: false,
                format: (v) => `${v.toFixed(1)}%`,
                labels: ['100', '250', '500', '1000', '1500', '2000'],
                series: [
                    {
                        name: 'Upper Defect Bound',
                        points: [3.0, 1.2, 0.6, 0.3, 0.2, 0.15],
                        color: 'info',
                        area: true,
                    },
                    {
                        name: '0.5% Policy Cap',
                        points: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
                        color: 'warning',
                    },
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
            title="Budget Sensitivity and Quality Sample Bound"
            subtitle="Thin 4.4% spend cushions break easily; small zero-defect samples still allow hidden failure rates"
            padding={16}
            gap={14}
        >
            <Column style={{ paddingLeft: 14 }}>{budgetBars}</Column>
            <Column style={{ paddingLeft: 14 }}>{riskCurve}</Column>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
