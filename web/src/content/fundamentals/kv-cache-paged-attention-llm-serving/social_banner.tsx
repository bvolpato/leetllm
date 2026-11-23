import React from 'react'
import { GraphDiagram, Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'KV Cache & PagedAttention. Request A has three cached positions in two-token blocks. Its logical blocks map to physical blocks 3 and 1, preserving token order without contiguous physical placement.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const text = (value: string, top: number, size: number, color = c.textPrimary) =>
        React.createElement('div', { key: value, style: {
            position: 'absolute', display: 'flex', top, left: 0, width: 1096,
            fontFamily: 'Inter', color, fontSize: size, fontWeight: 650, lineHeight: 1.15,
        } }, value)
    return Scene({ c, background: c.bg, padding: 52, gap: 0, contentWidth: 1096,
        children: React.createElement('div', { style: { display: 'flex', position: 'relative', width: 1096, height: 526 } },
            text('KV Cache & PagedAttention', 0, 51),
            text('Logical order, scattered physical storage', 85, 25, c.textSecondary),
            React.createElement('div', { style: { position: 'absolute', top: 151, left: 0, display: 'flex' } },
                GraphDiagram({ c: { ...c, preset: 'engineering', shadow: 'transparent', textPrimary: '#172033', textMuted: '#334155' },
                    width: 1096, height: 280, layout: 'manual', nodeWidth: 310, nodeHeight: 84,
                    labelFontSize: 23, detailFontSize: 18,
                    nodes: [
                        { id: 'l0', label: 'A: logical block 0', detail: 'token positions 0, 1', x: .19, y: .23, tone: 'purple' },
                        { id: 'l1', label: 'A: logical block 1', detail: 'token position 2', x: .19, y: .77, tone: 'cyan' },
                        { id: 'p3', label: 'Physical block 3', detail: 'two occupied slots', x: .81, y: .23, tone: 'purple' },
                        { id: 'p1', label: 'Physical block 1', detail: 'one occupied slot', x: .81, y: .77, tone: 'cyan' },
                    ],
                    edges: [
                        { from: 'l0', to: 'p3', label: 'table[0] = 3', tone: 'purple' },
                        { from: 'l1', to: 'p1', label: 'table[1] = 1', tone: 'cyan' },
                    ],
                })),
            text('Two-token blocks · A’s block table: [3, 1]', 450, 23, c.textSecondary),
            text('LeetLLM', 501, 25, theme === 'dark' ? '#a78bfa' : '#6d28d9'),
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
