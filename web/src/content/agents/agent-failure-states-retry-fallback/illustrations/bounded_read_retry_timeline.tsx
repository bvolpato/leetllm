import React from 'react'
import type { ThemeMode } from 'vizmatic'
import { Figure } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 385
export const alt =
    'Line chart comparing remaining 10-second caller deadline budget against next jittered backoff wait across attempts 1 through 5. At Try 5, the 6.4s backoff wait exceeds the remaining 5.1s budget, triggering a clean bounded stop.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const c = fig.c
    const green = fig.tone('green')
    const red = fig.tone('red')
    const warm = fig.tone('warm')

    const area = { x: 80, y: 38, width: 526, height: 286 }
    const plot = fig.plot(area, { x: [1, 5], y: [0, 10.5] })

    plot.axes({
        xTicks: [1, 2, 3, 4, 5],
        yTicks: [0, 2.5, 5, 7.5, 10],
        xFormat: (v) => `Try ${v}`,
        yFormat: (v) => `${v}s`,
        xLabel: 'Retry attempt',
        yLabel: 'Seconds',
        grid: true,
        labelSize: 13,
    })

    const budget: [number, number][] = [
        [1, 10.0],
        [2, 9.69],
        [3, 9.38],
        [4, 8.2],
        [5, 5.1],
    ]
    const wait: [number, number][] = [
        [1, 0.31],
        [2, 0.31],
        [3, 1.18],
        [4, 3.1],
        [5, 6.4],
    ]

    plot.smoothCurve(budget, { color: green, width: 2.8 })
    plot.smoothCurve(wait, { color: red, width: 2.8 })
    for (const [x, y] of budget) plot.point(x, y, { color: green, r: 4.5 })
    for (const [x, y] of wait) plot.point(x, y, { color: red, r: 4.5 })

    // Crossover marker where Next Wait overtakes Budget Left (~x = 4.8)
    const crossX = 4.79
    const crossY = 5.75
    fig.line(plot.px(crossX), plot.py(crossY), plot.px(crossX), plot.bottom, {
        color: warm,
        width: 1.4,
        dash: '4 4',
    })
    plot.point(crossX, crossY, { color: warm, r: 5.5 })
    fig.callout(
        [plot.px(crossX) - 6, plot.py(crossY) - 4],
        [plot.px(3.5), plot.py(6.1)],
        'Wait > Budget → Stop cleanly',
        { color: warm, labelColor: warm, size: 13.5, weight: 700, align: 'right', bend: 0.16 },
    )

    // Direct end labels cleanly right of Try 5
    fig.text(plot.px(5) + 12, plot.py(6.4), 'Next Wait (6.4s)', {
        size: 13.5,
        weight: 700,
        color: red,
    })
    fig.text(plot.px(5) + 12, plot.py(5.1), 'Budget Left (5.1s)', {
        size: 13.5,
        weight: 700,
        color: green,
    })

    return fig.render()
}

export default create('dark')
