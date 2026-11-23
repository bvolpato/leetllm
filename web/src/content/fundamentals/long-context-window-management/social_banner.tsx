import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

// From web/: pnpm exec tsx -e "import {renderBanner} from './src/content/fundamentals/long-context-window-management/social_banner.tsx'; renderBanner('./src/content/fundamentals/long-context-window-management/social_banner.png')"
export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Long Context Window Management. A 128K illustrative budget allocates 8K to instructions and query, 104K to evidence, and 16K to reserved output. Evaluate evidence recall across prompt depths.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme)
    const purple = theme === 'dark' ? '#c4b5fd' : '#6d28d9'
    const cyan = theme === 'dark' ? '#67e8f9' : '#0e7490'
    const amber = theme === 'dark' ? '#fcd34d' : '#92400e'
    const label = (text: string, left: number, top: number, boxWidth: number, size: number, color = c.textPrimary) =>
        React.createElement('div', { key: text, style: {
            position: 'absolute', left, top, width: boxWidth, display: 'flex',
            color, fontFamily: 'Inter', fontSize: size, fontWeight: 650, lineHeight: 1.2,
        } }, text)
    return Scene({
        c, background: c.bg, padding: 54, gap: 0, contentWidth: 1092,
        children: React.createElement('div', { style: { position: 'relative', display: 'flex', width: 1092, height: 522 } },
            label('Long Context', 0, 0, 1092, 56),
            label('Window Management', 0, 67, 1092, 56),
            label('128K ILLUSTRATIVE TOTAL BUDGET', 0, 178, 1092, 21, c.textSecondary),
            React.createElement('svg', { width: 1092, height: 92, viewBox: '0 0 1092 92', style: { position: 'absolute', left: 0, top: 227 } },
                React.createElement('rect', { x: 0, y: 0, width: 68.25, height: 78, fill: purple }),
                React.createElement('rect', { x: 68.25, y: 0, width: 887.25, height: 78, fill: cyan, opacity: 0.7 }),
                React.createElement('rect', { x: 955.5, y: 0, width: 136.5, height: 78, fill: amber }),
            ),
            label('8K', 0, 328, 120, 30, purple),
            label('instructions + query', 0, 370, 255, 21, c.textSecondary),
            label('104K evidence', 325, 328, 380, 30, cyan),
            label('selected, counted, evaluated', 325, 370, 460, 21, c.textSecondary),
            label('16K output', 865, 328, 227, 30, amber),
            label('reserved', 865, 370, 227, 21, c.textSecondary),
            label('Fits the window ≠ finds the evidence', 0, 478, 915, 32),
            label('LeetLLM', 958, 491, 134, 25, purple),
        ),
    })
}

export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), {
        width, height, outputPath, scale: 1, crop: false, watermark: false, background: 'theme', theme,
    })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Unexpected banner dimensions')
    return result
}

export default create('dark')
