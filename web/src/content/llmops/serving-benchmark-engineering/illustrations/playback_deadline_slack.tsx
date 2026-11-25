import type { ThemeMode } from 'vizmatic'
import { Figure } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 740
export const height = 425
export const alt =
    'Cumulative token-arrival chart compares Stream A and Stream B across tokens 1 through 5 against fixed playback deadlines (300, 380, 460, 540, and 620 ms). Stream A builds early slack and stays under every deadline even with a 120 ms gap before token 4. Stream B averages 80 ms TPOT yet crosses 40 ms past the 540 ms deadline on token 4 (580 ms).'

const DEADLINES: [number, number][] = [
    [1, 300],
    [2, 380],
    [3, 460],
    [4, 540],
    [5, 620],
]
const STREAM_A: [number, number][] = [
    [1, 240],
    [2, 280],
    [3, 320],
    [4, 440],
    [5, 480],
]
const STREAM_B: [number, number][] = [
    [1, 300],
    [2, 380],
    [3, 460],
    [4, 580],
    [5, 620],
]

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const green = fig.tone('green')
    const purple = fig.tone('purple')
    const red = fig.tone('critical')

    fig.text(68, 20, 'Early token slack absorbs pauses (300 ms + 80 ms/tok deadline)', {
        size: 16,
        weight: 700,
        color: c.textPrimary,
    })

    const plot = fig.plot(
        { x: 68, y: 58, width: 644, height: 304 },
        { x: [0.85, 5.2], y: [200, 660] },
    )
    plot.axes({
        xTicks: [1, 2, 3, 4, 5],
        xFormat: (k) => `Tok ${k}`,
        yTicks: [200, 300, 400, 500, 600],
        yFormat: (v) => `${v} ms`,
        xLabel: 'Output token index',
        yLabel: 'Cumulative arrival (ms)',
        grid: true,
        labelSize: 13.5,
    })

    // Subtle slack band between Stream A and the deadline
    plot.band(STREAM_A, DEADLINES, { fill: green, fillOpacity: 0.11 })

    // Curves
    plot.curve(DEADLINES, { color: purple, width: 2.2, dash: '6 4' })
    plot.curve(STREAM_B, { color: red, width: 2.4 })
    plot.curve(STREAM_A, { color: green, width: 2.5 })

    for (const [k, ms] of DEADLINES) plot.point(k, ms, { color: purple, r: 4 })
    for (const [k, ms] of STREAM_B) plot.point(k, ms, { color: red, r: 4.5 })
    for (const [k, ms] of STREAM_A) plot.point(k, ms, { color: green, r: 4.5 })

    // Emphasize Tok 4 +40 ms miss vertical segment (540 -> 580 ms)
    const x4 = plot.px(4)
    fig.line(x4, plot.py(540), x4, plot.py(580), { color: red, width: 3.5 })
    plot.point(4, 580, { color: red, r: 8, ring: true })

    // Explicit Tok 4 +40 ms miss callout arrow (cleanly below legend)
    fig.callout(
        [x4 - 7, plot.py(580) - 2],
        [plot.px(3.2), plot.py(560)],
        'Tok 4: +40 ms miss (580 vs 540 ms)',
        { color: red, size: 13.5, weight: 700, bend: -0.14, align: 'right' },
    )

    // Direct curve & slack annotations (cleanly inside plot area, zero y-axis crossing)
    fig.callout(
        [plot.px(2.0), plot.py(380) - 6],
        [plot.px(1.12), plot.py(455)],
        'Stream B (0 slack, 80 ms TPOT)',
        { color: red, size: 13, weight: 700, bend: 0.14, align: 'left' },
    )
    fig.text(plot.px(5) - 6, plot.py(480) - 20, 'Stream A (stays safe)', {
        size: 13.5,
        weight: 700,
        color: green,
        align: 'right',
    })
    fig.callout(
        [plot.px(3.55), plot.py(382) + 5],
        [plot.px(4.0), plot.py(285)],
        '120 ms gap absorbed by slack',
        { color: green, size: 13, weight: 600, bend: 0.16, align: 'center' },
    )

    // Compact legend in upper-left open region (clear of Tok 4 callout)
    fig.line(plot.px(1.05), plot.py(634), plot.px(1.32), plot.py(634), {
        color: purple,
        width: 2.2,
        dash: '6 4',
    })
    fig.text(plot.px(1.38), plot.py(634), 'Playback deadline', {
        size: 13,
        weight: 600,
        color: purple,
    })

    return fig.render()
}

export default create('dark')
