import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 730
export const height = 405
export const alt =
    'Left: SAE training loss curves over 300 epochs for objective MSE + 5.0 * mean(|z|). Reconstruction MSE plunges from 1.4259 at epoch 0 to 0.2370 at epoch 100, 0.1564 at epoch 200, and 0.128 at epoch 300, while weighted L1 penalty drops from 0.5167 to 0.2931 and 0.2830. Right: before-and-after comparison shows train MSE falling 91% (1.426 to 0.128, held-out FVU 0.169, 19.5/64 active latents) while median best cosine alignment to the 24 true directions stays flat (0.798 to 0.799).'

const msePts: readonly [number, number][] = [
    [0, 1.4259],
    [100, 0.237],
    [200, 0.1564],
    [300, 0.128],
]
const l1Pts: readonly [number, number][] = [
    [0, 0.5167],
    [100, 0.2931],
    [200, 0.283],
]

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const purple = fig.tone('purple')
    const isDark = theme === 'dark'

    // ─── LEFT: Smooth training objective trajectories ───
    fig.text(64, 20, 'Objective: MSE + 5.0 · mean(|z|)', {
        size: 14.5,
        color: c.textPrimary,
        weight: 700,
    })

    const plot = fig.plot({ x: 64, y: 52, width: 378, height: 278 }, { x: [-12, 318], y: [0, 1.62] })

    plot.axes({
        xTicks: [0, 100, 200, 300],
        yTicks: [0, 0.5, 1.0, 1.5],
        yFormat: (v) => v.toFixed(1),
        xLabel: 'Training epoch',
        yLabel: 'Loss term',
        labelSize: 13.5,
        grid: true,
    })

    // Smooth monotone cubic trajectories
    plot.smoothCurve(msePts, { color: green, width: 2.8 })
    plot.smoothCurve(l1Pts, { color: warm, width: 2.6, dash: '6 4' })

    // Direct labels & markers for MSE checkpoints (spaced cleanly away from axes!)
    const mseLabels = [
        { x: 0, y: 1.4259, txt: '1.426', dx: 10, dy: -6, align: 'left' as const },
        { x: 100, y: 0.237, txt: '0.237', dx: -6, dy: 18, align: 'center' as const },
        { x: 200, y: 0.1564, txt: '0.156', dx: 0, dy: 18, align: 'center' as const },
        { x: 300, y: 0.128, txt: '0.128', dx: -2, dy: -16, align: 'right' as const },
    ]
    for (const pt of mseLabels) {
        fig.circle(plot.px(pt.x), plot.py(pt.y), 5.2, { fill: green, stroke: c.bg, width: 1.8 })
        fig.text(plot.px(pt.x) + pt.dx, plot.py(pt.y) + pt.dy, pt.txt, {
            size: 13,
            color: green,
            align: pt.align,
            mono: true,
            weight: 700,
        })
    }

    // Direct labels & markers for λL1 checkpoints
    const l1Labels = [
        { x: 0, y: 0.5167, txt: '0.517', dx: 10, dy: -14, align: 'left' as const },
        { x: 100, y: 0.2931, txt: '0.293', dx: 6, dy: -19, align: 'center' as const },
        { x: 200, y: 0.283, txt: '0.283', dx: 10, dy: -14, align: 'left' as const },
    ]
    for (const pt of l1Labels) {
        fig.circle(plot.px(pt.x), plot.py(pt.y), 4.8, { fill: warm, stroke: c.bg, width: 1.8 })
        fig.text(plot.px(pt.x) + pt.dx, plot.py(pt.y) + pt.dy, pt.txt, {
            size: 13,
            color: warm,
            align: pt.align,
            mono: true,
            weight: 700,
        })
    }

    // Direct legend inside open upper-right space of plot
    fig.line(plot.px(178), plot.py(1.38), plot.px(206), plot.py(1.38), { color: green, width: 2.8 })
    fig.text(plot.px(214), plot.py(1.38), 'Reconstruction MSE', { size: 13.5, color: green, weight: 700 })
    fig.line(plot.px(178), plot.py(1.2), plot.px(206), plot.py(1.2), {
        color: warm,
        width: 2.6,
        dash: '6 4',
    })
    fig.text(plot.px(214), plot.py(1.2), 'Sparsity λL1', { size: 13.5, color: warm, weight: 700 })

    // Vertical divider
    fig.line(466, 24, 466, 376, { color: c.borderSubtle, width: 1 })

    // ─── RIGHT: End-of-run contrast (MSE plunges, alignment stays flat) ───
    const rx = 488
    const rw = 224
    fig.text(rx, 20, 'Epoch 0 → 300 diagnostics', {
        size: 14.5,
        color: c.textPrimary,
        weight: 700,
    })

    // Bar pair 1: Train MSE (1.426 -> 0.128) on 0..1.5 scale
    fig.text(rx, 66, 'Train MSE  (−91%)', { size: 14, color: green, weight: 700 })
    const mseScale = (v: number) => Math.max(6, (v / 1.5) * rw)
    // Epoch 0 bar
    fig.rect(rx, 84, mseScale(1.426), 18, {
        fill: tint(green, c.bg, 0.18),
        stroke: c.borderLight,
        strokeWidth: 1,
        radius: 3,
    })
    fig.text(rx + mseScale(1.426) - 6, 93, 'ep 0: 1.426', {
        size: 12.5,
        color: c.textSecondary,
        align: 'right',
        mono: true,
        weight: 600,
    })
    // Epoch 300 bar
    fig.rect(rx, 108, mseScale(0.128), 20, {
        fill: tint(green, c.bg, isDark ? 0.5 : 0.34),
        stroke: green,
        strokeWidth: 1.7,
        radius: 3,
    })
    fig.text(rx + mseScale(0.128) + 8, 118, 'ep 300: 0.128', {
        size: 13.5,
        color: green,
        mono: true,
        weight: 700,
    })

    // Bar pair 2: Median alignment |cos| to 24 true directions (0.798 -> 0.799) on 0..1.0 scale
    fig.text(rx, 174, 'Median |cos| to 24 true dirs', { size: 14, color: purple, weight: 700 })
    const cosScale = (v: number) => Math.max(6, v * rw)
    // Epoch 0 bar
    fig.rect(rx, 192, cosScale(0.798), 18, {
        fill: tint(purple, c.bg, 0.18),
        stroke: c.borderLight,
        strokeWidth: 1,
        radius: 3,
    })
    fig.text(rx + cosScale(0.798) - 6, 201, 'ep 0: 0.798', {
        size: 12.5,
        color: c.textSecondary,
        align: 'right',
        mono: true,
        weight: 600,
    })
    // Epoch 300 bar
    fig.rect(rx, 216, cosScale(0.799), 20, {
        fill: tint(purple, c.bg, isDark ? 0.46 : 0.3),
        stroke: purple,
        strokeWidth: 1.7,
        radius: 3,
    })
    fig.text(rx + cosScale(0.799) - 6, 226, 'ep 300: 0.799', {
        size: 13,
        color: isDark ? '#ffffff' : c.textPrimary,
        align: 'right',
        mono: true,
        weight: 700,
    })
    fig.text(rx, 252, '+0.001 change · virtually flat', {
        size: 13,
        color: purple,
        weight: 600,
    })

    fig.line(rx, 276, rx + rw, 276, { color: c.borderSubtle, width: 1 })

    // Compact held-out verification readouts
    fig.text(rx, 300, 'Held-out check (ep 300)', { size: 13.5, color: c.textPrimary, weight: 700 })
    fig.text(rx, 324, 'MSE: 0.128  ·  FVU: 0.169', {
        size: 13.5,
        color: c.textSecondary,
        mono: true,
        weight: 600,
    })
    fig.text(rx, 348, 'Active latents (of 64):', {
        size: 13,
        color: c.textSecondary,
        weight: 600,
    })
    fig.text(rx, 368, '18.9 train  ·  19.5 held-out', {
        size: 13,
        color: c.textPrimary,
        mono: true,
        weight: 600,
    })

    return fig.render()
}

export default create('dark')
