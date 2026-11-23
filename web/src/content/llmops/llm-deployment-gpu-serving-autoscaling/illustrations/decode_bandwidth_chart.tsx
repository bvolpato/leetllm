import React from 'react'
import {
    BarChart,
    Column,
    Scene,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
    withDensity,
    type ThemeMode,
} from 'vizmatic'

export const width = 700
export const height = 430
export const autoSize = false
export const preset = 'engineering'
export const alt =
    'Weight-only batch-size-one decode ceilings on an H100 SXM GPU at 3,350 GB/s HBM bandwidth: 8B BF16 (16 GB weights) reaches 209.4 tokens/s, dense 27B INT8 (27 GB weights) reaches 124.1 tokens/s, and dense 27B BF16 (54 GB weights) reaches 62.0 tokens/s.'

export function create(theme: ThemeMode = 'dark') {
    const base = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const c = withDensity({ ...base, shadow: 'transparent' }, 2.15)
    const blue = getReadableToneColor('blue', c)
    const green = getReadableToneColor('green', c)
    const warm = getReadableToneColor('warm', c)

    return Scene({
        c: base,
        padding: 16,
        gap: 10,
        contentWidth: 668,
        children: Column({
            gap: 10,
            width: 668,
            children: [
                TextLabel({
                    c,
                    text: 'Halving active weight bytes doubles the HBM decode ceiling',
                    fontSize: 27,
                    fontWeight: 700,
                    color: base.textPrimary,
                }),
                TextLabel({
                    c,
                    text: 'Batch-1 weight-only ceiling = 3,350 GB/s / active checkpoint GB',
                    fontSize: 21,
                    color: base.textSecondary,
                }),
                BarChart({
                    c,
                    width: 668,
                    height: 290,
                    format: (v: number) => `${Math.round(v)}`,
                    yAxisLabel: 'Tokens / s',
                    max: 240,
                    data: [
                        {
                            label: '8B BF16 (16 GB)',
                            value: 209.4,
                            color: green,
                            valueLabel: '209.4',
                        },
                        {
                            label: '27B INT8 (27 GB)',
                            value: 124.1,
                            color: blue,
                            valueLabel: '124.1',
                        },
                        {
                            label: '27B BF16 (54 GB)',
                            value: 62.0,
                            color: warm,
                            valueLabel: '62.0',
                        },
                    ],
                    ariaLabel: alt,
                }),
            ],
        }),
    })
}

export default create('dark')
