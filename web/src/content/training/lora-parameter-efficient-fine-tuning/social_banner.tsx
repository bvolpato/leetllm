import React from 'react'
import { Scene, TiledMatrix, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'LoRA and Parameter-Efficient Tuning. Add a scaled product of two trainable thin factors to a frozen square weight to form the adapted weight. Rank 16 on a 4096 by 4096 layer trains 131,072 values, 0.78 percent of the base weight count.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const accent = theme === 'dark' ? '#a78bfa' : '#6d28d9'
    const label = (text: string, left: number, top: number, size: number, color = c.textPrimary) =>
        React.createElement('div', { key: text, style: {
            position: 'absolute', left, top, fontFamily: 'Inter', fontSize: size,
            fontWeight: 650, color, lineHeight: 1.2,
        } }, text)
    const matrix = (title: string, left: number, top: number, rows: number, cols: number, tone: 'neutral' | 'purple' | 'cyan') =>
        React.createElement('div', { key: title, style: { position: 'absolute', left, top, display: 'flex' } },
            TiledMatrix({ c, rows, cols, cellSize: 23, gap: 3, tone, title,
                regions: [{ rowStart: 0, rowEnd: rows, colStart: 0, colEnd: cols, tone }],
            }))
    return Scene({ c, background: c.bg, padding: 48, gap: 0, contentWidth: 1104,
        children: React.createElement('div', { style: { position: 'relative', display: 'flex', width: 1104, height: 534 } },
            label('LoRA & Parameter-Efficient Tuning', 0, 0, 48),
            label('Keep the base. Learn two thin factors.', 0, 72, 28, c.textSecondary),
            matrix('Frozen W₀', 18, 170, 8, 8, 'neutral'),
            label('+ s ·', 257, 275, 35, accent),
            matrix('B', 364, 170, 8, 1, 'purple'),
            label('×', 430, 268, 38, accent),
            matrix('A', 493, 251, 1, 8, 'purple'),
            label('→', 745, 268, 40, accent),
            matrix('Adapted weight', 858, 170, 8, 8, 'cyan'),
            label('Schematic factors; r = 16 and s = α/r', 318, 409, 20, c.textSecondary),
            label('131,072 trainable values', 0, 470, 30, accent),
            label('0.78% of a 4096 × 4096 weight', 0, 509, 23, c.textSecondary),
            label('LeetLLM', 965, 510, 25, accent),
        ),
    })
}

export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), {
        width, height, outputPath, scale: 1, crop: false, watermark: false,
        background: 'theme', theme,
    })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Unexpected banner size')
    return result
}

export default create('dark')
