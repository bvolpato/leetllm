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
    'Vision Transformer patch tokenization pipeline. A 224 by 224 pixel image is divided into a 14 by 14 grid of 16 by 16 pixel patches. Each patch is flattened into 768 values and linearly projected into embedding dimension D. A learnable class token [CLS] prepends the 196 patch tokens, and 1D position embeddings are added before Transformer self-attention.'

export function create(theme: ThemeMode = 'dark') {
    const k = pk(theme),
        a = canvas(k, width, height)

    // Header
    a.text(40, 36, 'Vision Transformer (ViT) Patch Tokenization Pipeline', {
        size: 22,
        weight: 700,
    })
    a.text(
        40,
        62,
        'Converting 2D spatial pixels into a 1D sequence of token embeddings for Transformer attention',
        { size: 16, color: k.mid },
    )

    // Left Panel: 14x14 Patch Grid (x=40..310)
    a.rect(40, 85, 270, 385, { fill: tint(k.c.bg, 0.05), stroke: k.line, r: 8 })
    a.text(55, 112, '1. Image Patch Grid', { size: 16, weight: 700, color: k.decode })
    a.text(55, 130, '224 × 224 px · 14 × 14 grid', { size: 13, color: k.mid })

    // Draw 14x14 grid of patches
    const gridOriginX = 65
    const gridOriginY = 150
    const patchSide = 15
    for (let r = 0; r < 14; r++) {
        for (let c = 0; c < 14; c++) {
            const isHighlight = r === 5 && c === 7
            a.rect(gridOriginX + c * patchSide, gridOriginY + r * patchSide, patchSide, patchSide, {
                fill: isHighlight ? tint(k.pass, 0.7) : tint(k.decode, 0.15),
                stroke: isHighlight ? k.pass : k.line,
                width: isHighlight ? 2 : 1,
            })
        }
    }

    a.text(175, 385, '196 patches of 16 × 16 × 3 px', { size: 13, align: 'center', color: k.mid })

    // Callout arrow from highlighted patch to projection
    a.arrow(gridOriginX + 7.5 * patchSide, gridOriginY + 5.5 * patchSide, 330, 240, k.pass, {
        width: 2,
    })

    // Center Panel: Patch Flatten & Linear Projection (x=330..530)
    a.rect(330, 85, 200, 385, { fill: tint(k.c.bg, 0.05), stroke: k.line, r: 8 })
    a.text(345, 112, '2. Patch Projection', { size: 16, weight: 700, color: k.prefill })

    // Flatten box
    a.rect(345, 160, 170, 65, { fill: tint(k.prefill, 0.15), stroke: k.prefill, r: 6 })
    a.text(430, 185, 'Flatten Patch', { size: 14, weight: 700, align: 'center', color: k.prefill })
    a.text(430, 205, '16 × 16 × 3 = 768 px', {
        size: 12,
        mono: true,
        align: 'center',
        color: k.ink,
    })

    a.arrow(430, 225, 430, 265, k.line)

    // Linear projection box
    a.rect(345, 265, 170, 75, { fill: tint(k.state, 0.2), stroke: k.state, width: 2, r: 6 })
    a.text(430, 290, 'Linear Projection (E)', {
        size: 14,
        weight: 700,
        align: 'center',
        color: k.state,
    })
    a.text(430, 310, 'x_p · E -> R^D', { size: 13, mono: true, align: 'center', color: k.ink })
    a.text(430, 328, 'Dimension D = 768', { size: 12, align: 'center', color: k.mid })

    a.arrow(515, 302, 550, 302, k.pass, { width: 2 })

    // Right Panel: 1D Token Sequence (x=550..820)
    a.rect(550, 85, 270, 385, { fill: tint(k.c.bg, 0.05), stroke: k.line, r: 8 })
    a.text(565, 112, '3. Input Sequence to ViT', { size: 16, weight: 700, color: k.pass })

    // Tokens stack
    const tokenY = [150, 200, 250, 330]
    const tokenLabels = [
        { name: '[CLS] Class Token', desc: 'Global image representation', color: k.state },
        { name: 'Token 1 (Patch 1,1)', desc: 'Top-left corner embedding', color: k.decode },
        { name: 'Token 2 (Patch 1,2)', desc: 'Next spatial patch', color: k.decode },
        { name: 'Token 196 (Patch 14,14)', desc: 'Bottom-right corner embedding', color: k.pass },
    ]

    tokenLabels.forEach((t, i) => {
        const y = tokenY[i]
        a.rect(565, y, 240, 42, { fill: tint(t.color, 0.15), stroke: t.color, r: 5 })
        a.text(580, y + 21, t.name, { size: 13, weight: 700, color: t.color })
        a.text(790, y + 21, `+ pos_${i}`, { size: 11, mono: true, align: 'right', color: k.mid })
    })

    // Vertical ellipsis between token 2 and token 196
    a.dot(685, 300, 3, k.mid)
    a.dot(685, 310, 3, k.mid)
    a.dot(685, 320, 3, k.mid)

    // Summary banner at bottom
    a.rect(565, 390, 240, 60, { fill: tint(k.pass, 0.12), stroke: k.pass, r: 6 })
    a.text(685, 412, 'Sequence: 197 Tokens', {
        size: 14,
        weight: 700,
        align: 'center',
        color: k.pass,
    })
    a.text(685, 432, 'Ready for Standard Self-Attention', {
        size: 12,
        align: 'center',
        color: k.mid,
    })

    return a.render()
}

export default create('dark')
