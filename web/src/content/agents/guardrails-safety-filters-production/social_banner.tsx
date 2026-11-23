import React from 'react'
import { GraphDiagram, Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Guardrails and Safety Filters. A model draft branches into reviewed text and independently authorized tools. An unsigned production deploy is held before execution.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme)
    const graphColors = getThemeColors('light', 'engineering')
    return Scene({ c, background: c.bg, padding: 48, gap: 24,
        title: 'Guardrails & Safety Filters',
        subtitle: 'Review the words. Authorize the action.',
        children: React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 24 } },
            GraphDiagram({ c: graphColors, width: 1104, height: 330,
                nodeWidth: 210, nodeHeight: 80, labelFontSize: 20, detailFontSize: 15, arrowSize: 5,
                nodes: [
                    { id: 'draft', label: 'Model draft', detail: 'requires host authorization', x: 0.08, y: 0.5, tone: 'purple' },
                    { id: 'text', label: 'Text review', detail: 'before release', x: 0.52, y: 0.15, tone: 'cyan' },
                    { id: 'tool', label: 'Tool policy', detail: 'identity + scope', x: 0.52, y: 0.85, tone: 'warm' },
                    { id: 'release', label: 'Release / hold', detail: 'checked response', x: 0.94, y: 0.15, tone: 'green' },
                    { id: 'pause', label: 'Deploy held', detail: 'approval missing', x: 0.94, y: 0.85, tone: 'critical' },
                ],
                edges: [
                    { from: 'draft', to: 'text', tone: 'cyan' },
                    { from: 'draft', to: 'tool', tone: 'warm' },
                    { from: 'text', to: 'release', tone: 'green' },
                    { from: 'tool', to: 'pause', tone: 'critical' },
                ],
            }),
            React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', color: c.textSecondary, fontSize: 23 } },
                React.createElement('span', {}, 'The host authorizes each deployment.'),
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
