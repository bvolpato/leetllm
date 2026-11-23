import React from 'react'
import { GraphDiagram, Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Hybrid Search: Dense + Sparse. Rank fusion combines lexical BM25 matches and dense vector similarities inside a permitted candidate set.'
export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const base = getThemeColors(theme)
    const c = { ...base, textMuted: base.textSecondary, shadow: 'transparent' }
    const label = (value: string, top: number, fontSize: number, color = c.textPrimary) =>
        React.createElement('div', { style: { position: 'absolute', display: 'flex', left: 0,
            top, width: 1092, fontFamily: 'Inter', fontSize, color, fontWeight: 650, letterSpacing: 0.3,
        } }, value)
    return Scene({ c, background: c.bg, padding: 54, contentWidth: 1092,
        children: React.createElement('div', { style: { position: 'relative', display: 'flex', width: 1092, height: 522 } },
            label('Hybrid Search: Dense + Sparse', 0, 49),
            label('Two signals. One permitted candidate set.', 86, 29, c.textSecondary),
            React.createElement('div', { style: { position: 'absolute', display: 'flex', left: 0, top: 145 } },
                GraphDiagram({ c, width: 1092, height: 290, padding: 26, layout: 'manual',
                    nodeWidth: 224, nodeHeight: 82, labelFontSize: 25, detailFontSize: 19, arrowSize: 6,
                    nodes: [
                        { id: 'sparse', label: 'BM25', detail: 'KROT-14', x: 0.12, y: 0.08, tone: 'blue' },
                        { id: 'dense', label: 'Dense', detail: 'paraphrase vector', x: 0.12, y: 0.92, tone: 'purple' },
                        { id: 'fuse', label: 'Rank fusion', detail: 'sum rank votes', x: 0.51, y: 0.50, tone: 'cyan' },
                        { id: 'candidates', label: 'Candidates', detail: 'test selection', x: 0.90, y: 0.50, tone: 'green' },
                    ],
                    edges: [
                        { from: 'sparse', to: 'fuse', tone: 'blue' },
                        { from: 'dense', to: 'fuse', tone: 'purple' },
                        { from: 'fuse', to: 'candidates', tone: 'green' },
                    ],
                })),
            label('Rank fusion combines lexical BM25 and dense semantic signals.', 449, 23, c.textSecondary),
            React.createElement('div', { style: { position: 'absolute', display: 'flex', right: 0, top: 495,
                fontFamily: 'Inter', fontSize: 25, fontWeight: 700, color: c.primaryLight } }, 'LeetLLM'),
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
