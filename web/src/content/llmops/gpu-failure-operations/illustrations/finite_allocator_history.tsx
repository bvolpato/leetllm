import React from 'react'
import {
    Column,
    Flow,
    Panel,
    Row,
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
    'A finite 100,000-entry PyTorch allocator history buffer tracks allocations before an out-of-memory error, wraps around to overwrite the oldest entries when saturated, and dumps a fixed-size snapshot before process restart. Late recording that begins after the failure misses the triggering allocation event.'

export function create(theme: ThemeMode = 'dark') {
    const base = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const c = withDensity({ ...base, shadow: 'transparent' }, 2.15)
    const blue = getReadableToneColor('blue', c)
    const green = getReadableToneColor('green', c)
    const neutral = getReadableToneColor('neutral', c)
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
                    text: 'Ring history overwrites old allocator events',
                    fontSize: 28,
                    fontWeight: 700,
                    color: c.textPrimary,
                }),
                Flow({
                    c,
                    direction: 'horizontal',
                    gap: 6,
                    connectorLength: 10,
                    stages: [
                        { title: 'Start', subtitle: 'Pre-OOM', tone: 'blue', width: 146 },
                        { title: 'OOM', subtitle: 'Captured', tone: 'red', width: 146 },
                        { title: 'Wrap', subtitle: 'Drops old', tone: 'warm', width: 146 },
                        { title: 'Dump', subtitle: 'Pre-exit', tone: 'green', width: 146 },
                    ],
                }),
                StackedBar({
                    c,
                    width: 668,
                    height: 30,
                    title: '100,000-entry ring buffer around incident',
                    showLegend: true,
                    segments: [
                        { label: 'Overwritten', value: 35, color: neutral },
                        { label: 'Retained + OOM', value: 50, color: green },
                        { label: 'Post-OOM', value: 15, color: blue },
                    ],
                }),
                Row({
                    gap: 12,
                    width: 668,
                    align: 'stretch',
                    children: [
                        Panel({
                            c,
                            title: 'Late recording',
                            tone: 'red',
                            width: 328,
                            children: TextLabel({
                                c,
                                text: 'Post-OOM misses event',
                                fontSize: 22,
                                color: red,
                                fontWeight: 600,
                            }),
                        }),
                        Panel({
                            c,
                            title: 'Hung dump',
                            tone: 'warm',
                            width: 328,
                            children: TextLabel({
                                c,
                                text: 'Enforce dump timeout',
                                fontSize: 22,
                                color: c.textPrimary,
                            }),
                        }),
                    ],
                }),
            ],
        }),
    })
}

export default create('dark')
