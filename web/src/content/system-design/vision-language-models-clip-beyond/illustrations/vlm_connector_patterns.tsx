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
    'Three vision-language model connector patterns compared. LLaVA-1.5 uses a 2-layer MLP projector to map all 576 ViT patch tokens directly into the LLM prefix. BLIP-2 uses a Q-Former with 32 learned queries to compress visual features down to 32 prefix tokens. Flamingo uses a Perceiver Resampler to compress features into 64 latents accessed via gated cross-attention in the language model.'

export function create(theme: ThemeMode = 'dark') {
    const k = pk(theme),
        a = canvas(k, width, height)

    // Header
    a.text(40, 36, 'Modality Connector Architectures in Vision-Language Models', {
        size: 22,
        weight: 700,
    })
    a.text(
        40,
        62,
        'Bridging frozen visual representations into autoregressive language decoders: Direct, Query-Compressed, and Cross-Attention',
        { size: 16, color: k.mid },
    )

    const cols = [
        {
            title: '1. Linear / MLP Projector',
            model: 'LLaVA-1.5, LLaVA-NeXT',
            tokens: '576 prefix tokens',
            tone: k.prefill,
            x: 40,
            w: 245,
            arch: '2-Layer MLP (W2 · GELU(W1 · X))',
            tradeoff:
                'Zero information loss; retains full spatial grid. Heavy KV cache and prefill compute burden.',
        },
        {
            title: '2. Learned Q-Former',
            model: 'BLIP-2, InstructBLIP',
            tokens: '32 prefix tokens',
            tone: k.state,
            x: 305,
            w: 245,
            arch: 'Cross-Attention with Learned Queries',
            tradeoff:
                '18× token compression (32 tokens); minimal KV cache. May bottleneck fine text or dense OCR.',
        },
        {
            title: '3. Perceiver Resampler',
            model: 'Flamingo, IDEFICS',
            tokens: '64 visual latents',
            tone: k.pass,
            x: 570,
            w: 245,
            arch: 'Gated Cross-Attention Layers',
            tradeoff:
                'Revisitable external memory bank; natively supports multi-image and video sequences.',
        },
    ]

    cols.forEach((col) => {
        // Container
        a.rect(col.x, 85, col.w, 385, { fill: tint(k.c.bg, 0.05), stroke: k.line, r: 8 })

        // Title & Model Tag
        a.text(col.x + 16, 115, col.title, { size: 15, weight: 700, color: col.tone })
        a.text(col.x + 16, 135, col.model, { size: 12, color: k.mid })

        // Token Badge
        a.rect(col.x + 16, 155, col.w - 32, 44, {
            fill: tint(col.tone, 0.2),
            stroke: col.tone,
            width: 2,
            r: 6,
        })
        a.text(col.x + col.w / 2, 177, col.tokens, {
            size: 15,
            weight: 800,
            align: 'center',
            color: col.tone,
        })

        // Diagrammatic flow inside card
        a.rect(col.x + 16, 215, col.w - 32, 45, { fill: tint(k.line, 0.15), stroke: k.line, r: 4 })
        a.text(col.x + col.w / 2, 237, 'Vision Tower Features', {
            size: 12,
            weight: 600,
            align: 'center',
            color: k.ink,
        })

        a.arrow(col.x + col.w / 2, 260, col.x + col.w / 2, 280, col.tone)

        a.rect(col.x + 16, 280, col.w - 32, 50, {
            fill: tint(col.tone, 0.12),
            stroke: col.tone,
            r: 4,
        })
        a.text(col.x + col.w / 2, 298, 'Connector Mechanism', {
            size: 12,
            weight: 700,
            align: 'center',
            color: col.tone,
        })
        a.text(col.x + col.w / 2, 316, col.arch, {
            size: 10,
            mono: true,
            align: 'center',
            color: k.mid,
        })

        a.arrow(col.x + col.w / 2, 330, col.x + col.w / 2, 350, col.tone)

        a.rect(col.x + 16, 350, col.w - 32, 42, { fill: tint(k.line, 0.15), stroke: k.line, r: 4 })
        a.text(col.x + col.w / 2, 371, 'LLM Decoder Backbone', {
            size: 12,
            weight: 600,
            align: 'center',
            color: k.ink,
        })

        // Trade-off description at bottom
        a.rect(col.x + 16, 405, col.w - 32, 52, { fill: tint(k.c.bg, 0.1), stroke: k.line, r: 4 })
        a.text(col.x + col.w / 2, 422, col.tradeoff.split(';')[0], {
            size: 11,
            align: 'center',
            color: k.ink,
        })
        if (col.tradeoff.includes(';')) {
            a.text(col.x + col.w / 2, 440, col.tradeoff.split(';')[1].trim(), {
                size: 11,
                align: 'center',
                color: k.mid,
            })
        }
    })

    return a.render()
}

export default create('dark')
