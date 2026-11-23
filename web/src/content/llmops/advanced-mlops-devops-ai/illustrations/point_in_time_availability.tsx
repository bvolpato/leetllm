import React from 'react'
import { BarChart, Column, LineChart, Scene, defineIllustration } from 'vizmatic'
import { prepareArticleFigure } from '../../../../../tools/illustrations/lib/presentation'
import { preparePrintTypography } from '../../../../../tools/illustrations/lib/print-typography'

export const width = 620
export const height = 740
export const preset = 'engineering'
export const alt =
    'Line chart comparing point-in-time feature values against an unfiltered in-place rewrite across serving clocks from 08:00 to 13:00, paired with a bar chart of joined values by lookback window.'

const illustration = defineIllustration((c) => {
    const timeline = preparePrintTypography(
        prepareArticleFigure(
            LineChart({
                c,
                width: 550,
                height: 295,
                title: 'Available Value vs In-Place Rewrite Across Serving Clocks',
                min: 0,
                max: 9,
                showGrid: true,
                showPoints: true,
                directLabels: false,
                format: (v) => String(Math.round(v)),
                labels: ['08:00', '09:00', '09:05', '11:00', '12:00', '13:00'],
                series: [
                    {
                        name: 'Point-in-Time Available',
                        points: [0, 0, 5, 5, 5, 9],
                        color: 'positive',
                        area: true,
                    },
                    {
                        name: 'Unfiltered Rewrite (Leak)',
                        points: [0, 9, 9, 9, 9, 9],
                        color: 'critical',
                    },
                ],
            }),
            false,
            false,
        ),
        19,
    )

    const values = preparePrintTypography(
        prepareArticleFigure(
            BarChart({
                c,
                width: 550,
                height: 280,
                title: 'Point-in-Time Join Returned Value by Clock & Lookback',
                min: 0,
                max: 9,
                showGrid: true,
                showValues: false,
                format: (v) => String(Math.round(v)),
                data: [
                    { label: '24hNoon', value: 5, color: 'positive' },
                    { label: '1hNoon', value: 0, color: 'info' },
                    { label: 'LeakFix', value: 9, color: 'critical' },
                    { label: 'BeforeAv', value: 0, color: 'warning' },
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
            title="Point-in-Time Feature Joins Without Future Leakage"
            subtitle="Offline joins must filter by serving availability time so future corrections never leak into past labels"
            padding={16}
            gap={18}
        >
            <Column style={{ paddingLeft: 14 }}>{timeline}</Column>
            <Column style={{ paddingLeft: 14 }}>{values}</Column>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
