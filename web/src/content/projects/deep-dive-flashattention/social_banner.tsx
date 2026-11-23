import React from 'react'
import { BadgePill, FlowArrow, Grid, Panel, Row, Scene, TextLabel, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Deep Dive: FlashAttention. Stream score tiles, rescale the running normalizer and numerator, then normalize once. The worked two-tile example gives output [4.380,5.620], rounded, without keeping a full score matrix.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const line = (text: string, size = 23) => TextLabel({ c, text, fontSize: size, mono: true, align: 'center', width: '100%' })
    return Scene({ c, background: c.bg, padding: 50, contentWidth: 1100, gap: 22, children: [
        TextLabel({ c, text: 'Deep Dive: FlashAttention', fontSize: 52, fontWeight: 750, width: 1100 }),
        TextLabel({ c, text: 'Exact attention. Streamed tiles. Compact row state.', fontSize: 25, color: c.textSecondary, width: 1100 }),
        Row({ gap: 20, align: 'stretch', justify: 'center', children: [
            Panel({ c, title: 'Score tiles', titleFontSize: 22, tone: 'blue', width: 310, padding: 22, gap: 20, children: [
                Grid({ c, rows: [[{ label: '1', tone: 'blue' }, { label: '2', tone: 'blue' }], [{ label: '3', tone: 'warm' }, { label: '0', tone: 'warm' }]], cellWidth: 122, cellHeight: 62, fontSize: 30, gap: 6 }),
                line('one row, two tiles', 20),
            ] }),
            FlowArrow({ c, direction: 'right', length: 35, tone: 'warm' }),
            Panel({ c, title: 'Rescale + merge', titleFontSize: 22, tone: 'warm', width: 310, padding: 22, gap: 24, children: [
                line('m: 2 → 3', 29),
                BadgePill({ c, text: 'α = exp(2 − 3)', tone: 'warm', fontSize: 24, width: 266, height: 54 }),
                line('rescale old ℓ and u', 21),
            ] }),
            FlowArrow({ c, direction: 'right', length: 35, tone: 'green' }),
            Panel({ c, title: 'Normalize once', titleFontSize: 22, tone: 'green', width: 310, padding: 22, gap: 24, children: [
                line('O = u / ℓ', 30),
                line('[4.380, 5.620]', 27),
                line('matches dense softmax', 19),
            ] }),
        ] }),
        TextLabel({ c, text: 'No full score matrix retained. Values shown rounded.', fontSize: 23, color: c.textSecondary, width: 1100 }),
        TextLabel({ c, text: 'LeetLLM', fontSize: 24, fontWeight: 700, width: 1100, align: 'right' }),
    ] })
}
export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), {
        width, height, outputPath, scale: 1, crop: false, watermark: false,
        background: 'theme', theme,
    })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Banner dimensions changed')
    return result
}
export default create('dark')
