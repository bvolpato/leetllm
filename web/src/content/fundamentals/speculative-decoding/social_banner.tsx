import React from 'react'
import { Scene, Grid, getThemeColors, renderToPngWithOutput, type ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Speculative Decoding. Draft A B C; commit A B R after C is rejected and replaced by a residual correction. Propose cheaply, verify together, correct exactly.'
export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const rows = [
        ['Draft', { label: 'A', tone: 'blue' as const }, { label: 'B', tone: 'blue' as const }, { label: 'C', tone: 'critical' as const }],
        ['Commit', { label: 'A', tone: 'green' as const }, { label: 'B', tone: 'green' as const }, { label: 'R', tone: 'warm' as const }],
    ]
    return <Scene c={c} background={c.bg} padding={48} gap={0}>
        <div style={{ display: 'flex', flexDirection: 'column', width: 1104, height: 534 }}>
            <div style={{ display: 'flex', fontSize: 58, fontWeight: 650, color: c.textPrimary }}>Speculative Decoding</div>
            <div style={{ display: 'flex', fontSize: 27, color: c.textSecondary, marginTop: 20 }}>Propose cheaply. Verify together. Correct exactly.</div>
            <div style={{ display: 'flex', marginTop: 42 }}>
                <Grid c={c} rows={rows} headerCols={1} cellWidth={264} cellHeight={86} gap={12} fontSize={34} />
            </div>
            <div style={{ display: 'flex', fontSize: 25, color: c.textSecondary, marginTop: 24 }}>One possible round: reject C, sample correction R from the residual.</div>
            <div style={{ display: 'flex', marginTop: 'auto', justifyContent: 'space-between', fontSize: 22, color: c.textSecondary }}>
                <span>Same target distribution in exact arithmetic</span>
                <span style={{ fontWeight: 650, color: c.textPrimary }}>LeetLLM</span>
            </div>
        </div>
    </Scene>
}
export async function renderBanner(path: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), {
        width, height, outputPath: path, scale: 1, crop: false, watermark: false, background: 'theme', theme,
    })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Wrong banner size')
    return result
}
export default create()
