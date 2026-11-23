import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = '50 LLM Interview Questions for 2026. Worked KV cache sizing: 32 layers, 8 KV heads, head dimension 128, 100,000 tokens, two bytes per value. One independent sequence needs 13.1 decimal GB; forty need 524.3 GB. Count live state as well as weights.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const label = (text: string, left: number, top: number, boxWidth: number, size: number, color = c.textPrimary, weight = 600) => React.createElement('div', {
        key: `${text}-${left}-${top}`, style: { position: 'absolute', display: 'flex', left, top, width: boxWidth, fontFamily: 'Inter', fontSize: size, color, fontWeight: weight, lineHeight: 1.15, whiteSpace: 'pre-line' },
    }, text)
    const card = (left: number) => React.createElement('div', {
        key: `card-${left}`, style: { position: 'absolute', display: 'flex', left, top: 216, width: 526, height: 226, backgroundColor: c.bgSubtle, border: `2px solid ${c.border}`, borderRadius: 18 },
    })
    return Scene({
        c, background: c.bg, padding: 48, gap: 0, contentWidth: 1104,
        children: React.createElement('div', { style: { position: 'relative', display: 'flex', width: 1104, height: 534 } },
            label('50 LLM Interview Questions\nfor 2026', 0, 0, 1104, 48, c.textPrimary, 750),
            label('KV cache · full-attention sizing · no prefix sharing', 0, 125, 1104, 25, c.textSecondary),
            label('32 layers · 8 KV heads · 128 dimensions · 100k tokens · 2 bytes', 0, 165, 1104, 24, c.textSecondary),
            card(0), card(578),
            label('1 LIVE SEQUENCE', 26, 245, 474, 25, c.textSecondary),
            label('13.1 GB', 26, 294, 474, 61, c.accent, 750),
            label('cache alone', 26, 384, 474, 25, c.textSecondary),
            label('40 LIVE SEQUENCES', 604, 245, 474, 25, c.textSecondary),
            label('524.3 GB', 604, 294, 474, 61, c.accent, 750),
            label('40× state · weights still unchanged', 604, 384, 474, 23, c.textSecondary),
            label('Count live state as well as weights. Units: decimal GB.', 0, 495, 897, 24, c.textSecondary),
            label('LeetLLM', 924, 494, 180, 29, c.textPrimary, 750),
        ),
    })
}

export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), { width, height, outputPath, scale: 1, crop: false, watermark: false, background: 'theme', theme })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error(`Unexpected banner size: ${result.pixelWidth}x${result.pixelHeight}`)
    return result
}
export default create()
