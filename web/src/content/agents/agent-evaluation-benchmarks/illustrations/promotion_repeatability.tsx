import React from 'react'
import type { ThemeMode } from 'vizmatic'
import { Figure } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 385
export const alt =
    'Line chart comparing pass@k (at least one passing run across k trials) against pass^k (all k runs succeeding) at single-trial success rate p = 0.70. From k = 1 to 6, pass@k rises from 70% to 100% while pass^k falls from 70% down to 12%.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const c = fig.c
    const green = fig.tone('green')
    const red = fig.tone('red')

    const area = { x: 84, y: 38, width: 514, height: 286 }
    const plot = fig.plot(area, { x: [1, 6], y: [0, 105] })

    plot.axes({
        xTicks: [1, 2, 3, 4, 5, 6],
        yTicks: [0, 25, 50, 75, 100],
        xFormat: (v) => `k = ${v}`,
        yFormat: (v) => `${v}%`,
        xLabel: 'Trials per task (p = 0.70 single-run success)',
        yLabel: 'Probability (%)',
        grid: true,
        labelSize: 13,
    })

    const passAtK: [number, number][] = [
        [1, 70],
        [2, 91],
        [3, 97],
        [4, 99],
        [5, 100],
        [6, 100],
    ]
    const passPowK: [number, number][] = [
        [1, 70],
        [2, 49],
        [3, 34],
        [4, 24],
        [5, 17],
        [6, 12],
    ]

    plot.band(passPowK, passAtK, { fill: c.textMuted, fillOpacity: theme === 'light' ? 0.08 : 0.09, smooth: true })
    plot.smoothCurve(passAtK, { color: green, width: 2.8 })
    plot.smoothCurve(passPowK, { color: red, width: 2.8 })

    for (const [k, v] of passAtK) plot.point(k, v, { color: green, r: 4.5 })
    for (const [k, v] of passPowK) plot.point(k, v, { color: red, r: 4.5 })

    // Direct end labels cleanly to the right of k=6
    fig.text(plot.px(6) + 12, plot.py(100) - 8, 'pass@k (any)', {
        size: 14,
        weight: 700,
        color: green,
    })
    fig.math(plot.px(6) + 12, plot.py(100) + 14, '1 - (1-p)^k \\to 100\\%', {
        size: 13,
        color: c.textSecondary,
    })

    fig.text(plot.px(6) + 12, plot.py(12) - 8, 'pass^k (all)', {
        size: 14,
        weight: 700,
        color: red,
    })
    fig.math(plot.px(6) + 12, plot.py(12) + 14, 'p^k \\to 12\\%', {
        size: 13,
        color: c.textSecondary,
    })

    // Gap callout
    fig.text(plot.px(4.2), plot.py(60), 'reliability gap', {
        size: 13,
        weight: 600,
        color: c.textSecondary,
        align: 'center',
    })

    return fig.render()
}

export default create('dark')
