import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 860
export const height = 360
export const alt =
    'Side-by-side CUPED comparison across 20,000 units with pre-experiment covariate correlation rho = 0.470 and pooled theta = 0.465. Left: 95% confidence interval tightens from Raw +4.68 pp [3.32, 6.04] (SE 0.70, half-width 1.36 pp) to CUPED +4.39 pp [3.19, 5.59] (SE 0.61, half-width 1.20 pp). Right: pooled outcome variance splits cleanly into 77.9% residual variance kept and 22.1% removed by X.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const isLight = theme === 'light'

    // Left: 95% CI Forest Comparison Plot
    fig.text(46, 26, '95% CI tightening (n = 20,000)', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
    })

    const plot = fig.plot(
        { x: 112, y: 58, width: 392, height: 224 },
        { x: [2.5, 6.5], y: [0, 3] },
    )
    plot.axes({
        xTicks: [3.0, 4.0, 5.0, 6.0],
        xFormat: (v) => `+${v.toFixed(1)}`,
        xLabel: 'Estimated resolution lift (pp)',
        grid: true,
        labelSize: 13,
    })

    const intervals = [
        {
            y: 2.15,
            name: 'Raw',
            sub: 'SE 0.70 pp',
            low: 3.32,
            mid: 4.68,
            high: 6.04,
            hw: '±1.36 pp',
            tone: blue,
        },
        {
            y: 0.9,
            name: 'CUPED',
            sub: 'SE 0.61 pp',
            low: 3.19,
            mid: 4.39,
            high: 5.59,
            hw: '±1.20 pp',
            tone: green,
        },
    ]

    for (const item of intervals) {
        const py = plot.py(item.y)
        const xLo = plot.px(item.low)
        const xMid = plot.px(item.mid)
        const xHi = plot.px(item.high)

        // Left row label
        fig.text(100, py - 7, item.name, {
            size: 14,
            weight: 700,
            color: item.tone,
            align: 'right',
        })
        fig.text(100, py + 10, item.sub, {
            size: 12,
            color: c.textSecondary,
            align: 'right',
            mono: true,
        })

        // Soft CI pill behind whisker
        fig.rect(xLo, py - 9, xHi - xLo, 18, {
            fill: tint(item.tone, c.bg, isLight ? 0.14 : 0.22),
            radius: 4,
        })
        // Whisker line + caps
        fig.line(xLo, py, xHi, py, { color: item.tone, width: 2.6 })
        fig.line(xLo, py - 8, xLo, py + 8, { color: item.tone, width: 2 })
        fig.line(xHi, py - 8, xHi, py + 8, { color: item.tone, width: 2 })
        fig.circle(xMid, py, 6, { fill: item.tone, stroke: c.bg, width: 2 })

        // Point estimate above, bounds + half-width cleanly below
        fig.text(xMid, py - 21, `+${item.mid.toFixed(2)} pp`, {
            size: 13,
            weight: 700,
            color: item.tone,
            align: 'center',
            mono: true,
        })
        fig.text(xLo, py + 21, item.low.toFixed(2), {
            size: 11,
            color: c.textSecondary,
            align: 'center',
            mono: true,
        })
        fig.text(xHi, py + 21, item.high.toFixed(2), {
            size: 11,
            color: c.textSecondary,
            align: 'center',
            mono: true,
        })
        fig.text(xMid, py + 21, item.hw, {
            size: 11,
            weight: 600,
            color: item.tone,
            align: 'center',
            mono: true,
        })
    }

    // Subtle divider between left and right
    fig.line(534, 34, 534, 326, { color: c.borderSubtle, width: 1 })

    // Right: Clean Variance Decomposition Bar (no duplicate 78% / 77.9%)
    const rx = 564
    const rw = 266
    fig.text(rx, 26, 'Pooled variance split', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
    })
    fig.math(rx, 58, '\\operatorname{Var}(Y_{\\text{adj}}) = \\operatorname{Var}(Y)(1 - \\rho^2)', {
        size: 14,
        color: c.textSecondary,
    })

    const barY = 114
    const barH = 44
    const keptW = rw * 0.779
    const remW = rw - keptW

    fig.rect(rx, barY, keptW - 2, barH, {
        fill: tint(blue, c.bg, isLight ? 0.2 : 0.32),
        stroke: blue,
        strokeWidth: 1.6,
        radius: 6,
    })
    fig.rect(rx + keptW + 2, barY, remW - 2, barH, {
        fill: tint(green, c.bg, isLight ? 0.24 : 0.36),
        stroke: green,
        strokeWidth: 1.6,
        radius: 6,
    })

    fig.text(rx + keptW / 2, barY + barH / 2, '77.9%', {
        size: 16,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
        mono: true,
    })
    fig.text(rx + keptW + remW / 2, barY + barH / 2, '22.1%', {
        size: 14,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
        mono: true,
    })

    // Braces labeling the two shares cleanly without redundant numbers
    fig.brace(rx, barY + barH + 8, rx + keptW - 3, barY + barH + 8, 'Residual kept', {
        side: 1,
        depth: 8,
        color: blue,
        labelColor: blue,
        labelSize: 13,
        weight: 600,
    })
    fig.callout(
        [rx + keptW + remW / 2, barY - 4],
        [rx + keptW + remW / 2 - 22, barY - 26],
        'Removed by X',
        {
            color: green,
            labelColor: green,
            align: 'right',
            size: 13,
            weight: 600,
            bend: -0.15,
        },
    )

    // Clean parameter strip at bottom right (no heavy KPI cards)
    const statY = 248
    fig.line(rx, statY - 20, rx + rw, statY - 20, { color: c.borderSubtle, width: 1 })
    const stats = [
        { k: 'Covariate corr. ρ', v: '0.470', tone: c.textPrimary },
        { k: 'Pooled θ*', v: '0.465', tone: blue },
        { k: 'CI half-width drop', v: '1.36 -> 1.20 pp', tone: green },
    ]
    stats.forEach((s, idx) => {
        const y = statY + idx * 28
        fig.text(rx, y, s.k, { size: 13, color: c.textSecondary })
        fig.text(rx + rw, y, s.v, {
            size: 13,
            weight: 700,
            color: s.tone,
            align: 'right',
            mono: true,
        })
    })

    return fig.render()
}

export default create
