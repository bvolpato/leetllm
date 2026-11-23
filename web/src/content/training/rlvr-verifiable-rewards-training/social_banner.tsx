import React from 'react'
import { Scene, Grid, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'
export const width = 1200
export const height = 630
export const autoSize = false
export function create(theme: ThemeMode = 'dark') {
    const c = { ...getThemeColors(theme), preset: 'engineering' as const }
    return <Scene c={c} background={c.bg} padding={54} contentWidth={1092}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 30, width: 1092, height: 522, color: c.textPrimary }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, color: c.textSecondary }}><span>TRAINING WITH VERIFIABLE REWARDS</span><span>LeetLLM</span></div>
            <div style={{ display: 'flex', fontSize: 50, fontWeight: 800 }}>The checker defines the reward.</div>
            <div style={{ display: 'flex', fontSize: 26, color: c.textSecondary }}>14 workers × 12 slots. Gold: 168 concurrent jobs.</div>
            <Grid c={c} rows={[
                ['Candidate answer', 'Verifier result', 'Reward'],
                [String.raw`\boxed{168}`, 'One correct field', { label: '1', color: '#142236', backgroundColor: '#b5e7d2' }],
                [String.raw`\boxed{148}`, 'Wrong value', { label: '0', color: '#142236', backgroundColor: '#f7c6c6' }],
                [String.raw`\boxed{168} \boxed{bad}`, 'Ambiguous fields', { label: '0', color: '#142236', backgroundColor: '#f7c6c6' }],
            ]} cellWidth={355} cellHeight={60} gap={5} fontSize={22} headerRows={1} headerCols={0} />
            <div style={{ display: 'flex', fontSize: 24, color: c.textSecondary }}>Evaluate reasoning alongside the verified answer.</div>
        </div>
    </Scene>
}
export async function renderBanner(outputPath: string) {
    const result = await renderToPngWithOutput(create('dark'), { width, height, outputPath, scale: 1, crop: false, watermark: false, background: 'theme', theme: 'dark' })
    if (result.width !== width || result.height !== height) throw new Error('Expected 1200x630')
    return result
}
