import React from 'react'
import { Column, LineChart, Scene, defineIllustration } from 'vizmatic'
import { prepareArticleFigure } from '../../../../../tools/illustrations/lib/presentation'
import { preparePrintTypography } from '../../../../../tools/illustrations/lib/print-typography'

export const width = 620
export const height = 760
export const preset = 'engineering'
export const alt =
    'Threshold sweep showing hit precision rising and paraphrase recall falling as cosine similarity tau increases, paired with the Wilson 95% lower precision bound vs shadow evaluation sample size.'

const illustration = defineIllustration((c) => {
    const thresholdCurve = preparePrintTypography(
        prepareArticleFigure(
            LineChart({
                c,
                width: 550,
                height: 295,
                title: 'Precision vs Recall Across Similarity Thresholds (%)',
                min: 0,
                max: 105,
                showGrid: true,
                showPoints: true,
                directLabels: false,
                format: (v) => `${Math.round(v)}%`,
                labels: ['0.65', '0.72', '0.80', '0.88', '0.94', '0.98'],
                series: [
                    {
                        name: 'Hit Precision',
                        points: [58, 74, 88, 99, 100, 100],
                        color: 'positive',
                    },
                    {
                        name: 'Paraphrase Recall',
                        points: [100, 94, 86, 76, 52, 24],
                        color: 'info',
                    },
                ],
            }),
            false,
            false,
        ),
        19,
    )

    const wilsonCurve = preparePrintTypography(
        prepareArticleFigure(
            LineChart({
                c,
                width: 550,
                height: 295,
                title: 'Wilson 95% Lower Bound at 100% Success vs Sample Size',
                min: 70,
                max: 102,
                showGrid: true,
                showPoints: true,
                directLabels: false,
                format: (v) => `${Math.round(v)}%`,
                labels: ['n=12', 'n=50', 'n=120', 'n=250', 'n=381', 'n=500'],
                series: [
                    {
                        name: 'Wilson Lower Bound',
                        points: [75.8, 92.9, 96.9, 98.5, 99.0, 99.2],
                        color: 'violet',
                        area: true,
                    },
                    {
                        name: '99% Promotion Gate',
                        points: [99.0, 99.0, 99.0, 99.0, 99.0, 99.0],
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
            title="Threshold Calibration and Shadow Sample Confidence"
            subtitle="Calibration balances paraphrase recall against false positives and validates quality with Wilson lower bounds"
            padding={16}
            gap={14}
        >
            <Column style={{ paddingLeft: 14 }}>{thresholdCurve}</Column>
            <Column style={{ paddingLeft: 14 }}>{wilsonCurve}</Column>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
