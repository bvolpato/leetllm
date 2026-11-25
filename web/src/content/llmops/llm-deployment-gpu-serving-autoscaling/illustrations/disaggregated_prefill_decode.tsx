import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 495
export const alt =
    'Top: disaggregated prefill-decode serving pipeline routes requests through a prefix-aware router to a compute-bound prefill pool, transfers KV blocks and layout metadata, and streams output from a bandwidth-bound decode pool. Bottom: dual-SLO scatter plot with a shaded green PASS zone (TTFT <= 1500 ms, TPOT <= 60 ms) shows short chat (820 ms, 44 ms) passing in a mixed pool while decode pressure (800 ms, 90 ms) and long-document surges (2450 ms, 93 ms) breach targets.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const warm = fig.tone('warm')
    const green = fig.tone('green')
    const red = fig.tone('critical')

    const soft = (hex: string, amount = 0.13) => tint(hex, c.bg, amount)

    // Top pipeline
    fig.text(20, 20, 'Disaggregated prefill-decode serving pipeline', {
        size: 16,
        weight: 700,
        color: c.textPrimary,
    })

    const stages = [
        { x: 20, title: 'Router', sub: 'Prefix-aware', color: blue },
        { x: 206, title: 'Prefill pool', sub: 'Compute-bound', color: purple },
        { x: 392, title: 'KV transfer', sub: 'Blocks + layout', color: warm },
        { x: 578, title: 'Decode pool', sub: 'BW-bound stream', color: green },
    ]
    const stageW = 162
    const stageH = 62
    const stageY = 44

    for (let i = 0; i < stages.length; i++) {
        const s = stages[i]!
        fig.rect(s.x, stageY, stageW, stageH, {
            fill: soft(s.color, 0.14),
            stroke: s.color,
            strokeWidth: 1.6,
            radius: 8,
        })
        fig.text(s.x + stageW / 2, stageY + 21, s.title, {
            size: 14.5,
            weight: 700,
            color: s.color,
            align: 'center',
        })
        fig.text(s.x + stageW / 2, stageY + 43, s.sub, {
            size: 13.5,
            color: c.textSecondary,
            align: 'center',
        })
        if (i < stages.length - 1) {
            fig.arrow(s.x + stageW + 3, stageY + stageH / 2, s.x + stageW + 21, stageY + stageH / 2, {
                color: c.textMuted,
                width: 1.8,
                head: 6,
            })
        }
    }

    // Bottom dual-SLO scatter plot with subtle shaded PASS zone
    fig.text(68, 134, 'Mixed-pool SLO evaluation (TTFT <= 1500 ms, TPOT <= 60 ms)', {
        size: 15.5,
        weight: 700,
        color: c.textPrimary,
    })

    const plot = fig.plot(
        { x: 68, y: 170, width: 656, height: 266 },
        { x: [0, 3000], y: [0, 120] },
    )

    // Subtle shaded PASS region drawn first under gridlines and marks
    const passW = plot.px(1500) - plot.area.x
    const passH = plot.bottom - plot.py(60)
    fig.rect(plot.area.x, plot.py(60), passW, passH, {
        fill: green,
        opacity: 0.11,
    })

    plot.axes({
        xTicks: [0, 500, 1000, 1500, 2000, 2500, 3000],
        yTicks: [0, 30, 60, 90, 120],
        xLabel: 'p95 TTFT (ms)',
        yLabel: 'p95 TPOT (ms)',
        grid: true,
        labelSize: 13.5,
    })

    // Explicit dashed SLO threshold lines framing the PASS zone
    plot.vline(1500, 'TTFT <= 1500 ms', {
        color: green,
        width: 1.5,
        dash: '5 4',
        labelPosition: 'top',
        labelOffset: 12,
        labelSize: 13.5,
        weight: 600,
    })
    plot.hline(60, 'TPOT <= 60 ms', {
        color: green,
        width: 1.5,
        dash: '5 4',
        labelPosition: 'right',
        labelOffset: 12,
        labelSize: 13.5,
        weight: 600,
    })

    // PASS zone label inside bottom-left of shaded region
    fig.text(plot.px(100), plot.py(12), 'PASS zone (mixed pool meets both SLOs)', {
        size: 13.5,
        weight: 700,
        color: green,
    })

    // 3 trace points with clear, non-overlapping annotations
    // 1. Short chat (820, 44) - PASS
    plot.point(820, 44, { color: green, r: 6.5 })
    fig.text(plot.px(820) + 12, plot.py(44) - 4, 'Chat 8% · PASS', {
        size: 13.5,
        weight: 700,
        color: green,
    })
    fig.text(plot.px(820) + 12, plot.py(44) + 15, '(820 ms, 44 ms)', {
        size: 13.5,
        color: c.textSecondary,
        mono: true,
    })

    // 2. Decode pressure (800, 90) - MISS (place label left in open space, clear of 1500 ms line)
    plot.point(800, 90, { color: warm, r: 6.5 })
    fig.text(plot.px(800) - 12, plot.py(90) - 8, 'Decode pressure · MISS', {
        size: 13.5,
        weight: 700,
        color: warm,
        align: 'right',
    })
    fig.text(plot.px(800) - 12, plot.py(90) + 11, '(800 ms, 90 ms)', {
        size: 13.5,
        color: c.textSecondary,
        align: 'right',
        mono: true,
    })

    // 3. Long-doc surge (2450, 93) - MISS
    plot.point(2450, 93, { color: red, r: 6.5 })
    fig.text(plot.px(2450) - 12, plot.py(93) - 8, 'Long-doc 61% · MISS', {
        size: 13.5,
        weight: 700,
        color: red,
        align: 'right',
    })
    fig.text(plot.px(2450) - 12, plot.py(93) + 11, '(2450 ms, 93 ms)', {
        size: 13.5,
        color: c.textSecondary,
        align: 'right',
        mono: true,
    })

    return fig.render()
}

export default create('dark')
