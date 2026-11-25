import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const alt =
    'IVF coarse routing query at (2.8, 2.71) falls inside C1 because C1 at (4.5, 4.0) is distance 2.134 away versus 2.146 to C0. Scanning nprobe=1 misses true nearest neighbor fin_B in pruned C0 at distance 1.841; probing nprobe=2 recovers it.'

export const width = 780
export const height = 430

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const critical = fig.tone('critical')

    // Left: Equal-aspect 2D Voronoi border geometry (focusing x in [0, 7.2], y in [0, 5.2])
    fig.text(244, 20, 'Voronoi bisector vs exact nearest neighbor', {
        size: 15,
        weight: 600,
        color: c.textPrimary,
        align: 'center',
    })

    const plot = fig.plot(
        { x: 54, y: 46, width: 396, height: 320 },
        { x: [0, 6.8], y: [0, 5.4] },
    )
    plot.axes({
        xTicks: [0, 2, 4, 6],
        yTicks: [0, 1, 2, 3, 4, 5],
        xLabel: 'Embedding dim 1',
        yLabel: 'dim 2',
        grid: true,
        labelSize: 12,
    })

    // Exact perpendicular bisector between C0 (1.1, 1.4) and C1 (4.5, 4.0)
    // Midpoint = (2.8, 2.7), delta = (3.4, 2.6) -> 3.4(x - 2.8) + 2.6(y - 2.7) = 0
    // At y = 5.4 -> x = 2.8 - 2.6*2.7/3.4 = 0.735; at y = 0 -> x = 2.8 + 2.6*2.7/3.4 = 4.865
    const xTop = 0.735
    const xBot = 4.865

    // Subtle half-plane shading for C0 (left) and C1 (right)
    fig.path(
        `M${plot.px(0)} ${plot.py(5.4)}L${plot.px(xTop)} ${plot.py(5.4)}L${plot.px(xBot)} ${plot.py(0)}L${plot.px(0)} ${plot.py(0)}Z`,
        { fill: blue, fillOpacity: theme === 'dark' ? 0.08 : 0.06 },
    )
    fig.path(
        `M${plot.px(xTop)} ${plot.py(5.4)}L${plot.px(6.8)} ${plot.py(5.4)}L${plot.px(6.8)} ${plot.py(0)}L${plot.px(xBot)} ${plot.py(0)}Z`,
        { fill: purple, fillOpacity: theme === 'dark' ? 0.08 : 0.06 },
    )

    // Bisector dashed line
    fig.line(plot.px(xTop), plot.py(5.4), plot.px(xBot), plot.py(0), {
        color: c.textSecondary,
        width: 2,
        dash: '6 4',
    })
    fig.text(plot.px(xTop) + 28, plot.py(5.15), 'C0 / C1 border', {
        size: 12,
        weight: 600,
        color: c.textSecondary,
        align: 'left',
    })

    // Query radius circle (r = 1.841, distance from q(2.8, 2.71) to fin_B(1.2, 1.8))
    const qx = 2.8
    const qy = 2.71
    const radPts: [number, number][] = []
    for (let i = 0; i <= 72; i++) {
        const a = (i / 72) * Math.PI * 2
        const px = qx + 1.841 * Math.cos(a)
        const py = qy + 1.841 * Math.sin(a)
        if (px >= 0 && px <= 6.8 && py >= 0 && py <= 5.4) {
            radPts.push([px, py])
        }
    }
    plot.curve(radPts, { color: green, width: 1.5, dash: '3 3', opacity: 0.75 })

    // Distance vectors from query q
    fig.line(plot.px(qx), plot.py(qy), plot.px(4.5), plot.py(4.0), {
        color: purple,
        width: 2.25,
    })
    fig.line(plot.px(qx), plot.py(qy), plot.px(1.2), plot.py(1.8), {
        color: green,
        width: 2.75,
    })

    // Docs & centroids
    plot.point(1.0, 1.0, { color: blue, r: 5.5 })
    plot.point(1.2, 1.8, { color: green, r: 7.5 })
    fig.circle(plot.px(1.2), plot.py(1.8), 11, { stroke: green, width: 1.5 })
    plot.point(4.0, 4.2, { color: purple, r: 5.5 })
    plot.point(5.0, 3.8, { color: purple, r: 5.5 })

    // Centroids (ringed)
    plot.point(1.1, 1.4, { color: blue, r: 6.5, ring: true })
    plot.point(4.5, 4.0, { color: purple, r: 6.5, ring: true })

    // Query point
    plot.point(qx, qy, { color: warm, r: 7.5 })

    // Direct labels
    fig.text(plot.px(qx) + 12, plot.py(qy) - 6, 'q (2.8, 2.71)', {
        size: 13,
        weight: 700,
        color: warm,
        align: 'left',
    })
    fig.text(plot.px(1.2) - 10, plot.py(1.8) + 2, 'fin_B', {
        size: 13,
        weight: 700,
        color: green,
        mono: true,
        align: 'right',
    })
    fig.text(plot.px(1.1) + 10, plot.py(1.2), 'C0', {
        size: 12.5,
        weight: 700,
        color: blue,
        align: 'left',
    })
    fig.text(plot.px(4.5) + 12, plot.py(4.18), 'C1 center', {
        size: 12.5,
        weight: 700,
        color: purple,
        align: 'left',
    })
    fig.text(plot.px(3.8), plot.py(3.15), '2.134', {
        size: 12,
        weight: 600,
        color: purple,
        mono: true,
    })
    fig.text(plot.px(1.62), plot.py(2.68), '1.841', {
        size: 12,
        weight: 700,
        color: green,
        mono: true,
    })

    // Right column: Aligned distance bars + probe outcome comparison
    const rx = 492
    const rw = 266
    fig.text(rx, 20, 'Distances from query q', {
        size: 15,
        weight: 600,
        color: c.textPrimary,
    })

    const dists = [
        { label: 'fin_B (in C0)', val: 1.841, color: green, note: 'true nearest' },
        { label: 'C1 centroid', val: 2.134, color: purple, note: 'closest cell' },
        { label: 'C0 centroid', val: 2.146, color: blue, note: '+0.012 farther' },
    ]
    const maxD = 2.4
    dists.forEach((d, idx) => {
        const y = 66 + idx * 58
        fig.text(rx, y - 12, d.label, { size: 13, weight: 600, color: c.textPrimary })
        fig.text(rx + rw, y - 12, d.val.toFixed(3), {
            size: 13,
            weight: 700,
            color: d.color,
            mono: true,
            align: 'right',
        })
        fig.rect(rx, y + 2, rw, 16, {
            fill: tint(d.color, c.bg, 0.1),
            radius: 4,
        })
        fig.rect(rx, y + 2, (d.val / maxD) * rw, 16, {
            fill: d.color,
            radius: 4,
        })
        fig.text(rx, y + 28, d.note, { size: 11.5, color: c.textMuted })
    })

    // Divider
    fig.line(rx, 246, rx + rw, 246, { color: c.borderSubtle, width: 1 })

    fig.text(rx, 266, 'Probe trade-off', {
        size: 14,
        weight: 600,
        color: c.textPrimary,
    })

    // Two clean left-accent outcome rows (zero heavy card chrome)
    const outcomes = [
        {
            badge: 'nprobe = 1',
            detail: 'Scans C1 only · 5 dists',
            result: 'Recall@1 = 0 (misses fin_B)',
            color: critical,
            y: 294,
        },
        {
            badge: 'nprobe = 2',
            detail: 'Scans C1 + C0 · 7 dists',
            result: 'Recall@1 = 1 (recovers fin_B)',
            color: green,
            y: 356,
        },
    ]
    for (const o of outcomes) {
        fig.rect(rx, o.y, 4, 46, { fill: o.color, radius: 2 })
        fig.text(rx + 14, o.y + 8, `${o.badge}  ·  ${o.detail}`, {
            size: 13,
            weight: 700,
            color: c.textPrimary,
        })
        fig.text(rx + 14, o.y + 30, o.result, {
            size: 12.5,
            weight: 600,
            color: o.color,
        })
    }

    return fig.render()
}

export default create()
