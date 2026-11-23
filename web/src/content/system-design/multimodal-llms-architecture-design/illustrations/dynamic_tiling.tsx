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
    'Dynamic high-resolution image tiling architecture. A high-resolution image decomposes into a downsampled global overview thumbnail for spatial context and selected high-resolution crops for fine OCR and detail. Patch tokens from both views are concatenated into a structured sequence with coordinate-preserving separator tokens.'

export function create(theme: ThemeMode = 'dark') {
    const k = pk(theme),
        a = canvas(k, width, height)

    // Header
    a.text(40, 32, 'Dynamic High-Resolution Tiling & Token Packaging', { size: 22, weight: 700 })
    a.text(
        40,
        58,
        'Decomposing large visual documents into macro global context and micro high-res local crops',
        { size: 15, color: k.mid },
    )

    // Column 1: High-Res Input & Grid (Left)
    a.rect(40, 85, 240, 385, { fill: tint(k.c.bg, 0.05), stroke: k.line, r: 8 })
    a.cell(56, 102, 160, 24, 'INPUT RESOLUTION', {
        fill: tint(k.decode, 0.15),
        stroke: tint(k.decode, 0.4),
        color: k.decode,
        weight: 700,
    })
    a.text(56, 148, 'High-Res Image (1344×896)', { size: 15, weight: 700, color: k.prefill })

    // Draw 3x2 grid of tiles
    const gridX = 56,
        gridY = 168,
        cellW = 65,
        cellH = 50
    for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 3; c++) {
            const x = gridX + c * (cellW + 4)
            const y = gridY + r * (cellH + 4)
            const isCrop1 = r === 1 && c === 0
            const isCrop2 = r === 0 && c === 2
            const fill = isCrop1
                ? tint(k.pass, 0.25)
                : isCrop2
                  ? tint(k.wait, 0.25)
                  : tint(k.c.bg, 0.12)
            const stroke = isCrop1 ? k.pass : isCrop2 ? k.wait : k.line
            a.rect(x, y, cellW, cellH, { fill, stroke, r: 4 })
            a.text(x + 10, y + 25, `Tile ${r * 3 + c + 1}`, {
                size: 15,
                weight: 600,
                color: isCrop1 ? k.pass : isCrop2 ? k.wait : k.mid,
            })
        }
    }

    a.rect(56, 285, 205, 75, { fill: tint(k.pass, 0.08), stroke: tint(k.pass, 0.3), r: 6 })
    a.text(66, 310, 'Active Crop 1 (Tile 4)', { size: 15, weight: 700, color: k.pass })
    a.text(66, 335, 'Bottom Axis / Fine Timestamps', { size: 15, color: k.mid })

    a.rect(56, 375, 205, 75, { fill: tint(k.wait, 0.08), stroke: tint(k.wait, 0.3), r: 6 })
    a.text(66, 400, 'Active Crop 2 (Tile 3)', { size: 15, weight: 700, color: k.wait })
    a.text(66, 425, 'Upper-Right Metric Badge', { size: 15, color: k.mid })

    // Column 2: Tiling Decomposition Process (Center)
    a.rect(305, 85, 230, 385, { fill: tint(k.c.bg, 0.05), stroke: k.line, r: 8 })
    a.cell(321, 102, 145, 24, 'TRANSFORMATION', {
        fill: tint(k.wait, 0.15),
        stroke: tint(k.wait, 0.4),
        color: k.wait,
        weight: 700,
    })
    a.text(321, 148, 'Multi-Scale Views', { size: 15, weight: 700, color: k.state })

    // Global view card
    a.rect(321, 168, 198, 95, { fill: tint(k.prefill, 0.08), stroke: tint(k.prefill, 0.3), r: 6 })
    a.text(333, 192, 'Global View (Resized)', { size: 15, weight: 700, color: k.prefill })
    a.text(333, 218, 'Downsampled to 448×448', { size: 15, color: k.mid })
    a.text(333, 242, 'Captures macro layout structure', { size: 15, color: k.mid })

    // Local crops card
    a.rect(321, 280, 198, 110, { fill: tint(k.pass, 0.08), stroke: tint(k.pass, 0.3), r: 6 })
    a.text(333, 305, 'Selected Local Crops', { size: 15, weight: 700, color: k.pass })
    a.text(333, 330, 'Native 448×448 crops', { size: 15, color: k.mid })
    a.text(333, 355, 'Preserves pixel-level legibility', { size: 15, color: k.mid })
    a.text(333, 375, 'Normalized box: [y0, x0, y1, x1]', { size: 15, weight: 600, color: k.pass })

    // Arrows 1 -> 2
    a.arrow(280, 205, 321, 205, k.prefill, { width: 1.5 })
    a.arrow(280, 320, 321, 320, k.pass, { width: 1.5 })

    // Column 3: Token Sequence Assembly (Right)
    a.rect(560, 85, 260, 385, { fill: tint(k.c.bg, 0.05), stroke: k.line, r: 8 })
    a.cell(576, 102, 145, 24, 'TOKEN PACKAGING', {
        fill: tint(k.pass, 0.15),
        stroke: tint(k.pass, 0.4),
        color: k.pass,
        weight: 700,
    })
    a.text(576, 148, 'Concatenated Prefix', { size: 15, weight: 700, color: k.pass })

    const seqItems = [
        { tag: '<image_global>', label: '576 tokens (448px thumbnail)', tone: k.prefill, y: 168 },
        { tag: '<crop_tile_4>', label: '576 tokens (Bottom Axis)', tone: k.pass, y: 232 },
        { tag: '<crop_tile_3>', label: '576 tokens (Metric Badge)', tone: k.wait, y: 296 },
        { tag: '<user_prompt>', label: 'Did latency rise after deploy?', tone: k.mid, y: 360 },
    ]

    seqItems.forEach((item) => {
        a.rect(576, item.y, 228, 52, {
            fill: tint(item.tone, 0.1),
            stroke: tint(item.tone, 0.35),
            r: 5,
        })
        a.text(586, item.y + 18, item.tag, { size: 15, weight: 700, color: item.tone })
        a.text(586, item.y + 38, item.label, { size: 15, color: k.mid })
    })

    // Arrow 2 -> 3
    a.arrow(519, 215, 576, 195, k.prefill, { width: 1.5 })
    a.arrow(519, 335, 576, 260, k.pass, { width: 1.5 })

    a.text(576, 438, 'Total: 1,728 visual + text tokens', { size: 15, weight: 700, color: k.pass })

    return a.render()
}

export default create('dark')
