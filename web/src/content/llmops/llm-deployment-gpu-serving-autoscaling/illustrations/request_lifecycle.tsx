import { getReadableTextColor, type ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 478
export const alt =
    'Top: proportional 500 ms request composition bar shows 180 ms queue wait plus 120 ms prefill yielding a 300 ms TTFT, followed by 200 ms decode across four tokens arriving at 300, 340, 380, and 500 ms. Bottom: inter-token gap bar chart with a horizontal dashed 66.7 ms mean TPOT line shows 40 ms, 40 ms, and a 120 ms tail stall.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const warm = fig.tone('warm')
    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const red = fig.tone('critical')

    // Top section: Proportional 0..500 ms request timeline
    fig.text(64, 20, 'End-to-end 500 ms request composition (TTFT = 300 ms)', {
        size: 16,
        weight: 700,
        color: c.textPrimary,
    })

    const barX = 64
    const barY = 48
    const barWTotal = 666
    const barH = 40
    const msToX = (ms: number) => barX + (ms / 500) * barWTotal

    const phases = [
        { start: 0, end: 180, label: 'Queue · 180 ms', color: warm },
        { start: 180, end: 300, label: 'Prefill · 120 ms', color: blue },
        { start: 300, end: 500, label: 'Decode · 200 ms', color: green },
    ]

    for (const p of phases) {
        const x1 = msToX(p.start)
        const x2 = msToX(p.end)
        const fill = tint(p.color, c.bg, 0.34)
        fig.rect(x1, barY, x2 - x1 - 2, barH, {
            fill,
            stroke: p.color,
            strokeWidth: 1.6,
            radius: 5,
        })
        const ink = getReadableTextColor(fill, c, c.bg)
        fig.text((x1 + x2) / 2, barY + barH / 2, p.label, {
            size: 13.5,
            weight: 700,
            color: ink,
            align: 'center',
        })
    }

    // Token arrival markers inside decode segment (300, 340, 380, 500 ms), staggered cleanly
    for (const [ms, tag, stagger] of [
        [300, 't1 300', false],
        [340, 't2 340', true],
        [380, 't3 380', false],
        [500, 't4 500', false],
    ] as const) {
        const tx = msToX(ms)
        const tickLen = stagger ? 30 : 10
        fig.line(tx, barY + barH + 2, tx, barY + barH + tickLen, {
            color: ms === 500 ? red : c.textSecondary,
            width: 1.4,
        })
        fig.text(tx, barY + barH + tickLen + 12, tag, {
            size: 13.5,
            weight: 600,
            color: ms === 500 ? red : c.textSecondary,
            align: ms === 300 ? 'left' : ms === 500 ? 'right' : 'center',
            mono: true,
        })
    }

    // Curly brace under Queue + Prefill showing TTFT = 300 ms
    fig.brace(msToX(0), barY + barH + 8, msToX(292), barY + barH + 8, 'TTFT = 300 ms', {
        side: 1,
        depth: 10,
        labelGap: 14,
        color: blue,
        labelColor: blue,
        labelSize: 13.5,
        weight: 700,
    })

    // Bottom section: Inter-token gap bars with horizontal dashed 66.7 ms mean TPOT line
    fig.text(64, 170, 'Per-token decode gaps vs 66.7 ms mean TPOT', {
        size: 16,
        weight: 700,
        color: c.textPrimary,
    })

    const plot = fig.plot(
        { x: 64, y: 206, width: 666, height: 210 },
        { x: [0, 3], y: [0, 150] },
    )
    plot.axes({
        yTicks: [0, 50, 100, 150],
        yFormat: (v) => `${v} ms`,
        yLabel: 'Inter-token gap (ms)',
        grid: true,
        labelSize: 13.5,
    })

    const gaps = [
        { cx: 0.5, label: 'Gap 1 (tok 1 -> 2)', sub: '300 -> 340 ms', value: 40, color: green },
        { cx: 1.5, label: 'Gap 2 (tok 2 -> 3)', sub: '340 -> 380 ms', value: 40, color: green },
        { cx: 2.5, label: 'Gap 3 (tok 3 -> 4)', sub: '380 -> 500 ms (stall)', value: 120, color: red },
    ]
    const barW = 92
    for (const g of gaps) {
        const x = plot.px(g.cx) - barW / 2
        const yTop = plot.py(g.value)
        const h = plot.bottom - yTop
        fig.rect(x, yTop, barW, h, {
            fill: tint(g.color, c.bg, 0.3),
            stroke: g.color,
            strokeWidth: 1.7,
            radius: 5,
        })
        fig.text(plot.px(g.cx), yTop - 13, `${g.value} ms`, {
            size: 14.5,
            weight: 700,
            color: g.color,
            align: 'center',
            mono: true,
        })
        fig.text(plot.px(g.cx), plot.bottom + 18, g.label, {
            size: 13.5,
            weight: 700,
            color: c.textPrimary,
            align: 'center',
        })
        fig.text(plot.px(g.cx), plot.bottom + 38, g.sub, {
            size: 13.5,
            color: g.color === red ? red : c.textSecondary,
            align: 'center',
            mono: true,
        })
    }

    // Horizontal dashed 66.7 ms mean TPOT reference line across all gap bars
    plot.hline(66.7, '66.7 ms mean TPOT', {
        color: blue,
        width: 1.8,
        dash: '5 4',
        labelPosition: 'left',
        labelOffset: 13,
        labelSize: 13.5,
        weight: 700,
    })

    return fig.render()
}

export default create('dark')
