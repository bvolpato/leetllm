import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

// From web/: pnpm exec tsx -e "import { renderBanner } from './src/content/foundations/hypothesis-tests-confidence-intervals-passk/social_banner.tsx'; renderBanner('./src/content/foundations/hypothesis-tests-confidence-intervals-passk/social_banner.png').then(console.log)"
export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Hypothesis Tests, Intervals, and pass@k. An illustrative pool for one task contains ten generated candidates, two passing and eight failing. Choosing five candidates gives 252 possible subsets: 196 contain at least one pass, and 56 are all failures. The pass@5 estimate is 1 minus 56/252, approximately 77.8 percent. The subset bar is proportional to these counts; no model performance is claimed.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const purple = theme === 'dark' ? '#a78bfa' : '#6d28d9'
    const cyan = theme === 'dark' ? '#22d3ee' : '#0e7490'
    const successWidth = 652 * 196 / 252
    const label = (text: string, left: number, top: number, boxWidth: number, size: number, color = c.textPrimary, weight = 600, center = false) =>
        React.createElement('div', { key: `${text}-${left}-${top}`, style: {
            position: 'absolute', left, top, width: boxWidth, display: 'flex',
            justifyContent: center ? 'center' : 'flex-start',
            fontFamily: 'Inter', fontSize: size, fontWeight: weight,
            lineHeight: 1.15, color,
        } }, text)
    return Scene({
        c, background: c.bg, padding: 54, gap: 0, contentWidth: 1092,
        children: React.createElement('div', { style: { position: 'relative', display: 'flex', width: 1092, height: 522 } },
            label('Hypothesis Tests, Intervals, and pass@k', 0, 0, 1092, 42, c.textPrimary, 750),
            label('One task · n = 10 generated candidates · c = 2 pass', 0, 79, 1092, 28, c.textSecondary),
            React.createElement('svg', { width: 1092, height: 455, viewBox: '0 0 1092 455', style: { position: 'absolute', left: 0, top: 0 } },
                ...Array.from({ length: 10 }, (_, i) => React.createElement('rect', { key: `candidate-${i}`, x: i * 110, y: 148, width: 90, height: 65, rx: 10, fill: i < 2 ? cyan : c.bgCard, fillOpacity: i < 2 ? 0.16 : 1, stroke: i < 2 ? cyan : c.textMuted, strokeOpacity: i < 2 ? 1 : 0.55, strokeWidth: 1.5 })),
                React.createElement('path', { d: 'M 0 228 L 0 240 L 1080 240 L 1080 228 M 326 240 L 326 299 M 319 288 L 326 301 L 333 288', fill: 'none', stroke: c.textMuted, strokeWidth: 1.5 }),
                React.createElement('rect', { x: 0, y: 357, width: successWidth, height: 69, fill: cyan, fillOpacity: 0.16, stroke: cyan, strokeWidth: 1.5 }),
                React.createElement('rect', { x: successWidth, y: 357, width: 652 - successWidth, height: 69, fill: purple, fillOpacity: 0.18, stroke: purple, strokeWidth: 1.5 }),
            ),
            ...Array.from({ length: 10 }, (_, i) => label(i < 2 ? 'pass' : 'fail', i * 110, 167, 90, 25, i < 2 ? cyan : c.textSecondary, 650, true)),
            label('choose k = 5', 364, 260, 400, 27, c.textSecondary),
            label('252 five-candidate subsets', 0, 310, 670, 30, c.textPrimary, 700),
            label('196', 0, 375, successWidth, 33, cyan, 750, true),
            label('56', successWidth, 375, 652 - successWidth, 33, purple, 750, true),
            label('at least one pass', 0, 438, successWidth, 23, cyan, 600, true),
            label('all fail', successWidth, 438, 652 - successWidth, 23, purple, 600, true),
            label('pass@5 estimate', 756, 303, 336, 27, c.textSecondary),
            label('1 − 56 / 252', 756, 348, 336, 35, c.textPrimary, 700),
            label('≈ 77.8%', 756, 400, 336, 44, cyan, 750),
            label('Illustrative pool · fixed independent sampling policy', 0, 491, 910, 25, c.textSecondary),
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
