import React from 'react'
import { GraphDiagram, Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'GraphRAG & Knowledge Graphs. A source-linked path connects inference-api to redis-cache, then to an old maxmemory policy. Use the linked records to test the cache-policy hypothesis.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const text = (value: string, top: number, size: number, color = c.textPrimary) =>
        React.createElement('div', { key: value, style: {
            position: 'absolute', top, left: 0, display: 'flex',
            fontFamily: 'Inter', fontSize: size, fontWeight: 650,
            width: 1096, color, lineHeight: 1.15,
        } }, value)
    return Scene({ c, background: c.bg, padding: 52, gap: 0, contentWidth: 1096,
        children: React.createElement('div', { style: { position: 'relative', display: 'flex', width: 1096, height: 526 } },
            text('GraphRAG & Knowledge Graphs', 0, 48),
            text('FOLLOW THE EVIDENCE', 105, 18, c.textSecondary),
            React.createElement('div', { style: { position: 'absolute', display: 'flex', left: 0, top: 159 } },
                GraphDiagram({ c: { ...c, preset: 'engineering', shadow: 'transparent', textPrimary: '#172033', textMuted: '#334155' },
                    width: 1096, height: 226, layout: 'manual', nodeWidth: 234, nodeHeight: 88,
                    labelFontSize: 20, detailFontSize: 16, padding: 10,
                    nodes: [
                        { id: 'api', label: 'inference-api', detail: 'service', x: .13, y: .5, tone: 'blue' },
                        { id: 'cache', label: 'redis-cache', detail: 'dependency', x: .5, y: .5, tone: 'purple' },
                        { id: 'policy', label: 'maxmemory policy', detail: 'configuration', x: .87, y: .5, tone: 'warm' },
                    ],
                    edges: [
                        { from: 'api', to: 'cache', label: 'source 1842', tone: 'blue' },
                        { from: 'cache', to: 'policy', label: 'source 2031', tone: 'warm' },
                    ],
                })),
            text('Test the cache-policy hypothesis with source records.', 400, 26, c.textSecondary),
            text('LeetLLM', 492, 27, theme === 'dark' ? '#a78bfa' : '#6d28d9'),
        ),
    })
}

export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), {
        width, height, outputPath, scale: 1, crop: false, watermark: false,
        background: 'theme', theme,
    })
    if (result.pixelWidth !== width || result.pixelHeight !== height) {
        throw new Error(`Unexpected banner size: ${result.pixelWidth}x${result.pixelHeight}`)
    }
    return result
}

export default create('dark')
