import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'
export { createFilm } from './_parts/dpo-displacement-film'

export const width = 720
export const height = 395
export const alt =
    'Side by side, four policy states track chosen and rejected log-probability ratios relative to the SFT reference (left) alongside the resulting pairwise margin bars (right). Chosen moves from 0 to +0.30, -0.15, and -0.60 while rejected drops from 0 to -0.40, -1.20, and -2.10, so the margin climbs from 0.00 to 0.70, 1.05, and 1.50 even after chosen falls below reference.'

const chosen = [0, 0.3, -0.15, -0.6]
const rejected = [0, -0.4, -1.2, -2.1]
const margins = chosen.map((v, i) => Number((v - rejected[i]!).toFixed(2)))

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const green = fig.tone('green')
    const red = fig.tone('critical')
    const purple = fig.tone('purple')
    const muted = c.textSecondary

    const leftArea = { x: 66, y: 62, width: 368, height: 252 }
    const plot = fig.plot(leftArea, { x: [0, 3], y: [-2.4, 0.6] })

    fig.rect(leftArea.x, plot.py(0), leftArea.width, leftArea.y + leftArea.height - plot.py(0), {
        fill: tint(red, c.bg, 0.045),
    })

    plot.axes({
        xTicks: [0, 1, 2, 3],
        yTicks: [-2.0, -1.0, 0.0, 0.5],
        xLabel: 'DPO training state',
        yLabel: 'Log-ratio to reference  log(π_θ / π_ref)',
        grid: true,
        labelSize: 14,
        xFormat: (v) => `S${v}`,
        yFormat: (v) => (v > 0 ? `+${v.toFixed(1)}` : v.toFixed(1)),
    })

    plot.hline(0, 'Ref = 0', {
        color: muted,
        dash: '5 4',
        width: 1.4,
        labelPosition: 'right',
        labelOffset: 12,
        labelSize: 14,
    })

    ;[1, 2, 3].forEach((i) => {
        fig.line(plot.px(i), plot.py(chosen[i]!), plot.px(i), plot.py(rejected[i]!), {
            color: purple,
            width: 2.2,
            opacity: 0.45,
            dash: '3 3',
        })
    })

    plot.curve(
        chosen.map((y, x) => [x, y] as const),
        { color: green, width: 3 },
    )
    plot.curve(
        rejected.map((y, x) => [x, y] as const),
        { color: red, width: 3 },
    )

    chosen.forEach((y, x) => {
        plot.point(x, y, { color: green, r: 5 })
        if (x === 0) return
        const lbl = y > 0 ? `+${y.toFixed(2)}` : `−${Math.abs(y).toFixed(2)}`
        fig.text(
            x === 2 ? plot.px(x) - 10 : plot.px(x),
            plot.py(y) + (x === 2 ? 18 : -18),
            lbl,
            {
                size: 14,
                mono: true,
                weight: 700,
                color: green,
                align: x === 2 ? 'right' : 'center',
            },
        )
    })

    rejected.slice(1).forEach((y, idx) => {
        const x = idx + 1
        plot.point(x, y, { color: red, r: 5 })
        fig.text(
            x === 2 ? plot.px(x) - 8 : plot.px(x),
            plot.py(y) + 20,
            `−${Math.abs(y).toFixed(2)}`,
            {
                size: 14,
                mono: true,
                weight: 700,
                color: red,
                align: x === 2 ? 'right' : 'center',
            },
        )
    })

    fig.text(plot.px(3) - 6, plot.py(-0.6) + 24, 'Chosen y_w', {
        size: 14,
        weight: 700,
        color: green,
        align: 'right',
    })
    fig.text(plot.px(2.55), plot.py(-2.08), 'Rejected y_l', {
        size: 14,
        weight: 700,
        color: red,
        align: 'right',
    })

    fig.line(460, 44, 460, 360, { color: c.borderSubtle, width: 1 })

    const rX = 486
    const rW = 216
    const barTop = 96
    const barBot = 314
    const maxM = 1.6

    fig.text(rX, 44, 'Pairwise margin (Δ)', { size: 15, weight: 700, color: purple })
    fig.text(rX, 68, 'chosen − rejected', { size: 14, color: muted })

    ;[0, 0.5, 1.0, 1.5].forEach((m) => {
        const my = barBot - (m / maxM) * (barBot - barTop)
        fig.line(rX, my, rX + rW, my, {
            color: m === 0 ? c.textMuted : c.borderSubtle,
            width: 1,
            dash: m === 0 ? undefined : '3 3',
        })
    })

    const barW = 38
    const stepX = 54
    margins.forEach((m, i) => {
        const bx = rX + 8 + i * stepX
        const bh = Math.max(3, (m / maxM) * (barBot - barTop))
        fig.rect(bx, barBot - bh, barW, bh, {
            fill: tint(purple, c.bg, 0.36),
            stroke: purple,
            strokeWidth: 1.5,
            radius: 4,
        })
        fig.text(bx + barW / 2, barBot - bh - 16, m.toFixed(2), {
            size: 14,
            mono: true,
            weight: 700,
            color: purple,
            align: 'center',
        })
        fig.text(bx + barW / 2, barBot + 18, `S${i}`, {
            size: 14,
            mono: true,
            color: muted,
            align: 'center',
        })
    })

    fig.text(rX + rW / 2, 358, 'Margin climbs steadily', {
        size: 14,
        weight: 600,
        color: muted,
        align: 'center',
    })

    return fig.render()
}

export default create('dark')
