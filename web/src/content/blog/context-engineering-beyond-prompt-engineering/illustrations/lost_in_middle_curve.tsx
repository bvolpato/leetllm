import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 780
export const height = 415
export const alt =
    'A U-shaped lost-in-the-middle recall curve across 20-document positions plots accuracy high near position 1 (primacy, 76%), dipping sharply through middle positions 8 to 12 (52% at midpoint), and recovering near position 20 (recency, 71%).'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig

    const warm = fig.tone('warm')
    const green = fig.tone('green')
    const red = fig.tone('critical')
    const blue = fig.tone('blue')

    const plot = fig.plot(
        { x: 74, y: 44, width: 672, height: 248 },
        { x: [1, 20], y: [40, 86] },
    )

    // Soft tinted vertical bands encoding primacy, middle trough, and recency zones
    const bandAlpha = theme === 'light' ? 0.08 : 0.11
    fig.rect(plot.px(1), plot.area.y, plot.px(4.5) - plot.px(1), plot.area.height, {
        fill: green,
        opacity: bandAlpha,
    })
    fig.rect(plot.px(6.5), plot.area.y, plot.px(14.5) - plot.px(6.5), plot.area.height, {
        fill: red,
        opacity: bandAlpha,
    })
    fig.rect(plot.px(16.5), plot.area.y, plot.px(20) - plot.px(16.5), plot.area.height, {
        fill: blue,
        opacity: bandAlpha,
    })

    // Zone titles neatly at the top of each band
    fig.text((plot.px(1) + plot.px(4.5)) / 2, plot.area.y + 14, 'Primacy edge', {
        size: 12.5,
        weight: 600,
        color: green,
        align: 'center',
    })
    fig.text((plot.px(6.5) + plot.px(14.5)) / 2, plot.area.y + 14, 'Lost-in-the-middle trough', {
        size: 12.5,
        weight: 600,
        color: red,
        align: 'center',
    })
    fig.text((plot.px(16.5) + plot.px(20)) / 2, plot.area.y + 14, 'Recency edge', {
        size: 12.5,
        weight: 600,
        color: blue,
        align: 'center',
    })

    plot.axes({
        xTicks: [1, 4, 8, 10, 12, 16, 20],
        xFormat: (v) => `#${v}`,
        yTicks: [40, 50, 60, 70, 80],
        yFormat: (v) => `${v}%`,
        yLabel: 'Multi-doc recall (%)',
        grid: true,
        labelSize: 13,
    })

    const points: [number, number][] = [
        [1, 76],
        [4, 65],
        [8, 55],
        [10, 52],
        [12, 56],
        [16, 64],
        [20, 71],
    ]

    plot.fillArea(points, {
        baseline: 40,
        fill: warm,
        fillOpacity: theme === 'light' ? 0.13 : 0.16,
        smooth: true,
        stroke: false,
    })
    plot.smoothCurve(points, { color: warm, width: 3 })

    for (const [x, y] of points) {
        const highlight = x === 1 || x === 10 || x === 20
        plot.point(x, y, {
            color: x === 10 ? red : warm,
            r: highlight ? 5 : 3.5,
            ring: x === 10,
        })
    }

    // Direct value callouts at key curve landmarks
    fig.text(plot.px(1) + 10, plot.py(76) - 10, '76%', {
        size: 14,
        weight: 700,
        color: green,
        mono: true,
    })
    fig.text(plot.px(10), plot.py(52) + 20, '52% min', {
        size: 14,
        weight: 700,
        color: red,
        align: 'center',
        mono: true,
    })
    fig.text(plot.px(20) - 8, plot.py(71) - 12, '71%', {
        size: 14,
        weight: 700,
        color: blue,
        align: 'right',
        mono: true,
    })

    // Aligned prompt-window ordering strip beneath the x-axis
    const stripY = 352
    const stripH = 38
    const seg1W = plot.px(5) - plot.px(1)
    const seg2W = plot.px(16) - plot.px(5)
    const seg3W = plot.px(20) - plot.px(16)

    fig.text(plot.area.x - 10, stripY + 12, 'Window', {
        size: 12,
        weight: 600,
        color: c.textSecondary,
        align: 'right',
    })
    fig.text(plot.area.x - 10, stripY + 27, 'order', {
        size: 12,
        weight: 600,
        color: c.textSecondary,
        align: 'right',
    })

    fig.rect(plot.px(1), stripY, seg1W - 3, stripH, {
        fill: tint(green, c.bg, theme === 'light' ? 0.15 : 0.2),
        stroke: green,
        strokeWidth: 1.25,
        radius: 6,
    })
    fig.text(plot.px(1) + seg1W / 2 - 1, stripY + stripH / 2, 'Rules + top doc', {
        size: 12.5,
        weight: 600,
        color: green,
        align: 'center',
    })

    fig.rect(plot.px(5) + 1, stripY, seg2W - 4, stripH, {
        fill: tint(c.textMuted, c.bg, 0.1),
        stroke: c.border,
        strokeWidth: 1,
        radius: 6,
    })
    fig.text(plot.px(5) + seg2W / 2, stripY + stripH / 2, 'Lower-priority background context', {
        size: 12.5,
        color: c.textSecondary,
        align: 'center',
    })

    fig.rect(plot.px(16) + 1, stripY, seg3W - 1, stripH, {
        fill: tint(blue, c.bg, theme === 'light' ? 0.15 : 0.2),
        stroke: blue,
        strokeWidth: 1.25,
        radius: 6,
    })
    fig.text(plot.px(16) + seg3W / 2, stripY + stripH / 2, 'Key doc + query', {
        size: 12.5,
        weight: 600,
        color: blue,
        align: 'center',
    })

    return fig.render()
}

export default create('dark')
