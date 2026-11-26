import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'
export { createFilm } from './_parts/eigenvector-film'

export const alt =
    'An equal-scale unit circle and its image under Gram matrix G equals A transpose A, forming an ellipse stretched by eigenvalue 3 along shared direction v_plus and kept at length 1 along contrast direction v_minus in code-prose space.'

export const width = 780
export const height = 450

const INV_SQRT2 = 1 / Math.sqrt(2)

const unitCircle: [number, number][] = Array.from({ length: 121 }, (_, i) => {
    const a = (i / 120) * Math.PI * 2
    return [Math.cos(a), Math.sin(a)]
})

const gramEllipse: [number, number][] = unitCircle.map(([x, y]) => [2 * x + y, x + 2 * y])

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const purple = fig.tone('purple')
    const cyan = fig.tone('cyan')
    const green = fig.tone('green')

    // Left: Equal-scale geometric plot
    const plot = fig.plot(
        { x: 64, y: 42, width: 356, height: 356 },
        { x: [-3.4, 3.4], y: [-3.4, 3.4] },
    )
    plot.axes({
        xTicks: [-3, -2, -1, 0, 1, 2, 3],
        yTicks: [-3, -2, -1, 0, 1, 2, 3],
        xLabel: 'code',
        yLabel: 'prose',
        grid: true,
        labelSize: 12,
    })

    // Zero crosshairs
    fig.line(plot.px(-3.4), plot.py(0), plot.px(3.4), plot.py(0), {
        color: c.border,
        width: 1,
    })
    fig.line(plot.px(0), plot.py(-3.4), plot.px(0), plot.py(3.4), {
        color: c.border,
        width: 1,
    })

    // Eigen-span guide lines
    fig.line(plot.px(-2.85), plot.py(-2.85), plot.px(2.85), plot.py(2.85), {
        color: purple,
        width: 1.1,
        dash: '4 4',
        opacity: 0.45,
    })
    fig.line(plot.px(-2.2), plot.py(2.2), plot.px(2.2), plot.py(-2.2), {
        color: cyan,
        width: 1.1,
        dash: '4 4',
        opacity: 0.45,
    })

    // Subtle filled ellipse interior
    const ellD =
        gramEllipse
            .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${plot.px(x).toFixed(2)} ${plot.py(y).toFixed(2)}`)
            .join('') + 'Z'
    fig.path(ellD, {
        fill: purple,
        fillOpacity: theme === 'dark' ? 0.14 : 0.09,
        color: purple,
        width: 2.5,
    })

    // Crisp dashed unit circle (clearly legible in both light & dark)
    plot.curve(unitCircle, {
        color: c.textSecondary,
        width: 1.75,
        dash: '5 4',
        opacity: 0.85,
    })

    // Input unit eigenvector v+ (subtle inner arrow)
    fig.arrow(plot.px(0), plot.py(0), plot.px(INV_SQRT2), plot.py(INV_SQRT2), {
        color: purple,
        width: 2,
        head: 6,
        opacity: 0.55,
    })
    // Stretched eigenvector Gv+ = 3v+
    fig.arrow(plot.px(0), plot.py(0), plot.px(3 * INV_SQRT2), plot.py(3 * INV_SQRT2), {
        color: purple,
        width: 3.5,
        head: 9,
    })
    // Unchanged eigenvector Gv- = 1v-
    fig.arrow(plot.px(0), plot.py(0), plot.px(INV_SQRT2), plot.py(-INV_SQRT2), {
        color: cyan,
        width: 3.25,
        head: 8,
    })

    // Direct geometric annotations
    fig.math(plot.px(1.42), plot.py(2.75), String.raw`G\mathbf{v}_+ = 3\mathbf{v}_+`, {
        size: 14,
        color: purple,
        align: 'center',
    })
    fig.text(plot.px(2.4), plot.py(1.1), '3× stretch', {
        size: 13,
        weight: 600,
        color: purple,
        align: 'left',
    })
    fig.math(plot.px(1.55), plot.py(-0.95), String.raw`G\mathbf{v}_- = 1\mathbf{v}_-`, {
        size: 14,
        color: cyan,
        align: 'left',
    })
    fig.callout([plot.px(-0.78), plot.py(0.62)], [plot.px(-1.95), plot.py(1.65)], 'unit circle', {
        color: c.textSecondary,
        size: 12,
        bend: -0.18,
        align: 'right',
    })

    // Right: Crisp TeX algebraic panel (frameless)
    const rx = 472
    fig.math(rx, 70, String.raw`G = A^{\top}A = \begin{bmatrix}2 & 1 \\ 1 & 2\end{bmatrix}`, {
        size: 18,
        color: c.textPrimary,
        align: 'left',
    })

    // Subtle divider
    fig.line(rx, 114, width - 28, 114, { color: c.borderSubtle, width: 1 })

    // Eigenpair 1 pill accent (subtle left bar, no heavy card)
    fig.rect(rx, 134, 4, 66, { fill: purple, radius: 2 })
    fig.text(rx + 14, 146, 'Shared direction (major axis)', {
        size: 13,
        weight: 600,
        color: purple,
    })
    fig.math(rx + 14, 174, String.raw`G\mathbf{v}_+ = 3\mathbf{v}_+ \;\Rightarrow\; \lambda_1 = 3,\; \sigma_1 = \sqrt{3}`, {
        size: 15,
        color: c.textPrimary,
    })

    // Eigenpair 2 pill accent
    fig.rect(rx, 224, 4, 66, { fill: cyan, radius: 2 })
    fig.text(rx + 14, 236, 'Contrast direction (minor axis)', {
        size: 13,
        weight: 600,
        color: cyan,
    })
    fig.math(rx + 14, 264, String.raw`G\mathbf{v}_- = 1\mathbf{v}_- \;\Rightarrow\; \lambda_2 = 1,\; \sigma_2 = 1`, {
        size: 15,
        color: c.textPrimary,
    })

    // Key legend strip on bottom right
    fig.rect(rx, 318, width - rx - 14, 72, {
        fill: tint(green, c.bg, 0.08),
        stroke: c.borderSubtle,
        strokeWidth: 1,
        radius: 8,
    })
    fig.text(rx + 12, 338, 'Symmetric Gram matrix', {
        size: 13,
        weight: 600,
        color: green,
    })
    fig.text(rx + 12, 362, 'Orthogonal axes stretch by λᵢ = σᵢ²', {
        size: 12,
        color: c.textSecondary,
    })

    return fig.render()
}

export default create()
