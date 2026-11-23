import React from 'react'
import { Grid, Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Instruction Tuning & Chat Templates. A schematic token row keeps policy and user context visible while only Open, ticket, and the end marker receive target labels. The template determines the assistant boundary.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = { ...getThemeColors(theme), shadow: 'transparent' }
    const text = (value: string, top: number, size: number, color = c.textPrimary) =>
        React.createElement('div', { style: {
            position: 'absolute', display: 'flex', left: 0, top, width: 1092,
            color, fontFamily: 'Inter', fontSize: size, fontWeight: 650, lineHeight: 1.15,
        } }, value)
    const target = (label: string) => ({ label, tone: 'green' as const })
    const ignored = () => ({ label: '-100', tone: 'neutral' as const })
    return Scene({
        c, background: c.bg, padding: 54, contentWidth: 1092,
        children: React.createElement('div', { style: {
            position: 'relative', display: 'flex', width: 1092, height: 522,
        } },
        text('Instruction Tuning & Chat Templates', 0, 49),
        text('Keep the context. Choose the targets.', 91, 29, c.textSecondary),
        text('SCHEMATIC TOKEN POSITIONS', 191, 17, c.textMuted),
        React.createElement('div', { style: { position: 'absolute', display: 'flex', left: 0, top: 233 } },
            Grid({
                c, cellWidth: 147, cellHeight: 68, fontSize: 21, gap: 8,
                rows: [
                    ['policy', 'user', 'question', 'assistant', target('Open'), target('ticket'), target('end')],
                    [ignored(), ignored(), ignored(), ignored(), target('Open'), target('ticket'), target('end')],
                ],
            })),
        text('Top: input symbols. Bottom: unshifted target labels.', 411, 24, c.textSecondary),
        React.createElement('div', { style: {
            position: 'absolute', display: 'flex', right: 0, top: 488,
            color: c.primaryLight, fontFamily: 'Inter', fontSize: 26, fontWeight: 750,
        } }, 'LeetLLM'),
        ),
    })
}

export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), {
        width, height, outputPath, scale: 1, crop: false, watermark: false,
        background: 'theme', theme,
    })
    if (result.pixelWidth !== width || result.pixelHeight !== height) {
        throw new Error(`Unexpected banner size: ${result.pixelWidth}x${result.pixelHeight}`)
    }
    return result
}

export default create('dark')
