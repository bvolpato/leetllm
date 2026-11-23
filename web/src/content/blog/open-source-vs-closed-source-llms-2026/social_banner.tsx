import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

// From web/: pnpm exec tsx -e "import { renderBanner } from './src/content/blog/open-source-vs-closed-source-llms-2026/social_banner.tsx'; renderBanner('./src/content/blog/open-source-vs-closed-source-llms-2026/social_banner.png')"
export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Open-Weight vs Closed API LLMs. A downloadable checkpoint remains subject to its license and can be deployed by either a company operator or an external provider. Weight access does not decide who receives the data.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const purple = theme === 'dark' ? '#c4b5fd' : '#6d28d9'
    const cyan = theme === 'dark' ? '#67e8f9' : '#0369a1'
    const muted = theme === 'dark' ? '#b8c5d9' : '#475569'
    const background = theme === 'dark' ? '#0c172b' : '#f8fafc'
    const panel = theme === 'dark' ? '#17243b' : '#e2e8f0'
    const text = (value: string, left: number, top: number, boxWidth: number, size: number, color = c.textPrimary, weight = 600) =>
        React.createElement('div', { key: value, style: {
            position: 'absolute', display: 'flex', left, top, width: boxWidth,
            fontFamily: 'Inter', fontSize: size, fontWeight: weight,
            letterSpacing: 0.35, lineHeight: 1.18, color,
        } }, value)
    const box = (left: number, top: number, boxWidth: number, boxHeight: number, border: string) =>
        React.createElement('div', { key: `${left}-${top}`, style: {
            position: 'absolute', display: 'flex', left, top,
            width: boxWidth, height: boxHeight, borderRadius: 16,
            background: panel, border: `2px solid ${border}`,
        } })
    return Scene({
        c, background, padding: 52, gap: 0, contentWidth: 1096,
        children: React.createElement('div', { style: {
            position: 'relative', display: 'flex', width: 1096, height: 526,
        } },
        text('Open-Weight vs Closed API LLMs', 0, 0, 1096, 48, c.textPrimary, 750),
        text('Model rights and deployment control are separate choices.', 0, 72, 1096, 25, muted, 500),
        box(255, 144, 586, 94, purple),
        text('DOWNLOADABLE CHECKPOINT', 283, 162, 530, 18, purple, 700),
        text('The license defines permitted use.', 283, 191, 530, 26),
        React.createElement('svg', {
            width: 1096, height: 74, viewBox: '0 0 1096 74',
            style: { position: 'absolute', left: 0, top: 238 },
        }, React.createElement('path', {
            d: 'M 548 0 L 548 35 M 252 74 L 252 35 L 844 35 L 844 74',
            fill: 'none', stroke: muted, strokeWidth: 2,
        })),
        box(0, 312, 504, 108, cyan),
        box(592, 312, 504, 108, cyan),
        text('Company-operated deployment', 24, 333, 456, 26, cyan, 700),
        text('Your team runs inference.', 24, 372, 456, 23, muted, 500),
        text('Provider-operated deployment', 616, 333, 456, 26, cyan, 700),
        text('An external service runs inference.', 616, 372, 456, 23, muted, 500),
        text('Weight access does not decide who receives the data.', 0, 455, 1096, 25, c.textPrimary, 600),
        text('LeetLLM', 942, 502, 154, 24, purple, 750),
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
