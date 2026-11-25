import React from 'react'
import type { ThemeMode } from 'vizmatic'
export { createFilm } from './_parts/diffusion-pipeline-film'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 400
export const alt =
    'Latent diffusion inference pipeline: seeded Gaussian noise zT (64x64x4) enters an iterative N-step reverse loop with prompt embeddings c and timestep t, where conditional and unconditional denoiser passes combine via CFG and a DDIM or ODE solver steps to clean latent z0 before an 8x VAE decoder renders the 512x512x3 RGB image.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const c = fig.c
    const purple = fig.tone('purple')
    const blue = fig.tone('blue')
    const warm = fig.tone('warm')
    const green = fig.tone('green')

    fig.text(90, 20, '1. Priors', { size: 15.5, weight: 700, color: purple, align: 'center' })
    fig.text(376, 20, '2. Reverse Loop (N = 20–50)', { size: 15.5, weight: 700, color: blue, align: 'center' })
    fig.text(666, 20, '3. Decode', { size: 15.5, weight: 700, color: green, align: 'center' })

    const card = (
        x: number,
        y: number,
        w: number,
        h: number,
        tone: string,
        title: string,
        sub: string,
        mathTitle?: string,
    ) => {
        fig.rect(x, y, w, h, {
            fill: tint(tone, c.bg, theme === 'light' ? 0.08 : 0.14),
            stroke: tint(tone, c.bg, 0.6),
            strokeWidth: 1.5,
            radius: 8,
        })
        if (mathTitle) {
            fig.math(x + w / 2, y + 22, mathTitle, { size: 15.5, color: tone, align: 'center' })
        } else {
            fig.text(x + w / 2, y + 22, title, { size: 15.5, weight: 700, color: tone, align: 'center' })
        }
        fig.text(x + w / 2, y + 48, sub, { size: 15, mono: true, color: c.textPrimary, align: 'center' })
    }

    card(12, 46, 156, 72, purple, 'Noise zT', '64×64×4', '\\textbf{Noise } z_T')
    card(12, 148, 156, 72, blue, 'Prompt c', 'CLIP / T5')
    card(12, 250, 156, 72, warm, 'Timestep t', 'T → ... → 1')

    fig.rect(206, 42, 340, 304, {
        fill: tint(blue, c.bg, theme === 'light' ? 0.04 : 0.06),
        stroke: tint(blue, c.bg, 0.45),
        strokeWidth: 1.5,
        radius: 12,
    })

    fig.arrow(168, 82, 222, 82, { color: purple, width: 1.75, head: 6 })
    fig.arrow(168, 184, 222, 184, { color: blue, width: 1.75, head: 6 })
    fig.arrow(168, 286, 222, 286, { color: warm, width: 1.75, head: 6 })

    // Denoiser backbone
    fig.rect(224, 58, 304, 118, {
        fill: tint(blue, c.bg, theme === 'light' ? 0.09 : 0.15),
        stroke: blue,
        strokeWidth: 1.75,
        radius: 9,
    })
    fig.text(376, 80, 'Denoiser (U-Net / DiT)', { size: 15.5, weight: 700, color: blue, align: 'center' })

    fig.rect(236, 102, 134, 60, {
        fill: tint(blue, c.bg, theme === 'light' ? 0.12 : 0.2),
        stroke: tint(blue, c.bg, 0.65),
        strokeWidth: 1.25,
        radius: 6,
    })
    fig.math(303, 122, '\\epsilon_\\theta(z_t, c)', { size: 15, color: blue, align: 'center' })
    fig.text(303, 148, 'prompt', { size: 15, color: c.textSecondary, align: 'center' })

    fig.rect(382, 102, 134, 60, {
        fill: tint(purple, c.bg, theme === 'light' ? 0.12 : 0.2),
        stroke: tint(purple, c.bg, 0.65),
        strokeWidth: 1.25,
        radius: 6,
    })
    fig.math(449, 122, '\\epsilon_\\theta(z_t, \\emptyset)', { size: 15, color: purple, align: 'center' })
    fig.text(449, 148, 'null', { size: 15, color: c.textSecondary, align: 'center' })

    fig.arrow(376, 176, 376, 210, { color: blue, width: 1.8, head: 6 })

    // CFG + Solver
    fig.rect(224, 212, 304, 116, {
        fill: tint(green, c.bg, theme === 'light' ? 0.08 : 0.14),
        stroke: green,
        strokeWidth: 1.6,
        radius: 9,
    })
    fig.text(376, 234, 'CFG + ODE Solver', { size: 15.5, weight: 700, color: green, align: 'center' })
    fig.math(376, 268, '\\tilde{\\epsilon} = \\epsilon_\\emptyset + w(\\epsilon_c - \\epsilon_\\emptyset)', {
        size: 15,
        color: c.textPrimary,
        align: 'center',
    })
    fig.math(376, 304, 'z_{t-1} = \\text{step}(z_t, \\tilde{\\epsilon}, t)', {
        size: 15,
        color: c.textSecondary,
        align: 'center',
    })

    // Loopback arrow
    fig.path('M 376 328 V 370 H 186 V 114 H 222', { color: blue, width: 1.75, dash: '5 4' })
    fig.arrow(208, 114, 222, 114, { color: blue, width: 1.75, head: 6 })
    fig.text(376, 386, 'repeat N steps → z₀', { size: 15, mono: true, weight: 700, color: blue, align: 'center' })

    // Exit arrow cleanly horizontally from right edge of loop to VAE
    fig.arrow(546, 82, 586, 82, { color: green, width: 1.9, head: 6.5 })

    card(588, 46, 160, 72, warm, 'Latent z0', '64×64×4', '\\textbf{Latent } z_0')
    fig.arrow(668, 118, 668, 152, { color: warm, width: 1.75, head: 6 })
    card(588, 154, 160, 72, purple, 'VAE Decoder', '8× up (1×)')
    fig.arrow(668, 226, 668, 260, { color: green, width: 1.75, head: 6 })
    card(588, 262, 160, 72, green, 'RGB Image', '512×512×3')

    return fig.render()
}

export default create('dark')
