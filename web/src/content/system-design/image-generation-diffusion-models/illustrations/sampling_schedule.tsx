import React from 'react'
import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 365
export const alt =
    'Per-image denoiser network evaluation counts on a log scale across four diffusion sampling strategies: ancestral DDPM (1,000 evals), DDIM with 2-branch CFG (100 evals), DPM-Solver++ with CFG (50 evals), and distilled single-branch flow models (6 evals).'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const c = fig.c
    const red = fig.tone('red')
    const warm = fig.tone('warm')
    const blue = fig.tone('blue')
    const green = fig.tone('green')

    const rows = [
        { name: 'DDPM (ancestral)', detail: '1,000 × 1 branch', evals: 1000, color: red, tag: '' },
        { name: 'DDIM / Euler + CFG', detail: '50 × 2 branches', evals: 100, color: warm, tag: '10× fewer' },
        { name: 'DPM-Solver++ + CFG', detail: '25 × 2 branches', evals: 50, color: blue, tag: '20× fewer' },
        { name: 'Distilled Flow / LCM', detail: '6 × 1 (folded CFG)', evals: 6, color: green, tag: '167× fewer' },
    ]

    const area = { x: 224, y: 24, width: 472, height: 266 }
    const plot = fig.plot(area, { x: [1, 5000], y: [0, 4], xScale: 'log' })

    for (const t of [1, 10, 100, 1000]) {
        const x = plot.px(t)
        fig.line(x, area.y, x, plot.bottom, { color: c.borderSubtle, width: 1, dash: t === 1 ? undefined : '3 4' })
        fig.line(x, plot.bottom, x, plot.bottom + 5, { color: c.textMuted, width: 1 })
        fig.text(x, plot.bottom + 20, t.toLocaleString(), {
            size: 15,
            mono: true,
            color: c.textSecondary,
            align: 'center',
        })
    }
    fig.line(area.x, plot.bottom, area.x + area.width, plot.bottom, { color: c.textMuted, width: 1.2 })
    fig.text(area.x + area.width / 2, plot.bottom + 48, 'Denoiser evaluations per image (log scale)', {
        size: 15.5,
        color: c.textSecondary,
        align: 'center',
    })

    const rowH = area.height / rows.length
    const barH = 30
    rows.forEach((r, idx) => {
        const cy = area.y + idx * rowH + rowH / 2
        const barW = plot.px(r.evals) - area.x

        fig.text(area.x - 14, cy - 10, r.name, { size: 15.5, weight: 700, color: c.textPrimary, align: 'right' })
        fig.text(area.x - 14, cy + 12, r.detail, { size: 15, mono: true, color: c.textSecondary, align: 'right' })

        fig.rect(area.x, cy - barH / 2, area.width, barH, {
            fill: tint(r.color, c.bg, theme === 'light' ? 0.06 : 0.08),
            radius: 5,
        })
        fig.rect(area.x, cy - barH / 2, Math.max(10, barW), barH, { fill: r.color, radius: 5 })

        const labelText = r.tag ? `${r.evals.toLocaleString()} (${r.tag})` : `${r.evals.toLocaleString()} evals`
        fig.text(area.x + barW + 10, cy, labelText, {
            size: 15,
            mono: true,
            weight: 700,
            color: r.color,
            align: 'left',
        })
    })

    return fig.render()
}

export default create('dark')
