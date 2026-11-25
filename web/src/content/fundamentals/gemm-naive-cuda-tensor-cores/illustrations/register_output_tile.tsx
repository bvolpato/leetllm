import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 430
export const alt =
    '16x64 register output tile ownership and per-thread operand-reuse comparison. Top view splits the 16x64 C block into four 16x16 sub-tiles (+0, +16, +32, +48), highlighting row 2 and the four cells owned by thread (tx=1, ty=2) at columns 1, 17, 33, and 49. Bottom left traces per-k register reuse: one As[2, k] float pairs with four Bs floats into four accumulators (5 floats = 20 bytes for 8 FLOPs = 0.40 FLOP/B). Bottom right compares per-thread SMEM intensity across 1x1 (0.25), 1x4 (0.40), and 8x8 (2.00 FLOP/B).'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const warm = fig.tone('warm')
    const green = fig.tone('green')
    const red = fig.tone('critical')

    // --- Top: Bold high-contrast 16x64 C tile split into 4 x (16x16) sub-tiles ---
    fig.text(32, 22, '16×64 Output Tile C · Thread (tx = 1, ty = 2) owns 4 strided columns', {
        size: 15,
        weight: 600,
        color: c.textPrimary,
    })

    const subW = 154
    const subH = 112
    const subGap = 22
    const startX = 48
    const subY = 66
    const offsets = [0, 16, 32, 48]

    // Left row-2 callout label
    const rowBandY = subY + 22
    const rowBandH = 16
    fig.text(startX - 8, rowBandY + rowBandH / 2, 'r2', {
        size: 13,
        weight: 700,
        color: green,
        align: 'right',
        mono: true,
    })

    offsets.forEach((off, idx) => {
        const sx = startX + idx * (subW + subGap)
        // Sub-tile body with crisp theme-aware contrast
        fig.rect(sx, subY, subW, subH, {
            fill: tint(blue, c.bg, theme === 'light' ? 0.08 : 0.16),
            stroke: tint(blue, c.bg, theme === 'light' ? 0.42 : 0.55),
            strokeWidth: 1.5,
            radius: 6,
        })

        // Clean internal 4x4 schematic quadrant grid lines (keeps 16x16 structure crisp without micro-clutter)
        for (let g = 1; g < 4; g++) {
            const gx = sx + (g * subW) / 4
            const gy = subY + (g * subH) / 4
            fig.line(gx, subY, gx, subY + subH, {
                color: c.borderSubtle,
                width: 0.75,
                opacity: 0.7,
            })
            fig.line(sx, gy, sx + subW, gy, {
                color: c.borderSubtle,
                width: 0.75,
                opacity: 0.7,
            })
        }

        // Row 2 shared-As band
        fig.rect(sx + 1, rowBandY, subW - 2, rowBandH, {
            fill: tint(green, c.bg, theme === 'light' ? 0.24 : 0.36),
            stroke: green,
            strokeWidth: 1,
        })

        // Thread (tx=1, ty=2) owned cell (vivid coral/red)
        const cellX = sx + 14
        fig.rect(cellX, rowBandY + 1, 16, rowBandH - 2, {
            fill: red,
            stroke: c.bg,
            strokeWidth: 1.25,
            radius: 2,
        })

        // Sub-tile offset header
        fig.text(sx + subW / 2, subY - 14, `Sub-tile +${off}`, {
            size: 13,
            weight: 600,
            color: c.textSecondary,
            align: 'center',
            mono: true,
        })

        // Column index label below
        fig.text(cellX + 8, subY + subH + 16, `col ${off + 1}`, {
            size: 13,
            weight: 600,
            color: red,
            align: 'center',
            mono: true,
        })
        fig.line(cellX + 8, rowBandY + rowBandH + 2, cellX + 8, subY + subH + 4, {
            color: red,
            width: 1,
            dash: '3 3',
            opacity: 0.75,
        })
    })

    // Hairline separator
    fig.line(32, 214, 728, 214, { color: c.borderSubtle, width: 1 })

    // --- Lower left panel (Per-k Register Reuse fan-out) ---
    fig.text(32, 238, 'Per-k register reuse (1×4 thread)', {
        size: 15,
        weight: 600,
        color: c.textPrimary,
    })

    // Single As[2, k] register box
    const asX = 32
    const asY = 304
    fig.rect(asX, asY - 22, 84, 44, {
        fill: tint(warm, c.bg, theme === 'light' ? 0.2 : 0.28),
        stroke: warm,
        strokeWidth: 1.75,
        radius: 6,
    })
    fig.text(asX + 42, asY - 7, 'As[2, k]', {
        size: 13,
        weight: 700,
        color: warm,
        align: 'center',
        mono: true,
    })
    fig.text(asX + 42, asY + 11, '1 float', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
    })

    // Four Bs loads + accumulators
    const cols = [1, 17, 33, 49]
    cols.forEach((col, i) => {
        const y = 266 + i * 28
        // Fan-out arrow from As to FMA
        fig.line(asX + 84, asY, 168, y, { color: warm, width: 1.4, opacity: 0.85 })
        fig.circle(168, y, 3, { fill: warm })

        // Bs[k, col] pill
        fig.rect(176, y - 10, 92, 20, {
            fill: tint(blue, c.bg, theme === 'light' ? 0.16 : 0.26),
            stroke: blue,
            strokeWidth: 1.25,
            radius: 4,
        })
        fig.text(222, y, `Bs[k, ${col}]`, {
            size: 12,
            weight: 600,
            color: blue,
            align: 'center',
            mono: true,
        })

        // Arrow to accumulator
        fig.arrow(272, y, 304, y, { color: green, width: 1.5, head: 5.5 })

        // Accumulator
        fig.rect(308, y - 10, 74, 20, {
            fill: tint(green, c.bg, theme === 'light' ? 0.16 : 0.26),
            stroke: green,
            strokeWidth: 1.25,
            radius: 4,
        })
        fig.text(345, y, `acc[${i}]`, {
            size: 12,
            weight: 600,
            color: green,
            align: 'center',
            mono: true,
        })
    })

    fig.text(206, 396, '5 floats (20 B) → 8 FLOPs = 0.40 FLOP/B', {
        size: 13,
        weight: 600,
        color: c.textPrimary,
        align: 'center',
        mono: true,
    })

    // Vertical divider
    fig.line(412, 230, 412, 410, { color: c.borderSubtle, width: 1 })

    // --- Lower right panel (Per-thread SMEM intensity bars) ---
    fig.text(436, 238, 'Per-thread SMEM intensity', {
        size: 15,
        weight: 600,
        color: c.textPrimary,
    })

    const barLeft = 516
    const barMaxW = 160
    const maxF = 2.2
    const bTop = 264
    const bBot = 376
    fig.line(barLeft, bTop, barLeft, bBot, { color: c.textMuted, width: 1 })
    for (const t of [0, 0.5, 1.0, 1.5, 2.0]) {
        const tx = barLeft + (t / maxF) * barMaxW
        if (t > 0) {
            fig.line(tx, bTop, tx, bBot, { color: c.borderSubtle, width: 1, dash: '3 3' })
        }
        fig.text(tx, bBot + 14, t.toFixed(1), {
            size: 12,
            color: c.textSecondary,
            align: 'center',
            mono: true,
        })
    }
    fig.text(barLeft + barMaxW / 2, bBot + 33, 'FLOP/B', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
    })

    const intensities = [
        { label: '1×1', value: 0.25, text: '0.25', color: warm },
        { label: '1×4', value: 0.4, text: '0.40', color: blue },
        { label: '8×8', value: 2.0, text: '2.00', color: green },
    ]
    intensities.forEach((item, idx) => {
        const cy = 284 + idx * 36
        const w = Math.max(12, (item.value / maxF) * barMaxW)
        fig.text(barLeft - 10, cy, item.label, {
            size: 13,
            weight: 600,
            color: c.textPrimary,
            align: 'right',
            mono: true,
        })
        fig.rect(barLeft, cy - 11, w, 22, {
            fill: tint(item.color, c.bg, theme === 'light' ? 0.78 : 0.85),
            stroke: item.color,
            strokeWidth: 1.25,
            radius: 4,
        })
        fig.text(barLeft + w + 8, cy, item.text, {
            size: 13,
            weight: 700,
            color: item.color,
            mono: true,
        })
    })

    return fig.render()
}

export default create
