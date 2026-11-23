import React from 'react'
import { GraphDiagram, Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Deep Dive - FlashInfer. R2 has nine logical tokens on pages 3, 14, and 6, despite physical page order 3, 6, 14. The final page has only one valid slot. Attention follows the page list rather than sorting physical addresses.'
export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const ink = getThemeColors('light', 'engineering')
    const diagramColors = theme === 'light' ? { ...c, textPrimary: ink.textPrimary, textMuted: ink.textSecondary } : c
    const text = (label: string, top: number, size: number, color = c.textPrimary, left = 0, boxWidth = 1092) =>
        React.createElement('div', { key: label, style: { position: 'absolute', display: 'flex',
            left, top, width: boxWidth, fontFamily: 'Inter', fontSize: size, fontWeight: 650, color, lineHeight: 1.15 } }, label)
    return Scene({ c, background: c.bg, padding: 54, contentWidth: 1092, gap: 0,
        children: React.createElement('div', { style: { position: 'relative', display: 'flex', width: 1092, height: 522 } },
            text('Deep Dive - FlashInfer', 0, 52),
            text('Nine logical tokens. Three scattered pages. One exact attention result.', 77, 23, c.textSecondary),
            React.createElement('div', { style: { position: 'absolute', display: 'flex', left: 0, top: 151 } },
                GraphDiagram({ c: diagramColors, width: 1092, height: 290, nodeWidth: 274, nodeHeight: 80,
                    labelFontSize: 23, detailFontSize: 17, arrowSize: 5,
                    nodes: [
                        { id: 'l0', label: 'Tokens 0..3', detail: 'page-list entry 0', x: 0.02, y: 0.02, tone: 'blue' },
                        { id: 'l1', label: 'Tokens 4..7', detail: 'page-list entry 1', x: 0.50, y: 0.02, tone: 'purple' },
                        { id: 'l2', label: 'Token 8', detail: 'page-list entry 2', x: 0.98, y: 0.02, tone: 'warm' },
                        { id: 'p3', label: 'Page 3', detail: '4 valid slots', x: 0.02, y: 0.98, tone: 'blue' },
                        { id: 'p6', label: 'Page 6', detail: '1 valid slot', x: 0.50, y: 0.98, tone: 'warm' },
                        { id: 'p14', label: 'Page 14', detail: '4 valid slots', x: 0.98, y: 0.98, tone: 'purple' },
                    ],
                    edges: [
                        { from: 'l0', to: 'p3', tone: 'blue', arrow: 'none' },
                        { from: 'l1', to: 'p14', tone: 'purple', arrow: 'none' },
                        { from: 'l2', to: 'p6', tone: 'warm', style: 'dashed', arrow: 'none' },
                    ],
                })),
            text('Read page IDs [3, 14, 6] in logical order.', 490, 22, c.textSecondary, 0, 860),
            text('LeetLLM', 486, 25, c.primary, 942, 150),
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
