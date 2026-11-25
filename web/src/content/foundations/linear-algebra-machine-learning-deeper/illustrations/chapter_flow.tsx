import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const alt =
    'Token matrix A with rows for kernel [1, 0], essay [0, 1], and notebook [1, 1] plotted in code-versus-prose space alongside unit directions v_plus and v_minus. Output lengths are square root of 3 for the shared topic direction and 1 for the code-versus-prose contrast.'

export const width = 780
export const height = 430

const A_ROWS = [
    [1, 0],
    [0, 1],
    [1, 1],
] as const

const INV_SQRT2 = 1 / Math.sqrt(2)

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const cyan = fig.tone('cyan')
    const green = fig.tone('green')
    const purple = fig.tone('purple')
    const warm = fig.tone('warm')

    // Column 1: Matrix A (left)
    fig.text(132, 26, 'Matrix A (code, prose)', {
        size: 16,
        weight: 600,
        color: c.textPrimary,
        align: 'center',
    })
    fig.heatGrid(
        A_ROWS,
        { x: 94, y: 74, width: 118, height: 156 },
        {
            scale: 'sequential',
            domain: [0, 1],
            rowLabels: ['kernel', 'essay', 'notebook'],
            colLabels: ['code', 'prose'],
            labelSize: 13.5,
            valueSize: 16,
            format: (v) => String(v),
            gap: 5,
            radius: 6,
            rowLabelGap: 10,
            colLabelGap: 16,
        },
    )

    // Subtle colored indicator dots beside matrix row labels to link rows -> 2D points
    const rowColors = [blue, cyan, green]
    for (let i = 0; i < 3; i++) {
        fig.circle(12, 74 + i * 54 + 24, 4.5, { fill: rowColors[i] })
    }

    // Column 2: 2D feature space with unit directions v+ and v-
    fig.text(392, 26, 'Feature space & unit inputs', {
        size: 16,
        weight: 600,
        color: c.textPrimary,
        align: 'center',
    })

    const plot = fig.plot(
        { x: 268, y: 58, width: 248, height: 248 },
        { x: [-0.35, 1.35], y: [-0.85, 1.35] },
    )
    plot.axes({
        xTicks: [0, 0.5, 1],
        yTicks: [-0.5, 0, 0.5, 1],
        xLabel: 'code',
        yLabel: 'prose',
        grid: true,
        labelSize: 12,
    })

    // Origin crosshairs
    fig.line(plot.px(-0.35), plot.py(0), plot.px(1.35), plot.py(0), {
        color: c.border,
        width: 1,
    })
    fig.line(plot.px(0), plot.py(-0.85), plot.px(0), plot.py(1.35), {
        color: c.border,
        width: 1,
    })

    // Dashed unit circle arc (quadrants 1 & 4)
    const arcPts: [number, number][] = []
    for (let i = 0; i <= 60; i++) {
        const ang = -Math.PI * 0.48 + (i / 60) * Math.PI * 0.96
        arcPts.push([Math.cos(ang), Math.sin(ang)])
    }
    plot.curve(arcPts, { color: c.textMuted, width: 1.25, dash: '4 4', opacity: 0.65 })

    // Right-angle square between v+ and v-
    const sq = 0.14
    const p1 = [plot.px(sq * INV_SQRT2), plot.py(sq * INV_SQRT2)] as const
    const p2 = [plot.px(sq * 2 * INV_SQRT2), plot.py(0)] as const
    const p3 = [plot.px(sq * INV_SQRT2), plot.py(-sq * INV_SQRT2)] as const
    fig.polyline([p1, p2, p3], { color: c.textMuted, width: 1.1, opacity: 0.7 })

    // Unit vectors v+ and v-
    fig.arrow(plot.px(0), plot.py(0), plot.px(INV_SQRT2), plot.py(INV_SQRT2), {
        color: purple,
        width: 3,
        head: 8,
    })
    fig.arrow(plot.px(0), plot.py(0), plot.px(INV_SQRT2), plot.py(-INV_SQRT2), {
        color: warm,
        width: 3,
        head: 8,
    })

    // Document points
    plot.point(1, 0, { color: blue, r: 6 })
    plot.point(0, 1, { color: cyan, r: 6 })
    plot.point(1, 1, { color: green, r: 6 })

    // Direct labels on points and vectors
    fig.text(plot.px(1) + 9, plot.py(0) - 8, 'kernel', {
        size: 13,
        weight: 600,
        color: blue,
        align: 'left',
    })
    fig.text(plot.px(0) + 10, plot.py(1) + 2, 'essay', {
        size: 13,
        weight: 600,
        color: cyan,
        align: 'left',
    })
    fig.text(plot.px(1) - 10, plot.py(1) + 2, 'notebook', {
        size: 13,
        weight: 600,
        color: green,
        align: 'right',
    })
    fig.math(plot.px(INV_SQRT2) + 18, plot.py(INV_SQRT2) + 6, String.raw`\mathbf{v}_+`, {
        size: 16,
        color: purple,
        align: 'left',
    })
    fig.math(plot.px(INV_SQRT2) + 14, plot.py(-INV_SQRT2) + 2, String.raw`\mathbf{v}_-`, {
        size: 16,
        color: warm,
        align: 'left',
    })

    // Column 3: Output stretch ||Av|| (singular values)
    const barX = 562
    const barW = 196
    fig.text(barX + barW / 2, 26, 'Output length ‖Av‖', {
        size: 16,
        weight: 600,
        color: c.textPrimary,
        align: 'center',
    })
    fig.math(barX + barW / 2, 54, String.raw`\sigma_1 = \sqrt{3}, \;\; \sigma_2 = 1`, {
        size: 14,
        color: c.textSecondary,
        align: 'center',
    })

    const maxVal = 2.0
    const bars = [
        {
            label: 'Shared direction',
            tex: String.raw`\|A\mathbf{v}_+\|`,
            val: Math.sqrt(3),
            valText: '√3 ≈ 1.732',
            color: purple,
            y: 112,
        },
        {
            label: 'Contrast direction',
            tex: String.raw`\|A\mathbf{v}_-\|`,
            val: 1.0,
            valText: '1.000',
            color: warm,
            y: 212,
        },
    ]

    for (const b of bars) {
        fig.text(barX, b.y - 16, b.label, {
            size: 13,
            weight: 600,
            color: b.color,
            align: 'left',
        })
        // Track
        fig.rect(barX, b.y, barW, 28, {
            fill: tint(b.color, c.bg, 0.1),
            stroke: c.borderSubtle,
            strokeWidth: 1,
            radius: 6,
        })
        // Fill bar
        const fillW = (b.val / maxVal) * barW
        fig.rect(barX, b.y, fillW, 28, {
            fill: b.color,
            radius: 6,
        })
        fig.text(barX, b.y + 44, b.valText, {
            size: 14,
            weight: 700,
            color: b.color,
            mono: true,
            align: 'left',
        })
        fig.math(barX + barW, b.y + 44, b.tex, {
            size: 14,
            color: c.textSecondary,
            align: 'right',
        })
    }

    // Compact bottom summary strip showing explicit Av output vectors
    fig.line(20, 368, width - 20, 368, { color: c.borderSubtle, width: 1 })
    fig.math(
        width * 0.28,
        398,
        String.raw`A\mathbf{v}_+ = \tfrac{1}{\sqrt{2}}[1,\,1,\,2]^{\top} \;\Rightarrow\; \|A\mathbf{v}_+\| = \sqrt{3}`,
        { size: 15, color: purple, align: 'center' },
    )
    fig.math(
        width * 0.76,
        398,
        String.raw`A\mathbf{v}_- = \tfrac{1}{\sqrt{2}}[1,\,-1,\,0]^{\top} \;\Rightarrow\; \|A\mathbf{v}_-\| = 1`,
        { size: 15, color: warm, align: 'center' },
    )

    return fig.render()
}

export default create()
