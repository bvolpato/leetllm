import React from 'react'
import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 420
export const alt =
    'Variance-preserving signal and noise amplitudes across diffusion timesteps under a cosine schedule. Signal amplitude sqrt(alpha_bar) declines smoothly from 1.00 to 0.03 while noise amplitude sqrt(1 - alpha_bar) rises from 0.00 to 1.00, crossing at t = 500 where alpha_bar = 0.5 and SNR = 1.0. Shaded bands mark high-SNR detail, midway structure, and low-SNR global layout regimes.'

function cosineAlphaBar(tNorm: number): number {
    const c = Math.cos(((tNorm + 0.008) / 1.008) * (Math.PI / 2))
    return Math.max(0.001, Math.min(1, c * c))
}

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const c = fig.c
    const green = fig.tone('green')
    const red = fig.tone('red')
    const warm = fig.tone('warm')

    const area = { x: 76, y: 74, width: 650, height: 274 }
    const plot = fig.plot(area, { x: [0, 1000], y: [0, 1.05] })

    // Subtle regime bands behind the curves
    const bands = [
        { x0: 0, x1: 250, label: 'High SNR', sub: 'fine detail', color: green },
        { x0: 250, x1: 680, label: 'Midway (~0 dB)', sub: 'contours & objects', color: warm },
        { x0: 680, x1: 1000, label: 'Low SNR', sub: 'global layout', color: red },
    ]
    for (const b of bands) {
        const bx = plot.px(b.x0)
        const bw = plot.px(b.x1) - bx
        fig.rect(bx, area.y, bw, area.height, {
            fill: tint(b.color, c.bg, theme === 'light' ? 0.07 : 0.09),
        })
        fig.text(bx + bw / 2, 22, b.label, {
            size: 15.5,
            weight: 700,
            color: b.color,
            align: 'center',
        })
        fig.text(bx + bw / 2, 44, b.sub, {
            size: 15,
            color: c.textSecondary,
            align: 'center',
        })
    }

    for (const x of [250, 680]) {
        fig.line(plot.px(x), area.y, plot.px(x), plot.bottom, {
            color: c.borderSubtle,
            width: 1,
            dash: '3 4',
        })
    }

    plot.axes({
        xTicks: [0, 250, 500, 750, 1000],
        yTicks: [0, 0.25, 0.5, 0.75, 1],
        yFormat: (v) => v.toFixed(2),
        xLabel: 'Timestep t (forward corruption)',
        grid: true,
        labelSize: 15,
    })

    const sigPts: [number, number][] = []
    const noiPts: [number, number][] = []
    for (let i = 0; i <= 60; i++) {
        const t = (i / 60) * 1000
        const ab = cosineAlphaBar(t / 1000)
        sigPts.push([t, Math.sqrt(ab)])
        noiPts.push([t, Math.sqrt(1 - ab)])
    }

    plot.fillArea(sigPts, { fill: green, fillOpacity: theme === 'light' ? 0.09 : 0.1, smooth: true })
    plot.fillArea(noiPts, { fill: red, fillOpacity: theme === 'light' ? 0.08 : 0.09, smooth: true })
    plot.smoothCurve(sigPts, { color: green, width: 2.8 })
    plot.smoothCurve(noiPts, { color: red, width: 2.8 })

    // Crossover dot & cleanly separated callout
    const crossT = 496
    const crossY = Math.SQRT1_2
    fig.line(plot.px(crossT), plot.py(crossY), plot.px(crossT), plot.bottom, {
        color: warm,
        width: 1.5,
        dash: '4 4',
    })
    plot.point(crossT, crossY, { color: warm, r: 5.5 })
    fig.callout([plot.px(crossT), plot.py(crossY) - 8], [plot.px(500), plot.py(0.96)], 'SNR = 1.0 (ᾱ = 0.5)', {
        color: warm,
        labelColor: warm,
        size: 15.5,
        weight: 700,
        align: 'center',
        bend: 0,
    })

    // Direct curve labels well separated from crossover
    fig.math(plot.px(120), plot.py(0.84), '\\text{Signal }\\sqrt{\\bar{\\alpha}_t}', {
        size: 16,
        color: green,
        align: 'left',
    })
    fig.math(plot.px(835), plot.py(0.84), '\\text{Noise }\\sqrt{1-\\bar{\\alpha}_t}', {
        size: 16,
        color: red,
        align: 'center',
    })

    return fig.render()
}

export default create('dark')
