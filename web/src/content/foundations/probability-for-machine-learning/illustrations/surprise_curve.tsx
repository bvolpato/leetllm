import type { ThemeMode } from 'vizmatic'
import { Figure } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 390
export const alt =
    'The curve of loss equals negative log p, plotted against the probability a model gave the token that actually came next. At probability 0.9 the loss is 0.105 nats, at 0.5 it is 0.693, at 0.1 it is 2.303, and at 0.01 it is 4.605. The curve rises sharply as the probability approaches zero, so being confidently wrong is punished far more than being unsure.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const critical = fig.tone('critical')
    const green = fig.tone('green')

    fig.text(72, 22, 'Surprise climbs steeply as target probability approaches zero', {
        size: 15,
        weight: 600,
        color: c.textPrimary,
    })

    const plot = fig.plot(
        { x: 72, y: 54, width: 644, height: 274 },
        { x: [0, 1.02], y: [0, 5.2] },
    )
    plot.axes({
        xTicks: [0, 0.25, 0.5, 0.75, 1],
        yTicks: [0, 1, 2, 3, 4, 5],
        xLabel: 'Probability assigned to the actual next token (p)',
        yLabel: 'Loss = −ln(p) (nats)',
        grid: true,
        labelSize: 12.5,
    })

    // Subtle shaded area under -ln(p)
    plot.fillArea((p) => -Math.log(p), {
        range: [0.006, 1],
        fill: blue,
        fillOpacity: theme === 'dark' ? 0.14 : 0.09,
        samples: 220,
    })

    // Main smooth curve
    plot.fn((p) => -Math.log(p), { color: blue, width: 3 }, 260, [0.006, 1])

    // Four directly annotated landmarks along the curve
    const marks = [
        {
            p: 0.01,
            loss: 4.605,
            to: [0.16, 4.65] as const,
            align: 'left' as const,
            color: critical,
            label: 'p = 0.01 → 4.605 nats',
        },
        {
            p: 0.1,
            loss: 2.303,
            to: [0.24, 2.75] as const,
            align: 'left' as const,
            color: critical,
            label: 'p = 0.10 → 2.303 nats',
        },
        {
            p: 0.5,
            loss: 0.693,
            to: [0.56, 1.55] as const,
            align: 'left' as const,
            color: blue,
            label: 'p = 0.50 → 0.693 nats',
        },
        {
            p: 0.9,
            loss: 0.105,
            to: [0.87, 0.92] as const,
            align: 'right' as const,
            color: green,
            label: 'p = 0.90 → 0.105 nats',
        },
    ]

    for (const m of marks) {
        fig.line(plot.px(m.p), plot.py(0), plot.px(m.p), plot.py(m.loss), {
            color: m.color,
            width: 1.2,
            dash: '3 3',
            opacity: 0.65,
        })
        plot.point(m.p, m.loss, { color: m.color, r: 6 })
        fig.callout(
            [plot.px(m.p), plot.py(m.loss)],
            [plot.px(m.to[0]), plot.py(m.to[1])],
            m.label,
            {
                color: m.color,
                size: 13,
                weight: 700,
                bend: -0.15,
                align: m.align,
            },
        )
    }

    // Crisp TeX formula in open top-right area
    fig.math(plot.px(0.76), plot.py(3.85), String.raw`\mathcal{L}(p) = -\ln(p)`, {
        size: 18,
        color: c.textPrimary,
        align: 'center',
    })
    fig.text(plot.px(0.76), plot.py(3.32), 'Confident misses pay unbounded penalty', {
        size: 12.5,
        color: c.textSecondary,
        align: 'center',
    })

    return fig.render()
}

export default create()
