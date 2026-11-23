import React from 'react'
import { Scene, Row, Column, TiledMatrix, FlowArrow, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'FlashAttention & Memory Efficiency. Full attention scores occupy a square matrix in HBM; FlashAttention processes small score tiles on chip and saves a row-statistic vector. Same dense operator, no full score matrix.'

export function create(theme: ThemeMode = 'dark') {
    const c = { ...getThemeColors(theme, theme === 'light' ? 'engineering' : 'default'), shadow: 'transparent' }
    const label = (text: string, size: number, color = c.textPrimary) => React.createElement('div', {
        style: { display: 'flex', fontFamily: 'Inter', fontSize: size, fontWeight: 650, color },
    }, text)
    return Scene({
        c, background: c.bg, padding: 48, gap: 30, contentWidth: 1104,
        children: [
            label('FlashAttention & Memory Efficiency', 42),
            Row({ gap: 48, align: 'center', justify: 'center', children: [
                Column({ gap: 16, align: 'center', children: [
                    label('FULL SCORES IN HBM', 21, c.critical),
                    TiledMatrix({ c, rows: 7, cols: 7, cellSize: 27, tone: 'red',
                        regions: [{ rowStart: 0, rowEnd: 7, colStart: 0, colEnd: 7, tone: 'red' }] }),
                    label('Quadratic intermediate', 23),
                ] }),
                FlowArrow({ c, direction: 'right', length: 62, tone: 'purple' }),
                Column({ gap: 26, align: 'center', children: [
                    label('TILES ON CHIP', 21, c.positive),
                    Row({ gap: 24, align: 'center', children: [
                        TiledMatrix({ c, rows: 3, cols: 3, cellSize: 31, tone: 'blue',
                            regions: [{ rowStart: 0, rowEnd: 3, colStart: 0, colEnd: 3, tone: 'blue' }] }),
                        FlowArrow({ c, direction: 'right', length: 30, tone: 'green' }),
                        TiledMatrix({ c, rows: 7, cols: 1, cellSize: 24, tone: 'green',
                            regions: [{ rowStart: 0, rowEnd: 7, colStart: 0, colEnd: 1, tone: 'green' }] }),
                    ] }),
                    label('Linear saved row statistics', 23),
                ] }),
            ] }),
            label('Same dense operator. No full score matrix.', 27, c.textSecondary),
            Row({ justify: 'end', children: label('LeetLLM', 26, c.accent) }),
        ],
    })
}

export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), {
        width, height, outputPath, scale: 1, crop: false, watermark: false,
        background: 'theme', theme,
    })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Unexpected banner dimensions')
    return result
}
export default create('dark')
