import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

// From web/: pnpm exec tsx -e "import { renderBanner } from './src/content/foundations/data-structures-for-ai-systems/social_banner.tsx'; renderBanner('./src/content/foundations/data-structures-for-ai-systems/social_banner.png').then(console.log)"
export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Data Structures for AI. Query token hit looks up token postings {0, 2} and hit postings {2}. Counting distinct matched terms ranks doc 2 first with two matches, then doc 0 with one match. Doc 1 is not scored for this query.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const purple = theme === 'dark' ? '#a78bfa' : '#6d28d9'
    const cyan = theme === 'dark' ? '#22d3ee' : '#0e7490'
    const label = (text: string, left: number, top: number, boxWidth: number, size: number, color = c.textPrimary, weight = 600) =>
        React.createElement('div', { key: text, style: {
            position: 'absolute', left, top, width: boxWidth, display: 'flex',
            fontFamily: 'Inter', fontSize: size, fontWeight: weight,
            lineHeight: 1.15, color,
        } }, text)
    const arrow = (from: number, to: number, y: number) => React.createElement('g', { key: `${from}-${y}` },
        React.createElement('line', { x1: from, y1: y, x2: to - 4, y2: y, stroke: cyan, strokeWidth: 2.5 }),
        React.createElement('path', { d: `M ${to - 12} ${y - 7} L ${to} ${y} L ${to - 12} ${y + 7}`, fill: 'none', stroke: cyan, strokeWidth: 2.5 }),
    )
    return Scene({
        c, background: c.bg, padding: 54, gap: 0, contentWidth: 1092,
        children: React.createElement('div', { style: { position: 'relative', display: 'flex', width: 1092, height: 522 } },
            label('Data Structures for AI', 0, 0, 1092, 54, c.textPrimary, 750),
            label('Query: token hit', 0, 83, 1092, 30, cyan),
            React.createElement('svg', { width: 1092, height: 445, viewBox: '0 0 1092 445', style: { position: 'absolute', left: 0, top: 0 } },
                React.createElement('rect', { x: 228, y: 220, width: 278, height: 78, rx: 12, fill: c.bgCard, stroke: purple, strokeWidth: 1.5 }),
                React.createElement('rect', { x: 228, y: 340, width: 278, height: 78, rx: 12, fill: c.bgCard, stroke: purple, strokeWidth: 1.5 }),
                arrow(154, 208, 259), arrow(154, 208, 379),
                React.createElement('path', { d: 'M 528 259 L 564 259 L 564 379 L 528 379', fill: 'none', stroke: cyan, strokeWidth: 2.5 }),
                arrow(564, 636, 319),
                React.createElement('rect', { x: 664, y: 220, width: 428, height: 198, rx: 12, fill: c.bgCard, stroke: cyan, strokeWidth: 1.5 }),
                React.createElement('line', { x1: 692, y1: 319, x2: 1064, y2: 319, stroke: c.textMuted, strokeOpacity: 0.5 }),
            ),
            label('TERM', 0, 172, 184, 20, c.textSecondary, 750),
            label('POSTINGS · DOC IDs', 228, 172, 330, 20, purple, 750),
            label('RANKED RESULTS', 664, 172, 428, 20, cyan, 750),
            label('token', 0, 238, 150, 35, purple),
            label('hit', 0, 358, 150, 35, purple),
            label('{0, 2}', 293, 237, 205, 38),
            label('{2}', 314, 357, 180, 38),
            label('doc 2', 696, 251, 142, 32, cyan, 750),
            label('2 matches', 874, 253, 205, 29),
            label('doc 0', 696, 351, 142, 32),
            label('1 match', 874, 353, 205, 29),
            label('Doc 1 is never scored for this query.', 0, 480, 860, 28, c.textSecondary),
            label('LeetLLM', 932, 480, 160, 30, c.textPrimary, 750),
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
