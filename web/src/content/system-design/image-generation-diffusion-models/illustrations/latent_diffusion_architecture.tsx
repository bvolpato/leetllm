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
    'Latent diffusion training architecture. A high-resolution image is encoded by a frozen VAE into a compact continuous latent z0. Forward noise is added at a sampled timestep t. The denoiser backbone predicts the injected noise conditioned on text embeddings and timestep, optimized via mean squared error loss against the true noise.'

export function create(theme: ThemeMode = 'dark') {
    const k = pk(theme),
        a = canvas(k, width, height)

    // Header
    a.text(40, 32, 'Latent Diffusion Training Architecture', { size: 22, weight: 700 })
    a.text(
        40,
        58,
        'Closed-form single-step noise injection and conditional denoising score matching',
        { size: 15, color: k.mid },
    )

    // Column 1: VAE Latent Compression
    a.rect(40, 85, 220, 385, { fill: tint(k.c.bg, 0.05), stroke: k.line, r: 8 })
    a.cell(56, 102, 85, 24, 'COMPRESSION', {
        fill: tint(k.state, 0.15),
        stroke: tint(k.state, 0.4),
        color: k.state,
        weight: 700,
    })
    a.text(152, 114, 'Pixel to Latent', { size: 15, weight: 700 })

    a.rect(56, 145, 188, 75, { fill: tint(k.prefill, 0.08), stroke: tint(k.prefill, 0.3), r: 6 })
    a.text(68, 168, 'RGB Image x', { size: 15, weight: 700, color: k.prefill })
    a.text(68, 192, '512 × 512 × 3 (786k values)', { size: 15, color: k.ink })

    a.arrow(150, 220, 150, 245, k.state, { width: 1.5 })

    a.rect(56, 245, 188, 75, { fill: tint(k.state, 0.08), stroke: tint(k.state, 0.3), r: 6 })
    a.text(68, 268, 'Frozen VAE Encoder', { size: 15, weight: 700, color: k.state })
    a.text(68, 292, '8× downsampling · 4 channels', { size: 15, color: k.ink })

    a.arrow(150, 320, 150, 345, k.pass, { width: 1.5 })

    a.rect(56, 345, 188, 110, { fill: tint(k.pass, 0.08), stroke: tint(k.pass, 0.3), r: 6 })
    a.text(68, 368, 'Clean Latent z_0', { size: 15, weight: 700, color: k.pass })
    a.text(68, 392, '64 × 64 × 4 (16k values)', { size: 15, mono: true, color: k.ink })
    a.text(68, 416, '48× data compression', { size: 15, weight: 700, color: k.pass })
    a.text(68, 438, 'Removes perceptual redundancy', { size: 15, color: k.mid })

    // Arrow to Middle: Noise Injection
    a.arrow(244, 400, 280, 400, k.pass, { width: 1.5 })

    // Column 2: Forward Mixing & Conditioning
    a.rect(280, 85, 250, 385, { fill: tint(k.c.bg, 0.05), stroke: k.line, r: 8 })
    a.cell(296, 102, 75, 24, 'NOISING', {
        fill: tint(k.wait, 0.15),
        stroke: tint(k.wait, 0.4),
        color: k.wait,
        weight: 700,
    })
    a.text(380, 114, 'Forward Synthesis', { size: 15, weight: 700 })

    a.rect(296, 145, 218, 80, { fill: tint(k.fail, 0.08), stroke: tint(k.fail, 0.3), r: 6 })
    a.text(308, 168, 'Gaussian Noise eps', { size: 15, weight: 700, color: k.fail })
    a.text(308, 192, 'eps ~ N(0, I)', { size: 15, mono: true, color: k.ink })
    a.text(308, 214, 'Known training target', { size: 15, color: k.mid })

    a.rect(296, 235, 218, 70, { fill: tint(k.wait, 0.08), stroke: tint(k.wait, 0.3), r: 6 })
    a.text(308, 258, 'Timestep Sample t', { size: 15, weight: 700, color: k.wait })
    a.text(308, 282, 't ~ Uniform({1, ..., T})', { size: 15, mono: true, color: k.ink })

    a.arrow(405, 305, 405, 335, k.wait, { width: 1.5 })

    a.rect(296, 335, 218, 120, { fill: tint(k.decode, 0.08), stroke: tint(k.decode, 0.3), r: 6 })
    a.text(308, 358, 'Noisy Latent z_t', { size: 15, weight: 700, color: k.decode })
    a.text(308, 382, 'z_t = sqrt(a_t)*z_0 + sqrt(1-a_t)*eps', {
        size: 15,
        mono: true,
        color: k.ink,
    })
    a.text(308, 406, 'Direct single-step computation', { size: 15, color: k.mid })
    a.text(308, 430, 'No Markov simulation needed', { size: 15, color: k.mid })

    // Arrow to Denoiser
    a.arrow(514, 395, 550, 395, k.decode, { width: 1.5 })

    // Column 3: Denoiser & Loss
    a.rect(550, 85, 270, 385, { fill: tint(k.c.bg, 0.05), stroke: k.line, r: 8 })
    a.cell(566, 102, 90, 24, 'BACKBONE', {
        fill: tint(k.decode, 0.15),
        stroke: tint(k.decode, 0.4),
        color: k.decode,
        weight: 700,
    })
    a.text(666, 114, 'Denoiser & Loss', { size: 15, weight: 700 })

    a.rect(566, 145, 238, 80, { fill: tint(k.prefill, 0.08), stroke: tint(k.prefill, 0.3), r: 6 })
    a.text(578, 168, 'Prompt Conditioning c', { size: 15, weight: 700, color: k.prefill })
    a.text(578, 192, 'Text tokens via Cross-Attention', { size: 15, color: k.ink })
    a.text(578, 214, 'Unconditional dropout (10%)', { size: 15, color: k.mid })

    a.arrow(685, 225, 685, 245, k.prefill, { width: 1.5 })

    a.rect(566, 245, 238, 110, { fill: tint(k.decode, 0.08), stroke: tint(k.decode, 0.3), r: 6 })
    a.text(578, 268, 'Denoiser: eps_theta(z_t, t, c)', { size: 15, weight: 700, color: k.decode })
    a.text(578, 292, 'UNet / DiT Transformer', { size: 15, color: k.ink })
    a.text(578, 316, 'Learns score / noise residual', { size: 15, color: k.mid })
    a.text(578, 338, 'Predicts eps_hat', { size: 15, mono: true, weight: 700, color: k.decode })

    a.arrow(685, 355, 685, 375, k.decode, { width: 1.5 })

    // Loss calculation
    a.rect(566, 375, 238, 80, { fill: tint(k.fail, 0.08), stroke: tint(k.fail, 0.35), r: 6 })
    a.text(578, 398, 'MSE Loss: || eps - eps_hat ||^2', {
        size: 15,
        weight: 700,
        mono: true,
        color: k.fail,
    })
    a.text(578, 422, 'Gradient backpropagates to denoiser', { size: 15, color: k.ink })
    a.text(578, 442, 'VAE and text encoder stay frozen', { size: 15, color: k.mid })

    // Dashed line from true noise to loss
    a.path('M 480 145 H 700 V 375', k.fail, { width: 1.25, dash: '4,4' })

    return a.render()
}

export default create('dark')
