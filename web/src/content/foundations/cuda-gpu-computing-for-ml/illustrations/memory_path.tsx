import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 780
export const height = 425
export const alt =
    'A CPU batch crosses to CUDA device global memory. GPU kernels access model tensors through the device memory system; L2 is shared across SMs, L1 is per SM, shared memory is per block, and registers belong to threads. Below, four equal 4-byte quantities make a simplified 16-byte FP32 Adam budget per parameter: weight, gradient, first moment, and second moment. One billion parameters therefore account for 14.90 GiB before activations, workspaces, and allocator overhead.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const purple = fig.tone('purple')
    const cyan = fig.tone('cyan')
    const fillAmt = theme === 'dark' ? 0.14 : 0.08

    // ─── TOP HALF: HOST -> VRAM -> L2 / SM STORAGE HIERARCHY ───
    fig.text(20, 18, 'Host-to-device transfer and GPU memory hierarchy', {
        size: 14.5,
        weight: 700,
        color: c.textPrimary,
    })

    // CPU RAM column
    fig.rect(20, 44, 152, 206, {
        fill: tint(c.textMuted, c.bg, theme === 'dark' ? 0.1 : 0.06),
        stroke: c.border,
        strokeWidth: 1.4,
        radius: 10,
    })
    fig.text(96, 68, 'CPU RAM', { size: 14.5, weight: 700, color: c.textPrimary, align: 'center' })
    fig.text(96, 118, 'dataset batch', { size: 13, color: c.textSecondary, align: 'center' })
    fig.text(96, 146, '(4, 8, 16)', {
        size: 15,
        weight: 700,
        color: blue,
        mono: true,
        align: 'center',
    })
    fig.text(96, 182, 'pinned host', { size: 12, color: c.textMuted, align: 'center' })
    fig.text(96, 200, 'staging', { size: 12, color: c.textMuted, align: 'center' })

    // H2D arrow
    fig.arrow(176, 147, 224, 147, { color: blue, width: 2.5, head: 7 })
    fig.text(200, 130, 'H2D', { size: 12.5, weight: 700, color: blue, mono: true, align: 'center' })

    // GPU VRAM (HBM) column
    fig.rect(230, 44, 206, 206, {
        fill: tint(blue, c.bg, theme === 'dark' ? 0.11 : 0.06),
        stroke: blue,
        strokeWidth: 1.5,
        radius: 10,
    })
    fig.text(333, 68, 'GPU VRAM (HBM)', {
        size: 14.5,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
    })
    const vramItems = [
        { label: 'weights', color: blue },
        { label: 'activations', color: green },
        { label: 'gradients', color: warm },
        { label: 'Adam state (m, v)', color: purple },
    ]
    vramItems.forEach((item, idx) => {
        const iy = 96 + idx * 36
        fig.rect(248, iy, 170, 28, {
            fill: tint(item.color, c.bg, fillAmt),
            stroke: item.color,
            strokeWidth: 1.1,
            radius: 6,
        })
        fig.text(333, iy + 14, item.label, {
            size: 13,
            weight: 600,
            color: item.color,
            align: 'center',
        })
    })

    // VRAM -> On-chip arrow
    fig.arrow(440, 147, 488, 147, { color: green, width: 2.5, head: 7 })
    fig.text(464, 130, 'tiles', { size: 12, weight: 600, color: green, align: 'center' })

    // On-chip SM + L2 hierarchy (right)
    fig.rect(494, 44, 266, 206, {
        fill: tint(green, c.bg, theme === 'dark' ? 0.08 : 0.04),
        stroke: c.border,
        strokeWidth: 1.4,
        radius: 10,
    })
    // L2 cache bar
    fig.rect(508, 56, 238, 40, {
        fill: tint(blue, c.bg, theme === 'dark' ? 0.22 : 0.14),
        stroke: blue,
        strokeWidth: 1.4,
        radius: 7,
    })
    fig.text(627, 76, 'L2 cache · shared across SMs', {
        size: 13,
        weight: 700,
        color: blue,
        align: 'center',
    })

    // SM 0 & SM 1
    for (let i = 0; i < 2; i++) {
        const sx = 508 + i * 124
        fig.rect(sx, 108, 114, 128, {
            fill: tint(green, c.bg, fillAmt),
            stroke: green,
            strokeWidth: 1.4,
            radius: 8,
        })
        fig.text(sx + 57, 126, `SM ${i}`, {
            size: 13.5,
            weight: 700,
            color: green,
            align: 'center',
        })
        fig.text(sx + 57, 156, 'L1 cache', { size: 12.5, color: c.textPrimary, align: 'center' })
        fig.text(sx + 57, 182, 'Shared mem', { size: 12.5, color: c.textPrimary, align: 'center' })
        fig.text(sx + 57, 208, 'Registers', { size: 12.5, color: c.textPrimary, align: 'center' })
    }

    // ─── BOTTOM HALF: 16-BYTE FP32 ADAM BUDGET BAR ───
    fig.line(20, 274, width - 20, 274, { color: c.borderSubtle, width: 1, dash: '4 4' })
    fig.text(20, 296, 'FP32 Adam baseline · 16 bytes per parameter', {
        size: 14.5,
        weight: 700,
        color: c.textPrimary,
    })

    const segs = [
        { label: 'weight', bytes: '4 B', color: blue },
        { label: 'gradient', bytes: '4 B', color: warm },
        { label: 'moment m', bytes: '4 B', color: purple },
        { label: 'moment v', bytes: '4 B', color: cyan },
    ]
    const segW = 182
    segs.forEach((s, i) => {
        const sx = 20 + i * (segW + 4)
        fig.rect(sx, 316, segW, 56, {
            fill: tint(s.color, c.bg, theme === 'dark' ? 0.22 : 0.14),
            stroke: s.color,
            strokeWidth: 1.6,
            radius: 7,
        })
        fig.text(sx + segW / 2, 334, s.bytes, {
            size: 15,
            weight: 700,
            color: s.color,
            mono: true,
            align: 'center',
        })
        fig.text(sx + segW / 2, 355, s.label, {
            size: 13,
            weight: 600,
            color: c.textPrimary,
            align: 'center',
        })
    })

    fig.text(
        width / 2,
        398,
        '1B params × 16 B = 16 GB = 14.90 GiB (before activations & workspaces)',
        { size: 13.5, weight: 700, color: warm, align: 'center' },
    )

    return fig.render()
}

export default create()
