import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 860
export const height = 410
export const alt =
    'Left: shared 0 to 350 ms scale comparing an immediate 183 ms serial budget (12 parse, 55 net, 28 context, 78 queue and model, 10 paint, leaving 17 ms headroom to 200 ms) against a 333 ms debounced lane adding 150 ms debounce. Right: 20 traces with rows (100,1), (1,100), and eighteen (1,1) show whole-trace p95 is 101 ms while summing stage p95 values gives only 2 ms.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const cyan = fig.tone('cyan')
    const red = fig.tone('critical')

    // Left: Aligned Gantt waterfall on shared 0..350 ms scale
    fig.text(28, 22, 'Serial Edit-to-Paint Budget', { size: 15, weight: 700 })

    const plotLeft = fig.plot({ x: 32, y: 58, width: 420, height: 196 }, { x: [0, 350], y: [0, 10] })

    // Grid & 200 ms SLO line
    for (const tick of [0, 100, 200, 300]) {
        const tx = plotLeft.px(tick)
        fig.line(tx, 58, tx, 254, {
            color: tick === 200 ? red : c.borderSubtle,
            width: tick === 200 ? 1.4 : 1,
            dash: tick === 200 ? '4 3' : undefined,
        })
        fig.line(tx, 254, tx, 259, { color: c.textMuted, width: 1 })
        fig.text(tx, 272, `${tick} ms`, {
            size: 13,
            color: tick === 200 ? red : c.textSecondary,
            align: 'center',
            mono: true,
            weight: tick === 200 ? 700 : 400,
        })
    }
    fig.line(plotLeft.px(0), 254, plotLeft.px(350), 254, { color: c.textMuted, width: 1 })
    fig.text(plotLeft.px(200) + 6, 66, '200 ms SLO', { size: 12, color: red, weight: 700 })

    const stages = [
        { name: 'Parse', ms: 12, color: blue },
        { name: 'Net', ms: 55, color: purple },
        { name: 'Ctx', ms: 28, color: green },
        { name: 'Model', ms: 78, color: warm },
        { name: 'Paint', ms: 10, color: cyan },
    ]

    const drawLane = (y: number, offsetMs: number) => {
        if (offsetMs > 0) {
            const x0 = plotLeft.px(0)
            const x1 = plotLeft.px(offsetMs)
            fig.rect(x0, y, x1 - x0, 34, {
                fill: tint(c.textMuted, c.bg, 0.22),
                stroke: c.border,
                strokeWidth: 1,
                radius: 4,
            })
            fig.text((x0 + x1) / 2, y + 17, '150 ms debounce', {
                size: 12,
                color: c.textSecondary,
                align: 'center',
                weight: 600,
            })
        }
        let cursor = offsetMs
        for (const s of stages) {
            const x0 = plotLeft.px(cursor)
            const x1 = plotLeft.px(cursor + s.ms)
            fig.rect(x0, y, Math.max(2, x1 - x0 - 1), 34, {
                fill: s.color,
                opacity: 0.88,
                radius: 3,
            })
            if (x1 - x0 >= 30) {
                fig.text((x0 + x1) / 2, y + 17, `${s.ms}`, {
                    size: 12,
                    color: c.bg,
                    align: 'center',
                    weight: 700,
                    mono: true,
                })
            }
            cursor += s.ms
        }
    }

    // Lane 1: Immediate
    fig.text(32, 92, 'Immediate (0 ms debounce)', { size: 13, weight: 600, color: c.textPrimary })
    fig.text(plotLeft.px(350), 92, '183 ms (+17 headroom)', {
        size: 13,
        weight: 700,
        color: green,
        align: 'right',
    })
    drawLane(106, 0)
    // Headroom dashed box 183..200
    fig.rect(plotLeft.px(183), 106, plotLeft.px(200) - plotLeft.px(183), 34, {
        fill: tint(green, c.bg, 0.12),
        stroke: green,
        strokeWidth: 1.2,
        radius: 3,
    })

    // Lane 2: Debounced
    fig.text(32, 182, 'Debounced (+150 ms)', { size: 13, weight: 600, color: c.textPrimary })
    fig.text(plotLeft.px(350), 182, '333 ms', {
        size: 13,
        weight: 700,
        color: red,
        align: 'right',
    })
    drawLane(196, 150)

    // Clean horizontal legend row below left plot
    const legendItems = [
        { label: 'Parse 12', color: blue },
        { label: 'Net 55', color: purple },
        { label: 'Ctx 28', color: green },
        { label: 'Model 78', color: warm },
        { label: 'Paint 10', color: cyan },
    ]
    legendItems.forEach((item, i) => {
        const col = i % 3
        const row = Math.floor(i / 3)
        const lx = 34 + col * 142
        const ly = 314 + row * 28
        fig.rect(lx, ly - 6, 12, 12, { fill: item.color, radius: 3 })
        fig.text(lx + 18, ly, `${item.label} ms`, {
            size: 13,
            color: c.textSecondary,
            mono: true,
        })
    })
    fig.text(34, 378, 'TTFT sits inside queue + model (not an extra stage)', {
        size: 12,
        color: c.textMuted,
    })

    // Vertical divider
    fig.line(486, 18, 486, 392, { color: c.borderSubtle, width: 1.25 })

    // Right: Whole-trace p95 vs Sum of stage p95s (20 traces)
    fig.text(514, 22, '20-Trace p95 Comparison', { size: 15, weight: 700, color: red })
    fig.text(514, 44, 'Independent spikes hit different requests', {
        size: 13,
        color: c.textSecondary,
    })

    // Compact trace table (3 rows, crisp hairline rules, zero box walls)
    const cols = { req: 514, s1: 632, s2: 714, tot: 816 }
    fig.text(cols.req, 78, 'Trace', { size: 13, weight: 700, color: c.textSecondary })
    fig.text(cols.s1, 78, 'Stage 1', {
        size: 13,
        weight: 700,
        color: c.textSecondary,
        align: 'right',
    })
    fig.text(cols.s2, 78, 'Stage 2', {
        size: 13,
        weight: 700,
        color: c.textSecondary,
        align: 'right',
    })
    fig.text(cols.tot, 78, 'Total', {
        size: 13,
        weight: 700,
        color: c.textSecondary,
        align: 'right',
    })
    fig.line(514, 92, 822, 92, { color: c.border, width: 1 })

    const traceRows = [
        { name: 'Req 1', s1: '100 ms', s2: '1 ms', tot: '101 ms', spike: 1 },
        { name: 'Req 2', s1: '1 ms', s2: '100 ms', tot: '101 ms', spike: 2 },
        { name: 'Req 3..20', s1: '1 ms', s2: '1 ms', tot: '2 ms', spike: 0 },
    ]
    traceRows.forEach((r, i) => {
        const ry = 112 + i * 32
        fig.text(cols.req, ry, r.name, { size: 13, color: c.textPrimary, mono: true })
        fig.text(cols.s1, ry, r.s1, {
            size: 13,
            color: r.spike === 1 ? red : c.textSecondary,
            weight: r.spike === 1 ? 700 : 400,
            align: 'right',
            mono: true,
        })
        fig.text(cols.s2, ry, r.s2, {
            size: 13,
            color: r.spike === 2 ? red : c.textSecondary,
            weight: r.spike === 2 ? 700 : 400,
            align: 'right',
            mono: true,
        })
        fig.text(cols.tot, ry, r.tot, {
            size: 13,
            color: r.spike > 0 ? red : c.textSecondary,
            weight: r.spike > 0 ? 700 : 400,
            align: 'right',
            mono: true,
        })
        fig.line(514, ry + 16, 822, ry + 16, { color: c.borderSubtle, width: 1 })
    })

    // Visual bar comparison of the two p95 calculations (0..110 ms)
    const barPlot = fig.plot({ x: 514, y: 230, width: 308, height: 112 }, { x: [0, 115], y: [0, 10] })

    // Bar 1: Sum of stage p95s = 2 ms
    fig.text(514, 240, 'Sum of stage p95s (1 + 1)', {
        size: 13,
        weight: 600,
        color: blue,
    })
    fig.rect(barPlot.px(0), 254, Math.max(8, barPlot.px(2) - barPlot.px(0)), 22, {
        fill: blue,
        radius: 3,
    })
    fig.text(barPlot.px(2) + 14, 265, '2 ms (wrong)', {
        size: 13,
        weight: 700,
        color: blue,
        mono: true,
    })

    // Bar 2: Whole-trace p95 = 101 ms
    fig.text(514, 302, 'Whole-trace p95 (rank 19/20)', {
        size: 13,
        weight: 700,
        color: red,
    })
    fig.rect(barPlot.px(0), 316, barPlot.px(101) - barPlot.px(0), 24, {
        fill: red,
        opacity: 0.9,
        radius: 4,
    })
    fig.text(barPlot.px(101) - 8, 328, '101 ms', {
        size: 13,
        weight: 700,
        color: c.bg,
        align: 'right',
        mono: true,
    })

    // X-axis for right bar chart
    fig.line(barPlot.px(0), 354, barPlot.px(110), 354, { color: c.textMuted, width: 1 })
    for (const tick of [0, 50, 100]) {
        const tx = barPlot.px(tick)
        fig.line(tx, 354, tx, 359, { color: c.textMuted, width: 1 })
        fig.text(tx, 372, `${tick} ms`, {
            size: 12,
            color: c.textSecondary,
            align: 'center',
            mono: true,
        })
    }

    return fig.render()
}

export default create('dark')
