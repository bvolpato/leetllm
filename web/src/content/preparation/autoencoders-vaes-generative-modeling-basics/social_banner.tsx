import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Autoencoders and VAEs. A posterior sample uses z = mu + sigma times epsilon. Mean [0.400,-0.200], standard deviation [0.705,1.051], and shown standard-normal noise [0.500,-1.000] give sampled code [0.752,-1.251]. A coordinate plot shows displacement from the mean to the sample. During backpropagation epsilon is fixed, leaving paths to mu and sigma.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const cyan = theme === 'dark' ? '#22d3ee' : '#0e7490'
    const purple = theme === 'dark' ? '#a78bfa' : '#6d28d9'
    const mean = [0.4, -0.2]
    const sigma = [Math.exp(-0.35), Math.exp(0.05)]
    const sample = [mean[0] + sigma[0] * 0.5, mean[1] - sigma[1]]
    const px = (x: number) => 705 + (x + 0.2) * 250
    const py = (y: number) => 414 - (y + 1.5) * 110
    const label = (text: string, left: number, top: number, boxWidth: number, size: number, color = c.textPrimary, weight = 600, center = false) =>
        React.createElement('div', { key: `${text}-${left}-${top}`, style: {
            position: 'absolute', left, top, width: boxWidth, display: 'flex',
            justifyContent: center ? 'center' : 'flex-start', fontFamily: 'Inter',
            fontSize: size, fontWeight: weight, lineHeight: 1.15, color,
        } }, text)
    return Scene({
        c, background: c.bg, padding: 54, gap: 0, contentWidth: 1092,
        children: React.createElement('div', { style: { position: 'relative', display: 'flex', width: 1092, height: 522 } },
            label('Autoencoders and VAEs', 0, 0, 1092, 54, c.textPrimary, 750),
            label('A posterior sample: move the mean by scaled noise', 0, 80, 1092, 29, c.textSecondary),
            label('z = μ + σ ⊙ ε', 0, 149, 616, 39, c.textPrimary, 700),
            label('mean μ', 0, 229, 205, 28, cyan, 650),
            label('[0.400, −0.200]', 205, 229, 403, 30, cyan, 700),
            label('scale σ', 0, 289, 205, 28, c.textPrimary),
            label('[0.705, 1.051]', 205, 289, 403, 30, c.textPrimary, 700),
            label('noise ε', 0, 349, 205, 28, c.textSecondary),
            label('[0.500, −1.000]', 205, 349, 403, 30, c.textSecondary, 700),
            label('ε ~ N(0, I) · one standard-normal draw', 0, 397, 630, 23, c.textSecondary),
            React.createElement('svg', { width: 1092, height: 450, viewBox: '0 0 1092 450', style: { position: 'absolute', left: 0, top: 0 } },
                ...[0, 0.5, 1].map(x => React.createElement('line', { key: `x-grid-${x}`, x1: px(x), x2: px(x), y1: py(0.5), y2: py(-1.5), stroke: c.border, strokeWidth: 1 })),
                ...[-1, -0.5, 0, 0.5].map(y => React.createElement('line', { key: `y-grid-${y}`, x1: px(-0.2), x2: px(1.2), y1: py(y), y2: py(y), stroke: y === 0 ? c.textSecondary : c.border, strokeWidth: 1 })),
                React.createElement('line', { x1: px(0), x2: px(0), y1: py(0.5), y2: py(-1.5), stroke: c.textSecondary, strokeWidth: 1 }),
                React.createElement('path', { d: `M ${px(mean[0])} ${py(mean[1])} L ${px(sample[0])} ${py(mean[1])} L ${px(sample[0])} ${py(sample[1])}`, fill: 'none', stroke: c.textSecondary, strokeWidth: 1.5, strokeDasharray: '5 5' }),
                React.createElement('line', { x1: px(mean[0]), y1: py(mean[1]), x2: px(sample[0]), y2: py(sample[1]), stroke: purple, strokeWidth: 2.5 }),
                React.createElement('circle', { cx: px(mean[0]), cy: py(mean[1]), r: 7, fill: cyan }),
                React.createElement('circle', { cx: px(sample[0]), cy: py(sample[1]), r: 7, fill: purple }),
            ),
            label('latent coordinate 2', 684, 151, 372, 22, c.textSecondary),
            ...[0, 0.5, 1].map(x => label(String(x), px(x) - 22, 424, 44, 20, c.textSecondary, 500, true)),
            ...[-1, -0.5, 0, 0.5].map(y => label(String(y).replace('-', '−'), 649, py(y) - 12, 48, 20, c.textSecondary, 500, true)),
            label('μ', px(mean[0]) - 31, py(mean[1]) - 9, 26, 28, cyan, 750),
            label('z', px(sample[0]) + 16, py(sample[1]) - 9, 26, 28, purple, 750),
            label('+0.352', 870, 211, 111, 21, c.textSecondary, 600, true),
            label('−1.051', 1013, 311, 79, 21, c.textSecondary),
            label('coordinate 1', 962, 450, 130, 18, c.textSecondary),
            label('Sampled z ≈ [0.752, −1.251]', 0, 455, 890, 32, purple, 750),
            label('Hold ε fixed in backprop; gradients reach μ and σ.', 0, 500, 912, 24, c.textSecondary),
            label('LeetLLM', 932, 490, 160, 30, c.textPrimary, 750),
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
