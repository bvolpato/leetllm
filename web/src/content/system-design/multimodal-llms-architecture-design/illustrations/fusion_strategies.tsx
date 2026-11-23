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
    'Multimodal fusion strategies compared across three architectural paradigms. Early fusion concatenates projected visual tokens directly into the language model input sequence with shared self-attention. Mid fusion preserves a distinct text stream and queries visual memory banks through gated cross-attention layers. Late fusion encodes modalities separately into pooled embeddings for similarity scoring and retrieval.'

export function create(theme: ThemeMode = 'dark') {
    const k = pk(theme),
        a = canvas(k, width, height)

    // Header
    a.text(40, 32, 'Multimodal Fusion Taxonomy: Where Modalities Meet', { size: 22, weight: 700 })
    a.text(
        40,
        58,
        'Architectural trade-offs between sequence integration, cross-attention memory, and decoupled retrieval',
        { size: 15, color: k.mid },
    )

    const cols = [
        {
            title: '1. Early Fusion (Prefix)',
            models: 'LLaVA, GPT-4o, Qwen2.5-VL',
            tone: k.prefill,
            x: 40,
            w: 245,
            arch: 'Interleaved Prefix Sequence',
            points: [
                'Patches mapped directly to tokens',
                'Single shared self-attention sequence',
                'Deep cross-modal reasoning at all layers',
                'Heavy KV cache & prefill cost',
            ],
            verdict: 'Best for detailed visual QA & OCR',
        },
        {
            title: '2. Mid Fusion (Cross-Attn)',
            models: 'Flamingo, IDEFICS',
            tone: k.pass,
            x: 305,
            w: 245,
            arch: 'Gated Cross-Attention Blocks',
            points: [
                'Text stream remains on main trunk',
                'Gated cross-attention reads visual bank',
                'tanh(α) gating initialized at zero',
                'Zero text-prefix KV cache bloat',
            ],
            verdict: 'Best for multi-image & video scaling',
        },
        {
            title: '3. Late Fusion (Dual Encoders)',
            models: 'CLIP, SigLIP, ColPali',
            tone: k.state,
            x: 570,
            w: 245,
            arch: 'Decoupled Vector Towers',
            points: [
                'Independent image & text towers',
                'Pooled compact embeddings (d=768)',
                'Similarity via dot product: v · t',
                'Zero generative decoding capability',
            ],
            verdict: 'Sub-millisecond retrieval & vector search',
        },
    ]

    cols.forEach((col) => {
        // Container
        a.rect(col.x, 85, col.w, 385, { fill: tint(k.c.bg, 0.05), stroke: k.line, r: 8 })

        // Header block
        a.rect(col.x, 85, col.w, 65, {
            fill: tint(col.tone, 0.1),
            stroke: tint(col.tone, 0.3),
            r: 8,
        })
        a.text(col.x + 16, 110, col.title, { size: 15, weight: 700, color: col.tone })
        a.text(col.x + 16, 132, col.models, { size: 15, color: k.mid })

        // Mechanism badge
        a.rect(col.x + 14, 162, col.w - 28, 30, { fill: tint(k.c.bg, 0.1), stroke: k.line, r: 4 })
        a.text(col.x + 22, 177, col.arch, { size: 15, weight: 600, color: col.tone })

        // Bullet points
        col.points.forEach((pt, i) => {
            const y = 212 + i * 40
            a.dot(col.x + 22, y, 3, col.tone)
            a.text(col.x + 32, y, pt, { size: 15, color: k.mid })
        })

        // Verdict card
        a.rect(col.x + 14, 380, col.w - 28, 75, {
            fill: tint(col.tone, 0.06),
            stroke: tint(col.tone, 0.25),
            r: 6,
        })
        a.text(col.x + 22, 405, 'Best Used For:', { size: 15, weight: 700, color: col.tone })
        a.text(col.x + 22, 432, col.verdict, { size: 15, color: k.mid })
    })

    return a.render()
}

export default create('dark')
