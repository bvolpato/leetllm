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
    'Modality encoders and feature rate harmonization. Five high-resolution image views reduce from 2,880 patch vectors to 160 visual tokens. Forty seconds of audio compress from 4,000 temporal steps to 400 audio tokens. Transcript and prompt text bypass reduction directly into 2,000 text tokens, entering the unified decoder sequence.'

export function create(theme: ThemeMode = 'dark') {
    const k = pk(theme),
        a = canvas(k, width, height)

    // Header
    a.text(40, 32, 'Modality Encoders: Harmonizing Heterogeneous Feature Rates', {
        size: 22,
        weight: 700,
    })
    a.text(
        40,
        58,
        'Balancing raw visual patches, audio frames, and text tokens into a bounded sequence budget',
        { size: 15, color: k.mid },
    )

    const rows = [
        {
            modality: 'Vision Pipeline',
            raw: '5 views · 14×14 patches',
            intermediate: '2,880 patch vectors',
            reduction: '18× Resampler / Q-Former',
            output: '160 visual tokens',
            tone: k.prefill,
            y: 85,
        },
        {
            modality: 'Audio Pipeline',
            raw: '40s clip · 100 Hz frontend',
            intermediate: '4,000 acoustic frames',
            reduction: '10× Strided Convolution',
            output: '400 audio tokens',
            tone: k.state,
            y: 195,
        },
        {
            modality: 'Text Pipeline',
            raw: 'User prompt + transcript',
            intermediate: '2,000 words / subwords',
            reduction: 'Bypass (No reduction)',
            output: '2,000 text tokens',
            tone: k.pass,
            y: 305,
        },
    ]

    rows.forEach((row) => {
        // Container row
        a.rect(40, row.y, 570, 95, { fill: tint(k.c.bg, 0.05), stroke: k.line, r: 8 })

        // Modality Tag
        a.rect(40, row.y, 140, 95, { fill: tint(row.tone, 0.1), stroke: tint(row.tone, 0.3), r: 8 })
        a.text(52, row.y + 35, row.modality, { size: 15, weight: 700, color: row.tone })
        a.text(52, row.y + 60, row.raw, { size: 15, color: k.mid })

        // Arrow
        a.arrow(180, row.y + 47, 210, row.y + 47, row.tone, { width: 1.5 })

        // Intermediate box
        a.rect(210, row.y + 18, 145, 60, { fill: tint(k.c.bg, 0.1), stroke: k.line, r: 6 })
        a.text(220, row.y + 38, row.intermediate, { size: 15, weight: 600 })
        a.text(220, row.y + 60, 'Raw frontend features', { size: 15, color: k.mid })

        // Connector / Reduction
        a.arrow(355, row.y + 47, 385, row.y + 47, row.tone, { width: 1.5 })
        a.rect(385, row.y + 18, 145, 60, {
            fill: tint(row.tone, 0.08),
            stroke: tint(row.tone, 0.25),
            r: 6,
        })
        a.text(395, row.y + 38, row.reduction, { size: 15, weight: 700, color: row.tone })
        a.text(395, row.y + 60, 'Connector transform', { size: 15, color: k.mid })

        // Output arrow to right column
        a.arrow(530, row.y + 47, 630, row.y + 47, row.tone, { width: 2 })
    })

    // Unified Decoder Interface (Right box)
    a.rect(630, 85, 190, 315, { fill: tint(k.pass, 0.08), stroke: tint(k.pass, 0.3), r: 8 })
    a.cell(646, 100, 158, 26, 'UNIFIED SEQUENCE', {
        fill: tint(k.pass, 0.15),
        stroke: tint(k.pass, 0.4),
        color: k.pass,
        weight: 700,
    })
    a.text(646, 145, 'Decoder Input Prefix:', { size: 15, weight: 700, color: k.pass })

    a.rect(646, 165, 158, 42, { fill: tint(k.prefill, 0.15), stroke: tint(k.prefill, 0.4), r: 4 })
    a.text(656, 190, '160 Visual Tokens', { size: 15, weight: 700, color: k.prefill })

    a.rect(646, 217, 158, 42, { fill: tint(k.state, 0.15), stroke: tint(k.state, 0.4), r: 4 })
    a.text(656, 242, '400 Audio Tokens', { size: 15, weight: 700, color: k.state })

    a.rect(646, 269, 158, 42, { fill: tint(k.pass, 0.15), stroke: tint(k.pass, 0.4), r: 4 })
    a.text(656, 294, '2,000 Text Tokens', { size: 15, weight: 700, color: k.pass })

    a.text(646, 345, 'Total: 2,560 Tokens', { size: 15, weight: 700 })
    a.text(646, 370, 'Fits in 4,096 context window', { size: 15, color: k.mid })

    // Summary footer
    a.rect(40, 415, 780, 55, { fill: tint(k.c.bg, 0.05), stroke: k.line, r: 6 })
    a.text(
        56,
        442,
        'Insight: Raw visual patches and audio frames overwhelm transformer context without connector compression.',
        { size: 15, color: k.mid },
    )

    return a.render()
}

export default create('dark')
