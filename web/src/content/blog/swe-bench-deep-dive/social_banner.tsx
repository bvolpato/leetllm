import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Understanding SWE-bench. Starting from the issue and base commit, a candidate searches and edits, then uses visible tests as local feedback while budget remains. A selected patch is submitted to a separate final harness, which marks it Resolved when the patch applies, fix tests pass, and regression tests stay green. Hidden grading runs after the repair loop closes.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const cyan = theme === 'dark' ? '#22d3ee' : '#0e7490'
    const purple = theme === 'dark' ? '#c4b5fd' : '#7c3aed'
    const green = theme === 'dark' ? '#6ee7b7' : '#047857'
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
            label('Understanding SWE-bench', 0, 0, 1092, 54, c.textPrimary, 750),
            label('Repair with visible feedback. Submit for a separate grade.', 0, 82, 1092, 29, c.textSecondary),
            label('Issue + base commit', 0, 151, 520, 27, cyan, 700),
            React.createElement('svg', { width: 1092, height: 461, viewBox: '0 0 1092 461', style: { position: 'absolute', left: 0, top: 0 } },
                React.createElement('rect', { x: 0, y: 200, width: 222, height: 105, rx: 10, fill: c.bgCard, stroke: cyan, strokeWidth: 2 }),
                React.createElement('rect', { x: 308, y: 200, width: 212, height: 105, rx: 10, fill: c.bgCard, stroke: cyan, strokeWidth: 2 }),
                React.createElement('rect', { x: 690, y: 164, width: 402, height: 177, rx: 12, fill: c.bgCard, stroke: purple, strokeWidth: 2 }),
                React.createElement('rect', { x: 616, y: 404, width: 212, height: 56, rx: 10, fill: c.bgCard, stroke: green, strokeWidth: 2 }),
                React.createElement('rect', { x: 860, y: 404, width: 232, height: 56, rx: 10, fill: c.bgCard, stroke: red, strokeWidth: 2 }),
                React.createElement('path', { d: 'M 236 253 L 293 253 M 283 245 L 293 253 L 283 261 M 414 305 L 414 351 L 111 351 L 111 319 M 104 329 L 111 319 L 118 329', fill: 'none', stroke: cyan, strokeWidth: 2.5 }),
                React.createElement('path', { d: 'M 534 253 L 676 253 M 666 245 L 676 253 L 666 261', fill: 'none', stroke: purple, strokeWidth: 2.5 }),
                React.createElement('path', { d: 'M 891 341 L 891 369 L 722 369 L 722 390 M 715 380 L 722 390 L 729 380', fill: 'none', stroke: green, strokeWidth: 2.5 }),
                React.createElement('path', { d: 'M 891 341 L 891 369 L 976 369 L 976 390 M 969 380 L 976 390 L 983 380', fill: 'none', stroke: red, strokeWidth: 2.5 }),
            ),
            label('Search + edit', 0, 219, 222, 28, cyan, 700, true),
            label('candidate patch', 0, 268, 222, 22, c.textPrimary, 600, true),
            label('Visible tests', 308, 219, 212, 28, cyan, 700, true),
            label('local feedback', 308, 268, 212, 22, c.textPrimary, 600, true),
            label('retry within budget', 117, 368, 370, 25, cyan, 650, true),
            label('selected', 533, 197, 144, 22, purple, 650, true),
            label('patch', 533, 222, 144, 22, purple, 650, true),
            label('Final harness', 690, 182, 402, 31, purple, 750, true),
            label('Patch applies?', 690, 235, 402, 25, c.textPrimary, 650, true),
            label('Fix tests pass?', 690, 274, 402, 23, c.textPrimary, 650, true),
            label('Regressions maintained?', 690, 306, 402, 23, c.textPrimary, 650, true),
            label('all yes', 616, 366, 106, 21, green, 650),
            label('otherwise', 978, 344, 114, 20, red, 650),
            label('Resolved', 616, 418, 212, 28, green, 750, true),
            label('Not resolved', 860, 418, 232, 27, red, 750, true),
            label('Hidden grading never feeds the repair loop.', 0, 490, 920, 27, c.textSecondary),
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
