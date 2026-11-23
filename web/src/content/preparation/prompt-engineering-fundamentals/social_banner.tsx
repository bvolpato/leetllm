import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Prompt Engineering Fundamentals. The same review, delicious soup but rude service, has mixed overall sentiment and positive food sentiment. Define the task, then compare real responses.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const food = theme === 'dark' ? '#6ee7b7' : '#047857'
    const overall = theme === 'dark' ? '#c4b5fd' : '#6d28d9'
    const label = (text: string, left: number, top: number, boxWidth: number, size: number, color = c.textPrimary, weight = 600, center = false) =>
        React.createElement('div', { key: `${text}-${left}-${top}`, style: {
            position: 'absolute', left, top, width: boxWidth, display: 'flex',
            justifyContent: center ? 'center' : 'flex-start', fontFamily: 'Inter',
            fontSize: size, fontWeight: weight, lineHeight: 1.15, color,
        } }, text)
    return Scene({
        c, background: c.bg, padding: 54, gap: 0, contentWidth: 1092,
        children: React.createElement('div', { style: { position: 'relative', display: 'flex', width: 1092, height: 522 } },
            label('Prompt Engineering Fundamentals', 0, 0, 1092, 46, c.textPrimary, 750),
            label('The soup was delicious, but the waiter was rude.', 0, 100, 1092, 36, c.textPrimary, 500),
            React.createElement('svg', { width: 1092, height: 430, viewBox: '0 0 1092 430', style: { position: 'absolute', left: 0, top: 0 } },
                React.createElement('path', { d: 'M 546 165 L 546 205 L 255 205 L 255 250 M 546 205 L 837 205 L 837 250', fill: 'none', stroke: c.textSecondary, strokeWidth: 3 }),
                React.createElement('path', { d: 'M 245 240 L 255 250 L 265 240 M 827 240 L 837 250 L 847 240', fill: 'none', stroke: c.textSecondary, strokeWidth: 3 }),
                React.createElement('line', { x1: 0, y1: 420, x2: 1092, y2: 420, stroke: c.border, strokeWidth: 2 }),
            ),
            label('Overall sentiment', 0, 270, 510, 30, overall, 650, true),
            label('mixed', 0, 320, 510, 60, overall, 750, true),
            label('Food sentiment', 582, 270, 510, 30, food, 650, true),
            label('positive', 582, 320, 510, 60, food, 750, true),
            label('Define the task. Compare real responses.', 0, 459, 910, 31, c.textPrimary, 650),
            label('LeetLLM', 932, 465, 160, 28, c.textPrimary, 750),
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
