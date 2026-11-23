import React from 'react'
import { Column, GraphDiagram, Row, Scene, TextLabel, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Semantic Caching & Cost Optimization. Authorize and scope the request before assessing a candidate. Eligible, validated hits reuse an answer; misses take the authorized fresh path. Similarity is not permission.'
export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = { ...getThemeColors(theme, theme === 'light' ? 'engineering' : 'default'), preset: 'engineering' as const, shadow: 'transparent' }
    return Scene({ c, background: c.bg, padding: 52, gap: 28, contentWidth: 1096,
        children: Column({ gap: 30, children: [
            React.createElement('div', { style: { display: 'flex', flexDirection: 'column', color: c.textPrimary, fontFamily: 'Inter', fontSize: 51, fontWeight: 750, lineHeight: 1.1, letterSpacing: 1 } },
                React.createElement('div', null, 'Semantic Caching'),
                React.createElement('div', null, '& Cost Optimization')),
            TextLabel({ c, text: 'Similarity is not permission.', fontSize: 29 }),
            GraphDiagram({ c: { ...c, textPrimary: getThemeColors('light', 'engineering').textPrimary }, width: 1060, height: 220, layout: 'manual',
                nodes: [
                    { id: 'scope', label: 'Authorize + scope', x: .13, y: .5, width: 235, height: 64, tone: 'purple' },
                    { id: 'gates', label: 'Candidate gates', x: .47, y: .5, width: 220, height: 64, tone: 'cyan' },
                    { id: 'reuse', label: 'Reuse answer', x: .85, y: .16, width: 230, height: 64, tone: 'green' },
                    { id: 'fresh', label: 'Fresh path', x: .85, y: .84, width: 230, height: 64, tone: 'warm' },
                ],
                edges: [{ from: 'scope', to: 'gates' }, { from: 'gates', to: 'reuse', label: 'hit' }, { from: 'gates', to: 'fresh', label: 'miss' }],
            }),
            Row({ width: 1096, justify: 'end', children: TextLabel({ c, text: 'LeetLLM', fontSize: 27, color: c.primaryLight }) }),
        ] }),
    })
}
export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), { width, height, outputPath, scale: 1, crop: false, watermark: false, background: 'theme', theme })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Unexpected banner dimensions')
    return result
}
export default create('dark')
