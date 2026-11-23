import React from 'react'
import {
    Column,
    MetricCard,
    Panel,
    Row,
    Scene,
    StackedBar,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
    withDensity,
} from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 600
export const height = 740
export const alt =
    'BF16 weight pool comparison: 3B shared weights plus eight 2B expert partitions occupy 19B parameters (38 GB). One token computes with 3B shared weights plus two 2B selected partitions, or 7B parameters (14 GB). All 38 GB stay in memory, leaving a 24 GB shortfall on a 14 GB budget.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const cd = withDensity(c, 1.85)
    const purple = getReadableToneColor('purple', c)
    const blue = getReadableToneColor('blue', c)
    const neutral = getReadableToneColor('neutral', c)
    const warn = getReadableToneColor('warm', c)

    return Scene({
        c,
        padding: 12,
        gap: 10,
        contentWidth: 576,
        children: Column({
            gap: 10,
            align: 'center',
            children: [
                Panel({
                    c: cd,
                    title: 'Stored pool: 19B weights require residency (38 GB)',
                    titleFontSize: 20,
                    width: 572,
                    padding: 10,
                    gap: 6,
                    children: [
                        StackedBar({
                            c: cd,
                            width: 544,
                            height: 68,
                            showLegend: true,
                            segments: [
                                {
                                    label: 'Shared',
                                    value: 6,
                                    color: purple,
                                    valueLabel: '6 GB',
                                },
                                {
                                    label: '2 active',
                                    value: 8,
                                    color: blue,
                                    valueLabel: '8 GB',
                                },
                                {
                                    label: '6 idle',
                                    value: 24,
                                    color: neutral,
                                    valueLabel: '24 GB',
                                },
                            ],
                        }),
                        TextLabel({
                            c,
                            text: 'All 8 expert partitions (16B) + 3B shared stay in memory.',
                            fontSize: 18,
                            color: c.textSecondary,
                        }),
                    ],
                }),
                Panel({
                    c: cd,
                    title: 'Active per token: 7B run vs 14 GB budget',
                    titleFontSize: 20,
                    width: 572,
                    padding: 10,
                    gap: 8,
                    children: [
                        StackedBar({
                            c: cd,
                            width: 544,
                            height: 68,
                            showLegend: true,
                            segments: [
                                {
                                    label: 'Shared',
                                    value: 6,
                                    color: purple,
                                    valueLabel: '6 GB',
                                },
                                {
                                    label: '2 active',
                                    value: 8,
                                    color: blue,
                                    valueLabel: '8 GB',
                                },
                                {
                                    label: 'Shortfall',
                                    value: 24,
                                    color: warn,
                                    valueLabel: '+24 GB over',
                                },
                            ],
                        }),
                        Row({
                            gap: 8,
                            children: [
                                MetricCard({
                                    c: cd,
                                    label: 'Stored pool',
                                    value: '38 GB',
                                    valueFontSize: 28,
                                    detail: '19B weights',
                                    tone: 'neutral',
                                    width: 170,
                                }),
                                MetricCard({
                                    c: cd,
                                    label: 'Active compute',
                                    value: '14 GB',
                                    valueFontSize: 28,
                                    detail: '7B weights',
                                    tone: 'blue',
                                    width: 170,
                                }),
                                MetricCard({
                                    c: cd,
                                    label: '14 GB budget',
                                    value: '−24 GB',
                                    valueFontSize: 28,
                                    detail: '6 idle missing',
                                    tone: 'warm',
                                    width: 170,
                                }),
                            ],
                        }),
                    ],
                }),
            ],
        }),
    })
}

export default create('dark')
