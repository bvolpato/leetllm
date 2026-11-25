import type { ThemeMode } from 'vizmatic'
import { Figure } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 740
export const height = 400
export const alt =
    'Frameless side-by-side activation steering geometry for x-prime = [0.2, 0.1] + alpha [0, 1] across alpha in {-1, 0, +1, +2}. Left: equal-unit 2D activation plane showing the vertical steering ray at x1 = 0.2 alongside candidate [0, 1], overlapping [0.6, 0.8], and orthogonal [1, 0] directions. Right: dot-product projections across alpha show orthogonal [1, 0] fixed at 0.20, candidate [0, 1] climbing from -0.90 to +2.10, and overlapping [0.6, 0.8] pulled along from -0.60 to +1.80.'

const alphas = [-1, 0, 1, 2]
const candProj = [-0.9, 0.1, 1.1, 2.1]
const overlapProj = [-0.6, 0.2, 1.0, 1.8]
const orthProj = [0.2, 0.2, 0.2, 0.2]

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const blue = fig.tone('blue')
    const purple = fig.tone('purple')

    // ─── LEFT: Equal-unit 2D activation plane with steering ray ───
    fig.math(194, 24, String.raw`x' = [0.2, 0.1] + \alpha [0, 1]`, {
        size: 15,
        color: c.textPrimary,
        align: 'center',
    })

    const left = fig.plot({ x: 54, y: 54, width: 278, height: 278 }, { x: [-1.15, 2.35], y: [-1.15, 2.35] })
    left.axes({
        xTicks: [-1, 0, 1, 2],
        yTicks: [-1, 0, 1, 2],
        xFormat: (v) => (v < 0 ? `−${Math.abs(v)}` : String(v)),
        yFormat: (v) => (v < 0 ? `−${Math.abs(v)}` : String(v)),
        xLabel: 'Activation axis x₁',
        yLabel: 'x₂',
        labelSize: 13.5,
        grid: true,
    })

    // Origin crosshairs
    const ox = left.px(0)
    const oy = left.py(0)
    fig.line(left.area.x, oy, left.right, oy, { color: c.textMuted, width: 1.15, opacity: 0.75 })
    fig.line(ox, left.area.y, ox, left.bottom, { color: c.textMuted, width: 1.15, opacity: 0.75 })

    // Unit direction vectors from origin
    fig.arrow(ox, oy, left.px(0), left.py(1), { color: green, width: 2.6, head: 7 })
    fig.text(left.px(-0.08), left.py(1.04), 'cand [0,1]', {
        size: 13,
        color: green,
        align: 'right',
        weight: 700,
    })

    fig.arrow(ox, oy, left.px(0.6), left.py(0.8), { color: warm, width: 2.6, head: 7 })
    fig.text(left.px(0.68), left.py(0.84), 'overlap [0.6,0.8]', {
        size: 13,
        color: warm,
        align: 'left',
        weight: 700,
    })

    fig.arrow(ox, oy, left.px(1), left.py(0), { color: blue, width: 2.6, head: 7 })
    fig.text(left.px(1.06), left.py(-0.14), 'orth [1,0]', {
        size: 13,
        color: blue,
        align: 'left',
        weight: 700,
    })

    // Vertical steering sweep ray at x1 = 0.2
    left.curve(
        [
            [0.2, -0.9],
            [0.2, 2.1],
        ],
        { color: purple, width: 2.6 },
    )
    const sweepSteps = [
        { a: 'α = +2', y: 2.1, dx: 10, dy: 0 },
        { a: 'α = +1', y: 1.1, dx: 10, dy: -12 },
        { a: 'α = 0', y: 0.1, dx: 10, dy: -14 },
        { a: 'α = −1', y: -0.9, dx: 10, dy: 0 },
    ]
    for (const s of sweepSteps) {
        const px = left.px(0.2)
        const py = left.py(s.y)
        fig.circle(px, py, 5, { fill: purple, stroke: c.bg, width: 1.8 })
        fig.text(px + s.dx, py + s.dy, s.a, {
            size: 13,
            color: purple,
            mono: true,
            weight: 700,
        })
    }

    // ─── RIGHT: Dot-product projections across α ∈ {-1, 0, +1, +2} ───
    fig.text(552, 24, 'Dot-product projections across α', {
        size: 14.5,
        color: c.textPrimary,
        align: 'center',
        weight: 700,
    })

    const right = fig.plot({ x: 410, y: 54, width: 306, height: 278 }, { x: [-1.72, 2.55], y: [-1.15, 2.45] })
    right.axes({
        xTicks: [-1, 0, 1, 2],
        yTicks: [-1, 0, 1, 2],
        xFormat: (v) => (v > 0 ? `+${v}` : v < 0 ? `−${Math.abs(v)}` : '0'),
        yFormat: (v) => (v < 0 ? `−${Math.abs(v)}` : String(v)),
        xLabel: 'Steering strength α',
        yLabel: "x′ · v",
        labelSize: 13.5,
        grid: true,
    })

    // Zero baseline
    fig.line(right.area.x, right.py(0), right.right, right.py(0), {
        color: c.textMuted,
        width: 1.1,
        opacity: 0.7,
    })

    const series = [
        { name: 'cand', vals: candProj, col: green, labelX: 1.55, labelY: 2.02, startDy: 6 },
        { name: 'overlap', vals: overlapProj, col: warm, labelX: 1.72, labelY: 1.2, startDy: -6 },
        { name: 'orth (fixed)', vals: orthProj, col: blue, labelX: 1.5, labelY: 0.02, startDy: -2 },
    ]

    for (const s of series) {
        const pts = alphas.map((a, i) => [a, s.vals[i]!] as const)
        right.curve(pts, { color: s.col, width: 2.6 })
        fig.text(right.px(s.labelX), right.py(s.labelY), s.name, {
            size: 13,
            color: s.col,
            align: 'center',
            weight: 700,
        })
        pts.forEach(([a, v], idx) => {
            const px = right.px(a)
            const py = right.py(v)
            fig.circle(px, py, 4.8, { fill: s.col, stroke: c.bg, width: 1.8 })
            // Label start (α=-1) cleanly to the left in open space and end (α=+2) to the right
            if (idx === 0) {
                const txt = v < 0 ? `−${Math.abs(v).toFixed(2)}` : `+${v.toFixed(2)}`
                fig.text(px - 8, py + s.startDy, txt, {
                    size: 12.5,
                    color: s.col,
                    align: 'right',
                    mono: true,
                    weight: 700,
                })
            } else if (idx === 3) {
                const txt = `+${v.toFixed(2)}`
                fig.text(px + 8, py, txt, {
                    size: 13,
                    color: s.col,
                    mono: true,
                    weight: 700,
                })
            }
        })
    }

    return fig.render()
}

export default create('dark')
