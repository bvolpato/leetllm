import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 860
export const height = 400
export const alt =
    'Two-panel route economics chart at 1,000 QPS. Left: horizontal unit-cost bar chart comparing full synthesis ($0.0097), structured lookup ($0.0010), and validated cache ($0.0003), with a dashed reference line at the 60/30/10 weighted mean of $0.00601 per query (-38%). Right: 100% stacked comparison showing that 60% full-synthesis traffic accounts for 96.8% of total spend ($0.00582 of $0.00601, or $360.60/min), while 30% cache and 10% structured routes account for only 3.2% combined.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const purple = fig.tone('purple')

    const fill = (color: string, amt = 0.22) => tint(color, c.bg, amt)

    // ==================== LEFT PANEL: UNIT COST PER QUERY ====================
    fig.text(146, 26, 'Unit Cost per Query ($)', { size: 14, color: c.textPrimary, weight: 700 })

    const leftPlot = fig.plot(
        { x: 146, y: 56, width: 294, height: 240 },
        { x: [0, 0.011], y: [0, 3.6] },
    )
    leftPlot.axes({
        xTicks: [0, 0.005, 0.01],
        xFormat: (v) => (v === 0 ? '$0' : `$${v.toFixed(3)}`),
        xLabel: 'USD per query',
        grid: true,
        labelSize: 12,
    })

    const routes = [
        { y: 2.85, name: 'Full synthesis', sub: '60% traffic', cost: 0.0097, color: blue },
        { y: 1.75, name: 'Structured API', sub: '10% traffic', cost: 0.001, color: warm },
        { y: 0.65, name: 'Validated cache', sub: '30% traffic', cost: 0.0003, color: green },
    ]
    const bh = 34
    for (const r of routes) {
        const py = leftPlot.py(r.y)
        fig.text(134, py - 8, r.name, {
            size: 13,
            color: c.textPrimary,
            align: 'right',
            weight: 700,
        })
        fig.text(134, py + 10, r.sub, {
            size: 11.5,
            color: c.textSecondary,
            align: 'right',
        })
        const w = Math.max(8, leftPlot.px(r.cost) - leftPlot.px(0))
        fig.rect(leftPlot.px(0), py - bh / 2, w, bh, {
            fill: fill(r.color, 0.25),
            stroke: r.color,
            strokeWidth: 1.4,
            radius: 4,
        })
        const labelInside = w > 120
        fig.text(
            labelInside ? leftPlot.px(r.cost) - 8 : leftPlot.px(0) + w + 8,
            py,
            `$${r.cost.toFixed(4)}`,
            {
                size: 12.5,
                color: labelInside ? c.textPrimary : r.color,
                align: labelInside ? 'right' : 'left',
                weight: 700,
                mono: true,
            },
        )
    }

    // Weighted mean vertical reference line ($0.00601)
    leftPlot.vline(0.00601, 'Mean: $0.00601', {
        color: purple,
        width: 1.75,
        dash: '5 4',
        labelPosition: 'bottom',
        labelOffset: 24,
        labelSize: 12.5,
        align: 'left',
        weight: 700,
    })

    // Center hairline divider
    fig.line(472, 22, 472, 372, { color: c.borderSubtle, width: 1 })

    // ==================== RIGHT PANEL: TRAFFIC VS SPEND SHARE ====================
    fig.text(500, 26, 'Traffic Mix vs. Spend Share (60 / 30 / 10)', {
        size: 14,
        color: c.textPrimary,
        weight: 700,
    })

    const rx = 500
    const rw = 330
    const drawStack = (
        y: number,
        heading: string,
        segments: { frac: number; color: string; label?: string }[],
    ) => {
        fig.text(rx, y - 18, heading, { size: 13, color: c.textSecondary, weight: 600 })
        let x = rx
        for (const seg of segments) {
            const w = seg.frac * rw
            fig.rect(x, y, Math.max(4, w - 2), 40, {
                fill: fill(seg.color, 0.26),
                stroke: seg.color,
                strokeWidth: 1.35,
                radius: 4,
            })
            if (seg.label && w >= 28) {
                fig.text(x + w / 2, y + 20, seg.label, {
                    size: w < 42 ? 11.5 : 12.5,
                    color: c.textPrimary,
                    align: 'center',
                    weight: 700,
                })
            }
            x += w
        }
    }

    drawStack(86, 'Request volume (1,000 QPS)', [
        { frac: 0.6, color: blue, label: '60% Full' },
        { frac: 0.3, color: green, label: '30% Cache' },
        { frac: 0.1, color: warm, label: '10%' },
    ])

    drawStack(186, 'Total spend ($0.00601 / query)', [
        { frac: 0.968, color: blue, label: '96.8% Full ($0.00582)' },
        { frac: 0.015, color: green },
        { frac: 0.017, color: warm },
    ])

    // Callout for tiny 3.2% Cache + API spend sliver
    fig.callout([rx + rw - 6, 228], [rx + rw - 42, 260], 'Cache 1.5% + API 1.7%', {
        color: green,
        labelColor: green,
        size: 12,
        weight: 600,
        align: 'right',
        bend: 0.15,
    })

    // Fleet spend summary strip (frameless tinted accent band)
    fig.rect(rx, 294, rw, 70, {
        fill: fill(purple, 0.1),
        stroke: purple,
        strokeWidth: 1.35,
        radius: 8,
    })
    fig.text(rx + 16, 317, '1,000 QPS operating spend', {
        size: 12.5,
        color: c.textSecondary,
        weight: 600,
    })
    fig.text(rx + 16, 344, '$360.60 / min', {
        size: 17,
        color: purple,
        weight: 700,
        mono: true,
    })
    fig.text(rx + rw - 14, 344, 'vs $582/min uncached', {
        size: 12.5,
        color: green,
        align: 'right',
        weight: 600,
    })

    return fig.render()
}

export default create()
