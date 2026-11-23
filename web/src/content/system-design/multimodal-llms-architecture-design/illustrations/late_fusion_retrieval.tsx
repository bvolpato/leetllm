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
    'Late fusion decoupled dual-encoder retrieval architecture. An image tower and text query tower compute independent normalized embeddings in a shared 768-dimensional space. A dot product head evaluates cosine similarity against a vector index to rank candidates without full generative decoding.'

export function create(theme: ThemeMode = 'dark') {
    const k = pk(theme),
        a = canvas(k, width, height)

    // Header
    a.text(40, 32, 'Late Fusion: Decoupled Dual-Encoder Retrieval', { size: 22, weight: 700 })
    a.text(
        40,
        58,
        'Precomputing visual embeddings offline for fast sub-millisecond similarity search',
        { size: 15, color: k.mid },
    )

    // Column 1: Image Tower (Left)
    a.rect(40, 85, 230, 300, { fill: tint(k.c.bg, 0.05), stroke: k.line, r: 8 })
    a.cell(56, 102, 125, 24, 'OFFLINE / INDEX', {
        fill: tint(k.decode, 0.15),
        stroke: tint(k.decode, 0.4),
        color: k.decode,
        weight: 700,
    })
    a.text(56, 148, 'Vision Tower', { size: 16, weight: 700, color: k.prefill })

    a.rect(56, 168, 198, 48, { fill: tint(k.c.bg, 0.1), stroke: k.line, r: 6 })
    a.text(68, 192, 'Raw Image / Frame Pixels', { size: 15, weight: 600 })

    a.arrow(155, 216, 155, 238, k.prefill, { width: 1.5 })

    a.rect(56, 238, 198, 60, { fill: tint(k.prefill, 0.08), stroke: tint(k.prefill, 0.3), r: 6 })
    a.text(68, 258, 'Vision Transformer (ViT)', { size: 15, weight: 700, color: k.prefill })
    a.text(68, 280, 'Patch tokens → Global Pooling', { size: 15, color: k.mid })

    a.arrow(155, 298, 155, 318, k.prefill, { width: 1.5 })

    a.rect(56, 318, 198, 50, { fill: tint(k.pass, 0.08), stroke: tint(k.pass, 0.3), r: 6 })
    a.text(68, 343, 'Normalized Vector v ∈ R^d', { size: 15, weight: 700, color: k.pass })

    // Column 2: Text Tower (Right)
    a.rect(590, 85, 230, 300, { fill: tint(k.c.bg, 0.05), stroke: k.line, r: 8 })
    a.cell(606, 102, 125, 24, 'ONLINE / QUERY', {
        fill: tint(k.wait, 0.15),
        stroke: tint(k.wait, 0.4),
        color: k.wait,
        weight: 700,
    })
    a.text(606, 148, 'Text Tower', { size: 16, weight: 700, color: k.state })

    a.rect(606, 168, 198, 48, { fill: tint(k.c.bg, 0.1), stroke: k.line, r: 6 })
    a.text(618, 192, 'User Search Query / Prompt', { size: 15, weight: 600 })

    a.arrow(705, 216, 705, 238, k.state, { width: 1.5 })

    a.rect(606, 238, 198, 60, { fill: tint(k.state, 0.08), stroke: tint(k.state, 0.3), r: 6 })
    a.text(618, 258, 'Text Transformer Encoder', { size: 15, weight: 700, color: k.state })
    a.text(618, 280, 'BPE tokens → [EOS] Pooling', { size: 15, color: k.mid })

    a.arrow(705, 298, 705, 318, k.state, { width: 1.5 })

    a.rect(606, 318, 198, 50, { fill: tint(k.pass, 0.08), stroke: tint(k.pass, 0.3), r: 6 })
    a.text(618, 343, 'Normalized Vector t ∈ R^d', { size: 15, weight: 700, color: k.pass })

    // Center Column: Merge / Scoring Head & Index
    a.rect(305, 85, 250, 300, { fill: tint(k.c.bg, 0.05), stroke: k.line, r: 8 })
    a.cell(321, 102, 140, 24, 'SIMILARITY MATCH', {
        fill: tint(k.pass, 0.15),
        stroke: tint(k.pass, 0.4),
        color: k.pass,
        weight: 700,
    })
    a.text(321, 148, 'Cosine Scoring Head', { size: 16, weight: 700, color: k.pass })

    a.rect(321, 168, 218, 60, { fill: tint(k.pass, 0.1), stroke: tint(k.pass, 0.35), r: 6 })
    a.text(333, 190, 'Dot Product Similarity', { size: 15, weight: 700, color: k.pass })
    a.text(333, 212, 'Score = v · t = cos(θ)', { size: 15, color: k.mid })

    a.arrow(430, 228, 430, 248, k.pass, { width: 2 })

    a.rect(321, 248, 218, 120, { fill: tint(k.c.bg, 0.12), stroke: k.line, r: 6 })
    a.text(333, 272, 'Vector Database Index', { size: 15, weight: 700 })
    a.text(333, 296, 'HNSW / ScaNN / IVF-PQ', { size: 15, color: k.mid })
    a.text(333, 320, 'Top-K candidate ranking', { size: 15, color: k.mid })
    a.text(333, 346, 'Latency: < 5 ms at scale', { size: 15, weight: 600, color: k.pass })

    // Arrows from towers into Scoring Head
    a.arrow(254, 343, 321, 198, k.pass, { width: 2 })
    a.arrow(606, 343, 539, 198, k.pass, { width: 2 })

    // Bottom Insight Card
    a.rect(40, 400, 780, 75, { fill: tint(k.c.bg, 0.05), stroke: k.line, r: 8 })
    a.text(56, 424, 'Architectural Trade-Off: Decoupled Retrieval vs Generative Reasoning', {
        size: 15,
        weight: 700,
    })
    a.text(
        56,
        452,
        'Dual-encoder late fusion retrieves top candidates at billion-vector scale before passing them to an early-fusion VLM.',
        { size: 15, color: k.mid },
    )

    return a.render()
}

export default create('dark')
