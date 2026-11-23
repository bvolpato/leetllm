import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

// From web/: pnpm exec tsx -e "import { renderBanner } from './src/content/foundations/python-for-ai-engineering/social_banner.tsx'; renderBanner('./src/content/foundations/python-for-ai-engineering/social_banner.png').then(console.log)"
export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Python for AI Engineering. Requests 101, 102, and 103 compare approved with approved, blocked with escalated, and restored with restored. Their match values are 1, 0, and 1. Two matches divided by all three rows gives 2/3, displayed as 0.667. The wrong prediction stays in the denominator.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const purple = theme === 'dark' ? '#a78bfa' : '#6d28d9'
    const cyan = theme === 'dark' ? '#22d3ee' : '#0e7490'
    const amber = theme === 'dark' ? '#fbbf24' : '#92400e'
    const label = (text: string, left: number, top: number, boxWidth: number, size: number, color = c.textPrimary, weight = 600) =>
        React.createElement('div', { key: `${text}-${top}-${left}`, style: {
            position: 'absolute', left, top, width: boxWidth, display: 'flex',
            fontFamily: 'Inter', fontSize: size, fontWeight: weight,
            lineHeight: 1.15, color,
        } }, text)
    const rows = [
        { request: '101', expected: 'approved', prediction: 'approved', match: '1' },
        { request: '102', expected: 'blocked', prediction: 'escalated', match: '0' },
        { request: '103', expected: 'restored', prediction: 'restored', match: '1' },
    ]
    return Scene({
        c, background: c.bg, padding: 54, gap: 0, contentWidth: 1092,
        children: React.createElement('div', { style: { position: 'relative', display: 'flex', width: 1092, height: 522 } },
            label('Python for AI Engineering', 0, 0, 920, 52, c.textPrimary, 750),
            label('Turn rows into counts before trusting the score.', 0, 77, 1092, 27, c.textSecondary),
            React.createElement('svg', { width: 1092, height: 500, viewBox: '0 0 1092 500', style: { position: 'absolute', left: 0, top: 0 } },
                React.createElement('rect', { x: 0, y: 167, width: 728, height: 266, rx: 14, fill: c.bgCard, stroke: c.textMuted, strokeOpacity: 0.45 }),
                React.createElement('rect', { x: 1, y: 298, width: 726, height: 64, fill: amber, fillOpacity: theme === 'dark' ? 0.09 : 0.08 }),
                React.createElement('line', { x1: 24, y1: 227, x2: 704, y2: 227, stroke: purple, strokeOpacity: 0.65 }),
                React.createElement('line', { x1: 750, y1: 312, x2: 796, y2: 312, stroke: cyan, strokeWidth: 3 }),
                React.createElement('path', { d: 'M 786 305 L 800 312 L 786 319', fill: 'none', stroke: cyan, strokeWidth: 3 }),
            ),
            label('Request', 24, 187, 122, 22, c.textSecondary),
            label('Expected', 165, 187, 210, 22, c.textSecondary),
            label('Prediction', 385, 187, 218, 22, c.textSecondary),
            label('Match', 635, 187, 90, 22, c.textSecondary),
            ...rows.flatMap((row, i) => {
                const top = 250 + i * 64
                const tone = i === 1 ? amber : c.textPrimary
                return [
                    label(row.request, 24, top, 120, 27, tone),
                    label(row.expected, 165, top, 210, 27, tone),
                    label(row.prediction, 385, top, 218, 27, tone),
                    label(row.match, 657, top, 48, 29, i === 1 ? amber : cyan, 750),
                ]
            }),
            label('MATCHES / ROWS', 820, 218, 272, 19, cyan, 750),
            label('2 / 3', 820, 262, 272, 65, c.textPrimary, 750),
            label('≈ 0.667', 820, 345, 272, 39, cyan, 700),
            label('displayed score', 820, 398, 272, 20, c.textSecondary),
            label('The mismatch stays in the denominator.', 0, 473, 1092, 29, amber),
            label('LeetLLM', 932, 473, 160, 30, c.textPrimary, 750),
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
