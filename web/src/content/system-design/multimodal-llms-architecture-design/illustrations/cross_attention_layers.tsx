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
    'Gated cross-attention architecture in multimodal language models. Text states pass through standard autoregressive transformer layers while periodically querying an external visual memory bank through learned cross-attention. A tanh(alpha) gating factor initialized at zero ensures stable fine-tuning while keeping visual tokens out of the primary text key-value cache.'

export function create(theme: ThemeMode = 'dark') {
    const k = pk(theme),
        a = canvas(k, width, height)

    // Header
    a.text(40, 32, 'Gated Cross-Attention: External Visual Memory Access', {
        size: 22,
        weight: 700,
    })
    a.text(
        40,
        58,
        'Decoupling visual features from the text KV-cache using gated attention layers (Flamingo-style)',
        { size: 15, color: k.mid },
    )

    // Column 1: Visual Memory Bank (Left)
    a.rect(40, 85, 220, 385, { fill: tint(k.c.bg, 0.05), stroke: k.line, r: 8 })
    a.cell(56, 102, 140, 24, 'EXTERNAL MEMORY', {
        fill: tint(k.decode, 0.15),
        stroke: tint(k.decode, 0.4),
        color: k.decode,
        weight: 700,
    })
    a.text(56, 148, 'Visual Latent Bank', { size: 16, weight: 700, color: k.prefill })

    a.rect(56, 168, 188, 70, { fill: tint(k.prefill, 0.08), stroke: tint(k.prefill, 0.3), r: 6 })
    a.text(68, 192, 'Vision Encoder (ViT)', { size: 15, weight: 700, color: k.prefill })
    a.text(68, 218, 'Produces N patch tokens', { size: 15, color: k.mid })

    a.arrow(150, 238, 150, 260, k.prefill, { width: 1.5 })

    a.rect(56, 260, 188, 90, { fill: tint(k.prefill, 0.12), stroke: tint(k.prefill, 0.4), r: 6 })
    a.text(68, 282, 'Perceiver Resampler', { size: 15, weight: 700, color: k.prefill })
    a.text(68, 306, 'Compresses to M latents', { size: 15, color: k.mid })
    a.text(68, 330, 'Keys (K_v) & Values (V_v)', { size: 15, weight: 600, color: k.prefill })

    a.rect(56, 365, 188, 85, { fill: tint(k.c.bg, 0.1), stroke: k.line, r: 6 })
    a.text(68, 392, 'Static Latent Store', { size: 15, weight: 600 })
    a.text(68, 418, 'Revisitable across turns', { size: 15, color: k.mid })

    // Column 2: Transformer Block with Cross-Attention (Center)
    a.rect(285, 85, 305, 385, { fill: tint(k.c.bg, 0.05), stroke: k.line, r: 8 })
    a.cell(301, 102, 120, 24, 'FUSION BLOCK', {
        fill: tint(k.pass, 0.15),
        stroke: tint(k.pass, 0.4),
        color: k.pass,
        weight: 700,
    })
    a.text(301, 148, 'Gated Transformer Layer', { size: 16, weight: 700, color: k.pass })

    // Input text state
    a.rect(301, 168, 273, 44, { fill: tint(k.pass, 0.08), stroke: tint(k.pass, 0.3), r: 4 })
    a.text(313, 190, 'Text State h_text (Queries Q)', { size: 15, weight: 600, color: k.pass })

    a.arrow(435, 212, 435, 230, k.pass, { width: 1.5 })

    // Gated cross attention box
    a.rect(301, 230, 273, 95, { fill: tint(k.prefill, 0.1), stroke: tint(k.prefill, 0.4), r: 6 })
    a.text(313, 252, 'Gated Cross-Attention Layer', { size: 15, weight: 700, color: k.prefill })
    a.text(313, 276, 'Q = h · W_q,  K = K_v,  V = V_v', { size: 15, color: k.mid })
    a.text(313, 302, 'Output = h + tanh(α) · Attn(Q,K,V)', { size: 15, weight: 700, color: k.pass })

    a.arrow(435, 325, 435, 345, k.pass, { width: 1.5 })

    // Standard self-attn and FFN
    a.rect(301, 345, 273, 50, { fill: tint(k.c.bg, 0.1), stroke: k.line, r: 4 })
    a.text(313, 370, 'Self-Attention + Dense FFN', { size: 15, weight: 600 })

    a.arrow(435, 395, 435, 412, k.pass, { width: 1.5 })

    a.rect(301, 412, 273, 42, { fill: tint(k.pass, 0.15), stroke: tint(k.pass, 0.4), r: 4 })
    a.text(313, 433, 'Updated Language State h_next', { size: 15, weight: 700, color: k.pass })

    // Arrow from visual memory bank (Col 1) into Gated Cross-Attention (Col 2)
    a.arrow(244, 305, 301, 275, k.prefill, { width: 2 })

    // Column 3: Serving & Systems Benefits (Right)
    a.rect(610, 85, 210, 385, { fill: tint(k.c.bg, 0.05), stroke: k.line, r: 8 })
    a.cell(626, 102, 160, 24, 'SYSTEM ADVANTAGES', {
        fill: tint(k.wait, 0.15),
        stroke: tint(k.wait, 0.4),
        color: k.wait,
        weight: 700,
    })
    a.text(626, 148, 'Serving Profile', { size: 16, weight: 700, color: k.state })

    const benefits = [
        {
            title: 'Zero Prefix KV Bloat',
            desc: 'Text KV cache holds only tokens, not 2,880 image patches.',
        },
        {
            title: 'Preserved Pretraining',
            desc: 'tanh(α) init at 0 leaves language capabilities intact initially.',
        },
        {
            title: 'Multi-Image Scalability',
            desc: 'Each image adds to visual bank without lengthening text context.',
        },
        {
            title: 'Fast Generation Decoding',
            desc: 'Decode speed matches pure text model of identical parameter size.',
        },
    ]

    benefits.forEach((b, i) => {
        const y = 172 + i * 70
        a.rect(626, y, 178, 60, { fill: tint(k.c.bg, 0.1), stroke: k.line, r: 4 })
        a.text(636, y + 22, b.title, { size: 15, weight: 700, color: k.state })
        a.text(636, y + 46, b.desc, { size: 15, color: k.mid })
    })

    return a.render()
}

export default create('dark')
