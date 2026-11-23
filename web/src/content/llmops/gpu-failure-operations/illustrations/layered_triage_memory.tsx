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
export const height = 740
export const autoSize = false
export const preset = 'engineering'
export const alt =
    'A 40.00 GiB HBM breakdown for failed 1.50 GiB allocation r-7812 shows 30.10 GiB allocated tensors, 6.10 GiB inactive allocator splits, 0.50 GiB other PyTorch reserve, 2.68 GiB outside PyTorch, and 0.62 GiB device free. A lower bar comparison contrasts the 1.50 GiB allocation request against the 0.88 GiB largest inactive split block and 0.62 GiB device-free memory alongside the 2.68 GiB unattributed outside-PyTorch memory.'

export function create(theme: ThemeMode = 'dark') {
    const base = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const c = withDensity({ ...base, shadow: 'transparent' }, 2.15)
    const blue = getReadableToneColor('blue', c)
    const warm = getReadableToneColor('warm', c)
    const purple = getReadableToneColor('purple', c)
    const red = getReadableToneColor('red', c)
    const green = getReadableToneColor('green', c)

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
                    text: 'OOM triage spans PyTorch, splits, and NVML',
                    fontSize: 30,
                    fontWeight: 700,
                    color: c.textPrimary,
                }),
                StackedBar({
                    c,
                    width: 668,
                    height: 36,
                    title: 'gpu-a17 (40.00 GiB HBM): 39.38 GiB used, 0.62 GiB free',
                    showLegend: true,
                    segments: [
                        { label: 'Alloc 30.1', value: 30.1, color: blue },
                        { label: 'Splits 6.1', value: 6.1, color: warm },
                        { label: 'Other 0.5', value: 0.5, color: purple },
                        { label: 'Outside 2.68', value: 2.68, color: red },
                        { label: 'Free 0.62', value: 0.62, color: green },
                    ],
                }),
                BarChart({
                    c,
                    width: 668,
                    height: 195,
                    min: 0,
                    max: 3.0,
                    yAxisLabel: 'GiB',
                    showGrid: true,
                    showValues: true,
                    data: [
                        { label: 'Outside', value: 2.68, color: red, valueLabel: '2.68' },
                        { label: 'Request', value: 1.5, color: purple, valueLabel: '1.50' },
                        { label: 'Max split', value: 0.88, color: warm, valueLabel: '0.88' },
                        { label: 'Dev free', value: 0.62, color: green, valueLabel: '0.62' },
                    ],
                    footer: '6.10 GiB inactive splits have max hole 0.88 GiB (< 1.50 GiB)',
                    ariaLabel: alt,
                }),
            ],
        }),
    })
}

export default create('dark')
