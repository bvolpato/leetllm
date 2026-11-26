import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const alt =
    'PCA on the six centered embeddings keeps 85.2% of total variance on PC1 along direction [1.00, -0.02] through mean (4.70, 2.27). Orthogonal residuals to the PC1 line sum to squared reconstruction error 9.72.'

export const width = 780
export const height = 430

const COORDS: ReadonlyArray<readonly [number, number]> = [
    [1.0, 1.0],
    [1.2, 1.8],
    [4.0, 4.2],
    [5.0, 3.8],
    [8.0, 1.0],
    [9.0, 1.8],
]
const MEAN_X = COORDS.reduce((s, p) => s + p[0], 0) / COORDS.length
const MEAN_Y = COORDS.reduce((s, p) => s + p[1], 0) / COORDS.length
const PC1: readonly [number, number] = [0.9998646, -0.0164554]

const PROJECTED = COORDS.map(([x, y]) => {
    const score = (x - MEAN_X) * PC1[0] + (y - MEAN_Y) * PC1[1]
    return [MEAN_X + score * PC1[0], MEAN_Y + score * PC1[1]] as const
})

function pc1At(x: number): [number, number] {
    return [x, MEAN_Y + ((x - MEAN_X) / PC1[0]) * PC1[1]]
}

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const purple = fig.tone('purple')

    // Left: Generous 2D orthogonal projection plot
    fig.text(266, 20, 'Orthogonal projection onto principal axis PC1', {
        size: 15,
        weight: 600,
        color: c.textPrimary,
        align: 'center',
    })

    const plot = fig.plot(
        { x: 52, y: 46, width: 444, height: 316 },
        { x: [0, 10], y: [0, 5.2] },
    )
    plot.axes({
        xTicks: [0, 2, 4, 6, 8, 10],
        yTicks: [0, 1, 2, 3, 4, 5],
        xLabel: 'Embedding dim 1',
        yLabel: 'dim 2',
        grid: true,
        labelSize: 12,
    })

    // PC1 line through mean
    const [lx0, ly0] = pc1At(0.3)
    const [lx1, ly1] = pc1At(9.7)
    fig.line(plot.px(lx0), plot.py(ly0), plot.px(lx1), plot.py(ly1), {
        color: purple,
        width: 2.75,
    })
    fig.text(plot.px(9.6), plot.py(ly1) - 14, 'PC1 [1.00, −0.02]', {
        size: 12,
        weight: 700,
        color: purple,
        align: 'right',
    })

    // Orthogonal residual drop lines + tiny right-angle ticks
    COORDS.forEach(([x, y], i) => {
        const [px, py] = PROJECTED[i]!
        fig.line(plot.px(x), plot.py(y), plot.px(px), plot.py(py), {
            color: warm,
            width: 2,
            dash: '4 3',
        })
        // Small perpendicular corner tick at projected foot
        const dirY = y > py ? -1 : 1
        const s = 6
        fig.polyline(
            [
                [plot.px(px) + s, plot.py(py)],
                [plot.px(px) + s, plot.py(py) + dirY * s],
                [plot.px(px), plot.py(py) + dirY * s],
            ],
            { color: warm, width: 1, opacity: 0.7 },
        )
        plot.point(x, y, { color: blue, r: 6.5 })
        plot.point(px, py, { color: green, r: 5.5 })
    })

    // Sample mean marker
    plot.point(MEAN_X, MEAN_Y, { color: warm, r: 7.5 })
    fig.circle(plot.px(MEAN_X), plot.py(MEAN_Y), 11, { stroke: c.textPrimary, width: 1.5 })
    fig.callout(
        [plot.px(MEAN_X), plot.py(MEAN_Y) + 12],
        [plot.px(MEAN_X) + 34, plot.py(MEAN_Y) + 46],
        'mean (4.70, 2.27)',
        {
            color: warm,
            size: 12,
            weight: 600,
            bend: 0.15,
            align: 'left',
        },
    )

    // Compact legend under plot
    fig.circle(64, 412, 5.5, { fill: blue })
    fig.text(76, 412, 'Original data', { size: 12, color: c.textSecondary })
    fig.circle(184, 412, 5, { fill: green })
    fig.text(196, 412, '1D projection', { size: 12, color: c.textSecondary })
    fig.line(308, 412, 330, 412, { color: warm, width: 2, dash: '4 3' })
    fig.text(338, 412, 'Orthogonal residual', { size: 12, color: warm })

    // Right column: Variance split bar + eigenvalue math
    const rx = 532
    const rw = 224
    fig.text(rx, 20, 'Variance explained', {
        size: 15,
        weight: 600,
        color: c.textPrimary,
    })

    // Stacked horizontal bar (85.2% vs 14.8%)
    const keptW = rw * 0.852
    const dropW = rw * 0.148 - 4
    fig.rect(rx, 52, keptW, 30, { fill: green, radius: 6 })
    fig.rect(rx + keptW + 4, 52, dropW, 30, { fill: warm, radius: 6 })
    fig.text(rx + keptW / 2, 67, 'PC1 · 85.2%', {
        size: 13,
        weight: 700,
        color: theme === 'dark' ? '#0b0c10' : '#ffffff',
        align: 'center',
    })
    fig.text(rx + rw, 98, 'PC2 dropped · 14.8%', {
        size: 12,
        weight: 600,
        color: warm,
        align: 'right',
    })

    // Divider
    fig.line(rx, 126, rx + rw, 126, { color: c.borderSubtle, width: 1 })

    // Covariance spectrum & reconstruction error via TeX
    fig.text(rx, 148, 'Sample covariance spectrum', {
        size: 13.5,
        weight: 600,
        color: c.textPrimary,
    })
    fig.math(rx, 184, String.raw`\lambda_1 = 11.183 \quad (85.2\%)`, {
        size: 15,
        color: green,
    })
    fig.math(rx, 218, String.raw`\lambda_2 = 1.944 \quad (14.8\%)`, {
        size: 15,
        color: warm,
    })

    fig.line(rx, 250, rx + rw, 250, { color: c.borderSubtle, width: 1 })

    fig.rect(rx, 272, rw, 94, {
        fill: tint(purple, c.bg, 0.08),
        stroke: c.borderSubtle,
        strokeWidth: 1,
        radius: 8,
    })
    fig.text(rx + 14, 294, '1-PC reconstruction error', {
        size: 13,
        weight: 600,
        color: c.textPrimary,
    })
    fig.math(rx + 14, 326, String.raw`\sum_{i=1}^{6} \|r_i\|_2^2 = 5\lambda_2 = 9.72`, {
        size: 15,
        color: warm,
    })
    fig.text(rx + 14, 352, 'Max variance ⇔ min residual', {
        size: 11.5,
        color: c.textSecondary,
    })

    return fig.render()
}

export default create()
