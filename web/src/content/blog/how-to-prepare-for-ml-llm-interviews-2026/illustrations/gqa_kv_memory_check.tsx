import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 780
export const height = 395
export const alt =
    'Bar chart compares single-sequence FP16 KV-cache memory at 32,768 tokens for a 32-layer decoder with head dimension 128: Multi-Head Attention with 32 KV heads uses 16.00 GiB, Grouped-Query Attention with 8 KV heads uses 4.00 GiB, GQA with 2 KV heads uses 1.00 GiB, and Multi-Query Attention with 1 KV head uses 0.50 GiB.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig

    const warm = fig.tone('warm')
    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const purple = fig.tone('purple')

    const plot = fig.plot(
        { x: 84, y: 52, width: 660, height: 252 },
        { x: [0, 4], y: [0, 17.8] },
    )

    plot.axes({
        yTicks: [0, 4, 8, 12, 16],
        yFormat: (v) => `${v} GiB`,
        yLabel: 'KV cache per 32K sequence (32 layers, d = 128, FP16)',
        grid: true,
        labelSize: 13,
    })

    const bars = [
        {
            label: 'MHA',
            sub: '32 Q : 32 KV',
            value: 16.0,
            valText: '16.00 GiB',
            ratio: '1× baseline',
            color: warm,
        },
        {
            label: 'GQA-8',
            sub: '32 Q : 8 KV',
            value: 4.0,
            valText: '4.00 GiB',
            ratio: '4× smaller',
            color: blue,
        },
        {
            label: 'GQA-2',
            sub: '32 Q : 2 KV',
            value: 1.0,
            valText: '1.00 GiB',
            ratio: '16× smaller',
            color: green,
        },
        {
            label: 'MQA',
            sub: '32 Q : 1 KV',
            value: 0.5,
            valText: '0.50 GiB',
            ratio: '32× smaller',
            color: purple,
        },
    ]

    const barW = 84
    bars.forEach((b, i) => {
        const cx = plot.px(i + 0.5)
        const topY = plot.py(b.value)
        const baseY = plot.py(0)
        const barH = Math.max(7, baseY - topY)

        fig.rect(cx - barW / 2, topY, barW, barH, {
            fill: b.color,
            radius: 6,
        })

        // Value directly above bar
        fig.text(cx, topY - 14, b.valText, {
            size: 14.5,
            weight: 700,
            color: b.color,
            align: 'center',
            mono: true,
        })

        // Savings multiplier pill above non-baseline bars
        if (i > 0) {
            const pillW = 88
            const pillH = 22
            const pillY = topY - 46
            fig.rect(cx - pillW / 2, pillY, pillW, pillH, {
                fill: tint(b.color, c.bg, theme === 'light' ? 0.13 : 0.18),
                stroke: b.color,
                strokeWidth: 1,
                radius: 11,
            })
            fig.text(cx, pillY + pillH / 2, b.ratio, {
                size: 12,
                weight: 600,
                color: b.color,
                align: 'center',
            })
        }

        // Clean category + head ratio beneath x-axis
        fig.text(cx, plot.bottom + 20, b.label, {
            size: 14.5,
            weight: 700,
            color: c.textPrimary,
            align: 'center',
        })
        fig.text(cx, plot.bottom + 41, b.sub, {
            size: 12.5,
            color: c.textSecondary,
            align: 'center',
            mono: true,
        })
    })

    // Curved callout highlighting the 4x drop from MHA to GQA-8
    fig.callout(
        [plot.px(1.5), plot.py(4.0) - 52],
        [plot.px(1.5) + 115, plot.py(12.8)],
        'Each halving of KV heads',
        {
            color: c.textSecondary,
            labelColor: c.textPrimary,
            size: 13.5,
            bend: -0.22,
            align: 'left',
        },
    )
    fig.text(plot.px(1.5) + 121, plot.py(12.8) + 18, 'cuts sequence KV in half', {
        size: 13.5,
        weight: 500,
        color: c.textPrimary,
        align: 'left',
    })

    return fig.render()
}

export default create('dark')
