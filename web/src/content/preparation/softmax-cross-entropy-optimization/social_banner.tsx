import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Softmax, Cross-Entropy and Optimization. For logits [3,1,0] and target docs, probabilities are bug 0.844, docs 0.114, and security 0.042. Probability bars share a zero-to-one scale. Signed logit gradients p minus y are +0.844, -0.886, and +0.042, on a minus-one-to-plus-one scale. Cross-entropy is approximately 2.170 nats. A direct logit-descent step subtracts the gradient.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const cyan = theme === 'dark' ? '#22d3ee' : '#0e7490'
    const purple = theme === 'dark' ? '#a78bfa' : '#6d28d9'
    const logits = [3, 1, 0]
    const weights = logits.map(z => Math.exp(z - 3))
    const total = weights.reduce((a, b) => a + b, 0)
    const probabilities = weights.map(w => w / total)
    const rows = ['bug', 'docs', 'security'].map((name, i) => ({
        name, probability: probabilities[i], gradient: probabilities[i] - (i === 1 ? 1 : 0),
        y: 223 + 77 * i, color: i === 1 ? cyan : i === 2 ? purple : c.textSecondary,
    }))
    const label = (text: string, left: number, top: number, boxWidth: number, size: number, color = c.textPrimary, weight = 600, center = false) =>
        React.createElement('div', { key: `${text}-${left}-${top}`, style: {
            position: 'absolute', left, top, width: boxWidth, display: 'flex',
            justifyContent: center ? 'center' : 'flex-start', fontFamily: 'Inter',
            fontSize: size, fontWeight: weight, lineHeight: 1.15, color,
        } }, text)
    return Scene({
        c, background: c.bg, padding: 54, gap: 0, contentWidth: 1092,
        children: React.createElement('div', { style: { position: 'relative', display: 'flex', width: 1092, height: 522 } },
            label('Softmax, Cross-Entropy & Optimization', 0, 0, 1092, 44, c.textPrimary, 750),
            label('Target: docs · logits [3, 1, 0] · one supervised decision', 0, 76, 1092, 28, c.textSecondary),
            label('softmax probability', 160, 149, 415, 27, c.textPrimary, 650),
            label('logit gradient p − y', 689, 149, 403, 27, c.textPrimary, 650, true),
            React.createElement('svg', { width: 1092, height: 451, viewBox: '0 0 1092 451', style: { position: 'absolute', left: 0, top: 0 } },
                ...[0, 0.5, 1].map(t => React.createElement('line', { key: `prob-axis-${t}`, x1: 160 + 380 * t, x2: 160 + 380 * t, y1: 207, y2: 425, stroke: c.border, strokeWidth: 1 })),
                ...[-1, 0, 1].map(t => React.createElement('line', { key: `grad-axis-${t}`, x1: 900 + 140 * t, x2: 900 + 140 * t, y1: 207, y2: 425, stroke: t === 0 ? c.textSecondary : c.border, strokeWidth: t === 0 ? 1.5 : 1 })),
                ...rows.flatMap(row => [
                    React.createElement('rect', { key: `prob-${row.name}`, x: 160, y: row.y, width: 380 * row.probability, height: 37, fill: row.color }),
                    React.createElement('rect', { key: `grad-${row.name}`, x: 900 + Math.min(0, row.gradient) * 140, y: row.y, width: Math.abs(row.gradient) * 140, height: 37, fill: row.color }),
                ]),
            ),
            ...rows.flatMap(row => [
                label(row.name, 0, row.y + 3, 145, 27, row.color, row.name === 'docs' ? 750 : 600),
                label(row.probability.toFixed(3), 554, row.y + 4, 95, 25, row.color, 650),
                label(`${row.gradient > 0 ? '+' : '−'}${Math.abs(row.gradient).toFixed(3)}`, 650, row.y + 4, 108, 25, row.color, 650),
            ]),
            label('0', 144, 430, 32, 20, c.textSecondary, 500, true),
            label('0.5', 326, 430, 48, 20, c.textSecondary, 500, true),
            label('1', 524, 430, 32, 20, c.textSecondary, 500, true),
            label('−1', 738, 430, 44, 20, c.textSecondary, 500, true),
            label('0', 884, 430, 32, 20, c.textSecondary, 500, true),
            label('+1', 1018, 430, 44, 20, c.textSecondary, 500, true),
            label('Target loss: −ln(p_docs) ≈ 2.170 nats', 0, 470, 912, 29, cyan, 650),
            label('Direct logit descent subtracts a positive step × gradient.', 0, 510, 923, 22, c.textSecondary),
            label('LeetLLM', 932, 486, 160, 30, c.textPrimary, 750),
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
