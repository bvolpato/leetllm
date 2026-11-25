import type { ThemeMode } from 'vizmatic'
import { Figure } from '../../../../../tools/illustrations/lib/plot-kit'

export const alt =
    'Bayesian posterior P(abuse given flag) rises from 16.1 percent at 1 percent base rate to 67.9 percent at 10 percent and 95.0 percent at 50 percent, even when detector recall remains 95 percent and false-positive rate remains 5 percent.'

export const width = 780
export const height = 400

function posteriorPct(priorPct: number): number {
    const p = priorPct / 100
    const tp = 0.95 * p
    const fp = 0.05 * (1 - p)
    return (tp / (tp + fp)) * 100
}

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const purple = fig.tone('purple')
    const critical = fig.tone('critical')
    const warm = fig.tone('warm')

    fig.text(72, 22, 'Same detector (TPR = 95%, FPR = 5%), dramatically different posterior', {
        size: 15,
        weight: 600,
        color: c.textPrimary,
    })

    const plot = fig.plot(
        { x: 72, y: 56, width: 656, height: 280 },
        { x: [0, 52], y: [0, 105] },
    )
    plot.axes({
        xTicks: [0, 10, 20, 30, 40, 50],
        yTicks: [0, 25, 50, 75, 100],
        xFormat: (v) => `${v}%`,
        yFormat: (v) => `${v}%`,
        xLabel: 'Prior base rate P(abuse)',
        yLabel: 'Posterior P(abuse | flag)',
        grid: true,
        labelSize: 12.5,
    })

    // Subtle shaded area under posterior curve
    plot.fillArea((x) => (x <= 0 ? 0 : posteriorPct(x)), {
        range: [0, 50],
        fill: purple,
        fillOpacity: theme === 'dark' ? 0.14 : 0.09,
        samples: 180,
    })

    // Fixed recall reference line
    plot.hline(95, 'Fixed detector recall · TPR = 95%', {
        color: critical,
        width: 1.5,
        dash: '5 4',
        labelPosition: 'right',
        labelSize: 12.5,
        labelOffset: 12,
    })

    // Main posterior curve
    plot.fn((x) => (x <= 0 ? 0 : posteriorPct(x)), { color: purple, width: 3 }, 200, [0, 50])

    // Highlighted base rates with vertical drop lines and non-colliding callouts
    const highlights = [
        {
            prior: 1,
            post: 16.1,
            to: [8, 16] as const,
            align: 'left' as const,
            color: warm,
            text: '1% prior → 16.1%',
        },
        {
            prior: 5,
            post: 50.0,
            to: [13, 44] as const,
            align: 'left' as const,
            color: purple,
            text: '5% prior → 50.0%',
        },
        {
            prior: 10,
            post: 67.9,
            to: [19, 64] as const,
            align: 'left' as const,
            color: purple,
            text: '10% prior → 67.9%',
        },
        {
            prior: 50,
            post: 95.0,
            to: [42, 74] as const,
            align: 'right' as const,
            color: purple,
            text: '50% prior → 95.0%',
        },
    ]

    for (const h of highlights) {
        fig.line(plot.px(h.prior), plot.py(0), plot.px(h.prior), plot.py(h.post), {
            color: h.color,
            width: 1.25,
            dash: '3 3',
            opacity: 0.7,
        })
        plot.point(h.prior, h.post, { color: h.color, r: 6 })
        fig.callout(
            [plot.px(h.prior), plot.py(h.post)],
            [plot.px(h.to[0]), plot.py(h.to[1])],
            h.text,
            {
                color: h.color,
                size: 13,
                weight: 700,
                bend: h.prior === 50 ? 0.18 : -0.15,
                align: h.align,
            },
        )
    }

    // Crisp Bayes formula inset in open bottom-right space
    fig.math(
        plot.px(35),
        plot.py(26),
        String.raw`P(\text{abuse}\mid\text{flag}) = \frac{0.95\,p}{0.95\,p + 0.05(1-p)}`,
        { size: 15, color: c.textPrimary, align: 'center' },
    )

    return fig.render()
}

export default create()
