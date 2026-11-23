import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

// From web/: pnpm exec tsx -e "import { renderBanner } from './src/content/foundations/mps-metal-mac-ml-training/social_banner.tsx'; renderBanner('./src/content/foundations/mps-metal-mac-ml-training/social_banner.png').then(console.log)"
export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'MPS & Metal for ML on Mac. One unified physical memory pool on Apple silicon contains separate cpu and mps tensor allocations. Changing the tensor device with .to("mps") returns a copy in the MPS allocation. Shared memory still requires explicit PyTorch device placement.'

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
    return Scene({
        c, background: c.bg, padding: 54, gap: 0, contentWidth: 1092,
        children: React.createElement('div', { style: { position: 'relative', display: 'flex', width: 1092, height: 522 } },
            label('MPS & Metal for ML on Mac', 0, 0, 1092, 52, c.textPrimary, 750),
            label('Shared physical memory. Separate tensor allocations.', 0, 77, 1092, 27, c.textSecondary),
            React.createElement('svg', { width: 1092, height: 450, viewBox: '0 0 1092 450', style: { position: 'absolute', left: 0, top: 0 } },
                React.createElement('rect', { x: 0, y: 158, width: 1092, height: 280, rx: 20, fill: c.bgCard, stroke: purple, strokeWidth: 2 }),
                React.createElement('rect', { x: 36, y: 273, width: 332, height: 122, rx: 14, fill: c.bg, stroke: purple, strokeWidth: 2 }),
                React.createElement('rect', { x: 724, y: 273, width: 332, height: 122, rx: 14, fill: c.bg, stroke: cyan, strokeWidth: 2 }),
                React.createElement('line', { x1: 402, y1: 333, x2: 681, y2: 333, stroke: cyan, strokeWidth: 3 }),
                React.createElement('path', { d: 'M 672 326 L 686 333 L 672 340', fill: 'none', stroke: cyan, strokeWidth: 3 }),
            ),
            label('Unified memory', 36, 184, 510, 34, purple, 750),
            label('One physical pool on Apple silicon', 36, 230, 700, 21, c.textSecondary),
            label('cpu tensor', 68, 296, 268, 32, purple, 700),
            label('original allocation', 68, 349, 268, 21, c.textSecondary),
            label('.to("mps")', 471, 285, 210, 27, cyan),
            label('returns a copy', 457, 351, 230, 22, c.textSecondary),
            label('mps tensor', 756, 296, 268, 32, cyan, 700),
            label('new allocation', 756, 349, 268, 21, c.textSecondary),
            label('PyTorch placement is still explicit.', 0, 480, 860, 28, c.textSecondary),
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
