import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Prefix Caching and Prompt Caching. Two different questions share one stable 6,000-token guide. Reuse the prefix KV state; compute each new question and answer.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const accent = theme === 'dark' ? '#5ed5c0' : '#087e70'
    const purple = theme === 'dark' ? '#b99cf5' : '#7043bc'
    return Scene({ c, background: c.bg, padding: 52, gap: 0, contentWidth: 1096,
        children: React.createElement('div', { style: { display: 'flex', height: 526, flexDirection: 'column' } },
            React.createElement('div', { style: { display: 'flex', fontSize: 49, fontWeight: 750, color: c.textPrimary, lineHeight: 1.12, width: 1000 } }, 'Prefix Caching and Prompt Caching'),
            React.createElement('div', { style: { display: 'flex', marginTop: 26, fontSize: 25, color: c.textSecondary } }, 'Reuse the guide. Compute the new question.'),
            ...['Why did this test fail?', 'How do I fix this lint error?'].map((question, index) => React.createElement('div', { key: question, style: { display: 'flex', gap: 22, marginTop: index === 0 ? 54 : 22, height: 92 } },
                React.createElement('div', { style: { display: 'flex', width: 555, border: `2px solid ${accent}`, background: `${accent}14`, color: c.textPrimary, borderRadius: 10, padding: 22, alignItems: 'center', fontSize: 27, fontWeight: 650 } }, 'Same 6,000-token guide'),
                React.createElement('div', { style: { display: 'flex', width: 510, border: `2px solid ${purple}`, borderRadius: 10, padding: 20, alignItems: 'center', color: c.textPrimary, fontSize: 25 } }, question),
            )),
            React.createElement('div', { style: { display: 'flex', marginTop: 24, justifyContent: 'space-between', fontSize: 21, color: accent } }, 'Exact prefix + compatible state + correct scope', React.createElement('span', { style: { color: purple, fontWeight: 700 } }, 'LeetLLM')),
        ),
    })
}
export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), { width, height, outputPath, scale: 1, crop: false, watermark: false, background: 'theme', theme })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Unexpected banner dimensions')
    return result
}
export default create('dark')
