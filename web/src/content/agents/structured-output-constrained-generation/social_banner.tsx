import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput, type ThemeMode } from 'vizmatic'

const tokens = ['The', '{', 'Sure', 'JSON']
const logits = [0.45, 0.30, 0.15, 0.10]
const peak = Math.max(...logits)
const weights = logits.map(score => Math.exp(score - peak))
const weightTotal = weights.reduce((sum, value) => sum + value, 0)
const before = weights.map(value => value / weightTotal)
const after = tokens.map(token => Number(token === '{'))

// From web/: pnpm exec tsx -e "import { renderBanner } from './src/content/agents/structured-output-constrained-generation/social_banner'; renderBanner('./src/content/agents/structured-output-constrained-generation/social_banner.png')"
export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Structured Output Generation. Aligned zero-to-one probability bars show four candidate token choices before masking and only the opening brace with probability one after masking. LeetLLM.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const chart = (title: string, values: number[]) => React.createElement('div', { style: { display: 'flex', flexDirection: 'column', width: 520, gap: 20 } },
        React.createElement('div', { style: { display: 'flex', fontSize: 27, color: c.textPrimary, fontWeight: 600 } }, title),
        ...tokens.map((token, i) => React.createElement('div', { key: token, style: { display: 'flex', alignItems: 'center', height: 38, gap: 12 } },
            React.createElement('div', { style: { display: 'flex', width: 68, fontSize: 25, color: c.textPrimary, fontFamily: 'JetBrains Mono' } }, token),
            React.createElement('div', { style: { display: 'flex', width: 330, height: 28, background: c.bgCard, borderLeft: `1px solid ${c.textSecondary}` } }, React.createElement('div', { style: { display: 'flex', width: 330 * values[i], height: 28, background: values[i] === 0 ? 'transparent' : token === '{' ? c.positive : c.primary } })),
            React.createElement('div', { style: { display: 'flex', fontSize: 22, color: c.textSecondary } }, `${Math.round(100 * values[i])}%`),
        )),
    )
    return Scene({ c, background: c.bg, padding: 48, gap: 0,
        children: React.createElement('div', { style: { display: 'flex', flexDirection: 'column', width: 1104, height: 534 } },
            React.createElement('div', { style: { display: 'flex', fontSize: 51, fontWeight: 650, color: c.textPrimary } }, 'Structured Output Generation'),
            React.createElement('div', { style: { display: 'flex', fontSize: 26, color: c.textSecondary, marginTop: 18 } }, 'Mask illegal tokens before sampling'),
            React.createElement('div', { style: { display: 'flex', gap: 48, marginTop: 42 } }, chart('Before the mask', before), chart('After the mask', after)),
            React.createElement('div', { style: { display: 'flex', marginTop: 'auto', justifyContent: 'space-between', color: c.textSecondary, fontSize: 20 } },
                React.createElement('div', { style: { display: 'flex' } }, 'Four-token slate · shared 0–100% scale · values need validation'),
                React.createElement('div', { style: { display: 'flex', fontSize: 25, fontWeight: 650, color: c.textPrimary } }, 'LeetLLM'),
            ),
        ),
    })
}
export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), { width, height, outputPath, scale: 1, crop: false, watermark: false, background: 'theme', theme })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Unexpected banner dimensions')
    return result
}
export default create()
