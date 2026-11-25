import type { ThemeMode } from 'vizmatic'
import { Figure, tint, type Plot } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 800
export const height = 452
export const alt =
    'Side-by-side comparison of deterministic autoencoder codes and a variational autoencoder posterior in a 2D latent plane relative to standard normal prior contours: the deterministic autoencoder places isolated points at (-1.8, 1.2) and (1.7, -1.3) leaving (0, 0) empty, whereas the VAE places a posterior centered at mu=[0.4, -0.2] with standard deviation [0.705, 1.051] and draws z=[0.752, -1.251] inside the prior.'

function ellipsePath(plot: Plot, cx: number, cy: number, rx: number, ry: number, steps = 72) {
    const segs: string[] = []
    for (let i = 0; i <= steps; i++) {
        const theta = (i / steps) * Math.PI * 2
        const px = plot.px(cx + rx * Math.cos(theta))
        const py = plot.py(cy + ry * Math.sin(theta))
        segs.push(`${i === 0 ? 'M' : 'L'}${px.toFixed(1)} ${py.toFixed(1)}`)
    }
    return `${segs.join('')}Z`
}

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'

    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const green = fig.tone('green')
    const red = fig.tone('critical')
    const priorStroke = isLight ? '#5f5b52' : '#9ca3af'
    const priorFill = isLight ? '#8b8373' : '#9ca3af'

    const drawPriorRings = (plot: Plot) => {
        // Subtle filled prior density contours + bright dashed rings
        fig.path(ellipsePath(plot, 0, 0, 2, 2), {
            fill: priorFill,
            fillOpacity: isLight ? 0.06 : 0.09,
            color: priorStroke,
            width: 1.5,
            dash: '6 5',
            opacity: 0.75,
        })
        fig.path(ellipsePath(plot, 0, 0, 1, 1), {
            fill: priorFill,
            fillOpacity: isLight ? 0.09 : 0.13,
            color: priorStroke,
            width: 1.8,
            dash: '5 4',
            opacity: 0.9,
        })
        fig.text(plot.px(0), plot.py(1.16), '1σ', {
            size: 15,
            mono: true,
            color: c.textSecondary,
            align: 'center',
            weight: 650,
        })
        fig.text(plot.px(0), plot.py(2.16), '2σ', {
            size: 15,
            mono: true,
            color: c.textSecondary,
            align: 'center',
            weight: 650,
        })
    }

    // ── Left: Deterministic Autoencoder ─────────────────────────────────────
    fig.text(24, 24, 'Deterministic Autoencoder', { size: 21, weight: 750, color: red })
    fig.text(24, 52, 'Codes scatter outside N(0, I) prior', { size: 17, color: c.textSecondary })

    const left = fig.plot(
        { x: 64, y: 86, width: 306, height: 306 },
        { x: [-2.5, 2.5], y: [-2.5, 2.5] },
    )
    left.axes({
        xTicks: [-2, -1, 0, 1, 2],
        yTicks: [-2, -1, 0, 1, 2],
        grid: true,
        labelSize: 16,
        xLabel: 'z₁',
        yLabel: 'z₂',
    })
    drawPriorRings(left)

    // Isolated code points
    left.point(-1.8, 1.2, { color: blue, r: 7 })
    left.point(1.7, -1.3, { color: purple, r: 7 })

    // Dead empty origin (0, 0)
    const ox = left.px(0)
    const oy = left.py(0)
    fig.circle(ox, oy, 7.5, { fill: c.bg, stroke: red, width: 2.4 })
    fig.line(ox - 4, oy - 4, ox + 4, oy + 4, { color: red, width: 2 })
    fig.line(ox + 4, oy - 4, ox - 4, oy + 4, { color: red, width: 2 })

    // Clean direct labels (inside plot bounds, clear of y-axis)
    fig.text(left.px(-1.45), left.py(1.62), '(−1.8, 1.2)', {
        size: 16,
        mono: true,
        weight: 700,
        color: blue,
        align: 'center',
    })
    fig.text(left.px(1.55), left.py(-1.75), '(1.7, −1.3)', {
        size: 16,
        mono: true,
        weight: 700,
        color: purple,
        align: 'center',
    })
    fig.callout([ox - 6, oy + 6], [left.px(-0.65), left.py(-1.45)], 'Empty (0, 0)', {
        color: red,
        labelColor: red,
        size: 17,
        weight: 750,
        bend: 0.16,
        align: 'right',
        head: 5.5,
    })

    // Vertical divider
    fig.line(400, 20, 400, height - 20, { color: c.borderSubtle, width: 1.25 })

    // ── Right: Variational Autoencoder ──────────────────────────────────────
    fig.text(424, 24, 'Variational Autoencoder', { size: 21, weight: 750, color: green })
    fig.text(424, 52, 'KL pulls posterior q(z|x) into N(0, I)', { size: 17, color: c.textSecondary })

    const right = fig.plot(
        { x: 464, y: 86, width: 306, height: 306 },
        { x: [-2.5, 2.5], y: [-2.5, 2.5] },
    )
    right.axes({
        xTicks: [-2, -1, 0, 1, 2],
        yTicks: [-2, -1, 0, 1, 2],
        grid: true,
        labelSize: 16,
        xLabel: 'z₁',
        yLabel: 'z₂',
    })
    drawPriorRings(right)

    // Posterior q(z|x) ellipse: mu=[0.4, -0.2], sigma=[0.705, 1.051]
    fig.path(ellipsePath(right, 0.4, -0.2, 0.705, 1.051), {
        fill: tint(blue, c.bg, isLight ? 0.18 : 0.28),
        color: blue,
        width: 2.5,
    })

    // Sampling arrow from mu to z
    const mux = right.px(0.4)
    const muy = right.py(-0.2)
    const zx = right.px(0.752)
    const zy = right.py(-1.251)
    fig.arrow(mux, muy, zx, zy - 7, { color: green, width: 2.4, head: 6.5 })

    fig.circle(mux, muy, 6.5, { fill: purple, stroke: c.bg, width: 2 })
    fig.circle(zx, zy, 7.5, { fill: green, stroke: c.bg, width: 2 })

    // Crisp direct annotations (clear of axes and prior rings)
    fig.callout(
        [right.px(0.4 - 0.52), right.py(-0.2 + 0.68)],
        [right.px(-0.85), right.py(1.65)],
        'q(z|x)',
        {
            color: blue,
            labelColor: blue,
            size: 18,
            weight: 750,
            bend: -0.14,
            align: 'right',
            head: 5.5,
        },
    )
    fig.callout([mux + 5, muy - 5], [right.px(0.82), right.py(1.38)], 'μ [.40, −.20]', {
        color: purple,
        labelColor: purple,
        size: 14.5,
        mono: true,
        weight: 700,
        bend: 0.16,
        align: 'left',
        head: 5,
    })
    fig.callout([zx - 6, zy + 4], [right.px(0.18), right.py(-2.12)], 'z [.75, −1.25]', {
        color: green,
        labelColor: green,
        size: 15,
        mono: true,
        weight: 750,
        bend: -0.14,
        align: 'right',
        head: 5.5,
    })

    return fig.render()
}

export default create('dark')
