import React from 'react'
import { GraphDiagram, Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'GPU Serving and Autoscaling. Fifty requests at five active requests per replica call for ten replicas, but only four are ready. Requested capacity cannot serve traffic until loading and readiness finish.'
export function create(theme: ThemeMode = 'dark') {
    const c = { ...getThemeColors(theme), shadow: 'transparent' }
    return Scene({ c, background: c.bg, padding: 54, contentWidth: 1092, gap: 0,
        children: React.createElement('div', { style: { display: 'flex', flexDirection: 'column', height: 522 } },
            React.createElement('div', { style: { display: 'flex', fontSize: 54, fontWeight: 750, color: c.textPrimary, lineHeight: 1.13 } }, 'GPU Serving & Autoscaling'),
            React.createElement('div', { style: { display: 'flex', fontSize: 28, color: c.textSecondary, marginTop: 30, marginBottom: 28 } }, 'Requested capacity is not ready capacity.'),
            GraphDiagram({ c, width: 1092, height: 245, layout: 'manual', padding: 12,
                nodeWidth: 270, nodeHeight: 150, labelFontSize: 31, detailFontSize: 22, arrowSize: 7,
                nodes: [
                    { id: 'demand', label: '50 requests', detail: 'waiting + running', x: 0.13, y: 0.5, tone: 'blue' },
                    { id: 'target', label: '10 requested', detail: '5 active per replica', x: 0.5, y: 0.5, tone: 'purple' },
                    { id: 'ready', label: '4 ready', detail: '6 still unavailable', x: 0.87, y: 0.5, tone: 'warm' },
                ],
                edges: [{ from: 'demand', to: 'target' }, { from: 'target', to: 'ready' }],
            }),
            React.createElement('div', { style: { display: 'flex', fontSize: 24, color: c.textSecondary, marginTop: 18 } }, 'Bound the queue while nodes and models load.'),
            React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', marginTop: 'auto', color: c.textSecondary, fontSize: 20 } },
                React.createElement('span', null, 'Example capacity scenario'),
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
