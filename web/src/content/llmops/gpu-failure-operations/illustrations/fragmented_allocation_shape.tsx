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
    'Allocator fragmentation stops a 1.50 GiB allocation despite 6.10 GiB of inactive split memory. An upper segment layout shows free holes separated by occupied tensor spans. A lower bar chart shows six 0.88 GiB holes and one 0.82 GiB hole, every single one smaller than the 1.50 GiB contiguous request.'

export function create(theme: ThemeMode = 'dark') {
    const base = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const c = withDensity({ ...base, shadow: 'transparent' }, 2.15)
    const blue = getReadableToneColor('blue', c)
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
                    text: 'Nonadjacent splits fail a 1.50 GiB request',
                    fontSize: 30,
                    fontWeight: 700,
                    color: c.textPrimary,
                }),
                StackedBar({
                    c,
                    width: 668,
                    height: 34,
                    title: 'Blue = live slabs · Orange = nonadjacent free holes (<= 0.88 GiB)',
                    showLegend: false,
                    segments: [
                        { label: 'Live A', value: 4.5, color: blue },
                        { label: 'Hole 1', value: 0.88, color: warm },
                        { label: 'Live B', value: 4.5, color: blue },
                        { label: 'Hole 2', value: 0.88, color: warm },
                        { label: 'Live C', value: 4.5, color: blue },
                        { label: 'Hole 3', value: 0.82, color: warm },
                    ],
                }),
                BarChart({
                    c,
                    width: 668,
                    height: 220,
                    min: 0,
                    max: 1.9,
                    yAxisLabel: 'GiB',
                    showGrid: true,
                    showValues: true,
                    data: [
                        { label: 'Needed', value: 1.5, color: red, valueLabel: '1.50' },
                        { label: 'Hole 1', value: 0.88, color: warm, valueLabel: '0.88' },
                        { label: 'Hole 2', value: 0.88, color: warm, valueLabel: '0.88' },
                        { label: 'Hole 4', value: 0.88, color: warm, valueLabel: '0.88' },
                        { label: 'Hole 6', value: 0.88, color: warm, valueLabel: '0.88' },
                        { label: 'Hole 7', value: 0.82, color: warm, valueLabel: '0.82' },
                    ],
                    footer: 'Pinned active spans block coalescing across segments',
                    ariaLabel: alt,
                }),
            ],
        }),
    })
}

export default create('dark')
