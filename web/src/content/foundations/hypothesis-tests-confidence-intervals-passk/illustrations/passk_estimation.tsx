import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 840
export const height = 400
export const alt =
    'Comparison of unbiased finite-pool pass@k versus the naive with-replacement plug-in for a pool of n = 10 candidates with c = 2 passes. Left: ten candidate tiles (2 passing, 8 failing) and k = 5 summary. Right: curves across k = 1 to 10 agree at k = 1 (0.200) and diverge for k > 1; at k = 5, a gap bracket highlights the -10.6 pp downward bias between unbiased 0.778 and plug-in 0.672.'

function exactPassAtK(n: number, c: number, k: number): number {
    if (n - c < k) return 1
    let fail = 1
    for (let i = n - c + 1; i <= n; i += 1) {
        fail *= 1 - k / i
    }
    return 1 - fail
}

const KS = Array.from({ length: 10 }, (_, i) => i + 1)

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const isLight = theme === 'light'

    // Left: Candidate pool visualization (n = 10 tiles: 2 pass, 8 fail) + k = 5 numbers
    fig.text(24, 24, 'Sampled pool (n = 10, c = 2)', { size: 15, weight: 700 })

    const tileX = 28
    const tileY = 58
    const tileW = 40
    const tileH = 38
    const gap = 8
    for (let i = 0; i < 10; i++) {
        const row = Math.floor(i / 5)
        const col = i % 5
        const x = tileX + col * (tileW + gap)
        const y = tileY + row * (tileH + gap)
        const pass = i < 2
        fig.rect(x, y, tileW, tileH, {
            fill: pass
                ? tint(green, c.bg, isLight ? 0.25 : 0.36)
                : tint(c.textMuted, c.bg, isLight ? 0.08 : 0.13),
            stroke: pass ? green : c.borderSubtle,
            strokeWidth: pass ? 1.6 : 1,
            radius: 6,
        })
        fig.text(x + tileW / 2, y + tileH / 2, pass ? '✓' : '×', {
            size: 16,
            weight: 700,
            color: pass ? green : c.textMuted,
            align: 'center',
        })
    }
    fig.text(28, 158, '2 pass · 8 fail  (p̂ = 0.20)', {
        size: 12,
        weight: 600,
        color: c.textSecondary,
        mono: true,
    })

    // Compact k = 5 comparison readout below tiles
    fig.line(24, 184, 260, 184, { color: c.borderSubtle, width: 1 })
    fig.text(28, 206, 'At attempt budget k = 5:', { size: 13, weight: 700 })
    fig.text(28, 234, 'Unbiased (w/o repl.)', { size: 12, color: c.textSecondary })
    fig.text(258, 234, '0.778', { size: 14, weight: 700, color: green, align: 'right', mono: true })
    fig.text(28, 260, 'Plug-in (w/ repl.)', { size: 12, color: c.textSecondary })
    fig.text(258, 260, '0.672', { size: 14, weight: 700, color: warm, align: 'right', mono: true })
    fig.text(28, 286, 'Downward bias', { size: 12, color: c.textSecondary })
    fig.text(258, 286, '−10.6 pp', { size: 14, weight: 700, color: warm, align: 'right', mono: true })

    fig.math(28, 336, '1 - \\frac{\\binom{8}{5}}{\\binom{10}{5}} = \\frac{196}{252}', {
        size: 14,
        color: green,
    })

    // Vertical divider
    fig.line(286, 28, 286, 372, { color: c.borderSubtle, width: 1 })

    // Right: pass@k curves across k = 1..10
    fig.text(352, 24, 'pass@k estimator vs attempt budget k', { size: 15, weight: 700 })

    const plot = fig.plot(
        { x: 356, y: 58, width: 454, height: 274 },
        { x: [0.6, 10.4], y: [0, 1.06] },
    )
    plot.axes({
        xTicks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        yTicks: [0.2, 0.4, 0.6, 0.8, 1.0],
        yFormat: (v) => v.toFixed(1),
        xLabel: 'Attempt budget k',
        yLabel: 'Estimated pass@k',
        grid: true,
        labelSize: 12,
    })

    const unbiasedPts = KS.map((k) => [k, exactPassAtK(10, 2, k)] as const)
    const pluginPts = KS.map((k) => [k, 1 - 0.8 ** k] as const)

    // Shaded bias band between the two curves
    plot.band(pluginPts, unbiasedPts, {
        fill: warm,
        fillOpacity: isLight ? 0.1 : 0.14,
    })

    // Draw curves
    plot.curve(unbiasedPts, { color: green, width: 2.8 })
    plot.curve(pluginPts, { color: warm, width: 2.3, dash: '6 4' })

    for (const [k, y] of unbiasedPts) {
        plot.point(k, y, { color: green, r: k === 5 ? 6 : 3.5 })
    }
    for (const [k, y] of pluginPts) {
        plot.point(k, y, { color: warm, r: k === 5 ? 6 : 3.5, ring: k !== 5 })
    }

    // Vertical reference guide at k = 5
    fig.line(plot.px(5), plot.py(0.6723), plot.px(5), plot.bottom, {
        color: c.textMuted,
        width: 1.2,
        dash: '3 3',
    })

    // Crisp -10.6 pp gap bracket directly at k = 5 + clean callout into open space below curves!
    const x5 = plot.px(5)
    const yUnb = plot.py(0.7778)
    const yPlg = plot.py(0.6723)
    fig.line(x5, yUnb, x5, yPlg, { color: warm, width: 2.5 })
    fig.brace(x5 + 7, yUnb, x5 + 7, yPlg, undefined, {
        side: -1,
        depth: 6,
        color: warm,
    })
    fig.callout(
        [x5 + 15, (yUnb + yPlg) / 2],
        [plot.px(6.6), plot.py(0.52)],
        '−10.6 pp bias at k = 5',
        {
            color: warm,
            labelColor: warm,
            align: 'left',
            size: 12,
            weight: 700,
            bend: 0.16,
        },
    )

    // Direct value callouts at k = 5 (well clear of curves)
    fig.text(x5 - 10, yUnb - 10, '0.778', {
        size: 13,
        weight: 700,
        color: green,
        align: 'right',
        mono: true,
    })
    fig.text(x5 + 8, yPlg + 22, '0.672', {
        size: 13,
        weight: 700,
        color: warm,
        align: 'left',
        mono: true,
    })

    // Direct curve labels in clean open space
    fig.text(plot.px(8.4), plot.py(1.03), 'Unbiased (finite pool)', {
        size: 12,
        weight: 700,
        color: green,
        align: 'center',
    })
    fig.text(plot.px(8.8), plot.py(0.78), 'Naive plug-in', {
        size: 12,
        weight: 700,
        color: warm,
        align: 'center',
    })

    return fig.render()
}

export default create
