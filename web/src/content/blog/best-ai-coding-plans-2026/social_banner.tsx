import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'AI Coding Plans: Prices and Limits. Modeled monthly budget: 200 dollars in seats plus 80 dollars in usage gives a 280-dollar vendor bill. Eight review hours at 75 dollars add 600 dollars of labor, totaling 880 dollars for 40 accepted changes, or 22 dollars per change.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const cyan = theme === 'light' ? '#087e8b' : '#22d3ee'
    const purple = theme === 'light' ? '#6d28d9' : '#a78bfa'
    const label = (text: string, left: number, top: number, size: number, color = c.textPrimary, weight = 600, boxWidth = 1092) => React.createElement('div', {
        key: text, style: { position: 'absolute', left, top, width: boxWidth, display: 'flex', fontFamily: 'Inter', fontSize: size, fontWeight: weight, lineHeight: 1.15, letterSpacing: 0.4, color },
    }, text)
    return Scene({ c, background: c.bg, contentWidth: 1092, padding: 54, gap: 0,
        children: React.createElement('div', { style: { position: 'relative', display: 'flex', width: 1092, height: 522 } },
            label('AI Coding Plans: Prices and Limits', 0, 0, 47, c.textPrimary, 750),
            label('MODELED MONTHLY BUDGET', 0, 108, 17, c.textSecondary),
            label('VENDOR BILL', 0, 161, 18, cyan, 650, 420),
            label('$200 seats + $80 usage', 0, 204, 28, c.textPrimary, 600, 490),
            label('$280', 0, 253, 63, cyan, 750, 400),
            label('+', 497, 261, 42, c.textSecondary, 600, 50),
            label('REVIEW + CORRECTION', 620, 161, 18, purple, 650, 472),
            label('8 hours × $75 per hour', 620, 204, 28, c.textPrimary, 600, 472),
            label('$600', 620, 253, 63, purple, 750, 450),
            React.createElement('svg', { width: 1092, height: 25, viewBox: '0 0 1092 25', style: { position: 'absolute', top: 346 } },
                React.createElement('path', { d: 'M 0 10 H 1092', stroke: c.borderLight, strokeWidth: 2 })),
            label('$880 ÷ 40 accepted changes = $22 each', 0, 389, 36, c.textPrimary, 750),
            label('Before tax. Review labor is separate from vendor charges.', 0, 456, 20, c.textSecondary, 500),
            label('LeetLLM', 951, 502, 18, c.textSecondary, 600, 141),
        ),
    })
}
export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), { width, height, outputPath, scale: 1, crop: false, watermark: false, background: 'theme', theme })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Unexpected banner dimensions')
    return result
}
export default create()
