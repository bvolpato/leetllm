import React from 'react'
import { Scene, StackedBar, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

// From web/: pnpm exec tsx -e "import { renderBanner } from './src/content/blog/million-token-context-windows/social_banner.tsx'; renderBanner('./src/content/blog/million-token-context-windows/social_banner.png')"
export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Million-Token Context Windows. A 1,050,000-token shared window is divided proportionally into 900,000 corpus tokens, 22,000 instructions and history tokens, and 128,000 reserved output tokens.'

const budget = { corpus: 900_000, overhead: 22_000, output: 128_000 }
const total = budget.corpus + budget.overhead + budget.output
const contentWidth = 1092
const corpusWidth = contentWidth * budget.corpus / total
const overheadWidth = contentWidth * budget.overhead / total
const outputWidth = contentWidth * budget.output / total

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const purple = theme === 'dark' ? '#a78bfa' : '#6d28d9'
    const cyan = theme === 'dark' ? '#22d3ee' : '#0891b2'
    const output = theme === 'dark' ? '#334155' : '#cbd5e1'
    const label = (text: string, left: number, top: number, boxWidth: number, size: number, color = c.textPrimary, align: 'left' | 'center' | 'right' = 'left', weight = 600) =>
        React.createElement('div', { key: text, style: {
            position: 'absolute', left, top, width: boxWidth,
            display: 'flex', justifyContent: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start',
            color, fontFamily: 'Inter', fontSize: size, fontWeight: weight,
            lineHeight: 1.15, letterSpacing: 0.4,
        } }, text)
    return Scene({
        c,
        background: c.bg,
        padding: 54,
        gap: 0,
        contentWidth,
        children: React.createElement('div', { style: {
            position: 'relative', display: 'flex', width: contentWidth, height: 522,
        } },
        label('Million-Token Context Windows', 0, 0, contentWidth, 49, c.textPrimary, 'left', 750),
        label('1M-CLASS SHARED WINDOW', 0, 133, 620, 17, c.textSecondary),
        label(`${total.toLocaleString('en-US')} tokens`, 0, 163, 680, 40, c.textPrimary, 'left', 700),
        label('22K', 860, 174, 220, 26, cyan, 'right', 750),
        label('instructions + history', 820, 211, 260, 19, c.textSecondary, 'right'),
        React.createElement('svg', {
            width: contentWidth, height: 40, viewBox: `0 0 ${contentWidth} 40`,
            style: { position: 'absolute', top: 235, left: 0 },
        }, React.createElement('path', {
            d: `M 1067 0 L 1067 13 L ${corpusWidth + overheadWidth / 2} 13 L ${corpusWidth + overheadWidth / 2} 40`,
            fill: 'none', stroke: cyan, strokeWidth: 2,
        })),
        React.createElement('div', { style: { position: 'absolute', top: 275, left: 0, display: 'flex' } },
            StackedBar({
                c, width: contentWidth, height: 100, showLegend: false,
                segments: [
                    { label: 'Corpus', value: budget.corpus, color: purple, valueLabel: '' },
                    { label: 'Instructions and history', value: budget.overhead, color: cyan, valueLabel: '' },
                    { label: 'Reserved output', value: budget.output, color: output, valueLabel: '' },
                ],
            })),
        label('900K corpus', 0, 303, corpusWidth, 36, theme === 'dark' ? '#0f172a' : '#ffffff', 'center', 750),
        label('128K', corpusWidth + overheadWidth, 288, outputWidth, 27, c.textPrimary, 'center', 750),
        label('output', corpusWidth + overheadWidth, 325, outputWidth, 19, c.textPrimary, 'center'),
        label('reserved', corpusWidth + overheadWidth, 348, outputWidth, 15, c.textSecondary, 'center'),
        label('Reserve output before packing input.', 0, 410, contentWidth, 26, c.textSecondary),
        label('LeetLLM', contentWidth - 170, 490, 170, 25, purple, 'right', 700),
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
