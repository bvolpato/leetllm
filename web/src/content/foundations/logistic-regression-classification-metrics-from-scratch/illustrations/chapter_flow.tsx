import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 820
export const height = 435
export const alt =
    'Fitted logistic-regression decision boundaries over ambiguity (x1) and retrieval support (x2) with eight labeled training responses and parallel contours labeled directly at thresholds t = 0.20, 0.50, and 0.80. At t = 0.50, R3 (p = 0.274) is missed on the direct side and R7 (p = 0.687) triggers an unnecessary check.'

const W = { intercept: -4.894, ambiguity: 3.399, support: -0.959 }
const CASES = [
    { id: 'R1', x: 1.0, y: 1, label: 0, p: 0.079 },
    { id: 'R2', x: 1.5, y: 2, label: 0, p: 0.153 },
    { id: 'R3', x: 2.0, y: 3, label: 1, p: 0.274 },
    { id: 'R4', x: 3.5, y: 6, label: 1, p: 0.777 },
    { id: 'R5', x: 4.0, y: 7, label: 1, p: 0.88 },
    { id: 'R6', x: 4.5, y: 5, label: 1, p: 0.996 },
    { id: 'R7', x: 2.8, y: 4, label: 0, p: 0.687 },
    { id: 'R8', x: 3.2, y: 8, label: 0, p: 0.156 },
] as const

const logit = (p: number) => Math.log(p / (1 - p))
const xAtSupport = (t: number, sup: number) =>
    (logit(t) - W.intercept - W.support * sup) / W.ambiguity

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const red = fig.tone('critical')
    const warm = fig.tone('warm')
    const isLight = theme === 'light'

    // Clean top legend row (no opaque box)
    fig.circle(76, 22, 5.5, { fill: green })
    fig.text(88, 22, 'Unsupported claim (y = 1)', { size: 13, weight: 600, color: green })

    fig.circle(292, 22, 5.5, { fill: blue })
    fig.text(304, 22, 'Grounded reply (y = 0)', { size: 13, weight: 600, color: blue })

    fig.circle(492, 22, 6, { fill: c.bg, stroke: warm, width: 2.2 })
    fig.text(504, 22, 'Misclassified at t = 0.50 (R3, R7)', { size: 13, weight: 600, color: warm })

    const plot = fig.plot(
        { x: 74, y: 56, width: 704, height: 312 },
        { x: [0.5, 5.0], y: [0, 9] },
    )

    // Subtle shaded verification region to the right of t = 0.50 contour
    const x50Bot = xAtSupport(0.5, 0)
    const x50Top = xAtSupport(0.5, 9)
    fig.path(
        `M${plot.px(x50Bot)} ${plot.py(0)} L${plot.px(5.0)} ${plot.py(0)} L${plot.px(5.0)} ${plot.py(9)} L${plot.px(x50Top)} ${plot.py(9)} Z`,
        {
            fill: tint(green, c.bg, isLight ? 0.08 : 0.11),
        },
    )

    plot.axes({
        xTicks: [1, 2, 3, 4, 5],
        yTicks: [0, 2, 4, 6, 8],
        xLabel: 'Ambiguity x₁',
        yLabel: 'Retrieval support x₂',
        grid: true,
        labelSize: 13,
    })

    // Draw parallel threshold contours & label t = 0.20 / 0.50 / 0.80 directly with generous separation!
    const contours: readonly {
        t: number
        color: string
        dash?: string
        width: number
        lx: number
        ly: number
        align: 'left' | 'center' | 'right'
    }[] = [
        {
            t: 0.2,
            color: blue,
            dash: '6 4',
            width: 2,
            lx: plot.px(xAtSupport(0.2, 6.8)) - 12,
            ly: plot.py(6.8),
            align: 'right',
        },
        {
            t: 0.5,
            color: c.textPrimary,
            width: 2.6,
            lx: plot.px(xAtSupport(0.5, 9)),
            ly: plot.area.y - 12,
            align: 'center',
        },
        {
            t: 0.8,
            color: red,
            dash: '6 4',
            width: 2,
            lx: plot.px(xAtSupport(0.8, 8.2)) + 12,
            ly: plot.py(8.2),
            align: 'left',
        },
    ]
    for (const ct of contours) {
        const xb = xAtSupport(ct.t, 0)
        const xt = xAtSupport(ct.t, 9)
        fig.line(plot.px(xb), plot.py(0), plot.px(xt), plot.py(9), {
            color: ct.color,
            width: ct.width,
            dash: ct.dash,
        })
        fig.text(ct.lx, ct.ly, `t = ${ct.t.toFixed(2)}`, {
            size: 13,
            weight: 700,
            color: ct.color,
            align: ct.align,
            mono: true,
        })
    }

    // Plot all 8 training responses
    for (const item of CASES) {
        const isErr = item.id === 'R3' || item.id === 'R7'
        const fill = item.label === 1 ? green : blue
        const cx = plot.px(item.x)
        const cy = plot.py(item.y)
        if (isErr) {
            fig.circle(cx, cy, 11, { stroke: warm, width: 2.2 })
        }
        fig.circle(cx, cy, 6.5, { fill, stroke: c.bg, width: 1.8 })

        // Subtle labels for non-error points, well clear of contour lines
        if (!isErr) {
            const onLeft = item.id === 'R8' || item.id === 'R2'
            const dx = onLeft ? -12 : 12
            const dy = item.id === 'R4' ? 8 : 0
            const align = onLeft ? 'right' : 'left'
            fig.text(cx + dx, cy + dy, item.id, {
                size: 12,
                weight: 600,
                color: c.textSecondary,
                align,
                mono: true,
            })
        }
    }

    // Crisp callouts pulling R3 and R7 WELL OFF the contour lines
    fig.callout(
        [plot.px(2.0) - 9, plot.py(3) - 6],
        [plot.px(1.65), plot.py(5.8)],
        'R3 (p = 0.274, y = 1)',
        {
            color: warm,
            labelColor: warm,
            align: 'right',
            size: 13,
            weight: 700,
            bend: -0.16,
        },
    )
    fig.text(plot.px(1.65) - 6, plot.py(5.8) + 16, 'missed at t = 0.50', {
        size: 12,
        color: c.textSecondary,
        align: 'right',
    })

    fig.callout(
        [plot.px(2.8) + 9, plot.py(4) + 6],
        [plot.px(3.95), plot.py(2.0)],
        'R7 (p = 0.687, y = 0)',
        {
            color: warm,
            labelColor: warm,
            align: 'left',
            size: 13,
            weight: 700,
            bend: 0.16,
        },
    )
    fig.text(plot.px(3.95) + 6, plot.py(2.0) + 16, 'unnecessary check', {
        size: 12,
        color: c.textSecondary,
    })

    // Region cue in bottom-right
    fig.text(plot.px(4.85), plot.py(0.6), 'Predict verify (p >= 0.50) ->', {
        size: 12,
        weight: 600,
        color: green,
        align: 'right',
    })

    return fig.render()
}

export default create
