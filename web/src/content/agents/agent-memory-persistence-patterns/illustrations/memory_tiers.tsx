import React from 'react'
import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 900
export const height = 415
export const alt =
    'Dual quantitative comparison of four agent memory tiers across capacity, access latency, and durability: Procedural rules (KB, ~2 ms, pinned), Working context (tokens, ~9 ms, volatile per call), Episodic logs (MB, ~23 ms, session), and Semantic vector store (GB, ~50 ms, durable with ACL/TTL filtering).'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const c = fig.c
    const purple = fig.tone('purple')
    const blue = fig.tone('blue')
    const cyan = fig.tone('cyan')
    const green = fig.tone('green')

    // Left: Capacity (log) vs Access Latency (ms)
    const leftArea = { x: 76, y: 54, width: 438, height: 286 }
    fig.text(leftArea.x + leftArea.width / 2, 22, 'Capacity vs. Read Latency', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
    })
    const leftPlot = fig.plot(leftArea, { x: [0, 9], y: [0, 60] })
    const capMap: Record<number, string> = { 0: '1 KB', 3: '1 MB', 6: '1 GB', 9: '1 TB' }
    leftPlot.axes({
        xTicks: [0, 3, 6, 9],
        yTicks: [0, 20, 40, 60],
        xFormat: (v) => capMap[v] ?? '',
        yFormat: (v) => `${v} ms`,
        xLabel: 'Storage capacity (log scale)',
        yLabel: 'Latency (ms)',
        grid: true,
        labelSize: 13,
    })

    const pts = [
        { x: 0.9, y: 2, label: 'Procedural (KB)', color: purple, dx: 10, dy: -16, align: 'left' as const },
        { x: 2.8, y: 9, label: 'Working (tokens)', color: blue, dx: 12, dy: -4, align: 'left' as const },
        { x: 5.0, y: 23, label: 'Episodic (MB)', color: cyan, dx: 12, dy: -2, align: 'left' as const },
        { x: 7.4, y: 50, label: 'Semantic (GB)', color: green, dx: -12, dy: -2, align: 'right' as const },
    ]
    leftPlot.smoothCurve(
        pts.map((p) => [p.x, p.y] as const),
        { color: c.textMuted, width: 1.5, dash: '4 4', opacity: 0.65 },
    )
    for (const p of pts) {
        leftPlot.point(p.x, p.y, { color: p.color, r: 6.5 })
        fig.text(leftPlot.px(p.x) + p.dx, leftPlot.py(p.y) + p.dy, p.label, {
            size: 13.5,
            weight: 700,
            color: p.color,
            align: p.align,
        })
    }

    // Center hairline divider
    fig.line(542, 22, 542, 368, { color: c.borderSubtle, width: 1, dash: '4 4' })

    // Right: Durability Horizon bars (frameless)
    const rightArea = { x: 616, y: 54, width: 256, height: 286 }
    fig.text(rightArea.x + rightArea.width / 2, 22, 'Durability Horizon', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
    })
    const rightPlot = fig.plot(rightArea, { x: [0, 4], y: [0, 4.6] })
    const durTicks = [
        { y: 0.2, label: '1 call' },
        { y: 1.5, label: '1 day' },
        { y: 3.0, label: '1 mo' },
        { y: 4.3, label: '1+ yr' },
    ]
    for (const tk of durTicks) {
        const py = rightPlot.py(tk.y)
        fig.line(rightArea.x, py, rightPlot.right, py, { color: c.borderSubtle, width: 1, dash: '3 4' })
        fig.text(rightArea.x - 10, py, tk.label, {
            size: 12.5,
            mono: true,
            color: c.textSecondary,
            align: 'right',
        })
    }
    fig.line(rightArea.x, rightPlot.bottom, rightPlot.right, rightPlot.bottom, { color: c.textMuted, width: 1.2 })

    const durBars = [
        { label: 'Work', tag: 'Volatile', val: 0.35, color: blue },
        { label: 'Epis', tag: 'Session', val: 1.55, color: cyan },
        { label: 'Sem', tag: 'Durable', val: 3.9, color: green },
        { label: 'Proc', tag: 'Pinned', val: 4.3, color: purple },
    ]
    const slotW = rightArea.width / durBars.length
    const barW = 42
    durBars.forEach((b, i) => {
        const cx = rightArea.x + i * slotW + slotW / 2
        const topY = rightPlot.py(b.val)
        fig.rect(cx - barW / 2, topY, barW, rightPlot.bottom - topY, { fill: b.color, radius: 5 })
        fig.text(cx, topY - 12, b.tag, { size: 12.5, weight: 700, color: b.color, align: 'center' })
        fig.text(cx, rightPlot.bottom + 18, b.label, { size: 13, weight: 600, color: c.textPrimary, align: 'center' })
    })

    // Bottom clean notes
    fig.text(295, 396, 'Working + KV Cache: volatile prefix reuse', { size: 12.5, color: blue, align: 'center' })
    fig.text(722, 396, 'External Recall: filtered by ACL, version & TTL', { size: 12.5, color: green, align: 'center' })

    return fig.render()
}

export default create('dark')
