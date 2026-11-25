import { type ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 430
export const alt =
    'Two local memory architectures for serving a Q4_K_M GGUF model. On a discrete GPU, quantized weights and FP16 KV cache sit in separate 24 GB GDDR6X or HBM VRAM at 1,008 GB/s while offloaded blocks stay in host DRAM across a 25 GB/s PCIe bridge before dequantizing in GPU registers. On Apple Silicon unified memory, CPU and GPU share one high-bandwidth pool up to 614 GB/s or 1.2 TB/s alongside macOS without a PCIe transfer step.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'

    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const green = fig.tone('green')
    const warm = fig.tone('warm')

    // Center hairline divider
    fig.line(width / 2, 16, width / 2, 314, { color: c.borderSubtle, width: 1 })

    // === Left: Discrete GPU (RTX 4090) ===
    const lx = 24
    const lw = 332
    fig.text(lx + lw / 2, 24, 'Discrete GPU (RTX 4090)', {
        size: 15,
        weight: 700,
        color: blue,
        align: 'center',
    })

    // Host RAM box
    fig.rect(lx, 46, lw, 46, {
        fill: tint(c.textMuted, c.bg, isLight ? 0.1 : 0.18),
        stroke: c.border,
        strokeWidth: 1.4,
        radius: 7,
    })
    fig.text(lx + lw / 2, 62, 'Host DRAM (offloaded blocks)', {
        size: 13,
        weight: 600,
        color: c.textPrimary,
        align: 'center',
    })
    fig.text(lx + lw / 2, 80, 'CPU fallback when model exceeds 24 GB', {
        size: 11.5,
        color: c.textSecondary,
        align: 'center',
    })

    // Narrow PCIe bottleneck arrow
    fig.arrow(lx + lw / 2, 94, lx + lw / 2, 134, {
        color: warm,
        width: 2,
        dash: '4 3',
        head: 6,
    })
    fig.text(lx + lw / 2 + 10, 114, 'PCIe ~25 GB/s (40×)', {
        size: 12,
        weight: 700,
        color: warm,
        mono: true,
    })

    // VRAM 24 GB box
    fig.rect(lx, 138, lw, 76, {
        fill: tint(blue, c.bg, isLight ? 0.14 : 0.24),
        stroke: blue,
        strokeWidth: 1.8,
        radius: 8,
    })
    fig.text(lx + lw / 2, 156, 'VRAM · 24 GB GDDR6X (1,008 GB/s)', {
        size: 13,
        weight: 700,
        color: blue,
        align: 'center',
    })
    // Inner Q4 weights + FP16 KV split
    fig.rect(lx + 12, 170, 198, 32, {
        fill: tint(blue, c.bg, isLight ? 0.22 : 0.36),
        stroke: blue,
        strokeWidth: 1.2,
        radius: 5,
    })
    fig.text(lx + 111, 186, 'Q4_K_M weights', {
        size: 12.5,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
    })
    fig.rect(lx + 216, 170, 104, 32, {
        fill: tint(warm, c.bg, isLight ? 0.2 : 0.32),
        stroke: warm,
        strokeWidth: 1.2,
        radius: 5,
    })
    fig.text(lx + 268, 186, 'FP16 KV', {
        size: 12.5,
        weight: 700,
        color: warm,
        align: 'center',
    })

    // Wide fast arrow to SMs
    fig.arrow(lx + lw / 2, 216, lx + lw / 2, 250, { color: green, width: 3.2, head: 7 })
    fig.text(lx + lw / 2 + 14, 232, '1,008 GB/s', {
        size: 12,
        weight: 700,
        color: green,
        mono: true,
    })

    // SMs box
    fig.rect(lx, 254, lw, 46, {
        fill: tint(green, c.bg, isLight ? 0.14 : 0.26),
        stroke: green,
        strokeWidth: 1.6,
        radius: 7,
    })
    fig.text(lx + lw / 2, 270, 'GPU SMs · register dequant + matmul', {
        size: 13,
        weight: 700,
        color: green,
        align: 'center',
    })
    fig.text(lx + lw / 2, 288, 'Fastest per token when resident in VRAM', {
        size: 11.5,
        color: c.textSecondary,
        align: 'center',
    })

    // === Right: Apple Silicon Unified ===
    const rx = 404
    const rw = 332
    fig.text(rx + rw / 2, 24, 'Apple Silicon Unified Memory', {
        size: 15,
        weight: 700,
        color: purple,
        align: 'center',
    })

    // Unified pool tall container
    fig.rect(rx, 46, rw, 168, {
        fill: tint(purple, c.bg, isLight ? 0.1 : 0.2),
        stroke: purple,
        strokeWidth: 1.8,
        radius: 8,
    })
    fig.text(rx + rw / 2, 66, 'Single Shared Pool · 614–1,200 GB/s', {
        size: 13,
        weight: 700,
        color: purple,
        align: 'center',
    })
    fig.text(rx + rw / 2, 86, 'Up to 128–512 GB · zero PCIe transfer', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
    })

    // Proportional segments: OS | Q4 weights | FP16 KV
    const segY = 108
    const segH = 60
    fig.rect(rx + 12, segY, 64, segH, {
        fill: tint(c.textMuted, c.bg, isLight ? 0.15 : 0.26),
        stroke: c.border,
        strokeWidth: 1.2,
        radius: 5,
    })
    fig.text(rx + 44, segY + 24, 'macOS', {
        size: 12,
        weight: 700,
        color: c.textSecondary,
        align: 'center',
    })
    fig.text(rx + 44, segY + 42, 'OS/apps', {
        size: 11,
        color: c.textMuted,
        align: 'center',
    })

    fig.rect(rx + 82, segY, 152, segH, {
        fill: tint(blue, c.bg, isLight ? 0.2 : 0.34),
        stroke: blue,
        strokeWidth: 1.4,
        radius: 5,
    })
    fig.text(rx + 158, segY + 24, 'Q4_K_M weights', {
        size: 12.5,
        weight: 700,
        color: blue,
        align: 'center',
    })
    fig.text(rx + 158, segY + 42, 'large models fit whole', {
        size: 11,
        color: c.textSecondary,
        align: 'center',
    })

    fig.rect(rx + 240, segY, 80, segH, {
        fill: tint(warm, c.bg, isLight ? 0.2 : 0.34),
        stroke: warm,
        strokeWidth: 1.4,
        radius: 5,
    })
    fig.text(rx + 280, segY + 24, 'KV cache', {
        size: 12,
        weight: 700,
        color: warm,
        align: 'center',
    })
    fig.text(rx + 280, segY + 42, 'shared', {
        size: 11,
        color: c.textSecondary,
        align: 'center',
    })

    fig.text(rx + rw / 2, 194, 'CPU and Metal GPU read identical physical pages', {
        size: 11.5,
        color: c.textSecondary,
        align: 'center',
    })

    // Wide direct arrow to Metal GPU
    fig.arrow(rx + rw / 2, 216, rx + rw / 2, 250, { color: purple, width: 3.2, head: 7 })
    fig.text(rx + rw / 2 + 14, 232, 'Direct unified fabric', {
        size: 12,
        weight: 700,
        color: purple,
    })

    fig.rect(rx, 254, rw, 46, {
        fill: tint(green, c.bg, isLight ? 0.14 : 0.26),
        stroke: green,
        strokeWidth: 1.6,
        radius: 7,
    })
    fig.text(rx + rw / 2, 270, 'Metal GPU · direct dequant + matmul', {
        size: 13,
        weight: 700,
        color: green,
        align: 'center',
    })
    fig.text(rx + rw / 2, 288, 'Large resident capacity; keep headroom for macOS', {
        size: 11.5,
        color: c.textSecondary,
        align: 'center',
    })

    // === Bottom bandwidth scale comparison ===
    fig.line(24, 326, width - 24, 326, { color: c.borderSubtle, width: 1 })
    fig.text(24, 344, 'Effective decode bandwidth scale', {
        size: 13,
        weight: 700,
        color: c.textPrimary,
    })

    const barX = 166
    const maxBW = 454
    const rows = [
        { label: 'RTX 4090 VRAM', val: 1008, text: '1,008 GB/s', tone: blue },
        { label: 'Unified Max/Ultra', val: 1200, text: '614–1,200 GB/s', tone: purple },
        { label: 'PCIe 4.0 x16', val: 25, text: '~25 GB/s (offload cliff)', tone: warm },
    ]
    rows.forEach((r, i) => {
        const y = 360 + i * 22
        fig.text(24, y + 6, r.label, { size: 12, weight: 600, color: c.textSecondary })
        const w = Math.max(10, (r.val / 1200) * maxBW)
        fig.rect(barX, y, w, 12, {
            fill: tint(r.tone, c.bg, isLight ? 0.32 : 0.48),
            stroke: r.tone,
            strokeWidth: 1.2,
            radius: 3,
        })
        fig.text(barX + w + 8, y + 6, r.text, {
            size: 12,
            weight: 700,
            color: r.tone,
            mono: true,
        })
    })

    return fig.render()
}

export default create('dark')
