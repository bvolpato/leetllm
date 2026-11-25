import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 405
export const alt =
    'Bar chart comparing 70B 128K FP16 KV cache across MHA (343.6 GB), GQA-8 (42.95 GB), and MQA (5.37 GB) with a dashed 80 GB H100 HBM reference line, alongside a visual equal-element comparison showing 32 heads at 4K context equals 1 head at 128K context (40M floats / 80 MB per layer).'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const warm = fig.tone('warm')
    const green = fig.tone('green')
    const red = fig.tone('critical')

    // --- Left: 70B 128K FP16 KV Cache Bars with H100 80 GB hline ---
    fig.text(62, 20, '70B · 128K FP16 KV cache (GB)', {
        size: 15,
        weight: 600,
        color: c.textPrimary,
    })
    fig.text(62, 42, '80 layers · d_h = 128 · H_q = 64', {
        size: 12,
        color: c.textSecondary,
        mono: true,
    })

    const plot = fig.plot({ x: 62, y: 68, width: 392, height: 266 }, { x: [0, 3], y: [0, 380] })
    plot.axes({
        yTicks: [0, 80, 160, 240, 320],
        grid: true,
        yLabel: 'GB',
        labelSize: 12,
    })

    // H100 80 GB HBM horizontal reference line right on the plot!
    plot.hline(80, '1× H100 HBM (80 GB)', {
        color: warm,
        width: 2,
        dash: '6 4',
        labelPosition: 'right',
        labelSize: 13,
        weight: 700,
        labelOffset: 13,
    })

    const bars = [
        { label: 'MHA', sub: '64 KV', val: 343.6, text: '343.6 GB', color: red },
        { label: 'GQA-8', sub: '8 KV', val: 42.95, text: '42.95 GB', color: blue },
        { label: 'MQA', sub: '1 KV', val: 5.37, text: '5.37 GB', color: green },
    ]
    const barW = 68

    bars.forEach((b, i) => {
        const cx = plot.px(i + 0.5)
        const yVal = plot.py(b.val)
        const h = Math.max(8, plot.bottom - yVal)
        fig.rect(cx - barW / 2, plot.bottom - h, barW, h, {
            fill: tint(b.color, c.bg, theme === 'light' ? 0.78 : 0.86),
            stroke: b.color,
            strokeWidth: 1.5,
            radius: 5,
        })
        fig.text(cx, plot.bottom - h - 14, b.text, {
            size: 13,
            weight: 700,
            color: b.color,
            align: 'center',
            mono: true,
        })
        fig.text(cx, plot.bottom + 18, b.label, {
            size: 13,
            weight: 700,
            color: c.textPrimary,
            align: 'center',
        })
        fig.text(cx, plot.bottom + 36, b.sub, {
            size: 12,
            color: c.textSecondary,
            align: 'center',
            mono: true,
        })
    })

    // Vertical divider
    fig.line(484, 22, 484, 378, { color: c.borderSubtle, width: 1 })

    // --- Right: Bright Equal-Element-Count Shape Comparison (32x4K vs 1x128K) ---
    fig.text(508, 20, 'Equal KV elements / layer', {
        size: 15,
        weight: 600,
        color: c.textPrimary,
    })
    fig.text(508, 42, '40M floats · 80 MB each', {
        size: 12,
        color: c.textSecondary,
        mono: true,
    })

    // 4x4 vivid blue grid (32 heads x 4K)
    const gX = 516
    const gY = 128
    const gCell = 24
    const gGap = 4
    for (let r = 0; r < 4; r++) {
        for (let col = 0; col < 4; col++) {
            fig.rect(gX + col * (gCell + gGap), gY + r * (gCell + gGap), gCell, gCell, {
                fill: tint(blue, c.bg, theme === 'light' ? 0.65 : 0.76),
                stroke: blue,
                strokeWidth: 1.25,
                radius: 4,
            })
        }
    }
    const gridW = 4 * gCell + 3 * gGap
    fig.text(gX + gridW / 2, gY + gridW + 24, '32 × 4K', {
        size: 14,
        weight: 700,
        color: blue,
        align: 'center',
        mono: true,
    })
    fig.text(gX + gridW / 2, gY + gridW + 44, '32 heads, short', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
    })

    // Equals sign
    fig.text(650, gY + gridW / 2, '=', {
        size: 24,
        weight: 700,
        color: c.textMuted,
        align: 'center',
    })

    // 16x1 vivid green stripe (1 head x 128K)
    const sX = 682
    const sY = 74
    const sW = 28
    const sH = 11
    const sGap = 3
    for (let r = 0; r < 16; r++) {
        fig.rect(sX, sY + r * (sH + sGap), sW, sH, {
            fill: tint(green, c.bg, theme === 'light' ? 0.68 : 0.78),
            stroke: green,
            strokeWidth: 1,
            radius: 3,
        })
    }
    fig.text(sX + sW / 2, sY + 16 * (sH + sGap) + 16, '1 × 128K', {
        size: 14,
        weight: 700,
        color: green,
        align: 'center',
        mono: true,
    })
    fig.text(sX + sW / 2, sY + 16 * (sH + sGap) + 36, '1 head, long', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
    })

    return fig.render()
}

export default create
