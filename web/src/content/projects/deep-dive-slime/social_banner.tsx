import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Deep Dive - slime. Six response positions show model tool call, tool observation, and model answer. Loss mask 1,1,0,0,1,1 excludes observation targets while retaining their context. LeetLLM.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const model = theme === 'dark' ? c.positiveLight : c.positiveDark
    const tool = theme === 'dark' ? c.warningLight : c.warningDark
    const groups = [{ label: 'Model tool call', tokens: ['11', '12'], mask: 1, color: model }, { label: 'Tool observation', tokens: ['50', '51'], mask: 0, color: tool }, { label: 'Model answer', tokens: ['13', '14'], mask: 1, color: model }]
    return Scene({ c, padding: 58, contentWidth: 1084, background: c.bg, gap: 0,
        children: <div style={{ display: 'flex', flexDirection: 'column', height: 514, color: c.textPrimary, fontFamily: 'Inter', gap: 24 }}>
            <div style={{ display: 'flex', fontSize: 58, fontWeight: 750 }}>Deep Dive - slime</div>
            <div style={{ display: 'flex', fontSize: 27, color: c.textSecondary, marginBottom: 12 }}>Six response positions. Four training targets.</div>
            <div style={{ display: 'flex', gap: 20 }}>
                {groups.map((group) => <div key={group.label} style={{ display: 'flex', flexDirection: 'column', width: 348, gap: 16, padding: 20, border: `2px solid ${group.color}`, borderTopWidth: 8, background: c.bgCard }}>
                    <div style={{ display: 'flex', color: group.color, fontSize: 25, justifyContent: 'center' }}>{group.label}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: 44, fontWeight: 700 }}>{group.tokens.map(token => <span key={token}>{token}</span>)}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: 27, color: group.color }}><span>mask {group.mask}</span><span>mask {group.mask}</span></div>
                </div>)}
            </div>
            <div style={{ display: 'flex', fontSize: 26 }}>Tool observations stay in context, not in the target loss.</div>
            <div style={{ display: 'flex', marginTop: 'auto', justifyContent: 'flex-end', fontSize: 26, fontWeight: 700, color: c.textSecondary }}>LeetLLM</div>
        </div>,
    })
}
export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), { width, height, outputPath, theme, scale: 1, crop: false, watermark: false, background: 'theme' })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Unexpected banner dimensions')
    return result
}
export default create('dark')
