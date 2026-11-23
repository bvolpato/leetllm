import React from 'react'
import { BarChart, Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Perplexity and Model Evaluation. Illustrative observed-token probabilities 0.50, 0.10, and 0.80 give negative log-likelihoods 0.693, 2.303, and 0.223 nats. Divide total NLL 3.219 by three scored tokens, then exponentiate average NLL 1.073 to get perplexity 2.92. Compare matched evaluation protocols and evaluate product tasks separately.'

const probabilities = [0.50, 0.10, 0.80]
const losses = probabilities.map(probability => -Math.log(probability))
const total = losses.reduce((sum, loss) => sum + loss, 0)
const mean = total / probabilities.length
const perplexity = Math.exp(mean)

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme)
    const accent = theme === 'dark' ? '#a78bfa' : '#6d28d9'
    const label = (text: string, x: number, y: number, boxWidth: number, size: number,
        color = c.textPrimary, weight = 600) => React.createElement('div', {
        key: text, style: {
            position: 'absolute', left: x, top: y, width: boxWidth,
            display: 'flex', fontSize: size, fontWeight: weight, color,
            fontFamily: 'Inter', lineHeight: 1.15,
        },
    }, text)
    return Scene({
        c, background: c.bg, padding: 48, gap: 0, contentWidth: 1104,
        children: React.createElement('div', {
            style: { position: 'relative', display: 'flex', width: 1104, height: 534 },
        },
        label('Perplexity & Model Evaluation', 0, 0, 1104, 46, c.textPrimary, 750),
        label('Illustrative probabilities assigned to three observed tokens', 0, 72, 1104, 24, c.textSecondary, 500),
        React.createElement('div', { style: { position: 'absolute', left: 0, top: 133, display: 'flex' } },
            BarChart({
                c, width: 660, height: 264, min: 0, max: 3,
                yAxisLabel: 'NLL (nats)', showValues: true, showGrid: true,
                data: probabilities.map((probability, i) => ({
                    label: `p = ${probability.toFixed(2)}`,
                    value: losses[i], valueLabel: losses[i].toFixed(3),
                    color: i === 1 ? 'warning' : 'secondary',
                })),
            })),
        label('AVERAGE NLL', 736, 143, 340, 18, c.textSecondary),
        label(`${total.toFixed(3)} / ${probabilities.length} = ${mean.toFixed(3)}`, 736, 177, 365, 29),
        label('nats per scored token', 736, 220, 365, 20, c.textSecondary, 500),
        label(`PPL ${perplexity.toFixed(2)}`, 736, 278, 365, 64, accent, 750),
        label(`exp(${mean.toFixed(3)})`, 736, 359, 365, 25, c.textSecondary, 500),
        label('Add token losses. Divide by scored-token count. Exponentiate once.', 0, 437, 1104, 23),
        label('Match data, tokenizer, context, and scoring. Evaluate product tasks separately.', 0, 482, 1104, 19, c.textSecondary, 500),
        label('LeetLLM', 974, 518, 130, 22, accent, 700),
        ),
    })
}

export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), {
        width, height, outputPath, theme, scale: 1, crop: false,
        background: 'theme', watermark: false,
    })
    if (result.pixelWidth !== width || result.pixelHeight !== height) {
        throw new Error(`Unexpected banner size: ${result.pixelWidth}x${result.pixelHeight}`)
    }
    return result
}

export default create('dark')
