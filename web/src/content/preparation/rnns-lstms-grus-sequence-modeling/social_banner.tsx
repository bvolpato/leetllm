import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'RNNs, LSTMs, GRUs, and Sequence Modeling. One LSTM transition retains 0.98 times old cell 0.855 and writes 0.02 times candidate 0.10. Adding gives new cell 0.8399. Applying tanh and output gate 0.80 gives hidden state approximately 0.549. Chosen gate values illustrate one LSTM transition.'

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
            label('RNNs, LSTMs, GRUs, and Sequence Modeling', 0, 0, 1092, 41, c.textPrimary, 750),
            label('One LSTM step: retain memory, write, then expose', 0, 77, 1092, 29, c.textSecondary),
            React.createElement('svg', { width: 1092, height: 450, viewBox: '0 0 1092 450', style: { position: 'absolute', left: 0, top: 0 } },
                React.createElement('rect', { x: 0, y: 186, width: 220, height: 95, rx: 12, fill: c.bgCard, stroke: cyan, strokeWidth: 1.5 }),
                React.createElement('rect', { x: 0, y: 343, width: 220, height: 95, rx: 12, fill: c.bgCard, stroke: purple, strokeWidth: 1.5 }),
                React.createElement('circle', { cx: 456, cy: 312, r: 25, fill: c.bgCard, stroke: c.textSecondary, strokeWidth: 1.5 }),
                React.createElement('rect', { x: 554, y: 264, width: 210, height: 95, rx: 12, fill: c.bgCard, stroke: cyan, strokeWidth: 1.5 }),
                React.createElement('rect', { x: 908, y: 264, width: 184, height: 95, rx: 12, fill: c.bgCard, stroke: purple, strokeWidth: 1.5 }),
                arrow('retain', 'M 230 234 L 421 299 M 410 288 L 424 300 L 407 303', cyan),
                arrow('write', 'M 230 391 L 421 324 M 406 320 L 424 323 L 410 335', purple),
                arrow('add', 'M 490 312 L 540 312 M 528 304 L 542 312 L 528 320', c.textSecondary),
                arrow('expose', 'M 777 312 L 894 312 M 881 303 L 897 312 L 881 321', purple),
            ),
            label('old cell', 0, 201, 220, 25, cyan, 600, true),
            label('0.855', 0, 233, 220, 35, cyan, 750, true),
            label('candidate', 0, 358, 220, 25, purple, 600, true),
            label('0.10', 0, 390, 220, 35, purple, 750, true),
            label('forget gate', 243, 180, 192, 23, cyan, 600, true),
            label('× 0.98', 258, 210, 162, 30, cyan, 700, true),
            label('× 0.02', 258, 384, 162, 30, purple, 700, true),
            label('input gate', 243, 418, 192, 23, purple, 600, true),
            label('+', 431, 291, 50, 37, c.textPrimary, 600, true),
            label('new cell', 554, 222, 210, 25, cyan, 650, true),
            label('0.8399', 554, 294, 210, 36, cyan, 750, true),
            label('hidden state', 885, 222, 207, 25, purple, 650, true),
            label('≈ 0.549', 908, 296, 184, 32, purple, 750, true),
            label('tanh', 779, 271, 117, 24, purple, 650, true),
            label('× 0.80', 779, 333, 117, 24, purple, 650, true),
            label('output gate', 768, 367, 150, 21, c.textSecondary, 600, true),
            label('0.98 × 0.855 + 0.02 × 0.10 = 0.8399', 0, 462, 918, 29, c.textPrimary, 650),
            label('Chosen gate values illustrate one LSTM step.', 0, 504, 918, 23, c.textSecondary),
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
