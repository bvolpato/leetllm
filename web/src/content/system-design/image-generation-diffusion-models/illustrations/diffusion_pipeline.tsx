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
    'Latent diffusion inference pipeline. Seeded Gaussian noise initializes the latent tensor. Over N denoising steps, the neural backbone predicts noise or velocity conditioned on timestep and text embeddings, guided by classifier-free guidance. A fast numerical solver updates the latent, which is decoded into high-resolution RGB pixels by the VAE decoder.'

export function create(theme: ThemeMode = 'dark') {
    const k = pk(theme),
        a = canvas(k, width, height)

    // Header
    a.text(40, 32, 'Latent Diffusion Inference Pipeline', { size: 22, weight: 700 })
    a.text(
        40,
        58,
        'Iterative reverse diffusion in compressed latent space with conditioning and VAE decoding',
        { size: 15, color: k.mid },
    )

    // Column 1: Inputs
    a.rect(40, 85, 170, 385, { fill: tint(k.c.bg, 0.05), stroke: k.line, r: 8 })
    a.cell(56, 102, 70, 24, 'INPUTS', {
        fill: tint(k.prefill, 0.15),
        stroke: tint(k.prefill, 0.4),
        color: k.prefill,
        weight: 700,
    })
    a.text(134, 114, 'Seeded Priors', { size: 15, weight: 700 })

    a.rect(56, 145, 138, 90, { fill: tint(k.state, 0.08), stroke: tint(k.state, 0.3), r: 6 })
    a.text(68, 168, 'Latent Noise z_T', { size: 15, weight: 700, color: k.state })
    a.text(68, 192, '~ N(0, I)', { size: 15, mono: true, color: k.ink })
    a.text(68, 216, '64 × 64 × 4 channels', { size: 15, color: k.mid })

    a.rect(56, 260, 138, 95, { fill: tint(k.prefill, 0.08), stroke: tint(k.prefill, 0.3), r: 6 })
    a.text(68, 283, 'Text Prompt', { size: 15, weight: 700, color: k.prefill })
    a.text(68, 307, 'CLIP / T5 Encoder', { size: 15, color: k.ink })
    a.text(68, 331, '77 tokens × 768-d', { size: 15, color: k.mid })

    a.rect(56, 375, 138, 75, { fill: tint(k.wait, 0.08), stroke: tint(k.wait, 0.3), r: 6 })
    a.text(68, 398, 'Timestep Schedule', { size: 15, weight: 700, color: k.wait })
    a.text(68, 424, 't in [T, ..., 0] (N steps)', { size: 15, mono: true, color: k.mid })

    // Arrow to Denoiser Loop
    a.arrow(210, 190, 240, 190, k.state, { width: 1.5 })
    a.arrow(210, 307, 240, 307, k.prefill, { width: 1.5 })

    // Column 2: Iterative Denoising Loop Container
    a.rect(240, 85, 390, 385, { fill: tint(k.decode, 0.03), stroke: tint(k.decode, 0.35), r: 8 })
    a.cell(256, 102, 100, 24, 'REVERSE LOOP', {
        fill: tint(k.decode, 0.15),
        stroke: tint(k.decode, 0.4),
        color: k.decode,
        weight: 700,
    })
    a.text(368, 114, 'Iterative Sampling: N = 20-50 Steps', { size: 15, weight: 700 })

    // Sub-block: Denoising Neural Backbone (UNet or DiT)
    a.rect(256, 145, 358, 160, { fill: tint(k.c.bg, 0.08), stroke: k.line, r: 6 })
    a.text(272, 172, 'Denoising Backbone: UNet / DiT', { size: 16, weight: 700, color: k.decode })
    a.text(272, 198, 'Spatial self-attention + cross-attention with text embeddings', {
        size: 15,
        color: k.mid,
    })

    // Two branches inside denoiser
    a.rect(272, 218, 155, 68, { fill: tint(k.prefill, 0.08), stroke: tint(k.prefill, 0.25), r: 4 })
    a.text(282, 238, 'Conditional eps(z_t, c)', {
        size: 15,
        mono: true,
        weight: 600,
        color: k.prefill,
    })
    a.text(282, 262, 'Prompt conditioned', { size: 15, color: k.mid })

    a.rect(443, 218, 155, 68, { fill: tint(k.state, 0.08), stroke: tint(k.state, 0.25), r: 4 })
    a.text(453, 238, 'Unconditional eps(z_t, 0)', {
        size: 15,
        mono: true,
        weight: 600,
        color: k.state,
    })
    a.text(453, 262, 'Null text condition', { size: 15, color: k.mid })

    // Classifier-Free Guidance and Numerical Solver
    a.arrow(435, 305, 435, 330, k.decode, { width: 1.5 })
    a.rect(256, 330, 358, 90, { fill: tint(k.pass, 0.06), stroke: tint(k.pass, 0.3), r: 6 })
    a.text(272, 354, 'Guidance & Numerical Solver (DDIM / DPM-Solver)', {
        size: 15,
        weight: 700,
        color: k.pass,
    })
    a.text(272, 378, 'eps_hat = eps_uncond + w * (eps_cond - eps_uncond)', {
        size: 15,
        mono: true,
        color: k.ink,
    })
    a.text(272, 402, 'z_{t-1} = alpha_t * z_t + sigma_t * eps_hat (deterministic step)', {
        size: 15,
        mono: true,
        color: k.mid,
    })

    // Loopback arrow
    a.path('M 614 375 H 635 V 190 H 614', k.decode, { width: 1.5, dash: '4,4' })
    a.text(640, 275, 'Repeat x N', { size: 15, weight: 700, color: k.decode })

    // Arrow to VAE
    a.arrow(630, 445, 660, 445, k.pass, { width: 1.5 })

    // Column 3: Output & VAE
    a.rect(660, 85, 160, 385, { fill: tint(k.c.bg, 0.05), stroke: k.line, r: 8 })
    a.cell(676, 102, 70, 24, 'OUTPUT', {
        fill: tint(k.pass, 0.15),
        stroke: tint(k.pass, 0.4),
        color: k.pass,
        weight: 700,
    })
    a.text(754, 114, 'Pixels', { size: 15, weight: 700 })

    a.rect(676, 145, 128, 100, { fill: tint(k.wait, 0.08), stroke: tint(k.wait, 0.3), r: 6 })
    a.text(688, 172, 'Clean Latent z_0', { size: 15, weight: 700, color: k.wait })
    a.text(688, 198, 'z_0 = z_final / scaling', { size: 15, mono: true, color: k.ink })
    a.text(688, 224, 'Continuous 64×64×4', { size: 15, color: k.mid })

    a.arrow(740, 245, 740, 275, k.wait, { width: 1.5 })

    a.rect(676, 275, 128, 85, { fill: tint(k.state, 0.08), stroke: tint(k.state, 0.3), r: 6 })
    a.text(688, 300, 'VAE Decoder', { size: 15, weight: 700, color: k.state })
    a.text(688, 326, '8× spatial expansion', { size: 15, color: k.ink })
    a.text(688, 348, 'Conv + Residual up', { size: 15, color: k.mid })

    a.arrow(740, 360, 740, 385, k.pass, { width: 1.5 })

    a.rect(676, 385, 128, 70, { fill: tint(k.pass, 0.08), stroke: tint(k.pass, 0.3), r: 6 })
    a.text(688, 410, 'RGB Image', { size: 15, weight: 700, color: k.pass })
    a.text(688, 436, '512 × 512 × 3 pixels', { size: 15, color: k.mid })

    return a.render()
}

export default create('dark')
