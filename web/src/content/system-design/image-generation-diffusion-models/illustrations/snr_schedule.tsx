import React from 'react'
import type { ThemeMode } from 'vizmatic'
import {
    canvas,
    pk,
    tint,
} from '../../../fundamentals/inference-mechanics-ttft-tps-kv-cache/serving-figure-kit'

export const width = 860
export const height = 500
export const alt =
    'Signal and noise mixing coefficients across diffusion timesteps. The signal coefficient sqrt(alpha_bar) declines from 1.0 to 0.0 as time progresses forward, while the noise coefficient sqrt(1 - alpha_bar) rises from 0.0 to 1.0. Checkpoints highlight high-SNR structure, the 50 percent variance crossover, and the noise-dominated prior.'

export function create(theme: ThemeMode = 'dark') {
    const k = pk(theme),
        a = canvas(k, width, height)

    // Header
    a.text(40, 32, 'Signal-to-Noise Ratio (SNR) & Noise Schedules', { size: 22, weight: 700 })
    a.text(
        40,
        58,
        'Variance-preserving amplitudes: signal sqrt(alpha_bar_t) vs noise sqrt(1 - alpha_bar_t)',
        { size: 15, mono: true, color: k.mid },
    )

    // Main Chart Box (Left/Center)
    const chartLeft = 80
    const chartTop = 110
    const chartWidth = 440
    const chartHeight = 310

    // Axes
    a.rect(chartLeft, chartTop, chartWidth, chartHeight, {
        fill: tint(k.c.bg, 0.05),
        stroke: k.line,
        r: 6,
    })

    // Gridlines (horizontal)
    for (let i = 0; i <= 4; i++) {
        const y = chartTop + (i / 4) * chartHeight
        const val = (1 - i / 4).toFixed(2)
        a.line(chartLeft, y, chartLeft + chartWidth, y, k.line, { dash: '2,3' })
        a.text(chartLeft - 10, y, val, { size: 15, mono: true, align: 'right', color: k.mid })
    }

    // Gridlines (vertical)
    const tCheckpoints = [
        { t: 0, label: '0' },
        { t: 250, label: '250' },
        { t: 500, label: '500' },
        { t: 750, label: '750' },
        { t: 1000, label: '1000' },
    ]
    tCheckpoints.forEach((cp) => {
        const x = chartLeft + (cp.t / 1000) * chartWidth
        a.line(x, chartTop, x, chartTop + chartHeight, k.line, { dash: '2,3' })
        a.text(x, chartTop + chartHeight + 18, cp.label, {
            size: 15,
            mono: true,
            align: 'center',
            color: k.mid,
        })
    })

    // X-axis and Y-axis labels
    a.text(
        chartLeft + chartWidth / 2,
        chartTop + chartHeight + 42,
        'Timestep t (Forward Process ->)',
        { size: 15, weight: 600, align: 'center' },
    )
    a.text(chartLeft - 45, chartTop - 12, 'Amplitude', { size: 15, weight: 600 })

    // Draw Smooth Paths for Signal and Noise curves
    // Cosine or linear schedule mapping:
    let sigD = `M ${chartLeft} ${chartTop}`
    let noiseD = `M ${chartLeft} ${chartTop + chartHeight}`
    const steps = 40
    for (let i = 1; i <= steps; i++) {
        const progress = i / steps
        const t = progress
        // Alpha_bar roughly drops as cosine schedule: cos((t + 0.008)/(1.008) * pi/2)^2
        const alphaBar = Math.cos(((t + 0.008) / 1.008) * (Math.PI / 2)) ** 2
        const sig = Math.sqrt(Math.max(0, alphaBar))
        const noise = Math.sqrt(Math.max(0, 1 - alphaBar))

        const px = chartLeft + progress * chartWidth
        const pySig = chartTop + (1 - sig) * chartHeight
        const pyNoise = chartTop + (1 - noise) * chartHeight

        sigD += ` L ${px.toFixed(1)} ${pySig.toFixed(1)}`
        noiseD += ` L ${px.toFixed(1)} ${pyNoise.toFixed(1)}`
    }

    a.path(sigD, k.pass, { width: 2.5 })
    a.path(noiseD, k.fail, { width: 2.5 })

    // Crossover Dot (at ~t=500, alpha_bar=0.5 -> sig=0.707, noise=0.707)
    const crossX = chartLeft + 0.5 * chartWidth
    const crossY = chartTop + (1 - 0.707) * chartHeight
    a.dot(crossX, crossY, 6, k.wait, { stroke: k.c.bg, width: 2 })
    a.text(crossX + 10, crossY - 12, 'Crossover: SNR = 1.0 (0 dB)', {
        size: 15,
        weight: 700,
        color: k.wait,
    })

    // Legend on top-right of chart
    a.cell(chartLeft + 20, chartTop + 20, 150, 24, 'Signal: sqrt(alpha_bar)', {
        fill: tint(k.pass, 0.15),
        stroke: tint(k.pass, 0.4),
        color: k.pass,
        weight: 700,
    })
    a.cell(chartLeft + 180, chartTop + 20, 150, 24, 'Noise: sqrt(1-alpha_bar)', {
        fill: tint(k.fail, 0.15),
        stroke: tint(k.fail, 0.4),
        color: k.fail,
        weight: 700,
    })

    // Right Column: Key Checkpoints & Physical Intuition
    a.rect(550, 110, 270, 310, { fill: tint(k.c.bg, 0.05), stroke: k.line, r: 8 })
    a.cell(566, 126, 120, 24, 'REGIMES', {
        fill: tint(k.prefill, 0.15),
        stroke: tint(k.prefill, 0.4),
        color: k.prefill,
        weight: 700,
    })
    a.text(696, 138, 'Diffusion Phases', { size: 15, weight: 700 })

    const regimes = [
        {
            title: 'Early (t ~ 0-200)',
            desc: 'High SNR (> 10 dB). Fine textures, micro-contrast, high-frequency details resolved.',
            tone: k.pass,
            y: 165,
        },
        {
            title: 'Midway (t ~ 300-600)',
            desc: 'SNR ~ 0 dB. Geometric contours, object identity, and semantic composition emerge.',
            tone: k.wait,
            y: 245,
        },
        {
            title: 'Terminal (t ~ 700-1000)',
            desc: 'Low SNR (< -15 dB). Pure noise. Global color distribution and broad layout decided.',
            tone: k.fail,
            y: 325,
        },
    ]

    regimes.forEach((r) => {
        a.rect(566, r.y, 238, 70, { fill: tint(r.tone, 0.06), stroke: tint(r.tone, 0.25), r: 6 })
        a.text(578, r.y + 20, r.title, { size: 15, weight: 700, color: r.tone })
        a.text(578, r.y + 44, r.desc, { size: 15, color: k.mid, w: 220 })
    })

    return a.render()
}

export default create('dark')
