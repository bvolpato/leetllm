import React from 'react'
import { Column, FlowArrow, Row, Scene, TiledMatrix, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Multimodal LLM Architecture. A chart region shows a 14:03 spike while a transcript span is spoken at 14:22. Record the chart event time separately from the transcript utterance time before combining them into a claim.'
export function create(theme: ThemeMode = 'dark') {
    const c = { ...getThemeColors(theme, theme === 'light' ? 'engineering' : 'default'), shadow: 'transparent' }
    const label = (text: string, size: number, color = c.textPrimary) => React.createElement('div', { style: { display: 'flex', color, fontFamily: 'Inter', fontSize: size, fontWeight: 650 } }, text)
    return Scene({ c, background: c.bg, padding: 48, gap: 36, contentWidth: 1104, children: [
        label('Multimodal LLM Architecture', 45),
        label('Keep evidence tied to source, region, and time.', 27, c.textSecondary),
        Row({ gap: 36, align: 'center', justify: 'center', children: [
            Column({ gap: 18, align: 'center', children: [
                label('CHART REGION', 22, c.secondary),
                TiledMatrix({ c, rows: 3, cols: 4, cellSize: 30, tone: 'blue', regions: [
                    { rowStart: 0, rowEnd: 3, colStart: 2, colEnd: 3, tone: 'warm' },
                ] }),
                label('14:03 spike', 26),
            ] }),
            label('+', 36, c.textSecondary),
            Column({ gap: 20, align: 'center', children: [
                label('TRANSCRIPT SPAN', 22, c.accent),
                label('“Before the rollback”', 24),
                label('14:22 utterance', 26),
            ] }),
            FlowArrow({ c, direction: 'right', length: 45, tone: 'neutral' }),
            Column({ gap: 20, children: [
                label('Check event', 28),
                label('alignment', 28),
            ] }),
        ] }),
        label('Utterance time ≠ event time', 31),
        Row({ justify: 'end', children: label('LeetLLM', 26, c.accent) }),
    ] })
}
export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), { width, height, outputPath, scale: 1, crop: false, watermark: false, background: 'theme', theme })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Unexpected banner dimensions')
    return result
}
export default create('dark')
