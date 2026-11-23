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
    'Visual token budget ladder comparing resolution scaling at patch size 14. A standard 224x224 image generates 256 visual tokens (16x16 patches). A 336x336 crop generates 576 tokens (24x24 patches). Tiling four 336x336 crops generates 2,304 visual tokens before text framing, multiplying prefill latency and KV cache memory footprint by 9x.'

export function create(theme: ThemeMode = 'dark') {
    const k = pk(theme),
        a = canvas(k, width, height)

    // Header
    a.text(40, 36, 'Visual Token Budget Scaling with Resolution and Tiling', {
        size: 22,
        weight: 700,
    })
    a.text(
        40,
        62,
        'ViT patch size 14x14 pixels · Prefix token count dictates prefill compute and decoding KV cache footprint',
        { size: 16, color: k.mid },
    )

    // Left Panel: Token Ladder Bar Chart (x=40..460)
    a.rect(40, 85, 410, 385, { fill: tint(k.c.bg, 0.05), stroke: k.line, r: 8 })
    a.text(60, 115, 'Visual Token Count by Tiling Configuration', {
        size: 17,
        weight: 650,
        color: k.decode,
    })

    const maxTokens = 2500
    const barW = 320
    const scale = barW / maxTokens

    const configs = [
        {
            name: '1. Standard 224 × 224 Image',
            tokens: 256,
            patches: '16 × 16 patches',
            color: k.pass,
            y: 150,
        },
        {
            name: '2. High-Res 336 × 336 Crop',
            tokens: 576,
            patches: '24 × 24 patches',
            color: k.state,
            y: 245,
        },
        {
            name: '3. Tiled 4 × 336 × 336 Crops',
            tokens: 2304,
            patches: '4 × 576 patches (high-res grid)',
            color: k.fail,
            y: 340,
        },
    ]

    configs.forEach((c) => {
        a.text(60, c.y, c.name, { size: 14, weight: 700, color: k.ink })
        a.text(60, c.y + 18, c.patches, { size: 12, color: k.mid })

        // Bar
        a.rect(60, c.y + 26, c.tokens * scale, 28, {
            fill: tint(c.color, 0.4),
            stroke: c.color,
            r: 4,
        })
        a.text(60 + c.tokens * scale + 10, c.y + 40, `${c.tokens.toLocaleString()} tokens`, {
            size: 14,
            weight: 700,
            color: c.color,
        })
    })

    // Axis line at bottom of bars
    a.line(60, 430, 60 + barW, 430, k.line)
    a.text(60, 448, '0', { size: 12, color: k.faint })
    a.text(60 + 1000 * scale, 448, '1,000', { size: 12, align: 'center', color: k.faint })
    a.text(60 + 2000 * scale, 448, '2,000', { size: 12, align: 'center', color: k.faint })
    a.text(60 + barW, 448, '2,500', { size: 12, align: 'right', color: k.faint })

    // Arrow indicating prefill and memory scaling from tiled crops
    a.arrow(400, 360, 480, 280, k.fail, { width: 2 })

    // Right Panel: Systems & Serving Trade-Offs (x=470..820)
    a.rect(470, 85, 350, 385, { fill: tint(k.c.bg, 0.05), stroke: k.line, r: 8 })
    a.text(490, 115, 'Serving & Memory Implications', { size: 17, weight: 650, color: k.ink })

    // Card 1: Prefill Attention Scaling
    a.rect(490, 140, 310, 85, { fill: tint(k.fail, 0.12), stroke: k.fail, r: 6 })
    a.text(505, 164, 'Prefill Attention Scaling', { size: 15, weight: 700, color: k.fail })
    a.text(505, 186, 'Attention FLOPs scale as O(N^2)', { size: 13, mono: true, color: k.ink })
    a.text(505, 206, '2,304 vs 256 tokens = 81× attention compute', {
        size: 12,
        weight: 600,
        color: k.fail,
    })

    // Card 2: KV Cache Memory Footprint
    a.rect(490, 240, 310, 95, { fill: tint(k.state, 0.12), stroke: k.state, r: 6 })
    a.text(505, 264, 'KV Cache Resident Memory', { size: 15, weight: 700, color: k.state })
    a.text(505, 286, '256 tokens: ~80 MiB per request', { size: 13, mono: true, color: k.ink })
    a.text(505, 306, '2,304 tokens: ~720 MiB per request (9× VRAM)', {
        size: 13,
        mono: true,
        weight: 600,
        color: k.state,
    })
    a.text(505, 324, 'Directly reduces max batch concurrency', { size: 12, color: k.mid })

    // Card 3: Design Rule
    a.rect(490, 350, 310, 100, { fill: tint(k.pass, 0.12), stroke: k.pass, r: 6 })
    a.text(505, 375, 'Architectural Guideline', { size: 15, weight: 700, color: k.pass })
    a.text(505, 398, 'Use high-res tiling for dense documents & OCR', { size: 12, color: k.ink })
    a.text(505, 418, 'Pair with adaptive pruning (PruMerge) or', { size: 12, color: k.ink })
    a.text(505, 436, 'Q-Former compression to bound tail latency', { size: 12, color: k.pass })

    return a.render()
}

export default create('dark')
