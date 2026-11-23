import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

// From web/: pnpm exec tsx -e "import { renderBanner } from './src/content/foundations/git-shell-linux-reproducible-ai/social_banner.tsx'; renderBanner('./src/content/foundations/git-shell-linux-reproducible-ai/social_banner.png').then(console.log)"
export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Git, Shell, Linux for AI. Committed eval data, scorer, and scripts travel through a fresh clone. Local setup rebuilds the virtual environment and installs the hook. Running repro.sh scores the three saved predictions at 0.667, or two of three correct; no model call is involved.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const purple = theme === 'dark' ? '#a78bfa' : '#6d28d9'
    const cyan = theme === 'dark' ? '#22d3ee' : '#0e7490'
    const green = theme === 'dark' ? '#34d399' : '#047857'
    const label = (text: string, left: number, top: number, boxWidth: number, size: number, color = c.textPrimary, weight = 600) =>
        React.createElement('div', { key: text, style: {
            position: 'absolute', left, top, width: boxWidth, display: 'flex',
            fontFamily: 'Inter', fontSize: size, fontWeight: weight,
            letterSpacing: 0.4, lineHeight: 1.15, color,
        } }, text)
    const box = (left: number, boxWidth: number, color: string) =>
        React.createElement('rect', { key: left, x: left, y: 178, width: boxWidth, height: 222, rx: 18, fill: c.bgCard, stroke: color, strokeWidth: 1.5 })
    const arrow = (from: number, to: number) =>
        React.createElement('g', { key: from },
            React.createElement('line', { x1: from, y1: 290, x2: to - 8, y2: 290, stroke: c.textSecondary, strokeWidth: 2.5 }),
            React.createElement('path', { d: `M ${to - 11} 284 L ${to} 290 L ${to - 11} 296`, fill: 'none', stroke: c.textSecondary, strokeWidth: 2.5 }),
        )
    return Scene({
        c, background: c.bg, padding: 54, gap: 0, contentWidth: 1092,
        children: React.createElement('div', { style: { position: 'relative', display: 'flex', width: 1092, height: 522 } },
            label('Git, Shell, Linux for AI', 0, 0, 1092, 54, c.textPrimary, 750),
            label('A clean clone tests what actually traveled.', 0, 80, 1092, 27, c.textSecondary),
            React.createElement('svg', { width: 1092, height: 420, viewBox: '0 0 1092 420', style: { position: 'absolute', left: 0, top: 0 } },
                box(0, 300, purple), box(374, 330, cyan), box(778, 314, green),
                arrow(315, 359), arrow(719, 763),
            ),
            label('COMMITTED', 28, 203, 246, 18, purple, 750),
            label('eval_cases.jsonl', 28, 250, 246, 26),
            label('scorer + scripts', 28, 295, 246, 26),
            label('clone', 312, 257, 62, 18, c.textSecondary),
            label('REBUILD LOCALLY', 402, 203, 280, 18, cyan, 750),
            label('.venv/', 402, 250, 274, 28),
            label('installed hook', 402, 295, 274, 28),
            label('from tracked setup scripts', 402, 354, 284, 16, c.textSecondary),
            label('run', 724, 257, 50, 18, c.textSecondary),
            label('VERIFY', 806, 203, 258, 18, green, 750),
            label('./repro.sh', 806, 249, 258, 28),
            label('0.667 (2/3)', 806, 295, 258, 33, green, 750),
            label('three saved predictions', 806, 354, 258, 16, c.textSecondary),
            label('Tracked setup, not copied laptop state.', 0, 438, 1092, 26, c.textSecondary),
            label('LeetLLM', 968, 490, 124, 25, purple, 700),
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
