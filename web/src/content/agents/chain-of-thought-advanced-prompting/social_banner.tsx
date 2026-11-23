import React from 'react'
import { GraphDiagram, Scene, getThemeColors, renderToPngWithOutput, type ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'CoT, ToT & Self-Consistency Prompting. One sequential candidate, several candidates converging into an answer vote, and branching search with a pruned path. Compare accuracy, cost, and latency on the target task.'

export function create(theme: ThemeMode = 'dark') {
  const c = { ...getThemeColors(theme, theme === 'light' ? 'engineering' : 'default'), shadow: 'transparent' }
  const label = (text: string, left: number, top: number, size: number, labelWidth: number, color = c.textPrimary) => React.createElement('div', {
    key: text, style: { display: 'flex', position: 'absolute', left, top, width: labelWidth,
      fontFamily: 'Inter', fontSize: size, fontWeight: 650, letterSpacing: 0.4, color, lineHeight: 1.15 },
  }, text)
  return Scene({
    c, background: c.bg, padding: 48, gap: 0,
    children: React.createElement('div', { style: { display: 'flex', position: 'relative', width: 1104, height: 534 } },
      label('CoT, ToT & Self-Consistency Prompting', 0, 0, 48, 1020),
      label('One candidate', 5, 167, 26, 280, theme === 'light' ? c.primary : c.primaryLight),
      label('Answer vote', 5, 292, 26, 280, theme === 'light' ? '#0e7490' : '#22d3ee'),
      label('Branch search', 5, 411, 26, 280, theme === 'light' ? c.positive : c.positiveLight),
      React.createElement('div', { style: { display: 'flex', position: 'absolute', left: 310, top: 143 } },
        GraphDiagram({
          c, width: 794, height: 310, nodeWidth: 112, nodeHeight: 34, labelFontSize: 17, detailFontSize: 12,
          nodes: [
            { id: 's1', label: 'step', x: 0.01, y: 0.08, tone: 'purple' },
            { id: 's2', label: 'step', x: 0.49, y: 0.08, tone: 'purple' },
            { id: 's3', label: 'answer', x: 0.99, y: 0.08, tone: 'purple' },
            { id: 'v1', label: 'sample', x: 0.01, y: 0.35, tone: 'cyan' },
            { id: 'v2', label: 'sample', x: 0.01, y: 0.50, tone: 'cyan' },
            { id: 'v3', label: 'sample', x: 0.01, y: 0.65, tone: 'cyan' },
            { id: 'vote', label: 'vote', x: 0.99, y: 0.50, tone: 'cyan' },
            { id: 'root', label: 'state', x: 0.01, y: 0.93, tone: 'green' },
            { id: 'keep', label: 'keep', x: 0.49, y: 0.84, tone: 'green' },
            { id: 'prune', label: 'prune', x: 0.49, y: 1.02, tone: 'critical' },
            { id: 'expand', label: 'expand', x: 0.99, y: 0.84, tone: 'green' },
          ],
          edges: [
            { from: 's1', to: 's2', tone: 'purple' }, { from: 's2', to: 's3', tone: 'purple' },
            { from: 'v1', to: 'vote', tone: 'cyan' }, { from: 'v2', to: 'vote', tone: 'cyan' }, { from: 'v3', to: 'vote', tone: 'cyan' },
            { from: 'root', to: 'keep', tone: 'green' }, { from: 'root', to: 'prune', tone: 'critical' }, { from: 'keep', to: 'expand', tone: 'green' },
          ],
        }),
      ),
      label('Compare accuracy, cost, and latency.', 0, 490, 25, 890, c.textSecondary),
      label('LeetLLM', 962, 500, 25, 142, theme === 'light' ? c.primary : c.primaryLight),
    ),
  })
}

export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
  const result = await renderToPngWithOutput(create(theme), {
    width, height, outputPath, scale: 1, crop: false, watermark: false, background: 'theme', theme,
  })
  if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Unexpected banner dimensions')
  return result
}

export default create()
