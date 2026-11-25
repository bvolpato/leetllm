import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 800
export const height = 356
export const alt =
    'Visibility grids for three Transformer families, where rows are queries Q and columns are keys K. Encoder-only self-attention fills all sixteen cells. Decoder-only self-attention is lower triangular with hatched masked entries above the diagonal. An encoder-decoder model pairs causal target self-attention with full cross-attention so each target query reads every source position.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'

    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const amberText = isLight ? '#9a5204' : '#f2b84b'
    const amberMark = isLight ? '#d07a12' : '#f2b84b'

    const drawGrid = (
        x0: number,
        y0: number,
        rows: number,
        cols: number,
        causal: boolean,
        fillColor: string,
        qAxis: string,
        kAxis: string,
    ) => {
        const cell = 28
        const gap = 4
        const step = cell + gap
        const gridW = cols * step - gap
        const gridH = rows * step - gap
        const activeFill = tint(fillColor, c.bg, isLight ? 0.72 : 0.78)
        const maskedFill = isLight ? '#f3efe6' : '#151820'

        // K axis header above columns
        fig.text(x0 + gridW / 2, y0 - 18, kAxis, {
            size: 17,
            color: c.textSecondary,
            align: 'center',
            weight: 600,
        })

        // Q axis label left of rows
        fig.text(x0 - 16, y0 + gridH / 2, qAxis, {
            size: 17,
            color: c.textSecondary,
            align: 'right',
            weight: 600,
            width: 26,
        })

        for (let r = 0; r < rows; r++) {
            for (let k = 0; k < cols; k++) {
                const x = x0 + k * step
                const y = y0 + r * step
                const visible = !causal || k <= r
                if (visible) {
                    fig.rect(x, y, cell, cell, {
                        fill: activeFill,
                        stroke: fillColor,
                        strokeWidth: 1.5,
                        radius: 4,
                    })
                } else {
                    fig.rect(x, y, cell, cell, {
                        fill: maskedFill,
                        stroke: c.border,
                        strokeWidth: 1.1,
                        radius: 4,
                    })
                    // Crisp diagonal hatch inside masked cells
                    fig.line(x + 6, y + cell - 6, x + cell - 6, y + 6, {
                        color: c.textMuted,
                        width: 1.25,
                        opacity: 0.65,
                    })
                    fig.line(x + 5, y + cell * 0.5, x + cell * 0.5, y + 5, {
                        color: c.textMuted,
                        width: 1,
                        opacity: 0.4,
                    })
                    fig.line(x + cell * 0.5, y + cell - 5, x + cell - 5, y + cell * 0.5, {
                        color: c.textMuted,
                        width: 1,
                        opacity: 0.4,
                    })
                }
            }
        }
    }

    // Section 1: Encoder-only
    fig.text(112, 28, 'Encoder-only', { size: 21, weight: 750, color: blue, align: 'center' })
    drawGrid(50, 92, 4, 4, false, blue, 'Q', 'Keys K')
    fig.text(112, 246, 'All keys visible', {
        size: 18,
        color: blue,
        align: 'center',
        weight: 600,
        width: 180,
    })

    // Divider 1
    fig.line(206, 24, 206, 266, { color: c.borderSubtle, width: 1.25 })

    // Section 2: Decoder-only
    fig.text(310, 28, 'Decoder-only', { size: 21, weight: 750, color: amberText, align: 'center' })
    drawGrid(248, 92, 4, 4, true, amberMark, 'Q', 'Keys K')
    fig.text(310, 246, 'Causal (k ≤ q)', {
        size: 18,
        color: amberText,
        align: 'center',
        weight: 600,
        width: 180,
    })

    // Divider 2
    fig.line(408, 24, 408, 266, { color: c.borderSubtle, width: 1.25 })

    // Section 3: Encoder-decoder
    fig.text(606, 28, 'Encoder-decoder', { size: 21, weight: 750, color: green, align: 'center' })
    drawGrid(454, 92, 4, 4, true, amberMark, 'Q', 'Target K')
    fig.text(516, 246, 'Target self', {
        size: 18,
        color: amberText,
        align: 'center',
        weight: 600,
        width: 140,
    })

    drawGrid(624, 92, 4, 5, false, green, 'Q', 'Source K')
    fig.text(702, 246, 'Cross to src', {
        size: 18,
        color: green,
        align: 'center',
        weight: 600,
        width: 150,
    })

    // Bottom clean key
    fig.line(24, 288, width - 24, 288, { color: c.borderSubtle, width: 1 })
    const legY = 322
    // Active swatch
    fig.rect(80, legY - 10, 20, 20, {
        fill: tint(blue, c.bg, isLight ? 0.72 : 0.78),
        stroke: blue,
        strokeWidth: 1.5,
        radius: 4,
    })
    fig.text(110, legY, 'Visible (score kept)', { size: 17, color: c.textSecondary, weight: 550 })

    // Masked swatch
    fig.rect(314, legY - 10, 20, 20, {
        fill: isLight ? '#f3efe6' : '#151820',
        stroke: c.border,
        strokeWidth: 1.1,
        radius: 4,
    })
    fig.line(318, legY + 6, 330, legY - 6, { color: c.textMuted, width: 1.25, opacity: 0.7 })
    fig.text(344, legY, 'Masked (−∞ → 0)', { size: 17, color: c.textSecondary, weight: 550 })

    fig.text(548, legY, 'Rows = Q · Cols = K', {
        size: 17,
        color: c.textSecondary,
        weight: 600,
    })

    return fig.render()
}

export default create('dark')
