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
    'CLIP contrastive logit matrix and symmetric InfoNCE loss across 3 image-text pairs with temperature 0.2. Diagonal logits equal 5.0 (positive pairs), while off-diagonal negative pairs range from 0.09 to 0.71. Row-wise softmax evaluates image-to-text loss, column-wise softmax evaluates text-to-image loss, yielding symmetric loss of 0.022.'

export function create(theme: ThemeMode = 'dark') {
    const k = pk(theme),
        a = canvas(k, width, height)

    // Header
    a.text(40, 36, 'CLIP Contrastive Logit Matrix and Symmetric InfoNCE Loss', {
        size: 22,
        weight: 700,
    })
    a.text(
        40,
        62,
        '3x3 batch pairs scaled by temperature tau = 0.2 · Diagonal positive pairs maximize alignment',
        { size: 16, color: k.mid },
    )

    // Left Panel: 3x3 Logits Matrix (x=40..430)
    a.rect(40, 85, 380, 385, { fill: tint(k.c.bg, 0.05), stroke: k.line, r: 8 })
    a.text(60, 115, 'Scaled Cosine Similarity Logits (z / tau)', {
        size: 17,
        weight: 650,
        color: k.state,
    })

    // Column Headers (Text Captions)
    a.text(175, 145, 'Text 1', { size: 14, weight: 700, align: 'center', color: k.decode })
    a.text(260, 145, 'Text 2', { size: 14, weight: 700, align: 'center', color: k.decode })
    a.text(345, 145, 'Text 3', { size: 14, weight: 700, align: 'center', color: k.decode })

    const matrix = [
        ['+5.00', '0.60', '0.14'],
        ['0.71', '+5.00', '0.66'],
        ['0.09', '0.59', '+5.00'],
    ]

    const gridY = [165, 235, 305]
    const rowLabels = ['Image 1', 'Image 2', 'Image 3']

    matrix.forEach((row, r) => {
        const y = gridY[r]
        // Row header
        a.text(80, y + 25, rowLabels[r], { size: 14, weight: 700, color: k.prefill })

        row.forEach((val, c) => {
            const x = 135 + c * 85
            const isDiag = r === c
            a.rect(x, y, 80, 55, {
                fill: isDiag ? tint(k.pass, 0.3) : tint(k.line, 0.15),
                stroke: isDiag ? k.pass : k.line,
                width: isDiag ? 2 : 1,
                r: 6,
            })
            a.text(x + 40, y + 28, val, {
                size: 15,
                weight: isDiag ? 700 : 500,
                mono: true,
                align: 'center',
                color: isDiag ? k.pass : k.ink,
            })
        })
    })

    // Legend badge
    a.rect(60, 390, 340, 60, { fill: tint(k.pass, 0.1), stroke: k.line, r: 6 })
    a.rect(75, 408, 16, 16, { fill: tint(k.pass, 0.5), stroke: k.pass, r: 3 })
    a.text(100, 420, 'Diagonal: Matched Pairs (Target = 1.0)', {
        size: 13,
        weight: 600,
        color: k.pass,
    })
    a.text(100, 438, 'Off-Diagonal: In-Batch Negatives (Target = 0.0)', { size: 13, color: k.mid })

    // Right Panel: Loss Decomposition & Symmetric Formulation (x=440..820)
    a.rect(440, 85, 380, 385, { fill: tint(k.c.bg, 0.05), stroke: k.line, r: 8 })
    a.text(460, 115, 'Symmetric Cross-Entropy Loss', { size: 17, weight: 650, color: k.ink })

    // Card 1: Image-to-Text Loss
    a.rect(460, 140, 340, 80, { fill: tint(k.prefill, 0.12), stroke: k.prefill, r: 6 })
    a.text(475, 165, '1. Image-to-Text Loss (Row Softmax)', {
        size: 15,
        weight: 700,
        color: k.prefill,
    })
    a.text(475, 188, 'L_i2t = -1/N sum log(P(caption | image))', {
        size: 12,
        mono: true,
        color: k.ink,
    })
    a.text(475, 206, 'Score: 0.022 nats', { size: 13, weight: 600, color: k.prefill })

    // Card 2: Text-to-Image Loss
    a.rect(460, 235, 340, 80, { fill: tint(k.decode, 0.12), stroke: k.decode, r: 6 })
    a.text(475, 260, '2. Text-to-Image Loss (Col Softmax)', {
        size: 15,
        weight: 700,
        color: k.decode,
    })
    a.text(475, 283, 'L_t2i = -1/N sum log(P(image | caption))', {
        size: 12,
        mono: true,
        color: k.ink,
    })
    a.text(475, 301, 'Score: 0.022 nats', { size: 13, weight: 600, color: k.decode })

    // Card 3: Symmetric Mean Loss
    a.rect(460, 330, 340, 120, { fill: tint(k.pass, 0.15), stroke: k.pass, width: 2, r: 6 })
    a.text(475, 358, 'Total Symmetric InfoNCE Objective', { size: 16, weight: 700, color: k.pass })
    a.text(475, 385, 'L = (L_i2t + L_t2i) / 2 = 0.022', {
        size: 15,
        weight: 700,
        mono: true,
        color: k.pass,
    })
    a.text(475, 412, 'Joint bidirectional gradients prevent collapse', { size: 12, color: k.ink })
    a.text(475, 432, 'Effective batch N=32,768 in CLIP pretraining', { size: 12, color: k.mid })

    return a.render()
}

export default create('dark')
