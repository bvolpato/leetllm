import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 820
export const height = 420
export const alt =
    'Two side-by-side charts showing a beta-VAE sweep on 5x5 patches with 4 latent dimensions. Left: as beta rises from 0.05 to 2.00, KL divergence drops smoothly from 3.80 to 0.00 nats while reconstruction SSE rises from 0.09 to 1.23. Right: active latent dimensions drop from 4 at beta=0.00 to 3 at 0.05, hold at the true 2-factor band across beta 0.10 to 0.50, and collapse to 0 at beta=1.00.'

const betaSweep = ['0.05', '0.10', '0.25', '0.50', '1.00', '2.00'] as const
const klVals = [3.8, 2.69, 1.68, 0.85, 0.0, 0.0] as const
const sseVals = [0.09, 0.13, 0.32, 0.62, 1.22, 1.23] as const

const activeBars = [
    { beta: '0.00', dims: 4, role: 'over' as const },
    { beta: '0.05', dims: 3, role: 'over' as const },
    { beta: '0.10', dims: 2, role: 'sweet' as const },
    { beta: '0.25', dims: 2, role: 'sweet' as const },
    { beta: '0.50', dims: 2, role: 'sweet' as const },
    { beta: '1.00', dims: 0, role: 'collapse' as const },
] as const

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'

    const purple = fig.tone('purple')
    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const red = fig.tone('critical')
    const amberMark = isLight ? '#d07a12' : '#f2b84b'
    const amberText = isLight ? '#9a5204' : '#f2b84b'

    // ── Left: Smooth ELBO Rate-Distortion Curves ────────────────────────────
    fig.text(24, 24, '1. ELBO rate-distortion sweep', {
        size: 20,
        weight: 750,
        color: c.textPrimary,
    })
    fig.text(24, 50, '5×5 patch VAE (z_dim = 4; β = 0 hits KL = 34.6)', {
        size: 16,
        color: c.textSecondary,
    })

    const left = fig.plot(
        { x: 74, y: 84, width: 332, height: 264 },
        { x: [0, 5], y: [0, 4.2] },
    )

    // Shaded 2-factor band beta in [0.10, 0.50] (indices 1..3)
    const b1 = left.px(1)
    const b3 = left.px(3)
    fig.rect(b1, left.area.y, b3 - b1, left.area.height, {
        fill: tint(green, c.bg, isLight ? 0.1 : 0.14),
    })
    fig.text((b1 + b3) / 2, left.area.y + 14, '2-factor band', {
        size: 15,
        color: green,
        align: 'center',
        weight: 650,
    })

    left.axes({
        xTicks: [0, 1, 2, 3, 4, 5],
        yTicks: [0, 1, 2, 3, 4],
        xFormat: (i) => betaSweep[i] ?? '',
        grid: true,
        labelSize: 16,
        xLabel: 'KL weight β',
        yLabel: 'Nats / SSE',
    })

    const klPts = klVals.map((y, i) => [i, y] as const)
    const ssePts = sseVals.map((y, i) => [i, y] as const)

    left.fillArea(ssePts, { fill: amberMark, fillOpacity: 0.15, smooth: true })
    left.smoothCurve(klPts, { color: purple, width: 3.2 })
    left.smoothCurve(ssePts, { color: amberMark, width: 3.2 })

    klPts.forEach(([x, y]) => left.point(x, y, { color: purple, r: 4.5 }))
    ssePts.forEach(([x, y]) => left.point(x, y, { color: amberMark, r: 4.5 }))

    // Direct curve labels (clear of 2-factor band header)
    fig.callout([left.px(0.55), left.py(3.15)], [left.px(1.35), left.py(3.25)], 'KL (nats)', {
        color: purple,
        labelColor: purple,
        size: 17,
        weight: 750,
        bend: -0.1,
        align: 'left',
        head: 5,
    })
    fig.text(left.px(4.95), left.py(1.52), 'Recon SSE', {
        size: 17,
        weight: 750,
        color: amberText,
        align: 'right',
    })
    fig.text(left.px(4.5), left.py(0.32), 'KL → 0', {
        size: 16,
        mono: true,
        weight: 700,
        color: red,
        align: 'center',
    })

    // Vertical divider
    fig.line(430, 20, 430, height - 20, { color: c.borderSubtle, width: 1.25 })

    // ── Right: Active Latent Dimensions by Beta ─────────────────────────────
    fig.text(452, 24, '2. Active latent dims (KL > 0.1)', {
        size: 20,
        weight: 750,
        color: c.textPrimary,
    })
    fig.text(452, 50, 'True patch manifold has 2 factors', {
        size: 16,
        color: c.textSecondary,
    })

    const right = fig.plot(
        { x: 498, y: 84, width: 298, height: 264 },
        { x: [-0.6, 5.6], y: [0, 4.6] },
    )

    // Shaded green sweet-spot band beta in [0.10, 0.50] (indices 2..4)
    const sbLeft = right.px(1.55)
    const sbRight = right.px(4.45)
    fig.rect(sbLeft, right.area.y, sbRight - sbLeft, right.area.height, {
        fill: tint(green, c.bg, isLight ? 0.1 : 0.14),
    })
    fig.text((sbLeft + sbRight) / 2, right.area.y + 14, 'β ∈ [0.10, 0.50]', {
        size: 15,
        mono: true,
        color: green,
        align: 'center',
        weight: 700,
    })

    right.axes({
        xTicks: [0, 1, 2, 3, 4, 5],
        yTicks: [0, 1, 2, 3, 4],
        xFormat: (i) => activeBars[i]?.beta ?? '',
        grid: true,
        labelSize: 16,
        xLabel: 'KL weight β',
        yLabel: 'Active dims',
    })

    // True 2-factor reference line
    right.hline(2, undefined, { color: green, width: 1.5, dash: '5 4', opacity: 0.85 })

    const barW = 30
    activeBars.forEach((b, i) => {
        const cx = right.px(i)
        const baseY = right.py(0)
        const topY = right.py(b.dims)
        const fill = b.role === 'sweet' ? green : b.role === 'collapse' ? red : blue
        if (b.dims > 0) {
            fig.rect(cx - barW / 2, topY, barW, baseY - topY, {
                fill,
                radius: 4,
            })
            fig.text(cx, topY - 14, String(b.dims), {
                size: 17,
                mono: true,
                weight: 750,
                color: fill,
                align: 'center',
            })
        } else {
            // Explicit collapse marker at 0
            fig.rect(cx - barW / 2, baseY - 5, barW, 5, { fill: red, radius: 2 })
            fig.text(cx, baseY - 22, '0', {
                size: 18,
                mono: true,
                weight: 750,
                color: red,
                align: 'center',
            })
            fig.text(cx, baseY - 46, 'collapse', {
                size: 14,
                weight: 700,
                color: red,
                align: 'center',
            })
        }
    })

    return fig.render()
}

export default create('dark')
