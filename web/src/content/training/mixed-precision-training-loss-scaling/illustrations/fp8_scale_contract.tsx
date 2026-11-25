import type { ThemeMode } from 'vizmatic'
import { layoutCellGrid } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 720
export const height = 385
export const alt =
    'Side by side, 8-bit FP8 element layouts compare E4M3 (1 sign, 4 exponent, 3 fraction; max 448, no infinity) and E5M2 (1 sign, 5 exponent, 2 fraction; max 57,344, infinity encoded). On the right, MXFP8 groups 32 FP8 values per block with one shared E8M0 power-of-two scale.'

export const fp8Formats = [
    { id: 'e4m3', name: 'E4M3 · forward', bits: [1, 4, 3], maximum: 448, infinity: false },
    { id: 'e5m2', name: 'E5M2 · backward', bits: [1, 5, 2], maximum: 57344, infinity: true },
] as const

export const mxBlocks = [0, 1].map((index) => ({
    id: 'block-' + index,
    index,
    layout: layoutCellGrid({
        x: 382,
        y: 118 + index * 116,
        width: 208,
        height: 36,
        rows: 2,
        columns: 16,
    }),
}))

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const sign = fig.tone('warm')
    const exp = fig.tone('cyan')
    const frac = fig.tone('purple')
    const scale = fig.tone('blue')
    const muted = c.textSecondary

    // Left: E4M3 & E5M2 element bit layouts
    fig.text(20, 22, '1. FP8 element encodings', { size: 16, weight: 700 })
    fig.text(20, 48, 's: sign · e: exponent · f: fraction', { size: 14, color: muted })

    const bitW = 39
    const leftX = 20
    const formatYs = [110, 244]

    fp8Formats.forEach((fmt, fIdx) => {
        const y = formatYs[fIdx]!
        fig.text(leftX, y - 20, fmt.name, { size: 15, weight: 700, color: c.textPrimary })
        fig.text(leftX + 8 * bitW, y - 20, `max ${fmt.maximum.toLocaleString()}`, {
            size: 14,
            mono: true,
            weight: 700,
            color: fIdx === 0 ? frac : exp,
            align: 'right',
        })

        const colors = [sign, exp, frac]
        const syms = ['s', 'e', 'f']
        let bitPos = 0
        fmt.bits.forEach((count, g) => {
            const x = leftX + bitPos * bitW
            const w = count * bitW
            const col = colors[g]!
            fig.rect(x, y, w, 46, {
                fill: tint(col, c.bg, 0.2),
                stroke: col,
                strokeWidth: 1.6,
                radius: 3,
            })
            for (let b = 1; b < count; b++) {
                fig.line(x + b * bitW, y + 4, x + b * bitW, y + 42, {
                    color: col,
                    width: 0.75,
                    opacity: 0.35,
                })
            }
            fig.text(x + w / 2, y + 23, `${count}${syms[g]}`, {
                size: 15,
                mono: true,
                weight: 700,
                color: col,
                align: 'center',
            })
            bitPos += count
        })

        fig.text(
            leftX,
            y + 66,
            fmt.infinity ? 'Infinity encoded (wider range)' : 'No Inf · saturates at ±448',
            { size: 14, color: muted },
        )
    })

    // Vertical divider
    fig.line(356, 20, 356, 360, { color: c.borderSubtle, width: 1 })

    // Right: MXFP8 block-scaled layout (32 FP8 values -> 1 shared E8M0 scale)
    const rx = 378
    fig.text(rx, 22, '2. MXFP8 (32 values / scale)', { size: 16, weight: 700 })
    fig.text(rx, 48, 'Shared 2^e scale per 32 values', { size: 14, color: muted })

    const cell = 13.5
    const blockYs = [116, 240]
    blockYs.forEach((by, bIdx) => {
        const col = bIdx === 0 ? scale : exp
        fig.text(rx, by - 20, `Block ${bIdx} · 32 FP8 values`, {
            size: 14,
            weight: 600,
            color: c.textPrimary,
        })

        for (let r = 0; r < 2; r++) {
            for (let k = 0; k < 16; k++) {
                fig.rect(rx + k * cell, by + r * cell, cell - 1.5, cell - 1.5, {
                    fill: tint(col, c.bg, 0.28),
                    stroke: tint(col, c.bg, 0.65),
                    strokeWidth: 0.9,
                    radius: 2,
                })
            }
        }

        const scaleX = rx + 16 * cell + 30
        fig.arrow(scaleX - 4, by + cell, rx + 16 * cell + 4, by + cell, {
            color: scale,
            width: 1.8,
            head: 6,
        })

        fig.rect(scaleX, by - 6, 76, cell * 2 + 12, {
            fill: tint(scale, c.bg, 0.16),
            stroke: scale,
            strokeWidth: 1.6,
            radius: 6,
        })
        fig.text(scaleX + 38, by + cell, 'E8M0', {
            size: 15,
            mono: true,
            weight: 700,
            color: scale,
            align: 'center',
        })
    })

    fig.text(rx, 314, 'E8M0: 8 exponent bits only.', { size: 14, color: muted })
    fig.text(rx, 342, 'Power-of-two block scaling.', {
        size: 14,
        weight: 600,
        color: c.textPrimary,
    })

    return fig.render()
}

export default create('dark')
