import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 780
export const height = 395
export const alt =
    'A buffer rack after coordinate a receives gradients 100 and minus 80. SGD retains no moment; EMA momentum retains m2 = 1; RMSProp with rho 0.9 retains s2 = 1540; Adam and AdamW retain m2 = 1 and v2 = 16.39 with beta2 0.999. Float32 moment costs are zero, four, four, eight, and eight bytes per parameter. A separate zero-state AdamW example sends weight 10 directly to 9.99 by subtracting decay 0.01, while both moments stay zero.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const critical = fig.tone('critical')
    const green = fig.tone('green')
    const fillAmt = theme === 'dark' ? 0.16 : 0.1

    // ─── LEFT: OPTIMIZER MOMENT BUFFER RACK + BYTE COST BARS ───
    fig.text(20, 20, 'Per-parameter moment buffers · coordinate a', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
    })

    // Input gradient sequence pills
    fig.text(20, 56, 'Zero start:', { size: 13, color: c.textSecondary })
    fig.rect(104, 42, 92, 28, {
        fill: tint(blue, c.bg, fillAmt),
        stroke: blue,
        strokeWidth: 1.4,
        radius: 6,
    })
    fig.text(150, 56, 'g₁ = +100', {
        size: 13,
        weight: 700,
        color: blue,
        mono: true,
        align: 'center',
    })
    fig.arrow(200, 56, 228, 56, { color: c.textMuted, width: 2, head: 6 })
    fig.rect(232, 42, 86, 28, {
        fill: tint(critical, c.bg, fillAmt),
        stroke: critical,
        strokeWidth: 1.4,
        radius: 6,
    })
    fig.text(275, 56, 'g₂ = −80', {
        size: 13,
        weight: 700,
        color: critical,
        mono: true,
        align: 'center',
    })

    // Column headers
    fig.text(162, 98, 'signed (4 B)', { size: 12.5, weight: 700, color: blue, align: 'center' })
    fig.text(286, 98, 'squared (4 B)', { size: 12.5, weight: 700, color: purple, align: 'center' })
    fig.text(406, 98, 'state / param', {
        size: 12.5,
        weight: 700,
        color: c.textSecondary,
        align: 'center',
    })

    const rows = [
        { name: 'SGD', signed: '', squared: '', bytes: 0 },
        { name: 'Momentum', signed: 'm₂ = 1', squared: '', bytes: 4 },
        { name: 'RMSProp', signed: '', squared: 's₂ = 1540', bytes: 4 },
        { name: 'Adam', signed: 'm₂ = 1', squared: 'v₂ = 16.39', bytes: 8 },
        { name: 'AdamW', signed: 'm₂ = 1', squared: 'v₂ = 16.39', bytes: 8 },
    ] as const

    rows.forEach((row, idx) => {
        const y = 118 + idx * 50
        fig.text(20, y + 18, row.name, {
            size: 14,
            weight: 700,
            color: c.textPrimary,
        })

        if (!row.signed && !row.squared) {
            fig.text(224, y + 18, 'no moment buffers', {
                size: 13,
                color: c.textMuted,
                align: 'center',
            })
        } else {
            if (row.signed) {
                fig.rect(112, y + 2, 100, 32, {
                    fill: tint(blue, c.bg, fillAmt),
                    stroke: blue,
                    strokeWidth: 1.4,
                    radius: 7,
                })
                fig.text(162, y + 18, row.signed, {
                    size: 13,
                    weight: 700,
                    color: blue,
                    mono: true,
                    align: 'center',
                })
            }
            if (row.squared) {
                fig.rect(226, y + 2, 120, 32, {
                    fill: tint(purple, c.bg, fillAmt),
                    stroke: purple,
                    strokeWidth: 1.4,
                    radius: 7,
                })
                fig.text(286, y + 18, row.squared, {
                    size: 13,
                    weight: 700,
                    color: purple,
                    mono: true,
                    align: 'center',
                })
            }
        }

        // Visual byte-footprint micro-bar + label
        const bx = 364
        const bw = 60
        fig.rect(bx, y + 11, bw, 14, {
            fill: tint(c.textMuted, c.bg, 0.1),
            radius: 4,
        })
        if (row.bytes > 0) {
            fig.rect(bx, y + 11, (row.bytes / 8) * bw, 14, {
                fill: row.bytes === 8 ? purple : blue,
                radius: 4,
            })
        }
        fig.text(bx + bw + 8, y + 18, `${row.bytes} B`, {
            size: 13,
            weight: 700,
            color: c.textSecondary,
            mono: true,
        })
    })

    fig.text(20, 376, 'Each filled float32 buffer adds 4 bytes per parameter', {
        size: 12,
        color: c.textMuted,
    })

    // Subtle vertical divider
    fig.line(486, 20, 486, 382, { color: c.borderSubtle, width: 1 })

    // ─── RIGHT: ADAMW DECOUPLED DECAY ───
    const rx = 510
    fig.text(rx, 20, 'AdamW decoupled decay', {
        size: 15,
        weight: 700,
        color: green,
    })
    fig.text(rx, 42, 'Acts directly on weights, bypassing m & v', {
        size: 12.5,
        color: c.textSecondary,
    })

    // Separate check conditions
    fig.rect(rx, 74, 246, 74, {
        fill: tint(green, c.bg, theme === 'dark' ? 0.1 : 0.06),
        stroke: c.borderSubtle,
        strokeWidth: 1,
        radius: 8,
    })
    fig.text(rx + 14, 94, 'Zero-gradient check', { size: 13, weight: 700, color: c.textPrimary })
    fig.text(rx + 14, 118, 'g = 0,  m = 0,  v = 0', {
        size: 13,
        color: c.textSecondary,
        mono: true,
    })
    fig.text(rx + 14, 138, 'lr = 0.1 · λ = 0.01', {
        size: 13,
        color: green,
        mono: true,
    })

    // Weight update arrow: w = 10 -> -0.01 -> w = 9.99
    fig.rect(rx, 188, 92, 46, {
        fill: tint(green, c.bg, fillAmt),
        stroke: green,
        strokeWidth: 1.6,
        radius: 8,
    })
    fig.text(rx + 46, 211, 'w = 10', {
        size: 14.5,
        weight: 700,
        color: c.textPrimary,
        mono: true,
        align: 'center',
    })

    fig.arrow(rx + 96, 211, rx + 150, 211, { color: green, width: 2.5, head: 7 })
    fig.text(rx + 123, 194, '−0.01', {
        size: 13,
        weight: 700,
        color: green,
        mono: true,
        align: 'center',
    })

    fig.rect(rx + 154, 188, 92, 46, {
        fill: tint(green, c.bg, theme === 'dark' ? 0.22 : 0.14),
        stroke: green,
        strokeWidth: 1.8,
        radius: 8,
    })
    fig.text(rx + 200, 211, '9.99', {
        size: 15,
        weight: 700,
        color: green,
        mono: true,
        align: 'center',
    })

    fig.math(rx + 123, 268, String.raw`w \leftarrow (1 - \eta\lambda)\,w`, {
        size: 16,
        color: green,
        align: 'center',
    })

    fig.rect(rx, 304, 4, 60, { fill: green, radius: 2 })
    fig.text(rx + 14, 318, 'Moments stay untouched', {
        size: 13,
        weight: 700,
        color: c.textPrimary,
    })
    fig.text(rx + 14, 342, 'Weight shrinkage never inflates v_t', {
        size: 12.5,
        color: c.textSecondary,
    })

    return fig.render()
}

export default create('dark')
