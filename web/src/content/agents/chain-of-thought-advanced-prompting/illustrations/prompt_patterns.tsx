import React from 'react'
import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 840
export const height = 430
export const alt =
    'Scatter plot comparing four reasoning strategies by p95 latency (ms) and task accuracy (%). Direct (190 ms, 76%) and CoT-1 (360 ms, 84%) fall below the 90% accuracy target. ToT (1,840 ms, 96%) exceeds the 900 ms latency budget. Only Vote-5 (740 ms, 94%) lands inside the passing top-left target region.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const c = fig.c
    const green = fig.tone('green')
    const blue = fig.tone('blue')
    const warm = fig.tone('warm')
    const purple = fig.tone('purple')
    const red = fig.tone('red')

    const area = { x: 86, y: 40, width: 706, height: 324 }
    const plot = fig.plot(area, { x: [0, 2000], y: [60, 100] })

    // Shaded top-left target region (<= 900 ms, >= 90% accuracy)
    const tx = plot.px(900)
    const ty = plot.py(90)
    fig.rect(area.x, area.y, tx - area.x, ty - area.y, {
        fill: tint(green, c.bg, theme === 'light' ? 0.11 : 0.14),
    })

    // Subtle quadrant labels with guaranteed dark + light contrast
    fig.text(area.x + 14, area.y + 18, 'Meets Latency & Accuracy Target', {
        size: 13.5,
        weight: 700,
        color: green,
    })
    fig.text(plot.right - 12, area.y + 18, 'High Accuracy, Over Latency Cap', {
        size: 13,
        weight: 600,
        color: purple,
        align: 'right',
    })
    fig.text(area.x + 14, plot.bottom - 16, 'Fast, Below Accuracy Floor', {
        size: 13,
        color: c.textSecondary,
    })
    fig.text(plot.right - 12, plot.bottom - 16, 'Misses Both Targets', {
        size: 13,
        color: c.textMuted,
        align: 'right',
    })

    plot.axes({
        xTicks: [0, 500, 1000, 1500, 2000],
        yTicks: [60, 70, 80, 90, 100],
        xFormat: (v) => `${v} ms`,
        yFormat: (v) => `${v}%`,
        xLabel: 'p95 Latency (ms)',
        yLabel: 'Task Accuracy (%)',
        grid: true,
        labelSize: 13,
    })

    // Threshold lines
    plot.vline(900, '900 ms cap', {
        color: red,
        labelColor: red,
        labelPosition: 'bottom',
        labelOffset: 18,
        labelSize: 12.5,
        weight: 700,
        align: 'left',
    })
    plot.hline(90, '90% accuracy floor', {
        color: green,
        labelColor: green,
        labelPosition: 'left',
        labelOffset: 12,
        labelSize: 12.5,
        weight: 700,
    })

    // Smooth Pareto frontier connecting the four strategies
    const pts: { x: number; y: number; name: string; stat: string; color: string; dx: number; dy: number; align: 'left' | 'right' | 'center' }[] = [
        { x: 190, y: 76, name: 'Direct', stat: '190 ms · 76%', color: warm, dx: 12, dy: -6, align: 'left' },
        { x: 360, y: 84, name: 'CoT-1', stat: '360 ms · 84%', color: blue, dx: 12, dy: -6, align: 'left' },
        { x: 740, y: 94, name: 'Vote-5', stat: '740 ms · 94%', color: green, dx: -18, dy: -16, align: 'right' },
        { x: 1840, y: 96, name: 'ToT', stat: '1,840 ms · 96%', color: purple, dx: -14, dy: 14, align: 'right' },
    ]
    plot.smoothCurve(
        pts.map((p) => [p.x, p.y] as const),
        { color: c.textMuted, width: 1.6, dash: '4 4', opacity: 0.7 },
    )

    for (const p of pts) {
        const px = plot.px(p.x)
        const py = plot.py(p.y)
        if (p.name === 'Vote-5') {
            fig.circle(px, py, 12, { fill: tint(green, c.bg, 0.25), stroke: green, width: 1.6 })
        }
        plot.point(p.x, p.y, { color: p.color, r: 6 })
        fig.text(px + p.dx, py + p.dy, p.name, {
            size: 14.5,
            weight: 700,
            color: p.color,
            align: p.align,
        })
        fig.text(px + p.dx, py + p.dy + 17, p.stat, {
            size: 12.5,
            mono: true,
            color: c.textSecondary,
            align: p.align,
        })
    }

    return fig.render()
}

export default create('dark')
