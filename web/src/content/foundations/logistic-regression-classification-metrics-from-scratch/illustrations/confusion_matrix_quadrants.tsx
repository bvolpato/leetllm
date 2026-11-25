import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 840
export const height = 370
export const alt =
    'Eight validation response scores placed in two actual-class lanes divided by a vertical threshold at t = 0.20, with subtle quadrant tints for FN (0), TP (4), TN (2), and FP (2). V1 (0.061) and V2 (0.169) stay left as true negatives; all four actual positives (V8, V3, V5, V7) plus two false positives (V6 and V4) cross right of 0.20.'

const CASES = [
    { id: 'V1', p: 0.061, actual: 0 },
    { id: 'V2', p: 0.169, actual: 0 },
    { id: 'V6', p: 0.325, actual: 0 },
    { id: 'V4', p: 0.624, actual: 0 },
    { id: 'V8', p: 0.244, actual: 1 },
    { id: 'V3', p: 0.595, actual: 1 },
    { id: 'V5', p: 0.971, actual: 1 },
    { id: 'V7', p: 0.99, actual: 1 },
] as const

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const red = fig.tone('critical')
    const warm = fig.tone('warm')
    const isLight = theme === 'light'

    const plot = fig.plot(
        { x: 148, y: 56, width: 658, height: 228 },
        { x: [0, 1.05], y: [-0.55, 1.55] },
    )

    const cutX = plot.px(0.2)
    const midY = plot.py(0.5)

    // Subtle 4-quadrant semantic tints
    // Top-left: FN = 0 (neutral muted)
    fig.rect(plot.area.x, plot.area.y, cutX - plot.area.x, midY - plot.area.y, {
        fill: tint(c.textMuted, c.bg, isLight ? 0.05 : 0.08),
    })
    // Top-right: TP = 4 (green)
    fig.rect(cutX, plot.area.y, plot.right - cutX, midY - plot.area.y, {
        fill: tint(green, c.bg, isLight ? 0.1 : 0.14),
    })
    // Bottom-left: TN = 2 (blue)
    fig.rect(plot.area.x, midY, cutX - plot.area.x, plot.bottom - midY, {
        fill: tint(blue, c.bg, isLight ? 0.1 : 0.14),
    })
    // Bottom-right: FP = 2 (red)
    fig.rect(cutX, midY, plot.right - cutX, plot.bottom - midY, {
        fill: tint(red, c.bg, isLight ? 0.09 : 0.14),
    })

    // Lane centerlines + horizontal quadrant divider
    fig.line(plot.area.x, midY, plot.right, midY, { color: c.borderSubtle, width: 1.25 })
    fig.line(plot.area.x, plot.py(1), plot.right, plot.py(1), {
        color: c.borderSubtle,
        width: 1,
        dash: '2 4',
    })
    fig.line(plot.area.x, plot.py(0), plot.right, plot.py(0), {
        color: c.borderSubtle,
        width: 1,
        dash: '2 4',
    })

    plot.axes({
        xTicks: [0, 0.2, 0.4, 0.6, 0.8, 1.0],
        xFormat: (v) => v.toFixed(1),
        xLabel: 'Predicted unsupported-claim probability p',
        labelSize: 13,
    })

    // Left lane labels
    fig.text(132, plot.py(1) - 8, 'Actual y = 1', {
        size: 14,
        weight: 700,
        color: green,
        align: 'right',
    })
    fig.text(132, plot.py(1) + 10, 'Review required', {
        size: 12,
        color: c.textSecondary,
        align: 'right',
    })
    fig.text(132, plot.py(0) - 8, 'Actual y = 0', {
        size: 14,
        weight: 700,
        color: blue,
        align: 'right',
    })
    fig.text(132, plot.py(0) + 10, 'Grounded reply', {
        size: 12,
        color: c.textSecondary,
        align: 'right',
    })

    // Vertical threshold cutoff at t = 0.20
    fig.line(cutX, plot.area.y - 6, cutX, plot.bottom, {
        color: warm,
        width: 2.4,
        dash: '6 4',
    })
    fig.text(cutX, 34, 'Threshold t = 0.20', {
        size: 14,
        weight: 700,
        color: warm,
        align: 'center',
        mono: true,
    })

    // Quadrant corner tags
    fig.text(plot.area.x + 10, plot.area.y + 16, 'FN = 0', {
        size: 13,
        weight: 700,
        color: c.textMuted,
        mono: true,
    })
    fig.text(plot.right - 12, plot.area.y + 16, 'TP = 4', {
        size: 13,
        weight: 700,
        color: green,
        align: 'right',
        mono: true,
    })
    fig.text(plot.area.x + 10, midY + 16, 'TN = 2', {
        size: 13,
        weight: 700,
        color: blue,
        mono: true,
    })
    fig.text(plot.right - 12, midY + 16, 'FP = 2', {
        size: 13,
        weight: 700,
        color: red,
        align: 'right',
        mono: true,
    })

    // Plot validation points with zero collisions (V2 nudged clearly left of t = 0.20!)
    const posOverrides: Record<
        (typeof CASES)[number]['id'],
        { laneY: number; dx: number; dy: number; align: 'left' | 'center' | 'right' }
    > = {
        V1: { laneY: 0, dx: 0, dy: 22, align: 'center' },
        V2: { laneY: 0, dx: -12, dy: -18, align: 'right' }, // nudged well off t=0.20 line!
        V6: { laneY: 0, dx: 0, dy: 22, align: 'center' },
        V4: { laneY: 0, dx: 0, dy: -20, align: 'center' },
        V8: { laneY: 1, dx: 10, dy: -18, align: 'left' },
        V3: { laneY: 1, dx: 0, dy: 22, align: 'center' },
        V5: { laneY: 1.12, dx: -12, dy: -14, align: 'right' },
        V7: { laneY: 0.86, dx: -12, dy: 18, align: 'right' },
    }

    for (const item of CASES) {
        const cfg = posOverrides[item.id]
        const px = plot.px(item.p)
        const py = plot.py(cfg.laneY)
        const tone = item.actual === 1 ? green : item.p >= 0.2 ? red : blue

        fig.circle(px, py, 7, { fill: tone, stroke: c.bg, width: 2 })
        fig.text(px + cfg.dx, py + cfg.dy, `${item.id} (${item.p.toFixed(2)})`, {
            size: 12,
            weight: 700,
            color: tone,
            align: cfg.align,
            mono: true,
        })
    }

    // Bottom crisp summary
    fig.text(
        plot.area.x + plot.area.width / 2,
        346,
        'Precision = 4/6 (0.667)   ·   Recall = 4/4 (1.000)   ·   F1 = 0.800',
        {
            size: 13,
            weight: 600,
            color: c.textSecondary,
            align: 'center',
            mono: true,
        },
    )

    return fig.render()
}

export default create
