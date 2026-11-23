import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

// From web/: pnpm exec tsx -e "import { renderBanner } from './src/content/foundations/statistics-estimation-uncertainty/social_banner.tsx'; renderBanner('./src/content/foundations/statistics-estimation-uncertainty/social_banner.png').then(console.log)"
export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Statistics and Uncertainty. Three samples all observe 16 percent abuse among reviewed flags. On a shared 0 to 30 percent population-rate axis, 95 percent Wilson intervals narrow from approximately 10.1 to 24.4 percent for 16/100, to 13.9 to 18.4 percent for 160/1000, to 15.3 to 16.7 percent for 1600/10000. Dots mark the observed 16 percent, not the adjusted Wilson centers. More representative labels reduce sampling uncertainty, not sampling bias.'

export function wilson(successes: number, n: number): [number, number] {
    const p = successes / n
    const z = 1.96
    const denominator = 1 + z * z / n
    const center = (p + z * z / (2 * n)) / denominator
    const margin = z / denominator * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n))
    return [center - margin, center + margin]
}

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const purple = theme === 'dark' ? '#a78bfa' : '#6d28d9'
    const cyan = theme === 'dark' ? '#22d3ee' : '#0e7490'
    const x = (rate: number) => 350 + 700 * rate / 0.3
    const samples = [{ k: 16, n: 100 }, { k: 160, n: 1000 }, { k: 1600, n: 10000 }]
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
            label('Statistics and Uncertainty', 0, 0, 1092, 52, c.textPrimary, 750),
            label('Same 16% estimate. Different sampling uncertainty.', 0, 80, 1092, 28, c.textSecondary),
            React.createElement('svg', { width: 1092, height: 465, viewBox: '0 0 1092 465', style: { position: 'absolute', left: 0, top: 0 } },
                ...[0, 0.1, 0.2, 0.3].map((rate) => React.createElement('line', { key: `grid-${rate}`, x1: x(rate), y1: 187, x2: x(rate), y2: 435, stroke: c.textMuted, strokeOpacity: 0.2 })),
                React.createElement('line', { x1: x(0.16), y1: 187, x2: x(0.16), y2: 421, stroke: cyan, strokeWidth: 1.5, strokeDasharray: '4 6', strokeOpacity: 0.6 }),
                React.createElement('line', { x1: x(0), y1: 435, x2: x(0.3), y2: 435, stroke: c.textMuted, strokeWidth: 1.5 }),
                ...samples.flatMap(({ k, n }, i) => {
                    const [low, high] = wilson(k, n)
                    const y = 230 + i * 80
                    return [
                        React.createElement('line', { key: `interval-${n}`, x1: x(low), y1: y, x2: x(high), y2: y, stroke: purple, strokeWidth: 5 }),
                        ...[low, high].map((rate, j) => React.createElement('line', { key: `cap-${n}-${j}`, x1: x(rate), y1: y - 12, x2: x(rate), y2: y + 12, stroke: purple, strokeWidth: 3 })),
                        React.createElement('circle', { key: `estimate-${n}`, cx: x(k / n), cy: y, r: 7, fill: cyan, stroke: c.bg, strokeWidth: 2 }),
                    ]
                }),
            ),
            label('abuse / reviewed flags', 0, 157, 330, 24, c.textSecondary),
            label('95% Wilson confidence intervals', 350, 157, 740, 26, purple),
            ...samples.flatMap(({ k, n }, i) => {
                const [low, high] = wilson(k, n)
                return [
                    label(`${k.toLocaleString('en-US')} / ${n.toLocaleString('en-US')}`, 0, 205 + i * 80, 330, 31, c.textPrimary, 700),
                    label(`[${(100 * low).toFixed(1)}%, ${(100 * high).toFixed(1)}%]`, 0, 243 + i * 80, 330, 23, purple),
                ]
            }),
            ...[0, 0.1, 0.2, 0.3].map((rate) => label(`${Math.round(rate * 100)}%`, x(rate) - 37, 446, 74, 22, c.textSecondary, 600, true)),
            label('More labels reduce sampling noise, not sampling bias.', 0, 491, 915, 25, c.textSecondary),
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
