import React from 'react'
import { BarChart, Column, Scene, StackedBar, defineIllustration } from 'vizmatic'
import { prepareArticleFigure } from '../../../../../tools/illustrations/lib/presentation'
import { preparePrintTypography } from '../../../../../tools/illustrations/lib/print-typography'

export const width = 620
export const height = 680
export const preset = 'engineering'
export const alt =
    'Stacked share of daily workload spend ($23.91/day) paired with a bar chart comparing individual cohorts against $13.82 of avoided stored-answer generation.'

const illustration = defineIllustration((c) => {
    const mix = preparePrintTypography(
        prepareArticleFigure(
            StackedBar({
                c,
                width: 550,
                height: 150,
                title: 'Share of $23.91 Daily Generation Bill (%)',
                showLegend: true,
                segments: [
                    { label: 'Orders', value: 46, color: 'critical' },
                    { label: 'Docs', value: 33, color: 'info' },
                    { label: 'Eval', value: 12, color: 'violet' },
                    { label: 'Review', value: 9, color: 'positive' },
                ],
            }),
            false,
            false,
        ),
        19,
    )

    const cohorts = preparePrintTypography(
        prepareArticleFigure(
            BarChart({
                c,
                width: 550,
                height: 310,
                title: 'Daily Cohort Spend vs Avoided Cache ($ / Day)',
                min: 0,
                max: 25,
                showGrid: true,
                showValues: false,
                format: (v) => String(Math.round(v)),
                data: [
                    { label: 'Orders', value: 11.03, color: 'critical' },
                    { label: 'Docs', value: 7.78, color: 'info' },
                    { label: 'Eval', value: 2.82, color: 'violet' },
                    { label: 'Review', value: 2.29, color: 'positive' },
                    { label: 'Avoided', value: 13.82, color: 'neutral' },
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
            title="Cohort Spend Breakdown vs Avoided Cache"
            subtitle="Uncached live-order calls dominate daily cost; avoided cache spend is not a credit"
            padding={16}
            gap={16}
        >
            <Column style={{ paddingLeft: 14 }}>{mix}</Column>
            <Column style={{ paddingLeft: 14 }}>{cohorts}</Column>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
