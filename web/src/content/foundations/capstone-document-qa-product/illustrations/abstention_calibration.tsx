import React from 'react'
import { BarChart, Column, Scene, defineIllustration, withDensity } from 'vizmatic'

export const width = 640
export const height = 780
export const autoSize = false
export const alt =
    'Comparison of unit-normalized dense cosine against calibrated evidence signal across five representative queries. Raw dense cosine remains high on archived (0.956), contractor out-of-scope (0.756), and PostgreSQL (0.837) probes, while subspace-weighted evidence drops all non-supported queries below the 0.160 abstention threshold.'

const illustration = defineIllustration((baseC) => {
    const c = withDensity(baseC, 1.9)
    return Scene({
        c,
        padding: 12,
        gap: 10,
        contentWidth: 616,
        children: Column({
            gap: 10,
            children: [
                BarChart({
                    c,
                    width: 616,
                    height: 170,
                    title: 'Failure Mode: Unit-Normalized Cosine Alone',
                    subtitle: 'Out-of-scope and archived queries normalize noise up to 0.76-0.96',
                    max: 1.15,
                    showGrid: false,
                    showValues: true,
                    data: [
                        {
                            label: '429 Retry',
                            value: 0.945,
                            valueLabel: '0.945',
                            color: 'positive',
                        },
                        {
                            label: 'Bit-Packed',
                            value: 0.964,
                            valueLabel: '0.964',
                            color: 'positive',
                        },
                        {
                            label: 'Archived',
                            value: 0.956,
                            valueLabel: '0.956',
                            color: 'warning',
                        },
                        {
                            label: 'Contractor OOS',
                            value: 0.756,
                            valueLabel: '0.756',
                            color: 'critical',
                        },
                        {
                            label: 'Postgres OOS',
                            value: 0.837,
                            valueLabel: '0.837',
                            color: 'critical',
                        },
                    ],
                }),
                BarChart({
                    c,
                    width: 616,
                    height: 170,
                    title: 'Fixed Gate: Evidence Signal (tau = 0.160)',
                    subtitle: 'Subspace energy ||U_k^T q|| + sparse separates OOS cleanly',
                    max: 0.42,
                    showGrid: false,
                    showValues: true,
                    data: [
                        {
                            label: '429 Retry',
                            value: 0.329,
                            valueLabel: '0.329',
                            color: 'positive',
                        },
                        {
                            label: 'Bit-Packed',
                            value: 0.27,
                            valueLabel: '0.270',
                            color: 'positive',
                        },
                        {
                            label: 'Archived',
                            value: 0.053,
                            valueLabel: '0.053',
                            color: 'warning',
                        },
                        {
                            label: 'Contractor OOS',
                            value: 0.046,
                            valueLabel: '0.046',
                            color: 'critical',
                        },
                        {
                            label: 'Postgres OOS',
                            value: 0.138,
                            valueLabel: '0.138',
                            color: 'critical',
                        },
                    ],
                }),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
