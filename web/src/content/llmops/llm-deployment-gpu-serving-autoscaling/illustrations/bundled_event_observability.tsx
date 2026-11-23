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
export const height = 490
export const autoSize = false
export const preset = 'engineering'
export const alt =
    'Comparison of per-token streaming intervals against chunked SSE output events: four tokens delivered as one token at 300 ms and three bundled tokens at 340 ms expose only one 40 ms inter-event gap while hiding the internal token intervals inside the chunk.'

export function create(theme: ThemeMode = 'dark') {
    const base = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const c = withDensity({ ...base, shadow: 'transparent' }, 2.15)
    const blue = getReadableToneColor('blue', c)
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
                    text: 'Bundled output events mask per-token generation gaps',
                    fontSize: 27,
                    fontWeight: 700,
                    color: base.textPrimary,
                }),
                TextLabel({
                    c,
                    text: 'Events at 300 ms (1 tok) and 340 ms (3 tok) yield 40 ms gap vs 13.3 ms request TPOT',
                    fontSize: 21,
                    color: base.textSecondary,
                }),
                BarChart({
                    c,
                    width: 668,
                    height: 230,
                    format: (v: number) => `${Math.round(v)}`,
                    max: 60,
                    yAxisLabel: 'Latency (ms)',
                    footer: 'Observed SSE event gap: 40.0 ms vs 13.3 ms true per-token interval',
                    data: [
                        {
                            label: 'SSE gap (300->340)',
                            value: 40.0,
                            color: warm,
                            valueLabel: '40.0 ms',
                        },
                        {
                            label: 'True TPOT (/3 gaps)',
                            value: 13.3,
                            color: blue,
                            valueLabel: '13.3 ms',
                        },
                    ],
                    ariaLabel: alt,
                }),
            ],
        }),
    })
}

export default create('dark')
