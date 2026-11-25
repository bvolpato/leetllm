import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const alt =
    'Four sequential token probabilities (0.40, 0.75, 0.80, 0.90) shrink prefix joint probability to 0.216, while log sum equals -1.532 nats. Across 200 tokens at p = 0.01, base-10 log mass drops to -400 below float64 floor -324, underflowing products to 0.0 while log sum stays -921 nats.'

export const width = 780
export const height = 390

const STEPS = [
    { token: 'The', joint: 0.4, factor: '' },
    { token: 'model', joint: 0.3, factor: '×0.75' },
    { token: 'writes', joint: 0.24, factor: '×0.80' },
    { token: 'code', joint: 0.216, factor: '×0.90' },
] as const

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const critical = fig.tone('critical')

    // ─── LEFT PANEL: 4-token prefix joint probability decay ───
    fig.text(190, 22, 'Chain rule prefix P(t₁…tₖ)', {
        size: 15,
        weight: 600,
        color: c.textPrimary,
        align: 'center',
    })

    const leftPlot = fig.plot(
        { x: 54, y: 58, width: 280, height: 230 },
        { x: [0, 4], y: [0, 0.5] },
    )
    leftPlot.axes({
        yTicks: [0, 0.1, 0.2, 0.3, 0.4, 0.5],
        yFormat: (v) => v.toFixed(1),
        yLabel: 'Prefix probability',
        grid: true,
        labelSize: 13,
    })

    const barW = 46
    STEPS.forEach((s, i) => {
        const cx = leftPlot.px(i + 0.5)
        const topY = leftPlot.py(s.joint)
        const h = leftPlot.bottom - topY
        fig.rect(cx - barW / 2, topY, barW, h, {
            fill: i === STEPS.length - 1 ? purple : blue,
            radius: 5,
        })
        fig.text(cx, topY - 12, s.joint.toFixed(s.joint === 0.216 ? 3 : 2), {
            size: 13,
            weight: 700,
            color: i === STEPS.length - 1 ? purple : blue,
            mono: true,
            align: 'center',
        })
        fig.text(cx, leftPlot.bottom + 16, s.token, {
            size: 13.5,
            weight: 600,
            color: c.textPrimary,
            mono: true,
            align: 'center',
        })
        if (s.factor) {
            const prevCx = leftPlot.px(i - 0.5)
            const prevTop = leftPlot.py(STEPS[i - 1]!.joint)
            fig.text((prevCx + cx) / 2, Math.min(prevTop, topY) - 28, s.factor, {
                size: 13,
                color: c.textMuted,
                mono: true,
                align: 'center',
            })
        }
    })

    fig.math(
        194,
        348,
        String.raw`p_1 p_2 p_3 p_4 = 0.216 \;\;\Rightarrow\;\; \text{NLL} = 1.532\text{ nats}`,
        { size: 13.5, color: purple, align: 'center' },
    )

    // Subtle vertical divider between panels
    fig.line(370, 26, 370, 366, { color: c.borderSubtle, width: 1 })

    // ─── RIGHT PANEL: 200 tokens at p = 0.01 vs float64 underflow floor ───
    fig.text(584, 22, '200 tokens at p = 0.01: float64 underflow', {
        size: 15,
        weight: 600,
        color: c.textPrimary,
        align: 'center',
    })

    const rightPlot = fig.plot(
        { x: 438, y: 58, width: 312, height: 230 },
        { x: [0, 210], y: [-420, 10] },
    )
    rightPlot.axes({
        xTicks: [0, 50, 100, 150, 200],
        yTicks: [0, -100, -200, -300, -400],
        xLabel: 'Sequence length n (tokens)',
        yLabel: 'log₁₀ P',
        grid: true,
        labelSize: 13,
    })

    // Shaded underflow danger zone below -324
    fig.rect(
        rightPlot.area.x,
        rightPlot.py(-324),
        rightPlot.area.width,
        rightPlot.bottom - rightPlot.py(-324),
        {
            fill: critical,
            opacity: theme === 'dark' ? 0.14 : 0.1,
        },
    )

    // Float64 floor reference line
    rightPlot.hline(-324, 'float64 floor (−324)', {
        color: critical,
        width: 1.5,
        dash: '5 4',
        labelPosition: 'left',
        labelSize: 13,
        labelOffset: 10,
    })

    // Linear trajectory log10(0.01^n) = -2n
    rightPlot.curve(
        [
            [0, 0],
            [162, -324],
        ],
        { color: blue, width: 3 },
    )
    rightPlot.curve(
        [
            [162, -324],
            [200, -400],
        ],
        { color: critical, width: 3, dash: '5 3' },
    )

    // Crossing point at n = 162 -> underflows to 0.0 by step 163
    rightPlot.point(162, -324, { color: critical, r: 6 })
    rightPlot.point(200, -400, { color: critical, r: 5.5 })

    fig.callout(
        [rightPlot.px(162), rightPlot.py(-324)],
        [rightPlot.px(195), rightPlot.py(-110)],
        'Underflows at n = 163',
        {
            color: critical,
            size: 13,
            weight: 700,
            bend: 0.16,
            align: 'right',
        },
    )

    // Bottom crisp summary
    fig.rect(400, 332, 366, 36, {
        fill: tint(critical, c.bg, 0.08),
        stroke: c.borderSubtle,
        strokeWidth: 1,
        radius: 6,
    })
    fig.text(583, 350, 'n=200: 0.01²⁰⁰ → 0.0 in fp64 · log = −921 nats', {
        size: 13,
        weight: 600,
        color: critical,
        align: 'center',
    })

    return fig.render()
}

export default create()
