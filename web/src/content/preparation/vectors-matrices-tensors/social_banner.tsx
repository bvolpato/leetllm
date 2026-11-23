import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

// From web/: pnpm exec tsx -e "import { renderBanner } from './src/content/preparation/vectors-matrices-tensors/social_banner.tsx'; renderBanner('./src/content/preparation/vectors-matrices-tensors/social_banner.png').then(console.log)"
export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Vectors, Matrices & Tensors. Tensor H has shape (2, 3, 2): two prompt matrices with three token rows and two feature columns each. Prompt 0 contains [1, 0], [0.5, 0.5], [0, 1]. Prompt 1 contains [0, 1], [0.5, 0.5], [1, 0]. Selecting H[1, 2] highlights the last row of prompt 1 and returns vector [1, 0] with shape (2,).'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const purple = theme === 'dark' ? '#a78bfa' : '#6d28d9'
    const cyan = theme === 'dark' ? '#22d3ee' : '#0e7490'
    const prompts = [[[1, 0], [0.5, 0.5], [0, 1]], [[0, 1], [0.5, 0.5], [1, 0]]]
    const label = (text: string, left: number, top: number, boxWidth: number, size: number, color = c.textPrimary, weight = 600) =>
        React.createElement('div', { key: `${text}-${left}-${top}`, style: {
            position: 'absolute', left, top, width: boxWidth, display: 'flex',
            fontFamily: 'Inter', fontSize: size, fontWeight: weight,
            lineHeight: 1.15, color,
        } }, text)
    return Scene({
        c, background: c.bg, padding: 54, gap: 0, contentWidth: 1092,
        children: React.createElement('div', { style: { position: 'relative', display: 'flex', width: 1092, height: 522 } },
            label('Vectors, Matrices & Tensors', 0, 0, 1092, 52, c.textPrimary, 750),
            label('2 prompts × 3 tokens × 2 features', 0, 80, 1092, 29, c.textSecondary),
            React.createElement('svg', { width: 1092, height: 450, viewBox: '0 0 1092 450', style: { position: 'absolute', left: 0, top: 0 } },
                React.createElement('rect', { x: 0, y: 155, width: 650, height: 290, rx: 18, fill: c.bgCard, stroke: purple, strokeWidth: 1.5 }),
                ...[0, 1].map((p) => React.createElement('rect', { key: `matrix-${p}`, x: 28 + p * 310, y: 233, width: 284, height: 183, rx: 10, fill: c.bg, stroke: c.textMuted, strokeOpacity: 0.5 })),
                React.createElement('rect', { x: 338, y: 356, width: 284, height: 60, rx: 8, fill: cyan, fillOpacity: 0.12, stroke: cyan, strokeWidth: 2 }),
                React.createElement('path', { d: 'M 659 386 L 716 386 L 716 324 L 768 324', fill: 'none', stroke: cyan, strokeWidth: 2.5 }),
                React.createElement('path', { d: 'M 759 317 L 772 324 L 759 331', fill: 'none', stroke: cyan, strokeWidth: 2.5 }),
                React.createElement('rect', { x: 790, y: 280, width: 302, height: 88, rx: 12, fill: c.bgCard, stroke: cyan, strokeWidth: 2 }),
                React.createElement('line', { x1: 941, y1: 280, x2: 941, y2: 368, stroke: cyan, strokeOpacity: 0.5 }),
            ),
            label('H · tensor (2, 3, 2)', 28, 176, 594, 28, purple, 750),
            ...prompts.flatMap((rows, p) => [
                label(`prompt ${p}`, 48 + p * 310, 211, 250, 18, c.textSecondary),
                ...rows.flatMap((row, t) => row.map((value, d) => label(
                    String(value), 88 + p * 310 + d * 120, 252 + t * 60,
                    78, 30, p === 1 && t === 2 ? cyan : c.textPrimary,
                    p === 1 && t === 2 ? 750 : 600,
                ))),
            ]),
            label('H[1, 2]', 790, 226, 302, 30, cyan, 700),
            label('1', 848, 300, 70, 42, cyan, 750),
            label('0', 999, 300, 70, 42, cyan, 750),
            label('vector · shape (2,)', 790, 390, 302, 27),
            label('Each integer index removes one axis.', 0, 480, 890, 28, c.textSecondary),
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
