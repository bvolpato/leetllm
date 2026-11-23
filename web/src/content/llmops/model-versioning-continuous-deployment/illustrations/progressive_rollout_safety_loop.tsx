import React from 'react'
import { BarChart, Column, LineChart, Scene, defineIllustration } from 'vizmatic'
import { prepareArticleFigure } from '../../../../../tools/illustrations/lib/presentation'
import { preparePrintTypography } from '../../../../../tools/illustrations/lib/print-typography'

export const width = 620
export const height = 760
export const preset = 'engineering'
export const alt =
    'Canary gate chart comparing a passing 1% window with zero unsupported serves against a failing 10% window at 1.4% violations, paired with the one-sided 95% Clopper-Pearson upper error bound across sample sizes.'

const illustration = defineIllustration((c) => {
    const windowBars = preparePrintTypography(
        prepareArticleFigure(
            BarChart({
                c,
                width: 550,
                height: 280,
                title: 'Canary Window Unsupported Serve Rate (%) vs 0.5% Gate Cap',
                min: 0,
                max: 2.0,
                showGrid: true,
                showValues: false,
                format: (v) => `${v.toFixed(1)}%`,
                data: [
                    { label: 'Pass1%', value: 0.0, color: 'positive' },
                    { label: 'Hold95%', value: 0.25, color: 'info' },
                    { label: 'GateCap', value: 0.5, color: 'warning' },
                    { label: 'Abort10%', value: 1.4, color: 'critical' },
                ],
            }),
            false,
            false,
        ),
        19,
    )

    const boundCurve = preparePrintTypography(
        prepareArticleFigure(
            LineChart({
                c,
                width: 550,
                height: 295,
                title: 'One-Sided 95% Upper Bound at Zero Failures: 1 - 0.05^(1/n)',
                min: 0,
                max: 3.5,
                showGrid: true,
                showPoints: true,
                directLabels: false,
                format: (v) => `${v.toFixed(1)}%`,
                labels: ['100', '250', '500', '800', '1200', '2000'],
                series: [
                    {
                        name: 'Zero-Failure Upper Risk',
                        points: [2.95, 1.19, 0.6, 0.37, 0.25, 0.15],
                        color: 'info',
                        area: true,
                    },
                    {
                        name: '0.5% Gate Cap',
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
            title="Live Canary Promotion Gates and Zero-Failure Bounds"
            subtitle="A single confirmed safety breach triggers immediate abort; clean windows tighten latent defect risk"
            padding={16}
            gap={14}
        >
            <Column style={{ paddingLeft: 14 }}>{windowBars}</Column>
            <Column style={{ paddingLeft: 14 }}>{boundCurve}</Column>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
