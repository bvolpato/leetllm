import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

// From web/: pnpm exec tsx -e "import { renderBanner } from './src/content/foundations/calculus-gradients-backpropagation-optimization/social_banner.tsx'; renderBanner('./src/content/foundations/calculus-gradients-backpropagation-optimization/social_banner.png').then(console.log)"
export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Gradients and Backprop. For loss L(w) = (2w - 5) squared at w = 3, the forward computation multiplies by 2 to predict 6, subtracts target 5 to get error 1, then squares to get loss 1. Backward starts at dL/dL = 1 and multiplies by local factors 2, 1, and 2 to obtain dL/dw = 4. With learning rate 0.1, the update is 3 - 0.1 times 4 = 2.6.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const purple = theme === 'dark' ? '#a78bfa' : '#6d28d9'
    const cyan = theme === 'dark' ? '#22d3ee' : '#0e7490'
    const label = (text: string, left: number, top: number, boxWidth: number, size: number, color = c.textPrimary, weight = 600, center = false) =>
        React.createElement('div', { key: `${text}-${left}-${top}`, style: {
            position: 'absolute', left, top, width: boxWidth, display: 'flex',
            justifyContent: center ? 'center' : 'flex-start',
            fontFamily: 'Inter', fontSize: size, fontWeight: weight,
            lineHeight: 1.15, color,
        } }, text)
    const nodes = [
        { name: 'weight', value: 'w = 3', gradient: 'dL/dw = 4' },
        { name: 'prediction', value: 'p = 6', gradient: 'dL/dp = 2' },
        { name: 'error', value: 'e = 1', gradient: 'dL/de = 2' },
        { name: 'loss', value: 'L = 1', gradient: 'dL/dL = 1' },
    ]
    return Scene({
        c, background: c.bg, padding: 54, gap: 0, contentWidth: 1092,
        children: React.createElement('div', { style: { position: 'relative', display: 'flex', width: 1092, height: 522 } },
            label('Gradients and Backprop', 0, 0, 1092, 54, c.textPrimary, 750),
            label('L(w) = (2w − 5)² at w = 3', 0, 80, 1092, 29, c.textSecondary),
            React.createElement('svg', { width: 1092, height: 450, viewBox: '0 0 1092 450', style: { position: 'absolute', left: 0, top: 0 } },
                ...nodes.map((_, i) => React.createElement('rect', { key: `node-${i}`, x: i * 304, y: 195, width: 180, height: 87, rx: 12, fill: c.bgCard, stroke: cyan, strokeWidth: 1.5 })),
                ...[0, 1, 2].flatMap((i) => {
                    const x = i * 304
                    return [
                        React.createElement('path', { key: `forward-${i}`, d: `M ${x + 188} 238 L ${x + 292} 238 M ${x + 282} 231 L ${x + 294} 238 L ${x + 282} 245`, fill: 'none', stroke: cyan, strokeWidth: 2.5 }),
                        React.createElement('path', { key: `backward-${i}`, d: `M ${x + 293} 362 L ${x + 188} 362 M ${x + 199} 355 L ${x + 187} 362 L ${x + 199} 369`, fill: 'none', stroke: purple, strokeWidth: 2.5 }),
                    ]
                }),
            ),
            ...nodes.flatMap((node, i) => [
                label(node.name, i * 304, 153, 180, 26, c.textSecondary, 600, true),
                label(node.value, i * 304, 216, 180, 35, cyan, 750, true),
                label(node.gradient, i * 304 - 4, 389, 188, 26, purple, 700, true),
            ]),
            ...['× 2', '− 5', 'square'].map((operation, i) => label(operation, 184 + i * 304, 197, 116, 23, cyan, 600, true)),
            ...['× 2', '× 1', '× 2'].map((factor, i) => label(factor, 184 + i * 304, 327, 116, 25, purple, 700, true)),
            label('BACKWARD', 0, 327, 180, 20, purple),
            label('start at 1', 912, 327, 180, 23, purple, 600, true),
            label('Update: 3 − 0.1 × 4 = 2.6', 0, 480, 890, 30, c.textPrimary, 650),
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
