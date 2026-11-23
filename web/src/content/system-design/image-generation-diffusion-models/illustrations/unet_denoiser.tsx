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
    'U-Net denoiser architecture with multi-scale hierarchical skip connections. The encoder downsamples noisy latents from 64x64 to 16x16, passing feature maps across horizontal skip connections to the matching decoder resolutions. ResNet blocks integrate timestep embeddings and cross-attention blocks attend to text tokens at every stage.'

export function create(theme: ThemeMode = 'dark') {
    const k = pk(theme),
        a = canvas(k, width, height)

    // Header
    a.text(40, 32, 'U-Net Denoising Backbone: Multi-Scale Skips & Conditioning', {
        size: 22,
        weight: 700,
    })
    a.text(
        40,
        58,
        'Hierarchical feature extraction with horizontal identity skips and cross-attention conditioning',
        { size: 15, color: k.mid },
    )

    // Conditioning Banner at top
    a.rect(40, 85, 780, 50, { fill: tint(k.c.bg, 0.05), stroke: k.line, r: 6 })
    a.cell(56, 98, 85, 24, 'CONDITIONS', {
        fill: tint(k.state, 0.15),
        stroke: tint(k.state, 0.4),
        color: k.state,
        weight: 700,
    })
    a.text(
        155,
        110,
        'Timestep Embedding t: Sinusoidal + MLP -> FiLM / AdaLN scale & shift to all ResNet blocks',
        { size: 15, mono: true, color: k.ink },
    )
    a.text(
        155,
        126,
        'Text Tokens c: CLIP / T5 Embeddings -> Keys & Values (K, V) in all Cross-Attention layers',
        { size: 15, mono: true, color: k.prefill },
    )

    // Left Column: Encoder (Downsampling)
    a.rect(40, 150, 240, 320, { fill: tint(k.decode, 0.03), stroke: tint(k.decode, 0.35), r: 8 })
    a.cell(56, 165, 80, 24, 'ENCODER', {
        fill: tint(k.decode, 0.15),
        stroke: tint(k.decode, 0.4),
        color: k.decode,
        weight: 700,
    })
    a.text(146, 177, 'Downsampling Path', { size: 15, weight: 700 })

    const encoderBlocks = [
        { name: 'Down Block 1', res: '64 × 64 · 320-d', y: 205 },
        { name: 'Down Block 2', res: '32 × 32 · 640-d', y: 285 },
        { name: 'Down Block 3', res: '16 × 16 · 1280-d', y: 365 },
    ]

    encoderBlocks.forEach((b, i) => {
        a.rect(56, b.y, 208, 65, { fill: tint(k.decode, 0.08), stroke: tint(k.decode, 0.25), r: 6 })
        a.text(68, b.y + 24, b.name, { size: 15, weight: 700, color: k.decode })
        a.text(68, b.y + 48, b.res, { size: 15, mono: true, color: k.ink })
        if (i < 2) {
            a.arrow(160, b.y + 65, 160, b.y + 80, k.decode, { width: 1.5 })
        }
    })

    // Center Column: Bottleneck
    a.rect(310, 290, 240, 180, { fill: tint(k.wait, 0.04), stroke: tint(k.wait, 0.35), r: 8 })
    a.cell(326, 305, 100, 24, 'BOTTLENECK', {
        fill: tint(k.wait, 0.15),
        stroke: tint(k.wait, 0.4),
        color: k.wait,
        weight: 700,
    })
    a.text(436, 317, 'Middle Block', { size: 15, weight: 700 })

    a.rect(326, 345, 208, 105, { fill: tint(k.wait, 0.08), stroke: tint(k.wait, 0.3), r: 6 })
    a.text(338, 370, 'Lowest Resolution 16 × 16', { size: 15, weight: 700, color: k.wait })
    a.text(338, 394, 'ResNet + Self-Attn (Global)', { size: 15, color: k.ink })
    a.text(338, 416, 'Cross-Attn (Text Conditioning)', { size: 15, color: k.prefill })
    a.text(338, 436, 'Full receptive field context', { size: 15, color: k.mid })

    // Encoder down to Bottleneck arrow
    a.arrow(264, 400, 326, 400, k.decode, { width: 1.5 })
    // Bottleneck to Decoder arrow
    a.arrow(534, 400, 580, 400, k.wait, { width: 1.5 })

    // Right Column: Decoder (Upsampling)
    a.rect(580, 150, 240, 320, { fill: tint(k.pass, 0.03), stroke: tint(k.pass, 0.35), r: 8 })
    a.cell(596, 165, 80, 24, 'DECODER', {
        fill: tint(k.pass, 0.15),
        stroke: tint(k.pass, 0.4),
        color: k.pass,
        weight: 700,
    })
    a.text(686, 177, 'Upsampling Path', { size: 15, weight: 700 })

    const decoderBlocks = [
        { name: 'Up Block 3', res: '16 × 16 · Concat Skip', y: 365 },
        { name: 'Up Block 2', res: '32 × 32 · Concat Skip', y: 285 },
        { name: 'Up Block 1', res: '64 × 64 · Final Conv', y: 205 },
    ]

    decoderBlocks.forEach((b, i) => {
        a.rect(596, b.y, 208, 65, { fill: tint(k.pass, 0.08), stroke: tint(k.pass, 0.25), r: 6 })
        a.text(608, b.y + 24, b.name, { size: 15, weight: 700, color: k.pass })
        a.text(608, b.y + 48, b.res, { size: 15, mono: true, color: k.ink })
        if (i < 2) {
            a.arrow(700, b.y, 700, b.y - 15, k.pass, { width: 1.5 })
        }
    })

    // Horizontal Skip Connections across Encoder and Decoder
    // Skip 1 (64x64)
    a.line(264, 237, 596, 237, k.state, { width: 1.5, dash: '4,4' })
    a.cell(395, 225, 110, 24, 'SKIP 64×64', {
        fill: tint(k.state, 0.15),
        stroke: tint(k.state, 0.4),
        color: k.state,
        weight: 700,
        mono: true,
    })

    // Skip 2 (32x32)
    a.line(264, 270, 310, 270, k.state, { width: 1.5, dash: '4,4' })
    a.line(550, 270, 596, 270, k.state, { width: 1.5, dash: '4,4' })
    a.path('M 310 270 H 550', k.state, { width: 1.5, dash: '4,4' })
    a.cell(395, 258, 110, 24, 'SKIP 32×32', {
        fill: tint(k.state, 0.15),
        stroke: tint(k.state, 0.4),
        color: k.state,
        weight: 700,
        mono: true,
    })

    return a.render()
}

export default create('dark')
