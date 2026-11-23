import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Chunking Strategies. A six-word cut separates 15 from minutes in the rollback paging rule. A section boundary keeps the complete rule together.'

const words = ['Rollback', 'failure:', 'page', 'on-call', 'within', '15', 'minutes', 'with', 'deploy', 'ID.']
const step = 108

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const blue = theme === 'dark' ? '#93c5fd' : '#1d4ed8'
    const green = theme === 'dark' ? '#6ee7b7' : '#047857'
    const red = theme === 'dark' ? '#fda4af' : '#be123c'
    const label = (text: string, left: number, top: number, boxWidth: number, fontSize: number, color = c.textPrimary) =>
        React.createElement('div', { key: `${text}-${top}`, style: {
            position: 'absolute', display: 'flex', left, top, width: boxWidth,
            color, fontFamily: 'Inter', fontSize, fontWeight: 650, lineHeight: 1.2,
        } }, text)
    const rule = (top: number, split: boolean) => React.createElement('div', {
        key: top, style: { position: 'absolute', left: 0, top, display: 'flex', width: 1080, height: 64 },
    },
    ...words.map((word, index) => label(word, index * step + 6, 18, step - 8, 19,
        split ? (index < 6 ? blue : c.textSecondary) : green)),
    React.createElement('svg', { width: 1080, height: 64, viewBox: '0 0 1080 64', style: { position: 'absolute', left: 0, top: 0 } },
        React.createElement('rect', { x: 1, y: 1, width: split ? 644 : 1078, height: 62, rx: 8, fill: 'none', stroke: split ? blue : green, strokeWidth: 2 }),
        split ? React.createElement('rect', { x: 652, y: 1, width: 427, height: 62, rx: 8, fill: 'none', stroke: c.textSecondary, strokeWidth: 2, strokeDasharray: '6 5' }) : null,
    ))
    return Scene({ c, background: c.bg, padding: 60, gap: 0, contentWidth: 1080,
        children: React.createElement('div', { style: { position: 'relative', display: 'flex', width: 1080, height: 510 } },
            label('Chunking Strategies', 0, 0, 1080, 54),
            label('Keep the condition, deadline, and required ID together.', 0, 82, 1080, 26, c.textSecondary),
            label('SIX-WORD CUT', 0, 162, 580, 19, blue),
            label('The cut separates the number from its unit.', 0, 265, 1080, 24, red),
            rule(198, true),
            label('SECTION BOUNDARY', 0, 338, 1080, 19, green),
            rule(374, false),
            label('One complete paging rule. Source: runbook, page 7.', 0, 462, 840, 22, c.textSecondary),
            label('LeetLLM', 920, 486, 160, 26, blue),
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
