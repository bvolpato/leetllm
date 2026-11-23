import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'
export const width = 640
export const height = 740
export const alt =
    'Matrix X has shape 3 by 2 and W has shape 2 by 4. Their product Y has shape 3 by 4. Highlighted row 3 of X contains 3 and 1; highlighted column 4 of W contains 1 and 2. Their dot product 3 times 1 plus 1 times 2 equals 5, filling the highlighted row 3, column 4 result cell.'
const X = [
    [1, 2],
    [0, 1],
    [3, 1],
]
const W = [
    [2, 0, 1, 1],
    [1, 3, 0, 2],
]
const Y = X.map((row) =>
    W[0]!.map((_, k) => row.reduce((sum, value, d) => sum + value * W[d]![k]!, 0)),
)
export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height),
        { c } = fig
    const blue = fig.tone('blue'),
        warm = fig.tone('warm'),
        purple = fig.tone('purple'),
        size = 64
    const matrix = (
        x: number,
        y: number,
        rows: number[][],
        hit: (r: number, k: number) => string | null,
    ) =>
        rows.forEach((row, r) =>
            row.forEach((value, k) => {
                const color = hit(r, k)
                fig.rect(x + k * size, y + r * size, size - 3, size - 3, {
                    fill: color ? tint(color, c.bg, 0.15) : 'none',
                    stroke: color ?? c.border,
                    strokeWidth: color ? 2 : 1,
                })
                fig.text(x + k * size + 30, y + r * size + 30, String(value), {
                    align: 'center',
                    mono: true,
                    size: 28,
                    color: color ?? c.textPrimary,
                    weight: color ? 700 : 400,
                })
            }),
        )
    fig.text(96, 28, 'X · [3, 2]', { size: 27, align: 'center', width: 180 })
    fig.text(432, 28, 'W · [2, 4]', { size: 27, align: 'center', width: 240 })
    matrix(32, 88, X, (r) => (r === 2 ? blue : null))
    matrix(304, 120, W, (_, col) => (col === 3 ? warm : null))
    fig.text(234, 181, '×', { size: 32, align: 'center' })
    fig.text(32, 334, '[3, 1]', { size: 27, mono: true, color: blue, weight: 600, width: 130 })
    fig.text(171, 334, '·', { size: 27 })
    fig.text(200, 334, '[1, 2]', { size: 27, mono: true, color: warm, weight: 600, width: 130 })
    fig.text(345, 334, '= 3×1 + 1×2 = 5', { size: 25, mono: true, width: 280 })
    fig.text(320, 408, 'Y = XW · [3, 4]', { size: 28, align: 'center', width: 400 })
    matrix(192, 466, Y, (r, col) => (r === 2 && col === 3 ? purple : null))
    fig.text(320, 704, 'One row · one column → one output cell', {
        size: 25,
        align: 'center',
        width: 590,
        color: c.textSecondary,
    })
    return fig.render()
}
export default create('dark')
