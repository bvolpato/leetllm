import React from 'react'
import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 900
export const height = 390
export const alt =
    'Dual quantitative comparison of unbounded queueing versus load shedding at a 0.25s TTFT limit. Left: p95 wait in an unbounded queue climbs to 0.56s at 98% load while load shedding caps accepted wait at 0.24s. Right: for a 125k tok/s cluster, caller RPM limit fails fast with 429 (0s wait), 20k tokens clear in 0.16s, 31.25k hits the 0.25s SLO cap, and 50k sheds with 503 at 0.40s.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const c = fig.c
    const red = fig.tone('red')
    const green = fig.tone('green')
    const blue = fig.tone('blue')
    const warm = fig.tone('warm')

    // Left: Queue Wait Across Fleet Load (Line chart with round 0..0.6 ticks)
    const leftArea = { x: 74, y: 80, width: 376, height: 242 }
    fig.text(leftArea.x + leftArea.width / 2, 20, 'Queue Wait Across Fleet Load', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
    })
    fig.text(leftArea.x + leftArea.width / 2, 40, 'Shedding keeps accepted p95 under 0.25s SLO', {
        size: 12.5,
        color: c.textSecondary,
        align: 'center',
    })

    const lPlot = fig.plot(leftArea, { x: [60, 100], y: [0, 0.6] })
    lPlot.axes({
        xTicks: [60, 70, 80, 90, 100],
        yTicks: [0, 0.2, 0.4, 0.6],
        xFormat: (v) => `${v}%`,
        yFormat: (v) => `${v.toFixed(1)}s`,
        xLabel: 'Fleet utilization (%)',
        yLabel: 'p95 Wait (s)',
        grid: true,
        labelSize: 12.5,
    })

    const unbounded: [number, number][] = [
        [60, 0.06],
        [70, 0.09],
        [80, 0.15],
        [88, 0.27],
        [94, 0.41],
        [98, 0.56],
    ]
    const shed: [number, number][] = [
        [60, 0.06],
        [70, 0.09],
        [80, 0.15],
        [88, 0.21],
        [94, 0.23],
        [98, 0.24],
    ]

    lPlot.hline(0.25, '0.25s SLO cap', {
        color: blue,
        labelColor: blue,
        labelPosition: 'left',
        labelOffset: 10,
        labelSize: 12.5,
        weight: 700,
    })
    lPlot.band(shed, unbounded, { fill: red, fillOpacity: theme === 'light' ? 0.1 : 0.13, smooth: true })
    lPlot.smoothCurve(unbounded, { color: red, width: 2.6 })
    lPlot.smoothCurve(shed, { color: green, width: 2.6 })
    for (const [x, y] of unbounded) lPlot.point(x, y, { color: red, r: 4 })
    for (const [x, y] of shed) lPlot.point(x, y, { color: green, r: 4 })

    fig.text(lPlot.px(95), lPlot.py(0.57), 'Unbounded (0.56s)', {
        size: 12.5,
        weight: 700,
        color: red,
        align: 'right',
    })
    fig.text(lPlot.px(97), lPlot.py(0.18), 'Shed >0.25s', {
        size: 12.5,
        weight: 700,
        color: green,
        align: 'right',
    })

    // Center divider
    fig.line(478, 22, 478, 366, { color: c.borderSubtle, width: 1, dash: '4 4' })

    // Right: 429 Caller Limit vs 503 Queue Cap (125k tok/s cluster)
    const rightArea = { x: 544, y: 66, width: 326, height: 256 }
    fig.text(rightArea.x + rightArea.width / 2, 22, '429 Caller Limit vs. 503 Queue Cap', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
    })
    fig.text(rightArea.x + rightArea.width / 2, 42, '125k tok/s cluster: caller RPM vs. backlog SLO', {
        size: 12.5,
        color: c.textSecondary,
        align: 'center',
    })

    const rPlot = fig.plot(rightArea, { x: [0, 4], y: [0, 0.5] })
    for (const tk of [0, 0.1, 0.2, 0.3, 0.4, 0.5]) {
        const py = rPlot.py(tk)
        fig.line(rightArea.x, py, rPlot.right, py, {
            color: tk === 0 ? c.textMuted : c.borderSubtle,
            width: tk === 0 ? 1.2 : 1,
            dash: tk === 0 ? undefined : '3 4',
        })
        fig.text(rightArea.x - 8, py, `${tk.toFixed(1)}s`, {
            size: 12,
            mono: true,
            color: c.textSecondary,
            align: 'right',
        })
    }
    rPlot.hline(0.25, '0.25s cap', {
        color: blue,
        labelColor: blue,
        labelPosition: 'left',
        labelOffset: 10,
        labelSize: 12,
        weight: 700,
    })

    const rBars = [
        { label: 'RPM 429', sub: 'pre-queue', val: 0.0, color: warm },
        { label: '20k OK', sub: 'admitted', val: 0.16, color: green },
        { label: 'SLO cap', sub: '31.25k tok', val: 0.25, color: blue },
        { label: '50k 503', sub: 'shed', val: 0.4, color: red },
    ]
    const sw = rightArea.width / 4
    const bw = 46
    rBars.forEach((b, i) => {
        const cx = rightArea.x + i * sw + sw / 2
        const h = Math.max(b.val > 0 ? 6 : 3, (b.val / 0.5) * rightArea.height)
        const topY = rPlot.bottom - h
        fig.rect(cx - bw / 2, topY, bw, h, { fill: b.color, radius: 5 })
        fig.text(cx, topY - 12, `${b.val.toFixed(2)}s`, {
            size: 12.5,
            mono: true,
            weight: 700,
            color: b.color,
            align: 'center',
        })
        fig.text(cx, rPlot.bottom + 18, b.label, {
            size: 13,
            weight: 700,
            color: c.textPrimary,
            align: 'center',
        })
        fig.text(cx, rPlot.bottom + 36, b.sub, {
            size: 11.5,
            color: c.textSecondary,
            align: 'center',
        })
    })

    return fig.render()
}

export default create('dark')
