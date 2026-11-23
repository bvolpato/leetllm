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
export const height = 700
export const autoSize = false
export const preset = 'engineering'
export const alt =
    'Batch scheduling comparison on two decode slots serving replies of 8, 2, 5, and 3 tokens: static batching takes 13 total steps with 8 wasted empty slot-steps waiting for the longest reply, while continuous batching takes 10 steps with only 2 wasted empty slot-steps, raising slot occupancy from 69 percent to 90 percent.'

export function create(theme: ThemeMode = 'dark') {
    const base = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const c = withDensity({ ...base, shadow: 'transparent' }, 2.15)
    const blue = getReadableToneColor('blue', c)
    const green = getReadableToneColor('green', c)
    const red = getReadableToneColor('red', c)

    return Scene({
        c: base,
        padding: 16,
        gap: 8,
        contentWidth: 668,
        children: Column({
            gap: 8,
            width: 668,
            children: [
                TextLabel({
                    c,
                    text: 'Continuous batching cuts empty decode slot-steps by 75%',
                    fontSize: 27,
                    fontWeight: 700,
                    color: base.textPrimary,
                }),
                StackedBar({
                    c,
                    width: 668,
                    height: 26,
                    title: 'Static 2-slot batching (13 steps, 26 slot-steps)',
                    showLegend: true,
                    segments: [
                        { label: 'Active tokens (18)', value: 18, color: blue },
                        { label: 'Padding idle (8)', value: 8, color: red },
                    ],
                }),
                StackedBar({
                    c,
                    width: 668,
                    height: 26,
                    title: 'Continuous 2-slot batching (10 steps, 20 slot-steps)',
                    showLegend: true,
                    segments: [
                        { label: 'Active tokens (18)', value: 18, color: green },
                        { label: 'Tail idle (2)', value: 2, color: red },
                    ],
                }),
                BarChart({
                    c,
                    width: 668,
                    height: 200,
                    format: 'integer',
                    yAxisLabel: 'Steps',
                    max: 15,
                    data: [
                        { label: 'Static steps', value: 13, color: red },
                        { label: 'Cont. steps', value: 10, color: green },
                        { label: 'Static idle', value: 8, color: red },
                        { label: 'Cont. idle', value: 2, color: blue },
                    ],
                    ariaLabel: alt,
                }),
            ],
        }),
    })
}

export default create('dark')
