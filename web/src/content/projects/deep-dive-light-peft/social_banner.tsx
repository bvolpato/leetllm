import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Deep Dive - Light-PEFT. A rank-four adapter keeps original rank indices 2 and 4 in both its down and up projections, yielding a rank-two product. Matching indices and the original scale are required.'
export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const text = (label: string, left: number, top: number, size: number, color = c.textPrimary, boxWidth = 1092) =>
        React.createElement('div', { key: label, style: { position: 'absolute', display: 'flex', left, top,
            width: boxWidth, fontFamily: 'Inter', fontSize: size, fontWeight: 650, color, lineHeight: 1.15 } }, label)
    const rankBar = (label: string, left: number, top: number, keptOnly = false) =>
        React.createElement('div', { key: label, style: { position: 'absolute', display: 'flex', left, top, width: 390, height: 88, gap: 12 } },
            ...(keptOnly ? [2, 4] : [1, 2, 3, 4]).map(rank => {
                const keep = rank === 2 || rank === 4
                return React.createElement('div', { key: rank, style: { display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: keptOnly ? 164 : 76, height: 82, borderRadius: 12, border: `3px solid ${keep ? c.positive : c.border}`,
                    background: keep ? c.positive : c.bgSubtle, color: keep ? '#ffffff' : c.textSecondary,
                    fontFamily: 'Inter', fontSize: 32, fontWeight: 750 } }, String(rank))
            }))
    return Scene({ c, background: c.bg, padding: 54, contentWidth: 1092, gap: 0,
        children: React.createElement('div', { style: { position: 'relative', display: 'flex', width: 1092, height: 522 } },
            text('Deep Dive - Light-PEFT', 0, 0, 52),
            text('A rank cut must keep the same coordinates on both sides.', 0, 78, 26, c.textSecondary),
            text('BEFORE: RANK 4', 0, 146, 22, c.textSecondary, 420),
            text('AFTER: RANK 2', 660, 146, 22, c.textSecondary, 420),
            rankBar('A before', 0, 195), rankBar('A after', 660, 195, true),
            text('A rows', 382, 219, 22, c.textSecondary, 160),
            text('→', 567, 210, 44, c.positive, 80),
            rankBar('B before', 0, 308), rankBar('B after', 660, 308, true),
            text('B columns', 382, 332, 22, c.textSecondary, 160),
            text('→', 567, 323, 44, c.positive, 80),
            text('Keep indices 2 + 4. Preserve the original scale.', 0, 455, 26),
            text('Stored PyTorch orientation', 0, 499, 19, c.textSecondary, 760),
            text('LeetLLM', 942, 489, 25, c.primary, 150),
        ),
    })
}
export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), {
        width, height, outputPath, scale: 1, crop: false, watermark: false, background: 'theme', theme,
    })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Unexpected banner dimensions')
    return result
}
export default create('dark')
