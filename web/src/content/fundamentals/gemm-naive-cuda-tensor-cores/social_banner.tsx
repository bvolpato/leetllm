import React from 'react'
import { Scene, TiledMatrix, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'GEMM: From CUDA to Tensor Cores. One thread owns one output, a register-blocked thread owns four outputs, and a WMMA warp cooperates on a whole tile. Three grids show these distinct ownership regions.'
export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const text = (label: string, left: number, top: number, size: number, color = c.textPrimary, boxWidth = 1088) =>
        React.createElement('div', { key: label, style: { position: 'absolute', display: 'flex',
            left, top, width: boxWidth, fontFamily: 'Inter', fontSize: size, fontWeight: 650,
            color, lineHeight: 1.15 } }, label)
    const grid = (left: number, cols: number, rowEnd: number, colEnd: number, tone: 'blue' | 'purple' | 'green') =>
        React.createElement('div', { key: left, style: { position: 'absolute', left, top: 252, display: 'flex' } },
            TiledMatrix({ c, rows: 4, cols, cellSize: 38, gap: 4, tone: 'neutral',
                regions: [{ rowStart: 0, rowEnd, colStart: 0, colEnd, tone }],
            }))
    return Scene({ c, padding: 56, gap: 0, background: c.bg, contentWidth: 1088,
        children: React.createElement('div', { style: { position: 'relative', display: 'flex', width: 1088, height: 518 } },
            text('GEMM', 0, 0, 34, c.primary),
            text('From CUDA to Tensor Cores', 0, 53, 49),
            text('OUTPUT OWNERSHIP', 0, 169, 18, c.textSecondary),
            text('One thread', 0, 210, 25, c.textPrimary, 320),
            text('One thread', 388, 210, 25, c.textPrimary, 320),
            text('One warp', 776, 210, 25, c.textPrimary, 300),
            grid(0, 4, 1, 1, 'blue'), grid(388, 4, 1, 4, 'purple'), grid(776, 4, 4, 4, 'green'),
            text('1 accumulator', 0, 432, 21, c.textSecondary, 320),
            text('4 accumulators', 388, 432, 21, c.textSecondary, 320),
            text('Cooperative tile', 776, 432, 21, c.textSecondary, 310),
            text('Schematic ownership, not physical fragment layout', 0, 492, 17, c.textSecondary, 820),
            text('LeetLLM', 948, 486, 25, c.primary, 140),
        ),
    })
}
export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), {
        width, height, outputPath, scale: 1, crop: false, watermark: false, background: 'theme', theme,
    })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Unexpected banner dimensions')
    return result
}
export default create('dark')
