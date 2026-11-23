import React from 'react'
import { GraphDiagram, Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Content Moderation System. A pending chat message can publish after a validated decision before its deadline. A deadline instead moves it to held or suppressed. A late allow recommendation is ignored and cannot silently publish the closed message.'
export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const ink = getThemeColors('light', 'engineering')
    const diagramColors = theme === 'light' ? { ...c, textPrimary: ink.textPrimary, textMuted: ink.textSecondary } : c
    const text = (label: string, top: number, size: number, color = c.textPrimary, left = 0, boxWidth = 1092) =>
        React.createElement('div', { key: label, style: { position: 'absolute', display: 'flex',
            left, top, width: boxWidth, fontFamily: 'Inter', fontSize: size, fontWeight: 650, color, lineHeight: 1.15 } }, label)
    return Scene({ c, background: c.bg, padding: 54, contentWidth: 1092, gap: 0,
        children: React.createElement('div', { style: { position: 'relative', display: 'flex', width: 1092, height: 522 } },
            text('Content Moderation System', 0, 49),
            text('A late answer must not silently publish a timed-out message.', 73, 23, c.textSecondary),
            React.createElement('div', { style: { position: 'absolute', display: 'flex', left: 0, top: 163 } },
                GraphDiagram({ c: diagramColors, width: 1092, height: 290, nodeWidth: 260, nodeHeight: 84,
                    labelFontSize: 23, detailFontSize: 17, arrowSize: 5,
                    nodes: [
                        { id: 'pending', label: 'PENDING', detail: 'chat send decision', x: 0.02, y: 0.02, tone: 'blue' },
                        { id: 'published', label: 'PUBLISHED', detail: 'current revision only', x: 0.98, y: 0.02, tone: 'green' },
                        { id: 'held', label: 'HELD / SUPPRESSED', detail: 'closed send attempt', x: 0.02, y: 0.98, tone: 'warm' },
                        { id: 'late', label: 'Late ALLOW', detail: 'worker recommendation', x: 0.98, y: 0.98, tone: 'purple' },
                    ],
                    edges: [
                        { from: 'pending', to: 'published', label: 'validated before deadline', tone: 'green' },
                        { from: 'pending', to: 'held', label: 'deadline', tone: 'warm' },
                        { from: 'late', to: 'held', label: 'ignored: state already closed', tone: 'critical', style: 'dashed', arrow: 'none' },
                    ],
                })),
            text('Trusted state transitions, not model permission.', 490, 20, c.textSecondary, 0, 860),
            text('LeetLLM', 486, 25, c.primary, 942, 150),
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
export default create('dark')
