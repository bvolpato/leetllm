import React from 'react'
import { GraphDiagram, Scene, getThemeColors, renderToPngWithOutput, type ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Mamba & State Space Models. In a scalar example, histories [3, 1] and [1, 2] both produce state 1.25 under h = 0.5 h + 0.5 x. Different histories collapse into the same fixed-size state, so individual past tokens cannot be recovered exactly.'
export function create(theme: ThemeMode = 'dark') {
    const base = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const c = { ...base, shadow: 'transparent' }
    return <Scene c={c} background={c.bg} padding={48} gap={24}>
        <div style={{ display: 'flex', fontSize: 48, fontWeight: 750, color: c.textPrimary }}>Mamba &amp; State Space Models</div>
        <div style={{ display: 'flex', fontSize: 24, color: c.textSecondary }}>A fixed state can merge different histories.</div>
        <GraphDiagram c={{ ...c, preset: 'engineering', textPrimary: '#172033', textMuted: '#334155' }} width={1090} height={290}
            nodeWidth={300} nodeHeight={86} labelFontSize={26} detailFontSize={19} arrowSize={7}
            nodes={[
                { id: 'a', label: 'Inputs [3, 1]', detail: 'first value: 3', x: 0.18, y: 0.23, tone: 'purple' },
                { id: 'b', label: 'Inputs [1, 2]', detail: 'first value: 1', x: 0.18, y: 0.77, tone: 'cyan' },
                { id: 'state', label: 'Same state: 1.25', detail: 'different histories', x: 0.80, y: 0.5, tone: 'green' },
            ]}
            edges={[{ from: 'a', to: 'state', tone: 'purple' }, { from: 'b', to: 'state', tone: 'cyan' }]} />
        <div style={{ display: 'flex', fontSize: 23, color: c.textSecondary }}>Scalar example: h = 0.5 h + 0.5 x, starting from zero</div>
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
