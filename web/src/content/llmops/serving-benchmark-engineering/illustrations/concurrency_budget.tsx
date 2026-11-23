import React from 'react'
import {
    LineChart,
    Scene,
    getReadableToneColor,
    getThemeColors,
    withDensity,
    type ThemeMode,
} from 'vizmatic'

export const width = 680
export const height = 750
export const autoSize = false
export const preset = 'engineering'
export const alt =
    'A Little’s Law throughput plot compares client concurrency limits from 1 to 8 slots against an offered rate of 3.0 requests per second with 0.9 second mean residence time (L = 2.7 active requests). A 1-slot client caps out at 1.11 RPS, a 2-slot cap reaches 2.22 RPS, and even a 3-slot cap falls short under Poisson arrival bursts before converging toward 3.00 RPS at 6 to 8 slots.'

const offeredRps = 3.0
const meanResidenceS = 0.9
const meanActive = offeredRps * meanResidenceS
const caps = [1, 2, 3, 4, 6, 8]

function carriedRps(c: number, trafficErlangs: number, rate: number): number {
    let b = 1.0
    for (let k = 1; k <= c; k++) {
        b = (trafficErlangs * b) / (k + trafficErlangs * b)
    }
    return Number((rate * (1 - b)).toFixed(2))
}

const labels = caps.map((c) => (c === 1 ? '1 slot' : `${c} slots`))
const offeredSeries = caps.map(() => offeredRps)
const ceilingSeries = caps.map((c) => Number(Math.min(offeredRps, c / meanResidenceS).toFixed(2)))
const poissonCarriedSeries = caps.map((c) => carriedRps(c, meanActive, offeredRps))

export function create(theme: ThemeMode = 'dark') {
    const base = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const c = withDensity({ ...base, shadow: 'transparent' }, 2.05)
    const blue = getReadableToneColor('blue', c)
    const purple = getReadableToneColor('purple', c)
    const warm = getReadableToneColor('warm', c)

    return Scene({
        c,
        density: 2.05,
        padding: 10,
        contentWidth: 640,
        children: LineChart({
            c,
            title: 'Client concurrency limits throttle open-loop load',
            subtitle: '3.0 RPS × 0.9 s residence = 2.7 slots (2 slots cap at 2.22 RPS)',
            width: 640,
            height: 290,
            labels,
            min: 0,
            max: 3.3,
            yAxisLabel: 'RPS',
            showGrid: true,
            showPoints: true,
            directLabels: false,
            series: [
                { name: 'Target 3.0', points: offeredSeries, color: blue },
                { name: 'Cap c/W', points: ceilingSeries, color: purple },
                { name: 'Poisson bursts', points: poissonCarriedSeries, color: warm },
            ],
            ariaLabel: alt,
        }),
    })
}

export default create('dark')
