import React from 'react'
import { Scene, Grid, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Deep Dive - SkyRL. A long rollout spans consumption steps 1 through 4 while short groups train. A scheduling lag of 3 can exceed budget 2 even when queue admission is valid.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    return <Scene c={c} background={c.bg} padding={54} gap={28} contentWidth={1092}>
        <div style={{ display: 'flex', fontSize: 54, fontWeight: 750, letterSpacing: 0.5, color: c.textPrimary }}>Deep Dive - SkyRL</div>
        <div style={{ display: 'flex', fontSize: 27, color: c.textSecondary }}>The queue is bounded. The long rollout is still old.</div>
        <Grid c={c} cellWidth={202} cellHeight={62} gap={8} fontSize={22} headerRows={1} headerCols={1} rows={[
            ['trainer step', '1', '2', '3', '4'],
            ['long rollout', 'running', 'running', 'running', { label: 'consumed', tone: 'warm' }],
            ['group trained', 'A', 'B', 'C', 'long rollout'],
        ]} />
        <div style={{ display: 'flex', fontSize: 31, color: c.textPrimary }}>Scheduling lag: 4 − 1 = 3 steps</div>
        <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-end', fontSize: 25, color: c.textSecondary }}>LeetLLM</div>
    </Scene>
}
export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), {
        width, height, outputPath, scale: 1, crop: false, watermark: false,
        background: 'theme', theme,
    })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Unexpected banner dimensions')
    return result
}
export default create()
