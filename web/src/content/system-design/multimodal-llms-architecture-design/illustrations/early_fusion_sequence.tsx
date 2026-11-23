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
    'Early fusion sequence budget comparison. On a shared 6,000-token scale, direct projection requires 2,880 visual tokens from 5 views, totaling 5,380 tokens and exceeding the 4,096-token context limit. A compressed connector reduces visual tokens to 160, resulting in 2,660 total tokens that fit comfortably within budget.'

export function create(theme: ThemeMode = 'dark') {
    const k = pk(theme),
        a = canvas(k, width, height)

    // Header
    a.text(40, 32, 'Early Fusion Context Budget: Direct vs. Compressed Prefix', {
        size: 22,
        weight: 700,
    })
    a.text(40, 58, 'Analyzing token footprint against a 4,096-token context window limit', {
        size: 15,
        color: k.mid,
    })

    // Chart container
    a.rect(40, 85, 780, 385, { fill: tint(k.c.bg, 0.05), stroke: k.line, r: 8 })

    // 4,096 context limit marker
    const limitX = 240 + (4096 / 6000) * 500 // 240 + 341.3 = 581.3
    a.line(limitX, 105, limitX, 410, k.fail, { dash: '4 4', width: 2 })
    a.cell(limitX - 70, 95, 140, 24, '4,096 CONTEXT LIMIT', {
        fill: tint(k.fail, 0.15),
        stroke: tint(k.fail, 0.4),
        color: k.fail,
        weight: 700,
    })

    // Plan A: Direct Projection (5 x 576 = 2,880 visual)
    a.text(60, 150, 'Direct MLP Projection', { size: 15, weight: 700, color: k.fail })
    a.text(60, 172, '5 views × 576 patches', { size: 15, color: k.mid })

    const barY1 = 195
    a.rect(240, barY1, 183, 38, { fill: tint(k.pass, 0.25), stroke: tint(k.pass, 0.6), r: 4 })
    a.text(250, barY1 + 19, 'Text: 2,200', { size: 15, weight: 600, color: k.pass })

    a.rect(423, barY1, 240, 38, { fill: tint(k.fail, 0.3), stroke: tint(k.fail, 0.7), r: 4 })
    a.text(435, barY1 + 19, 'Visual: 2,880 tokens', { size: 15, weight: 700, color: k.fail })

    a.rect(663, barY1, 25, 38, { fill: tint(k.mid, 0.2), stroke: k.line, r: 4 })

    a.text(700, barY1 + 19, '5,380 (OVERFLOW)', { size: 15, weight: 700, color: k.fail })

    // Plan B: Compressed Q-Former / Resampler (5 x 32 = 160 visual)
    a.text(60, 275, 'Compressed Connector', { size: 15, weight: 700, color: k.pass })
    a.text(60, 297, '5 views × 32 latents', { size: 15, color: k.mid })

    const barY2 = 320
    a.rect(240, barY2, 183, 38, { fill: tint(k.pass, 0.25), stroke: tint(k.pass, 0.6), r: 4 })
    a.text(250, barY2 + 19, 'Text: 2,200', { size: 15, weight: 600, color: k.pass })

    a.rect(423, barY2, 20, 38, { fill: tint(k.prefill, 0.4), stroke: tint(k.prefill, 0.8), r: 4 })

    a.rect(443, barY2, 25, 38, { fill: tint(k.mid, 0.2), stroke: k.line, r: 4 })

    a.text(480, barY2 + 19, '2,660 total (1,436 headroom)', {
        size: 15,
        weight: 700,
        color: k.pass,
    })

    // Arrow connecting Plan A overflow to callout
    a.arrow(680, 195, 680, 155, k.fail, { width: 1.5 })
    a.rect(650, 130, 150, 32, { fill: tint(k.fail, 0.1), stroke: tint(k.fail, 0.3), r: 4 })
    a.text(660, 146, '+1,284 token deficit', { size: 15, weight: 700, color: k.fail })

    // Legend at bottom
    a.rect(60, 400, 740, 50, { fill: tint(k.c.bg, 0.1), stroke: k.line, r: 6 })
    a.dot(80, 425, 6, tint(k.pass, 0.6))
    a.text(95, 425, 'Prompt & Transcript (2,200)', { size: 15, color: k.mid })

    a.dot(290, 425, 6, tint(k.fail, 0.6))
    a.text(305, 425, 'Raw Patches (2,880)', { size: 15, color: k.mid })

    a.dot(490, 425, 6, tint(k.prefill, 0.7))
    a.text(505, 425, 'Compressed Tokens (160)', { size: 15, color: k.mid })

    a.dot(690, 425, 6, tint(k.mid, 0.4))
    a.text(705, 425, 'Reserve (300)', { size: 15, color: k.mid })

    return a.render()
}

export default create('dark')
