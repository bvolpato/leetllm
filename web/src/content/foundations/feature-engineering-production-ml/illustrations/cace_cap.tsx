import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 860
export const height = 385
export const alt =
    'Side-by-side CACE cap-change effect for job J-188 with raw heartbeat age 200 hours and backlog 18. Left: on a 0 to 360 hour ruler, a 180-hour cap clamps the 200-hour input to 180 hours, whereas a 360-hour cap leaves it at 200 hours; a fresh 0.5-hour job is unchanged. Right: on the fixed logistic curve s(a) = sigmoid(0.02a - 3.82), moving input from 180h to 200h shifts probability from 0.445 (No alert) to 0.545 (Alert) across the 0.50 decision threshold.'

const score = (age: number) => 1 / (1 + Math.exp(-(0.02 * age + 0.01 * 18 - 4)))

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const red = fig.tone('critical')
    const warm = fig.tone('warm')
    const green = fig.tone('green')
    const isLight = theme === 'light'

    // Left: Cap-clamping ruler (0 to 360 hours)
    fig.text(28, 24, '1. Cap policy alters the input vector', {
        size: 15,
        weight: 700,
    })

    const rx = 44
    const rw = 342
    const xOf = (h: number) => rx + (h / 360) * rw

    // Shared ruler ticks at bottom
    const axisY = 304
    fig.line(rx, axisY, rx + rw, axisY, { color: c.textMuted, width: 1.25 })
    for (const h of [0, 90, 180, 270, 360]) {
        const px = xOf(h)
        fig.line(px, axisY, px, axisY + 5, { color: c.textMuted, width: 1.25 })
        fig.text(px, axisY + 18, `${h}h`, {
            size: 12,
            color: h === 180 || h === 360 ? c.textPrimary : c.textSecondary,
            align: 'center',
            mono: true,
        })
    }
    fig.text(rx + rw / 2, axisY + 38, 'Heartbeat age entering model (hours)', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
    })

    // Raw 200h vertical reference line
    const x200 = xOf(200)
    fig.line(x200, 62, x200, axisY, { color: c.textSecondary, width: 1.5, dash: '4 4' })
    fig.text(x200 + 6, 68, 'raw = 200h (J-188)', {
        size: 12,
        weight: 600,
        color: c.textSecondary,
        mono: true,
    })

    // Track A: 180h cap (trained policy)
    const yA = 128
    fig.text(rx, yA - 24, 'Trained cap: 180h', { size: 13, weight: 700, color: blue })
    fig.line(rx, yA, rx + rw, yA, { color: c.borderSubtle, width: 4, cap: 'round' })
    fig.rect(rx, yA - 12, xOf(180) - rx, 24, {
        fill: tint(blue, c.bg, isLight ? 0.24 : 0.36),
        stroke: blue,
        strokeWidth: 1.6,
        radius: 4,
    })
    fig.line(xOf(180), yA - 20, xOf(180), yA + 20, { color: blue, width: 2.5 })
    fig.text((rx + xOf(180)) / 2, yA, '180h', {
        size: 13,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
        mono: true,
    })
    fig.arrow(x200, yA + 26, xOf(180), yA + 26, { color: blue, width: 2, head: 6 })
    fig.text(x200 + 8, yA + 26, 'clamped -20h', { size: 12, weight: 600, color: blue })

    // Track B: 360h cap (unversioned live edit)
    const yB = 224
    fig.text(rx, yB - 24, 'Unversioned live cap: 360h', { size: 13, weight: 700, color: red })
    fig.line(rx, yB, rx + rw, yB, { color: c.borderSubtle, width: 4, cap: 'round' })
    fig.rect(rx, yB - 12, x200 - rx, 24, {
        fill: tint(red, c.bg, isLight ? 0.22 : 0.34),
        stroke: red,
        strokeWidth: 1.6,
        radius: 4,
    })
    fig.line(xOf(360), yB - 20, xOf(360), yB + 20, { color: red, width: 2.5 })
    fig.text((rx + x200) / 2, yB, '200h', {
        size: 13,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
        mono: true,
    })
    fig.text(x200 + 10, yB, 'passes through', { size: 12, weight: 600, color: red })

    // Fresh job marker at 0.5h
    const xFresh = xOf(4)
    fig.circle(xFresh, axisY, 4.5, { fill: green, stroke: c.bg, width: 1.5 })
    fig.callout([xFresh + 2, axisY - 5], [rx + 42, axisY - 26], 'fresh 0.5h (unchanged)', {
        color: green,
        labelColor: green,
        align: 'left',
        size: 12,
        weight: 600,
        bend: -0.15,
    })

    // Divider
    fig.line(418, 28, 418, 355, { color: c.borderSubtle, width: 1 })

    // Right: Fixed logistic curve
    fig.text(448, 24, '2. Frozen weights flip the decision', {
        size: 15,
        weight: 700,
    })

    const plot = fig.plot(
        { x: 486, y: 58, width: 344, height: 246 },
        { x: [140, 240], y: [0.25, 0.75] },
    )

    // Subtle alert zone tint above 0.50
    fig.rect(plot.area.x, plot.area.y, plot.area.width, plot.py(0.5) - plot.area.y, {
        fill: tint(red, c.bg, isLight ? 0.08 : 0.13),
    })

    plot.axes({
        xTicks: [140, 160, 180, 200, 220, 240],
        yTicks: [0.3, 0.4, 0.5, 0.6, 0.7],
        xFormat: (v) => `${v}`,
        yFormat: (v) => v.toFixed(1),
        xLabel: 'Capped heartbeat input a (hours)',
        grid: true,
        labelSize: 12,
    })

    // Formula in open top-left inside plot
    fig.math(plot.area.x + 12, plot.area.y + 18, 's(a) = \\sigma(0.02a - 3.82)', {
        size: 14,
        color: c.textPrimary,
    })

    // Threshold line at 0.50
    plot.hline(0.5, 'Alert threshold 0.50', {
        color: warm,
        dash: '5 4',
        width: 1.7,
        labelPosition: 'left',
        labelOffset: 11,
        labelSize: 12,
        weight: 600,
    })

    // Smooth logistic curve
    plot.fn(score, { color: c.textPrimary, width: 2.5 })

    // Guide drops and points for 180h (0.445) and 200h (0.545)
    const p180 = score(180)
    const p200 = score(200)
    fig.line(plot.px(180), plot.py(p180), plot.px(180), plot.bottom, {
        color: blue,
        width: 1.3,
        dash: '3 3',
    })
    fig.line(plot.px(200), plot.py(p200), plot.px(200), plot.bottom, {
        color: red,
        width: 1.3,
        dash: '3 3',
    })
    plot.point(180, p180, { color: blue, r: 6.5 })
    plot.point(200, p200, { color: red, r: 6.5 })

    // Non-overlapping callouts in opposite open quadrants
    fig.callout(
        [plot.px(180) + 5, plot.py(p180) + 5],
        [plot.px(203), plot.py(0.36)],
        '180h -> 0.445 (No alert)',
        {
            color: blue,
            labelColor: blue,
            align: 'left',
            size: 12,
            weight: 700,
            bend: 0.16,
        },
    )
    fig.callout(
        [plot.px(200) - 5, plot.py(p200) - 5],
        [plot.px(185), plot.py(0.64)],
        '200h -> 0.545 (Alert)',
        {
            color: red,
            labelColor: red,
            align: 'right',
            size: 12,
            weight: 700,
            bend: 0.16,
        },
    )

    return fig.render()
}

export default create
