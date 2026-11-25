import { type ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 430
export const alt =
    'Comparison of the fixed baseline against three single-variable optimization branches. The baseline pairs a 32x8 block (256 threads, 8 warps), a 32x32 shared tile (4,096 B), and loop offsets 0, 8, 16, and 24. Branch A pads the tile to 32x33 (4,224 B, +128 B). Branch B applies #pragma unroll across the four offsets. Branch C doubles the block to 32x16 (512 threads, 16 warps).'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'

    const blue = fig.tone('blue')
    const cyan = fig.tone('cyan')
    const green = fig.tone('green')
    const purple = fig.tone('purple')
    const warm = fig.tone('warm')

    // === Top: Fixed Baseline Strip ===
    fig.text(width / 2, 22, 'Fixed baseline: hold two variables constant per branch', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
    })

    const baseX = 28
    const baseY = 44
    const baseW = 704
    const baseH = 114
    fig.rect(baseX, baseY, baseW, baseH, {
        fill: tint(blue, c.bg, isLight ? 0.08 : 0.16),
        stroke: blue,
        strokeWidth: 1.6,
        radius: 8,
    })

    // Baseline part 1: Block 32x8 mini warp rows
    const p1X = baseX + 24
    fig.text(p1X + 90, baseY + 18, 'Block 32 × 8', {
        size: 13,
        weight: 700,
        color: cyan,
        align: 'center',
    })
    for (let r = 0; r < 4; r++) {
        fig.rect(p1X + 18, baseY + 32 + r * 11, 144, 8, {
            fill: tint(cyan, c.bg, isLight ? 0.25 : 0.4),
            stroke: cyan,
            strokeWidth: 0.9,
            radius: 2,
        })
    }
    fig.text(p1X + 90, baseY + 94, '256 threads · 8 warps', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
        mono: true,
    })

    fig.line(baseX + 234, baseY + 14, baseX + 234, baseY + baseH - 14, {
        color: c.borderSubtle,
        width: 1,
    })

    // Baseline part 2: Shared tile 32x32
    const p2X = baseX + 258
    fig.text(p2X + 92, baseY + 18, 'Shared tile 32 × 32', {
        size: 13,
        weight: 700,
        color: blue,
        align: 'center',
    })
    // 6x6 schematic grid
    const gStart = p2X + 66
    for (let r = 0; r < 5; r++) {
        for (let col = 0; col < 5; col++) {
            fig.rect(gStart + col * 10, baseY + 30 + r * 10, 8, 8, {
                fill: tint(blue, c.bg, isLight ? 0.22 : 0.36),
                stroke: blue,
                strokeWidth: 0.7,
                radius: 1.5,
            })
        }
    }
    fig.text(p2X + 92, baseY + 94, '4,096 B / block', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
        mono: true,
    })

    fig.line(baseX + 468, baseY + 14, baseX + 468, baseY + baseH - 14, {
        color: c.borderSubtle,
        width: 1,
    })

    // Baseline part 3: Loop offsets
    const p3X = baseX + 490
    fig.text(p3X + 95, baseY + 18, 'Loop offsets (step 8)', {
        size: 13,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
    })
    const offsets = ['0', '8', '16', '24']
    offsets.forEach((o, i) => {
        const ox = p3X + 8 + i * 44
        fig.rect(ox, baseY + 40, 38, 28, {
            fill: tint(c.textMuted, c.bg, isLight ? 0.1 : 0.2),
            stroke: c.border,
            strokeWidth: 1.2,
            radius: 5,
        })
        fig.text(ox + 19, baseY + 54, o, {
            size: 13,
            weight: 700,
            color: c.textPrimary,
            align: 'center',
            mono: true,
        })
    })
    fig.text(p3X + 95, baseY + 94, 'kTile = 32 · rolled', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
        mono: true,
    })

    // === Orthogonal fan-out connectors ===
    const trunkY = baseY + baseH
    const splitY = trunkY + 24
    const cardTop = splitY + 24
    const colCenters = [138, 380, 622]

    fig.line(width / 2, trunkY, width / 2, splitY, { color: c.border, width: 1.6 })
    fig.line(colCenters[0], splitY, colCenters[2], splitY, { color: c.border, width: 1.6 })
    fig.arrow(colCenters[0], splitY, colCenters[0], cardTop - 2, { color: green, width: 1.8, head: 6 })
    fig.arrow(colCenters[1], splitY, colCenters[1], cardTop - 2, { color: purple, width: 1.8, head: 6 })
    fig.arrow(colCenters[2], splitY, colCenters[2], cardTop - 2, { color: warm, width: 1.8, head: 6 })

    // === Three Single-Variable Branches ===
    const cardW = 220
    const cardH = 190

    // Branch A: Pad (+1 col)
    const ax = colCenters[0] - cardW / 2
    fig.rect(ax, cardTop, cardW, cardH, {
        fill: tint(green, c.bg, isLight ? 0.08 : 0.15),
        stroke: green,
        strokeWidth: 1.6,
        radius: 8,
    })
    fig.text(colCenters[0], cardTop + 20, 'A. Pad tile (+1 col)', {
        size: 14,
        weight: 700,
        color: green,
        align: 'center',
    })
    // Visual strip: 32 cols green + 1 warm pad col
    const stripX = ax + 22
    const stripY = cardTop + 42
    fig.rect(stripX, stripY, 152, 34, {
        fill: tint(green, c.bg, isLight ? 0.22 : 0.36),
        stroke: green,
        strokeWidth: 1.3,
        radius: 4,
    })
    fig.text(stripX + 76, stripY + 17, '32 data cols', {
        size: 12,
        weight: 700,
        color: green,
        align: 'center',
    })
    fig.rect(stripX + 156, stripY, 20, 34, {
        fill: tint(warm, c.bg, isLight ? 0.3 : 0.45),
        stroke: warm,
        strokeWidth: 1.4,
        radius: 4,
    })
    fig.text(stripX + 166, stripY + 17, '+1', {
        size: 11.5,
        weight: 700,
        color: warm,
        align: 'center',
        mono: true,
    })
    fig.text(colCenters[0], cardTop + 102, 'tile[32][33]', {
        size: 13.5,
        weight: 700,
        color: green,
        align: 'center',
        mono: true,
    })
    fig.text(colCenters[0], cardTop + 126, '4,224 B (+128 B)', {
        size: 12.5,
        color: c.textPrimary,
        align: 'center',
        mono: true,
    })
    fig.text(colCenters[0], cardTop + 150, '256 threads · rolled loop', {
        size: 11.5,
        color: c.textSecondary,
        align: 'center',
    })
    fig.text(colCenters[0], cardTop + 172, 'Eliminates bank conflicts', {
        size: 11.5,
        weight: 600,
        color: green,
        align: 'center',
    })

    // Branch B: #pragma unroll
    const bx = colCenters[1] - cardW / 2
    fig.rect(bx, cardTop, cardW, cardH, {
        fill: tint(purple, c.bg, isLight ? 0.08 : 0.15),
        stroke: purple,
        strokeWidth: 1.6,
        radius: 8,
    })
    fig.text(colCenters[1], cardTop + 20, 'B. Unroll loop', {
        size: 14,
        weight: 700,
        color: purple,
        align: 'center',
    })
    // Four unrolled instruction strips
    const uOffsets = ['+0', '+8', '+16', '+24']
    uOffsets.forEach((u, i) => {
        const ux = bx + 16 + i * 48
        fig.rect(ux, cardTop + 42, 42, 34, {
            fill: tint(purple, c.bg, isLight ? 0.2 : 0.34),
            stroke: purple,
            strokeWidth: 1.3,
            radius: 4,
        })
        fig.text(ux + 21, cardTop + 59, u, {
            size: 12.5,
            weight: 700,
            color: purple,
            align: 'center',
            mono: true,
        })
    })
    fig.text(colCenters[1], cardTop + 102, '#pragma unroll', {
        size: 13.5,
        weight: 700,
        color: purple,
        align: 'center',
        mono: true,
    })
    fig.text(colCenters[1], cardTop + 126, '4 inlined steps', {
        size: 12.5,
        color: c.textPrimary,
        align: 'center',
    })
    fig.text(colCenters[1], cardTop + 150, '256 threads · 32×32 tile', {
        size: 11.5,
        color: c.textSecondary,
        align: 'center',
    })
    fig.text(colCenters[1], cardTop + 172, 'Inspect SASS & reg spills', {
        size: 11.5,
        weight: 600,
        color: purple,
        align: 'center',
    })

    // Branch C: Block 32x16
    const cx3 = colCenters[2] - cardW / 2
    fig.rect(cx3, cardTop, cardW, cardH, {
        fill: tint(warm, c.bg, isLight ? 0.08 : 0.15),
        stroke: warm,
        strokeWidth: 1.6,
        radius: 8,
    })
    fig.text(colCenters[2], cardTop + 20, 'C. Block 32 × 16', {
        size: 14,
        weight: 700,
        color: warm,
        align: 'center',
    })
    // Two stacked warp bands: original 8 warps (cyan) + added 8 warps (warm)
    fig.rect(cx3 + 26, cardTop + 40, 168, 17, {
        fill: tint(cyan, c.bg, isLight ? 0.22 : 0.36),
        stroke: cyan,
        strokeWidth: 1.2,
        radius: 3,
    })
    fig.text(colCenters[2], cardTop + 48.5, 'warps 0–7 (base)', {
        size: 11,
        weight: 600,
        color: cyan,
        align: 'center',
    })
    fig.rect(cx3 + 26, cardTop + 61, 168, 17, {
        fill: tint(warm, c.bg, isLight ? 0.24 : 0.38),
        stroke: warm,
        strokeWidth: 1.2,
        radius: 3,
    })
    fig.text(colCenters[2], cardTop + 69.5, 'warps 8–15 (+2×)', {
        size: 11,
        weight: 700,
        color: warm,
        align: 'center',
    })
    fig.text(colCenters[2], cardTop + 102, '512 threads (16 warps)', {
        size: 13,
        weight: 700,
        color: warm,
        align: 'center',
        mono: true,
    })
    fig.text(colCenters[2], cardTop + 126, '2× warps / block', {
        size: 12.5,
        color: c.textPrimary,
        align: 'center',
    })
    fig.text(colCenters[2], cardTop + 150, '32×32 tile · rolled loop', {
        size: 11.5,
        color: c.textSecondary,
        align: 'center',
    })
    fig.text(colCenters[2], cardTop + 172, 'Check occupancy & regs', {
        size: 11.5,
        weight: 600,
        color: warm,
        align: 'center',
    })

    // Bottom verification note
    fig.text(
        width / 2,
        412,
        'Verify correctness, SASS, register count, and repeated timings independently on each branch.',
        {
            size: 12,
            color: c.textSecondary,
            align: 'center',
        },
    )

    return fig.render()
}

export default create('dark')
