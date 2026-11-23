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
export const height = 640
export const autoSize = false
export const preset = 'engineering'
export const alt =
    'KV cache slot utilization across four prompts of 320, 75, 900, and 250 tokens: 1,545 active tokens occupy 98 paged blocks (1,568 slots, only 23 trailing slack slots) compared against 512 fixed maximum-length blocks (8,192 slots), saving 6,624 KV slots.'

export function create(theme: ThemeMode = 'dark') {
    const base = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const c = withDensity({ ...base, shadow: 'transparent' }, 2.15)
    const blue = getReadableToneColor('blue', c)
    const green = getReadableToneColor('green', c)
    const warm = getReadableToneColor('warm', c)
    const red = getReadableToneColor('red', c)

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
                    text: 'Paged KV avoids 6,624 pre-reserved slots across four prompts',
                    fontSize: 27,
                    fontWeight: 700,
                    color: base.textPrimary,
                }),
                StackedBar({
                    c,
                    width: 668,
                    height: 30,
                    title: '8,192 worst-case fixed slots (4 x 2,048 max length)',
                    showLegend: true,
                    segments: [
                        { label: 'Used tokens (1,545)', value: 1545, color: blue },
                        { label: 'Final-block slack (23)', value: 23, color: warm },
                        { label: 'Saved by paging (6,624)', value: 6624, color: green },
                    ],
                }),
                BarChart({
                    c,
                    width: 668,
                    height: 220,
                    format: 'integer',
                    yAxisLabel: 'KV slots',
                    max: 8500,
                    data: [
                        { label: 'Fixed (512 blk)', value: 8192, color: red },
                        { label: 'Paged (98 blk)', value: 1568, color: green },
                        { label: 'Live tokens', value: 1545, color: blue },
                    ],
                    ariaLabel: alt,
                }),
            ],
        }),
    })
}

export default create('dark')
