import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Deep Dive - vLLM. R0 and R1 each map their first logical KV block to physical slot 12, sharing four prefix tokens. Their suffixes occupy slots 41 and 73. LeetLLM.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const shared = theme === 'dark' ? c.positiveLight : c.positiveDark
    const row = (name: string, suffix: string, slot: number) => <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{ display: 'flex', width: 100, fontSize: 34, fontWeight: 700 }}>{name}</div>
        <div style={{ display: 'flex', width: 418, padding: 25, border: `3px solid ${shared}`, background: c.bgCard, justifyContent: 'space-between', fontSize: 31 }}><span>A B C D</span><b>#12</b></div>
        <div style={{ display: 'flex', width: 418, padding: 25, border: `2px solid ${c.border}`, background: c.bgCard, justifyContent: 'space-between', fontSize: 31 }}><span>{suffix}</span><b>#{slot}</b></div>
    </div>
    return Scene({
        c, padding: 58, contentWidth: 1084, background: c.bg, gap: 0,
        children: <div style={{ display: 'flex', flexDirection: 'column', color: c.textPrimary, fontFamily: 'Inter', height: 514, gap: 24 }}>
            <div style={{ display: 'flex', fontSize: 58, fontWeight: 750, letterSpacing: 1 }}>Deep Dive - vLLM</div>
            <div style={{ display: 'flex', fontSize: 25, color: c.textSecondary, marginBottom: 22 }}>Shared physical KV · first two logical blocks shown</div>
            {row('R0', 'E F G H', 41)}
            {row('R1', 'E F X Y', 73)}
            <div style={{ display: 'flex', paddingLeft: 124, fontSize: 25, color: shared }}>Same slot #12 · two references · one copy</div>
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
