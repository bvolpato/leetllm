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
    'Multimodal Large Language Model architecture overview. Vision and audio signals pass through modality-specific encoders and projection connectors, entering an autoregressive language decoder either as interleaved prefix tokens or via gated cross-attention memory to produce grounded outputs.'

export function create(theme: ThemeMode = 'dark') {
    const k = pk(theme),
        a = canvas(k, width, height)

    // Header
    a.text(40, 32, 'Multimodal LLM Architecture: Dual Fusion Pathways', { size: 22, weight: 700 })
    a.text(
        40,
        58,
        'Bridging heterogeneous visual and acoustic signals into an autoregressive language model',
        { size: 15, color: k.mid },
    )

    // Column 1: Modality Inputs & Encoders
    a.rect(40, 85, 230, 385, { fill: tint(k.c.bg, 0.05), stroke: k.line, r: 8 })
    a.cell(56, 102, 75, 24, 'STAGE 1', {
        fill: tint(k.decode, 0.15),
        stroke: tint(k.decode, 0.4),
        color: k.decode,
        weight: 700,
    })
    a.text(142, 114, 'Modality Encoders', { size: 16, weight: 700 })

    // Input cards
    const inputs = [
        {
            label: 'Vision: Images / Video',
            desc: 'ViT-H/14 · 14×14 patches',
            tone: k.prefill,
            y: 145,
        },
        {
            label: 'Audio: Speech / Audio',
            desc: 'Whisper / Conformer · 100 Hz',
            tone: k.state,
            y: 245,
        },
        { label: 'Language: Text Prompt', desc: 'BPE Tokenizer · Subwords', tone: k.pass, y: 345 },
    ]

    inputs.forEach((item) => {
        a.rect(56, item.y, 198, 75, {
            fill: tint(item.tone, 0.08),
            stroke: tint(item.tone, 0.3),
            r: 6,
        })
        a.text(68, item.y + 24, item.label, { size: 15, weight: 700, color: item.tone })
        a.text(68, item.y + 50, item.desc, { size: 15, color: k.mid })
    })

    // Connectors column
    a.rect(305, 85, 250, 385, { fill: tint(k.c.bg, 0.05), stroke: k.line, r: 8 })
    a.cell(321, 102, 75, 24, 'STAGE 2', {
        fill: tint(k.wait, 0.15),
        stroke: tint(k.wait, 0.4),
        color: k.wait,
        weight: 700,
    })
    a.text(407, 114, 'Modality Connectors', { size: 16, weight: 700 })

    // Connector cards
    a.rect(321, 145, 218, 135, { fill: tint(k.prefill, 0.06), stroke: tint(k.prefill, 0.25), r: 6 })
    a.text(333, 170, 'Pathway A: Prefix Projection', { size: 15, weight: 700, color: k.prefill })
    a.text(333, 198, 'MLP / Q-Former / Resampler', { size: 15, weight: 600 })
    a.text(333, 226, 'Maps patches directly into prefix tokens', { size: 15, color: k.mid })
    a.text(333, 252, 'Shared sequence · KV-cache growth', { size: 15, color: k.mid })

    a.rect(321, 305, 218, 135, { fill: tint(k.pass, 0.06), stroke: tint(k.pass, 0.25), r: 6 })
    a.text(333, 330, 'Pathway B: Gated Attention', { size: 15, weight: 700, color: k.pass })
    a.text(333, 358, 'Perceiver Latent Memory Bank', { size: 15, weight: 600 })
    a.text(333, 386, 'External visual key-value memory', { size: 15, color: k.mid })
    a.text(333, 412, 'Zero text-prefix KV cache expansion', { size: 15, color: k.mid })

    // Arrows 1 -> 2
    a.arrow(254, 182, 321, 182, k.prefill, { width: 2 })
    a.arrow(254, 282, 321, 230, k.state, { width: 2 })
    a.arrow(254, 282, 321, 372, k.state, { width: 1.5, dash: '3 3' })

    // Column 3: LLM Decoder & Output
    a.rect(590, 85, 230, 385, { fill: tint(k.c.bg, 0.05), stroke: k.line, r: 8 })
    a.cell(606, 102, 75, 24, 'STAGE 3', {
        fill: tint(k.pass, 0.15),
        stroke: tint(k.pass, 0.4),
        color: k.pass,
        weight: 700,
    })
    a.text(692, 114, 'Decoder & Output', { size: 16, weight: 700 })

    a.rect(606, 145, 198, 155, { fill: tint(k.c.bg, 0.12), stroke: k.line, r: 6 })
    a.text(618, 172, 'Autoregressive LM', { size: 15, weight: 700, color: k.pass })
    a.text(618, 198, 'Shared Self-Attention Layers', { size: 15, color: k.mid })
    a.text(618, 226, '+ Gated Cross-Attention Blocks', { size: 15, color: k.mid })
    a.text(618, 254, 'PagedAttention KV-Cache', { size: 15, weight: 600 })
    a.text(618, 278, 'Prefix tokens + generated text', { size: 15, color: k.mid })

    a.rect(606, 320, 198, 120, { fill: tint(k.pass, 0.08), stroke: tint(k.pass, 0.3), r: 6 })
    a.text(618, 345, 'Grounded Output', { size: 15, weight: 700, color: k.pass })
    a.text(618, 372, 'Answer text with citations', { size: 15, color: k.mid })
    a.text(618, 398, 'Box regions [y0, x0, y1, x1]', { size: 15, color: k.mid })
    a.text(618, 424, 'Audio / video timestamps', { size: 15, color: k.mid })

    // Arrows 2 -> 3
    a.arrow(539, 212, 606, 212, k.prefill, { width: 2 })
    a.arrow(539, 372, 606, 230, k.pass, { width: 2 })
    a.arrow(254, 382, 606, 250, k.mid, { width: 1.5, dash: '4 4' })
    a.arrow(705, 300, 705, 320, k.pass, { width: 2 })

    return a.render()
}

export default create('dark')
