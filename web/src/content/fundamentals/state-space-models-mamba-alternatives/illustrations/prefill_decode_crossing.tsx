import { type ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 400
export const alt =
    'Total generation latency comparing attention (120 ms prefill plus 3.2 ms per decode token) and SSM (150 ms prefill plus 1.8 ms per decode token). The two curves cross at N = 22.4 tokens (188.6 ms): attention is slightly faster at N = 16 (168 ms vs 177 ms), while SSM pulls far ahead at N = 256 (609 ms vs 936 ms).'

const attnTotal = (n: number) => 120 + (n - 1) * 3.2
const ssmTotal = (n: number) => 150 + (n - 1) * 1.8
const crossN = 1 + 30 / 1.4 // 22.42857
const crossMs = attnTotal(crossN) // 188.57

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'

    // High-contrast distinct hues: blue (Attention) vs warm gold/amber (SSM)
    const attnCol = fig.tone('blue')
    const ssmCol = fig.tone('warm')

    // Left plot: crossover curve (N = 0 .. 50, latency = 100 .. 300 ms)
    fig.text(64, 22, 'Total latency crossover (ms)', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
    })

    const plot = fig.plot(
        { x: 64, y: 46, width: 392, height: 278 },
        { x: [0, 50], y: [100, 300] },
    )
    plot.axes({
        xTicks: [0, 10, 20, 30, 40, 50],
        yTicks: [100, 150, 200, 250, 300],
        yFormat: (v) => `${v}`,
        xLabel: 'Generated tokens N',
        grid: true,
        labelSize: 13.5,
    })

    // Shaded advantage zones along top
    fig.rect(plot.px(1), plot.area.y, plot.px(crossN) - plot.px(1), 22, {
        fill: tint(attnCol, c.bg, isLight ? 0.12 : 0.2),
    })
    fig.text((plot.px(1) + plot.px(crossN)) / 2, plot.area.y + 11, 'Attn faster', {
        size: 13,
        weight: 600,
        color: attnCol,
        align: 'center',
    })
    fig.rect(plot.px(crossN), plot.area.y, plot.px(50) - plot.px(crossN), 22, {
        fill: tint(ssmCol, c.bg, isLight ? 0.12 : 0.2),
    })
    fig.text((plot.px(crossN) + plot.px(50)) / 2, plot.area.y + 11, 'SSM faster', {
        size: 13,
        weight: 600,
        color: ssmCol,
        align: 'center',
    })

    // Vertical crossover guide
    plot.vline(crossN, undefined, { color: c.textMuted, dash: '4 4', width: 1.3 })

    // Lines from N=1 to N=50
    plot.curve(
        [
            [1, attnTotal(1)],
            [50, attnTotal(50)],
        ],
        { color: attnCol, width: 2.6 },
    )
    plot.curve(
        [
            [1, ssmTotal(1)],
            [50, ssmTotal(50)],
        ],
        { color: ssmCol, width: 2.6 },
    )

    // Crossover dot & callout
    plot.point(crossN, crossMs, { color: c.textPrimary, r: 5.5, ring: true })
    fig.callout([plot.px(crossN) + 4, plot.py(crossMs) + 5], [plot.px(32), plot.py(138)], 'N = 22.4 (189 ms)', {
        color: c.textPrimary,
        size: 13.5,
        weight: 700,
        bend: 0.15,
        align: 'left',
    })

    // Direct curve labels placed cleanly in open space (zero collision with curve or top zone)
    fig.text(plot.px(39), plot.py(attnTotal(39)) - 18, 'Attn (+3.2/tok)', {
        size: 13.5,
        weight: 700,
        color: attnCol,
        align: 'right',
    })
    fig.text(plot.px(49), plot.py(ssmTotal(49)) + 50, 'SSM (+1.8/tok)', {
        size: 13.5,
        weight: 700,
        color: ssmCol,
        align: 'right',
    })

    // Right plot: grouped bar comparison at N = 16 vs N = 256
    const rightX = 524
    fig.text(rightX, 20, 'Short vs long decode (ms)', {
        size: 14.5,
        weight: 700,
        color: c.textPrimary,
    })

    const barPlot = fig.plot(
        { x: rightX, y: 46, width: 212, height: 278 },
        { x: [0, 4], y: [0, 1050] },
    )
    barPlot.axes({
        xTicks: [],
        yTicks: [0, 250, 500, 750, 1000],
        grid: true,
        labelSize: 12.5,
    })

    const groups = [
        {
            label: 'N = 16',
            xCenter: 1.0,
            attn: 168,
            ssm: 177,
        },
        {
            label: 'N = 256',
            xCenter: 3.0,
            attn: 936,
            ssm: 609,
        },
    ]

    const bw = 34
    const gap = 8
    for (const g of groups) {
        const cx = barPlot.px(g.xCenter)
        const ax = cx - gap / 2 - bw
        const sx = cx + gap / 2

        const aTop = barPlot.py(g.attn)
        fig.rect(ax, aTop, bw, barPlot.bottom - aTop, {
            fill: tint(attnCol, c.bg, isLight ? 0.22 : 0.34),
            stroke: attnCol,
            strokeWidth: 1.5,
            radius: 4,
        })
        fig.text(ax + bw / 2, aTop - 10, `${g.attn}`, {
            size: 12.5,
            weight: 700,
            color: attnCol,
            align: 'center',
            mono: true,
        })

        const sTop = barPlot.py(g.ssm)
        fig.rect(sx, sTop, bw, barPlot.bottom - sTop, {
            fill: tint(ssmCol, c.bg, isLight ? 0.22 : 0.34),
            stroke: ssmCol,
            strokeWidth: 1.5,
            radius: 4,
        })
        fig.text(sx + bw / 2, sTop - 10, `${g.ssm}`, {
            size: 12.5,
            weight: 700,
            color: ssmCol,
            align: 'center',
            mono: true,
        })

        fig.text(cx, barPlot.bottom + 16, g.label, {
            size: 13,
            weight: 700,
            color: c.textPrimary,
            align: 'center',
            mono: true,
        })
    }

    // Compact legend swatches below right plot
    fig.rect(rightX + 18, 360, 12, 12, {
        fill: tint(attnCol, c.bg, isLight ? 0.22 : 0.34),
        stroke: attnCol,
        strokeWidth: 1.4,
        radius: 3,
    })
    fig.text(rightX + 36, 366, 'Attention', { size: 12.5, weight: 600, color: attnCol })
    fig.rect(rightX + 124, 360, 12, 12, {
        fill: tint(ssmCol, c.bg, isLight ? 0.22 : 0.34),
        stroke: ssmCol,
        strokeWidth: 1.4,
        radius: 3,
    })
    fig.text(rightX + 142, 366, 'SSM', { size: 12.5, weight: 600, color: ssmCol })

    // Speedup callout on N=256 (cleanly centered inside SSM bar column)
    fig.text(barPlot.px(3.0) + gap / 2 + bw / 2, barPlot.py(609) - 27, '−35%', {
        size: 12.5,
        weight: 700,
        color: ssmCol,
        align: 'center',
        mono: true,
    })

    return fig.render()
}

export default create('dark')
