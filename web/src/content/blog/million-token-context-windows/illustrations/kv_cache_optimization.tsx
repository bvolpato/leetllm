import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 780
export const height = 385
export const alt =
    'Per-sequence KV-cache bars on one zero-based scale: 16.8 GB at 128K tokens and eight KV heads, 65.5 GB at 500K, 131.1 GB at 1M, and 524.3 GB at 1M with 32 KV heads. All use 32 full-history layers, head dimension 128, and two-byte values; weights and overhead are excluded.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig

    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const warm = fig.tone('warm')

    fig.text(28, 22, '32 full-history layers · head dim 128 · FP16 (2 B) · 1 sequence', {
        size: 13.5,
        color: c.textSecondary,
    })

    const rows = [
        { label: '128K · 8 KV heads', gb: 16.777, color: blue, note: '1×' },
        { label: '500K · 8 KV heads', gb: 65.536, color: blue, note: '3.9×' },
        { label: '1M · 8 KV heads', gb: 131.072, color: purple, note: '7.8×' },
        { label: '1M · 32 KV heads', gb: 524.288, color: warm, note: '31.3×' },
    ]

    const leftX = 186
    const plotW = 486
    const topY = 58
    const rowStep = 64
    const barH = 34
    const maxGB = 560
    const sx = (v: number) => leftX + (v / maxGB) * plotW
    const axisY = topY + rows.length * rowStep - 10

    // Vertical reference grid lines
    for (const tick of [0, 100, 200, 300, 400, 500]) {
        const tx = sx(tick)
        fig.line(tx, topY - 6, tx, axisY, {
            color: c.borderSubtle,
            width: 1,
        })
        fig.line(tx, axisY, tx, axisY + 5, {
            color: c.textMuted,
            width: 1,
        })
        fig.text(tx, axisY + 19, `${tick}`, {
            size: 12.5,
            color: c.textSecondary,
            align: 'center',
            mono: true,
        })
    }
    fig.line(leftX, axisY, leftX + plotW, axisY, { color: c.textMuted, width: 1 })
    fig.line(leftX, topY - 6, leftX, axisY, { color: c.textMuted, width: 1 })

    rows.forEach((r, i) => {
        const y = topY + i * rowStep + 6
        const w = Math.max(8, sx(r.gb) - leftX)

        fig.text(leftX - 12, y + barH / 2, r.label, {
            size: 14,
            weight: i >= 2 ? 700 : 500,
            color: c.textPrimary,
            align: 'right',
        })

        fig.rect(leftX, y, w, barH, {
            fill: r.color,
            radius: 5,
        })

        fig.text(leftX + w + 10, y + barH / 2, `${r.gb.toFixed(1)} GB`, {
            size: 14,
            weight: 700,
            color: r.color,
            mono: true,
        })
    })

    // Explicit scaling annotations connecting the key jumps
    const y0 = topY + 6 + barH / 2
    const y2 = topY + 2 * rowStep + 6 + barH / 2
    const y3 = topY + 3 * rowStep + 6 + barH / 2

    // Bracket from 128K (16.8 GB) to 1M (131.1 GB) -> ×7.8 length
    const b1X = sx(270)
    fig.path(`M${sx(16.8) + 86} ${y0}H${b1X}V${y2}H${sx(131.1) + 94}`, {
        color: purple,
        width: 1.4,
        dash: '4 3',
    })
    fig.rect(b1X + 12, (y0 + y2) / 2 - 14, 124, 28, {
        fill: tint(purple, c.bg, theme === 'light' ? 0.12 : 0.18),
        stroke: purple,
        strokeWidth: 1,
        radius: 14,
    })
    fig.text(b1X + 74, (y0 + y2) / 2, '×7.8 context', {
        size: 12.5,
        weight: 700,
        color: purple,
        align: 'center',
    })

    // Curved callout from 1M 8-head to 1M 32-head -> ×4 KV heads
    fig.callout(
        [sx(410), y3 - 20],
        [sx(385), y2 + 12],
        '×4 more KV heads (8 → 32)',
        {
            color: warm,
            labelColor: warm,
            size: 13.5,
            weight: 700,
            bend: -0.25,
            align: 'left',
        },
    )

    fig.text(leftX + plotW / 2, axisY + 42, 'KV cache payload (GB, zero-based scale)', {
        size: 13,
        color: c.textSecondary,
        align: 'center',
    })

    return fig.render()
}

export default create('dark')
