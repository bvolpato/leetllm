import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'From GPT to Modern LLMs. The router scores token import against four experts: E0 2.4, E1 0.3, E2 0.5, E3 -0.2. Top-two routing executes E0 and E2, combining their output vectors with normalized weights about 0.870 and 0.130. E1 and E3 are inactive for this token, but their weights remain part of the checkpoint.'

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
    const experts = [
        { name: 'E0', score: '2.4', y: 181, active: true },
        { name: 'E1', score: '0.3', y: 251, active: false },
        { name: 'E2', score: '0.5', y: 321, active: true },
        { name: 'E3', score: '−0.2', y: 391, active: false },
    ]
    return Scene({
        c, background: c.bg, padding: 54, gap: 0, contentWidth: 1092,
        children: React.createElement('div', { style: { position: 'relative', display: 'flex', width: 1092, height: 522 } },
            label('From GPT to Modern LLMs', 0, 0, 1092, 54, c.textPrimary, 750),
            label('Sparse routing separates active work from the weight pool', 0, 80, 1092, 28, c.textSecondary),
            label('router scores', 413, 136, 280, 27, cyan, 650, true),
            label('mix expert outputs', 810, 213, 282, 26, purple, 650, true),
            React.createElement('svg', { width: 1092, height: 455, viewBox: '0 0 1092 455', style: { position: 'absolute', left: 0, top: 0 } },
                React.createElement('rect', { x: 0, y: 249, width: 262, height: 105, rx: 12, fill: c.bgCard, stroke: cyan, strokeWidth: 1.5 }),
                ...experts.filter(e => e.active).flatMap(e => [
                    React.createElement('line', { key: `route-${e.name}`, x1: 273, y1: 301, x2: 421, y2: e.y + 28, stroke: cyan, strokeWidth: 2.5 }),
                    React.createElement('line', { key: `output-${e.name}`, x1: 693, y1: e.y + 28, x2: 824, y2: 303, stroke: purple, strokeWidth: 2.5 }),
                ]),
                ...experts.map(e => React.createElement('rect', { key: `expert-${e.name}`, x: 432, y: e.y, width: 250, height: 56, rx: 10, fill: c.bgCard, stroke: e.active ? cyan : c.border, strokeWidth: e.active ? 2 : 1, strokeDasharray: e.active ? undefined : '5 4' })),
                React.createElement('rect', { x: 835, y: 256, width: 257, height: 101, rx: 12, fill: c.bgCard, stroke: purple, strokeWidth: 1.5 }),
            ),
            label('token: import', 0, 269, 262, 29, cyan, 700, true),
            label('top-2 router', 0, 311, 262, 25, c.textSecondary, 600, true),
            ...experts.map(e => label(`${e.name} · ${e.score}`, 432, e.y + 13, 250, 29, e.active ? cyan : c.textSecondary, e.active ? 750 : 550, true)),
            label('0.870 × E0', 835, 276, 257, 29, purple, 750, true),
            label('+ 0.130 × E2', 835, 318, 257, 29, purple, 750, true),
            label('2 of 4 experts run', 0, 387, 327, 27, cyan, 650),
            label('for this token', 0, 421, 327, 24, c.textSecondary),
            label('Inactive for this token ≠ absent from the checkpoint.', 0, 470, 922, 27, c.textPrimary, 650),
            label('Top-2 routing; expert IDs are learned paths without fixed topic labels.', 0, 509, 922, 22, c.textSecondary),
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
