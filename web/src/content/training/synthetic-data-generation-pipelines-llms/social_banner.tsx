import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput, type ThemeMode } from 'vizmatic'

// From web/: pnpm exec tsx -e "import { renderBanner } from './src/content/training/synthetic-data-generation-pipelines-llms/social_banner'; renderBanner('./src/content/training/synthetic-data-generation-pipelines-llms/social_banner.png')"
export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Synthetic Data Pipelines. Three illustrative rows meet checks, novelty, and review gates: the first fails checks, the second fails novelty, and the third passes all three. Unrun gates are skipped. LeetLLM.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const pass = theme === 'dark' ? c.positiveLight : c.positive
    const fail = theme === 'dark' ? c.criticalLight : c.critical
    const muted = c.textSecondary
    const table = [
        ['Candidate', 'Checks', 'Novelty', 'Review'],
        ['A', 'FAIL', 'skip', 'skip'],
        ['B', 'pass', 'FAIL', 'skip'],
        ['C', 'pass', 'pass', 'pass'],
    ]
    return Scene({ c, background: c.bg, padding: 48, gap: 0,
        children: React.createElement('div', { style: { display: 'flex', flexDirection: 'column', width: 1104, height: 534 } },
            React.createElement('div', { style: { display: 'flex', fontSize: 53, fontWeight: 650, color: c.textPrimary } }, 'Synthetic Data Pipelines'),
            React.createElement('div', { style: { display: 'flex', fontSize: 26, marginTop: 18, color: muted } }, 'Review generated data before acceptance'),
            React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 12, marginTop: 32 } }, ...table.map((row, r) => React.createElement('div', { key: r, style: { display: 'flex', gap: 16 } }, ...row.map((label, col) => React.createElement('div', { key: col, style: { display: 'flex', width: 240, height: 60, alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: r === 0 ? 600 : 400, background: r === 0 ? 'transparent' : c.bgCard, color: label === 'pass' ? pass : label === 'FAIL' ? fail : muted, border: r > 0 ? `1px solid ${c.border}` : 'none', borderRadius: 8 } }, label))))),
            React.createElement('div', { style: { display: 'flex', marginTop: 'auto', justifyContent: 'space-between', fontSize: 20, color: muted } },
                React.createElement('div', { style: { display: 'flex' } }, 'Example gate outcomes · review skipped samples'),
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
