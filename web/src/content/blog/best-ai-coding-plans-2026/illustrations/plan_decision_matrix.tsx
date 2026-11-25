import type { ThemeMode } from 'vizmatic'
import { Figure } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 780
export const height = 415
export const alt =
    'Claude Pro base-fee comparison at unchanged prices: monthly payments rise by 20 dollars per month; the prepaid annual cost is 200 dollars. They tie after ten monthly payments and differ by 40 dollars after twelve.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig

    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const green = fig.tone('green')

    const plot = fig.plot(
        { x: 78, y: 48, width: 550, height: 294 },
        { x: [1, 12], y: [0, 265] },
    )

    plot.axes({
        xTicks: [1, 2, 4, 6, 8, 10, 12],
        yTicks: [0, 50, 100, 150, 200, 250],
        yFormat: (v) => `$${v}`,
        xLabel: 'Months subscribed',
        yLabel: 'Cumulative base fee (USD)',
        grid: true,
        labelSize: 13,
    })

    const monthlyPts: [number, number][] = Array.from({ length: 12 }, (_, i) => [
        i + 1,
        (i + 1) * 20,
    ])
    const annualPts: [number, number][] = Array.from({ length: 12 }, (_, i) => [i + 1, 200])

    // Shade crossover regions before and after month 10
    plot.band(
        monthlyPts.slice(0, 10),
        annualPts.slice(0, 10),
        {
            fill: blue,
            fillOpacity: theme === 'light' ? 0.09 : 0.13,
        },
    )
    plot.band(
        annualPts.slice(9),
        monthlyPts.slice(9),
        {
            fill: green,
            fillOpacity: theme === 'light' ? 0.14 : 0.18,
        },
    )

    // Vertical break-even guide at month 10
    plot.vline(10, 'Break-even (month 10)', {
        color: c.textMuted,
        labelColor: c.textPrimary,
        labelPosition: 'top',
        labelOffset: 10,
        align: 'right',
        labelSize: 13,
        weight: 600,
    })

    // Series curves
    plot.curve(annualPts, { color: purple, width: 2.5, dash: '6 4' })
    plot.curve(monthlyPts, { color: blue, width: 2.75 })

    for (const [m, spend] of monthlyPts) {
        if (m === 10) continue
        plot.point(m, spend, { color: blue, r: 3.5 })
    }
    // Highlighted intersection ring at (10, 200)
    plot.point(10, 200, { color: c.textPrimary, r: 6, ring: true })

    // Direct series end labels in right margin
    fig.text(plot.right + 12, plot.py(240), '$20 / month', {
        size: 14,
        weight: 700,
        color: blue,
    })
    fig.text(plot.right + 12, plot.py(200), '$200 annual', {
        size: 14,
        weight: 700,
        color: purple,
    })

    // Concrete delta annotation at month 6 (monthly $120 vs annual $200 -> save $80)
    const x6 = plot.px(6)
    fig.line(x6, plot.py(120) - 5, x6, plot.py(200) + 5, {
        color: blue,
        width: 1.5,
        dash: '2 3',
    })
    fig.text(x6 - 10, plot.py(172), 'Month 6:', {
        size: 12.5,
        weight: 600,
        color: blue,
        align: 'right',
    })
    fig.text(x6 - 10, plot.py(150), 'save $80 monthly', {
        size: 12.5,
        weight: 600,
        color: blue,
        align: 'right',
    })

    // Concrete delta annotation at month 12 (annual $200 vs monthly $240 -> save $40)
    fig.brace(plot.px(12) + 8, plot.py(240) + 12, plot.px(12) + 8, plot.py(200) - 12, '', {
        side: -1,
        depth: 6,
        color: green,
    })
    fig.text(plot.right + 24, plot.py(220), 'Save $40/yr', {
        size: 13,
        weight: 700,
        color: green,
    })

    // Region cue inside shaded triangle
    fig.text(plot.px(3.2), plot.py(135), 'Monthly cheaper', {
        size: 13,
        weight: 600,
        color: c.textSecondary,
        align: 'center',
    })

    return fig.render()
}

export default create('dark')
