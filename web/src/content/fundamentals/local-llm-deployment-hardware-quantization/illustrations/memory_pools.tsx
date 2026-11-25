import { type ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 390
export const alt =
    'Three physical memory topologies. A discrete GPU splits host RAM from device VRAM across a deliberate PCIe transfer path. Apple Silicon shares one physical pool across OS, weights, and KV cache. CPU NUMA nodes split local DIMM channels (89.6 GB/s dual-channel DDR5, 358.4 GB/s eight-channel) from slower remote socket hops.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'

    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const green = fig.tone('green')
    const warm = fig.tone('warm')

    // Column dividers (frameless three-column composition)
    const c1 = { x: 20, w: 224 }
    const c2 = { x: 268, w: 224 }
    const c3 = { x: 516, w: 224 }
    fig.line(256, 20, 256, 338, { color: c.borderSubtle, width: 1 })
    fig.line(504, 20, 504, 338, { color: c.borderSubtle, width: 1 })

    // === Column 1: Discrete GPU ===
    fig.text(c1.x + c1.w / 2, 28, 'Discrete GPU', {
        size: 15,
        weight: 700,
        color: blue,
        align: 'center',
    })
    fig.text(c1.x + c1.w / 2, 48, 'Split pools · explicit copy', {
        size: 12.5,
        color: c.textSecondary,
        align: 'center',
    })

    // Host RAM & GPU VRAM blocks
    const ramX = c1.x + 8
    const vramX = c1.x + 130
    const blkW = 86
    const blkY = 84
    const blkH = 128

    fig.rect(ramX, blkY, blkW, blkH, {
        fill: tint(c.textMuted, c.bg, isLight ? 0.1 : 0.18),
        stroke: c.border,
        strokeWidth: 1.4,
        radius: 7,
    })
    fig.text(ramX + blkW / 2, blkY + 46, 'Host', {
        size: 14,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
    })
    fig.text(ramX + blkW / 2, blkY + 66, 'RAM', {
        size: 13,
        color: c.textSecondary,
        align: 'center',
        mono: true,
    })
    fig.text(ramX + blkW / 2, blkY + 96, 'OS + CPU', {
        size: 11.5,
        color: c.textMuted,
        align: 'center',
    })

    fig.rect(vramX, blkY, blkW, blkH, {
        fill: tint(blue, c.bg, isLight ? 0.18 : 0.3),
        stroke: blue,
        strokeWidth: 1.8,
        radius: 7,
    })
    fig.text(vramX + blkW / 2, blkY + 46, 'GPU', {
        size: 14,
        weight: 700,
        color: blue,
        align: 'center',
    })
    fig.text(vramX + blkW / 2, blkY + 66, 'VRAM', {
        size: 13,
        weight: 600,
        color: c.textPrimary,
        align: 'center',
        mono: true,
    })
    fig.text(vramX + blkW / 2, blkY + 96, 'Wts + KV', {
        size: 11.5,
        color: blue,
        align: 'center',
    })

    // PCIe bridge arrow
    fig.arrow(ramX + blkW + 3, blkY + blkH / 2, vramX - 3, blkY + blkH / 2, {
        color: warm,
        width: 2.2,
        dash: '4 3',
        head: 6,
    })
    fig.text((ramX + blkW + vramX) / 2, blkY + blkH / 2 - 18, 'PCIe', {
        size: 12,
        weight: 700,
        color: warm,
        align: 'center',
        mono: true,
    })

    fig.text(c1.x + c1.w / 2, 248, 'RAM != VRAM', {
        size: 13.5,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
        mono: true,
    })
    fig.text(c1.x + c1.w / 2, 272, 'Cross-bus copy is bottleneck', {
        size: 12,
        color: warm,
        align: 'center',
    })

    // === Column 2: Apple Silicon Unified ===
    fig.text(c2.x + c2.w / 2, 28, 'Apple Unified', {
        size: 15,
        weight: 700,
        color: purple,
        align: 'center',
    })
    fig.text(c2.x + c2.w / 2, 48, 'One physical pool', {
        size: 12.5,
        color: c.textSecondary,
        align: 'center',
    })

    // CPU + Metal GPU tiles
    const cpuX = c2.x + 12
    const gpuX = c2.x + 122
    const chipW = 90
    const chipY = 84
    const chipH = 44

    fig.rect(cpuX, chipY, chipW, chipH, {
        fill: tint(c.textMuted, c.bg, isLight ? 0.1 : 0.18),
        stroke: c.border,
        strokeWidth: 1.4,
        radius: 6,
    })
    fig.text(cpuX + chipW / 2, chipY + chipH / 2, 'CPU', {
        size: 13.5,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
    })

    fig.rect(gpuX, chipY, chipW, chipH, {
        fill: tint(purple, c.bg, isLight ? 0.18 : 0.3),
        stroke: purple,
        strokeWidth: 1.8,
        radius: 6,
    })
    fig.text(gpuX + chipW / 2, chipY + chipH / 2, 'Metal GPU', {
        size: 13.5,
        weight: 700,
        color: purple,
        align: 'center',
    })

    // Direct bidirectional arrows down to shared pool
    fig.arrow(cpuX + chipW / 2, chipY + chipH + 2, cpuX + chipW / 2, 152, {
        color: c.textSecondary,
        width: 1.8,
        head: 6,
    })
    fig.arrow(gpuX + chipW / 2, chipY + chipH + 2, gpuX + chipW / 2, 152, {
        color: purple,
        width: 2.2,
        head: 6,
    })

    // Unified pool segmented bar
    const poolX = c2.x + 12
    const poolY = 156
    const poolW = 200
    const poolH = 56
    fig.rect(poolX, poolY, poolW, poolH, {
        fill: tint(purple, c.bg, isLight ? 0.08 : 0.16),
        stroke: purple,
        strokeWidth: 1.6,
        radius: 7,
    })
    // Subdivisions inside shared pool
    fig.rect(poolX + 6, poolY + 8, 42, poolH - 16, {
        fill: tint(c.textMuted, c.bg, isLight ? 0.16 : 0.28),
        stroke: c.border,
        strokeWidth: 1,
        radius: 4,
    })
    fig.text(poolX + 27, poolY + poolH / 2, 'OS', {
        size: 12,
        weight: 600,
        color: c.textSecondary,
        align: 'center',
    })
    fig.rect(poolX + 52, poolY + 8, 86, poolH - 16, {
        fill: tint(blue, c.bg, isLight ? 0.2 : 0.32),
        stroke: blue,
        strokeWidth: 1.2,
        radius: 4,
    })
    fig.text(poolX + 95, poolY + poolH / 2, 'Weights', {
        size: 12,
        weight: 700,
        color: blue,
        align: 'center',
    })
    fig.rect(poolX + 142, poolY + 8, 52, poolH - 16, {
        fill: tint(warm, c.bg, isLight ? 0.2 : 0.32),
        stroke: warm,
        strokeWidth: 1.2,
        radius: 4,
    })
    fig.text(poolX + 168, poolY + poolH / 2, 'KV', {
        size: 12,
        weight: 700,
        color: warm,
        align: 'center',
    })

    fig.text(c2.x + c2.w / 2, 248, 'Zero PCIe copy', {
        size: 13.5,
        weight: 700,
        color: purple,
        align: 'center',
    })
    fig.text(c2.x + c2.w / 2, 272, 'OS + apps compete for pool', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
    })

    // === Column 3: CPU NUMA ===
    fig.text(c3.x + c3.w / 2, 28, 'CPU NUMA', {
        size: 15,
        weight: 700,
        color: green,
        align: 'center',
    })
    fig.text(c3.x + c3.w / 2, 48, 'Local vs remote DIMMs', {
        size: 12.5,
        color: c.textSecondary,
        align: 'center',
    })

    const n0X = c3.x + 12
    const n1X = c3.x + 132
    const nW = 80
    const nY = 84
    const nH = 74

    fig.rect(n0X, nY, nW, nH, {
        fill: tint(green, c.bg, isLight ? 0.16 : 0.28),
        stroke: green,
        strokeWidth: 1.6,
        radius: 7,
    })
    fig.text(n0X + nW / 2, nY + 26, 'Node 0', {
        size: 13,
        weight: 700,
        color: green,
        align: 'center',
    })
    fig.text(n0X + nW / 2, nY + 48, 'local RAM', {
        size: 11.5,
        color: c.textSecondary,
        align: 'center',
    })

    fig.rect(n1X, nY, nW, nH, {
        fill: tint(blue, c.bg, isLight ? 0.16 : 0.28),
        stroke: blue,
        strokeWidth: 1.6,
        radius: 7,
    })
    fig.text(n1X + nW / 2, nY + 26, 'Node 1', {
        size: 13,
        weight: 700,
        color: blue,
        align: 'center',
    })
    fig.text(n1X + nW / 2, nY + 48, 'local RAM', {
        size: 11.5,
        color: c.textSecondary,
        align: 'center',
    })

    fig.arrow(n0X + nW + 3, nY + nH / 2, n1X - 3, nY + nH / 2, {
        color: warm,
        width: 1.8,
        dash: '4 3',
        head: 5,
    })
    fig.text((n0X + nW + n1X) / 2, nY + nH / 2 - 16, 'hop', {
        size: 11.5,
        weight: 600,
        color: warm,
        align: 'center',
    })

    // Bandwidth comparison bars (2ch vs 8ch DDR5)
    const barX = c3.x + 12
    const maxW = 200
    fig.text(barX, 186, '2ch DDR5 · 89.6 GB/s', {
        size: 12,
        weight: 600,
        color: c.textSecondary,
        mono: true,
    })
    fig.rect(barX, 198, maxW, 14, {
        fill: tint(c.textMuted, c.bg, isLight ? 0.1 : 0.18),
        radius: 4,
    })
    fig.rect(barX, 198, maxW * (89.6 / 358.4), 14, {
        fill: tint(green, c.bg, isLight ? 0.35 : 0.5),
        stroke: green,
        strokeWidth: 1.2,
        radius: 4,
    })

    fig.text(barX, 234, '8ch DDR5 · 358.4 GB/s', {
        size: 12,
        weight: 700,
        color: green,
        mono: true,
    })
    fig.rect(barX, 246, maxW, 14, {
        fill: tint(green, c.bg, isLight ? 0.25 : 0.38),
        stroke: green,
        strokeWidth: 1.4,
        radius: 4,
    })

    fig.text(c3.x + c3.w / 2, 286, '4× channel scaling', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
    })

    // Clean bottom hairline takeaway
    fig.line(24, 342, width - 24, 342, { color: c.borderSubtle, width: 1 })
    fig.text(
        width / 2,
        366,
        'DDR5 peaks are theoretical channel ceilings; verify sustained throughput empirically.',
        {
            size: 12.5,
            color: c.textSecondary,
            align: 'center',
        },
    )

    return fig.render()
}

export default create('dark')
