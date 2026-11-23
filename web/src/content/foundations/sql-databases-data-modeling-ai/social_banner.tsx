import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

// From web/: pnpm exec tsx -e "import { renderBanner } from './src/content/foundations/sql-databases-data-modeling-ai/social_banner.tsx'; renderBanner('./src/content/foundations/sql-databases-data-modeling-ai/social_banner.png').then(console.log)"
export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'SQL and Data Modeling. In the Acme Cloud policy corpus, chunk c7a references document d7, which references workspace w01, Acme Cloud. Permission row (c7a, agent:u3) references that chunk. Foreign keys preserve these links; retrieval queries must still enforce access.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const purple = theme === 'dark' ? '#a78bfa' : '#6d28d9'
    const cyan = theme === 'dark' ? '#22d3ee' : '#0e7490'
    const green = theme === 'dark' ? '#34d399' : '#047857'
    const label = (text: string, left: number, top: number, boxWidth: number, size: number, color = c.textPrimary, weight = 600) =>
        React.createElement('div', { key: `${text}-${left}`, style: {
            position: 'absolute', left, top, width: boxWidth, display: 'flex',
            fontFamily: 'Inter', fontSize: size, fontWeight: weight,
            lineHeight: 1.15, color,
        } }, text)
    const box = (left: number, color: string) => React.createElement('rect', {
        key: left, x: left, y: 185, width: 300, height: 187,
        rx: 14, fill: c.bgCard, stroke: color, strokeWidth: 1.5,
    })
    const arrow = (from: number, to: number) => React.createElement('g', { key: from },
        React.createElement('line', { x1: from, y1: 278, x2: to - 4, y2: 278, stroke: c.textSecondary, strokeWidth: 2.5 }),
        React.createElement('path', { d: `M ${to - 12} 271 L ${to} 278 L ${to - 12} 285`, fill: 'none', stroke: c.textSecondary, strokeWidth: 2.5 }),
    )
    return Scene({
        c, background: c.bg, padding: 54, gap: 0, contentWidth: 1092,
        children: React.createElement('div', { style: { position: 'relative', display: 'flex', width: 1092, height: 522 } },
            label('SQL and Data Modeling', 0, 0, 1092, 54, c.textPrimary, 750),
            label('Follow one chunk through a small policy corpus.', 0, 83, 1092, 27, c.textSecondary),
            React.createElement('svg', { width: 1092, height: 515, viewBox: '0 0 1092 515', style: { position: 'absolute', left: 0, top: 0 } },
                box(0, purple), box(396, cyan), box(792, green),
                arrow(317, 379), arrow(713, 775),
                React.createElement('rect', { x: 0, y: 424, width: 300, height: 90, rx: 12, fill: c.bgCard, stroke: purple, strokeWidth: 1.5 }),
                React.createElement('line', { x1: 150, y1: 421, x2: 150, y2: 382, stroke: purple, strokeWidth: 2.5 }),
                React.createElement('path', { d: 'M 143 391 L 150 377 L 157 391', fill: 'none', stroke: purple, strokeWidth: 2.5 }),
            ),
            label('chunks', 24, 208, 252, 29, purple, 750),
            label('id: c7a', 24, 264, 252, 28),
            label('document_id: d7', 24, 324, 252, 23, c.textSecondary),
            label('FK', 335, 243, 48, 17, c.textSecondary),
            label('documents', 420, 208, 252, 29, cyan, 750),
            label('id: d7', 420, 264, 252, 28),
            label('workspace_id: w01', 420, 324, 252, 23, c.textSecondary),
            label('FK', 731, 243, 48, 17, c.textSecondary),
            label('workspaces', 816, 208, 252, 29, green, 750),
            label('id: w01', 816, 264, 252, 28),
            label('Acme Cloud', 816, 324, 252, 23, c.textSecondary),
            label('FK', 173, 392, 50, 17, purple),
            label('chunk_permissions', 24, 440, 270, 22, purple, 750),
            label('c7a · agent:u3', 24, 478, 260, 23),
            label('Foreign keys preserve links.', 396, 421, 696, 27, c.textSecondary),
            label('Queries still enforce access.', 396, 463, 696, 27, c.textSecondary),
            label('LeetLLM', 932, 18, 160, 30, c.textPrimary, 750),
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
