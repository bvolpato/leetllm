import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Embedding Similarity & Quantization. For 1536-dimensional vectors, FP32 codes use 6144 bytes, INT8 codes 1536 bytes, and PQ with 96 eight-bit centroid IDs uses 96 bytes. Shared codebooks and index overhead are extra.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme)
    const label = (text: string, top: number, size: number, left = 0, color = c.textPrimary, boxWidth = 1092) => React.createElement('div', {
        key: text, style: { display: 'flex', position: 'absolute', top, left, width: boxWidth, fontFamily: 'Inter', fontSize: size, fontWeight: 600, lineHeight: 1.15, color },
    }, text)
    const rows = [
        { name: 'FP32', bytes: 1536 * 4, color: c.primaryLight },
        { name: 'INT8', bytes: 1536, color: c.infoLight },
        { name: 'PQ-96', bytes: 96, color: c.positiveLight },
    ]
    return Scene({ c, background: c.bg, padding: 54, contentWidth: 1092,
        children: React.createElement('div', { style: { position: 'relative', display: 'flex', width: 1092, height: 522 } },
            label('Embedding Similarity', 0, 49),
            label('& Quantization', 60, 49),
            label('1536 DIMENSIONS • RAW CODE BYTES PER VECTOR', 153, 18, 0, c.textSecondary),
            ...rows.flatMap((row, i) => [
                label(row.name, 209 + i * 72, 25, 0, c.textPrimary, 130),
                React.createElement('div', { key: row.name, style: {
                    position: 'absolute', display: 'flex', top: 201 + i * 72, left: 145,
                    width: 715 * row.bytes / 6144, height: 44, backgroundColor: row.color,
                } }),
                label(`${row.bytes} B`, 209 + i * 72, 27, 907, c.textPrimary, 180),
            ]),
            label('PQ: 96 subspaces × one 8-bit centroid ID', 424, 24),
            label('Codebooks, index links, and rescore vectors are extra.', 463, 20, 0, c.textSecondary),
            label('LeetLLM', 494, 24, 940, c.primaryLight, 152),
        ),
    })
}

export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), {
        width, height, outputPath, theme, scale: 1, crop: false, watermark: false, background: 'theme',
    })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Unexpected banner dimensions')
    return result
}
export default create('dark')
