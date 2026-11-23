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
    'Spot instance preemption drain schedule under a 120-second cloud notice: subtracting 20 seconds reserved for worker cleanup leaves 100 seconds of drain budget. Short 12 s and 84 s generations fit and finish gracefully, while 170 s work must retry if unstarted or emit an explicit interruption signal if already streaming.'

export function create(theme: ThemeMode = 'dark') {
    const base = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const c = withDensity({ ...base, shadow: 'transparent' }, 2.15)
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
                    text: 'Reserve cleanup before draining active spot generations',
                    fontSize: 27,
                    fontWeight: 700,
                    color: base.textPrimary,
                }),
                StackedBar({
                    c,
                    width: 668,
                    height: 30,
                    title: '120 s spot interruption notice budget',
                    showLegend: true,
                    segments: [
                        { label: 'Drain completion window (100 s)', value: 100, color: green },
                        { label: 'Cleanup reserve (20 s)', value: 20, color: warm },
                    ],
                }),
                BarChart({
                    c,
                    width: 668,
                    height: 220,
                    format: 'integer',
                    yAxisLabel: 'Duration (s)',
                    max: 190,
                    footer: '100 s finish limit (120 s notice minus 20 s worker cleanup)',
                    data: [
                        { label: 'Short (finish)', value: 12, color: green, valueLabel: '12 s' },
                        { label: 'Stream (finish)', value: 84, color: green, valueLabel: '84 s' },
                        { label: 'Queued (retry)', value: 170, color: warm, valueLabel: '170 s' },
                        {
                            label: 'Active (interrupt)',
                            value: 170,
                            color: red,
                            valueLabel: '170 s',
                        },
                    ],
                    ariaLabel: alt,
                }),
            ],
        }),
    })
}

export default create('dark')
