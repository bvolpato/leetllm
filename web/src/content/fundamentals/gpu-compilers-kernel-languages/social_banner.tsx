import React from 'react'
import { GraphDiagram, Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'GPU Compilers and Kernel Languages. CUDA source compiles to PTX, then target-specific cubin; disassembly exposes SASS for inspection.'
export function create(theme: ThemeMode = 'dark') {
    const c = { ...getThemeColors(theme), shadow: 'transparent' }
    return Scene({ c, background: c.bg, padding: 54, contentWidth: 1092, gap: 0,
        children: React.createElement('div', { style: { display: 'flex', flexDirection: 'column', height: 522 } },
            React.createElement('div', { style: { display: 'flex', fontSize: 52, fontWeight: 750, color: c.textPrimary, lineHeight: 1.13, maxWidth: 1060 } }, 'GPU Compilers and Kernel Languages'),
            React.createElement('div', { style: { display: 'flex', fontSize: 24, color: c.textSecondary, marginTop: 30, marginBottom: 32 } }, 'Separate compilation, executable code, and inspection.'),
            GraphDiagram({ c, width: 1092, height: 230, layout: 'manual', padding: 12,
                nodeWidth: 218, nodeHeight: 140, labelFontSize: 27, detailFontSize: 18, arrowSize: 6,
                nodes: [
                    { id: 'source', label: 'CUDA source', detail: 'SIMT kernel', x: 0.10, y: 0.5, tone: 'blue' },
                    { id: 'ptx', label: 'PTX', detail: 'virtual NVIDIA ISA', x: 0.37, y: 0.5, tone: 'purple' },
                    { id: 'cubin', label: 'cubin', detail: 'native code', x: 0.64, y: 0.5, tone: 'green' },
                    { id: 'sass', label: 'SASS', detail: 'disassembly view', x: 0.90, y: 0.5, tone: 'neutral' },
                ],
                edges: [
                    { from: 'source', to: 'ptx', tone: 'purple' },
                    { from: 'ptx', to: 'cubin', tone: 'green' },
                    { from: 'cubin', to: 'sass', tone: 'neutral' },
                ],
            }),
            React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', marginTop: 'auto', color: c.textSecondary, fontSize: 22 } },
                React.createElement('span', null, 'Artifacts explain what source alone cannot.'),
                React.createElement('span', { style: { color: c.textPrimary, fontWeight: 700 } }, 'LeetLLM')),
        ),
    })
}
export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    return renderToPngWithOutput(create(theme), {
        width, height, outputPath, scale: 1, crop: false, watermark: false, background: 'theme', theme,
    })
}
export default create('dark')
