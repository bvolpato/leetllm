import { type ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 390
export const alt =
    'Left: fit and SLO threshold check comparing TP=1, TP=2, and TP=4 against 80 GB VRAM, 400 ms TTFT, and 55 ms TPOT limits. TP=1 fails VRAM (86 GB OOM); TP=2 passes all limits (51 GB, 310 ms TTFT, 45 ms TPOT, 620 TPS); TP=4 fails both latency limits (430 ms TTFT, 62 ms TPOT) despite 700 raw TPS. Right: cost per million tokens across two SLO-eligible clusters shows a 2-GPU group at 620 TPS ($6/hr) costs $2.69/M vs $3.70/M for a faster 4-GPU group at 900 TPS ($12/hr).'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'

    const green = fig.tone('green')
    const red = fig.tone('red')
    const blue = fig.tone('blue')
    const warm = fig.tone('warm')

    const fill = (col: string) => tint(col, c.bg, isLight ? 0.24 : 0.38)
    const trackBg = isLight ? '#f0ede5' : '#171b24'

    // =========================================================================
    // Left panel: Visual SLO / VRAM threshold bars (normalized to 100% cap)
    // =========================================================================
    const leftX = 24
    const barX = 114
    const barW = 246
    const maxPct = 1.25
    const px = (ratio: number) => barX + Math.min(ratio, maxPct) / maxPct * barW
    const capX = px(1.0)

    fig.text(leftX, 20, '1. Screen VRAM & SLO caps first', {
        size: 14.5,
        weight: 700,
        color: c.textPrimary,
    })
    fig.text(leftX, 41, 'Limits: VRAM ≤ 80 GB · TTFT ≤ 400 ms · TPOT ≤ 55 ms', {
        size: 12,
        color: c.textSecondary,
    })

    // Vertical 100% limit line
    fig.line(capX, 66, capX, 344, { color: red, width: 1.6, dash: '5 4' })
    fig.text(capX, 58, '100% cap', {
        size: 11.5,
        weight: 700,
        color: red,
        align: 'center',
        mono: true,
    })

    interface MetricBar {
        label: string
        ratio: number
        text: string
        fail: boolean
    }
    const configs: { name: string; status: string; statusCol: string; y: number; bars: MetricBar[] }[] = [
        {
            name: 'TP = 1',
            status: 'FAIL fit (OOM)',
            statusCol: red,
            y: 80,
            bars: [{ label: 'VRAM', ratio: 86 / 80, text: '86 GB', fail: true }],
        },
        {
            name: 'TP = 2',
            status: 'ELIGIBLE · 620 TPS',
            statusCol: green,
            y: 138,
            bars: [
                { label: 'VRAM', ratio: 51 / 80, text: '51 GB', fail: false },
                { label: 'TTFT', ratio: 310 / 400, text: '310 ms', fail: false },
                { label: 'TPOT', ratio: 45 / 55, text: '45 ms', fail: false },
            ],
        },
        {
            name: 'TP = 4',
            status: 'FAIL SLO (700 TPS)',
            statusCol: warm,
            y: 250,
            bars: [
                { label: 'VRAM', ratio: 33.5 / 80, text: '33.5 GB', fail: false },
                { label: 'TTFT', ratio: 430 / 400, text: '430 ms', fail: true },
                { label: 'TPOT', ratio: 62 / 55, text: '62 ms', fail: true },
            ],
        },
    ]

    for (const cfg of configs) {
        fig.text(leftX, cfg.y, cfg.name, { size: 13.5, weight: 700, color: cfg.statusCol, mono: true })
        fig.text(barX, cfg.y, cfg.status, {
            size: 12.5,
            weight: 700,
            color: cfg.statusCol,
            align: 'left',
        })
        cfg.bars.forEach((b, i) => {
            const by = cfg.y + 14 + i * 24
            const col = b.fail ? red : green
            fig.text(barX - 8, by + 8, b.label, {
                size: 12,
                color: c.textSecondary,
                align: 'right',
                mono: true,
            })
            fig.rect(barX, by, barW, 16, { fill: trackBg, stroke: c.borderSubtle, strokeWidth: 0.8, radius: 3 })
            fig.rect(barX, by, px(b.ratio) - barX, 16, {
                fill: fill(col),
                stroke: col,
                strokeWidth: 1.3,
                radius: 3,
            })
            const inside = !b.fail && b.ratio > 0.68
            fig.text(inside ? px(b.ratio) - 6 : px(b.ratio) + 8, by + 8, b.text, {
                size: 12,
                weight: 700,
                color: inside ? c.textPrimary : col,
                align: inside ? 'right' : 'left',
                mono: true,
            })
        })
    }

    // Vertical divider separating the two independent analyses (no misleading arrow!)
    fig.line(456, 20, 456, height - 20, { color: c.borderSubtle, width: 1 })

    // =========================================================================
    // Right panel: $/1M tokens across two SLO-eligible deployments
    // =========================================================================
    const rx = 516
    const rw = 216
    fig.text(rx + rw / 2, 20, '2. Cost per 1M tokens', {
        size: 14.5,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
    })
    fig.text(rx + rw / 2, 41, 'Two SLO-eligible clusters', {
        size: 12.5,
        color: c.textSecondary,
        align: 'center',
    })

    const plot = fig.plot({ x: rx, y: 74, width: rw, height: 222 }, { x: [0, 2], y: [0, 4.5] })
    plot.axes({
        xTicks: [],
        yTicks: [0, 1, 2, 3, 4],
        yFormat: (v) => `$${v}`,
        grid: true,
        labelSize: 12,
    })

    const costBars = [
        { name: '2 GPU', sub: '620 t/s ($6/h)', val: 2.69, text: '$2.69', col: green },
        { name: '4 GPU', sub: '900 t/s ($12/h)', val: 3.7, text: '$3.70', col: blue },
    ] as const

    const bw = 56
    costBars.forEach((b, i) => {
        const cx = plot.px(i + 0.5)
        const top = plot.py(b.val)
        fig.rect(cx - bw / 2, top, bw, plot.bottom - top, {
            fill: fill(b.col),
            stroke: b.col,
            strokeWidth: 1.5,
            radius: 5,
        })
        fig.text(cx, top - 12, b.text, {
            size: 14,
            weight: 700,
            color: b.col,
            align: 'center',
            mono: true,
        })
        fig.text(cx, plot.bottom + 15, b.name, {
            size: 13,
            weight: 700,
            color: b.col,
            align: 'center',
        })
        fig.text(cx, plot.bottom + 32, b.sub, {
            size: 11.5,
            color: c.textSecondary,
            align: 'center',
            mono: true,
        })
    })

    fig.text(rx + rw / 2, 360, '+45% faster, yet +38% pricier / token', {
        size: 12.5,
        weight: 600,
        color: c.textSecondary,
        align: 'center',
    })

    return fig.render()
}

export default create('dark')
