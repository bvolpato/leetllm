import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Language Modeling and Next Tokens. After The function returns the, candidate probabilities are result 60%, value 25%, index 10%, and other tokens combined 5%. Conditional on result being selected and appended, the next probabilities are period 80% and and 20%. The exact continuation result followed by period has conditional probability 0.60 times 0.80, or 0.48.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const cyan = theme === 'dark' ? '#22d3ee' : '#0e7490'
    const purple = theme === 'dark' ? '#a78bfa' : '#6d28d9'
    const label = (text: string, left: number, top: number, boxWidth: number, size: number, color = c.textPrimary, weight = 600, center = false) =>
        React.createElement('div', { key: `${text}-${left}-${top}`, style: {
            position: 'absolute', left, top, width: boxWidth, display: 'flex',
            justifyContent: center ? 'center' : 'flex-start', fontFamily: 'Inter',
            fontSize: size, fontWeight: weight, lineHeight: 1.15, color,
        } }, text)
    const first = [
        { text: 'result · 60%', y: 193, color: cyan },
        { text: 'value · 25%', y: 265, color: c.textSecondary },
        { text: 'index · 10%', y: 337, color: c.textSecondary },
        { text: 'others · 5%', y: 409, color: c.textSecondary },
    ]
    return Scene({
        c, background: c.bg, padding: 54, gap: 0, contentWidth: 1092,
        children: React.createElement('div', { style: { position: 'relative', display: 'flex', width: 1092, height: 522 } },
            label('Language Modeling & Next Tokens', 0, 0, 1092, 49, c.textPrimary, 750),
            label('One selected token changes the next distribution', 0, 80, 1092, 29, c.textSecondary),
            label('prompt', 0, 236, 300, 25, c.textSecondary, 650, true),
            label('next token', 436, 145, 242, 27, cyan, 650, true),
            label('after “result”', 854, 145, 238, 27, purple, 650, true),
            React.createElement('svg', { width: 1092, height: 475, viewBox: '0 0 1092 475', style: { position: 'absolute', left: 0, top: 0 } },
                ...first.map((item, i) => React.createElement('line', { key: `first-edge-${i}`, x1: 302, y1: 321, x2: 425, y2: item.y + 27, stroke: item.color, strokeWidth: i === 0 ? 3 : 1.5, strokeOpacity: i === 0 ? 1 : 0.55 })),
                ...[220, 328].map((y, i) => React.createElement('path', { key: `second-edge-${i}`, d: `M 689 220 L 843 ${y} M 831 ${y - 8} L 845 ${y} L 831 ${y + 8}`, fill: 'none', stroke: purple, strokeWidth: i === 0 ? 3 : 1.5, strokeOpacity: i === 0 ? 1 : 0.6 })),
                React.createElement('rect', { x: 0, y: 276, width: 300, height: 90, rx: 12, fill: c.bgCard, stroke: c.border, strokeWidth: 1.5 }),
                ...first.map((item, i) => React.createElement('rect', { key: `first-node-${i}`, x: 436, y: item.y, width: 242, height: 54, rx: 10, fill: c.bgCard, stroke: i === 0 ? cyan : c.border, strokeWidth: i === 0 ? 2 : 1 })),
                ...[193, 301].map((y, i) => React.createElement('rect', { key: `second-node-${i}`, x: 854, y, width: 238, height: 54, rx: 10, fill: c.bgCard, stroke: i === 0 ? purple : c.border, strokeWidth: i === 0 ? 2 : 1 })),
            ),
            label('The function', 0, 288, 300, 29, c.textPrimary, 650, true),
            label('returns the', 0, 325, 300, 29, c.textPrimary, 650, true),
            ...first.map(item => label(item.text, 436, item.y + 13, 242, 27, item.color, item.text.startsWith('result') ? 750 : 600, true)),
            label('“.” · 80%', 854, 206, 238, 29, purple, 750, true),
            label('and · 20%', 854, 314, 238, 27, c.textSecondary, 600, true),
            label('append result', 695, 170, 148, 21, c.textSecondary, 600, true),
            label('other tokens combined', 714, 415, 378, 22, c.textSecondary),
            label('P(result . | prompt) = 0.60 × 0.80 = 0.48', 0, 477, 919, 29, cyan, 650),
            label('Worked probabilities for the two-step continuation.', 0, 515, 920, 22, c.textSecondary),
            label('LeetLLM', 932, 486, 160, 30, c.textPrimary, 750),
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
