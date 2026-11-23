import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Deep Dive - SGLang. Two requests share prefix tokens A B C D and then diverge into different ticket bodies. Shared-prefix KV can be reused; different suffixes need fresh work.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const box = (text: string, shared: boolean, key: string) => React.createElement('div', { key, style: {
        display: 'flex', width: 98, height: 82, alignItems: 'center', justifyContent: 'center',
        border: `2px solid ${shared ? c.primary : c.secondary}`, borderRadius: 8,
        color: c.textPrimary, background: `${shared ? c.primary : c.secondary}33`,
        fontSize: 30, fontWeight: 650,
    } }, text)
    const row = (name: string, suffix: string[]) => React.createElement('div', { key: name, style: { display: 'flex', alignItems: 'center', gap: 15, width: 1092 } },
        React.createElement('div', { style: { display: 'flex', width: 135, color: c.textSecondary, fontSize: 25 } }, name),
        ...['A','B','C','D',...suffix].map((text,i)=>box(text,i<4,`${name}-${i}`)),
    )
    return Scene({ c, background: c.bg, padding: 54, gap: 0, contentWidth: 1092, children: React.createElement('div', { style: { display: 'flex', flexDirection: 'column', height: 522, width: 1092 } },
        React.createElement('div', { style: { display: 'flex', fontSize: 55, fontWeight: 750, color: c.textPrimary } }, 'Deep Dive - SGLang'),
        React.createElement('div', { style: { display: 'flex', fontSize: 26, color: c.textSecondary, marginTop: 22 } }, 'Reuse the prefix. Schedule the remaining work.'),
        React.createElement('div', { style: { display: 'flex', fontSize: 20, color: c.primaryLight, marginLeft: 150, marginTop: 56, marginBottom: 14 } }, 'SHARED PREFIX KV'),
        row('Request 0', ['X','Y','Z']),
        React.createElement('div', { style: { display: 'flex', height: 20 } }),
        row('Request 1', ['P','Q','R']),
        React.createElement('div', { style: { display: 'flex', fontSize: 21, color: c.textSecondary, marginTop: 22, marginLeft: 600 } }, 'Different suffixes need fresh work'),
        React.createElement('div', { style: { display: 'flex', justifyContent: 'flex-end', color: c.primaryLight, fontSize: 25, fontWeight: 700, marginTop: 37 } }, 'LeetLLM'),
    ) })
}
export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), { width, height, outputPath, scale: 1, crop: false, watermark: false, background: 'theme', theme })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Unexpected banner dimensions')
    return result
}
export default create('dark')
