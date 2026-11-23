import React from 'react'
import {
    Column,
    LineChart,
    Scene,
    getReadableToneColor,
    getThemeColors,
    withDensity,
    type ThemeMode,
} from 'vizmatic'

export const width = 680
export const height = 780
export const autoSize = false
export const preset = 'engineering'
export const alt =
    'Stacked operating curves sweep offered rate from 0.5 to 2.5 requests per second across 200 trials per point. Upper plot shows SLO attainment staying at 100%, 100%, and 95% through 1.5 RPS with flat backlog, then dropping to 80% at 2.0 RPS and 58% at 2.5 RPS. Lower plot shows arrival-window goodput peaking at 1.60 qualified RPS at 2.0 RPS even though that rate fails the 95% SLO floor.'

const rates = ['0.5', '1.0', '1.5', '2.0', '2.5']
const attainmentPct = [100, 100, 95, 80, 58]
const sloGatePct = [95, 95, 95, 95, 95]
const goodputRps = [0.5, 1.0, 1.43, 1.6, 1.45]
const offeredRps = [0.5, 1.0, 1.5, 2.0, 2.5]

export function create(theme: ThemeMode = 'dark') {
    const base = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const c = withDensity({ ...base, shadow: 'transparent' }, 2.05)
    const green = getReadableToneColor('green', c)
    const purple = getReadableToneColor('purple', c)
    const blue = getReadableToneColor('blue', c)
    const warm = getReadableToneColor('warm', c)

    return Scene({
        c,
        density: 2.05,
        padding: 10,
        gap: 6,
        contentWidth: 640,
        children: Column({
            gap: 6,
            width: 640,
            children: [
                LineChart({
                    c,
                    width: 640,
                    height: 195,
                    title: 'SLO attainment falls past 1.5 RPS',
                    labels: rates,
                    min: 45,
                    max: 105,
                    yAxisLabel: '%',
                    showGrid: true,
                    showPoints: true,
                    directLabels: false,
                    series: [
                        { name: 'Attainment', points: attainmentPct, color: blue },
                        { name: '95% floor', points: sloGatePct, color: purple },
                    ],
                    ariaLabel: 'SLO attainment across offered RPS from 0.5 to 2.5',
                }),
                LineChart({
                    c,
                    width: 640,
                    height: 195,
                    title: 'Goodput peaks at 2.0 RPS while failing SLO',
                    labels: rates,
                    min: 0,
                    max: 2.7,
                    yAxisLabel: 'RPS',
                    showGrid: true,
                    showPoints: true,
                    directLabels: false,
                    series: [
                        { name: 'Offered RPS', points: offeredRps, color: warm },
                        { name: 'Goodput', points: goodputRps, color: green },
                    ],
                    ariaLabel: 'Goodput versus offered RPS from 0.5 to 2.5',
                }),
            ],
        }),
    })
}

export default create('dark')
