import { type ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 710
export const height = 470
export const alt =
    'Modeled speculative decoding speedup versus draft depth K (for alpha = 0.8, draft cost c = 0.1). Flat verification cost v(K) = 1 peaks at K = 6 with 2.47x speedup, whereas rising cost v(K) = 1 + 0.05K peaks earlier at K = 5 with 2.11x. Below, a proportional yield bar at K = 5 splits 3.689 expected tokens into 1.000 guaranteed correction or bonus token plus 2.689 accepted draft prefix tokens.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'

    const flat = fig.tone('blue')
    const rising = fig.tone('warm')

    const ks = Array.from({ length: 10 }, (_, i) => i + 1)
    const yieldAt = (k: number) =>
        Array.from({ length: k + 1 }, (_, i) => 0.8 ** i).reduce((sum, p) => sum + p, 0)
    const flatAt = (k: number) => yieldAt(k) / (1 + 0.1 * k)
    const risingAt = (k: number) => yieldAt(k) / (1 + 0.1 * k + 0.05 * k)

    const flatPts = ks.map((k) => [k, flatAt(k)] as const)
    const risingPts = ks.map((k) => [k, risingAt(k)] as const)

    const plot = fig.plot(
        { x: 64, y: 34, width: 384, height: 242 },
        { x: [0, 10], y: [0, 2.75] },
    )
    plot.axes({
        xTicks: [0, 2, 4, 6, 8, 10],
        yTicks: [0, 0.5, 1.0, 1.5, 2.0, 2.5],
        xLabel: 'Draft depth K (proposed tokens)',
        yLabel: 'Modeled speedup (× target step)',
        yFormat: (v) => `${v.toFixed(1)}×`,
        grid: true,
        labelSize: 15,
    })

    // 1x baseline reference line
    plot.hline(1.0, '1.0× baseline', {
        color: c.textMuted,
        dash: '4 4',
        labelPosition: 'left',
        labelSize: 14.5,
        labelOffset: 12,
    })

    // Smooth speedup curves + markers
    plot.smoothCurve(flatPts, { color: flat, width: 2.6 })
    plot.smoothCurve(risingPts, { color: rising, width: 2.6 })
    for (const k of ks) {
        plot.point(k, flatAt(k), { color: flat, r: k === 6 ? 5.5 : 3.2, ring: k === 6 })
        plot.point(k, risingAt(k), { color: rising, r: k === 5 ? 5.5 : 3.2, ring: k === 5 })
    }

    // Direct peak callouts on plot (zero legend collisions!)
    const flatPeak = [plot.px(6), plot.py(flatAt(6))] as const
    fig.callout([flatPeak[0], flatPeak[1] - 6], [plot.px(6.8), plot.py(2.64)], 'K=6 · 2.47×', {
        color: flat,
        size: 14.5,
        weight: 700,
        bend: -0.15,
        align: 'left',
    })

    const risePeak = [plot.px(5), plot.py(risingAt(5))] as const
    fig.callout([risePeak[0], risePeak[1] + 6], [plot.px(5.6), plot.py(1.48)], 'K=5 · 2.11×', {
        color: rising,
        size: 14.5,
        weight: 700,
        bend: 0.18,
        align: 'left',
    })

    // Right column: clean direct legend + K=5 cost breakdown
    const sideX = 468
    fig.text(sideX, 44, 'Model parameters', { size: 15, weight: 700, color: c.textPrimary })
    fig.math(sideX, 72, '\\alpha = 0.8,\\; c = 0.1', { size: 15.5, color: c.textSecondary })

    // Flat curve swatch
    fig.line(sideX, 114, sideX + 20, 114, { color: flat, width: 3 })
    fig.text(sideX + 26, 114, 'Flat: v(K) = 1', {
        size: 14.5,
        weight: 700,
        color: flat,
    })
    fig.text(sideX + 26, 138, 'K=5: 1.0 + 0.5 = 1.5', {
        size: 14.5,
        color: c.textSecondary,
        mono: true,
    })

    // Rising curve swatch
    fig.line(sideX, 178, sideX + 20, 178, { color: rising, width: 3 })
    fig.text(sideX + 26, 178, 'Rising: 1 + 0.05K', {
        size: 14.5,
        weight: 700,
        color: rising,
    })
    fig.text(sideX + 26, 202, 'K=5: 1.25 + 0.5 = 1.75', {
        size: 14.5,
        color: c.textSecondary,
        mono: true,
    })

    fig.text(sideX, 240, 'Speedup formula', { size: 14.5, weight: 600, color: c.textSecondary })
    fig.math(sideX, 270, '\\frac{E[\\text{tokens}]}{v(K) + c\\,K}', {
        size: 15.5,
        color: c.textPrimary,
    })

    // Hairline separator + K=5 expected yield breakdown bar
    const sepY = 330
    fig.line(24, sepY, width - 24, sepY, { color: c.borderSubtle, width: 1 })

    const yieldK5 = yieldAt(5) // 3.68928
    const barX = 48
    const barY = sepY + 34
    const barW = 614
    const barH = 38
    const corrW = (1 / yieldK5) * barW
    const prefW = barW - corrW - 4

    fig.text(barX, sepY + 18, 'Expected emitted tokens at K = 5', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
    })
    fig.text(barX + barW, sepY + 18, `E[tokens] = ${yieldK5.toFixed(3)}`, {
        size: 15,
        weight: 700,
        color: c.textPrimary,
        mono: true,
        align: 'right',
    })

    fig.rect(barX, barY, corrW, barH, {
        fill: tint(rising, c.bg, isLight ? 0.2 : 0.34),
        stroke: rising,
        strokeWidth: 1.5,
        radius: 6,
    })
    fig.text(barX + corrW / 2, barY + barH / 2, '1.000 bonus', {
        size: 14.5,
        weight: 700,
        color: rising,
        align: 'center',
        mono: true,
    })

    fig.rect(barX + corrW + 4, barY, prefW, barH, {
        fill: tint(flat, c.bg, isLight ? 0.18 : 0.32),
        stroke: flat,
        strokeWidth: 1.5,
        radius: 6,
    })
    fig.text(barX + corrW + 4 + prefW / 2, barY + barH / 2, '2.689 accepted draft prefix', {
        size: 14.5,
        weight: 700,
        color: flat,
        align: 'center',
        mono: true,
    })

    fig.brace(barX, barY + barH + 8, barX + barW, barY + barH + 8, '1 + 0.8 + 0.64 + 0.512 + 0.410 + 0.328 = 3.689', {
        side: 1,
        depth: 9,
        color: c.textMuted,
        labelColor: c.textSecondary,
        labelSize: 14.5,
        labelGap: 16,
    })

    return fig.render()
}

export default create('dark')
