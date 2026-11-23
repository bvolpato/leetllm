import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Design an Automated Support Agent. A 900 USD credit request exceeds the illustrative 500 USD review threshold. The specialist review path is open, while automated credit execution is blocked.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme)
    const teal = theme === 'dark' ? '#5eead4' : '#0f766e'
    const amber = theme === 'dark' ? '#fbbf24' : '#92400e'
    const red = theme === 'dark' ? '#fda4af' : '#be123c'
    const text = (value: string, left: number, top: number, width: number, size: number, color = c.textPrimary) =>
        <div key={value} style={{ position: 'absolute', display: 'flex', left, top, width, fontFamily: 'Inter', fontSize: size, fontWeight: 650, lineHeight: 1.2, letterSpacing: .3, color }}>{value}</div>
    const box = (left: number, top: number, width: number, height: number, color: string) =>
        <div key={`${left}-${top}`} style={{ position: 'absolute', display: 'flex', left, top, width, height, border: `2px solid ${color}`, borderRadius: 10, background: c.bgCard }} />
    return Scene({ c, background: c.bg, padding: 48, gap: 0, contentWidth: 1104,
        children: <div style={{ position: 'relative', display: 'flex', width: 1104, height: 534 }}>
            {text('Design an Automated Support Agent', 0, 0, 1104, 46)}
            {text('A REQUEST IS NOT AN AUTHORIZATION', 0, 86, 1104, 21, c.textSecondary)}
            <svg width={1104} height={330} viewBox='0 0 1104 330' style={{ position: 'absolute', left: 0, top: 160 }}>
                <path d='M 270 154 H 352 M 340 142 L 352 154 L 340 166' stroke={teal} strokeWidth={4} fill='none' />
                <path d='M 620 154 H 685 V 74 H 770 M 758 62 L 770 74 L 758 86' stroke={teal} strokeWidth={4} fill='none' />
                <path d='M 685 154 V 238 H 770 M 750 226 L 770 250 M 750 250 L 770 226' stroke={red} strokeWidth={4} fill='none' />
            </svg>
            {box(0, 252, 270, 126, teal)}
            {text('Credit requested', 20, 273, 230, 23, c.textSecondary)}
            {text('900 USD', 20, 318, 230, 34, teal)}
            {box(354, 235, 266, 158, amber)}
            {text('Review threshold', 374, 258, 226, 23, c.textSecondary)}
            {text('500 USD', 374, 305, 226, 34, amber)}
            {text('Illustrative policy', 374, 359, 226, 17, c.textSecondary)}
            {box(776, 179, 328, 110, teal)}
            {text('Specialist review', 800, 202, 290, 28, teal)}
            {text('Carry verified evidence', 800, 248, 290, 20, c.textSecondary)}
            {box(776, 350, 328, 104, red)}
            {text('No automated credit', 800, 372, 290, 25, red)}
            {text('Confirmation is not approval', 800, 414, 285, 17, c.textSecondary)}
            {text('State · evidence · exact action', 0, 504, 850, 24, c.textSecondary)}
            {text('LeetLLM', 955, 504, 149, 25, teal)}
        </div>,
    })
}

export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), { width, height, outputPath, theme, scale: 1, crop: false, watermark: false, background: 'theme' })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Unexpected banner dimensions')
    return result
}
export default create('dark')
