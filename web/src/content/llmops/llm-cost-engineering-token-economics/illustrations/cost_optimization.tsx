import type { ThemeMode } from 'vizmatic'
import { Figure } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 740
export const height = 445
export const alt =
    'Side-by-side economics charts. Left: cumulative prefix cost over six calls compares uncached prefill (1x to 6x) against a 1.25x prefix write plus 0.1x reads (1.25x to 1.75x), breaking even before the second call. Right: cost per 1,000 calls versus answer quality plots Truncated ($1.5, 74%), Small-8B ($2.8, 86%), Concise ($4.6, 95% on the Pareto knee), Verbose ($7.2, 96%), and dominated Unbatched ($6.8, 84%).'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const red = fig.tone('critical')

    // Panel headers
    fig.text(60, 20, 'Prefix write vs uncached input', {
        size: 16,
        weight: 700,
        color: c.textPrimary,
    })
    fig.text(426, 20, 'Cost ($/1k calls) vs quality (%)', {
        size: 16,
        weight: 700,
        color: c.textPrimary,
    })

    // Left panel: Prefix-cache amortization curve (clean 0, 2, 4, 6 ticks)
    const cachePlot = fig.plot(
        { x: 60, y: 58, width: 294, height: 320 },
        { x: [0.6, 6.2], y: [0, 6.5] },
    )
    cachePlot.axes({
        xTicks: [1, 2, 3, 4, 5, 6],
        xFormat: (n) => `n=${n}`,
        yTicks: [0, 2, 4, 6],
        yFormat: (v) => `${v}x`,
        xLabel: 'Shared prefix calls',
        yLabel: 'Cumulative cost (1x = base)',
        grid: true,
        labelSize: 14,
    })

    const uncached: [number, number][] = [
        [1, 1.0],
        [2, 2.0],
        [3, 3.0],
        [4, 4.0],
        [5, 5.0],
        [6, 6.0],
    ]
    const cached: [number, number][] = [
        [1, 1.25],
        [2, 1.35],
        [3, 1.45],
        [4, 1.55],
        [5, 1.65],
        [6, 1.75],
    ]

    cachePlot.fillArea(cached, { fill: green, fillOpacity: 0.14 })
    cachePlot.curve(uncached, { color: warm, width: 2.3 })
    cachePlot.curve(cached, { color: green, width: 2.4 })
    for (const [x, y] of uncached) cachePlot.point(x, y, { color: warm, r: 4 })
    for (const [x, y] of cached) cachePlot.point(x, y, { color: green, r: 4 })

    // Break-even point at x = 1.278
    const beX = 1.15 / 0.9
    cachePlot.point(beX, beX, { color: c.textPrimary, r: 4.5, ring: true })
    fig.callout(
        [cachePlot.px(beX), cachePlot.py(beX) - 7],
        [cachePlot.px(1.0), cachePlot.py(4.2)],
        'Breaks even < n=2',
        { color: c.textPrimary, size: 14, weight: 600, bend: -0.14, align: 'left' },
    )

    // Direct series labels
    fig.text(cachePlot.px(5.9), cachePlot.py(5.85) - 18, 'Uncached (1.0x/call)', {
        size: 14,
        weight: 700,
        color: warm,
        align: 'right',
    })
    fig.text(cachePlot.px(6.0), cachePlot.py(1.75) - 22, '1.25x write + 0.1x read', {
        size: 14,
        weight: 700,
        color: green,
        align: 'right',
    })
    fig.text(cachePlot.px(6.0), cachePlot.py(0.75), '1.75x vs 6.0x (-71%)', {
        size: 14,
        weight: 600,
        color: green,
        align: 'right',
        mono: true,
    })

    // Right panel: Pareto frontier on clean round ticks (0..8 & 70..100%)
    const paretoPlot = fig.plot(
        { x: 426, y: 58, width: 294, height: 320 },
        { x: [0, 9], y: [70, 100] },
    )
    paretoPlot.axes({
        xTicks: [0, 2, 4, 6, 8],
        xFormat: (v) => `$${v}`,
        yTicks: [70, 80, 90, 100],
        yFormat: (v) => `${v}%`,
        xLabel: 'Cost ($ per 1k calls)',
        yLabel: 'Answer quality (%)',
        grid: true,
        labelSize: 14,
    })

    // Pareto frontier curve connecting non-dominated points
    const frontierPts: [number, number][] = [
        [1.5, 74],
        [2.8, 86],
        [4.6, 95],
        [7.2, 96],
    ]
    paretoPlot.curve(frontierPts, { color: green, width: 2, dash: '5 4', opacity: 0.85 })

    // Plot points with separated collision-free labels
    // 1. Truncated (1.5, 74)
    paretoPlot.point(1.5, 74, { color: red, r: 5.5 })
    fig.text(paretoPlot.px(1.5) + 10, paretoPlot.py(74), 'Truncated ($1.5, 74%)', {
        size: 14,
        weight: 600,
        color: red,
    })

    // 2. Small-8B (2.8, 86)
    paretoPlot.point(2.8, 86, { color: blue, r: 5.5 })
    fig.text(paretoPlot.px(2.8) + 10, paretoPlot.py(86) + 2, 'Small-8B ($2.8, 86%)', {
        size: 14,
        weight: 600,
        color: blue,
    })

    // 3. Concise (4.6, 95) - Pareto knee highlight
    paretoPlot.point(4.6, 95, { color: green, r: 9, ring: true })
    paretoPlot.point(4.6, 95, { color: green, r: 5 })
    fig.text(paretoPlot.px(4.6) - 12, paretoPlot.py(95) - 10, 'Concise (knee)', {
        size: 14,
        weight: 700,
        color: green,
        align: 'right',
    })
    fig.text(paretoPlot.px(4.6) - 12, paretoPlot.py(95) + 10, '$4.6, 95%', {
        size: 14,
        weight: 600,
        color: green,
        align: 'right',
        mono: true,
    })

    // 4. Verbose (7.2, 96)
    paretoPlot.point(7.2, 96, { color: purple, r: 5.5 })
    fig.text(paretoPlot.px(7.2), paretoPlot.py(96) + 20, 'Verbose ($7.2)', {
        size: 14,
        weight: 600,
        color: purple,
        align: 'center',
    })

    // 5. Unbatched (6.8, 84) - dominated
    paretoPlot.point(6.8, 84, { color: c.textMuted, r: 5.5 })
    fig.text(paretoPlot.px(6.8), paretoPlot.py(84) + 18, 'Unbatched', {
        size: 14,
        weight: 600,
        color: c.textSecondary,
        align: 'center',
    })
    fig.text(paretoPlot.px(6.8), paretoPlot.py(84) + 36, '(dominated)', {
        size: 14,
        color: c.textMuted,
        align: 'center',
    })

    return fig.render()
}

export default create('dark')
