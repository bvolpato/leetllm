import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

// From web/: pnpm exec tsx -e "import { renderBanner } from './src/content/foundations/bayesian-inference-priors-posteriors/social_banner.tsx'; renderBanner('./src/content/foundations/bayesian-inference-priors-posteriors/social_banner.png').then(console.log)"
export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Bayesian Inference from Evidence. Eight passes and two failures update a Beta(2,2) prior to a Beta(10,4) posterior. A density plot shows the broad symmetric prior and the posterior shifted toward higher success rates. Posterior area above rate 0.7 is shaded: approximately 57.9 percent. The posterior mean is approximately 0.714. Posterior mass above 0.7 is 57.9 percent, so evidence that the unknown rate exceeds the threshold remains modest.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const purple = theme === 'dark' ? '#a78bfa' : '#6d28d9'
    const cyan = theme === 'dark' ? '#22d3ee' : '#0e7490'
    const x = (p: number) => 54 + 640 * p
    const y = (density: number) => 419 - 60 * density
    const prior = (p: number) => 6 * p * (1 - p)
    const posterior = (p: number) => 2860 * p ** 9 * (1 - p) ** 3
    const curve = (density: (p: number) => number) => Array.from({ length: 201 }, (_, i) => `${i === 0 ? 'M' : 'L'} ${x(i / 200)} ${y(density(i / 200))}`).join(' ')
    const tail = `M ${x(0.7)} ${y(0)} ` + Array.from({ length: 61 }, (_, i) => {
        const p = 0.7 + i / 200
        return `L ${x(p)} ${y(posterior(p))}`
    }).join(' ') + ` L ${x(1)} ${y(0)} Z`
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
            label('Bayesian Inference from Evidence', 0, 0, 1092, 45, c.textPrimary, 750),
            label('8 passes + 2 failures: Beta(2, 2) → Beta(10, 4)', 0, 80, 1092, 28, c.textSecondary),
            React.createElement('svg', { width: 1092, height: 455, viewBox: '0 0 1092 455', style: { position: 'absolute', left: 0, top: 0 } },
                ...[0, 1, 2, 3, 4].map((value) => React.createElement('line', { key: `grid-${value}`, x1: x(0), y1: y(value), x2: x(1), y2: y(value), stroke: c.textMuted, strokeOpacity: 0.17 })),
                React.createElement('path', { d: tail, fill: cyan, fillOpacity: 0.2 }),
                React.createElement('line', { x1: x(0.7), y1: y(0), x2: x(0.7), y2: y(4), stroke: cyan, strokeWidth: 1.5, strokeDasharray: '5 5' }),
                React.createElement('path', { d: curve(prior), fill: 'none', stroke: purple, strokeWidth: 3, strokeDasharray: '8 6' }),
                React.createElement('path', { d: curve(posterior), fill: 'none', stroke: cyan, strokeWidth: 4 }),
                React.createElement('path', { d: `M ${x(0)} ${y(4)} L ${x(0)} ${y(0)} L ${x(1)} ${y(0)}`, fill: 'none', stroke: c.textMuted, strokeWidth: 1.5 }),
                React.createElement('line', { x1: 190, y1: 146, x2: 231, y2: 146, stroke: purple, strokeWidth: 3, strokeDasharray: '8 6' }),
                React.createElement('line', { x1: 396, y1: 146, x2: 437, y2: 146, stroke: cyan, strokeWidth: 3 }),
            ),
            label('density', 0, 132, 160, 23, c.textSecondary),
            label('prior', 243, 132, 125, 24, purple),
            label('posterior', 448, 132, 220, 24, cyan),
            ...[0, 1, 2, 3, 4].map((value) => label(String(value), 4, y(value) - 12, 35, 21, c.textSecondary, 500, true)),
            ...[0, 0.5, 0.7, 1].map((p) => label(String(p), x(p) - 25, 431, 50, 21, p === 0.7 ? cyan : c.textSecondary, 600, true)),
            label('success rate p', 275, 458, 280, 23, c.textSecondary),
            label('Posterior mean', 760, 189, 332, 27, c.textSecondary),
            label('10 / 14 ≈ 0.714', 760, 230, 332, 34, c.textPrimary, 750),
            label('P(p > 0.7 | data)', 760, 319, 332, 27, cyan),
            label('≈ 57.9%', 760, 362, 332, 44, cyan, 750),
            label('Mean above 0.7 ≠ strong evidence of clearing it.', 0, 491, 910, 25, c.textSecondary),
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
