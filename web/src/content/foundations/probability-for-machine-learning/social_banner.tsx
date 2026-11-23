import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

// From web/: pnpm exec tsx -e "import { renderBanner } from './src/content/foundations/probability-for-machine-learning/social_banner.tsx'; renderBanner('./src/content/foundations/probability-for-machine-learning/social_banner.png').then(console.log)"
export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Probability for Machine Learning. In an illustrative population of 10,000 signups, 100 are abusive and 9,900 are clean. Flagging 95 percent of abusive signups produces 95 true flags; flagging 5 percent of clean signups produces 495 false flags. The proportionally divided queue bar contains 590 flags, with 95 abusive and 495 clean. P(abusive given flagged) is 95 divided by 590, or 16.1 percent; recall is 95 percent.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const purple = theme === 'dark' ? '#a78bfa' : '#6d28d9'
    const cyan = theme === 'dark' ? '#22d3ee' : '#0e7490'
    const trueWidth = 532 * 95 / 590
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
            label('Probability for Machine Learning', 0, 0, 1092, 47, c.textPrimary, 750),
            label('95% recall does not mean 95% risk after a flag.', 0, 80, 1092, 29, c.textSecondary),
            React.createElement('svg', { width: 1092, height: 450, viewBox: '0 0 1092 450', style: { position: 'absolute', left: 0, top: 0 } },
                React.createElement('rect', { x: 0, y: 165, width: 320, height: 100, rx: 12, fill: c.bgCard, stroke: purple, strokeWidth: 1.5 }),
                React.createElement('rect', { x: 0, y: 310, width: 320, height: 100, rx: 12, fill: c.bgCard, stroke: cyan, strokeWidth: 1.5 }),
                React.createElement('path', { d: 'M 332 215 L 461 215 L 541 254 M 528 243 L 542 255 L 525 255', fill: 'none', stroke: purple, strokeWidth: 2.5 }),
                React.createElement('path', { d: 'M 332 360 L 461 360 L 541 266 M 529 272 L 542 264 L 539 280', fill: 'none', stroke: cyan, strokeWidth: 2.5 }),
                React.createElement('rect', { x: 560, y: 220, width: trueWidth, height: 72, fill: purple, fillOpacity: 0.2, stroke: purple, strokeWidth: 1.5 }),
                React.createElement('rect', { x: 560 + trueWidth, y: 220, width: 532 - trueWidth, height: 72, fill: cyan, fillOpacity: 0.15, stroke: cyan, strokeWidth: 1.5 }),
            ),
            label('100 abusive', 0, 195, 320, 33, purple, 750, true),
            label('9,900 clean', 0, 340, 320, 33, cyan, 750, true),
            label('95% flagged', 341, 178, 210, 24, purple),
            label('5% flagged', 341, 379, 200, 24, cyan),
            label('590 flagged signups', 560, 157, 532, 31, c.textPrimary, 700),
            label('95', 560, 238, trueWidth, 32, purple, 750, true),
            label('495', 560 + trueWidth, 238, 532 - trueWidth, 32, cyan, 750, true),
            label('abusive', 560, 304, 130, 22, purple),
            label('clean', 885, 304, 200, 22, cyan),
            label('95 / 590 ≈ 16.1%', 560, 355, 532, 40, c.textPrimary, 750),
            label('P(abusive | flagged)', 560, 410, 532, 27, c.textSecondary),
            label('Illustrative population: 10,000 signups · 1% abuse.', 0, 485, 900, 26, c.textSecondary),
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
