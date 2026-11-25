import type { ThemeMode } from 'vizmatic'
import { withColorAlpha } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 516
export const alt =
    'Product quantization splits a 768-dimensional float32 vector into 96 eight-dimensional subvectors. Each subvector maps to one of 256 centroids in its own codebook and contributes one byte, reducing 3,072 bytes to 96 bytes (32x compression). At query time, an uncompressed query builds a 96 by 256 float32 distance table. Asymmetric Distance Computation sums 96 precomputed centroid distances without reconstructing the full vector.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const green = fig.tone('green')
    const cyan = fig.tone('cyan')

    // Helper: draw compact tiled grid directly on SVG mark layer
    const drawMiniGrid = (
        gx: number,
        gy: number,
        rows: number,
        cols: number,
        cell: number,
        gap: number,
        color: string,
        hlRow: number,
        hlCol: number,
    ) => {
        for (let r = 0; r < rows; r++) {
            for (let col = 0; col < cols; col++) {
                const hl = r === hlRow && col === hlCol
                fig.rect(gx + col * (cell + gap), gy + r * (cell + gap), cell, cell, {
                    fill: hl ? green : withColorAlpha(color, 0.25),
                    stroke: hl ? green : withColorAlpha(color, 0.55),
                    strokeWidth: hl ? 1.2 : 0.6,
                    radius: cell >= 10 ? 2 : 1,
                })
            }
        }
    }

    // ── TOP BAND: ENCODE (Offline Compression) ───────────────────────────────
    fig.text(20, 18, 'ENCODE · Offline Compression', {
        size: 16,
        weight: 700,
        color: blue,
    })
    fig.text(width - 20, 18, '3,072 B float32 to 96 B code (32×)', {
        size: 13,
        mono: true,
        weight: 700,
        color: green,
        align: 'right',
    })

    // 1. 96 subspaces (8x12 grid)
    fig.text(20, 48, '96 subspaces (8D)', { size: 14, weight: 700, color: c.textPrimary })
    drawMiniGrid(24, 68, 8, 12, 8, 1.5, blue, 0, 0)
    fig.text(24, 158, 'u₀ = x[0..7]', { size: 13, mono: true, weight: 600, color: c.textSecondary })

    fig.arrow(146, 106, 182, 106, { color: c.textMuted, width: 1.8, head: 7 })

    // 2. Subvector u0 (1x8 cells)
    fig.text(262, 48, 'Subvector u₀', { size: 14, weight: 700, color: blue, align: 'center' })
    drawMiniGrid(194, 98, 1, 8, 15, 2, blue, -1, -1)
    fig.text(262, 134, '8 float32 values', {
        size: 13,
        color: c.textSecondary,
        align: 'center',
    })

    fig.arrow(338, 106, 374, 106, { color: c.textMuted, width: 1.8, head: 7 })

    // 3. Codebook C0 (16x16 = 256 centroids)
    fig.text(436, 48, 'Codebook C₀ (256)', {
        size: 14,
        weight: 700,
        color: purple,
        align: 'center',
    })
    drawMiniGrid(388, 66, 16, 16, 5, 1, purple, 2, 10)
    fig.text(436, 174, 'Nearest ID: 42', {
        size: 13,
        mono: true,
        weight: 700,
        color: green,
        align: 'center',
    })

    fig.arrow(496, 106, 534, 106, { color: c.textMuted, width: 1.8, head: 7 })

    // 4. Encoded uint8 byte
    fig.rect(546, 82, 194, 48, {
        fill: withColorAlpha(green, 0.14),
        stroke: green,
        strokeWidth: 1.8,
        radius: 8,
    })
    fig.text(643, 106, 'Byte c₀ = 42 (uint8)', {
        size: 15,
        mono: true,
        weight: 700,
        color: green,
        align: 'center',
    })

    // Compact 96-byte code strip
    const codeY = 200
    fig.text(20, codeY + 18, '96-byte code:', { size: 14, weight: 700, color: c.textPrimary })
    const cells = ['42', 'c₁', 'c₂', 'c₃', '…', 'c₉₅'] as const
    cells.forEach((txt, i) => {
        const cx = 148 + i * 66
        const first = i === 0
        fig.rect(cx, codeY, 60, 36, {
            fill: first ? withColorAlpha(green, 0.18) : tint(c.border, c.bg, 0.25),
            stroke: first ? green : c.borderSubtle,
            strokeWidth: first ? 1.8 : 1.1,
            radius: 6,
        })
        fig.text(cx + 30, codeY + 18, txt, {
            size: 14,
            mono: true,
            weight: first ? 700 : 600,
            color: first ? green : c.textPrimary,
            align: 'center',
        })
    })
    fig.text(width - 20, codeY + 18, '768 KiB shared codebooks', {
        size: 13,
        color: c.textSecondary,
        align: 'right',
    })

    // Clean horizontal hairline separator between ENCODE and SEARCH
    fig.line(20, 258, width - 20, 258, { color: c.border, width: 1 })

    // ── BOTTOM BAND: SEARCH (Online Asymmetric Distance Computation) ─────────
    fig.text(20, 282, 'SEARCH · Online Asymmetric Distance (ADC)', {
        size: 16,
        weight: 700,
        color: cyan,
    })
    fig.text(width - 20, 282, 'Uncompressed query q', {
        size: 13,
        weight: 600,
        color: c.textSecondary,
        align: 'right',
    })

    // Step 1: 96 x 256 Lookup Table T
    fig.text(20, 314, '1. Precompute 96 × 256 table T', {
        size: 14,
        weight: 700,
        color: c.textPrimary,
    })
    drawMiniGrid(24, 336, 16, 16, 5, 1, cyan, 2, 10)
    fig.math(136, 352, 'T[m, k] = \\|q_m - C_m[k]\\|^2', { size: 15, color: cyan })
    fig.text(136, 384, '256 centroid distances / subspace', { size: 13, color: c.textSecondary })
    fig.text(136, 408, '96 KiB float32 (fits L2 cache)', {
        size: 13,
        mono: true,
        color: c.textMuted,
    })

    // Vertical hairline between Step 1 and Step 2
    fig.line(412, 306, 412, 434, { color: c.borderSubtle, width: 1 })

    // Step 2: Score candidate via 96 table lookups
    fig.text(432, 314, '2. Score candidate codes', {
        size: 14,
        weight: 700,
        color: c.textPrimary,
    })
    fig.rect(432, 338, 308, 90, {
        fill: withColorAlpha(cyan, 0.08),
        stroke: withColorAlpha(cyan, 0.45),
        strokeWidth: 1.3,
        radius: 8,
    })
    fig.text(448, 358, 'c₀ = 42  reads  T[0, 42]', {
        size: 14,
        mono: true,
        weight: 700,
        color: c.textPrimary,
    })
    fig.text(448, 384, '96 lookups + 95 float additions', {
        size: 14,
        weight: 600,
        color: cyan,
    })
    fig.text(448, 408, 'Zero vector reconstruction', {
        size: 13,
        color: c.textSecondary,
    })

    // Bottom ADC Equation strip (crisp vector TeX)
    fig.rect(20, 448, width - 40, 52, {
        fill: withColorAlpha(green, 0.1),
        stroke: withColorAlpha(green, 0.5),
        strokeWidth: 1.5,
        radius: 8,
    })
    fig.math(
        width / 2,
        474,
        '\\mathrm{ADC}(q, c) = T[0, c_0] + T[1, c_1] + \\cdots + T[95, c_{95}]',
        { size: 16, color: green, align: 'center' },
    )

    return fig.render()
}

export default create('dark')
