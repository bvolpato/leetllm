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
    'CLIP dual-encoder architecture and L2 normalization geometry. An image and caption pass through independent vision and text encoders into normalized unit vectors. Unnormalized dot product rewards vector magnitude, picking caption B (norm 15, dot 9.0) over caption A (norm 1, dot 0.8). L2 normalization removes magnitude bias, correctly ranking caption A (cosine 0.8) above caption B (cosine 0.6) on directional alignment.'

export function create(theme: ThemeMode = 'dark') {
    const k = pk(theme),
        a = canvas(k, width, height)

    // Header
    a.text(40, 36, 'CLIP Dual-Encoder Architecture and L2 Directional Alignment', {
        size: 22,
        weight: 700,
    })
    a.text(
        40,
        62,
        'Decoupled encoders project image and text to a shared embedding space; L2 normalization eliminates magnitude bias',
        { size: 16, color: k.mid },
    )

    // Left Panel: Dual-Encoder Pipeline (x=40..410)
    a.rect(40, 85, 370, 385, { fill: tint(k.c.bg, 0.05), stroke: k.line, r: 8 })
    a.text(60, 115, 'Dual-Encoder Architecture', { size: 18, weight: 650, color: k.prefill })

    // Image Branch
    a.rect(60, 140, 150, 48, { fill: tint(k.prefill, 0.15), stroke: k.prefill, r: 6 })
    a.text(135, 164, 'Input Image', { size: 15, weight: 650, align: 'center', color: k.ink })
    a.arrow(135, 188, 135, 215, k.prefill)

    a.rect(60, 215, 150, 52, { fill: tint(k.prefill, 0.25), stroke: k.prefill, width: 2, r: 6 })
    a.text(135, 235, 'Vision Encoder', { size: 15, weight: 700, align: 'center', color: k.prefill })
    a.text(135, 253, 'ViT / ResNet', { size: 12, align: 'center', color: k.mid })
    a.arrow(135, 267, 135, 295, k.prefill)

    // Text Branch
    a.rect(240, 140, 150, 48, { fill: tint(k.decode, 0.15), stroke: k.decode, r: 6 })
    a.text(315, 164, 'Text Caption', { size: 15, weight: 650, align: 'center', color: k.ink })
    a.arrow(315, 188, 315, 215, k.decode)

    a.rect(240, 215, 150, 52, { fill: tint(k.decode, 0.25), stroke: k.decode, width: 2, r: 6 })
    a.text(315, 235, 'Text Encoder', { size: 15, weight: 700, align: 'center', color: k.decode })
    a.text(315, 253, 'Transformer', { size: 12, align: 'center', color: k.mid })
    a.arrow(315, 267, 315, 295, k.decode)

    // L2 Normalization Layer
    a.rect(60, 295, 330, 48, { fill: tint(k.state, 0.15), stroke: k.state, r: 6 })
    a.text(225, 319, 'L2 Normalization: v = x / ||x||', {
        size: 14,
        weight: 700,
        mono: true,
        align: 'center',
        color: k.state,
    })

    a.arrow(225, 343, 225, 375, k.line)

    // Cosine Score Output
    a.rect(60, 375, 330, 75, { fill: tint(k.pass, 0.12), stroke: k.pass, r: 6 })
    a.text(225, 400, 'Cosine Similarity Score', {
        size: 15,
        weight: 700,
        align: 'center',
        color: k.pass,
    })
    a.text(225, 424, 'cos(v_image, u_text) in [-1, +1]', {
        size: 14,
        mono: true,
        align: 'center',
        color: k.ink,
    })

    // Right Panel: Raw Dot vs Normalized Cosine (x=430..820)
    a.rect(430, 85, 390, 385, { fill: tint(k.c.bg, 0.05), stroke: k.line, r: 8 })
    a.text(450, 115, 'Why L2 Normalization Matters', { size: 18, weight: 650, color: k.ink })

    // Probe Scenario
    a.text(450, 148, 'Query image vector: [1.0, 0.0]', { size: 14, mono: true, color: k.mid })
    a.text(450, 170, 'Candidate A: [0.8, 0.6] · norm = 1.0', {
        size: 14,
        mono: true,
        color: k.pass,
    })
    a.text(450, 192, 'Candidate B: [9.0, 12.0] · norm = 15.0', {
        size: 14,
        mono: true,
        color: k.fail,
    })

    // Card 1: Unnormalized Dot Product
    a.rect(450, 220, 350, 95, { fill: tint(k.fail, 0.1), stroke: k.fail, r: 6 })
    a.text(465, 244, 'Raw Dot Product (Unnormalized)', { size: 15, weight: 700, color: k.fail })
    a.text(465, 268, 'dot(img, A) = 0.80   |   dot(img, B) = 9.00', {
        size: 14,
        mono: true,
        color: k.ink,
    })
    a.text(465, 292, 'Result: Selects B (Magnitude artifact!)', {
        size: 14,
        weight: 700,
        color: k.fail,
    })

    // Card 2: L2 Normalized Cosine Similarity
    a.rect(450, 335, 350, 115, { fill: tint(k.pass, 0.12), stroke: k.pass, width: 2, r: 6 })
    a.text(465, 360, 'Cosine Similarity (L2 Normalized)', { size: 15, weight: 700, color: k.pass })
    a.text(465, 385, 'cos(img, A) = 0.80   |   cos(img, B) = 0.60', {
        size: 14,
        mono: true,
        color: k.ink,
    })
    a.text(465, 410, 'Result: Selects A (Correct directional match!)', {
        size: 14,
        weight: 700,
        color: k.pass,
    })
    a.text(465, 432, 'Aligns on unit hypersphere regardless of norm', { size: 13, color: k.mid })

    return a.render()
}

export default create('dark')
