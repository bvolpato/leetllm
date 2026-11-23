import React from 'react'
import { GraphDiagram, Scene, getThemeColors, renderToPngWithOutput, type ThemeMode } from 'vizmatic'
export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Deep Dive - DeepEP. The caller weights expert outputs to 0.70 and 1.20; combine restores source token a with their sum, 1.90.'
export function create(theme: ThemeMode = 'dark') {
    const base = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const c = { ...base, shadow: 'transparent' }
    return <Scene c={c} background={c.bg} padding={48} gap={24}>
        <div style={{ display: 'flex', color: c.textPrimary, fontSize: 50, fontWeight: 750 }}>Deep Dive - DeepEP</div>
        <div style={{ display: 'flex', color: c.textSecondary, fontSize: 26 }}>Preserve source identity. Apply each gate once.</div>
        <GraphDiagram c={{ ...c, preset: 'engineering', textPrimary: '#172033', textMuted: '#334155' }} width={1090} height={300}
            nodeWidth={290} nodeHeight={92} labelFontSize={25} detailFontSize={20}
            nodes={[
                { id: 'e0', label: 'Expert 0: 0.70', detail: 'caller applied gate', x: .18, y: .22, tone: 'purple' },
                { id: 'e3', label: 'Expert 3: 1.20', detail: 'caller applied gate', x: .18, y: .78, tone: 'cyan' },
                { id: 'sum', label: 'Token a: 1.90', detail: 'combine sums', x: .79, y: .5, tone: 'green' },
            ]} edges={[{ from: 'e0', to: 'sum', tone: 'purple' }, { from: 'e3', to: 'sum', tone: 'cyan' }]} />
        <div style={{ display: 'flex', color: theme === 'dark' ? '#a78bfa' : c.primary, fontSize: 25, fontWeight: 700 }}>LeetLLM</div>
    </Scene>
}
export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), { width, height, outputPath, scale: 1, crop: false, watermark: false, background: 'theme', theme })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Unexpected banner dimensions')
    return result
}
export default create('dark')
