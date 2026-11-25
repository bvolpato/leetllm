import type { ThemeMode } from 'vizmatic'
import { Figure } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 800
export const height = 446
export const alt =
    'The negative-log curve L equals minus ln of the probability on the correct token. In the worked sequence, docs has target probability 0.114 and loss 2.170 nats; today has probability 0.736 and loss 0.306 nats. Averaging these two supervised positions gives 1.238 nats, with docs accounting for 87.6 percent of the summed loss.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig

    const purple = fig.tone('purple')
    const docsCol = fig.tone('critical')
    const todayCol = fig.tone('green')

    fig.text(24, 24, 'Negative log-likelihood penalty  L = −ln(p)', {
        size: 21,
        weight: 750,
        color: c.textPrimary,
    })

    // ── Main curve plot: L = -ln(p) ─────────────────────────────────────────
    const plot = fig.plot(
        { x: 82, y: 66, width: 682, height: 222 },
        { x: [0, 1], y: [0, 3.2] },
    )
    plot.axes({
        xTicks: [0, 0.25, 0.5, 0.75, 1.0],
        yTicks: [0, 1, 2, 3],
        grid: true,
        labelSize: 17,
        xLabel: 'Correct-token probability p',
        yLabel: 'Loss L (nats)',
    })

    const negLog = (p: number) => -Math.log(p)
    plot.fillArea(negLog, {
        range: [0.045, 1.0],
        baseline: 0,
        fill: purple,
        fillOpacity: 0.12,
        samples: 140,
    })
    plot.fn(negLog, { color: purple, width: 3.4 }, 160, [0.045, 1.0])

    // Mean loss reference line
    plot.hline(1.238, 'Mean = 1.238 nats', {
        color: c.textSecondary,
        width: 1.5,
        dash: '6 5',
        labelPosition: 'right',
        labelSize: 17,
        labelColor: c.textSecondary,
        weight: 650,
    })

    // Drop lines and highlighted markers for docs & today
    const pts = [
        { p: 0.114, loss: 2.17, color: docsCol },
        { p: 0.736, loss: 0.306, color: todayCol },
    ] as const

    for (const pt of pts) {
        const px = plot.px(pt.p)
        const py = plot.py(pt.loss)
        fig.line(px, py, px, plot.bottom, {
            color: pt.color,
            width: 1.6,
            dash: '4 4',
            opacity: 0.8,
        })
        fig.line(plot.area.x, py, px, py, {
            color: pt.color,
            width: 1.6,
            dash: '4 4',
            opacity: 0.8,
        })
        fig.circle(px, py, 7.5, { fill: pt.color, stroke: c.bg, width: 2.4 })
    }

    // Direct callouts on curve
    fig.callout(
        [plot.px(0.114) + 10, plot.py(2.17) - 2],
        [plot.px(0.28), plot.py(2.45)],
        'docs (missed): p = 0.114, L = 2.170',
        {
            color: docsCol,
            labelColor: docsCol,
            size: 18,
            weight: 750,
            bend: -0.14,
            align: 'left',
            head: 6,
        },
    )

    fig.text(plot.px(0.98), plot.py(0.96), 'today (favored): p = 0.736, L = 0.306', {
        color: todayCol,
        size: 17,
        weight: 750,
        align: 'right',
    })
    fig.arrow(plot.px(0.736), plot.py(0.96) + 12, plot.px(0.736), plot.py(0.306) - 10, {
        color: todayCol,
        width: 1.8,
        head: 6,
    })

    // ── Bottom Loss-Share Bar ───────────────────────────────────────────────
    const barY = 368
    const barX = 82
    const barW = 682
    const docsShare = 2.17 / 2.476
    const docsW = Math.round(barW * docsShare)
    const todayW = barW - docsW

    fig.text(barX, barY - 20, 'Share of total loss (2.170 + 0.306 = 2.476 nats)', {
        size: 17,
        weight: 650,
        color: c.textSecondary,
    })

    fig.rect(barX, barY, docsW - 2, 26, { fill: docsCol, radius: 5 })
    fig.rect(barX + docsW, barY, todayW, 26, { fill: todayCol, radius: 5 })

    fig.text(barX + docsW / 2, barY + 44, 'docs: 87.6% of sum (2.170)', {
        size: 18,
        weight: 750,
        color: docsCol,
        align: 'center',
    })
    fig.text(barX + barW, barY + 44, 'today: 12.4% (0.306)', {
        size: 18,
        weight: 750,
        color: todayCol,
        align: 'right',
    })

    return fig.render()
}

export default create('dark')
