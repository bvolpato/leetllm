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
    'Requests served vs expired from a 100-request burst with a 30-second wait deadline and 207-second cold replica startup: 0 warm replicas lose all 100, 1 warm serves 20 and loses 80, 3 warm serve 60 and lose 40, and 20 warm serve all 100 before any cold replica is ready.'

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
                    text: 'Warm capacity alone saves a 30 s burst before 207 s cold starts',
                    fontSize: 27,
                    fontWeight: 700,
                    color: base.textPrimary,
                }),
                StackedBar({
                    c,
                    width: 668,
                    height: 30,
                    title: 'Burst outcomes with 3 warm replicas (5 slots each, 10 s service)',
                    showLegend: true,
                    segments: [
                        { label: 'Served <=30s (60)', value: 60, color: green },
                        { label: 'Expired >30s (40)', value: 40, color: red },
                    ],
                }),
                BarChart({
                    c,
                    width: 668,
                    height: 270,
                    format: 'integer',
                    yAxisLabel: 'Requests served',
                    max: 110,
                    footer: '100-request burst against a 30 s wait deadline',
                    data: [
                        { label: '20 warm', value: 100, color: green, valueLabel: '100' },
                        { label: '3 warm', value: 60, color: blue, valueLabel: '60' },
                        { label: '1 warm', value: 20, color: warm, valueLabel: '20' },
                        { label: '0 warm (207s)', value: 0, color: red, valueLabel: '0' },
                    ],
                    ariaLabel: alt,
                }),
            ],
        }),
    })
}

export default create('dark')
