import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'The Transformer Architecture End-to-End. At query the in function returns the result, attention scores [0.5,1,3,2] are masked to [0.5,1,3,negative infinity]. Softmax gives approximately [0.067,0.111,0.821,0]. The future result input is blocked because it is the token this position must predict. Bar lengths show unrounded attention weights; next-token probabilities come from the output head.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const cyan = theme === 'dark' ? '#22d3ee' : '#0e7490'
    const purple = theme === 'dark' ? '#a78bfa' : '#6d28d9'
    const red = theme === 'dark' ? '#fda4af' : '#be123c'
    const exp = [Math.exp(-2.5), Math.exp(-2), 1, 0]
    const total = exp.reduce((a, b) => a + b, 0)
    const probabilities = exp.map(x => x / total)
    const columns = ['function', 'returns', 'the', 'result'].map((token, i) => ({
        token, x: 294 + i * 197, color: i === 3 ? red : i === 2 ? cyan : c.textPrimary,
        score: [0.5, 1, 3, 2][i], weight: probabilities[i],
    }))
    const label = (text: string, left: number, top: number, boxWidth: number, size: number, color = c.textPrimary, weight = 600, center = false) =>
        React.createElement('div', { key: `${text}-${left}-${top}`, style: {
            position: 'absolute', left, top, width: boxWidth, display: 'flex',
            justifyContent: center ? 'center' : 'flex-start', fontFamily: 'Inter',
            fontSize: size, fontWeight: weight, lineHeight: 1.15, color,
        } }, text)
    return Scene({
        c, background: c.bg, padding: 54, gap: 0, contentWidth: 1092,
        children: React.createElement('div', { style: { position: 'relative', display: 'flex', width: 1092, height: 522 } },
            label('The Transformer Architecture End-to-End', 0, 0, 1092, 43, c.textPrimary, 750),
            label('At “the”, predict “result” without reading its future input.', 0, 80, 1092, 28, c.textSecondary),
            React.createElement('svg', { width: 1092, height: 457, viewBox: '0 0 1092 457', style: { position: 'absolute', left: 0, top: 0 } },
                React.createElement('rect', { x: 886, y: 141, width: 183, height: 303, rx: 10, fill: theme === 'dark' ? '#2b1b25' : '#fff1f2' }),
                ...[191, 277, 369].map(y => React.createElement('line', { key: `row-${y}`, x1: 0, x2: 1092, y1: y, y2: y, stroke: c.border, strokeWidth: 1 })),
                ...columns.flatMap((col, i) => [
                    React.createElement('rect', { key: `track-${col.token}`, x: col.x + 16, y: 421, width: 148, height: 13, fill: c.border }),
                    ...(col.weight > 0 ? [React.createElement('rect', { key: `mass-${col.token}`, x: col.x + 16, y: 421, width: 148 * col.weight, height: 13, fill: i === 2 ? cyan : purple })] : []),
                ]),
            ),
            ...columns.flatMap((col, i) => [
                label(col.token, col.x, 148, 180, 28, col.color, 700, true),
                label(String(col.score), col.x, 219, 180, 34, c.textPrimary, 650, true),
                label(i === 3 ? '−∞' : String(col.score), col.x, 307, 180, 34, col.color, 700, true),
                label(col.weight.toFixed(3), col.x, 384, 180, 30, col.color, 700, true),
            ]),
            label('query: the', 0, 147, 268, 28, cyan, 700),
            label('scores', 0, 220, 268, 28, c.textPrimary, 650),
            label('mask future', 0, 308, 268, 28, c.textPrimary, 650),
            label('softmax weights', 0, 385, 280, 28, c.textPrimary, 650),
            label('Mask before softmax: exp(−∞) = 0.', 0, 465, 912, 30, cyan, 650),
            label('Attention weights route information; the output head scores next tokens.', 0, 505, 912, 23, c.textSecondary),
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
