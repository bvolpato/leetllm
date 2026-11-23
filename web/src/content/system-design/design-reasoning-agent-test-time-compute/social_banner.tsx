import React from 'react'
import { GraphDiagram, Scene, getThemeColors, renderToPngWithOutput, type ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Reasoning Agent System Design: one budget bounds multiple candidate paths, and an evidence gate chooses an eligible answer or abstains.'
export function create(theme: ThemeMode = 'dark') {
    const base = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const c = { ...base, shadow: 'transparent' }
    return <Scene c={c} background={c.bg} padding={48} gap={24}>
        <div style={{ display: 'flex', color: c.textPrimary, fontSize: 48, fontWeight: 750 }}>Reasoning Agent System Design</div>
        <div style={{ display: 'flex', color: c.textSecondary, fontSize: 25 }}>More candidates still need evidence and a shared budget.</div>
        <GraphDiagram c={{ ...c, preset: 'engineering', textPrimary: '#172033', textMuted: '#334155' }} width={1090} height={300}
            nodeWidth={230} nodeHeight={78} labelFontSize={23} detailFontSize={18}
            nodes={[
                { id: 'budget', label: 'One budget', x: .13, y: .5, tone: 'purple' },
                { id: 'a', label: 'Candidate A', x: .43, y: .18, tone: 'blue' },
                { id: 'b', label: 'Candidate B', x: .43, y: .82, tone: 'cyan' },
                { id: 'gate', label: 'Evidence gate', detail: 'eligible or abstain', x: .84, y: .5, tone: 'green' },
            ]} edges={[
                { from: 'budget', to: 'a', tone: 'purple' }, { from: 'budget', to: 'b', tone: 'purple' },
                { from: 'a', to: 'gate', tone: 'blue' }, { from: 'b', to: 'gate', tone: 'cyan' },
            ]} />
        <div style={{ display: 'flex', fontSize: 25, fontWeight: 700, color: theme === 'dark' ? '#a78bfa' : c.primary }}>LeetLLM</div>
    </Scene>
}
export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), {
        width, height, outputPath, scale: 1, crop: false, watermark: false, background: 'theme', theme,
    })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Unexpected banner dimensions')
    return result
}
export default create('dark')
