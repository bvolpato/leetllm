import React from 'react'
import { GraphDiagram, Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Deep Dive - Transformers. A pinned checkpoint supplies model configuration and weights; a tokenizer turns text into IDs for the selected model, which returns logits.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme)
    const graph = getThemeColors('light', 'engineering')
    return Scene({
        c, background: c.bg, padding: 48, gap: 22, contentWidth: 1104,
        children: [
            React.createElement('div', { key: 'title', style: {
                display: 'flex', fontSize: 49, fontWeight: 750, color: c.textPrimary,
            } }, 'Deep Dive - Transformers'),
            React.createElement('div', { key: 'subtitle', style: {
                display: 'flex', fontSize: 25, color: c.textSecondary,
            } }, 'Follow one checkpoint from identity to logits.'),
            GraphDiagram({
                c: graph, width: 1100, height: 335, nodeWidth: 220, nodeHeight: 78,
                labelFontSize: 23, detailFontSize: 17, padding: 18,
                nodes: [
                    { id: 'snapshot', label: 'Pinned snapshot', detail: 'config + weights', x: 0.51, y: 0.15, tone: 'purple' },
                    { id: 'tokens', label: 'Tokenizer', detail: 'text to IDs', x: 0.15, y: 0.78, tone: 'cyan' },
                    { id: 'model', label: 'Model class', detail: 'forward(input_ids)', x: 0.51, y: 0.78, tone: 'blue' },
                    { id: 'logits', label: 'Logits', detail: 'next-token scores', x: 0.87, y: 0.78, tone: 'green' },
                ],
                edges: [
                    { from: 'snapshot', to: 'model', tone: 'purple' },
                    { from: 'tokens', to: 'model', tone: 'cyan' },
                    { from: 'model', to: 'logits', tone: 'green' },
                ],
            }),
            React.createElement('div', { key: 'brand', style: {
                display: 'flex', justifyContent: 'flex-end', width: 1104,
                color: c.primaryLight, fontSize: 25, fontWeight: 700,
            } }, 'LeetLLM'),
        ],
    })
}

export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), {
        width, height, outputPath, theme, scale: 1, crop: false,
        background: 'theme', watermark: false,
    })
    if (result.pixelWidth !== width || result.pixelHeight !== height) {
        throw new Error(`Unexpected banner size: ${result.pixelWidth}x${result.pixelHeight}`)
    }
    return result
}

export default create('dark')
