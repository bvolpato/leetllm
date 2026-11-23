import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Training and Backpropagation. For prediction 2w+b with x=2, target 6, w=1, and b=0, half-squared loss sends gradient -4 to the prediction. The weight path multiplies by 2 to give -8; the bias path multiplies by 1 to give -4. SGD with learning rate 0.1 updates w to 1.8 and b to 0.4. Recomputing changes prediction from 2 to 4 and loss from 8 to 2.'

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
    const arrow = (key: string, d: string, color: string) => React.createElement('path', { key, d, fill: 'none', stroke: color, strokeWidth: 2.5 })
    return Scene({
        c, background: c.bg, padding: 54, gap: 0, contentWidth: 1092,
        children: React.createElement('div', { style: { position: 'relative', display: 'flex', width: 1092, height: 522 } },
            label('Training & Backpropagation', 0, 0, 1092, 51, c.textPrimary, 750),
            label('One example: x = 2, target = 6, prediction = 2w + b', 0, 80, 1092, 28, c.textSecondary),
            label('Backward: L = ½(prediction − target)²', 0, 146, 745, 27, purple, 650),
            label('SGD · rate = 0.1', 819, 146, 273, 27, cyan, 650, true),
            React.createElement('svg', { width: 1092, height: 440, viewBox: '0 0 1092 440', style: { position: 'absolute', left: 0, top: 0 } },
                React.createElement('rect', { x: 0, y: 245, width: 230, height: 110, rx: 12, fill: c.bgCard, stroke: purple, strokeWidth: 1.5 }),
                ...[205, 340].flatMap(top => [
                    React.createElement('rect', { key: `gradient-${top}`, x: 460, y: top, width: 240, height: 80, rx: 12, fill: c.bgCard, stroke: purple, strokeWidth: 1.5 }),
                    React.createElement('rect', { key: `update-${top}`, x: 854, y: top, width: 238, height: 80, rx: 12, fill: c.bgCard, stroke: cyan, strokeWidth: 1.5 }),
                ]),
                arrow('weight-path', 'M 236 293 L 444 245 M 431 239 L 446 245 L 434 256', purple),
                arrow('bias-path', 'M 236 307 L 444 380 M 434 369 L 446 380 L 431 384', purple),
                ...[245, 380].map(y => arrow(`step-${y}`, `M 711 ${y} L 838 ${y} M 826 ${y - 8} L 840 ${y} L 826 ${y + 8}`, cyan)),
            ),
            label('prediction gradient', 0, 210, 260, 23, purple),
            label('2 − 6', 0, 261, 230, 25, c.textSecondary, 600, true),
            label('−4', 0, 295, 230, 40, purple, 750, true),
            label('× x = 2', 288, 218, 133, 25, purple, 650, true),
            label('× 1', 302, 376, 106, 25, purple, 650, true),
            label('dL/dw = −8', 460, 230, 240, 29, purple, 700, true),
            label('dL/db = −4', 460, 365, 240, 29, purple, 700, true),
            label('−0.1(−8)', 710, 201, 134, 23, cyan, 600, true),
            label('−0.1(−4)', 710, 336, 134, 23, cyan, 600, true),
            label('w: 1 → 1.8', 854, 230, 238, 29, cyan, 700, true),
            label('b: 0 → 0.4', 854, 365, 238, 29, cyan, 700, true),
            label('Recompute: prediction 2 → 4 · loss 8 → 2', 0, 458, 1092, 28, c.textPrimary, 650),
            label('Synthetic example · half-squared error', 0, 499, 905, 23, c.textSecondary),
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
