import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Function Calling & Tool Use. A model proposes get_release_status for reranker-v16; only the trusted runtime validates permission and executes. A linked observation reports error rate 0.081 above the 0.02 budget.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const violet = theme === 'dark' ? '#c4b5fd' : '#6d28d9'
    const cyan = theme === 'dark' ? '#67e8f9' : '#0e7490'
    const text = (value: string, x: number, y: number, w: number, size: number, color = c.textPrimary) =>
        <div key={value} style={{ position: 'absolute', left: x, top: y, width: w, display: 'flex', color, fontFamily: 'Inter', fontSize: size, fontWeight: 650, letterSpacing: .3, lineHeight: 1.2 }}>{value}</div>
    return Scene({ c, padding: 48, contentWidth: 1104, background: c.bg, gap: 0,
        children: <div style={{ display: 'flex', position: 'relative', width: 1104, height: 534 }}>
            {text('Function Calling & Tool Use', 0, 0, 1104, 49)}
            {text('A request proposes an action; the tool executes it', 0, 85, 1104, 21, c.textSecondary)}
            <div style={{ position: 'absolute', display: 'flex', left: 0, top: 153, width: 448, height: 220, border: `2px solid ${violet}`, borderRadius: 16, background: c.bgCard }} />
            <div style={{ position: 'absolute', display: 'flex', left: 594, top: 153, width: 510, height: 220, border: `2px solid ${cyan}`, borderRadius: 16, background: c.bgCard }} />
            {text('MODEL PROPOSES', 25, 179, 390, 22, violet)}
            {text('get_release_status', 25, 231, 400, 32)}
            {text('release_id: reranker-v16', 25, 296, 400, 23, c.textSecondary)}
            {text('RUNTIME DECIDES', 622, 179, 450, 22, cyan)}
            {text('Validate → authorize → run', 622, 235, 450, 28)}
            {text('call_id: status-1', 622, 296, 440, 23, c.textSecondary)}
            <svg width={146} height={40} viewBox='0 0 146 40' style={{ position: 'absolute', left: 448, top: 240 }}>
                <path d='M 12 20 L 129 20 M 118 9 L 129 20 L 118 31' stroke={cyan} strokeWidth={3} fill='none' />
            </svg>
            {text('Linked result: canary_failed', 0, 423, 650, 28)}
            {text('0.081 > 0.02 error budget', 0, 472, 700, 27, c.textSecondary)}
            {text('LeetLLM', 928, 497, 176, 27, violet)}
        </div>,
    })
}

export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), {
        width, height, outputPath, scale: 1, crop: false, watermark: false,
        background: 'theme', theme,
    })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Unexpected banner dimensions')
    return result
}
export default create('dark')
