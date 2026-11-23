import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

// From web/: pnpm exec tsx -e "import {renderBanner} from './src/content/projects/deep-dive-megatron/social_banner.tsx'; renderBanner('./src/content/projects/deep-dive-megatron/social_banner.png')"
export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Megatron rank groups. In a 64-rank dense mesh with TP4 PP2 CP2 DP4 and TP-fastest PP-last order, rank 3 shares its tensor group with 0,1,2 and its pipeline group with rank 35. Rank IDs describe logical groups, not physical links.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme)
    const purple = theme === 'dark' ? '#c4b5fd' : '#6d28d9'
    const blue = theme === 'dark' ? '#93c5fd' : '#1d4ed8'
    const cell = (rank: number) => React.createElement('div', { key: rank, style: {
        display: 'flex', width: 108, height: 80, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
        color: rank === 3 ? purple : blue, border: `2px solid ${rank === 3 ? purple : blue}`,
        fontSize: 38, fontWeight: 700,
    } }, String(rank))
    const peers = (label: string, ranks: number[]) => React.createElement('div', { style: { display: 'flex', gap: 20, alignItems: 'center', height: 112 } },
        React.createElement('div', { style: { display: 'flex', width: 300, fontSize: 28, color: c.textSecondary } }, label),
        ...ranks.map(cell),
    )
    return Scene({ c, background: c.bg, padding: 54, gap: 0,
        children: React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 24, width: '100%' } },
        React.createElement('div', { style: { display: 'flex', fontSize: 60, fontWeight: 750, color: c.textPrimary } }, 'Megatron: which ranks talk?'),
        React.createElement('div', { style: { display: 'flex', fontSize: 27, color: c.textSecondary, marginBottom: 24 } }, '64 ranks = TP4 × PP2 × CP2 × DP4'),
        peers('Rank 3 · tensor peers', [0, 1, 2, 3]),
        peers('Rank 3 · pipeline peers', [3, 35]),
        React.createElement('div', { style: { display: 'flex', fontSize: 23, color: c.textSecondary, marginTop: 8 } }, 'TP varies fastest. PP varies last. Physical placement still matters.'),
        React.createElement('div', { style: { display: 'flex', justifyContent: 'flex-end', color: purple, fontSize: 25, fontWeight: 700 } }, 'LeetLLM'),
        ),
    })
}
export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), {
        width, height, outputPath, scale: 1, crop: false, watermark: false, background: 'theme', theme,
    })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Unexpected banner dimensions')
    return result
}
export default create('dark')
