import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'OpenClaw task budget breakdown: three growing-context requests cost 0.164, 0.324 and 0.404 dollars in model charges, totaling 0.892 dollars. A 0.75-dollar task budget falls inside the third request. The first two requests spend 0.488 dollars, leaving 0.262 dollars for the third.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const fills = theme === 'light' ? ['#cce8ed', '#dfd7f0', '#f0d9bb'] : ['#234e5b', '#494060', '#654627']
    const marker = theme === 'light' ? '#a43845' : '#fda4af'
    const charges = [0.164, 0.324, 0.404]
    const total = charges.reduce((sum, charge) => sum + charge, 0)
    const scale = 1050 / total
    const budgetX = 0.75 * scale
    const label = (text: string, left: number, top: number, boxWidth: number, size: number, color = c.textPrimary, weight = 600, align: 'left' | 'right' = 'left') => React.createElement('div', {
        key: text,
        style: { position: 'absolute', left, top, width: boxWidth, display: 'flex', justifyContent: align === 'right' ? 'flex-end' : 'flex-start', fontFamily: 'Inter', fontSize: size, fontWeight: weight, lineHeight: 1.15, color },
    }, text)
    return Scene({
        c, background: c.bg, padding: 54, contentWidth: 1092, gap: 0,
        children: React.createElement('div', { style: { position: 'relative', display: 'flex', width: 1092, height: 522 } },
            label('AI plans for OpenClaw', 0, 0, 1092, 49, c.textPrimary, 750),
            label('Price the whole task as context grows.', 0, 79, 1092, 30, c.textSecondary, 500),
            label('Three requests: $0.892', 0, 149, 700, 33, c.textPrimary, 700),
            label('$0.75 task budget', budgetX - 270, 211, 250, 24, marker, 650, 'right'),
            React.createElement('svg', { width: 1092, height: 522, viewBox: '0 0 1092 522', style: { position: 'absolute', left: 0, top: 0 } },
                charges.map((charge, index) => React.createElement('rect', {
                    key: index,
                    x: charges.slice(0, index).reduce((sum, value) => sum + value, 0) * scale,
                    y: 255, width: charge * scale, height: 78, fill: fills[index], stroke: c.bg, strokeWidth: 2,
                })),
                React.createElement('line', { x1: budgetX, x2: budgetX, y1: 209, y2: 351, stroke: marker, strokeWidth: 3, strokeDasharray: '6 5' }),
            ),
            charges.map((charge, index) => label(`${index + 1} · $${charge.toFixed(3)}`, charges.slice(0, index).reduce((sum, value) => sum + value, 0) * scale + 18, 281, charge * scale - 30, 27, c.textPrimary, 650)),
            label('After two requests: $0.488 spent', 0, 378, 1092, 28, c.textPrimary, 650),
            label('Only $0.262 remains for request 3.', 0, 423, 1092, 28, c.textSecondary, 500),
            label('GPT-5.6 Sol request charges · USD · model charges only', 0, 493, 925, 20, c.textSecondary, 500),
            label('LeetLLM', 941, 491, 151, 24, c.textPrimary, 700, 'right'),
        ),
    })
}

export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), { width, height, outputPath, scale: 1, crop: false, watermark: false, background: 'theme', theme })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Unexpected banner dimensions')
    return result
}

export default create('dark')
