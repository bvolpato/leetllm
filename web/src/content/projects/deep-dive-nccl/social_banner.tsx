import React from 'react'
import { GraphDiagram, Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Deep Dive - NCCL. Four input vectors reduce to one shard per rank, then all-gather reconstructs the summed vector on every rank.'
export function create(theme: ThemeMode = 'dark') {
    const c = { ...getThemeColors(theme), shadow: 'transparent' }
    return <Scene c={c} background={c.bg} padding={54} contentWidth={1092} gap={0}>
        <div style={{ display: 'flex', flexDirection: 'column', height: 522 }}>
            <div style={{ display: 'flex', fontSize: 56, fontWeight: 750, color: c.textPrimary }}>Deep Dive - NCCL</div>
            <div style={{ display: 'flex', fontSize: 27, color: c.textSecondary, marginTop: 26, marginBottom: 26 }}>Follow the bytes. Check ownership. Respect stream dependencies.</div>
            <GraphDiagram c={c} width={1092} height={245} layout="manual" padding={12}
                nodeWidth={272} nodeHeight={150} labelFontSize={27} detailFontSize={21} arrowSize={7}
                nodes={[
                    { id: 'input', label: '4 input vectors', detail: 'Each rank contributes its local values', x: 0.13, y: 0.5, tone: 'blue' },
                    { id: 'shards', label: 'Reduce-scatter', detail: 'Rank 2 owns 3333 for chunk 2', x: 0.5, y: 0.5, tone: 'purple' },
                    { id: 'output', label: 'All-gather', detail: 'Every rank gets the full reduced vector', x: 0.87, y: 0.5, tone: 'green' },
                ]} edges={[{ from: 'input', to: 'shards' }, { from: 'shards', to: 'output' }]} />
            <div style={{ display: 'flex', fontSize: 24, color: c.textSecondary, marginTop: 16 }}>One all-reduce decomposition. Actual routes depend on topology.</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto', color: c.textSecondary, fontSize: 20 }}>
                <span>Collective contracts · rings and trees · bandwidth accounting</span><span>LeetLLM</span>
            </div>
        </div>
    </Scene>
}
export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    return renderToPngWithOutput(create(theme), { width, height, outputPath, scale: 1, crop: false, watermark: false, background: 'theme', theme })
}
export default create('dark')
