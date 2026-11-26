import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 780
export const height = 395
export const alt =
    'Clustered IVF benchmark on 1,000 16-dimensional vectors across 20 Voronoi cells and 100 queries. Probing 1 cell checks 72.1 distances (7.2% of flat search) with 0.672 Recall@10 and 0.930 1-Recall@10. Increasing nprobe to 6 and 8 lifts Recall@10 to 0.959 and 0.978 at 317.6 and 417.0 checks. Probing all 20 cells achieves 1.000 recall at 1,020 checks, exceeding the 1,000-vector flat scan by the 20 centroid checks.'

const NPROBES = ['1', '2', '4', '6', '8', '20'] as const
const RECALL10 = [0.672, 0.809, 0.918, 0.959, 0.978, 1.0] as const
const ONE_RECALL10 = [0.93, 0.98, 1.0, 1.0, 1.0, 1.0] as const
const CHECKS = [72.1, 121.5, 219.1, 317.6, 417.0, 1020] as const

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const green = fig.tone('green')
    const blue = fig.tone('blue')
    const warm = fig.tone('warm')
    const critical = fig.tone('critical')

    // Subtle context subtitle at top
    fig.text(width / 2, 14, 'IVF trade-off on 1,000 vectors (D = 16, nlist = 20 cells, 100 queries)', {
        size: 13.5,
        weight: 600,
        color: c.textSecondary,
        align: 'center',
    })

    // ─── LEFT PANEL: RECALL VS PROBED CELLS ───
    fig.text(204, 36, 'Recall vs probed cells (nprobe)', {
        size: 14.5,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
    })

    const leftPlot = fig.plot(
        { x: 56, y: 80, width: 304, height: 238 },
        { x: [0, 5], y: [0.5, 1.02] },
    )
    leftPlot.axes({
        xTicks: [0, 1, 2, 3, 4, 5],
        xFormat: (v) => NPROBES[v] ?? '',
        yTicks: [0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
        yFormat: (v) => v.toFixed(1),
        xLabel: 'nprobe (cells scanned out of 20)',
        yLabel: 'Recall',
        grid: true,
        labelSize: 13.5,
    })

    // Highlight sweet-spot column around nprobe = 8 (index 4)
    fig.rect(leftPlot.px(4) - 18, leftPlot.area.y, 36, leftPlot.area.height, {
        fill: green,
        opacity: theme === 'dark' ? 0.14 : 0.09,
        radius: 4,
    })

    const r10Pts = RECALL10.map((v, i) => [i, v] as const)
    const oneR10Pts = ONE_RECALL10.map((v, i) => [i, v] as const)

    leftPlot.smoothCurve(oneR10Pts, { color: blue, width: 2.5, dash: '5 3' })
    leftPlot.smoothCurve(r10Pts, { color: green, width: 3 })

    ONE_RECALL10.forEach((v, i) => leftPlot.point(i, v, { color: blue, r: 4.5 }))
    RECALL10.forEach((v, i) => leftPlot.point(i, v, { color: green, r: 5 }))

    // Direct curve labels + sweet-spot callout
    fig.text(leftPlot.px(0.55), leftPlot.py(0.92), '1-Recall@10', {
        size: 13.5,
        weight: 700,
        color: blue,
        align: 'left',
    })
    fig.text(leftPlot.px(1.55), leftPlot.py(0.76), 'Recall@10', {
        size: 13.5,
        weight: 700,
        color: green,
        align: 'left',
    })
    fig.callout(
        [leftPlot.px(4), leftPlot.py(0.978)],
        [leftPlot.px(3.25), leftPlot.py(0.61)],
        'np=8: 0.978',
        {
            color: green,
            size: 13.5,
            weight: 700,
            bend: -0.18,
            align: 'right',
        },
    )

    // Divider
    fig.line(392, 36, 392, 362, { color: c.borderSubtle, width: 1 })

    // ─── RIGHT PANEL: MEAN DISTANCE CHECKS VS FLAT SCAN (1,000) ───
    fig.text(594, 36, 'Mean distance checks vs flat scan', {
        size: 14.5,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
    })

    const rightPlot = fig.plot(
        { x: 454, y: 80, width: 300, height: 238 },
        { x: [-0.5, 5.5], y: [0, 1150] },
    )
    rightPlot.axes({
        xTicks: [0, 1, 2, 3, 4, 5],
        xFormat: (v) => NPROBES[v] ?? '',
        yTicks: [0, 250, 500, 750, 1000],
        xLabel: 'nprobe',
        yLabel: 'Checks / query',
        grid: true,
        labelSize: 13.5,
    })

    // Flat scan reference line at 1,000
    rightPlot.hline(1000, 'Flat scan = 1,000', {
        color: c.textSecondary,
        width: 1.5,
        dash: '5 4',
        labelPosition: 'left',
        labelSize: 13.5,
        labelOffset: 10,
    })

    const barW = 30
    CHECKS.forEach((val, i) => {
        const cx = rightPlot.px(i)
        const topY = rightPlot.py(val)
        const h = rightPlot.bottom - topY
        const barColor = i === 5 ? critical : i === 4 ? green : blue
        fig.rect(cx - barW / 2, topY, barW, h, {
            fill: i === 4 ? green : i === 5 ? critical : tint(blue, c.bg, theme === 'dark' ? 0.72 : 0.78),
            radius: 4,
        })
        fig.text(cx, topY - 12, String(Math.round(val)), {
            size: 13.5,
            weight: 700,
            color: barColor,
            mono: true,
            align: 'center',
        })
    })

    // Clean callout explaining np=20 overhead (1000 docs + 20 centroids)
    fig.callout(
        [rightPlot.px(5) - 16, rightPlot.py(955)],
        [rightPlot.px(3.2), rightPlot.py(820)],
        '+20 centroid checks',
        {
            color: critical,
            size: 13.5,
            weight: 600,
            bend: 0.18,
            align: 'right',
        },
    )

    // Compact bottom takeaway bar (consistent color link to np=8 sweet spot)
    fig.text(
        width / 2,
        378,
        'nprobe = 8 recovers 97.8% of exact top-10 neighbors using 41.7% of flat-scan checks',
        { size: 13.5, weight: 600, color: warm, align: 'center' },
    )

    return fig.render()
}

export default create()
