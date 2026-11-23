import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Advanced MLOps and DevOps for AI. A release manifest binds prompt, model, features, and policy to one identity. Request traces verify the release actually served; recovery restores the complete known-good tuple.'
export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const cyan = theme === 'dark' ? '#5ed5c0' : '#087e70'
    const purple = theme === 'dark' ? '#b99cf5' : '#7043bc'
    const card = (title: string, lines: string[], color: string, size: number) => React.createElement('div', { style: { display: 'flex', width: size, height: 230, padding: 27, flexDirection: 'column', gap: 21, border: `2px solid ${color}`, borderRadius: 12, background: `${color}12` } },
        React.createElement('div', { style: { display: 'flex', fontSize: 27, fontWeight: 750, color } }, title),
        ...lines.map((line) => React.createElement('div', { key: line, style: { display: 'flex', fontSize: 25, color: c.textPrimary } }, line)),
    )
    return Scene({ c, background: c.bg, padding: 52, contentWidth: 1096, gap: 0,
        children: React.createElement('div', { style: { display: 'flex', height: 526, flexDirection: 'column' } },
            React.createElement('div', { style: { display: 'flex', fontSize: 46, fontWeight: 750, color: c.textPrimary } }, 'Advanced MLOps & DevOps for AI'),
            React.createElement('div', { style: { display: 'flex', marginTop: 22, fontSize: 27, color: c.textSecondary } }, 'A model version is only part of the release.'),
            React.createElement('div', { style: { display: 'flex', marginTop: 42, gap: 26, alignItems: 'center' } },
                card('PINNED MANIFEST', ['prompt + base + adapter', 'features + retrieval + policy', 'one immutable release ID'], purple, 507),
                React.createElement('div', { style: { display: 'flex', fontSize: 42, color: c.textSecondary } }, '→'),
                card('SERVED REQUEST', ['resolved release ID in trace', 'actual feature provenance', 'verified worker state'], cyan, 507),
            ),
            React.createElement('div', { style: { display: 'flex', marginTop: 35, fontSize: 27, color: c.textPrimary } }, 'Recover the complete known-good tuple.'),
            React.createElement('div', { style: { display: 'flex', marginTop: 28, justifyContent: 'flex-end', fontSize: 23, fontWeight: 700, color: purple } }, 'LeetLLM'),
        ),
    })
}
export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), { width, height, outputPath, scale: 1, crop: false, watermark: false, background: 'theme', theme })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Unexpected banner dimensions')
    return result
}
export default create('dark')
