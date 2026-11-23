import React from 'react'
import {
    Column,
    LineChart,
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
    'Autoscaler replica and queueing dynamics over 450 seconds: desired replicas jump immediately from 4 to 12 during the traffic burst while ready capacity stays at 4 across the 207-second cold startup lag, pushing queue backlog up before draining once new GPUs warm up. After demand drops at 100 s, a 300-second cooldown holds capacity steady until gracefully draining one replica at 400 s.'

export function create(theme: ThemeMode = 'dark') {
    const base = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const c = withDensity({ ...base, shadow: 'transparent' }, 2.15)
    const blue = getReadableToneColor('blue', c)
    const green = getReadableToneColor('green', c)
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
                    text: 'Cold startup lag spikes queue depth; cooldown stops thrashing',
                    fontSize: 27,
                    fontWeight: 700,
                    color: base.textPrimary,
                }),
                LineChart({
                    c,
                    width: 636,
                    height: 280,
                    min: 0,
                    max: 18,
                    directLabels: false,
                    showGrid: true,
                    showPoints: true,
                    yAxisLabel: 'Replicas / queue (x5)',
                    labels: ['0', '60', '120', '207', '260', '350', '400', '450s'],
                    series: [
                        {
                            name: 'Desired replicas',
                            points: [4, 10, 12, 12, 12, 12, 11, 11],
                            color: blue,
                        },
                        {
                            name: 'Ready replicas',
                            points: [4, 4, 4, 12, 12, 12, 11, 11],
                            color: green,
                        },
                        { name: 'Queue (/5)', points: [10, 14, 16, 4, 1, 0, 0, 0], color: red },
                    ],
                    ariaLabel: alt,
                }),
                StackedBar({
                    c,
                    width: 668,
                    height: 28,
                    title: '300 s cooldown + stale telemetry safeguard',
                    showLegend: true,
                    segments: [
                        { label: 'Cold ramp 0-207s', value: 207, color: red },
                        { label: 'Cooldown 100-399s', value: 299, color: blue },
                        { label: 'Drain 400s', value: 44, color: green },
                    ],
                }),
            ],
        }),
    })
}

export default create('dark')
