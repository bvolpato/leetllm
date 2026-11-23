import React from 'react'
import { Column, Row, Scene, TextLabel, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

// From web/: pnpm exec tsx -e "import { renderBanner } from './src/content/fundamentals/dimensionality-reduction-embeddings/social_banner.tsx'; renderBanner('./src/content/fundamentals/dimensionality-reduction-embeddings/social_banner.png')"
export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Dimensionality Reduction for Embeddings. A full 1536-dimensional float32 vector takes 6144 bytes; a 256-dimensional vector takes 1024 bytes. Proportional bars show the sixfold raw-storage reduction, while retrieval quality still needs measurement.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const base = getThemeColors(theme)
    const c = { ...base, preset: 'engineering' as const, shadow: 'transparent' }
    const purple = theme === 'dark' ? '#a78bfa' : '#6d28d9'
    const cyan = theme === 'dark' ? '#22d3ee' : '#0891b2'
    const bar = (dimensions: number, color: string) => React.createElement('div', { style: {
        display: 'flex', width: 1020, height: 46, backgroundColor: c.bgCard,
    } }, React.createElement('div', { style: {
        display: 'flex', width: 1020 * dimensions / 1536, height: 46, backgroundColor: color,
    } }))
    return Scene({ c, background: c.bg, padding: 52, gap: 28, contentWidth: 1096, children: Column({ gap: 24, children: [
        React.createElement('div', { key: 'title', style: { display: 'flex', flexDirection: 'column', color: c.textPrimary, fontFamily: 'Inter', fontSize: 51, fontWeight: 750, lineHeight: 1.08, letterSpacing: 1 } },
            React.createElement('div', null, 'Dimensionality Reduction'),
            React.createElement('div', null, 'for Embeddings')),
        TextLabel({ c, text: '1536 → 256 float32 coordinates', fontSize: 26, color: c.textSecondary }),
        Column({ gap: 12, children: [
            TextLabel({ c, text: 'Full vector: 6144 bytes', fontSize: 22 }),
            bar(1536, purple),
            TextLabel({ c, text: 'Short vector: 1024 bytes', fontSize: 22 }),
            bar(256, cyan),
        ] }),
        TextLabel({ c, text: '6× less raw storage. Measure what retrieval loses.', fontSize: 28 }),
        Row({ width: 1096, justify: 'end', children: TextLabel({ c, text: 'LeetLLM', fontSize: 27, color: purple }) }),
    ] }) })
}
export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), { width, height, outputPath, scale: 1, crop: false, watermark: false, background: 'theme', theme })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Unexpected banner dimensions')
    return result
}
export default create('dark')
