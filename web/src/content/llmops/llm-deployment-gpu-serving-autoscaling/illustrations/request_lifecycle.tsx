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
    'Server-side LLM request timeline: 180 ms queue wait plus 120 ms prefill produces a 300 ms TTFT. Subsequent decoded tokens arrive at 340, 380, and 500 ms, exposing inter-token intervals of 40 ms, 40 ms, and a 120 ms tail stall behind a 66.7 ms mean TPOT.'

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
                    text: 'Mean TPOT (66.7 ms) hides a 120 ms tail decode stall',
                    fontSize: 27,
                    fontWeight: 700,
                    color: base.textPrimary,
                }),
                StackedBar({
                    c,
                    width: 668,
                    height: 30,
                    title: 'End-to-end 500 ms request composition (TTFT = 300 ms)',
                    showLegend: true,
                    segments: [
                        { label: 'Queue 180 ms', value: 180, color: warm },
                        { label: 'Prefill 120 ms', value: 120, color: blue },
                        { label: 'Decode 200 ms', value: 200, color: green },
                    ],
                }),
                BarChart({
                    c,
                    width: 668,
                    height: 205,
                    format: 'integer',
                    max: 140,
                    footer: 'Mean TPOT across the 3 token gaps: 66.7 ms',
                    data: [
                        { label: 'Gap 1 (tok 1->2)', value: 40, color: green, valueLabel: '40 ms' },
                        { label: 'Gap 2 (tok 2->3)', value: 40, color: green, valueLabel: '40 ms' },
                        { label: 'Gap 3 (tok 3->4)', value: 120, color: red, valueLabel: '120 ms' },
                    ],
                    yAxisLabel: 'Gap (ms)',
                    ariaLabel: alt,
                }),
            ],
        }),
    })
}

export default create('dark')
