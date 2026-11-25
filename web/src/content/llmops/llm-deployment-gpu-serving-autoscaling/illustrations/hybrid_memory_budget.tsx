import { getReadableTextColor, type ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 460
export const alt =
    'GPU memory footprint comparison under a dashed 76 GB usable H100 budget line. Top: proportional breakdown of Qwen3.6-27B language memory (65.3 GB total: 54.0 GB weights, 2.1 GB KV across 16 full-attention layers, 0.6 GB fixed linear state across 48 layers, and 8.5 GB overhead) leaving 10.7 GB headroom. Bottom: bar chart compares 8B BF16 (23.3 GB) and Qwen3.6-27B Hybrid (65.3 GB) directly against the dashed 76 GB budget.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const purple = fig.tone('purple')
    const warm = fig.tone('warm')
    const red = fig.tone('critical')

    // Top section: Proportional breakdown of Qwen3.6-27B inside the 76 GB H100 allowance
    fig.text(64, 20, 'Qwen3.6-27B breakdown vs 76 GB usable H100 budget (65.3 GB used)', {
        size: 15.5,
        weight: 700,
        color: c.textPrimary,
    })

    const barX = 64
    const barY = 48
    const totalBudgetGb = 76.0
    const barTotalW = 666
    const barH = 38

    // Full 76 GB headroom container (dashed subtle border)
    fig.path(
        `M${barX + 5} ${barY}H${barX + barTotalW - 5}Q${barX + barTotalW} ${barY} ${barX + barTotalW} ${barY + 5}V${barY + barH - 5}Q${barX + barTotalW} ${barY + barH} ${barX + barTotalW - 5} ${barY + barH}H${barX + 5}Q${barX} ${barY + barH} ${barX} ${barY + barH - 5}V${barY + 5}Q${barX} ${barY} ${barX + 5} ${barY}Z`,
        { fill: tint(c.textMuted, c.bg, 0.06), color: c.borderLight, width: 1.25, dash: '4 4' },
    )

    const segs = [
        { label: 'Weights 54.0 GB', short: 'Weights 54.0 GB', gb: 54.0, color: blue },
        { label: 'KV (16L) 2.1 GB', short: '', gb: 2.15, color: green },
        { label: 'Linear (48L) 0.6 GB', short: '', gb: 0.6, color: purple },
        { label: 'Overhead 8.5 GB', short: '8.5 GB', gb: 8.51, color: warm },
    ]

    let cx = barX
    for (const seg of segs) {
        const w = (seg.gb / totalBudgetGb) * barTotalW
        const fill = tint(seg.color, c.bg, 0.36)
        fig.rect(cx, barY, Math.max(4, w - 2), barH, {
            fill,
            stroke: seg.color,
            strokeWidth: 1.5,
            radius: 4,
        })
        if (seg.short) {
            const ink = getReadableTextColor(fill, c, c.bg)
            fig.text(cx + w / 2, barY + barH / 2, seg.short, {
                size: 13,
                weight: 700,
                color: ink,
                align: 'center',
            })
        }
        cx += w
    }
    // Headroom label inside remaining space
    fig.text(cx + (barX + barTotalW - cx) / 2, barY + barH / 2, '+10.7 GB', {
        size: 12.5,
        weight: 600,
        color: c.textSecondary,
        align: 'center',
        mono: true,
    })

    // Compact legend row beneath stacked bar
    const legY = barY + barH + 22
    const legItems = [
        { x: 64, label: 'Weights 54.0 GB', color: blue },
        { x: 222, label: 'KV (16L) 2.1 GB', color: green },
        { x: 374, label: 'Linear (48L) 0.6 GB', color: purple },
        { x: 550, label: '15% overhead 8.5 GB', color: warm },
    ]
    for (const item of legItems) {
        fig.rect(item.x, legY - 6, 12, 12, {
            fill: tint(item.color, c.bg, 0.4),
            stroke: item.color,
            strokeWidth: 1.2,
            radius: 2.5,
        })
        fig.text(item.x + 17, legY, item.label, {
            size: 12.5,
            weight: 600,
            color: c.textSecondary,
        })
    }

    // Bottom bar chart with explicit dashed 76 GB budget line
    fig.text(64, 152, 'Total GPU memory footprint vs usable HBM allowance', {
        size: 15.5,
        weight: 700,
        color: c.textPrimary,
    })

    const plot = fig.plot(
        { x: 64, y: 188, width: 666, height: 214 },
        { x: [0, 2], y: [0, 90] },
    )
    plot.axes({
        yTicks: [0, 20, 40, 60, 80],
        yFormat: (v) => `${v} GB`,
        yLabel: 'Memory (GB)',
        grid: true,
        labelSize: 13.5,
    })

    // Dashed 76 GB budget reference line
    plot.hline(76, '76 GB usable H100 budget', {
        color: red,
        width: 1.8,
        dash: '5 4',
        labelPosition: 'left',
        labelOffset: 13,
        labelSize: 13.5,
        weight: 700,
    })

    const bars = [
        {
            cx: 0.55,
            label: '8B BF16 (4k, conc=8)',
            sub: '16.0 wt + 4.3 KV + 3.0 overhead',
            value: 23.3,
            color: green,
        },
        {
            cx: 1.45,
            label: 'Qwen3.6-27B Hybrid (8k, conc=4)',
            sub: '54.0 wt + 2.1 KV + 0.6 lin + 8.5 overhead',
            value: 65.3,
            color: blue,
        },
    ]

    const barW = 112
    for (const b of bars) {
        const x = plot.px(b.cx) - barW / 2
        const yTop = plot.py(b.value)
        const h = plot.bottom - yTop
        fig.rect(x, yTop, barW, h, {
            fill: tint(b.color, c.bg, 0.3),
            stroke: b.color,
            strokeWidth: 1.7,
            radius: 5,
        })
        fig.text(plot.px(b.cx), yTop - 13, `${b.value.toFixed(1)} GB`, {
            size: 14.5,
            weight: 700,
            color: b.color,
            align: 'center',
            mono: true,
        })
        fig.text(plot.px(b.cx), plot.bottom + 18, b.label, {
            size: 13.5,
            weight: 700,
            color: c.textPrimary,
            align: 'center',
        })
        fig.text(plot.px(b.cx), plot.bottom + 36, b.sub, {
            size: 12,
            color: c.textSecondary,
            align: 'center',
        })
    }

    return fig.render()
}

export default create('dark')
