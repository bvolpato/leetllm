import React from 'react'
import { GraphDiagram, Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'SLM Specialization and Edge Deployment. Specialize for supported tasks, export and check output parity, then measure the actual device. Model size is one metric; validate task quality, memory fit, sustained speed, and privacy on the target device.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme)
    return Scene({ c, background: c.bg, padding: 48, gap: 30,
        title: 'SLM Specialization & Edge Deployment',
        subtitle: 'A small download is only the beginning.',
        children: React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 30 } },
            GraphDiagram({ c: getThemeColors('light', 'engineering'), width: 1104, height: 280,
                nodeWidth: 290, nodeHeight: 120, labelFontSize: 25, detailFontSize: 18, arrowSize: 6,
                nodes: [
                    { id: 'task', label: 'Specialize', detail: 'sources + held-out tasks', x: 0.05, y: 0.5, tone: 'purple' },
                    { id: 'export', label: 'Export', detail: 'graph + output parity', x: 0.5, y: 0.5, tone: 'cyan' },
                    { id: 'device', label: 'Measure', detail: 'the actual device', x: 0.95, y: 0.5, tone: 'warm' },
                ],
                edges: [{ from: 'task', to: 'export', tone: 'purple' }, { from: 'export', to: 'device', tone: 'purple' }],
            }),
            React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', color: c.textSecondary, fontSize: 23 } },
                React.createElement('span', {}, 'Quality. Memory. Sustained speed. Data paths.'),
                React.createElement('span', { style: { color: c.primary, fontWeight: 700 } }, 'LeetLLM'),
            ),
        ),
    })
}

export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), {
        width, height, outputPath, scale: 1, crop: false, watermark: false,
        background: 'theme', theme,
    })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Unexpected banner size')
    return result
}

export default create('dark')
