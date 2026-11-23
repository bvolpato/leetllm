import React from 'react'
import { Scene, getThemeColors, getReadableToneColor, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Model Merging and Weight Interpolation. Code delta plus 0.5 and Math delta minus 0.5 combine at coefficients 0.6 and 0.4, moving the shared base weight 2.0 to 2.1. Evaluate quality on held-out tasks.'
export function create(theme: ThemeMode = 'dark') {
    const c = {...getThemeColors(theme), shadow: 'transparent'}
    const text = (value: string, size: number, color = c.textPrimary) => React.createElement('div', {
        style: {display: 'flex', fontFamily: 'Inter', fontSize: size, fontWeight: 650, color, lineHeight: 1.2},
    }, value)
    const term = (label: string, value: string, color: string) => React.createElement('div', {
        style: {display: 'flex', flexDirection: 'column', width: 330, gap: 16, padding: 24, borderTop: `5px solid ${color}`},
    }, text(label, 24, c.textSecondary), text(value, 46, color))
    return Scene({c, background: c.bg, padding: 50, contentWidth: 1100, gap: 26,
        children: [
            text('Model Merging', 58),
            text('and Weight Interpolation', 44),
            React.createElement('div', {style: {display: 'flex', gap: 36, marginTop: 12}},
                term('Shared base', '2.0', c.textPrimary),
                term('Code delta × 0.6', '+0.30', getReadableToneColor('purple', c)),
                term('Math delta × 0.4', '−0.20', getReadableToneColor('blue', c))),
            text('Merged weight = 2.10', 45, getReadableToneColor('purple', c)),
            text('Weight arithmetic constructs a candidate. Evaluation decides.', 25, c.textSecondary),
            React.createElement('div', {style: {display: 'flex', justifyContent: 'flex-end', width: 1100}}, text('LeetLLM', 24, c.primaryLight)),
        ],
    })
}
export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), {width, height, outputPath, scale: 1, crop: false, watermark: false, background: 'theme', theme})
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Unexpected banner dimensions')
    return result
}
export default create()
