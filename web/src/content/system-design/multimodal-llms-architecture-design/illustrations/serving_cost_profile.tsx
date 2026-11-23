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
    'Multimodal serving cache hierarchy showing four request execution paths against five pipeline stages. Cold requests execute vision encoding, projection, prefix prefill, query prefill, and decode. A feature cache hit reuses visual encoding. A projected token hit reuses encoding and connector projection. A prefix key-value cache hit reuses all visual processing and shared-prefix prefill, leaving only query prefill and answer decode.'

export function create(theme: ThemeMode = 'dark') {
    const k = pk(theme),
        a = canvas(k, width, height)

    // Header
    a.text(40, 32, 'Multimodal Serving Cache Hierarchy & Work Avoidance', { size: 22, weight: 700 })
    a.text(
        40,
        58,
        'Work execution matrix comparing Cold requests against Feature, Projection, and Prefix-KV cache hits',
        { size: 15, color: k.mid },
    )

    const cols = [
        { name: '1. Cold Request', tag: 'No Cache', x: 230, tone: k.fail },
        { name: '2. Feature Cache', tag: 'ViT Embedding', x: 375, tone: k.state },
        { name: '3. Projected Token', tag: 'Connector Latents', x: 520, tone: k.prefill },
        { name: '4. Prefix KV Cache', tag: 'PagedAttention', x: 665, tone: k.pass },
    ]

    const stages = [
        { name: '1. Vision / Audio Encode', cold: true, feat: false, proj: false, pkv: false },
        { name: '2. Connector Projection', cold: true, feat: true, proj: false, pkv: false },
        { name: '3. Shared-Prefix Prefill', cold: true, feat: true, proj: true, pkv: false },
        { name: '4. New-Query Prefill', cold: true, feat: true, proj: true, pkv: true },
        { name: '5. Autoregressive Decode', cold: true, feat: true, proj: true, pkv: true },
    ]

    // Background container for table
    a.rect(40, 85, 780, 295, { fill: tint(k.c.bg, 0.05), stroke: k.line, r: 8 })

    // Column Headers
    a.text(56, 120, 'Pipeline Stage', { size: 15, weight: 700 })

    cols.forEach((col) => {
        a.rect(col.x, 95, 130, 44, { fill: tint(col.tone, 0.1), stroke: tint(col.tone, 0.3), r: 6 })
        a.text(col.x + 65, 110, col.name, {
            size: 15,
            weight: 700,
            color: col.tone,
            align: 'center',
        })
        a.text(col.x + 65, 128, col.tag, { size: 15, color: k.mid, align: 'center' })
    })

    // Rows
    stages.forEach((stage, rIdx) => {
        const y = 145 + rIdx * 45
        // Row line
        a.line(56, y + 42, 800, y + 42, tint(k.line, 0.4), { width: 1 })

        // Stage label
        a.text(56, y + 22, stage.name, { size: 15, weight: 600 })

        // 4 Columns
        const flags = [stage.cold, stage.feat, stage.proj, stage.pkv]
        flags.forEach((runs, cIdx) => {
            const col = cols[cIdx]
            const cellX = col.x + 35
            if (runs) {
                // Compute indicator
                a.dot(cellX + 28, y + 20, 9, tint(k.fail, 0.4))
                a.text(cellX + 28, y + 20, 'RUN', {
                    size: 15,
                    weight: 700,
                    color: k.fail,
                    align: 'center',
                })
            } else {
                // Reuse badge
                a.rect(cellX + 6, y + 8, 48, 24, {
                    fill: tint(k.pass, 0.15),
                    stroke: tint(k.pass, 0.4),
                    r: 4,
                })
                a.text(cellX + 30, y + 20, 'REUSE', {
                    size: 15,
                    weight: 700,
                    color: k.pass,
                    align: 'center',
                })
            }
        })
    })

    // Bottom Summary Cards
    const cards = [
        {
            title: 'Cold Request: 100% Latency',
            desc: 'Full vision tower + projection + quadratic prefill + decode.',
            tone: k.fail,
            x: 40,
            w: 245,
        },
        {
            title: 'Token Projection Hit: ~60% TTFT',
            desc: 'Avoids ViT computation & projector; requires full KV prefill.',
            tone: k.prefill,
            x: 305,
            w: 245,
        },
        {
            title: 'Prefix KV Hit: ~10% TTFT',
            desc: 'Reuses precomputed key-values directly from memory.',
            tone: k.pass,
            x: 570,
            w: 250,
        },
    ]

    cards.forEach((card) => {
        a.rect(card.x, 395, card.w, 80, {
            fill: tint(card.tone, 0.08),
            stroke: tint(card.tone, 0.3),
            r: 6,
        })
        a.text(card.x + 14, 420, card.title, { size: 15, weight: 700, color: card.tone })
        a.text(card.x + 14, 448, card.desc, { size: 15, color: k.mid })
    })

    return a.render()
}

export default create('dark')
