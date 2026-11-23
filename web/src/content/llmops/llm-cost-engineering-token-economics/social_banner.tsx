import React from 'react'
import { Scene, StackedBar, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'LLM Cost Engineering & Token Economics. An illustrative $750 monthly generation budget has $717.18 projected spend and $32.82 remaining. Retries and tool charges must be accounted for separately.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = { ...getThemeColors(theme), shadow: 'transparent' }
    const label = (text: string, top: number, size: number, color = c.textPrimary, left = 0, boxWidth = 1092) => React.createElement('div', {
        key: text, style: { position: 'absolute', display: 'flex', top, left, width: boxWidth, color, fontFamily: 'Inter', fontSize: size, fontWeight: 600, lineHeight: 1.15 },
    }, text)
    return Scene({
        c, background: c.bg, padding: 54, contentWidth: 1092,
        children: React.createElement('div', { style: { position: 'relative', display: 'flex', width: 1092, height: 522 } },
            label('LLM Cost Engineering', 0, 49),
            label('& Token Economics', 59, 49),
            label('ILLUSTRATIVE MONTHLY GENERATION BUDGET', 166, 18, c.textSecondary),
            label('$717.18 projected', 209, 37),
            label('$750 limit', 215, 29, c.textSecondary, 890, 202),
            React.createElement('div', { style: { position: 'absolute', display: 'flex', top: 272, left: 0 } },
                StackedBar({ c, width: 1092, height: 84, showLegend: false, segments: [
                    { label: 'Forecast', value: 717.18, color: 'primary', valueLabel: '' },
                    { label: 'Remaining', value: 32.82, color: 'positive', valueLabel: '' },
                ] })),
            label('$32.82 left before retries and other service charges.', 388, 27),
            label('LeetLLM', 490, 25, c.primary, 940, 152),
        ),
    })
}

export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), {
        width, height, outputPath, theme, scale: 1, crop: false, watermark: false, background: 'theme',
    })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Unexpected banner dimensions')
    return result
}

export default create('dark')
