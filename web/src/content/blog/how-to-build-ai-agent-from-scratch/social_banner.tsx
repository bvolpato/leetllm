import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'How to Build an AI Agent from Scratch. Tool-call path: the model proposes a lookup, the runtime checks it, and allowed requests search or read the configuration snapshot. Results and invalid-request errors are appended to history with the call_id and return to the model for its next decision. Repeats or budget limits stop the runtime. Tutorial defaults are eight model turns, six tool requests, and a cooperative sixty-second deadline.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const cyan = theme === 'dark' ? '#22d3ee' : '#0e7490'
    const purple = theme === 'dark' ? '#c4b5fd' : '#7c3aed'
    const amber = theme === 'dark' ? '#fbbf24' : '#a16207'
    const red = theme === 'dark' ? '#fda4af' : '#be123c'
    const label = (text: string, left: number, top: number, boxWidth: number, size: number, color = c.textPrimary, weight = 600, center = false) =>
        React.createElement('div', { key: `${text}-${left}-${top}`, style: {
            position: 'absolute', left, top, width: boxWidth, display: 'flex',
            justifyContent: center ? 'center' : 'flex-start', fontFamily: 'Inter',
            fontSize: size, fontWeight: weight, lineHeight: 1.15, color,
        } }, text)
    return Scene({
        c, background: c.bg, padding: 54, gap: 0, contentWidth: 1092,
        children: React.createElement('div', { style: { position: 'relative', display: 'flex', width: 1092, height: 522 } },
            label('How to Build an AI Agent from Scratch', 0, 0, 1092, 45, c.textPrimary, 750),
            label('The model proposes. The runtime checks and executes.', 0, 77, 1092, 29, c.textSecondary),
            React.createElement('svg', { width: 1092, height: 456, viewBox: '0 0 1092 456', style: { position: 'absolute', left: 0, top: 0 } },
                React.createElement('rect', { x: 0, y: 213, width: 246, height: 104, rx: 12, fill: c.bgCard, stroke: purple, strokeWidth: 2 }),
                React.createElement('rect', { x: 411, y: 213, width: 273, height: 104, rx: 12, fill: c.bgCard, stroke: amber, strokeWidth: 2 }),
                React.createElement('rect', { x: 845, y: 213, width: 247, height: 104, rx: 12, fill: c.bgCard, stroke: cyan, strokeWidth: 2 }),
                React.createElement('rect', { x: 774, y: 137, width: 318, height: 49, rx: 8, fill: c.bgCard, stroke: red, strokeWidth: 1.5 }),
                React.createElement('rect', { x: 335, y: 399, width: 422, height: 56, rx: 10, fill: c.bgCard, stroke: cyan, strokeWidth: 1.5 }),
                React.createElement('path', { d: 'M 263 265 L 394 265 M 384 257 L 394 265 L 384 273 M 701 265 L 828 265 M 818 257 L 828 265 L 818 273', fill: 'none', stroke: c.textSecondary, strokeWidth: 2.5 }),
                React.createElement('path', { d: 'M 547 213 L 547 162 L 761 162 M 751 155 L 761 162 L 751 169', fill: 'none', stroke: red, strokeWidth: 2 }),
                React.createElement('path', { d: 'M 969 317 L 969 427 L 770 427 M 780 420 L 770 427 L 780 434 M 335 427 L 123 427 L 123 330 M 116 340 L 123 330 L 130 340', fill: 'none', stroke: cyan, strokeWidth: 2.5 }),
                React.createElement('path', { d: 'M 547 317 L 547 386 M 540 376 L 547 386 L 554 376', fill: 'none', stroke: amber, strokeWidth: 2.5 }),
            ),
            label('Model', 0, 231, 246, 31, purple, 750, true),
            label('choose next lookup', 0, 277, 246, 21, c.textPrimary, 600, true),
            label('Runtime checks', 411, 231, 273, 28, amber, 700, true),
            label('tool · args · budget', 411, 277, 273, 22, c.textPrimary, 600, true),
            label('Snapshot', 845, 231, 247, 31, cyan, 750, true),
            label('search / read', 845, 277, 247, 23, c.textPrimary, 600, true),
            label('tool call', 257, 226, 144, 23, c.textSecondary, 650, true),
            label('allowed', 697, 226, 134, 23, c.textSecondary, 650, true),
            label('Repeat / limit → stop', 774, 149, 318, 23, red, 700, true),
            label('invalid', 570, 339, 230, 22, amber),
            label('request error', 570, 365, 230, 22, amber),
            label('result', 989, 360, 103, 23, cyan),
            label('Append to history + call_id', 335, 413, 422, 26, cyan, 700, true),
            label('observation', 151, 383, 181, 23, cyan),
            label('Tool-call path · 8 turns · 6 requests · 60s cooperative deadline', 0, 488, 920, 24, c.textSecondary),
            label('LeetLLM', 932, 490, 160, 30, c.textPrimary, 750),
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
