import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'
export const width = 660
export const height = 740
export const alt =
    'One sequence is a three-token, four-feature matrix. Beside it on the right, two such matrices form a batch with shape two by three by four. Matching feature columns persist across token rows and request layers. Adding a token adds a row, widening the model adds a column to every row, and adding a request adds a layer.'
const grid = [
    [0.9, 0.1, 0.4, 0.2],
    [0.2, 0.8, 0.1, 0.5],
    [0.3, 0.2, 0.7, 0.9],
]
const second = [
    [0.6, 0.3, 0.1, 0.8],
    [0.1, 0.9, 0.4, 0.2],
    [0.7, 0.1, 0.5, 0.3],
]
export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height),
        { c } = fig,
        blue = fig.tone('blue')
    const cells = (x: number, y: number, rows: number[][], size: number, values: boolean) =>
        rows.forEach((row, r) =>
            row.forEach((value, col) => {
                fig.rect(x + col * size, y + r * size, size - 3, size - 3, {
                    fill: tint(blue, c.bg, 0.1 + value * 0.85),
                    stroke: c.bg,
                    strokeWidth: 1,
                })
                if (values)
                    fig.text(x + col * size + size / 2, y + r * size + size / 2, value.toFixed(1), {
                        size: 24,
                        mono: true,
                        align: 'center',
                        color: value > 0.6 ? c.bg : c.textPrimary,
                    })
            }),
        )
    fig.text(24, 24, 'One sequence · [T, d] = [3, 4]', { size: 26, weight: 600, width: 612 })
    cells(210, 74, grid, 56, true)
    ;['rain', 'falls', 'softly'].forEach((token, row) =>
        fig.text(24, 102 + row * 56, token, { size: 25, mono: true, width: 150 }),
    )
    fig.arrow(176, 74, 176, 242, { color: c.textMuted, width: 2, head: 10 })
    fig.text(24, 272, '3 tokens', { size: 24, color: c.textSecondary, width: 160 })
    fig.arrow(210, 266, 434, 266, { color: c.textMuted, width: 2, head: 10 })
    fig.text(322, 298, '4 features', {
        size: 24,
        color: c.textSecondary,
        align: 'center',
        width: 224,
    })
    fig.text(24, 356, 'A batch · [B, T, d] = [2, 3, 4]', { size: 26, weight: 600, width: 612 })
    cells(256, 408, second, 46, false)
    cells(210, 444, grid, 46, false)
    fig.text(460, 424, 'sequence 2', { size: 23, color: c.textSecondary, width: 170 })
    fig.text(414, 578, 'sequence 1', { size: 23, color: c.textSecondary, width: 170 })
    ;[
        ['More tokens', 'adds rows'],
        ['Wider model', 'adds columns'],
        ['More requests', 'adds layers'],
    ].forEach(([name, effect], i) => {
        fig.text(24, 620 + i * 38, name!, { size: 24, weight: 600, width: 260 })
        fig.text(300, 620 + i * 38, '→ ' + effect!, {
            size: 24,
            color: c.textSecondary,
            width: 330,
        })
    })
    return fig.render()
}
