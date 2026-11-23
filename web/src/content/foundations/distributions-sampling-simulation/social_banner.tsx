import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

// From web/: pnpm exec tsx -e "import { renderBanner } from './src/content/foundations/distributions-sampling-simulation/social_banner.tsx'; renderBanner('./src/content/foundations/distributions-sampling-simulation/social_banner.png').then(console.log)"
export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Distributions and Sampling. Two theoretical tool-call count distributions use identical probability axes. Poisson(2.2) has mean 2.2 and approximately 2.5 percent probability of more than five calls. A mixture of 88 percent Poisson(1.2) and 12 percent Poisson(10) has mean 2.256 and approximately 11.3 percent probability of more than five calls. Bars show exact counts zero through five and a grouped tail above five. Similar means can hide different costly tails; these are planning models, not production measurements.'

export function poissonBuckets(lambda: number): number[] {
    const masses = [Math.exp(-lambda)]
    for (let k = 1; k <= 5; k++) masses.push(masses[k - 1] * lambda / k)
    return [...masses, 1 - masses.reduce((sum, p) => sum + p, 0)]
}

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const purple = theme === 'dark' ? '#a78bfa' : '#6d28d9'
    const cyan = theme === 'dark' ? '#22d3ee' : '#0e7490'
    const base = poissonBuckets(2.2)
    const ordinary = poissonBuckets(1.2)
    const hard = poissonBuckets(10)
    const mixture = ordinary.map((p, i) => 0.88 * p + 0.12 * hard[i])
    const models = [base, mixture]
    const y = (probability: number) => 418 - 487.5 * probability
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
            label('Distributions and Sampling', 0, 0, 1092, 52, c.textPrimary, 750),
            label('Planning models: similar means, different costly tails.', 0, 80, 1092, 28, c.textSecondary),
            React.createElement('svg', { width: 1092, height: 455, viewBox: '0 0 1092 455', style: { position: 'absolute', left: 0, top: 0 } },
                ...models.flatMap((model, m) => {
                    const left = 52 + m * 580
                    return [
                        ...[0, 0.1, 0.2, 0.3, 0.4].map((p) => React.createElement('line', { key: `grid-${m}-${p}`, x1: left, y1: y(p), x2: left + 438, y2: y(p), stroke: c.textMuted, strokeOpacity: 0.2 })),
                        ...model.map((p, i) => React.createElement('rect', { key: `bar-${m}-${i}`, x: left + 8 + i * 62, y: y(p), width: 38, height: 487.5 * p, rx: 2, fill: i === 6 ? purple : cyan, fillOpacity: i === 6 ? 1 : 0.65 })),
                        React.createElement('path', { key: `axes-${m}`, d: `M ${left} ${y(0.4)} L ${left} ${y(0)} L ${left + 438} ${y(0)}`, fill: 'none', stroke: c.textMuted, strokeWidth: 1.5 }),
                    ]
                }),
            ),
            label('Poisson(2.2)', 52, 145, 470, 28, c.textPrimary, 700),
            label('88% Pois(1.2) + 12% Pois(10)', 632, 145, 460, 24, c.textPrimary, 700),
            label('mean = 2.2 calls', 52, 185, 470, 25, c.textSecondary),
            label('mean = 2.256 calls', 632, 185, 460, 25, c.textSecondary),
            ...models.flatMap((model, m) => [
                ...[0, 0.1, 0.2, 0.3, 0.4].map((p) => label(`${Math.round(100 * p)}%`, m * 580 - 2, y(p) - 11, 49, 19, c.textSecondary, 500, true)),
                ...['0', '1', '2', '3', '4', '5', '>5'].map((count, i) => label(count, 52 + m * 580 + i * 62, 430, 54, 22, i === 6 ? purple : c.textSecondary, 600, true)),
                label(`${(100 * model[6]).toFixed(1)}%`, 398 + m * 580, y(model[6]) - 35, 108, 27, purple, 750, true),
            ]),
            label('tool calls per request', 350, 457, 460, 23, c.textSecondary, 600, true),
            label('Check the costly tail alongside the mean.', 0, 491, 915, 26, c.textSecondary),
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
