import React from 'react'
import {
    BarChart,
    Column,
    Scene,
    StackedBar,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
    withDensity,
    type ThemeMode,
} from 'vizmatic'

export const width = 700
export const height = 670
export const autoSize = false
export const preset = 'engineering'
export const alt =
    'GPU memory footprint comparison under a 76 GB budget: a dense 8B BF16 deployment uses 16.0 GB weights, 4.3 GB growing KV, and 3.0 GB overhead (23.3 GB total), while Qwen3.6-27B language component combines 54.0 GB weights, 2.1 GB KV across 16 full-attention layers, 0.6 GB fixed state across 48 linear layers, and 8.5 GB overhead for 65.3 GB total.'

export function create(theme: ThemeMode = 'dark') {
    const base = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const c = withDensity({ ...base, shadow: 'transparent' }, 2.15)
    const blue = getReadableToneColor('blue', c)
    const green = getReadableToneColor('green', c)
    const warm = getReadableToneColor('warm', c)
    const purple = getReadableToneColor('purple', c)

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
                    text: 'Hybrid models budget growing KV and fixed recurrent state',
                    fontSize: 27,
                    fontWeight: 700,
                    color: base.textPrimary,
                }),
                StackedBar({
                    c,
                    width: 668,
                    height: 30,
                    title: 'Qwen3.6-27B language breakdown (65.3 GB vs 76 GB H100 budget)',
                    showLegend: true,
                    segments: [
                        { label: 'Weights 54.0', value: 54.0, color: blue },
                        { label: 'KV (16L) 2.1', value: 2.15, color: green },
                        { label: 'Linear (48L) 0.6', value: 0.6, color: purple },
                        { label: '15% overhead 8.5', value: 8.51, color: warm },
                    ],
                }),
                BarChart({
                    c,
                    width: 668,
                    height: 195,
                    format: (v: number) => `${v.toFixed(1)} GB`,
                    yAxisLabel: 'Memory (GB)',
                    max: 82,
                    footer: 'Usable HBM allowance on 80 GB H100: 76.0 GB',
                    data: [
                        { label: '8B BF16 (4k, conc=8)', value: 23.3, color: green },
                        { label: '27B Hybrid (8k, conc=4)', value: 65.3, color: blue },
                    ],
                    ariaLabel: alt,
                }),
            ],
        }),
    })
}

export default create('dark')
