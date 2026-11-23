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
    'Visual token scaling comparison. With 14-pixel patches, square still images at 224, 448, and 672 pixels generate 256, 1,024, and 2,304 patch tokens respectively. Sixty seconds of 224-pixel video at 2 frames per second generates 30,720 tokens, exceeding a standard 4,096-token context limit by 7.5 times.'

export function create(theme: ThemeMode = 'dark') {
    const k = pk(theme),
        a = canvas(k, width, height)

    // Header
    a.text(40, 32, 'Visual Token Scaling: Stills vs. Video Explosion', { size: 22, weight: 700 })
    a.text(
        40,
        58,
        'Patch token counts (14×14 patch size) compared against a 4,096-token transformer context limit',
        { size: 15, color: k.mid },
    )

    // Chart container
    a.rect(40, 85, 520, 385, { fill: tint(k.c.bg, 0.05), stroke: k.line, r: 8 })

    // Reference limit line at 4,096 tokens
    const limitX = 200 + (4096 / 32768) * 300 // 200 + 37.5 = 237.5
    a.line(limitX, 105, limitX, 440, k.mid, { dash: '4 4', width: 1.5 })
    a.text(limitX - 10, 100, '4,096 Context', {
        size: 15,
        weight: 700,
        color: k.mid,
        align: 'center',
    })

    const rows = [
        { label: '224px Still', detail: '16×16 = 256 tokens', tokens: 256, tone: k.pass, y: 125 },
        {
            label: '448px Still',
            detail: '32×32 = 1,024 tokens',
            tokens: 1024,
            tone: k.pass,
            y: 190,
        },
        {
            label: '672px High-Res',
            detail: '48×48 = 2,304 tokens',
            tokens: 2304,
            tone: k.state,
            y: 255,
        },
        { label: 'Context Limit', detail: 'Single turn: 4,096', tokens: 4096, tone: k.mid, y: 320 },
        {
            label: '60s Video (2 fps)',
            detail: '120 frames = 30,720',
            tokens: 30720,
            tone: k.fail,
            y: 385,
        },
    ]

    rows.forEach((row) => {
        a.text(56, row.y + 12, row.label, { size: 15, weight: 700 })
        a.text(56, row.y + 32, row.detail, { size: 15, color: k.mid })

        // Bar track
        a.rect(200, row.y + 8, 300, 24, { fill: tint(k.c.bg, 0.1), r: 4 })

        // Value bar
        const barW = Math.max(8, Math.min(300, (row.tokens / 32768) * 300))
        a.rect(200, row.y + 8, barW, 24, { fill: row.tone, r: 4 })

        // Value text
        a.text(200 + barW + 10, row.y + 20, row.tokens.toLocaleString(), {
            size: 15,
            weight: 700,
            color: row.tone,
        })
    })

    // Right Column: Architectural Analysis & Solutions
    a.rect(580, 85, 240, 385, { fill: tint(k.c.bg, 0.05), stroke: k.line, r: 8 })
    a.cell(596, 102, 115, 24, 'SYSTEM IMPACT', {
        fill: tint(k.fail, 0.15),
        stroke: tint(k.fail, 0.4),
        color: k.fail,
        weight: 700,
    })
    a.text(596, 145, 'Prefill & Memory Crisis', { size: 16, weight: 700, color: k.fail })

    a.rect(596, 165, 208, 95, { fill: tint(k.fail, 0.06), stroke: tint(k.fail, 0.25), r: 6 })
    a.text(606, 188, 'Video Explodes Context', { size: 15, weight: 700, color: k.fail })
    a.text(606, 212, '30,720 tokens = 7.5× context.', { size: 15, color: k.mid })
    a.text(606, 236, 'Quadratic self-attention cost.', { size: 15, color: k.mid })

    a.rect(596, 275, 208, 175, { fill: tint(k.pass, 0.06), stroke: tint(k.pass, 0.25), r: 6 })
    a.text(606, 300, 'Required Mitigations', { size: 15, weight: 700, color: k.pass })
    a.text(606, 326, '1. Dynamic Tiling:', { size: 15, weight: 600 })
    a.text(606, 348, '   Tile high-salience crops only', { size: 15, color: k.mid })
    a.text(606, 372, '2. 3D Spatiotemporal Pooling:', { size: 15, weight: 600 })
    a.text(606, 394, '   Merge 2×2 spatial & time tokens', { size: 15, color: k.mid })
    a.text(606, 418, '3. Perceiver Latents (e.g. 64)', { size: 15, weight: 600, color: k.pass })

    // Arrow connecting video row to impact card
    a.arrow(505, 400, 596, 215, k.fail, { width: 1.5 })

    return a.render()
}

export default create('dark')
