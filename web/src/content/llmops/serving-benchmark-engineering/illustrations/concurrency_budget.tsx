import type { ThemeMode } from 'vizmatic'
import { Figure } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 740
export const height = 415
export const alt =
    'Little’s Law throughput plot on a 0 to 3 RPS scale compares client concurrency limits from 1 to 8 slots against a dashed 3.0 RPS offered target with 0.9 s mean residence (2.7 average active slots). Deterministic pacing hits 3.0 RPS at 3 slots, whereas Poisson arrival bursts fall behind at 3 slots (2.07 RPS) and require 6 to 8 slots for burst headroom.'

const OFFERED_RPS = 3.0
const MEAN_RESIDENCE_S = 0.9
const TRAFFIC_ERLANGS = OFFERED_RPS * MEAN_RESIDENCE_S

function erlangCarriedRps(slots: number): number {
    let b = 1.0
    for (let k = 1; k <= slots; k++) {
        b = (TRAFFIC_ERLANGS * b) / (k + TRAFFIC_ERLANGS * b)
    }
    return OFFERED_RPS * (1 - b)
}

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const warm = fig.tone('warm')

    fig.text(64, 20, 'Client concurrency caps throttle open-loop load (L = 3.0 × 0.9 = 2.7 slots)', {
        size: 15.5,
        weight: 700,
        color: c.textPrimary,
    })

    const plot = fig.plot(
        { x: 64, y: 58, width: 648, height: 294 },
        { x: [1, 8], y: [0, 3.5] },
    )
    plot.axes({
        xTicks: [1, 2, 3, 4, 5, 6, 7, 8],
        yTicks: [0, 1, 2, 3],
        yFormat: (v) => `${v}`,
        xLabel: 'Client concurrency limit (slots)',
        yLabel: 'Carried throughput (RPS)',
        grid: true,
        labelSize: 13.5,
    })

    const slots = [1, 2, 3, 4, 5, 6, 7, 8]
    const ceilingPts = slots.map((s) => [s, Math.min(OFFERED_RPS, s / MEAN_RESIDENCE_S)] as const)
    const poissonPts = slots.map((s) => [s, erlangCarriedRps(s)] as const)

    // Dashed 3.0 RPS offered target line
    plot.hline(3.0, 'Target: 3.0 RPS', {
        color: blue,
        width: 1.7,
        dash: '5 4',
        labelPosition: 'right',
        labelOffset: 14,
        labelSize: 13.5,
        weight: 700,
    })

    // Curves
    plot.fillArea(poissonPts, { fill: warm, fillOpacity: 0.12, smooth: true })
    plot.curve(ceilingPts, { color: purple, width: 2.3 })
    plot.smoothCurve(poissonPts, { color: warm, width: 2.5 })

    for (const [x, y] of ceilingPts) plot.point(x, y, { color: purple, r: 4 })
    for (const [x, y] of poissonPts) plot.point(x, y, { color: warm, r: 4.5 })

    // Direct curve labels & key burst-shortfall callout
    fig.callout(
        [plot.px(2.4), plot.py(2.4 / MEAN_RESIDENCE_S) - 5],
        [plot.px(2.9), plot.py(3.32)],
        'Deterministic cap (c / W)',
        { color: purple, size: 13.5, weight: 700, bend: 0.14, align: 'left' },
    )
    fig.callout(
        [plot.px(3), plot.py(erlangCarriedRps(3)) + 6],
        [plot.px(4.3), plot.py(1.42)],
        '3 slots: 2.07 RPS under Poisson bursts',
        { color: warm, size: 13.5, weight: 700, bend: 0.16, align: 'left' },
    )
    fig.text(plot.px(6.75), plot.py(2.58), '6-8 slots absorb bursts', {
        size: 13,
        weight: 600,
        color: warm,
        align: 'center',
    })

    return fig.render()
}

export default create('dark')
