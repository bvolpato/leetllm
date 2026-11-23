import React from 'react'
import { Flow, Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'RAG Security & Access Control. An operations analyst in tenant A passes through a trusted ACL gate. Only the incident checklist and escalation rules enter model context; the signing-key runbook stays blocked.'
export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = { ...getThemeColors(theme), preset: 'engineering' as const, shadow: 'transparent' }
    const light = getThemeColors('light', 'engineering')
    const cards = { ...c, textPrimary: light.textPrimary, textSecondary: light.textSecondary, textMuted: light.textSecondary }
    const label = (text: string, top: number, size: number, color = c.textPrimary, right = false) => React.createElement('div', { key: text, style: {
        position: 'absolute', left: 0, top, width: 1092, display: 'flex', justifyContent: right ? 'flex-end' : 'flex-start',
        color, fontFamily: 'Inter', fontSize: size, fontWeight: 650, lineHeight: 1.15,
    } }, text)
    return Scene({ c, background: c.bg, padding: 54, gap: 0, contentWidth: 1092,
        children: React.createElement('div', { style: { position: 'relative', display: 'flex', width: 1092, height: 522 } },
            label('RAG Security &', 0, 55), label('Access Control', 66, 55),
            label('Authorize before retrieving content', 157, 29, c.textSecondary),
            React.createElement('div', { style: { position: 'absolute', left: 0, top: 235, display: 'flex' } },
                Flow({ c: cards, connectorTone: 'green', connectorLength: 32, gap: 12,
                    stages: [
                        { title: 'Operations analyst', subtitle: 'authenticated · tenant A', tone: 'blue', width: 318, minHeight: 140 },
                        { title: 'Trusted ACL gate', subtitle: 'tenant + current grants', tone: 'purple', width: 318, minHeight: 140 },
                        { title: 'Allowed context', subtitle: 'checklist + escalation', tone: 'green', width: 318, minHeight: 140 },
                    ],
                })),
            label('Signing-key runbook: blocked before the model sees it', 415, 23, c.textSecondary),
            label('LeetLLM', 490, 25, c.primaryLight, true),
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
