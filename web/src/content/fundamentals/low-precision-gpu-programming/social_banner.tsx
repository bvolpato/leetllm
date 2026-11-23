import React from 'react'
import { Scene, getThemeColors, getReadableToneColor, renderToPngWithOutput, type ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export function create(theme: ThemeMode = 'dark') {
    const c = {...getThemeColors(theme), shadow: 'transparent'}
    const text = (value: string, size: number, color = c.textPrimary) => React.createElement('div', {
        style: {display: 'flex', fontSize: size, fontWeight: 650, lineHeight: 1.2, color, fontFamily: 'Inter'},
    }, value)
    const row = (title: string, scale: string, result: string, tone: 'purple' | 'blue') => React.createElement('div', {
        style: {display: 'flex', alignItems: 'center', padding: 25, gap: 20, width: 1100, background: c.bgCard,
            borderLeft: `5px solid ${getReadableToneColor(tone, c)}`},
    }, React.createElement('div', {style: {display: 'flex', flexDirection: 'column', gap: 12, width: 535}},
        text(title, 25, getReadableToneColor(tone, c)), text(scale, 23, c.textSecondary)), text(result, 43))
    return Scene({c, background: c.bg, padding: 50, contentWidth: 1100, gap: 28, children: [
        text('Low-Precision GPU Programming', 48),
        text('Same input: 0.001. Different scale, different answer.', 29, c.textSecondary),
        row('TENSORWISE E4M3', 'Scale 1.116071 · shared with a 500 outlier', '0.001 → 0', 'purple'),
        row('32-VALUE LOCAL SCALE', 'Scale 0.00390625 · small row only', '0.001 → 0.00097656', 'blue'),
        React.createElement('div', {style: {display: 'flex', width: 1100, justifyContent: 'flex-end'}}, text('LeetLLM', 25, c.primaryLight)),
    ]})
}
export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), {width, height, scale: 1, crop: false, outputPath, watermark: false, background: 'theme', theme})
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Unexpected dimensions')
    return result
}
export default create()
