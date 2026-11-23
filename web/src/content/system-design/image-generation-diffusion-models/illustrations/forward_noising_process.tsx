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
    'Forward variance-preserving diffusion process across four stages. Moving from clean image x0 at t=0 to pure Gaussian noise xT at t=1000. Signal coefficient sqrt(alpha_bar_t) diminishes from 1.0 to 0.032 while noise coefficient sqrt(1 - alpha_bar_t) rises from 0.0 to 0.999.'

export function create(theme: ThemeMode = 'dark') {
    const k = pk(theme),
        a = canvas(k, width, height)

    // Header
    a.text(40, 32, 'Variance-Preserving Forward Diffusion Process', { size: 22, weight: 700 })
    a.text(
        40,
        58,
        'q(x_t | x_0) = N(x_t; sqrt(alpha_bar_t) * x_0, (1 - alpha_bar_t) * I) across discrete time steps',
        { size: 15, mono: true, color: k.mid },
    )

    // Four horizontal columns for the stages
    const stages = [
        {
            t: 't = 0',
            name: 'Original Clean x_0',
            alpha: '1.000',
            sig: '1.000',
            noise: '0.000',
            snr: '+inf dB',
            tone: k.pass,
            desc: 'Pure signal · Zero noise',
        },
        {
            t: 't = 250',
            name: 'Early Noising',
            alpha: '0.900',
            sig: '0.949',
            noise: '0.316',
            snr: '+9.54 dB',
            tone: k.prefill,
            desc: 'High SNR · Coarse edges intact',
        },
        {
            t: 't = 500',
            name: 'Midway Pivot',
            alpha: '0.500',
            sig: '0.707',
            noise: '0.707',
            snr: '0.0 dB',
            tone: k.wait,
            desc: 'Equal variance partition',
        },
        {
            t: 't = 1000',
            name: 'Terminal Prior x_T',
            alpha: '0.001',
            sig: '0.032',
            noise: '0.999',
            snr: '-29.99 dB',
            tone: k.fail,
            desc: 'Isotropic Gaussian N(0, I)',
        },
    ]

    const cardW = 180
    const startX = 40
    const gap = 16

    stages.forEach((st, i) => {
        const x = startX + i * (cardW + gap)

        // Stage Card
        a.rect(x, 85, cardW, 260, { fill: tint(st.tone, 0.05), stroke: tint(st.tone, 0.35), r: 8 })

        // Header pill
        a.cell(x + 12, 100, 60, 22, st.t, {
            fill: tint(st.tone, 0.15),
            stroke: tint(st.tone, 0.4),
            color: st.tone,
            weight: 700,
            mono: true,
        })
        a.text(x + 80, 111, st.name, { size: 15, weight: 600 })

        // Schematic visual grid of image/noise
        const gridX = x + (cardW - 80) / 2
        const gridY = 135
        a.rect(gridX, gridY, 80, 80, { fill: tint(k.c.bg, 0.2), stroke: k.line, r: 4 })

        // Render mock 4x4 patch grid reflecting noise level
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                const cellX = gridX + c * 20
                const cellY = gridY + r * 20
                let cellTone = st.tone
                let opacity = 0.8
                if (i === 0) {
                    opacity = (r === 1 || r === 2) && (c === 1 || c === 2) ? 0.9 : 0.3
                } else if (i === 1) {
                    opacity = (r + c) % 2 === 0 ? 0.7 : 0.3
                } else if (i === 2) {
                    opacity = ((r * 2 + c * 3) % 5) / 5
                } else {
                    opacity = ((r * 7 + c * 11) % 7) / 7
                }
                a.rect(cellX + 2, cellY + 2, 16, 16, {
                    fill: tint(cellTone, Math.max(0.1, opacity * 0.7)),
                    r: 2,
                })
            }
        }

        // Metrics inside card
        a.text(x + 12, 235, `alpha_bar = ${st.alpha}`, { size: 15, mono: true, weight: 700 })
        a.text(x + 12, 258, `Signal: ${st.sig}`, { size: 15, mono: true, color: k.pass })
        a.text(x + 12, 280, `Noise:  ${st.noise}`, { size: 15, mono: true, color: k.fail })
        a.text(x + 12, 302, `SNR:    ${st.snr}`, { size: 15, mono: true, color: k.mid })
        a.text(x + 12, 326, st.desc, { size: 15, color: k.mid })

        // Connecting arrow between stages
        if (i < stages.length - 1) {
            const nextX = startX + (i + 1) * (cardW + gap)
            a.arrow(x + cardW + 2, 215, nextX - 2, 215, k.line, { width: 1.5 })
        }
    })

    // Bottom explanation panel: Math & Key Invariant
    a.rect(40, 360, 770, 110, { fill: tint(k.c.bg, 0.05), stroke: k.line, r: 8 })
    a.cell(56, 376, 110, 24, 'KEY INVARIANT', {
        fill: tint(k.state, 0.15),
        stroke: tint(k.state, 0.4),
        color: k.state,
        weight: 700,
    })
    a.text(
        180,
        388,
        'Variance Preservation: (sqrt(alpha_bar_t))^2 + (sqrt(1 - alpha_bar_t))^2 = 1.0',
        { size: 16, weight: 700, mono: true },
    )
    a.text(
        56,
        420,
        'Direct Sampling Trick: Any arbitrary noisy state x_t can be sampled in a single closed-form step without simulating intermediate steps:',
        { size: 15, color: k.mid },
    )
    a.text(
        56,
        444,
        'x_t = sqrt(alpha_bar_t) * x_0 + sqrt(1 - alpha_bar_t) * eps,   where eps ~ N(0, I)',
        { size: 15, mono: true, weight: 700, color: k.ink },
    )

    return a.render()
}

export default create('dark')
