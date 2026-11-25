import React from 'react'
import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 410
export const alt =
    'Classifier-free guidance extrapolation in score space paired with guided vector norms. Starting from unconditional prediction w = 0, extrapolating along the prompt delta to w = 4.0-7.5 sharpens prompt alignment, while w >= 12 explodes norm and clips colors.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const c = fig.c
    const purple = fig.tone('purple')
    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const red = fig.tone('red')

    fig.math(
        width / 2,
        24,
        '\\tilde{\\epsilon}_\\theta = \\epsilon_\\theta(x_t,\\emptyset) + w\\,(\\epsilon_\\theta(x_t,c) - \\epsilon_\\theta(x_t,\\emptyset))',
        { size: 16.5, color: c.textPrimary, align: 'center' },
    )

    const area = { x: 42, y: 66, width: 438, height: 294 }
    const plot = fig.plot(area, { x: [0, 8], y: [0, 5.2] })

    for (let gx = 1; gx <= 7; gx++) {
        fig.line(plot.px(gx), area.y, plot.px(gx), plot.bottom, { color: c.borderSubtle, width: 0.75, opacity: 0.6 })
    }
    for (let gy = 1; gy <= 5; gy++) {
        fig.line(area.x, plot.py(gy), plot.right, plot.py(gy), { color: c.borderSubtle, width: 0.75, opacity: 0.6 })
    }
    fig.arrow(area.x, plot.bottom, plot.right + 8, plot.bottom, { color: c.textMuted, width: 1.25, head: 6 })
    fig.arrow(area.x, plot.bottom, area.x, area.y - 8, { color: c.textMuted, width: 1.25, head: 6 })
    fig.text(plot.right, plot.bottom + 22, 'Score dim 1', { size: 15, color: c.textSecondary, align: 'right' })
    fig.text(area.x + 8, area.y - 12, 'Score dim 2', { size: 15, color: c.textSecondary, align: 'left' })

    const u: [number, number] = [1.15, 0.85]
    const d: [number, number] = [0.8, 0.5]
    const pt = (w: number): [number, number] => [u[0] + w * d[0], u[1] + w * d[1]]
    const p0 = pt(0)
    const p1 = pt(1)
    const p4 = pt(3.5)
    const p75 = pt(5.3)
    const p12 = pt(7.5)

    fig.line(plot.px(p4[0]), plot.py(p4[1]), plot.px(p75[0]), plot.py(p75[1]), {
        color: green,
        width: 14,
        opacity: theme === 'light' ? 0.22 : 0.24,
        cap: 'round',
    })

    fig.arrow(plot.px(0), plot.py(0), plot.px(p0[0]), plot.py(p0[1]), { color: purple, width: 2.2, head: 7 })
    fig.arrow(plot.px(p0[0]), plot.py(p0[1]), plot.px(p1[0]), plot.py(p1[1]), { color: blue, width: 2.4, head: 7 })
    fig.arrow(plot.px(p1[0]), plot.py(p1[1]), plot.px(p75[0]), plot.py(p75[1]), { color: green, width: 2.6, head: 7.5 })
    fig.arrow(plot.px(p75[0]), plot.py(p75[1]), plot.px(p12[0]), plot.py(p12[1]), {
        color: red,
        width: 2.2,
        dash: '5 4',
        head: 7,
    })

    plot.point(p0[0], p0[1], { color: purple, r: 5 })
    plot.point(p1[0], p1[1], { color: blue, r: 5 })
    plot.point(p4[0], p4[1], { color: green, r: 5 })
    plot.point(p75[0], p75[1], { color: green, r: 5.5 })
    plot.point(p12[0], p12[1], { color: red, r: 5.5 })

    fig.math(plot.px(p0[0]) + 10, plot.py(p0[1]) + 18, '\\epsilon_\\emptyset\\;(w=0)', {
        size: 15,
        color: purple,
        align: 'left',
    })
    fig.math(plot.px(p1[0]) + 14, plot.py(p1[1]) + 18, '\\epsilon_c\\;(w=1)', {
        size: 15,
        color: blue,
        align: 'left',
    })
    fig.callout([plot.px(4.5), plot.py(3.05)], [plot.px(2.4), plot.py(3.85)], 'Sweet spot: w = 4–7.5', {
        color: green,
        labelColor: green,
        size: 15.5,
        weight: 700,
        align: 'center',
        bend: -0.14,
    })
    fig.callout([plot.px(p12[0]) - 6, plot.py(p12[1]) - 8], [plot.px(5.1), plot.py(4.9)], 'w ≥ 12: clipping', {
        color: red,
        labelColor: red,
        size: 15.5,
        weight: 700,
        align: 'right',
        bend: 0.12,
    })

    // Right: Guided Vector Norm Scaling
    const rx = 520
    const rw = 222
    fig.text(rx, 72, 'Guided Vector Norm', { size: 16, weight: 700, color: c.textPrimary })
    const rows = [
        { w: 'w = 0.0', norm: 0.229, note: 'null', color: purple },
        { w: 'w = 1.0', norm: 0.406, note: 'cond', color: blue },
        { w: 'w = 7.5', norm: 2.477, note: 'ideal', color: green },
        { w: 'w = 15', norm: 4.931, note: 'clips', color: red },
    ]
    const maxNorm = 5.2
    rows.forEach((r, idx) => {
        const y = 114 + idx * 66
        fig.text(rx, y, r.w, { size: 15.5, weight: 700, mono: true, color: r.color })
        fig.text(rx + rw, y, `${r.norm.toFixed(2)} (${r.note})`, {
            size: 15,
            mono: true,
            color: c.textSecondary,
            align: 'right',
        })
        const barY = y + 18
        fig.rect(rx, barY, rw, 18, { fill: tint(c.borderSubtle, c.bg, theme === 'light' ? 0.55 : 0.45), radius: 4 })
        fig.rect(rx, barY, Math.max(8, (r.norm / maxNorm) * rw), 18, { fill: r.color, radius: 4 })
    })

    return fig.render()
}

export default create('dark')
