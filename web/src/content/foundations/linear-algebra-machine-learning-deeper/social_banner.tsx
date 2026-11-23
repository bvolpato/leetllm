import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

// From web/: pnpm exec tsx -e "import { renderBanner } from './src/content/foundations/linear-algebra-machine-learning-deeper/social_banner.tsx'; renderBanner('./src/content/foundations/linear-algebra-machine-learning-deeper/social_banner.png').then(console.log)"
export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Linear Algebra for ML. The three-ticket matrix A has rows [1, 0], [0, 1], [1, 1], with latency and rollback columns. Rank-one SVD reconstructs rows [0.5, 0.5], [0.5, 0.5], [1, 1]. The first two tickets become identical. This approximation retains 75 percent of squared matrix energy but loses their contrast.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const purple = theme === 'dark' ? '#a78bfa' : '#6d28d9'
    const cyan = theme === 'dark' ? '#22d3ee' : '#0e7490'
    const matrices = [[[1, 0], [0, 1], [1, 1]], [[0.5, 0.5], [0.5, 0.5], [1, 1]]]
    const label = (text: string, left: number, top: number, boxWidth: number, size: number, color = c.textPrimary, weight = 600) =>
        React.createElement('div', { key: `${text}-${left}-${top}`, style: {
            position: 'absolute', left, top, width: boxWidth, display: 'flex',
            fontFamily: 'Inter', fontSize: size, fontWeight: weight,
            lineHeight: 1.15, color,
        } }, text)
    return Scene({
        c, background: c.bg, padding: 54, gap: 0, contentWidth: 1092,
        children: React.createElement('div', { style: { position: 'relative', display: 'flex', width: 1092, height: 522 } },
            label('Linear Algebra for ML', 0, 0, 1092, 54, c.textPrimary, 750),
            label('What does a weaker direction preserve?', 0, 80, 1092, 29, c.textSecondary),
            React.createElement('svg', { width: 1092, height: 450, viewBox: '0 0 1092 450', style: { position: 'absolute', left: 0, top: 0 } },
                ...[0, 1].map((m) => React.createElement('rect', { key: `matrix-${m}`, x: 64 + m * 620, y: 232, width: 316, height: 190, rx: 12, fill: c.bgCard, stroke: m === 0 ? cyan : purple, strokeWidth: 1.5 })),
                React.createElement('rect', { x: 684, y: 232, width: 316, height: 126, rx: 12, fill: purple, fillOpacity: 0.14, stroke: purple, strokeWidth: 2 }),
                React.createElement('line', { x1: 427, y1: 325, x2: 606, y2: 325, stroke: purple, strokeWidth: 3 }),
                React.createElement('path', { d: 'M 594 317 L 607 325 L 594 333', fill: 'none', stroke: purple, strokeWidth: 3 }),
                React.createElement('path', { d: 'M 1018 236 L 1030 236 L 1030 354 L 1018 354', fill: 'none', stroke: purple, strokeWidth: 2 }),
            ),
            ...matrices.flatMap((rows, m) => [
                label(m === 0 ? 'A · rank 2' : 'A₁ · rank 1', 64 + m * 620, 157, 316, 30, m === 0 ? cyan : purple, 750),
                label('latency', 80 + m * 620, 205, 144, 23, c.textSecondary),
                label('rollback', 230 + m * 620, 205, 144, 23, c.textSecondary),
                ...rows.flatMap((row, r) => [
                    label(`t${r}`, 12 + m * 620, 250 + r * 63, 44, 27, c.textSecondary),
                    ...row.map((value, col) => label(String(value), 121 + m * 620 + col * 150, 248 + r * 63, 92, 35, m === 1 && r < 2 ? purple : c.textPrimary, 700)),
                ]),
            ]),
            label('rank-one', 440, 256, 180, 28, purple),
            label('SVD', 481, 289, 104, 25, purple),
            label('contrast lost', 716, 435, 310, 27, purple),
            label('75% squared energy retained. Two tickets now identical.', 0, 485, 905, 27, c.textSecondary),
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
