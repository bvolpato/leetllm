import { BarChart, Column, Scene, defineIllustration, withDensity } from 'vizmatic'

export const width = 640
export const height = 700
export const autoSize = false
export const alt =
    'Stacked softmax bar charts compare fixed logits: test_regression 2.0, registry_auth 1.0, and needs_review 0.0. Across three options registry_auth receives 0.245; removing needs_review renormalizes the same logits so registry_auth rises to 0.269.'

const illustration = defineIllustration((baseC) => {
    const c = withDensity(baseC, 2.0)
    const fmt = (value: number) => value.toFixed(3)

    return Scene({
        c,
        padding: 12,
        gap: 10,
        contentWidth: 616,
        children: Column({
            width: 616,
            gap: 12,
            children: [
                BarChart({
                    c,
                    width: 616,
                    height: 195,
                    title: 'All 3 Routes Offered (Z = 11.107)',
                    subtitle: 'Fixed logits [2.0, 1.0, 0.0] across 3 options',
                    min: 0,
                    max: 0.9,
                    format: fmt,
                    showGrid: false,
                    showValues: true,
                    data: [
                        {
                            label: 'test_regression',
                            value: 0.665,
                            valueLabel: '0.665',
                            color: 'primary',
                        },
                        {
                            label: 'registry_auth',
                            value: 0.245,
                            valueLabel: '0.245',
                            color: 'positive',
                        },
                        {
                            label: 'needs_review',
                            value: 0.09,
                            valueLabel: '0.090',
                            color: 'warning',
                        },
                    ],
                }),
                BarChart({
                    c,
                    width: 616,
                    height: 180,
                    title: 'needs_review Dropped (Z = 10.107)',
                    subtitle: 'Same logits [2.0, 1.0]: registry_auth rises +0.024',
                    min: 0,
                    max: 0.9,
                    format: fmt,
                    showGrid: false,
                    showValues: true,
                    data: [
                        {
                            label: 'test_regression',
                            value: 0.731,
                            valueLabel: '0.731',
                            color: 'primary',
                        },
                        {
                            label: 'registry_auth',
                            value: 0.269,
                            valueLabel: '0.269',
                            color: 'positive',
                        },
                    ],
                }),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
