import React from 'react'
import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 400
export const alt =
    'Latent diffusion training pipeline: a frozen VAE compresses a 512x512x3 RGB image by 48x into a 64x64x4 continuous latent z0, closed-form forward noising mixes Gaussian noise eps at random timestep t, and a UNet or DiT denoiser predicts eps_hat conditioned on prompt embeddings c under MSE loss.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const c = fig.c
    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const red = fig.tone('red')

    const box = (x: number, y: number, w: number, h: number, tone: string, title: string, sub: string) => {
        fig.rect(x, y, w, h, {
            fill: tint(tone, c.bg, theme === 'light' ? 0.08 : 0.14),
            stroke: tint(tone, c.bg, 0.65),
            strokeWidth: 1.5,
            radius: 8,
        })
        fig.text(x + w / 2, y + 22, title, { size: 15.5, weight: 700, color: tone, align: 'center' })
        fig.text(x + w / 2, y + 48, sub, { size: 15, mono: true, color: c.textPrimary, align: 'center' })
    }

    fig.text(102, 20, '1. Compress', { size: 15.5, weight: 700, color: purple, align: 'center' })
    fig.text(324, 20, '2. Forward Noise', { size: 15.5, weight: 700, color: warm, align: 'center' })
    fig.text(586, 20, '3. Denoise & Loss', { size: 15.5, weight: 700, color: blue, align: 'center' })

    // Stage 1
    box(14, 46, 176, 68, blue, 'RGB Image x', '512×512×3')
    fig.arrow(102, 114, 102, 146, { color: purple, width: 1.75, head: 6 })
    box(14, 148, 176, 68, purple, 'Frozen VAE Enc', '8× down (48×)')
    fig.arrow(102, 216, 102, 248, { color: green, width: 1.75, head: 6 })
    box(14, 250, 176, 74, green, 'Clean Latent z₀', '64×64×4')

    // Stage 2
    box(232, 46, 184, 68, red, 'Noise ε ~ N(0,I)', 'target noise')
    box(232, 144, 184, 66, warm, 'Timestep t', 'Uniform(1, T)')

    fig.arrow(190, 287, 230, 287, { color: green, width: 1.75, head: 6 })
    fig.arrow(324, 210, 324, 248, { color: warm, width: 1.75, head: 6 })
    fig.path('M 250 114 V 248', { color: red, width: 1.5, dash: '4 3' })
    fig.arrow(250, 234, 250, 248, { color: red, width: 1.5, head: 5.5 })

    fig.rect(232, 250, 184, 74, {
        fill: tint(blue, c.bg, theme === 'light' ? 0.08 : 0.14),
        stroke: blue,
        strokeWidth: 1.6,
        radius: 8,
    })
    fig.text(324, 270, 'Noisy Latent zₜ', { size: 15.5, weight: 700, color: blue, align: 'center' })
    fig.math(324, 302, '\\sqrt{\\bar{\\alpha}_t}z_0 + \\sqrt{1-\\bar{\\alpha}_t}\\epsilon', {
        size: 14.5,
        color: c.textPrimary,
        align: 'center',
    })

    // Stage 3
    box(468, 46, 224, 68, purple, 'Frozen CLIP / T5', 'prompt c (10% null)')
    fig.arrow(580, 114, 580, 146, { color: purple, width: 1.75, head: 6 })

    fig.path('M 416 287 H 442 V 194 H 466', { color: blue, width: 1.75 })
    fig.arrow(454, 194, 466, 194, { color: blue, width: 1.75, head: 6 })
    fig.path('M 416 176 H 466', { color: warm, width: 1.5, dash: '4 3' })
    fig.arrow(454, 176, 466, 176, { color: warm, width: 1.5, head: 5.5 })

    fig.rect(468, 148, 224, 76, {
        fill: tint(blue, c.bg, theme === 'light' ? 0.11 : 0.18),
        stroke: blue,
        strokeWidth: 2,
        radius: 9,
    })
    fig.text(580, 170, 'Denoiser (U-Net/DiT)', { size: 15.5, weight: 700, color: blue, align: 'center' })
    fig.math(580, 202, '\\hat{\\epsilon} = \\epsilon_\\theta(z_t, t, c)', {
        size: 16,
        color: c.textPrimary,
        align: 'center',
    })

    fig.arrow(580, 224, 580, 252, { color: blue, width: 1.8, head: 6 })

    fig.rect(468, 254, 224, 70, {
        fill: tint(red, c.bg, theme === 'light' ? 0.09 : 0.15),
        stroke: red,
        strokeWidth: 1.6,
        radius: 8,
    })
    fig.math(580, 280, '\\mathcal{L} = \\|\\epsilon - \\hat{\\epsilon}\\|^2', {
        size: 16.5,
        color: red,
        align: 'center',
    })
    fig.text(580, 310, 'updates θ only', { size: 15, color: c.textSecondary, align: 'center' })

    // True eps route around right edge
    fig.path('M 416 80 H 444 V 36 H 736 V 289 H 694', { color: red, width: 1.5, dash: '5 4' })
    fig.arrow(706, 289, 694, 289, { color: red, width: 1.5, head: 6 })
    fig.text(722, 162, 'ε', { size: 16, weight: 700, color: red, align: 'center' })

    // Gradient backprop arrow
    fig.path('M 692 272 H 712 V 198 H 694', { color: warm, width: 1.75 })
    fig.arrow(704, 198, 694, 198, { color: warm, width: 1.75, head: 6 })
    fig.text(720, 236, '∇θ', { size: 15.5, weight: 700, color: warm, align: 'center' })

    fig.brace(232, 336, 692, 336, 'Denoiser trains purely in 64×64×4 latent space', {
        side: 1,
        depth: 8,
        labelGap: 16,
        labelSize: 15,
        color: c.textMuted,
        labelColor: c.textSecondary,
    })

    return fig.render()
}

export default create('dark')
